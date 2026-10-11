"""Backend tests for Haulage AI: health + /api/contact."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://haulage-desk.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _payload(**over):
    base = {
        "name": "TEST_User",
        "work_email": f"test_{uuid.uuid4().hex[:8]}@example.com",
        "phone": "+911234567890",
        "company": "TEST Co",
        "role": "Ops Manager",
        "monthly_volume": "100-500",
        "challenges": ["Visibility", "Compliance"],
        "language": "English",
        "message": "Hello",
        "consent": True,
    }
    base.update(over)
    return base


# --- Health ---
def test_root(client):
    r = client.get(f"{API}/")
    assert r.status_code == 200
    assert "message" in r.json()


def test_health(client):
    r = client.get(f"{API}/health")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# --- POST /api/contact ---
def test_contact_create_success(client):
    p = _payload()
    r = client.post(f"{API}/contact", json=p)
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["ok"] is True
    assert "id" in data

    # Verify persistence via GET
    list_r = client.get(f"{API}/contact")
    assert list_r.status_code == 200
    items = list_r.json()
    found = [i for i in items if i.get("id") == data["id"]]
    assert len(found) == 1
    saved = found[0]
    assert saved["work_email"] == p["work_email"].lower()
    assert saved["name"] == p["name"]
    assert saved["challenges"] == p["challenges"]
    assert "_id" not in saved  # ensure Mongo _id excluded


def test_contact_missing_required_fields(client):
    r = client.post(f"{API}/contact", json={})
    assert r.status_code == 422


def test_contact_invalid_email(client):
    r = client.post(f"{API}/contact", json=_payload(work_email="not-an-email"))
    assert r.status_code == 422


def test_contact_no_consent(client):
    r = client.post(f"{API}/contact", json=_payload(consent=False))
    assert r.status_code == 422


def test_contact_short_phone(client):
    r = client.post(f"{API}/contact", json=_payload(phone="123"))
    assert r.status_code == 422


def test_contact_list_returns_array(client):
    r = client.get(f"{API}/contact")
    assert r.status_code == 200
    assert isinstance(r.json(), list)
