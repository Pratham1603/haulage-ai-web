import asyncio

import pytest
from fastapi import HTTPException

from backend import server


class FakeUsers:
    def __init__(self):
        self.documents = []

    async def find_one(self, query, projection=None):
        for document in self.documents:
            if all(document.get(key) == value for key, value in query.items()):
                if projection:
                    return {key: value for key, value in document.items() if projection.get(key, 1) != 0}
                return dict(document)
        return None

    async def insert_one(self, document):
        self.documents.append(dict(document))


class FakeDatabase:
    def __init__(self):
        self.users = FakeUsers()


def test_register_login_and_me(monkeypatch):
    fake_db = FakeDatabase()
    monkeypatch.setattr(server, "db", fake_db)
    request = server.AuthRegisterRequest(
        email="Dispatcher@Example.com",
        password="local-password",
        role="dispatcher",
    )

    registered = asyncio.run(server.register(request))
    assert registered["user"] == {
        "id": fake_db.users.documents[0]["id"],
        "email": "dispatcher@example.com",
        "role": "dispatcher",
    }
    assert "password_hash" not in registered["user"]
    assert fake_db.users.documents[0]["password_hash"] != request.password

    logged_in = asyncio.run(server.login(server.AuthLoginRequest(
        email="dispatcher@example.com",
        password="local-password",
    )))
    assert logged_in["token_type"] == "bearer"
    current = asyncio.run(server.get_current_user(f"Bearer {logged_in['access_token']}"))
    assert current["role"] == "dispatcher"
    assert asyncio.run(server.me(current))["user"] == current


def test_auth_rejects_bad_password_and_duplicate_email(monkeypatch):
    fake_db = FakeDatabase()
    monkeypatch.setattr(server, "db", fake_db)
    request = server.AuthRegisterRequest(email="user@example.com", password="local-password")
    asyncio.run(server.register(request))

    with pytest.raises(HTTPException) as duplicate:
        asyncio.run(server.register(request))
    assert duplicate.value.status_code == 409

    with pytest.raises(HTTPException) as bad_password:
        asyncio.run(server.login(server.AuthLoginRequest(email=request.email, password="wrong")))
    assert bad_password.value.status_code == 401


def test_unauthorized_and_protected_role_access():
    with pytest.raises(HTTPException) as missing:
        asyncio.run(server.get_current_user(None))
    assert missing.value.status_code == 401

    authorize = server.require_roles("owner")
    with pytest.raises(HTTPException) as forbidden:
        asyncio.run(authorize({"id": "user-1", "email": "user@example.com", "role": "dispatcher"}))
    assert forbidden.value.status_code == 403
