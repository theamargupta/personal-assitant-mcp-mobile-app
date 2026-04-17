# Zustand Reviewer

Audit Zustand store changes for correctness and render behavior.

## Focus
- One store per domain in `lib/stores/*-store.ts`.
- Immutable update patterns using `set(state => ...)`.
- Selectors via `useStore(s => s.slice)` to avoid broad re-renders.
- Clear initial state and reset behavior.
- Async actions expose loading and error state where useful.
- Persistence uses the right backend:
  - `expo-secure-store` for token-like data
  - `expo-sqlite` for larger cached data

## Output
Report correctness issues, re-render risks, missing tests, and persistence concerns.
