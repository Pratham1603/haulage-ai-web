from backend.matching import propose_spare_capacity, rank_candidates
from backend.voice import VoiceTaskManager, VoiceTaskState


def test_matching_rejects_hard_constraint_before_ranking():
    load = {"vehicle_type": "32ft", "weight_kg": 10000, "pallets": 18}
    vehicles = [
        {"vehicle_id": "too-small", "vehicle_type": "24ft", "available_payload_kg": 20000, "available_pallets": 22},
        {"vehicle_id": "feasible", "vehicle_type": "32ft", "available_payload_kg": 12000, "available_pallets": 22, "quoted_rate": 75000},
    ]
    result = rank_candidates(load, vehicles)
    assert [item["vehicle_id"] for item in result] == ["feasible"]


def test_spare_capacity_reports_contribution():
    proposals = propose_spare_capacity(
        {"weight_kg": 10000, "pallets": 18},
        [{"load_id": "LD-202", "weight_kg": 1500, "pallets": 4, "revenue": 31000, "incremental_operating_cost": 9200}],
        {"available_payload_kg": 12000, "available_pallets": 22},
    )
    assert proposals[0]["incremental_contribution"] == 21800


def test_voice_callbacks_are_idempotent():
    manager = VoiceTaskManager()
    task = manager.create("driver_status", "LR-8839", "request-1")
    manager.start(task.task_id)
    manager.callback(task.task_id, "event-1", VoiceTaskState.completed, {"status": "delayed"})
    manager.callback(task.task_id, "event-1", VoiceTaskState.failed)
    assert task.state == VoiceTaskState.completed
    assert task.result["status"] == "delayed"