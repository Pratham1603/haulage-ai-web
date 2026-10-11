# Haulage AI Module 2 and 3 Audit

## Confirmed architecture

- Frontend: React 19, React Router, Tailwind, Radix/shadcn-style components, and a frontend-only `MockProvider`.
- Backend: FastAPI with Motor/MongoDB. The existing API currently persists only contact submissions.
- Authentication: demo `sessionStorage` login and client-side role switching. It is not production authentication or authorization.
- Operational pages: `/app/loads`, `/app/fleet`, `/app/calls`, and `/app/agents` render seeded demo data. Their actions update React state and do not call the backend.
- Existing tests: HTTP tests for `/api/`, `/api/health`, and `/api/contact`. The backend test environment currently lacks the required `pytest-xdist` plugin.

## Existing implementation and gaps

| Feature | Existing implementation | Gap | Smallest change |
| --- | --- | --- | --- |
| Truck matching | `frontend/src/mock/store.jsx` has illustrative ranked suggestions | No backend vehicle, route, capacity, or hard-constraint model | Add a pure matching service and API contract; keep the current UI fallback |
| Vehicle availability | Fleet page contains seeded display rows | No canonical availability or assignment records | Extend with persisted vehicle/load records before enabling booking |
| Spare capacity | Loads page has a one-click demo for four pallets | No route, delivery-window, compatibility, or contribution calculation | Add deterministic proposal calculation with warnings |
| Voice tasks | Calls page has seeded transcripts | No task lifecycle, provider abstraction, callback handling, or idempotency | Add explicit task state machine and mock provider |
| Rate guardrails | Agents page stores demo lane ceilings in React state | No backend permission or approval enforcement | Reuse the existing concepts in a persisted policy service before live booking |
| Assignments | Loads page has visual Approve buttons | No transactional assignment endpoint or duplicate protection | Add canonical shipment/vehicle schemas and transactional persistence next |

## Implemented in this increment

- `backend/matching.py`: hard-constraint filtering, configurable default weights (30/25/20/15/10), explainable component scores, and spare-capacity contribution proposals.
- `backend/voice.py`: queued/calling/collecting/completed/escalated/failed states, mock provider, and idempotent callback handling.
- `backend/server.py`: `/api/matching/candidates`, `/api/matching/spare-capacity`, `/api/voice/tasks`, task start, and callback routes.
- `backend/tests/test_matching_and_voice.py`: focused unit coverage for infeasible candidates, contribution calculation, and duplicate callbacks.

## Compatibility and security status

These endpoints are an additive development slice. They are not yet production-ready: task state is process-local, there is no backend auth middleware, callbacks are not signature-authenticated, and no live telephony provider is configured. No booking or carrier confirmation is performed. The existing frontend therefore remains demo-backed and cannot claim that a recommendation is persisted or approved.

## Next smallest production slice

1. Define and migrate canonical MongoDB documents for orders/loads, carriers, vehicles, availability events, assignments, voice tasks, quotes, approvals, and audit events.
2. Add the repository/service layer around those collections with unique indexes and transactional assignment creation.
3. Add backend authorization and signed, idempotent provider callbacks.
4. Connect the existing Loads, Calls, Control Tower, and activity feed components through an optional API client while retaining the demo fallback.
5. Add integration tests using a mock provider and an isolated test database.

## Verification

- New modules compile and their focused behavior assertions pass.
- Full pytest collection could not run because `pytest-xdist` is missing from the current environment.
- FastAPI import could not run because `motor` is missing from the current environment.
- Frontend build could not run from the current shell because the frontend package script was not resolved from the `frontend` directory.
