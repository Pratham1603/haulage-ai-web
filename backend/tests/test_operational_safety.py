import asyncio

import pytest
from fastapi import HTTPException

from backend import server
from backend.server import AssignmentRequest, StatusUpdate, VoiceTaskCreate, create_assignment, create_voice_task, require_roles, update_assignment_status, update_load_status
from backend.voice import VoiceTaskManager, VoiceTaskState


class Result:
    def __init__(self, modified_count):
        self.modified_count = modified_count


class FakeCollection:
    def __init__(self, documents=None):
        self.documents = documents or []

    async def find_one(self, query, projection=None):
        for document in self.documents:
            if self._matches(document, query):
                return {key: value for key, value in document.items() if not projection or projection.get(key, 1) != 0}
        return None

    async def insert_one(self, document):
        self.documents.append(dict(document))

    async def update_one(self, query, update, upsert=False):
        for document in self.documents:
            if self._matches(document, query):
                document.update(update.get("$set", {}))
                for field, values in update.get("$addToSet", {}).items():
                    document.setdefault(field, [])
                    if values not in document[field]:
                        document[field].append(values)
                return Result(1)
        if upsert:
            document = dict(query)
            document.update(update.get("$set", {}))
            document.update(update.get("$setOnInsert", {}))
            self.documents.append(document)
            return Result(1)
        return Result(0)

    @staticmethod
    def _matches(document, query):
        if "$and" in query:
            return all(FakeCollection._matches(document, part) for part in query["$and"])
        if "$or" in query:
            return any(FakeCollection._matches(document, part) for part in query["$or"])
        for key, expected in query.items():
            actual = document.get(key)
            if isinstance(expected, dict) and "$ne" in expected:
                if actual == expected["$ne"]:
                    return False
            elif actual != expected:
                return False
        return True


class FakeDatabase:
    def __init__(self):
        self.loads = FakeCollection([{"id": "load-1", "vehicle_type": "32ft", "weight_kg": 10000, "pallets": 18}])
        self.vehicles = FakeCollection([{"id": "truck-1", "vehicle_id": "truck-1", "vehicle_type": "32ft", "available_payload_kg": 12000, "available_pallets": 22, "available": True}])
        self.assignments = FakeCollection()
        self.audit_events = FakeCollection()
        self.voice_tasks = FakeCollection()


def test_protected_route_rejects_missing_or_wrong_token():
    server.dev_api_token = "local-test-token"
    authorize = require_roles("dispatcher")
    with pytest.raises(HTTPException) as missing:
        asyncio.run(authorize(None))
    assert missing.value.status_code == 401
    with pytest.raises(HTTPException) as wrong:
        asyncio.run(authorize("Bearer wrong-token"))
    assert wrong.value.status_code == 401


def test_voice_task_can_restore_persisted_state():
    manager = VoiceTaskManager()
    task = manager.restore({
        "task_id": "task-1",
        "kind": "driver_status",
        "entity_id": "load-1",
        "state": "completed",
        "result": {"status": "delayed"},
        "event_ids": ["event-1"],
    })
    assert task.state == VoiceTaskState.completed
    assert manager.callback("task-1", "event-1", VoiceTaskState.failed).state == VoiceTaskState.completed


def test_assignment_claims_vehicle_once_and_blocks_second_booking(monkeypatch):
    fake_db = FakeDatabase()
    monkeypatch.setattr(server, "db", fake_db)
    request = AssignmentRequest(load_id="load-1", vehicle_id="truck-1", requested_rate=75000, idempotency_key="assignment-1")
    first = asyncio.run(create_assignment(request, "dispatcher"))
    assert first["status"] == "confirmed"
    second_request = request.model_copy(update={"idempotency_key": "assignment-2"})
    with pytest.raises(HTTPException) as duplicate_vehicle:
        asyncio.run(create_assignment(second_request, "dispatcher"))
    assert duplicate_vehicle.value.status_code == 409
    assert fake_db.vehicles.documents[0]["assigned"] is True
    assert fake_db.vehicles.documents[0]["available"] is False


def test_load_status_records_timestamp_and_assignment_releases_vehicle(monkeypatch):
    fake_db = FakeDatabase()
    monkeypatch.setattr(server, "db", fake_db)
    request = AssignmentRequest(load_id="load-1", vehicle_id="truck-1", requested_rate=75000, idempotency_key="assignment-status-1")
    assignment = asyncio.run(create_assignment(request, "dispatcher"))

    load = asyncio.run(update_load_status("load-1", StatusUpdate(status="in_transit"), "dispatcher"))
    assert load["status"] == "in_transit"
    assert "in_transit" in load["status_timestamps"]

    delivered = asyncio.run(update_assignment_status(assignment["id"], StatusUpdate(status="delivered"), "dispatcher"))
    assert delivered["status"] == "delivered"
    assert delivered["lifecycle_timestamps"]["delivered"]
    assert fake_db.vehicles.documents[0]["assigned"] is False
    assert fake_db.vehicles.documents[0]["available"] is True


def test_voice_provider_metadata_is_kept_in_task_result():
    manager = VoiceTaskManager()
    task = manager.create("driver_status", "load-1")
    manager.start(task.task_id)
    assert task.provider_call_id == f"mock-{task.task_id}"
    assert task.result["provider"] == "mock"


def test_voice_task_creation_persists_without_audit_argument_collision(monkeypatch):
    fake_db = FakeDatabase()
    monkeypatch.setattr(server, "db", fake_db)
    task = asyncio.run(create_voice_task(
        VoiceTaskCreate(kind="driver_status", entity_id="load-1", idempotency_key="voice-1"),
        "dispatcher",
    ))
    assert task["state"] == "queued"
    assert fake_db.voice_tasks.documents[0]["entity_id"] == "load-1"