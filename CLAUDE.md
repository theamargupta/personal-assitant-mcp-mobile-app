# Sathi Mobile (Android-only, Expo + React Native)

## Overview
Android companion app for the Sathi Personal Assistant. Reads SMS for finance auto-categorization, manages habits/tasks/goals, offline-first queue, syncs with `sathi.devfrend.com`.

## Nested Context
- `app/` — expo-router routes + layouts
- `lib/` — API, Supabase, stores, SMS parser, queue
- `__tests__/` — jest conventions

## Tech Stack
- Expo SDK **54**, React Native **0.81** — New Architecture enabled
- `expo-router` v6
- `@supabase/supabase-js` (mobile, no SSR)
- Zustand for state
- Moti + `react-native-reanimated` 4 for animation
- `expo-secure-store` for tokens
- `expo-sqlite` for offline cache
- `react-native-get-sms-android` for SMS-based finance ingestion
- `expo-notifications`, `expo-background-fetch`, `expo-task-manager` for background jobs
- Jest + `@testing-library/react-native`, `jest-expo` preset

## Platform
Android only. iOS is not configured. The `platforms` field in `app.json` is `["android"]` — do not extend to iOS without user approval.

## Commands
```
npm run start         # Expo dev menu (scan QR / pick device)
npm run android       # Run on Android
npm test              # Jest (one-shot)
npm run test:watch
npm run icons         # Regenerate app icons
```

EAS:
- `eas build -p android --profile <profile>` — use profiles defined in `eas.json`.

## Environment
`.env` + `.env.example`. Values accessed via `expo-constants` or `process.env.EXPO_PUBLIC_*`. Never bundle the service-role key or any secret into the app — service calls happen through the backend.

## Conventions
- Screens in `app/` are expo-router routes. Use typed route helpers.
- Stores in `lib/stores/*-store.ts` (Zustand). One store per domain.
- API client: `lib/api.ts` centralizes fetch; do NOT sprinkle `fetch` across screens.
- Offline writes go through `lib/queue.ts` — never write directly to Supabase from a component.
- SMS parsing lives in `lib/sms-parser.ts` (pure) + `lib/sms-listener.ts` (subscription). Tests required for any parser change.
- Animations: prefer `react-native-reanimated` for worklet-driven timelines; Moti for short UI feedback.
- Styling: inline StyleSheet, dark-first palette — base `#09090B` (from splash).
- Tasks carry `task_type` (`'personal'|'project'`) and `project` (free-text slug, same column name in Supabase — no mapping). DB constraint `tasks_project_required_for_project_type` (migration 009) requires `project IS NOT NULL` when `task_type='project'`. Description limit: 10 000 chars. Distinct project list sourced from `pa_memory_items.project` via `lib/projects.ts` + `useProjects()` (60 s stale-while-revalidate).

## Testing
- Jest + `@testing-library/react-native`.
- Every parser, store, and API helper change requires a test.
- Test files in `__tests__/` mirror the source.

## Rules
- Android-only. Don't add iOS configuration without user approval.
- Never commit `.env*` or any credential.
- Never put a Supabase service-role key in the mobile bundle.
- SMS permissions are sensitive — never log raw SMS content in production builds.
- Offline queue handles retries. Do not wrap queue calls in your own retry loop.
