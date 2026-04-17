# Add Test

Create a Jest test file under `__tests__/` mirroring the source path.

Source path: `$ARGUMENTS`

## Instructions
1. Treat `$ARGUMENTS` as the source file to cover.
2. Mirror the path under `__tests__/`.
3. Use `jest-expo` conventions already configured in this repo.
4. For components, use `@testing-library/react-native`.
5. For pure modules, prefer direct function tests with focused fixtures.
6. For stores, test initial state, actions, selectors, and reset behavior.
7. For SMS parser changes, include representative real-world shaped strings without personal data.

## Naming
- `lib/sms-parser.ts` -> `__tests__/lib/sms-parser.test.ts`
- `app/add-task.tsx` -> `__tests__/app/add-task.test.tsx`
