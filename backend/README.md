# Backend setup

## MongoDB

1. Copy `.env.example` to `.env`.
2. Replace `MONGO_URL` with your MongoDB Atlas or local MongoDB connection string.
3. Leave `DB_NAME=haulage_ai`, or change it to the database name you want.
4. Install dependencies and start the API:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

The API will create and use the `haulage_ai` database automatically when the first document is written. MongoDB does not require a separate database creation command for this application.

Check the API at `http://localhost:8001/api/health`.

## Local development authorization

Authentication is available locally through the users collection. Set `JWT_SECRET_KEY`, `JWT_ALGORITHM`, and `JWT_EXPIRE_MINUTES` in the ignored `.env` file. `DB_NAME` must remain `haulage_ai` for the current application data. Register a local user, then use the returned bearer token for protected routes:

```powershell
$body = @{ email = "dispatcher@example.com"; password = "local-password"; role = "dispatcher" } | ConvertTo-Json
$registered = Invoke-RestMethod -Method Post -ContentType "application/json" -Body $body -Uri http://localhost:8001/api/auth/register
$headers = @{ Authorization = "Bearer $($registered.access_token)" }
Invoke-RestMethod -Headers $headers -Uri http://localhost:8001/api/auth/me
```

The existing `DEV_API_TOKEN` and `DEV_API_ROLE` remain an explicit local fallback for protected routes. Keep them and the JWT secret in the ignored `.env` file and never commit or log either value. Health, matching, and contact routes remain available without authentication for local compatibility.

Example request:

```powershell
$headers = @{ Authorization = "Bearer $env:DEV_API_TOKEN" }
Invoke-RestMethod -Headers $headers -Uri http://localhost:8001/api/operations/loads
```

## Voice agent providers

The backend defaults to `VOICE_PROVIDER=mock`, so task and callback flows can be developed without placing calls. The optional `POST /api/voice/speech` endpoint uses ElevenLabs for text-to-speech when you set:

```env
VOICE_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=your-key
ELEVENLABS_VOICE_ID=your-voice-id
```

ElevenLabs is not a phone carrier and does not, by itself, provide outbound Indian phone calls, call status webhooks, or a complete speech-to-text call loop. For live calls you additionally need a telephony provider with Indian calling, webhooks, media streaming or recording, and speech recognition. The existing callback endpoint is the backend seam for that provider integration:

```text
POST /api/voice/tasks
POST /api/voice/tasks/{task_id}/start
POST /api/voice/tasks/{task_id}/callback
```

An LLM is optional for the current fixed workflows. Driver status and carrier availability can use the explicit task state machine and deterministic field validation. Add an LLM only when you need open-ended conversation or multilingual extraction; keep rate ceilings and booking approvals as backend rules, never model decisions.

Never commit `backend/.env`; it contains credentials. The committed `.env.example` is safe to edit as a template only.
