"""Multi-channel message ingestion and intent classification for Haulage AI Module 1."""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
import hashlib
import re
from typing import Any, Mapping, Sequence
import uuid


class IngestionChannel(str, Enum):
    email = "email"
    whatsapp = "whatsapp"
    excel = "excel"
    csv = "csv"
    pdf = "pdf"
    image = "image"
    manual = "manual"


class OrderIntent(str, Enum):
    new_order = "new_order"
    order_amendment = "order_amendment"
    order_cancellation = "order_cancellation"
    status_query = "status_query"
    rate_request = "rate_request"
    document_submission = "document_submission"
    noise_or_unknown = "noise_or_unknown"


@dataclass
class IngestedAttachment:
    filename: str
    content_type: str
    content_bytes: bytes = field(repr=False)
    content_hash: str = ""
    parsed_text: str = ""

    def __post_init__(self):
        if not self.content_hash and self.content_bytes:
            self.content_hash = hashlib.sha256(self.content_bytes).hexdigest()


@dataclass
class IngestedMessage:
    message_id: str
    channel: IngestionChannel
    sender: str
    subject: str
    body_text: str
    timestamp: str
    content_hash: str
    intent: OrderIntent
    intent_confidence: float
    attachments: list[dict[str, Any]] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
    is_duplicate: bool = False


class IntentClassifier:
    """Deterministic, explainable intent classification for logistics communications."""

    AMENDMENT_PATTERNS = [
        re.compile(r"\b(amend|update|change|revised|modify|reschedule)\b", re.IGNORECASE),
        re.compile(r"\b(change\s+(date|weight|destination|vehicle|destination|pallets))\b", re.IGNORECASE),
        re.compile(r"\b(update\s+order|revise\s+order)\b", re.IGNORECASE),
    ]

    CANCELLATION_PATTERNS = [
        re.compile(r"\b(cancel|cancellation|abort|recall\s+load|drop\s+order)\b", re.IGNORECASE),
        re.compile(r"\b(cancel\s+(the\s+)?(order|booking|load|lr|shipment))\b", re.IGNORECASE),
    ]

    STATUS_PATTERNS = [
        re.compile(r"\b(where\s+is|track|status|eta|current\s+location|kahan\s+(hai|pahunchi))\b", re.IGNORECASE),
        re.compile(r"\b(delivery\s+status|reached|transit\s+update|milestone)\b", re.IGNORECASE),
        re.compile(r"\b(pod\s+copy|proof\s+of\s+delivery\s+copy)\b", re.IGNORECASE),
    ]

    RATE_PATTERNS = [
        re.compile(r"\b(quote|rate|price|tariff|charges|bhaada|freight\s+rate|cost\s+for)\b", re.IGNORECASE),
        re.compile(r"\b(what\s+is\s+the\s+rate|rate\s+inquiry|inquire\s+rate)\b", re.IGNORECASE),
    ]

    DOCUMENT_PATTERNS = [
        re.compile(r"\b(attached\s+pod|signed\s+lr|eway\s+bill|e-way|ewaybill|bilty|bilty\s+attached)\b", re.IGNORECASE),
        re.compile(r"\b(find\s+attached\s+(invoice|bill|pod))\b", re.IGNORECASE),
    ]

    NEW_ORDER_PATTERNS = [
        re.compile(r"\b(book|load|pallets?|truck|dispatch|pickup|delivery|shipment|indent|po\s*[-#]?\d+)\b", re.IGNORECASE),
        re.compile(r"\b(please\s+(book|arrange|place|dispatch|send\s+truck))\b", re.IGNORECASE),
        re.compile(r"\b(purchase\s+order|dispatch\s+order|loading\s+advice)\b", re.IGNORECASE),
    ]

    @classmethod
    def classify(cls, subject: str, text: str, attachments: Sequence[Any] = ()) -> tuple[OrderIntent, float, str]:
        combined = f"{subject} {text}".strip()
        lower = combined.lower()

        # Cancellation check first (high priority guardrail)
        if any(p.search(lower) for p in cls.CANCELLATION_PATTERNS):
            return OrderIntent.order_cancellation, 0.95, "Explicit cancellation keywords detected"

        # Amendment check
        if any(p.search(lower) for p in cls.AMENDMENT_PATTERNS):
            has_ref = bool(re.search(r"\b(ord|ld|lr|po|inv)[-:\s#]*\d+", lower))
            conf = 0.92 if has_ref else 0.80
            return OrderIntent.order_amendment, conf, "Order modification keywords detected"

        # Status query
        if any(p.search(lower) for p in cls.STATUS_PATTERNS):
            return OrderIntent.status_query, 0.90, "Shipment tracking and status inquiry detected"

        # Rate quotation query
        if any(p.search(lower) for p in cls.RATE_PATTERNS) and not any(p.search(lower) for p in cls.NEW_ORDER_PATTERNS):
            return OrderIntent.rate_request, 0.88, "Freight quotation inquiry detected"

        # Document submission only
        if any(p.search(lower) for p in cls.DOCUMENT_PATTERNS) and not any(p.search(lower) for p in cls.NEW_ORDER_PATTERNS):
            return OrderIntent.document_submission, 0.85, "Standalone document submission detected"

        # New order check
        matches = [p for p in cls.NEW_ORDER_PATTERNS if p.search(lower)]
        if matches or any(getattr(a, "filename", "").lower().endswith((".xlsx", ".csv", ".xls")) for a in attachments):
            score = 0.95 if len(matches) >= 2 or attachments else 0.80
            return OrderIntent.new_order, score, "New shipment booking keywords and order details detected"

        if not combined or len(combined.split()) < 3:
            return OrderIntent.noise_or_unknown, 0.30, "Insufficient message content"

        return OrderIntent.noise_or_unknown, 0.40, "Unrecognized intent; requires human review"


class IngestionService:
    """Coordinates message intake, deduplication, and intent routing."""

    def __init__(self):
        self.seen_hashes: set[str] = set()

    def compute_content_hash(self, sender: str, channel: str, subject: str, text: str, attachments: Sequence[IngestedAttachment] = ()) -> str:
        h = hashlib.sha256()
        h.update(sender.strip().lower().encode("utf-8"))
        h.update(channel.strip().lower().encode("utf-8"))
        h.update(subject.strip().encode("utf-8"))
        h.update(text.strip().encode("utf-8"))
        for att in attachments:
            h.update(att.content_hash.encode("utf-8"))
        return h.hexdigest()

    def ingest_message(
        self,
        sender: str,
        channel: IngestionChannel | str,
        subject: str,
        body_text: str,
        attachments: Sequence[IngestedAttachment] = (),
        metadata: Mapping[str, Any] | None = None,
        timestamp: str | None = None,
    ) -> IngestedMessage:
        ch = IngestionChannel(channel)
        ts = timestamp or datetime.now(timezone.utc).isoformat()
        content_hash = self.compute_content_hash(sender, ch.value, subject, body_text, attachments)

        is_dup = content_hash in self.seen_hashes
        self.seen_hashes.add(content_hash)

        intent, confidence, reason = IntentClassifier.classify(subject, body_text, attachments)

        att_metadata = [
            {
                "filename": att.filename,
                "content_type": att.content_type,
                "content_hash": att.content_hash,
                "size_bytes": len(att.content_bytes) if att.content_bytes else 0,
            }
            for att in attachments
        ]

        msg_id = f"msg_{uuid.uuid4().hex[:12]}"

        return IngestedMessage(
            message_id=msg_id,
            channel=ch,
            sender=sender,
            subject=subject,
            body_text=body_text,
            timestamp=ts,
            content_hash=content_hash,
            intent=intent,
            intent_confidence=confidence,
            attachments=att_metadata,
            metadata={**(metadata or {}), "classification_reason": reason},
            is_duplicate=is_dup,
        )
