from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI()
api_router = APIRouter(prefix="/api")


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


@api_router.get("/")
async def root():
    return {"message": "Haulage AI API"}


@api_router.get("/health")
async def health():
    return {"status": "ok"}


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


app.include_router(api_router)

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


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
