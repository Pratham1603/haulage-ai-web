"""Unified Operational Exception Queue for Haulage AI."""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Mapping, Sequence
import uuid


class ExceptionCategory(str, Enum):
    failed_order_extraction = "failed_order_extraction"
    missing_mandatory_info = "missing_mandatory_info"
    uncertain_customer_resolution = "uncertain_customer_resolution"
    conflicting_data = "conflicting_data"
    no_feasible_trucks = "no_feasible_trucks"
    rate_above_ceiling = "rate_above_ceiling"
    voice_call_failed = "voice_call_failed"
    shipment_delay_or_breakdown = "shipment_delay_or_breakdown"
    unreachable_driver = "unreachable_driver"
    amendment_invalidated_truck = "amendment_invalidated_truck"
    notification_failed = "notification_failed"


@dataclass
class ExceptionOption:
    id: str
    label: str
    cost: str
    sla: str
    note: str
    recommended: bool = False


@dataclass
class OperationalException:
    id: str
    category: ExceptionCategory
    title: str
    problem: str
    tried: str
    severity: str
    tag: str  # "human", "approval", "ai"
    kind: str  # "options", "simple", "link"
    related_entity_id: str
    status: str = "open"  # "open", "resolved", "escalated"
    selected: str | None = None
    options: list[dict[str, Any]] = field(default_factory=list)
    resolved_note: str | None = None
    created_at: str = ""
    updated_at: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "category": self.category.value,
            "title": self.title,
            "problem": self.problem,
            "tried": self.tried,
            "severity": self.severity,
            "tag": self.tag,
            "kind": self.kind,
            "related_entity_id": self.related_entity_id,
            "status": self.status,
            "selected": self.selected,
            "options": self.options,
            "resolved_note": self.resolved_note,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class ExceptionManager:
    """Creates, queries, and resolves operational exceptions across all modules."""

    def __init__(self):
        self.exceptions: dict[str, OperationalException] = {}
        self._seed_default_exceptions()

    def _seed_default_exceptions(self):
        now = datetime.now(timezone.utc).isoformat()
        # Mirror core operational story in seed
        ex_breakdown = OperationalException(
            id="breakdown",
            category=ExceptionCategory.shipment_delay_or_breakdown,
            title="Breakdown near Beawar — LR-8839 at risk",
            problem="Truck MH-04-XX-1234 broke down near Beawar on the Bhiwandi to Narela trip. The 8-10 AM delivery slot at Gupta Trading Co. is at risk.",
            tried="Voice AI reached Ramesh (Hindi) at 09:38. Solver generated 3 re-plan options below.",
            severity="high",
            tag="human",
            kind="options",
            related_entity_id="LR-8839",
            selected="B",
            options=[
                {"id": "A", "label": "Wait for repair", "cost": "Rs 0 extra", "sla": "Misses the 8-10 AM slot", "note": "Cheapest"},
                {"id": "B", "label": "Transship to partner truck 45 km away", "cost": "+Rs 9,000", "sla": "Slot saved; avoids Rs 15,000 penalty", "note": "Recommended", "recommended": True},
                {"id": "C", "label": "Split load across two trucks", "cost": "+Rs 21,000", "sla": "Slot saved", "note": "Highest cost"},
            ],
            created_at=now,
            updated_at=now,
        )
        ex_rate = OperationalException(
            id="rate",
            category=ExceptionCategory.rate_above_ceiling,
            title="Rate above benchmark needs approval",
            problem="Hasmukhbhai's truck for LD-201 closed at Rs 74,500. Benchmark for Mumbai to Delhi is Rs 78,000 — under benchmark, but policy requires a tap.",
            tried="Voice AI negotiated down from Rs 82,000 across 3 turns in Gujarati.",
            severity="medium",
            tag="approval",
            kind="simple",
            related_entity_id="LD-201",
            created_at=now,
            updated_at=now,
        )
        self.exceptions[ex_breakdown.id] = ex_breakdown
        self.exceptions[ex_rate.id] = ex_rate

    def create_exception(
        self,
        category: ExceptionCategory | str,
        title: str,
        problem: str,
        tried: str,
        related_entity_id: str,
        severity: str = "medium",
        kind: str = "simple",
        options: Sequence[dict[str, Any]] | None = None,
        tag: str = "human",
    ) -> OperationalException:
        ex_id = f"ex_{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc).isoformat()
        ex = OperationalException(
            id=ex_id,
            category=ExceptionCategory(category),
            title=title,
            problem=problem,
            tried=tried,
            severity=severity,
            tag=tag,
            kind=kind,
            related_entity_id=related_entity_id,
            options=list(options or []),
            created_at=now,
            updated_at=now,
        )
        self.exceptions[ex_id] = ex
        return ex

    def resolve(self, ex_id: str, action: str, resolution_note: str, selected_option: str | None = None) -> OperationalException:
        if ex_id not in self.exceptions:
            raise KeyError(f"Exception {ex_id} not found")
        ex = self.exceptions[ex_id]
        now = datetime.now(timezone.utc).isoformat()
        ex.status = "resolved" if action in {"approve", "viewed"} else ("escalated" if action == "takeover" else "open")
        ex.tag = "ai" if action == "approve" else ("human" if action == "takeover" else "approval")
        ex.resolved_note = resolution_note
        if selected_option:
            ex.selected = selected_option
        ex.updated_at = now
        return ex

    def list_open(self) -> list[OperationalException]:
        return [ex for ex in self.exceptions.values() if ex.status != "resolved"]
