# Offline Queue Reviewer

Audit offline write queue behavior.

## Focus
- `lib/queue.ts` owns retries and write synchronization.
- Retries use exponential backoff.
- Operations dedupe by idempotency key.
- Queue persists to `expo-sqlite`.
- Flush resumes on network recovery via `@react-native-community/netinfo`.
- Components do not wrap queue calls in custom retry loops.
- Supabase writes do not bypass the queue.

## Output
Report data-loss risks, duplicate-write risks, bypassed queue calls, and missing tests.
