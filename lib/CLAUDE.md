# Lib
- `api.ts` — single fetch wrapper. Injects auth, handles 401 refresh.
- `auth.tsx` — auth context + token persistence via `expo-secure-store`.
- `supabase.ts` — `@supabase/supabase-js` client for direct reads (not writes). Writes must go through `queue.ts`.
- `queue.ts` — offline write queue; persists to `expo-sqlite`; flushes on NetInfo recovery.
- `sms-parser.ts` / `sms-listener.ts` — SMS → transaction. Parser is pure and tested.
- `stores/` — Zustand stores, one per domain.
- `chat.ts` — SSE stream parsing (see `parseSseBlock.test.ts` for contract).

Rules:
- No Supabase writes outside `queue.ts`.
- No `console.log` of raw SMS bodies outside `__DEV__`.
