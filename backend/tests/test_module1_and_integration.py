"""Comprehensive unit and integration tests for Module 1 and its integration with Modules 2 and 3."""
import asyncio
from io import BytesIO
import pytest
from fastapi import HTTPException
import pandas as pd

from backend import server
from backend.ingestion import IngestionService, IngestionChannel, OrderIntent, IntentClassifier
from backend.extraction import DocumentExtractor, ExtractedField, ExtractedOrderRecord
from backend.resolution import EntityResolver, ResolvedCustomer, ResolvedLocation
from backend.orders import OrderManager, OrderValidator, OrderOperationalStatus, ConfidenceTier
from backend.tracking_notifications import NotificationDispatcher, CustomerQueryResolver, ShipmentMilestone, MilestoneRecord
from backend.exceptions_queue import ExceptionManager, ExceptionCategory
from backend.matching import rank_candidates
from backend.voice import VoiceTaskManager, VoiceTaskState


class Result:
    def __init__(self, modified_count):
        self.modified_count = modified_count


class MockDBCollection:
    def __init__(self, docs=None):
        self.documents = list(docs or [])

    async def find_one(self, query, projection=None):
        for doc in self.documents:
            if self._matches(doc, query):
                return {k: v for k, v in doc.items() if not projection or projection.get(k, 1) != 0}
        return None

    def find(self, query=None, projection=None):
        matched = []
        for doc in self.documents:
            if not query or self._matches(doc, query):
                res = {k: v for k, v in doc.items() if not projection or projection.get(k, 1) != 0}
                matched.append(res)
        class AsyncCursor:
            def __init__(self, items):
                self.items = items
            def sort(self, *args, **kwargs):
                return self
            async def to_list(self, length=1000):
                return self.items[:length]
        return AsyncCursor(matched)

    async def insert_one(self, document):
        self.documents.append(dict(document))

    async def replace_one(self, query, document, upsert=False):
        for idx, doc in enumerate(self.documents):
            if self._matches(doc, query):
                self.documents[idx] = dict(document)
                return Result(1)
        if upsert:
            self.documents.append(dict(document))
            return Result(1)
        return Result(0)

    async def update_one(self, query, update, upsert=False):
        for doc in self.documents:
            if self._matches(doc, query):
                doc.update(update.get("$set", {}))
                return Result(1)
        if upsert:
            doc = dict(query)
            doc.update(update.get("$set", {}))
            self.documents.append(doc)
            return Result(1)
        return Result(0)

    @staticmethod
    def _matches(doc, query):
        if "$or" in query:
            return any(MockDBCollection._matches(doc, part) for part in query["$or"])
        if "$and" in query:
            return all(MockDBCollection._matches(doc, part) for part in query["$and"])
        for k, v in query.items():
            if isinstance(v, dict):
                if "$ne" in v and doc.get(k) == v["$ne"]:
                    return False
            elif doc.get(k) != v:
                return False
        return True


class MockAppDatabase:
    def __init__(self):
        self.orders = MockDBCollection()
        self.loads = MockDBCollection([
            {"id": "LD-201", "load_id": "LD-201", "lane": "Bhiwandi -> Narela", "weight_kg": 10000, "pallets": 18, "vehicle_type": "32ft", "status": "proposed"},
            {"id": "LD-202", "load_id": "LD-202", "lane": "Bhiwandi -> Jaipur", "weight_kg": 8000, "pallets": 12, "vehicle_type": "32ft", "status": "proposed"},
        ])
        self.vehicles = MockDBCollection([
            {"id": "truck-1", "vehicle_id": "MH-04-XX-4471", "vehicle_type": "32ft", "available_payload_kg": 15000, "available_pallets": 22, "available": True, "assigned": False},
            {"id": "truck-2", "vehicle_id": "MH-46-ZZ-9012", "vehicle_type": "24ft", "available_payload_kg": 8000, "available_pallets": 16, "available": True, "assigned": False},
        ])
        self.carriers = MockDBCollection([
            {"id": "carrier-hasmukh", "carrier_id": "carrier-hasmukh", "name": "Hasmukh Freight Partners"},
        ])
        self.assignments = MockDBCollection()
        self.quotes = MockDBCollection()
        self.voice_tasks = MockDBCollection()
        self.voice_calls = MockDBCollection()
        self.audit_events = MockDBCollection()
        self.ingested_messages = MockDBCollection()
        self.exceptions = MockDBCollection()
        self.milestones = MockDBCollection()
        self.notifications = MockDBCollection()


# ==============================================================================
# 1. Module 1 Unit Tests: Ingestion, Extraction, Resolution, Validation
# ==============================================================================

def test_intent_classification():
    # New order
    intent, conf, _ = IntentClassifier.classify(
        "Booking request",
        "Please book 18 pallets of packaged goods from Bhiwandi to Narela. Vehicle 32 ft MXL.",
    )
    assert intent == OrderIntent.new_order
    assert conf >= 0.85

    # Amendment
    intent, conf, _ = IntentClassifier.classify(
        "Update regarding ORD-1042",
        "Please amend the weight to 15.5 t and update delivery window for ORD-1042.",
    )
    assert intent == OrderIntent.order_amendment

    # Cancellation
    intent, conf, _ = IntentClassifier.classify(
        "Cancel load",
        "Please cancel booking for ORD-1042 due to customer production halt.",
    )
    assert intent == OrderIntent.order_cancellation

    # Status query
    intent, conf, _ = IntentClassifier.classify(
        "Where is the truck?",
        "Where is LR-8839 right now? What is the current location and ETA?",
    )
    assert intent == OrderIntent.status_query


def test_ingestion_message_deduplication():
    service = IngestionService()
    msg1 = service.ingest_message(
        sender="meera@aaravconsumer.example",
        channel="email",
        subject="Order booking",
        body_text="Please book 18 pallets from Bhiwandi to Narela",
    )
    assert msg1.is_duplicate is False

    # Ingest identical content
    msg2 = service.ingest_message(
        sender="meera@aaravconsumer.example",
        channel="email",
        subject="Order booking",
        body_text="Please book 18 pallets from Bhiwandi to Narela",
    )
    assert msg2.is_duplicate is True


def test_document_extraction_from_email_text():
    sample_email = (
        "Hi team, please book 18 pallets of packaged goods from Bhiwandi WH-3 to "
        "Gupta Trading Co., Narela. Pickup window Thursday 08:00-12:00. Vehicle: 32 ft MXL. "
        "Gross weight is 14.2 t. Purchase Order PO-7712, INV-2211. "
        "Regards, Meera — Aarav Consumer Products"
    )
    fields = DocumentExtractor.extract_from_text(sample_email, source_tag="email")
    assert fields["customer"].value == "Aarav Consumer Products"
    assert fields["pallets"].value == 18
    assert fields["weight_kg"].value == 14200.0
    assert fields["vehicle_requirement"].value == "32 ft MXL"
    assert "PO-7712" in fields["po_number"].value
    assert "INV-2211" in fields["invoice_numbers"].value[0]


def test_multi_source_conflict_detection():
    text_fields = {
        "customer": ExtractedField("customer", "Aarav Consumer Products", 0.98, "email line 1", "email"),
        "weight_kg": ExtractedField("weight_kg", 14200.0, 0.95, "invoice: 14.2 t", "pdf"),
        "pallets": ExtractedField("pallets", 18, 0.99, "email line 2", "email"),
    }
    sheet_fields = {
        "customer": ExtractedField("customer", "Aarav Consumer Products", 0.99, "excel row 2", "excel"),
        "weight_kg": ExtractedField("weight_kg", 14500.0, 0.98, "excel row 2: 14.5 t", "excel"),
        "pallets": ExtractedField("pallets", 18, 0.99, "excel row 2: 18", "excel"),
    }
    rec = DocumentExtractor.reconcile_sources(text_fields, sheet_fields, record_id="ORD-1042")
    assert len(rec.conflicts) == 1
    assert "14.2 t vs Excel 14.5 t" in rec.conflicts[0]
    # Weight confidence should be lowered due to discrepancy
    assert rec.fields["weight_kg"].confidence <= 0.60
    assert rec.fields["weight_kg"].is_conflict is True


def test_spreadsheet_manifest_parsing_multiple_rows():
    df = pd.DataFrame([
        {"Customer": "Aarav Consumer Products", "Origin": "Bhiwandi WH-3", "Destination": "Narela", "Weight": 14.2, "Pallets": 18, "Vehicle": "32ft", "PO": "PO-101"},
        {"Customer": "Kedia Polymers", "Origin": "Bhiwandi", "Destination": "Pune", "Weight": 8.0, "Pallets": 12, "Vehicle": "24ft", "PO": "PO-102"},
    ])
    buf = BytesIO()
    df.to_csv(buf, index=False)
    csv_bytes = buf.getvalue()

    rows = DocumentExtractor.extract_from_spreadsheet(csv_bytes, "orders_manifest.csv")
    assert len(rows) == 2
    assert rows[0]["customer"].value == "Aarav Consumer Products"
    assert rows[0]["weight_kg"].value == 14200.0
    assert rows[1]["customer"].value == "Kedia Polymers"
    assert rows[1]["weight_kg"].value == 8000.0


def test_entity_resolution_and_ambiguity_flag():
    # Exact/alias match
    cust = EntityResolver.resolve_customer("Aarav Consumer")
    assert cust.is_ambiguous is False
    assert cust.customer_id == "cust_aarav"

    # Ambiguous customer: "Gupta" matches both Gupta Trading Co. and Gupta Enterprises Delhi
    ambig_cust = EntityResolver.resolve_customer("Gupta")
    assert ambig_cust.is_ambiguous is True
    assert len(ambig_cust.candidate_matches) >= 2

    # Location resolution
    loc = EntityResolver.resolve_location("Bhiwandi WH-3, Thane")
    assert loc.is_ambiguous is False
    assert loc.pincode == "421302"
    assert loc.city == "Bhiwandi (Mumbai)"


def test_deterministic_order_validation_and_confidence_tiers():
    extracted = ExtractedOrderRecord(
        record_id="ORD-1042",
        fields={
            "customer": ExtractedField("customer", "Aarav Consumer Products", 0.98, "", ""),
            "pickup_location": ExtractedField("pickup_location", "Bhiwandi WH-3", 0.98, "", ""),
            "drop_location": ExtractedField("drop_location", "Narela", 0.96, "", ""),
            "weight_kg": ExtractedField("weight_kg", 14200.0, 0.58, "", "", is_conflict=True),
            "pallets": ExtractedField("pallets", 18, 0.99, "", ""),
            "vehicle_requirement": ExtractedField("vehicle_requirement", "32 ft MXL", 0.95, "", ""),
            "po_number": ExtractedField("po_number", "PO-7712", 0.97, "", ""),
        },
        conflicts=["conflict: invoice 14.2 t vs Excel 14.5 t"],
    )
    cust = EntityResolver.resolve_customer("Aarav Consumer Products")
    origin = EntityResolver.resolve_location("Bhiwandi WH-3")
    dest = EntityResolver.resolve_location("Narela")

    issues = OrderValidator.validate_order(extracted, cust, origin, dest)
    order_doc = OrderManager.build_order_document("ORD-1042", extracted, cust, origin, dest, issues)

    # Should be medium confidence tier because of conflict
    assert order_doc["confidence_tier"] == ConfidenceTier.medium.value
    assert order_doc["status"] == OrderOperationalStatus.draft_pending_review.value


def test_human_correction_promotes_order_to_ready():
    extracted = ExtractedOrderRecord(
        record_id="ORD-1042",
        fields={
            "customer": ExtractedField("customer", "Aarav Consumer Products", 0.98, "", ""),
            "pickup_location": ExtractedField("pickup_location", "Bhiwandi WH-3", 0.98, "", ""),
            "drop_location": ExtractedField("drop_location", "Narela", 0.96, "", ""),
            "weight_kg": ExtractedField("weight_kg", 14200.0, 0.58, "", "", is_conflict=True),
            "pallets": ExtractedField("pallets", 18, 0.99, "", ""),
            "vehicle_requirement": ExtractedField("vehicle_requirement", "32 ft MXL", 0.95, "", ""),
        },
        conflicts=["conflict: invoice 14.2 t vs Excel 14.5 t"],
    )
    cust = EntityResolver.resolve_customer("Aarav Consumer Products")
    origin = EntityResolver.resolve_location("Bhiwandi WH-3")
    dest = EntityResolver.resolve_location("Narela")
    issues = OrderValidator.validate_order(extracted, cust, origin, dest)
    order_doc = OrderManager.build_order_document("ORD-1042", extracted, cust, origin, dest, issues)

    # Dispatcher corrects weight to 14.2 t
    corrected = OrderManager.apply_human_correction(order_doc, "weight_kg", 14200.0, "dispatcher@example.com")
    assert corrected["confidence_tier"] == ConfidenceTier.high.value
    assert corrected["status"] == OrderOperationalStatus.ready_for_matching.value
    assert len(corrected["corrections"]) == 1
    assert corrected["corrections"][0]["field"] == "weight_kg"


# ==============================================================================
# 2. Module 1 + Module 3 Integration Tests (Load Matching & Amendments)
# ==============================================================================

def test_validated_order_triggers_module3_matcher():
    # Order specs
    order = {"id": "ORD-1042", "vehicle_type": "32ft", "weight_kg": 14200, "pallets": 18}
    vehicles = [
        {"vehicle_id": "MH-04-XX-4471", "vehicle_type": "32ft", "available_payload_kg": 15000, "available_pallets": 22, "available": True, "quoted_rate": 74800, "pickup_distance_km": 6},
        {"vehicle_id": "GJ-01-YY-5678", "vehicle_type": "32ft", "available_payload_kg": 15000, "available_pallets": 22, "available": True, "quoted_rate": 75600, "pickup_distance_km": 38},
        {"vehicle_id": "MH-46-ZZ-9012", "vehicle_type": "24ft", "available_payload_kg": 8000, "available_pallets": 16, "available": True, "quoted_rate": 72100, "pickup_distance_km": 4},
    ]

    candidates = rank_candidates(order, vehicles)
    # 24ft vehicle must be rejected by hard capacity constraint
    assert len(candidates) == 2
    assert candidates[0]["vehicle_id"] == "MH-04-XX-4471"
    assert candidates[0]["score"] > candidates[1]["score"]  # Closer vehicle ranks higher


def test_order_amendment_flags_incompatible_assigned_truck():
    order = {
        "id": "ORD-1042",
        "weight_kg": 10000,
        "pallets": 18,
        "vehicle_type": "32ft",
        "destination": "Narela",
        "assigned_vehicle_id": "MH-04-XX-4471",
    }
    # Customer increases weight to 16,500 kg (exceeding standard 32ft payload)
    amended, invalidated = OrderManager.apply_amendment(order, {"weight_kg": 16500}, "dispatcher@example.com")
    assert invalidated is True
    assert "assignment_warning" in amended


# ==============================================================================
# 3. Module 1 + Module 2 Integration Tests (Voice Quotes & Driver Status)
# ==============================================================================

def test_voice_quote_negotiation_workflow():
    manager = VoiceTaskManager()
    task = manager.create("carrier_quotation", "LD-201:carrier-hasmukh", idempotency_key="quote-hasmukh")
    manager.start(task.task_id)

    # Carrier call callback with agreed quote
    manager.callback(task.task_id, "evt-1", VoiceTaskState.completed, {
        "quoted_rate": 74500,
        "language": "Gujarati",
        "contact": "Hasmukhbhai",
    })
    assert task.state == VoiceTaskState.completed
    assert task.result["quoted_rate"] == 74500


def test_rate_ceiling_guardrail_enforcement(monkeypatch):
    fake_db = MockAppDatabase()
    monkeypatch.setattr(server, "db", fake_db)

    # Negotiate rate above ceiling -> should flag approval
    req = server.VoiceQuoteNegotiateRequest(
        load_id="LD-201",
        carrier_id="carrier-hasmukh",
        benchmark_rate=78000,
        ceiling_rate=74000,
        target_rate=75000,  # 75,000 > ceiling 74,000
    )
    res = asyncio.run(server.negotiate_carrier_quote(req, {"id": "disp-1", "role": "dispatcher"}))
    assert res["quote"]["status"] == "approval"


def test_driver_status_query_truthful_milestone():
    milestones = [
        MilestoneRecord(
            milestone_id="m1",
            load_id="LD-201",
            milestone=ShipmentMilestone.in_transit,
            timestamp="2026-10-11T09:30:00Z",
            reported_by="Ramesh (Driver)",
            is_driver_reported=True,
            is_telematics_verified=False,
        )
    ]
    order = {"id": "ORD-1042", "lane": "Bhiwandi -> Narela", "status": "in_transit", "customer_name": "Aarav Consumer Products"}
    ans = CustomerQueryResolver.answer_query("Where is the shipment?", order, milestones)
    assert "reported verbally by driver" in ans["response_text"]
    assert "In Transit" in ans["response_text"]


def test_proactive_customer_notifications_are_deduplicated():
    dispatcher = NotificationDispatcher()
    n1 = dispatcher.dispatch(
        event_id="ms_LD-201_in_transit",
        recipient="+919876543210",
        channel="whatsapp",
        message="Your shipment LD-201 is in transit.",
    )
    assert n1.status == "sent"

    # Duplicate trigger for the same milestone event
    n2 = dispatcher.dispatch(
        event_id="ms_LD-201_in_transit",
        recipient="+919876543210",
        channel="whatsapp",
        message="Your shipment LD-201 is in transit.",
    )
    assert n2.status == "deduplicated"


# ==============================================================================
# 4. Unified Exception Queue Tests
# ==============================================================================

def test_unified_exception_lifecycle():
    ex_mgr = ExceptionManager()
    ex = ex_mgr.create_exception(
        category=ExceptionCategory.shipment_delay_or_breakdown,
        title="Breakdown near Beawar",
        problem="Truck MH-04-XX-1234 broke down.",
        tried="Voice AI contacted driver.",
        related_entity_id="LR-8839",
        kind="options",
        options=[
            {"id": "A", "label": "Wait for repair", "cost": "Rs 0"},
            {"id": "B", "label": "Transship to partner truck", "cost": "+Rs 9,000", "recommended": True},
        ],
    )
    assert ex.status == "open"

    # Approving Option B
    resolved = ex_mgr.resolve(ex.id, action="approve", resolution_note="Approved transshipment option B", selected_option="B")
    assert resolved.status == "resolved"
    assert resolved.selected == "B"
    assert resolved.tag == "ai"


# ==============================================================================
# 5. End-to-End Operational Workflow & Failure Scenarios
# ==============================================================================

def test_complete_end_to_end_operations_workflow(monkeypatch):
    """
    Tests the complete operational journey:
    Receive email -> Extract & validate -> Order creation -> Module 3 truck match ->
    Module 2 voice quote -> Authorised approval -> Booking -> Milestone tracking -> Customer update -> Vehicle release.
    """
    fake_db = MockAppDatabase()
    monkeypatch.setattr(server, "db", fake_db)

    # Step 1: Ingest email
    raw_email = (
        "Hi team, please book 18 pallets of packaged goods from Bhiwandi WH-3 to "
        "Gupta Trading Co., Narela. Pickup window Thursday 08:00-12:00. Vehicle: 32 ft MXL. "
        "Gross weight 14.2 t. Purchase Order PO-7712. Regards, Meera — Aarav Consumer Products"
    )
    ingest_req = server.IngestionMessageRequest(
        sender="meera@aaravconsumer.example",
        channel="email",
        subject="Booking: 18 pallets Mumbai to Delhi",
        body_text=raw_email,
    )
    ingest_res = asyncio.run(server.ingest_message(ingest_req, {"id": "disp-1", "role": "dispatcher"}))
    assert ingest_res["intent"] == OrderIntent.new_order
    order = ingest_res["order"]
    assert order["customer_name"] == "Aarav Consumer Products"
    assert order["pallets"] == 18

    # Step 2: Human review / approval in TMS
    approve_res = asyncio.run(server.approve_order(order["id"], {"id": "disp-1", "role": "dispatcher"}))
    assert approve_res["ok"] is True
    assert approve_res["order"]["status"] == "ready_for_matching"

    # Step 3: Module 3 matching
    load = approve_res["load"]
    vehicles = fake_db.vehicles.documents
    ranked = rank_candidates(load, vehicles)
    assert len(ranked) >= 1
    best_candidate = ranked[0]
    assert best_candidate["vehicle_id"] == "MH-04-XX-4471"

    # Step 4: Module 2 Voice AI carrier negotiation
    voice_req = server.VoiceQuoteNegotiateRequest(
        load_id=load["id"],
        carrier_id="carrier-hasmukh",
        benchmark_rate=78000,
        ceiling_rate=80000,
        target_rate=74500,
    )
    quote_res = asyncio.run(server.negotiate_carrier_quote(voice_req, {"id": "disp-1", "role": "dispatcher"}))
    assert quote_res["quote"]["amount"] == 74500
    assert quote_res["quote"]["status"] == "pending"  # Under ceiling, ready

    # Step 5: Booking / Assignment creation
    assign_req = server.AssignmentRequest(
        load_id=load["id"],
        vehicle_id="truck-1",
        requested_rate=quote_res["quote"]["amount"],
        idempotency_key=f"assign_{load['id']}_truck-1",
    )
    assignment = asyncio.run(server.create_assignment(assign_req, "dispatcher"))
    assert assignment["status"] == "confirmed"
    assert fake_db.vehicles.documents[0]["assigned"] is True

    # Step 6: Milestone tracking (In Transit)
    milestone_req = server.MilestoneCreateRequest(
        load_id=load["id"],
        milestone="in_transit",
        reported_by="Ramesh (Driver Voice Check-in)",
        is_driver_reported=True,
    )
    milestone_res = asyncio.run(server.create_milestone(milestone_req, {"id": "disp-1", "role": "dispatcher"}))
    assert milestone_res["milestone"] == "in_transit"

    # Step 7: Customer status enquiry
    query_req = server.CustomerStatusQueryRequest(
        query_text="What is the current status of my order?",
        order_or_load_id=load["id"],
    )
    query_res = asyncio.run(server.customer_query(query_req, {"id": "disp-1", "role": "dispatcher"}))
    assert "In Transit" in query_res["response_text"]
    assert "reported verbally by driver" in query_res["response_text"]

    # Step 8: Completion / Delivery & vehicle release
    delivered = asyncio.run(server.update_assignment_status(assignment["id"], server.StatusUpdate(status="delivered"), "dispatcher"))
    assert delivered["status"] == "delivered"
    assert fake_db.vehicles.documents[0]["assigned"] is False
    assert fake_db.vehicles.documents[0]["available"] is True


def test_failure_scenarios(monkeypatch):
    """Verifies robustness across edge cases and failures."""
    fake_db = MockAppDatabase()
    monkeypatch.setattr(server, "db", fake_db)

    # 1. Duplicate email is detected and skipped
    ingest_req = server.IngestionMessageRequest(
        sender="duplicate@example.com",
        body_text="Please book 18 pallets",
    )
    r1 = asyncio.run(server.ingest_message(ingest_req, {"id": "disp-1", "role": "dispatcher"}))
    r2 = asyncio.run(server.ingest_message(ingest_req, {"id": "disp-1", "role": "dispatcher"}))
    assert r1["is_duplicate"] is False
    assert r2["is_duplicate"] is True
    assert r2["status"] == "duplicate_skipped"

    # 2. Infeasible payload (25 tons for 32ft) rejected by matcher
    heavy_load = {"vehicle_type": "32ft", "weight_kg": 25000, "pallets": 18}
    feasible = rank_candidates(heavy_load, fake_db.vehicles.documents)
    assert len(feasible) == 0  # Rejection guaranteed

    # 3. Vehicle collision: second assignment for same truck is blocked
    assign_req1 = server.AssignmentRequest(load_id="LD-201", vehicle_id="truck-1", requested_rate=75000, idempotency_key="k1")
    asyncio.run(server.create_assignment(assign_req1, "dispatcher"))
    assign_req2 = server.AssignmentRequest(load_id="LD-202", vehicle_id="truck-1", requested_rate=75000, idempotency_key="k2")
    with pytest.raises(HTTPException) as exc:
        asyncio.run(server.create_assignment(assign_req2, "dispatcher"))
    assert exc.value.status_code == 409

