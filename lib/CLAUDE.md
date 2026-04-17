# Lib
- `api.ts` — single fetch wrapper. Injects auth, handles 401 refresh.
- `auth.tsx` — auth context + token persistence via `expo-secure-store`.
- `supabase.ts` — `@supabase/supabase-js` client for direct reads (not writes). Writes must go through `queue.ts`.
- `queue.ts` — offline write queue; persists to `expo-sqlite`; flushes on NetInfo recovery.
- `sms-parser.ts` / `sms-listener.ts` — SMS → transaction. Parser is pure and tested.
- `stores/` — Zustand stores, one per domain.
- `chat.ts` — SSE stream parsing (see `parseSseBlock.test.ts` for contract).

- `tasks.ts` — exposes `task_type` + `project` with identical names on Supabase; `createTask` / `updateTask` validate `project` is present when `task_type='project'` (DB has the same CHECK constraint).
- `projects.ts` + `stores/projects-store.ts` — DISTINCT project list from `pa_memory_items`, 60 s stale-while-revalidate. Use `useProjects()` for read + `addLocalProject()` to optimistically insert a freshly-created project name (no DB write). `useProjects()` selects each slice individually and memoizes `reload` via `useCallback` — do NOT return a fresh object literal from the zustand selector (triggers infinite re-render loops in consumers whose effects depend on `reload`).

Rules:
- No Supabase writes outside `queue.ts`.
- No `console.log` of raw SMS bodies outside `__DEV__`.
