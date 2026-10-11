"""Voice task lifecycle and mock provider used when telephony credentials are absent."""
from dataclasses import dataclass, field
from enum import Enum
from typing import Any
import uuid
import requests


class VoiceTaskState(str, Enum):
    queued = "queued"
    calling = "calling"
    collecting = "collecting"
    completed = "completed"
    escalated = "escalated"
    failed = "failed"


@dataclass
class VoiceTask:
    task_id: str
    kind: str
    entity_id: str
    state: VoiceTaskState = VoiceTaskState.queued
    result: dict[str, Any] = field(default_factory=dict)
    event_ids: set[str] = field(default_factory=set)
    provider_call_id: str | None = None


class MockVoiceProvider:
    name = "mock"

    def start_call(self, task: VoiceTask) -> dict[str, str]:
        return {"provider": self.name, "provider_call_id": f"mock-{task.task_id}"}


class ElevenLabsSpeechProvider:
    """ElevenLabs text-to-speech adapter; telephony is intentionally separate."""

    name = "elevenlabs"

    def __init__(self, api_key: str, voice_id: str, model_id: str = "eleven_multilingual_v2"):
        self.api_key = api_key
        self.voice_id = voice_id
        self.model_id = model_id

    def synthesize(self, text: str) -> bytes:
        response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{self.voice_id}",
            headers={"xi-api-key": self.api_key, "Accept": "audio/mpeg"},
            json={"text": text, "model_id": self.model_id},
            timeout=30,
        )
        response.raise_for_status()
        return response.content


class VoiceTaskManager:
    def __init__(self, provider: MockVoiceProvider | None = None):
        self.provider = provider or MockVoiceProvider()
        self.tasks: dict[str, VoiceTask] = {}

    def create(self, kind: str, entity_id: str, idempotency_key: str | None = None) -> VoiceTask:
        if idempotency_key and idempotency_key in self.tasks:
            return self.tasks[idempotency_key]
        task = VoiceTask(task_id=str(uuid.uuid4()), kind=kind, entity_id=entity_id)
        self.tasks[idempotency_key or task.task_id] = task
        return task

    def restore(self, document: dict[str, Any]) -> VoiceTask:
        task = VoiceTask(
            task_id=document["task_id"],
            kind=document["kind"],
            entity_id=document["entity_id"],
            state=VoiceTaskState(document.get("state", VoiceTaskState.queued)),
            result=document.get("result", {}),
            event_ids=set(document.get("event_ids", [])),
            provider_call_id=document.get("provider_call_id"),
        )
        self.tasks[document.get("idempotency_key") or task.task_id] = task
        return task

    def start(self, task_id: str) -> VoiceTask:
        task = self._get(task_id)
        if task.state == VoiceTaskState.queued:
            call = self.provider.start_call(task)
            task.provider_call_id = call.get("provider_call_id")
            task.result.update(call)
            task.state = VoiceTaskState.calling
        return task

    def callback(self, task_id: str, event_id: str, state: VoiceTaskState, result: dict[str, Any] | None = None) -> VoiceTask:
        task = self._get(task_id)
        if event_id in task.event_ids:
            return task
        task.event_ids.add(event_id)
        task.state = state
        if result:
            task.result.update(result)
        return task

    def _get(self, task_id: str) -> VoiceTask:
        task = next((item for item in self.tasks.values() if item.task_id == task_id), None)
        if task is None:
            raise KeyError(task_id)
        return task