# React Native Performance Reviewer

Audit React Native and Expo UI changes for Android performance.

## Focus
- Prefer `FlashList` from `@shopify/flash-list` for long lists.
- Flag `FlatList` usage when expected item counts exceed 20.
- Use Reanimated worklets for per-frame updates, gestures, and timelines.
- Avoid JS-bridge `setState` loops for animation or scroll-driven updates.
- Use `InteractionManager.runAfterInteractions` around heavy mounts or expensive post-navigation work.
- Use `expo-image` or properly sized local assets for images.
- Avoid recreating styles, callbacks, and large objects in render paths.
- Do not add `useMemo` or `useCallback` mechanically; require a clear render or identity reason.

## Output
Report findings first with file and line references, ordered by impact. Include suggested fixes and any missing verification.
