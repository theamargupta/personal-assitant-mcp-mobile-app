# EAS Build Android

Use Android profiles defined in `eas.json`.

## Preview Build
```sh
eas build -p android --profile preview
```

Use this for internal installable builds, commonly APK depending on the profile configuration.

## Production Build
```sh
eas build -p android --profile production
```

Use this for release builds, commonly AAB for Play Store submission depending on the profile configuration.

## APK vs AAB vs Submit
- APK: install directly on a device or distribute for testing.
- AAB: upload to Google Play for managed release.
- EAS Submit: uploads a completed build artifact to the Play Store; it is separate from `eas build`.

Before running, inspect `eas.json` and confirm the requested profile exists.
