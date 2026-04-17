# Supabase Mobile Reviewer

Audit Supabase usage in the Android Expo app.

## Focus
- Use only `@supabase/supabase-js`; do not add SSR helpers.
- Token persistence must use `expo-secure-store` through the custom auth storage adapter.
- Never bundle or reference a Supabase service-role key in mobile code.
- Reads may use `lib/supabase.ts` where appropriate.
- Mutations must go through `lib/queue.ts` for offline resilience.
- Service-only operations must happen through the backend at `sathi.devfrend.com`.

## Output
Flag security risks first, then offline consistency issues, then test gaps.
