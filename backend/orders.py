"""Business validation, confidence-based order lifecycle, and amendment handling for Haulage AI Module 1."""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Mapping, Sequence
import uuid

try:
    from .extraction import ExtractedField, ExtractedOrderRecord
    from .resolution import EntityResolver, ResolvedCustomer, ResolvedLocation
except ImportError:
    from extraction import ExtractedField, ExtractedOrderRecord
    from resolution import EntityResolver, ResolvedCustomer, ResolvedLocation


class ConfidenceTier(str, Enum):
    high = "high"        # >= 85%, passes rules -> ready for TMS / matching
    medium = "medium"    # 60-84% or field conflict -> draft pending human review
    low = "low"          # < 60% or critical entity ambiguity -> exception raised


class OrderOperationalStatus(str, Enum):
    draft_pending_review = "draft_pending_review"
    exception_raised = "exception_raised"
    ready_for_matching = "ready_for_matching"
    matched = "matched"
    awaiting_quote = "awaiting_quote"
    assigned = "assigned"
    dispatched = "dispatched"
    in_transit = "in_transit"
    delivered = "delivered"
    cancelled = "cancelled"


@dataclass
class ValidationIssue:
    field: str
    severity: str  # "critical", "warning"
    message: str


class OrderValidator:
    """Deterministic validation of extracted logistics orders against business rules."""

    VEHICLE_CAPACITY_LIMITS = {
        "32ft": {"max_weight_kg": 16000, "max_pallets": 24},
        "32 ft": {"max_weight_kg": 16000, "max_pallets": 24},
        "32 ft MXL": {"max_weight_kg": 16000, "max_pallets": 24},
        "32 ft SXL": {"max_weight_kg": 10000, "max_pallets": 20},
        "24ft": {"max_weight_kg": 9000, "max_pallets": 16},
        "24 ft": {"max_weight_kg": 9000, "max_pallets": 16},
        "20ft": {"max_weight_kg": 7000, "max_pallets": 12},
        "20 ft": {"max_weight_kg": 7000, "max_pallets": 12},
    }

    @classmethod
    def validate_order(
        cls,
        extracted: ExtractedOrderRecord,
        customer: ResolvedCustomer,
        origin: ResolvedLocation,
        destination: ResolvedLocation,
        existing_orders: Sequence[Mapping[str, Any]] = (),
    ) -> list[ValidationIssue]:
        issues: list[ValidationIssue] = []

        # 1. Customer resolution
        if customer.is_ambiguous:
            candidates_str = ", ".join(customer.candidate_matches) if customer.candidate_matches else "multiple records"
            issues.append(ValidationIssue(
                field="customer",
                severity="critical",
                message=f"Ambiguous customer: matches {candidates_str}. Clarification required.",
            ))

        # 2. Origin & Destination resolution
        if origin.is_ambiguous:
            issues.append(ValidationIssue(
                field="pickup_location",
                severity="critical",
                message=f"Ambiguous pickup location: '{origin.hub_name}' cannot be mapped with confidence.",
            ))
        if destination.is_ambiguous:
            issues.append(ValidationIssue(
                field="drop_location",
                severity="critical",
                message=f"Ambiguous drop location: '{destination.hub_name}' cannot be mapped with confidence.",
            ))

        # 3. Payload and Pallet checks
        weight_kg = extracted.get_value("weight_kg")
        pallets = extracted.get_value("pallets")
        if weight_kg is None or weight_kg <= 0:
            issues.append(ValidationIssue(field="weight_kg", severity="critical", message="Valid gross weight is required"))
        if pallets is None or pallets <= 0:
            issues.append(ValidationIssue(field="pallets", severity="critical", message="Pallet count must be greater than zero"))

        # 4. Vehicle constraint sanity check
        veh_req = str(extracted.get_value("vehicle_requirement") or "")
        normalized_veh = next((k for k in cls.VEHICLE_CAPACITY_LIMITS if k.lower() in veh_req.lower()), None)
        if normalized_veh and weight_kg and pallets:
            limits = cls.VEHICLE_CAPACITY_LIMITS[normalized_veh]
            if weight_kg > limits["max_weight_kg"]:
                issues.append(ValidationIssue(
                    field="weight_kg",
                    severity="critical",
                    message=f"Weight {weight_kg} kg exceeds standard {normalized_veh} rating ({limits['max_weight_kg']} kg)",
                ))
            if pallets > limits["max_pallets"]:
                issues.append(ValidationIssue(
                    field="pallets",
                    severity="critical",
                    message=f"Pallet count {pallets} exceeds physical capacity of {normalized_veh} ({limits['max_pallets']} pallets)",
                ))

        # 5. Duplicate PO / Invoice detection
        po = extracted.get_value("po_number")
        if po:
            for ex in existing_orders:
                if ex.get("po_number") == po and ex.get("id") != extracted.record_id:
                    issues.append(ValidationIssue(
                        field="po_number",
                        severity="critical",
                        message=f"Duplicate PO reference: {po} already exists in order {ex.get('id')}",
                    ))
                    break

        # 6. Source conflicts
        if extracted.conflicts:
            for c in extracted.conflicts:
                issues.append(ValidationIssue(
                    field="conflicts",
                    severity="warning",
                    message=f"Source discrepancy: {c}",
                ))

        return issues


class OrderManager:
    """Manages order creation, confidence routing, human corrections, and safe amendments."""

    @staticmethod
    def determine_confidence_tier(overall_score: float, issues: Sequence[ValidationIssue], has_conflicts: bool) -> ConfidenceTier:
        has_critical = any(issue.severity == "critical" for issue in issues)
        if has_critical or overall_score < 60.0:
            return ConfidenceTier.low
        if has_conflicts or issues or overall_score < 85.0:
            return ConfidenceTier.medium
        return ConfidenceTier.high

    @staticmethod
    def build_order_document(
        order_id: str,
        extracted: ExtractedOrderRecord,
        customer: ResolvedCustomer,
        origin: ResolvedLocation,
        destination: ResolvedLocation,
        issues: Sequence[ValidationIssue],
        source_message_id: str | None = None,
        source_channel: str = "email",
    ) -> dict[str, Any]:
        conf_tier = OrderManager.determine_confidence_tier(extracted.overall_confidence, issues, bool(extracted.conflicts))
        now = datetime.now(timezone.utc).isoformat()

        status = (
            OrderOperationalStatus.ready_for_matching
            if conf_tier == ConfidenceTier.high
            else (OrderOperationalStatus.draft_pending_review if conf_tier == ConfidenceTier.medium else OrderOperationalStatus.exception_raised)
        )

        load_id = f"LD-{order_id.replace('ORD-', '')}" if "ORD-" in order_id else f"LD-{order_id}"

        # Standard vehicle type tag for Module 3 matching compatibility
        veh_req = str(extracted.get_value("vehicle_requirement") or "32ft")
        vehicle_type = "32ft" if "32" in veh_req else ("24ft" if "24" in veh_req else "32ft")

        doc = {
            "id": order_id,
            "order_id": order_id,
            "load_id": load_id,
            "customer_id": customer.customer_id,
            "customer_name": customer.canonical_name,
            "origin": origin.hub_name,
            "origin_city": origin.city,
            "origin_pincode": origin.pincode,
            "destination": destination.hub_name,
            "destination_city": destination.city,
            "destination_pincode": destination.pincode,
            "lane": f"{origin.hub_name} -> {destination.hub_name}",
            "cargo": extracted.get_value("cargo", "Packaged goods"),
            "weight_kg": extracted.get_value("weight_kg", 0.0),
            "pallets": extracted.get_value("pallets", 0),
            "vehicle_type": vehicle_type,
            "vehicle_requirement": veh_req,
            "po_number": extracted.get_value("po_number"),
            "invoice_numbers": extracted.get_value("invoice_numbers", []),
            "pickup_window": extracted.get_value("pickup_window", "Thursday 08:00-12:00"),
            "status": status.value,
            "confidence_tier": conf_tier.value,
            "overall_confidence": extracted.overall_confidence,
            "extracted_fields": {k: v.to_dict() for k, v in extracted.fields.items()},
            "conflicts": extracted.conflicts,
            "validation_issues": [{"field": i.field, "severity": i.severity, "message": i.message} for i in issues],
            "corrections": [],
            "amendments": [],
            "source_message_id": source_message_id,
            "source_channel": source_channel,
            "assigned_vehicle_id": None,
            "created_at": now,
            "updated_at": now,
        }
        return doc

    @staticmethod
    def apply_human_correction(
        order: dict[str, Any],
        field_name: str,
        corrected_value: Any,
        user_email: str,
    ) -> dict[str, Any]:
        """Applies inline correction to an uncertain field, records audit trail, and revalidates."""
        now = datetime.now(timezone.utc).isoformat()
        old_val = order.get(field_name)

        # Record correction history
        correction_entry = {
            "field": field_name,
            "previous_value": old_val,
            "corrected_value": corrected_value,
            "corrected_by": user_email,
            "timestamp": now,
        }
        order.setdefault("corrections", []).append(correction_entry)

        # Update order value
        order[field_name] = corrected_value
        if "extracted_fields" in order and field_name in order["extracted_fields"]:
            order["extracted_fields"][field_name]["value"] = corrected_value
            order["extracted_fields"][field_name]["confidence"] = 100.0
            order["extracted_fields"][field_name]["is_conflict"] = False
            order["extracted_fields"][field_name]["conflict_details"] = "Resolved by dispatcher"

        # Remove resolved conflict entry
        order["conflicts"] = [c for c in order.get("conflicts", []) if field_name not in c]

        # Re-evaluate status: if no remaining critical issues, promote to ready_for_matching
        has_critical = any(i["severity"] == "critical" and i["field"] == field_name for i in order.get("validation_issues", []))
        order["validation_issues"] = [i for i in order.get("validation_issues", []) if i["field"] != field_name]

        if not any(i["severity"] == "critical" for i in order.get("validation_issues", [])):
            order["confidence_tier"] = ConfidenceTier.high.value
            order["status"] = OrderOperationalStatus.ready_for_matching.value

        order["updated_at"] = now
        return order

    @staticmethod
    def apply_amendment(
        order: dict[str, Any],
        amendments: Mapping[str, Any],
        user_email: str,
    ) -> tuple[dict[str, Any], bool]:
        """Safely applies customer amendments to an order, flagging if existing truck assignment is invalidated."""
        now = datetime.now(timezone.utc).isoformat()
        previous_snapshot = {k: order.get(k) for k in amendments}

        amendment_entry = {
            "amendment_id": str(uuid.uuid4()),
            "previous": previous_snapshot,
            "updated": dict(amendments),
            "amended_by": user_email,
            "timestamp": now,
        }
        order.setdefault("amendments", []).append(amendment_entry)

        # Apply updates
        for k, v in amendments.items():
            order[k] = v

        assignment_invalidated = False
        # If order already had an assigned vehicle, check if capacity changed
        if order.get("assigned_vehicle_id"):
            weight_changed = "weight_kg" in amendments and amendments["weight_kg"] > previous_snapshot.get("weight_kg", 0)
            pallets_changed = "pallets" in amendments and amendments["pallets"] > previous_snapshot.get("pallets", 0)
            veh_changed = "vehicle_type" in amendments and amendments["vehicle_type"] != previous_snapshot.get("vehicle_type")
            dest_changed = "destination" in amendments and amendments["destination"] != previous_snapshot.get("destination")
            if weight_changed or pallets_changed or veh_changed or dest_changed:
                assignment_invalidated = True
                order["assignment_warning"] = "Order amendment may violate assigned truck feasibility. Re-matching required."

        order["updated_at"] = now
        return order, assignment_invalidated
