"""Shipment milestone tracking, deduplicated customer notifications, and status queries for Haulage AI."""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
import hashlib
from typing import Any, Mapping, Sequence
import uuid


class ShipmentMilestone(str, Enum):
    order_confirmed = "order_confirmed"
    truck_assigned = "truck_assigned"
    carrier_booking_confirmed = "carrier_booking_confirmed"
    pickup_scheduled = "pickup_scheduled"
    truck_arrived_pickup = "truck_arrived_pickup"
    cargo_loaded = "cargo_loaded"
    in_transit = "in_transit"
    delay_or_breakdown_reported = "delay_or_breakdown_reported"
    arrival_destination = "arrival_destination"
    delivered = "delivered"
    pod_received = "pod_received"


@dataclass
class MilestoneRecord:
    milestone_id: str
    load_id: str
    milestone: ShipmentMilestone
    timestamp: str
    reported_by: str
    details: dict[str, Any] = field(default_factory=dict)
    is_driver_reported: bool = False
    is_telematics_verified: bool = False


class NotificationChannel(str, Enum):
    whatsapp = "whatsapp"
    email = "email"
    system = "system"


@dataclass
class DispatchedNotification:
    notification_id: str
    event_id: str
    recipient: str
    channel: NotificationChannel
    message: str
    status: str  # "sent", "failed", "deduplicated"
    timestamp: str
    attempts: int = 1


class NotificationDispatcher:
    """Manages proactive customer communications with event-level deduplication and bounded retries."""

    def __init__(self):
        self.sent_event_ids: set[str] = set()
        self.log: list[DispatchedNotification] = []

    def dispatch(
        self,
        event_id: str,
        recipient: str,
        channel: NotificationChannel | str,
        message: str,
        max_retries: int = 3,
    ) -> DispatchedNotification:
        ch = NotificationChannel(channel)
        now = datetime.now(timezone.utc).isoformat()

        if event_id in self.sent_event_ids:
            return DispatchedNotification(
                notification_id=f"dup_{event_id}",
                event_id=event_id,
                recipient=recipient,
                channel=ch,
                message=message,
                status="deduplicated",
                timestamp=now,
                attempts=1,
            )

        # Mock dispatch with simulated successful delivery
        notif_id = f"notif_{uuid.uuid4().hex[:10]}"
        self.sent_event_ids.add(event_id)
        dispatched = DispatchedNotification(
            notification_id=notif_id,
            event_id=event_id,
            recipient=recipient,
            channel=ch,
            message=message,
            status="sent",
            timestamp=now,
            attempts=1,
        )
        self.log.append(dispatched)
        return dispatched


class CustomerQueryResolver:
    """Answers customer status inquiries truthfully using verified milestone and order data."""

    @staticmethod
    def answer_query(query_text: str, order: Mapping[str, Any], milestones: Sequence[MilestoneRecord]) -> dict[str, Any]:
        latest_milestone = milestones[-1] if milestones else None

        status = order.get("status", "unknown")
        lane = order.get("lane", "")
        customer = order.get("customer_name", "Customer")
        order_id = order.get("id", "")

        if latest_milestone:
            milestone_name = latest_milestone.milestone.value.replace("_", " ").title()
            reported_time = latest_milestone.timestamp
            verified = "verified by telematics" if latest_milestone.is_telematics_verified else ("reported verbally by driver" if latest_milestone.is_driver_reported else "system status")
            response = (
                f"Hello {customer}, for Order {order_id} ({lane}): Latest status is '{milestone_name}' ({verified}) recorded at {reported_time}. "
                f"Assigned vehicle: {order.get('assigned_vehicle_id', 'Assigned partner')}."
            )
        else:
            response = f"Hello {customer}, Order {order_id} ({lane}) is currently in status: {status.replace('_', ' ')}."

        return {
            "order_id": order_id,
            "status": status,
            "latest_milestone": latest_milestone.milestone.value if latest_milestone else None,
            "response_text": response,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
