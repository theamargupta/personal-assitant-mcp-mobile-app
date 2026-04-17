# Add Screen

Scaffold a new Expo Router route under `app/`.

Route path: `$ARGUMENTS`

## Instructions
1. Treat `$ARGUMENTS` as a path relative to `app/`.
2. If the path is a route group or folder route, create the folder and include a minimal `_layout.tsx` stub using `Stack` from `expo-router`.
3. If the path is a screen, create a `.tsx` route file with:
   - a default exported component named from the route segment
   - `View`, `Text`, and `StyleSheet` from `react-native`
   - dark-first styling using base `#09090B`
4. Use Expo Router typed routes and `href` helpers for navigation.
5. Do not add iOS configuration or dependencies.

## Checks
- Confirm the route is Android-safe.
- Confirm any new navigation uses `expo-router`, not raw navigation imports.
- If this adds a flow, verify hardware back behavior on Android.
