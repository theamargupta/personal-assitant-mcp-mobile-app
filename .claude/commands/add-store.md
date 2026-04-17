# Add Store

Scaffold a Zustand store in `lib/stores/<name>-store.ts`.

Store name: `$ARGUMENTS`

## Instructions
1. Normalize `$ARGUMENTS` to kebab-case for the file name.
2. Create `lib/stores/<name>-store.ts`.
3. Use `create` from `zustand`.
4. Keep one store per domain.
5. Use immutable update patterns with `set(state => ...)`.
6. Export selectors or document selector usage via `useStore(s => s.slice)`.

## Persistence Hint
- Token or credential-like state: use `expo-secure-store` through a custom storage adapter.
- Large cached data: use `expo-sqlite`.
- Do not persist secrets in AsyncStorage or plain JSON.

## Tests
Add or update a mirrored test in `__tests__/` for actions, selectors, and reset behavior.
