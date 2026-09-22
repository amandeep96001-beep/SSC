# Frontend architecture

CrackuEx SPA — React 19 + Vite 8 + TypeScript.

## Request flow

```
UI → feature hook → typed API module → apiService (fetch) → backend
```

- `shared/services/apiService.ts` — transport only (auth header, timeout, 401 clear).
- `shared/api/*.ts` — endpoint helpers (`authApi`, `drillApi`, `competitionApi`).
- Hooks never invent score/answer keys — server grades drills & competition.

## Session

- Token: `localStorage.ssc_token`
- Profile: `localStorage.ssc_user`
- Merge helper: `shared/session/sessionStorage.ts`
  - Slim `/auth/me` must **not** wipe `avatarUrl` with `null`
  - Prefer `user.id` (stable userId) over username for identity

```ts
await authApi.me({ includeAvatar: true }); // when profile photo needed
```

## Errors

`HttpError` carries `status`, `code`, `requestId`.

```ts
showApiErrorToast(err); // toast with code + short request ref
```

Workspaces are wrapped in `FeatureErrorBoundary` so one crash does not kill the shell.

## Adding a feature

1. Add API helpers under `shared/api/`.
2. Hook under `features/<name>/hooks/`.
3. Workspace under `features/<name>/components/`.
4. Lazy-import in `Dashboard.tsx` inside `FeatureErrorBoundary` + `Suspense`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server (proxies `/api` → `:5000`) |
| `npm run build` | typecheck + production bundle |
| `npm run typecheck` | `tsc -b` |
| `npm test` | Vitest smoke tests |
