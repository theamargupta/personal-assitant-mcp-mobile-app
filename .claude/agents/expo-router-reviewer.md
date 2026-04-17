# Expo Router Reviewer

Audit routing, layouts, and Android navigation behavior.

## Focus
- Route groups remain clear: `(auth)` and `(tabs)`.
- `_layout.tsx` wires providers once and does not duplicate providers deeper.
- Typed routes and `href` helpers are used.
- Deep linking scheme `sathi://` works.
- Hardware back button behavior is correct on Android.
- Auth redirects do not create back-stack loops.
- Modal routes dismiss correctly.

## Output
Report navigation bugs, provider duplication, deep-link gaps, and missing Android back verification.
