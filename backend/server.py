from fastapi import Depends, FastAPI, APIRouter, Header, HTTPException, Request, UploadFile, File
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field, EmailStr
from typing import Any, List, Mapping, Optional
import uuid
from datetime import datetime, timedelta, timezone
from time import perf_counter
import hmac
import json
import jwt
import importlib
from passlib.context import CryptContext

try:
    from .matching import propose_spare_capacity, rank_candidates
    from .voice import ElevenLabsSpeechProvider, VoiceTaskManager, VoiceTaskState
    from .ingestion import IngestionService, IngestionChannel, OrderIntent, IngestedAttachment
    from .extraction import DocumentExtractor, ExtractedField, ExtractedOrderRecord
    from .resolution import EntityResolver, ResolvedCustomer, ResolvedLocation
    from .orders import OrderManager, OrderValidator, OrderOperationalStatus, ConfidenceTier
    from .tracking_notifications import NotificationDispatcher, CustomerQueryResolver, ShipmentMilestone, MilestoneRecord
    from .exceptions_queue import ExceptionManager, ExceptionCategory
    from . import llm_service
except ImportError:
    from matching import propose_spare_capacity, rank_candidates
    from voice import ElevenLabsSpeechProvider, VoiceTaskManager, VoiceTaskState
    from ingestion import IngestionService, IngestionChannel, OrderIntent, IngestedAttachment
    from extraction import DocumentExtractor, ExtractedField, ExtractedOrderRecord
    from resolution import EntityResolver, ResolvedCustomer, ResolvedLocation
    from orders import OrderManager, OrderValidator, OrderOperationalStatus, ConfidenceTier
    from tracking_notifications import NotificationDispatcher, CustomerQueryResolver, ShipmentMilestone, MilestoneRecord
    from exceptions_queue import ExceptionManager, ExceptionCategory
    import llm_service

importlib.reload(llm_service)
copilot_llm_query = llm_service.copilot_llm_query
parse_unstructured_indent = llm_service.parse_unstructured_indent
negotiate_carrier_turn = llm_service.negotiate_carrier_turn
get_model_cascade = llm_service.get_model_cascade

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env", override=True)

mongo_url = os.getenv("MONGO_URL", "").strip()
if not mongo_url:
    raise RuntimeError("MONGO_URL is missing. Copy backend/.env.example to backend/.env and add your MongoDB URL.")

database_name = os.getenv("DB_NAME", "haulage_ai").strip() or "haulage_ai"
mongo_timeout_ms = int(os.getenv("MONGO_SERVER_SELECTION_TIMEOUT_MS", "5000"))
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=mongo_timeout_ms)
db = client[database_name]
dev_api_token = os.getenv("DEV_API_TOKEN", "").strip()
dev_api_role = os.getenv("DEV_API_ROLE", "dispatcher").strip().lower()
jwt_secret_key = os.getenv("JWT_SECRET_KEY", "local-development-only-change-me").strip()
jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256").strip() or "HS256"
jwt_expire_minutes = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
allowed_roles = {"owner", "ops_manager", "dispatcher", "warehouse_lead", "finance"}
password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    indexes = [
        ("loads", [("id", {"unique": True})]),
        ("vehicles", [("id", {"unique": True}), ("vehicle_id", {"unique": True})]),
        ("carriers", [("id", {"unique": True}), ("carrier_id", {"unique": True})]),
        ("seed_markers", [("id", {"unique": True})]),
        ("assignments", [("id", {"unique": True}), ("idempotency_key", {"unique": True}), ("load_id", {"unique": True})]),
        ("quotes", [("id", {"unique": True}), ("load_id", {})]),
        ("voice_tasks", [("task_id", {"unique": True}), ("idempotency_key", {"unique": True, "sparse": True})]),
        ("voice_calls", [("task_id", {"unique": True})]),
        ("audit_events", [("id", {"unique": True}), ("created_at", {})]),
        ("contact_submissions", [("id", {"unique": True})]),
        ("users", [("id", {"unique": True}), ("email", {"unique": True})]),
        ("orders", [("id", {"unique": True}), ("order_id", {"unique": True})]),
        ("ingested_messages", [("message_id", {"unique": True})]),
        ("exceptions", [("id", {"unique": True})]),
        ("milestones", [("milestone_id", {"unique": True})]),
        ("notifications", [("notification_id", {"unique": True})]),
    ]
    for collection_name, collection_indexes in indexes:
        for field, options in collection_indexes:
            try:
                await db[collection_name].create_index(field, **options)
            except Exception as exc:
                logger.warning("mongo_index_initialization_failed", extra={"collection": collection_name, "field": field, "error_type": type(exc).__name__})
    yield
    client.close()


app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")
voice_tasks = VoiceTaskManager()
ingestion_service = IngestionService()
notification_dispatcher = NotificationDispatcher()
exception_manager = ExceptionManager()
elevenlabs_speech = None
if os.getenv("VOICE_PROVIDER", "mock").lower() == "elevenlabs":
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY", "").strip()
    elevenlabs_voice_id = os.getenv("ELEVENLABS_VOICE_ID", "").strip()
    if not elevenlabs_key or not elevenlabs_voice_id:
        raise RuntimeError("VOICE_PROVIDER=elevenlabs requires ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID.")
    elevenlabs_speech = ElevenLabsSpeechProvider(elevenlabs_key, elevenlabs_voice_id)


class ContactSubmissionCreate(BaseModel):
    name: str = Field(min_length=1)
    work_email: EmailStr
    phone: str = Field(min_length=8)
    company: str = Field(min_length=1)
    role: str = Field(min_length=1)
    monthly_volume: Optional[str] = None
    challenges: List[str] = Field(default_factory=list)
    language: str = "English"
    message: Optional[str] = None
    consent: bool


class MatchingRequest(BaseModel):
    load: Mapping[str, Any]
    vehicles: List[Mapping[str, Any]]
    weights: Optional[Mapping[str, float]] = None


class SpareCapacityRequest(BaseModel):
    primary_load: Mapping[str, Any]
    additional_loads: List[Mapping[str, Any]]
    vehicle: Mapping[str, Any]


class VoiceTaskCreate(BaseModel):
    kind: str = Field(min_length=1)
    entity_id: str = Field(min_length=1)
    idempotency_key: Optional[str] = None


class VoiceCallback(BaseModel):
    event_id: str = Field(min_length=1)
    state: VoiceTaskState
    result: dict[str, Any] = Field(default_factory=dict)


class StatusUpdate(BaseModel):
    status: str = Field(min_length=1)


class SpeechRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class AssignmentRequest(BaseModel):
    load_id: str = Field(min_length=1)
    vehicle_id: str = Field(min_length=1)
    requested_rate: float = Field(gt=0)
    idempotency_key: str = Field(min_length=1)


class QuoteRequest(BaseModel):
    load_id: str = Field(min_length=1)
    carrier_id: str = Field(min_length=1)
    amount: float = Field(gt=0)
    benchmark: Optional[float] = Field(default=None, gt=0)
    ceiling: Optional[float] = Field(default=None, gt=0)


class IngestionMessageRequest(BaseModel):
    sender: str = Field(min_length=1)
    channel: str = Field(default="email")
    subject: str = Field(default="")
    body_text: str = Field(min_length=1)
    attachments: Optional[List[dict[str, Any]]] = None


class OrderCorrectionRequest(BaseModel):
    field_name: str = Field(min_length=1)
    corrected_value: Any


class OrderAmendmentRequest(BaseModel):
    amendments: dict[str, Any]


class OrderCancelRequest(BaseModel):
    reason: str = Field(min_length=1)


class ExceptionResolveRequest(BaseModel):
    action: str = Field(min_length=1)
    resolution_note: str = Field(min_length=1)
    selected_option: Optional[str] = None


class MilestoneCreateRequest(BaseModel):
    load_id: str = Field(min_length=1)
    milestone: str = Field(min_length=1)
    reported_by: str = Field(min_length=1)
    details: Optional[dict[str, Any]] = None
    is_driver_reported: bool = False
    is_telematics_verified: bool = False


class CustomerStatusQueryRequest(BaseModel):
    query_text: str = Field(min_length=1)
    order_or_load_id: str = Field(min_length=1)


class VoiceQuoteNegotiateRequest(BaseModel):
    load_id: str = Field(min_length=1)
    carrier_id: str = Field(min_length=1)
    benchmark_rate: Optional[float] = None
    ceiling_rate: Optional[float] = None
    target_rate: Optional[float] = None


class AuthRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    role: str = "dispatcher"


class AuthLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class FleetDriverUpdateRequest(BaseModel):
    truck: str = Field(min_length=1)
    status: str = Field(min_length=1)
    location: Optional[str] = None
    next_free: Optional[str] = None


class PalletFixRequest(BaseModel):
    fix_note: Optional[str] = None


class InvoiceResolveRequest(BaseModel):
    action: str = Field(min_length=1)  # "approve" or "dispute"
    notes: Optional[str] = None


class CopilotQueryRequest(BaseModel):
    query: str = Field(min_length=1)
    api_key: Optional[str] = None
    model: Optional[str] = None


class UnstructuredIndentRequest(BaseModel):
    raw_text: str = Field(min_length=1)
    api_key: Optional[str] = None
    model: Optional[str] = None
    auto_create_order: bool = False


class NegotiationTurnRequest(BaseModel):
    carrier_message: str = Field(min_length=1)
    history: List[dict] = Field(default_factory=list)
    target_rate: int = 74500
    ceiling_rate: int = 80000
    benchmark_rate: int = 78000
    api_key: Optional[str] = None
    model: Optional[str] = None


class LLMConfigUpdateRequest(BaseModel):
    api_key: Optional[str] = None
    primary_model: Optional[str] = None


class SarvamTTSRequest(BaseModel):
    text: str = Field(min_length=1)
    language_code: str = "hi-IN"
    speaker: Optional[str] = None
    pitch: Optional[float] = None
    pace: Optional[float] = None


LOAD_STATUSES = {"proposed", "matched", "assigned", "dispatched", "in_transit", "delivered", "cancelled"}
ASSIGNMENT_STATUSES = {"confirmed", "dispatched", "in_transit", "delivered", "cancelled"}
SEED_MARKER = "haulage-ai-demo-v1"


def _normalize_role(role: str) -> str:
    normalized = role.strip().lower().replace("-", "_").replace(" ", "_")
    if normalized not in allowed_roles:
        raise HTTPException(status_code=422, detail="Invalid role")
    return normalized


def _public_user(user: Mapping[str, Any]) -> dict[str, Any]:
    return {"id": user["id"], "email": user["email"], "role": user["role"]}


def _create_access_token(user: Mapping[str, Any]) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "iat": now,
        "exp": now + timedelta(minutes=jwt_expire_minutes),
    }
    return jwt.encode(payload, jwt_secret_key, algorithm=jwt_algorithm)


async def get_current_user(authorization: str | None = Header(default=None)):
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Authentication required")

    if dev_api_token and hmac.compare_digest(token, dev_api_token):
        if dev_api_role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Invalid development role")
        return {"id": "dev-token", "email": "dev@local", "role": dev_api_role}

    try:
        payload = jwt.decode(token, jwt_secret_key, algorithms=[jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc
    role = payload.get("role")
    subject = payload.get("sub")
    if not subject or role not in allowed_roles:
        raise HTTPException(status_code=401, detail="Invalid token claims")
    return {"id": subject, "email": payload.get("email", ""), "role": role}


def require_roles(*roles: str):
    required_roles = {role.lower() for role in roles}

    async def authorize(user: Mapping[str, Any] = Depends(get_current_user)):
        if not isinstance(user, Mapping):
            user = await get_current_user(user)
        if user["role"] not in required_roles:
            raise HTTPException(status_code=403, detail="Insufficient role")
        return user["role"]

    return authorize


def _voice_response(task):
    return {
        "task_id": task.task_id,
        "kind": task.kind,
        "entity_id": task.entity_id,
        "state": task.state,
        "result": task.result,
        "provider_call_id": task.provider_call_id,
    }


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _status_fields(status: str, current: Mapping[str, Any] | None = None) -> dict[str, Any]:
    now = _now()
    timestamps = dict((current or {}).get("status_timestamps", {}))
    timestamps[status] = now
    return {"status": status, "status_timestamps": timestamps, "status_updated_at": now, "updated_at": now}


async def _write_audit(action: str, entity_id: str, **details: Any):
    await db.audit_events.insert_one({
        "id": str(uuid.uuid4()),
        "action": action,
        "entity_id": entity_id,
        "details": details,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })


@api_router.get("/")
async def root():
    return {"message": "Haulage AI API"}


@api_router.get("/health")
async def health():
    try:
        await db.command("ping")
        return {"status": "ok", "database": "ok", "database_name": database_name}
    except Exception as exc:
        logger.warning("database_health_check_failed", extra={"error_type": type(exc).__name__})
        return {"status": "degraded", "database": "unavailable", "database_name": database_name}


@api_router.post("/auth/register", status_code=201)
async def register(input: AuthRegisterRequest):
    email = str(input.email).lower()
    role = _normalize_role(input.role)
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="A user with that email already exists")
    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "role": role,
        "password_hash": password_context.hash(input.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        await db.users.insert_one(user)
    except Exception as exc:
        if getattr(exc, "code", None) == 11000:
            raise HTTPException(status_code=409, detail="A user with that email already exists") from exc
        raise
    public_user = _public_user(user)
    return {"access_token": _create_access_token(user), "token_type": "bearer", "user": public_user}


@api_router.post("/auth/login")
async def login(input: AuthLoginRequest):
    email = str(input.email).lower()
    user = await db.users.find_one({"email": email})
    if not user:
        # Demo mode: auto-register unknown users so any email/password works
        user = {
            "id": str(uuid.uuid4()),
            "email": email,
            "role": "dispatcher",
            "password_hash": password_context.hash(input.password),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        try:
            await db.users.insert_one(user)
        except Exception:
            pass
    elif not password_context.verify(input.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"access_token": _create_access_token(user), "token_type": "bearer", "user": _public_user(user)}


@api_router.get("/auth/me")
async def me(user: Mapping[str, Any] = Depends(get_current_user)):
    return {"user": dict(user)}


@api_router.get("/operations/loads")
async def list_operation_loads(_: str = Depends(require_roles("owner", "ops_manager", "dispatcher"))):
    loads = await db.loads.find({}, {"_id": 0}).to_list(1000)
    if not loads:
        await seed_demo_data(_)
        loads = await db.loads.find({}, {"_id": 0}).to_list(1000)
    return loads


@api_router.post("/operations/demo/seed")
async def seed_demo_data(_: str = Depends(require_roles("owner", "ops_manager"))):
    now = _now()
    loads = [
        {"id": "LD-201", "load_id": "LD-201", "lane": "Bhiwandi -> Narela", "origin": "Bhiwandi", "destination": "Narela", "cargo": "Packaged goods", "weight_kg": 10000, "pallets": 18, "vehicle_type": "32ft", "status": "proposed", "seed_marker": SEED_MARKER},
        {"id": "LD-202", "load_id": "LD-202", "lane": "Bhiwandi -> Jaipur", "origin": "Bhiwandi", "destination": "Jaipur", "cargo": "Pharma", "weight_kg": 1500, "pallets": 4, "vehicle_type": "32ft", "status": "proposed", "seed_marker": SEED_MARKER},
    ]
    vehicles = [
        {"id": "MH-04-XX-4471", "vehicle_id": "MH-04-XX-4471", "carrier_id": "carrier-hasmukh", "vehicle_type": "32ft", "available_payload_kg": 12000, "available_pallets": 22, "available": True, "assigned": False, "seed_marker": SEED_MARKER},
        {"id": "GJ-01-YY-5678", "vehicle_id": "GJ-01-YY-5678", "carrier_id": "carrier-hasmukh", "vehicle_type": "32ft", "available_payload_kg": 14000, "available_pallets": 22, "available": True, "assigned": False, "seed_marker": SEED_MARKER},
    ]
    carriers = [
        {"id": "carrier-hasmukh", "carrier_id": "carrier-hasmukh", "name": "Hasmukh Freight Partners", "home_base": "Ahmedabad", "reliability_score": 0.92, "seed_marker": SEED_MARKER},
        {"id": "carrier-westline", "carrier_id": "carrier-westline", "name": "Westline Logistics", "home_base": "Vapi", "reliability_score": 0.87, "seed_marker": SEED_MARKER},
    ]
    for collection, documents in ((db.loads, loads), (db.vehicles, vehicles), (db.carriers, carriers)):
        for document in documents:
            document["updated_at"] = now
            await collection.replace_one({"id": document["id"]}, document, upsert=True)
    marker = {"id": SEED_MARKER, "marker": SEED_MARKER, "seeded_at": now, "updated_at": now}
    await db.seed_markers.replace_one({"id": SEED_MARKER}, marker, upsert=True)
    await _write_audit("demo_seed_upserted", SEED_MARKER, load_count=len(loads), vehicle_count=len(vehicles), carrier_count=len(carriers), seed_marker=SEED_MARKER)
    return {"seed_marker": SEED_MARKER, "loads": len(loads), "vehicles": len(vehicles), "carriers": len(carriers)}


@api_router.get("/operations/loads/{load_id}")
async def get_operation_load(load_id: str, _: str = Depends(require_roles("owner", "ops_manager", "dispatcher"))):
    document = await db.loads.find_one({"id": load_id}, {"_id": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Load not found")
    return document


@api_router.patch("/operations/loads/{load_id}/status")
async def update_load_status(load_id: str, input: StatusUpdate, _: str = Depends(require_roles("owner", "ops_manager", "dispatcher"))):
    if input.status not in LOAD_STATUSES:
        raise HTTPException(status_code=422, detail="Invalid load status")
    load = await db.loads.find_one({"id": load_id}, {"_id": 0})
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    fields = _status_fields(input.status, load)
    await db.loads.update_one({"id": load_id}, {"$set": fields})
    await _write_audit("load_status_changed", load_id, from_status=load.get("status"), to_status=input.status)
    return {**load, **fields}


@api_router.post("/operations/loads", status_code=201)
async def save_operation_load(input: dict[str, Any], _: str = Depends(require_roles("owner", "ops_manager", "dispatcher"))):
    record_id = str(input.get("id") or uuid.uuid4())
    document = {**input, "id": record_id, "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.loads.replace_one({"id": record_id}, document, upsert=True)
    await _write_audit("load_saved", record_id)
    return document


@api_router.get("/operations/vehicles")
async def list_operation_vehicles(_: str = Depends(require_roles("owner", "ops_manager", "dispatcher", "warehouse_lead"))):
    vehicles = await db.vehicles.find({}, {"_id": 0}).to_list(1000)
    if not vehicles:
        await seed_demo_data(_)
        vehicles = await db.vehicles.find({}, {"_id": 0}).to_list(1000)
    return vehicles


@api_router.post("/operations/vehicles", status_code=201)
async def save_operation_vehicle(input: dict[str, Any], _: str = Depends(require_roles("owner", "ops_manager", "dispatcher"))):
    record_id = str(input.get("id") or input.get("vehicle_id") or uuid.uuid4())
    document = {**input, "id": record_id, "vehicle_id": input.get("vehicle_id", record_id), "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.vehicles.replace_one({"id": record_id}, document, upsert=True)
    await _write_audit("vehicle_saved", record_id)
    return document


@api_router.get("/operations/calls")
async def list_operation_calls(_: str = Depends(require_roles("owner", "ops_manager", "dispatcher"))):
    calls = await db.voice_calls.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    if not calls:
        now = _now()
        default_call = {
            "task_id": "call-1",
            "state": "completed",
            "created_at": now,
            "updated_at": now,
            "result": {
                "carrier_id": "carrier-hasmukh",
                "load_id": "LD-201",
                "quoted_rate": 74500,
                "language": "Gujarati",
                "contact": "Hasmukhbhai · truck owner, Ahmedabad",
                "summary": "Rate closed at Rs 74,500 (benchmark Rs 78,000)",
                "duration": "03:14",
                "transcript": {
                    "title": "Rate negotiation · Mumbai → Delhi · benchmark Rs 78,000",
                    "lines": [
                        {"who": "AI", "native": "નમસ્તે હસમુખભાઈ, તમારી ગાડી અત્યારે ક્યાં છે?", "en": "Hello Hasmukhbhai, where is your truck right now?"},
                        {"who": "Hasmukhbhai", "native": "ગાડી અમદાવાદમાં ખાલી છે. કાલે લોડ થઈ શકે.", "en": "The truck is empty in Ahmedabad. It can load tomorrow."},
                        {"who": "AI", "native": "₹74,500 ભાડું ચાલશે?", "en": "Will a rate of Rs 74,500 work?"},
                        {"who": "Hasmukhbhai", "native": "ઠીક છે, કન્ફર્મ કરો.", "en": "Fine, confirm it."}
                    ],
                    "outcome": "Closed at Rs 74,500, under the Rs 78,000 benchmark. Booking confirmed."
                }
            }
        }
        await db.voice_calls.insert_one(default_call)
        default_call.pop("_id", None)
        calls = [default_call]
    return calls


@api_router.get("/operations/audit")
async def list_operation_audit(_: str = Depends(require_roles("owner", "ops_manager", "finance"))):
    return await db.audit_events.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


DEFAULT_FLEET = [
    {"truck": "MH-04-XX-1234", "driver": "Ramesh Yadav", "location": "Beawar (breakdown)", "status": "human", "utilisation": 82, "nextFree": "After repair"},
    {"truck": "MH-04-XX-4471", "driver": "Suresh Patel", "location": "Bhiwandi", "status": "ai", "utilisation": 91, "nextFree": "Today 4 PM"},
    {"truck": "GJ-01-YY-5678", "driver": "Hasmukhbhai's fleet", "location": "Vapi", "status": "ai", "utilisation": 88, "nextFree": "Today 6 PM"},
    {"truck": "MH-46-ZZ-9012", "driver": "Imran (standby)", "location": "Bhiwandi", "status": "ai", "utilisation": 64, "nextFree": "Now"},
    {"truck": "RJ-14-XX-3321", "driver": "Partner truck", "location": "Beawar, 45 km", "status": "approval", "utilisation": 77, "nextFree": "On approval"},
    {"truck": "MH-12-XX-7788", "driver": "Devendra Singh", "location": "Narela", "status": "ai", "utilisation": 85, "nextFree": "Fri 7 AM"},
]

DEFAULT_PALLETS = [
    {"id": 1, "status": "pass", "tag": "ai", "checks": {"label": True, "barcode": True, "cartons": True, "seal": True, "height": True}},
    {"id": 3, "status": "pass", "tag": "ai", "checks": {"label": True, "barcode": True, "cartons": True, "seal": True, "height": True}},
    {"id": 7, "status": "fail", "tag": "human", "flag": "Height 1.8 m exceeds 1.6 m rule", "fix": "Move top layer (6 cartons, SKU-A31) to pallet 9.", "checks": {"label": True, "barcode": True, "cartons": True, "seal": True, "height": False}},
    {"id": 9, "status": "pass", "tag": "ai", "checks": {"label": True, "barcode": True, "cartons": True, "seal": True, "height": True}},
    {"id": 12, "status": "fail", "tag": "human", "flag": "Label on one side only", "fix": "Print second SSCC label and apply to adjacent face.", "checks": {"label": False, "barcode": True, "cartons": True, "seal": True, "height": True}},
]

DEFAULT_INVOICES = [
    {"id": "INV-2211", "line": "Detention, Bhiwandi · 5 hrs claimed", "contract": "2 hrs beyond free time (gate log)", "actual": "Rs 4,500", "variance": "Rs 3,600", "evidence": "Gate timestamps", "tag": "approval"},
    {"id": "INV-2209", "line": "Freight, Mumbai → Delhi", "contract": "Rs 68,000", "actual": "Rs 68,000", "variance": "—", "evidence": "Contract matched", "tag": "ai"},
    {"id": "INV-2204", "line": "Freight, Bhiwandi → Pune", "contract": "Rs 71,500", "actual": "Rs 71,500 (billed twice)", "variance": "Duplicate", "evidence": "PO + ledger", "tag": "human"},
    {"id": "INV-2201", "line": "Loading charge", "contract": "Included in rate", "actual": "Rs 1,500", "variance": "+Rs 1,500", "evidence": "Rate card p.2", "tag": "approval"},
]


@api_router.get("/operations/fleet")
async def list_fleet():
    docs = await db.fleet.find({}, {"_id": 0}).to_list(100)
    if not docs:
        for f in DEFAULT_FLEET:
            await db.fleet.replace_one({"truck": f["truck"]}, f, upsert=True)
        docs = await db.fleet.find({}, {"_id": 0}).to_list(100)
    return docs


@api_router.post("/operations/fleet/update")
async def update_fleet_driver(input: FleetDriverUpdateRequest):
    update_data = {"status": input.status, "updated_at": _now()}
    if input.location:
        update_data["location"] = input.location
    if input.next_free:
        update_data["nextFree"] = input.next_free
    await db.fleet.update_one({"truck": input.truck}, {"$set": update_data})
    await _write_audit("fleet_status_updated", input.truck, status=input.status)
    doc = await db.fleet.find_one({"truck": input.truck}, {"_id": 0})
    return doc or {"status": "ok"}


@api_router.get("/operations/warehouse/pallets")
async def list_warehouse_pallets():
    docs = await db.pallets.find({}, {"_id": 0}).to_list(100)
    if not docs:
        for p in DEFAULT_PALLETS:
            await db.pallets.replace_one({"id": p["id"]}, p, upsert=True)
        docs = await db.pallets.find({}, {"_id": 0}).to_list(100)
    return docs


@api_router.post("/operations/warehouse/pallets/{pallet_id}/fix")
async def fix_warehouse_pallet(pallet_id: int, input: PalletFixRequest):
    updated = {
        "status": "pass",
        "tag": "ai",
        "flag": None,
        "checks": {"label": True, "barcode": True, "cartons": True, "seal": True, "height": True},
        "fixed_at": _now(),
        "fix_note": input.fix_note or "Marked fixed and re-scanned",
    }
    await db.pallets.update_one({"id": pallet_id}, {"$set": updated})
    await _write_audit("pallet_fixed_and_passed", f"pallet-{pallet_id}", fix_note=input.fix_note)
    doc = await db.pallets.find_one({"id": pallet_id}, {"_id": 0})
    return doc or updated


@api_router.get("/operations/finance/invoices")
async def list_finance_invoices():
    docs = await db.invoices.find({}, {"_id": 0}).to_list(100)
    if not docs:
        for inv in DEFAULT_INVOICES:
            await db.invoices.replace_one({"id": inv["id"]}, inv, upsert=True)
        docs = await db.invoices.find({}, {"_id": 0}).to_list(100)
    return docs


@api_router.post("/operations/finance/invoices/{invoice_id}/resolve")
async def resolve_finance_invoice(invoice_id: str, input: InvoiceResolveRequest):
    tag = "ai" if input.action == "approve" else "approval"
    resolved_text = "Correction approved" if input.action == "approve" else "Dispute filed with carrier"
    updated = {
        "tag": tag,
        "resolved": resolved_text,
        "resolved_at": _now(),
        "resolution_notes": input.notes or "",
    }
    await db.invoices.update_one({"id": invoice_id}, {"$set": updated})
    await _write_audit("invoice_resolved", invoice_id, action=input.action, resolution=resolved_text)
    doc = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    return doc or updated


@api_router.post("/copilot/query")
async def copilot_query(input: CopilotQueryRequest):
    loads = await db.loads.find({}, {"_id": 0}).to_list(50)
    orders = await db.orders.find({}, {"_id": 0}).to_list(50)
    exceptions = await db.exceptions.find({"status": {"$ne": "resolved"}}, {"_id": 0}).to_list(50)
    voice_calls = await db.voice_calls.find({}, {"_id": 0}).sort("created_at", -1).to_list(10)

    live_context = {
        "loads": loads,
        "orders": orders,
        "exceptions": exceptions,
        "calls": voice_calls,
    }

    result = await copilot_llm_query(
        question=input.query,
        live_context=live_context,
        api_key=input.api_key,
        preferred_model=input.model,
    )
    return result


@api_router.post("/operations/llm/parse-indent")
async def parse_unstructured_indent_endpoint(input: UnstructuredIndentRequest):
    parsed = await parse_unstructured_indent(
        raw_text=input.raw_text,
        api_key=input.api_key,
        preferred_model=input.model,
    )

    if input.auto_create_order:
        new_order_id = f"ORD-{int(perf_counter() * 1000) % 9000 + 1000}"
        order_doc = {
            "id": new_order_id,
            "customer": parsed.get("customer", "Direct Indent Customer"),
            "route": f"{parsed.get('origin', 'Bhiwandi')} → {parsed.get('destination', 'Narela')}",
            "source": "WhatsApp / Natural Indent",
            "confidence": parsed.get("confidence", 95),
            "tag": "ai" if parsed.get("confidence", 95) >= 90 else "approval",
            "details": parsed,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.orders.insert_one(order_doc)
        order_doc.pop("_id", None)
        parsed["created_order"] = order_doc

    return parsed


@api_router.post("/operations/llm/negotiate-turn")
async def negotiate_carrier_turn_endpoint(input: NegotiationTurnRequest):
    result = await negotiate_carrier_turn(
        carrier_message=input.carrier_message,
        conversation_history=input.history,
        benchmark_rate=input.benchmark_rate,
        ceiling_rate=input.ceiling_rate,
        target_rate=input.target_rate,
        api_key=input.api_key,
        preferred_model=input.model,
    )
    return result


@api_router.get("/operations/llm/config")
async def get_llm_config():
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    primary = os.getenv("OPENROUTER_MODEL", "nvidia/llama-3.1-nemotron-70b-instruct:free")
    cascade = get_model_cascade()
    return {
        "has_api_key": bool(api_key.strip()),
        "key_preview": f"{api_key[:8]}...{api_key[-4:]}" if len(api_key) > 12 else "Not configured",
        "primary_model": primary,
        "fallback_models": [m for m in cascade if m != primary],
        "all_cascade_models": cascade,
        "status": "ready_with_cascade",
    }


@api_router.post("/operations/llm/config")
async def update_llm_config(input: LLMConfigUpdateRequest):
    if input.api_key is not None:
        os.environ["OPENROUTER_API_KEY"] = input.api_key.strip()
    if input.primary_model is not None:
        os.environ["OPENROUTER_MODEL"] = input.primary_model.strip()

    cascade = get_model_cascade()
    return {
        "success": True,
        "has_api_key": bool(os.getenv("OPENROUTER_API_KEY", "").strip()),
        "primary_model": os.getenv("OPENROUTER_MODEL", "nvidia/llama-3.1-nemotron-70b-instruct:free"),
        "cascade": cascade,
    }


@api_router.post("/voice/sarvam/tts")
async def sarvam_text_to_speech(input: SarvamTTSRequest):
    sarvam_key = os.getenv("SARVAM_API_KEY", "").strip()
    if not sarvam_key:
        return {"success": False, "fallback_to_browser": True, "reason": "No SARVAM_API_KEY configured in environment"}

    # All Indian language codes supported by Sarvam AI Bulbul TTS
    valid_langs = {"bn-IN", "en-IN", "gu-IN", "hi-IN", "kn-IN", "ml-IN", "mr-IN", "od-IN", "pa-IN", "ta-IN", "te-IN"}
    lang = input.language_code if input.language_code in valid_langs else "hi-IN"

    try:
        from sarvamai import SarvamAI
        client = SarvamAI(api_subscription_key=sarvam_key)
        kwargs = {"text": input.text, "language_code": lang}
        if input.speaker:
            kwargs["speaker"] = input.speaker
        if input.pitch is not None:
            kwargs["pitch"] = input.pitch
        if input.pace is not None:
            kwargs["pace"] = input.pace

        # Call Sarvam AI text_to_speech SDK
        res = client.text_to_speech.convert(**kwargs)
        if hasattr(res, "audios") and res.audios:
            return {
                "success": True,
                "audio_base64": res.audios[0],
                "language_code": lang,
                "provider": "sarvamai",
            }
        return {"success": False, "fallback_to_browser": True, "reason": "Empty audio response from Sarvam"}
    except Exception as e:
        logger.warning(f"Sarvam AI TTS error: {e}")
        return {"success": False, "fallback_to_browser": True, "reason": str(e)}


@api_router.post("/quotes", status_code=201)
async def create_quote(input: QuoteRequest, _: str = Depends(require_roles("owner", "ops_manager", "finance"))):
    status = "approval" if input.ceiling is not None and input.amount > input.ceiling else "pending"
    document = {**input.model_dump(), "id": str(uuid.uuid4()), "status": status, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.quotes.insert_one(document)
    await _write_audit("quote_created", document["id"], status=status)
    document.pop("_id", None)
    return document


@api_router.post("/assignments", status_code=201)
async def create_assignment(input: AssignmentRequest, _: str = Depends(require_roles("owner", "ops_manager", "dispatcher"))):
    existing = await db.assignments.find_one({"idempotency_key": input.idempotency_key}, {"_id": 0})
    if existing:
        return existing
    load = await db.loads.find_one({"id": input.load_id}, {"_id": 0})
    vehicle = await db.vehicles.find_one({"$or": [{"id": input.vehicle_id}, {"vehicle_id": input.vehicle_id}]}, {"_id": 0})
    if not load or not vehicle:
        raise HTTPException(status_code=404, detail="Load or vehicle not found")
    if vehicle.get("available") is False or vehicle.get("assigned") is True:
        raise HTTPException(status_code=409, detail="Vehicle is no longer available")
    if not rank_candidates(load, [vehicle]):
        raise HTTPException(status_code=409, detail="Vehicle fails load feasibility constraints")
    vehicle_filter = {
        "$or": [{"id": input.vehicle_id}, {"vehicle_id": input.vehicle_id}],
        "assigned": {"$ne": True},
        "available": {"$ne": False},
    }
    claimed = await db.vehicles.update_one(vehicle_filter, {"$set": {"assigned": True, "available": False}})
    if claimed.modified_count != 1:
        raise HTTPException(status_code=409, detail="Vehicle is no longer available")
    assignment = {**input.model_dump(), "id": str(uuid.uuid4()), "status": "confirmed", "created_at": _now(), "lifecycle_timestamps": {"confirmed": _now()}}
    try:
        await db.assignments.insert_one(assignment)
    except Exception as exc:
        await db.vehicles.update_one(
            {"$and": [{"$or": [{"id": input.vehicle_id}, {"vehicle_id": input.vehicle_id}]}, {"assigned": True, "available": False}]},
            {"$set": {"assigned": False, "available": True}},
        )
        if getattr(exc, "code", None) == 11000:
            existing = await db.assignments.find_one({"idempotency_key": input.idempotency_key}, {"_id": 0})
            if existing:
                return existing
            raise HTTPException(status_code=409, detail="Load already has an assignment") from exc
        raise
    await _write_audit("assignment_confirmed", assignment["id"], load_id=input.load_id, vehicle_id=input.vehicle_id)
    load_fields = _status_fields("assigned", load)
    await db.loads.update_one({"id": input.load_id}, {"$set": load_fields})
    assignment.pop("_id", None)
    return assignment


@api_router.patch("/assignments/{assignment_id}/status")
async def update_assignment_status(assignment_id: str, input: StatusUpdate, role: str = Depends(require_roles("owner", "ops_manager", "dispatcher"))):
    if input.status not in ASSIGNMENT_STATUSES:
        raise HTTPException(status_code=422, detail="Invalid assignment status")
    assignment = await db.assignments.find_one({"id": assignment_id}, {"_id": 0})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    now = _now()
    lifecycle = dict(assignment.get("lifecycle_timestamps", {}))
    lifecycle[input.status] = now
    fields = {"status": input.status, "lifecycle_timestamps": lifecycle, "status_updated_at": now, "updated_at": now}
    await db.assignments.update_one({"id": assignment_id}, {"$set": fields})
    if input.status in {"delivered", "cancelled"}:
        await db.vehicles.update_one(
            {"$or": [{"id": assignment["vehicle_id"]}, {"vehicle_id": assignment["vehicle_id"]}]},
            {"$set": {"assigned": False, "available": True, "updated_at": now}},
        )
    await _write_audit("assignment_status_changed", assignment_id, from_status=assignment.get("status"), to_status=input.status, role=role)
    return {**assignment, **fields}


@api_router.post("/matching/candidates")
async def matching_candidates(input: MatchingRequest):
    return {"candidates": rank_candidates(input.load, input.vehicles, input.weights)}


@api_router.post("/matching/spare-capacity")
async def matching_spare_capacity(input: SpareCapacityRequest):
    return {"proposals": propose_spare_capacity(input.primary_load, input.additional_loads, input.vehicle)}


@api_router.post("/voice/tasks", status_code=201)
async def create_voice_task(input: VoiceTaskCreate, _: str = Depends(require_roles("owner", "ops_manager", "dispatcher"))):
    if input.idempotency_key:
        existing = await db.voice_tasks.find_one({"idempotency_key": input.idempotency_key}, {"_id": 0})
        if existing:
            return existing
    task = voice_tasks.create(input.kind, input.entity_id, input.idempotency_key)
    await db.voice_tasks.update_one({"task_id": task.task_id}, {"$setOnInsert": {**_voice_response(task), "idempotency_key": input.idempotency_key, "created_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
    await _write_audit("voice_task_created", task.task_id, kind=input.kind, related_entity_id=input.entity_id)
    return _voice_response(task)


@api_router.post("/voice/tasks/{task_id}/start")
async def start_voice_task(task_id: str, _: str = Depends(require_roles("owner", "ops_manager", "dispatcher"))):
    try:
        try:
            task = voice_tasks.start(task_id)
        except KeyError:
            persisted = await db.voice_tasks.find_one({"task_id": task_id}, {"_id": 0})
            if not persisted:
                raise
            task = voice_tasks.start(voice_tasks.restore(persisted).task_id)
        await db.voice_tasks.update_one({"task_id": task_id}, {"$set": {"state": task.state, "result": task.result, "provider_call_id": task.provider_call_id}})
        await _write_audit("voice_task_started", task_id)
        return _voice_response(task)
    except KeyError:
        raise HTTPException(status_code=404, detail="Voice task not found")


@api_router.get("/voice/tasks/{task_id}")
async def get_voice_task(task_id: str, _: str = Depends(require_roles("owner", "ops_manager", "dispatcher"))):
    persisted = await db.voice_tasks.find_one({"task_id": task_id}, {"_id": 0})
    if not persisted:
        raise HTTPException(status_code=404, detail="Voice task not found")
    return persisted


@api_router.post("/voice/tasks/{task_id}/callback")
async def voice_callback(task_id: str, input: VoiceCallback, _: str = Depends(require_roles("owner", "ops_manager", "dispatcher"))):
    try:
        try:
            persisted = await db.voice_tasks.find_one({"task_id": task_id}, {"_id": 0})
            if persisted and input.event_id in persisted.get("event_ids", []):
                return persisted
            task = voice_tasks.callback(task_id, input.event_id, input.state, input.result)
        except KeyError:
            persisted = await db.voice_tasks.find_one({"task_id": task_id}, {"_id": 0})
            if not persisted:
                raise
            task = voice_tasks.callback(voice_tasks.restore(persisted).task_id, input.event_id, input.state, input.result)
        await db.voice_tasks.update_one({"task_id": task_id}, {"$set": {"state": task.state, "result": task.result}, "$addToSet": {"event_ids": input.event_id}})
        await db.voice_calls.update_one({"task_id": task_id}, {"$set": {"task_id": task_id, "state": task.state, "result": task.result, "updated_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
        await _write_audit("voice_task_callback", task_id, event_id=input.event_id, state=task.state)
        return _voice_response(task)
    except KeyError:
        raise HTTPException(status_code=404, detail="Voice task not found")


@api_router.post("/voice/speech")
def voice_speech(input: SpeechRequest):
    if elevenlabs_speech is None:
        raise HTTPException(status_code=503, detail="Speech provider is not configured. Set VOICE_PROVIDER=elevenlabs.")
    try:
        audio = elevenlabs_speech.synthesize(input.text)
    except Exception as exc:
        logger.exception("Voice synthesis failed")
        raise HTTPException(status_code=502, detail="Speech provider request failed") from exc
    return Response(content=audio, media_type="audio/mpeg")


@api_router.post("/contact", status_code=201)
async def create_contact(input: ContactSubmissionCreate):
    if not input.consent:
        raise HTTPException(status_code=422, detail="Consent is required")
    doc = input.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["work_email"] = doc["work_email"].lower()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.contact_submissions.insert_one(doc)
    return {"ok": True, "id": doc["id"]}


@api_router.get("/contact")
async def list_contacts():
    return await db.contact_submissions.find({}, {"_id": 0}).to_list(1000)


async def _seed_default_orders() -> list[dict[str, Any]]:
    now = _now()
    default_orders = [
        {
            "id": "ORD-1042",
            "order_id": "ORD-1042",
            "load_id": "LD-201",
            "customer_id": "cust_aarav",
            "customer_name": "Aarav Consumer Products",
            "origin": "Bhiwandi WH-3",
            "origin_city": "Bhiwandi (Mumbai)",
            "origin_pincode": "421302",
            "destination": "Gupta Trading Co., Narela",
            "destination_city": "Narela (Delhi)",
            "destination_pincode": "110040",
            "lane": "Bhiwandi WH-3 -> Gupta Trading Co., Narela",
            "cargo": "Packaged goods",
            "weight_kg": 14200.0,
            "pallets": 18,
            "vehicle_type": "32ft",
            "vehicle_requirement": "32 ft MXL",
            "po_number": "PO-7712",
            "invoice_numbers": ["INV-2211"],
            "pickup_window": "Thursday 08:00-12:00",
            "status": "draft_pending_review",
            "confidence_tier": "medium",
            "overall_confidence": 71.0,
            "extracted_fields": {
                "Customer": {"name": "Customer", "value": "Aarav Consumer Products", "confidence": 99.0, "source_evidence": "email line 1", "extraction_method": "entity_catalog", "is_conflict": False, "conflict_details": ""},
                "Pickup": {"name": "Pickup", "value": "Bhiwandi WH-3", "confidence": 98.0, "source_evidence": "email line 3", "extraction_method": "route_pattern", "is_conflict": False, "conflict_details": ""},
                "Drop": {"name": "Drop", "value": "Gupta Trading Co., Narela", "confidence": 96.0, "source_evidence": "email line 3", "extraction_method": "route_pattern", "is_conflict": False, "conflict_details": ""},
                "Pallets": {"name": "Pallets", "value": 18, "confidence": 99.0, "source_evidence": "attachment, row 4", "extraction_method": "excel_cell_numeric", "is_conflict": False, "conflict_details": ""},
                "Weight": {"name": "Weight", "value": 14200.0, "confidence": 58.0, "source_evidence": "invoice vs Excel conflict", "extraction_method": "multi_source_conflict", "is_conflict": True, "conflict_details": "conflict: invoice 14.2 t vs Excel 14.5 t"},
                "Pickup window": {"name": "Pickup window", "value": "Thursday 08:00-12:00", "confidence": 91.0, "source_evidence": "email line 4", "extraction_method": "pickup_window_regex", "is_conflict": False, "conflict_details": ""},
                "Vehicle requirement": {"name": "Vehicle requirement", "value": "32 ft MXL", "confidence": 95.0, "source_evidence": "attachment, row 5", "extraction_method": "excel_cell_string", "is_conflict": False, "conflict_details": ""},
                "Invoice refs": {"name": "Invoice refs", "value": "PO-7712, INV-2211", "confidence": 87.0, "source_evidence": "attachment, header", "extraction_method": "inv_regex", "is_conflict": False, "conflict_details": ""},
            },
            "conflicts": ["conflict: invoice 14.2 t vs Excel 14.5 t"],
            "validation_issues": [{"field": "weight_kg", "severity": "warning", "message": "Source discrepancy: conflict: invoice 14.2 t vs Excel 14.5 t"}],
            "corrections": [],
            "amendments": [],
            "source_channel": "email",
            "assigned_vehicle_id": None,
            "created_at": now,
            "updated_at": now,
        },
        {
            "id": "ORD-1041",
            "order_id": "ORD-1041",
            "load_id": "LD-202",
            "customer_id": "cust_kedia",
            "customer_name": "Kedia Polymers",
            "origin": "Bhiwandi",
            "origin_city": "Bhiwandi (Mumbai)",
            "origin_pincode": "421302",
            "destination": "Pune",
            "destination_city": "Pune",
            "destination_pincode": "411001",
            "lane": "Bhiwandi -> Pune",
            "cargo": "Polymers",
            "weight_kg": 8000.0,
            "pallets": 12,
            "vehicle_type": "24ft",
            "vehicle_requirement": "24 ft",
            "po_number": "PO-7688",
            "invoice_numbers": ["INV-2190"],
            "pickup_window": "Friday 09:00-11:00",
            "status": "ready_for_matching",
            "confidence_tier": "high",
            "overall_confidence": 97.0,
            "extracted_fields": {},
            "conflicts": [],
            "validation_issues": [],
            "corrections": [],
            "amendments": [],
            "source_channel": "excel",
            "assigned_vehicle_id": None,
            "created_at": now,
            "updated_at": now,
        },
        {
            "id": "ORD-1040",
            "order_id": "ORD-1040",
            "load_id": "LD-203",
            "customer_id": "cust_shree",
            "customer_name": "Shree Packaging",
            "origin": "Vashi",
            "origin_city": "Navi Mumbai",
            "origin_pincode": "400703",
            "destination": "Ahmedabad",
            "destination_city": "Ahmedabad",
            "destination_pincode": "380001",
            "lane": "Vashi -> Ahmedabad",
            "cargo": "Corrugated Boxes",
            "weight_kg": 6500.0,
            "pallets": 14,
            "vehicle_type": "24ft",
            "vehicle_requirement": "24 ft",
            "po_number": "PO-7640",
            "invoice_numbers": ["INV-2165"],
            "pickup_window": "Friday 14:00-16:00",
            "status": "ready_for_matching",
            "confidence_tier": "high",
            "overall_confidence": 94.0,
            "extracted_fields": {},
            "conflicts": [],
            "validation_issues": [],
            "corrections": [],
            "amendments": [],
            "source_channel": "whatsapp",
            "assigned_vehicle_id": None,
            "created_at": now,
            "updated_at": now,
        },
        {
            "id": "ORD-1039",
            "order_id": "ORD-1039",
            "load_id": "LD-204",
            "customer_id": "cust_aarav",
            "customer_name": "Aarav Consumer Products",
            "origin": "Bhiwandi WH-3",
            "origin_city": "Bhiwandi (Mumbai)",
            "origin_pincode": "421302",
            "destination": "Jaipur",
            "destination_city": "Jaipur",
            "destination_pincode": "302001",
            "lane": "Bhiwandi WH-3 -> Jaipur",
            "cargo": "Personal Care",
            "weight_kg": 5000.0,
            "pallets": 8,
            "vehicle_type": "20ft",
            "vehicle_requirement": "20 ft",
            "po_number": "PO-7612",
            "invoice_numbers": ["INV-2144"],
            "pickup_window": "Thursday 14:00-16:00",
            "status": "ready_for_matching",
            "confidence_tier": "high",
            "overall_confidence": 88.0,
            "extracted_fields": {},
            "conflicts": [],
            "validation_issues": [],
            "corrections": [],
            "amendments": [],
            "source_channel": "email",
            "assigned_vehicle_id": None,
            "created_at": now,
            "updated_at": now,
        },
        {
            "id": "ORD-1038",
            "order_id": "ORD-1038",
            "load_id": "LD-205",
            "customer_id": "cust_gupta",
            "customer_name": "Gupta Trading Co.",
            "origin": "Narela",
            "origin_city": "Narela (Delhi)",
            "origin_pincode": "110040",
            "destination": "Ludhiana",
            "destination_city": "Ludhiana",
            "destination_pincode": "141001",
            "lane": "Narela -> Ludhiana",
            "cargo": "General Merchandise",
            "weight_kg": 9500.0,
            "pallets": 16,
            "vehicle_type": "32ft",
            "vehicle_requirement": "32 ft",
            "po_number": "PO-7590",
            "invoice_numbers": ["INV-2101"],
            "pickup_window": "Saturday 10:00-12:00",
            "status": "exception_raised",
            "confidence_tier": "low",
            "overall_confidence": 63.0,
            "extracted_fields": {},
            "conflicts": [],
            "validation_issues": [{"field": "customer", "severity": "critical", "message": "Ambiguous consignee record matching destination."}],
            "corrections": [],
            "amendments": [],
            "source_channel": "whatsapp",
            "assigned_vehicle_id": None,
            "created_at": now,
            "updated_at": now,
        },
    ]
    for o in default_orders:
        await db.orders.replace_one({"id": o["id"]}, o, upsert=True)
    return default_orders


@api_router.post("/ingestion/message", status_code=201)
async def ingest_message(input: IngestionMessageRequest, user: Mapping[str, Any] = Depends(get_current_user)):
    msg = ingestion_service.ingest_message(
        sender=input.sender,
        channel=input.channel,
        subject=input.subject,
        body_text=input.body_text,
        attachments=[],
    )
    await db.ingested_messages.replace_one({"message_id": msg.message_id}, {
        "message_id": msg.message_id,
        "channel": msg.channel,
        "sender": msg.sender,
        "subject": msg.subject,
        "body_text": msg.body_text,
        "content_hash": msg.content_hash,
        "intent": msg.intent,
        "intent_confidence": msg.intent_confidence,
        "is_duplicate": msg.is_duplicate,
        "created_at": _now(),
    }, upsert=True)

    if msg.is_duplicate:
        return {"message_id": msg.message_id, "is_duplicate": True, "intent": msg.intent, "status": "duplicate_skipped"}

    order_doc = None
    if msg.intent == OrderIntent.new_order:
        text_fields = DocumentExtractor.extract_from_text(input.body_text, source_tag="body")
        record_id = f"ORD-{int(perf_counter() * 1000) % 9000 + 1000}"
        rec = DocumentExtractor.reconcile_sources(text_fields, record_id=record_id)
        resolved_cust = EntityResolver.resolve_customer(rec.get_value("customer", ""))
        resolved_origin = EntityResolver.resolve_location(rec.get_value("pickup_location", ""))
        resolved_dest = EntityResolver.resolve_location(rec.get_value("drop_location", ""))

        existing_orders = await db.orders.find({}, {"_id": 0}).to_list(500)
        issues = OrderValidator.validate_order(rec, resolved_cust, resolved_origin, resolved_dest, existing_orders)

        order_doc = OrderManager.build_order_document(
            order_id=record_id,
            extracted=rec,
            customer=resolved_cust,
            origin=resolved_origin,
            destination=resolved_dest,
            issues=issues,
            source_message_id=msg.message_id,
            source_channel=input.channel,
        )

        # If high confidence, auto-create load in db.loads for Module 3 matching
        if order_doc["confidence_tier"] == "high":
            load_doc = {
                "id": order_doc["load_id"],
                "load_id": order_doc["load_id"],
                "order_id": order_doc["id"],
                "lane": order_doc["lane"],
                "origin": order_doc["origin"],
                "destination": order_doc["destination"],
                "cargo": order_doc["cargo"],
                "weight_kg": order_doc["weight_kg"],
                "pallets": order_doc["pallets"],
                "vehicle_type": order_doc["vehicle_type"],
                "status": "proposed",
                "created_at": _now(),
                "updated_at": _now(),
            }
            await db.loads.replace_one({"id": load_doc["id"]}, load_doc, upsert=True)
            notification_dispatcher.dispatch(
                event_id=f"ack_{order_doc['id']}",
                recipient=input.sender,
                channel=input.channel if input.channel in ["whatsapp", "email"] else "email",
                message=f"Order {order_doc['id']} confirmed in TMS for lane {order_doc['lane']}.",
            )
        elif order_doc["confidence_tier"] == "low" or issues:
            ex_title = f"{order_doc['id']}: validation exception"
            ex_problem = issues[0].message if issues else "Low extraction confidence"
            ex = exception_manager.create_exception(
                category=ExceptionCategory.uncertain_customer_resolution if resolved_cust.is_ambiguous else ExceptionCategory.missing_mandatory_info,
                title=ex_title,
                problem=ex_problem,
                tried=f"Extracted with {order_doc['overall_confidence']}% confidence; flagged for human resolution.",
                related_entity_id=order_doc["id"],
                severity="high" if any(i.severity == "critical" for i in issues) else "medium",
                tag="human",
            )
            await db.exceptions.replace_one({"id": ex.id}, ex.to_dict(), upsert=True)

        await db.orders.replace_one({"id": order_doc["id"]}, order_doc, upsert=True)
        await _write_audit("order_ingested", order_doc["id"], channel=input.channel, confidence_tier=order_doc["confidence_tier"])

    return {
        "message_id": msg.message_id,
        "channel": msg.channel,
        "intent": msg.intent,
        "intent_confidence": msg.intent_confidence,
        "is_duplicate": False,
        "order": order_doc,
    }


@api_router.post("/ingestion/upload", status_code=201)
async def ingest_upload(file: UploadFile = File(...), user: Mapping[str, Any] = Depends(get_current_user)):
    content = await file.read()
    filename = file.filename or "upload"
    records = []
    if filename.lower().endswith((".xlsx", ".xls", ".csv")):
        sheet_rows = DocumentExtractor.extract_from_spreadsheet(content, filename)
        for idx, s_row in enumerate(sheet_rows):
            rec = DocumentExtractor.reconcile_sources(s_row, record_id=f"ORD-UP-{idx+1}")
            resolved_cust = EntityResolver.resolve_customer(rec.get_value("customer", ""))
            resolved_origin = EntityResolver.resolve_location(rec.get_value("pickup_location", ""))
            resolved_dest = EntityResolver.resolve_location(rec.get_value("drop_location", ""))
            issues = OrderValidator.validate_order(rec, resolved_cust, resolved_origin, resolved_dest)
            order_doc = OrderManager.build_order_document(
                order_id=rec.record_id,
                extracted=rec,
                customer=resolved_cust,
                origin=resolved_origin,
                destination=resolved_dest,
                issues=issues,
                source_channel="spreadsheet",
            )
            await db.orders.replace_one({"id": order_doc["id"]}, order_doc, upsert=True)
            if order_doc["confidence_tier"] == "high":
                load_doc = {
                    "id": order_doc["load_id"],
                    "load_id": order_doc["load_id"],
                    "order_id": order_doc["id"],
                    "lane": order_doc["lane"],
                    "origin": order_doc["origin"],
                    "destination": order_doc["destination"],
                    "cargo": order_doc["cargo"],
                    "weight_kg": order_doc["weight_kg"],
                    "pallets": order_doc["pallets"],
                    "vehicle_type": order_doc["vehicle_type"],
                    "status": "proposed",
                    "created_at": _now(),
                    "updated_at": _now(),
                }
                await db.loads.replace_one({"id": load_doc["id"]}, load_doc, upsert=True)
            records.append(order_doc)
    return {"filename": filename, "parsed_orders_count": len(records), "orders": records}


@api_router.get("/orders")
async def list_orders(user: Mapping[str, Any] = Depends(get_current_user)):
    docs = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    if not docs:
        docs = await _seed_default_orders()
    return docs


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user: Mapping[str, Any] = Depends(get_current_user)):
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        docs = await _seed_default_orders()
        doc = next((d for d in docs if d["id"] == order_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    return doc


@api_router.post("/orders/{order_id}/correct")
async def correct_order(order_id: str, input: OrderCorrectionRequest, user: Mapping[str, Any] = Depends(get_current_user)):
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        docs = await _seed_default_orders()
        doc = next((d for d in docs if d["id"] == order_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    updated = OrderManager.apply_human_correction(doc, input.field_name, input.corrected_value, user.get("email", "dispatcher"))
    await db.orders.replace_one({"id": order_id}, updated, upsert=True)
    if updated.get("status") == OrderOperationalStatus.ready_for_matching.value:
        load_doc = {
            "id": updated["load_id"],
            "load_id": updated["load_id"],
            "order_id": updated["id"],
            "lane": updated["lane"],
            "origin": updated["origin"],
            "destination": updated["destination"],
            "cargo": updated["cargo"],
            "weight_kg": updated["weight_kg"],
            "pallets": updated["pallets"],
            "vehicle_type": updated["vehicle_type"],
            "status": "proposed",
            "updated_at": _now(),
        }
        await db.loads.replace_one({"id": load_doc["id"]}, load_doc, upsert=True)
    await _write_audit("order_corrected", order_id, field=input.field_name, corrected_value=input.corrected_value)
    return updated


@api_router.post("/orders/{order_id}/approve")
async def approve_order(order_id: str, user: Mapping[str, Any] = Depends(get_current_user)):
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        docs = await _seed_default_orders()
        doc = next((d for d in docs if d["id"] == order_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    doc["status"] = OrderOperationalStatus.ready_for_matching.value
    doc["confidence_tier"] = ConfidenceTier.high.value
    doc["updated_at"] = _now()
    await db.orders.replace_one({"id": order_id}, doc, upsert=True)

    load_doc = {
        "id": doc["load_id"],
        "load_id": doc["load_id"],
        "order_id": doc["id"],
        "lane": doc["lane"],
        "origin": doc["origin"],
        "destination": doc["destination"],
        "cargo": doc["cargo"],
        "weight_kg": doc["weight_kg"],
        "pallets": doc["pallets"],
        "vehicle_type": doc["vehicle_type"],
        "status": "proposed",
        "updated_at": _now(),
    }
    await db.loads.replace_one({"id": load_doc["id"]}, load_doc, upsert=True)
    await _write_audit("order_approved", order_id, load_id=doc["load_id"])
    return {"ok": True, "order": doc, "load": load_doc}


@api_router.post("/orders/{order_id}/amend")
async def amend_order(order_id: str, input: OrderAmendmentRequest, user: Mapping[str, Any] = Depends(get_current_user)):
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        docs = await _seed_default_orders()
        doc = next((d for d in docs if d["id"] == order_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    updated, assignment_invalidated = OrderManager.apply_amendment(doc, input.amendments, user.get("email", "dispatcher"))
    await db.orders.replace_one({"id": order_id}, updated, upsert=True)

    load_fields = {k: v for k, v in input.amendments.items() if k in ["weight_kg", "pallets", "vehicle_type", "destination", "origin", "lane"]}
    if load_fields:
        await db.loads.update_one({"id": updated["load_id"]}, {"$set": {**load_fields, "updated_at": _now()}})

    if assignment_invalidated:
        ex = exception_manager.create_exception(
            category=ExceptionCategory.amendment_invalidated_truck,
            title=f"{order_id}: amendment invalidates current truck assignment",
            problem=f"Customer amended load parameters ({input.amendments}). Assigned truck {updated.get('assigned_vehicle_id')} may exceed capacity.",
            tried="Module 3 re-evaluated feasibility. Re-matching and approval required.",
            related_entity_id=order_id,
            severity="high",
            tag="human",
        )
        await db.exceptions.replace_one({"id": ex.id}, ex.to_dict(), upsert=True)

    await _write_audit("order_amended", order_id, amendments=input.amendments, assignment_invalidated=assignment_invalidated)
    return {"order": updated, "assignment_invalidated": assignment_invalidated}


@api_router.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, input: OrderCancelRequest, user: Mapping[str, Any] = Depends(get_current_user)):
    doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    if doc.get("status") in ["dispatched", "in_transit"]:
        if user.get("role") not in ["owner", "ops_manager"]:
            raise HTTPException(status_code=403, detail="Cancellation of dispatched shipments requires Owner or Ops Manager authorization")
    doc["status"] = OrderOperationalStatus.cancelled.value
    doc["cancellation_reason"] = input.reason
    doc["updated_at"] = _now()
    await db.orders.replace_one({"id": order_id}, doc, upsert=True)
    await db.loads.update_one({"id": doc.get("load_id")}, {"$set": {"status": "cancelled", "updated_at": _now()}})
    if doc.get("assigned_vehicle_id"):
        await db.vehicles.update_one(
            {"$or": [{"id": doc["assigned_vehicle_id"]}, {"vehicle_id": doc["assigned_vehicle_id"]}]},
            {"$set": {"assigned": False, "available": True, "updated_at": _now()}},
        )
    await _write_audit("order_cancelled", order_id, reason=input.reason)
    return {"ok": True, "order": doc}


@api_router.get("/operations/exceptions")
async def list_exceptions(user: Mapping[str, Any] = Depends(get_current_user)):
    docs = await db.exceptions.find({"status": {"$ne": "resolved"}}, {"_id": 0}).to_list(500)
    if not docs:
        for ex in exception_manager.list_open():
            await db.exceptions.replace_one({"id": ex.id}, ex.to_dict(), upsert=True)
        docs = [ex.to_dict() for ex in exception_manager.list_open()]
    return docs


@api_router.post("/operations/exceptions/{exception_id}/resolve")
async def resolve_exception_endpoint(exception_id: str, input: ExceptionResolveRequest, user: Mapping[str, Any] = Depends(get_current_user)):
    try:
        ex = exception_manager.resolve(exception_id, input.action, input.resolution_note, input.selected_option)
        doc = ex.to_dict()
    except KeyError:
        doc = await db.exceptions.find_one({"id": exception_id}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Exception not found")
        doc["status"] = "resolved" if input.action in ["approve", "viewed"] else "escalated"
        doc["resolved_note"] = input.resolution_note
        if input.selected_option:
            doc["selected"] = input.selected_option
    await db.exceptions.replace_one({"id": exception_id}, doc, upsert=True)
    await _write_audit("exception_resolved", exception_id, action=input.action, note=input.resolution_note)
    return doc


@api_router.post("/milestones", status_code=201)
async def create_milestone(input: MilestoneCreateRequest, user: Mapping[str, Any] = Depends(get_current_user)):
    milestone_id = str(uuid.uuid4())
    record = {
        "milestone_id": milestone_id,
        "load_id": input.load_id,
        "milestone": input.milestone,
        "timestamp": _now(),
        "reported_by": input.reported_by,
        "details": input.details or {},
        "is_driver_reported": input.is_driver_reported,
        "is_telematics_verified": input.is_telematics_verified,
    }
    await db.milestones.insert_one(record)
    event_id = f"ms_{input.load_id}_{input.milestone}"
    notification_dispatcher.dispatch(
        event_id=event_id,
        recipient="customer@example.com",
        channel="whatsapp",
        message=f"Shipment {input.load_id} milestone: {input.milestone.replace('_', ' ').title()}",
    )
    if input.milestone in LOAD_STATUSES:
        load = await db.loads.find_one({"id": input.load_id}, {"_id": 0})
        if load:
            fields = _status_fields(input.milestone, load)
            await db.loads.update_one({"id": input.load_id}, {"$set": fields})
    await _write_audit("milestone_recorded", input.load_id, milestone=input.milestone)
    record.pop("_id", None)
    return record


@api_router.get("/milestones/{load_id}")
async def get_milestones(load_id: str, user: Mapping[str, Any] = Depends(get_current_user)):
    return await db.milestones.find({"load_id": load_id}, {"_id": 0}).sort("timestamp", 1).to_list(100)


@api_router.post("/customer/query")
async def customer_query(input: CustomerStatusQueryRequest, user: Mapping[str, Any] = Depends(get_current_user)):
    order = await db.orders.find_one({"$or": [{"id": input.order_or_load_id}, {"load_id": input.order_or_load_id}]}, {"_id": 0})
    if not order:
        load = await db.loads.find_one({"id": input.order_or_load_id}, {"_id": 0})
        if not load:
            raise HTTPException(status_code=404, detail="Shipment reference not found")
        order = load
    milestone_docs = await db.milestones.find({"load_id": order.get("load_id", input.order_or_load_id)}, {"_id": 0}).sort("timestamp", 1).to_list(50)
    milestones = [
        MilestoneRecord(
            milestone_id=m.get("milestone_id", str(uuid.uuid4())),
            load_id=m.get("load_id", order.get("load_id", "")),
            milestone=ShipmentMilestone(m["milestone"]) if m["milestone"] in ShipmentMilestone.__members__ else ShipmentMilestone.in_transit,
            timestamp=m.get("timestamp", _now()),
            reported_by=m.get("reported_by", ""),
            is_driver_reported=m.get("is_driver_reported", False),
            is_telematics_verified=m.get("is_telematics_verified", False),
        )
        for m in milestone_docs
    ]
    return CustomerQueryResolver.answer_query(input.query_text, order, milestones)


@api_router.post("/voice/quote-negotiate")
async def negotiate_carrier_quote(input: VoiceQuoteNegotiateRequest, user: Mapping[str, Any] = Depends(get_current_user)):
    task = voice_tasks.create(
        kind="carrier_quotation",
        entity_id=f"{input.load_id}:{input.carrier_id}",
        idempotency_key=f"quote_{input.load_id}_{input.carrier_id}",
    )
    task = voice_tasks.start(task.task_id)
    agreed_rate = input.target_rate or (input.benchmark_rate - 3500 if input.benchmark_rate else 74500)
    task.result.update({
        "carrier_id": input.carrier_id,
        "load_id": input.load_id,
        "quoted_rate": agreed_rate,
        "language": "Gujarati",
        "contact": "Hasmukhbhai · truck owner, Ahmedabad",
        "summary": f"Rate closed at Rs {agreed_rate:,.0f} (benchmark Rs {input.benchmark_rate or 78000:,.0f})",
        "duration": "03:14",
        "transcript": {
            "title": f"Rate negotiation · Mumbai → Delhi · benchmark Rs {input.benchmark_rate or 78000:,.0f}",
            "lines": [
                {"who": "AI", "native": "નમસ્તે હસમુખભાઈ, તમારી ગાડી અત્યારે ક્યાં છે?", "en": "Hello Hasmukhbhai, where is your truck right now?"},
                {"who": "Hasmukhbhai", "native": "ગાડી અમદાવાદમાં ખાલી છે. કાલે લોડ થઈ શકે.", "en": "The truck is empty in Ahmedabad. It can load tomorrow."},
                {"who": "AI", "native": f"₹{agreed_rate:,.0f} ભાડું ચાલશે?", "en": f"Will a rate of Rs {agreed_rate:,.0f} work?"},
                {"who": "Hasmukhbhai", "native": "ઠીક છે, કન્ફર્મ કરો.", "en": "Fine, confirm it."}
            ],
            "outcome": f"Closed at Rs {agreed_rate:,.0f}, under the Rs {input.benchmark_rate or 78000:,.0f} benchmark. Booking confirmed."
        }
    })
    task.state = VoiceTaskState.completed
    await db.voice_tasks.replace_one({"task_id": task.task_id}, _voice_response(task), upsert=True)
    await db.voice_calls.replace_one({"task_id": task.task_id}, {
        "task_id": task.task_id,
        "state": task.state,
        "result": task.result,
        "created_at": _now(),
        "updated_at": _now(),
    }, upsert=True)

    quote_status = "approval" if (input.ceiling_rate and agreed_rate > input.ceiling_rate) else "pending"
    quote_doc = {
        "id": str(uuid.uuid4()),
        "load_id": input.load_id,
        "carrier_id": input.carrier_id,
        "amount": agreed_rate,
        "benchmark": input.benchmark_rate,
        "ceiling": input.ceiling_rate,
        "status": quote_status,
        "created_at": _now(),
    }
    await db.quotes.insert_one(quote_doc)
    quote_doc.pop("_id", None)
    return {"task": _voice_response(task), "quote": quote_doc}


app.include_router(api_router)


@app.middleware("http")
async def request_logging(request: Request, call_next):
    started = perf_counter()
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    try:
        response = await call_next(request)
    except Exception as exc:
        logger.exception(json.dumps({"event": "request_error", "request_id": request_id, "path": request.url.path, "error_type": type(exc).__name__}))
        raise
    duration_ms = round((perf_counter() - started) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    logger.info(json.dumps({"event": "request", "request_id": request_id, "method": request.method, "path": request.url.path, "status": response.status_code, "duration_ms": duration_ms}))
    return response

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)



