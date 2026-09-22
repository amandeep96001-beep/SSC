# Backend architecture

CrackuEx API is a modular Express + TypeScript + MongoDB service.
Goal: production-ready, readable by a 1-year engineer, safe at ~100k users.

## Request flow

```
HTTP → routes (Zod) → controller (DTO only) → service (rules) → repository (DB)
```

- Controllers never pass `req` into services.
- Services never set HTTP status codes — they throw `HttpError`.
- Repositories talk to Mongoose only.

## Module layout

```
src/modules/<feature>/
  *.routes.ts      # mount paths + validate(schema)
  *.schema.ts      # Zod contracts
  *.controller.ts  # map auth/body → service DTOs
  *.service.ts     # business rules
  *.repository.ts  # persistence
  *.model.ts       # mongoose schema
  *.interface.ts   # types
```

Shared kit lives in `src/lib/` (logger, validate, challenge tokens, errors).

## Auth

- Bearer JWT (`typ: access`) with `tokenVersion` — login bumps version (single active session).
- Identity for progress / competition / reminders is **`userId`**, not username.
- Username may be denormalized for display (leaderboard) only.
- `/auth/me?include=avatar` loads avatar; default `/auth/me` skips it to keep payloads small.

## Scoring integrity

- **Drills:** `GET /drill/next` returns a `challengeToken` (no answer). `POST /drill/verify` grades with that token.
- **Competition:** `GET /competition/questions` returns a `sessionToken` (no keys). `POST /competition/submit` sends answers; server grades.
- **Progress:** score derived from counts when present; never trust free-form score alone for mocks.

## Errors

Every error response:

```json
{ "status": "error", "code": "BAD_REQUEST", "message": "...", "requestId": "..." }
```

Logs include `requestId`, path, userId, and stack (dev only on client).

## Reminders

- With `REDIS_URL`: BullMQ repeatable tick (see `infra/queues.ts`).
- Without Redis: in-process cron (`reminder.cron.ts`).
- Docker: API with `REMINDER_INLINE=0` + separate `worker` service.

## Adding a feature

1. Create module folder with the files above.
2. Add Zod schema for mutating routes.
3. Mount under public or protected group in `src/routes/index.ts`.
4. Prefer `userId` from `req.user.id` — never from the body.
5. Add a focused test under `test/`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | API with tsx watch |
| `npm run worker` | Reminder worker |
| `npm test` | Vitest suite |
| `npm run migrate:userid` | Backfill userId FKs |

## Local Docker

From repo root: `docker compose up --build` (mongo + redis + api + worker).
