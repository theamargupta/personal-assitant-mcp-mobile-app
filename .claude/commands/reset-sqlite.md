# Reset SQLite

Do not execute automatically. Print these instructions for the user.

## Android Local Cache Reset
The app package is `com.devfrend.sathi`.

```sh
adb shell pm clear com.devfrend.sathi
```

This clears app storage, including the Expo SQLite cache, SecureStore-backed app data, and local preferences for the installed Android app.

## Notes
- This is destructive for local app data on the connected Android device or emulator.
- Re-authentication may be required.
- Use only when debugging cache, queue, migration, or persistence issues.
