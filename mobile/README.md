# Signature Sync (Flutter)

## Setup

1. Install [Flutter](https://docs.flutter.dev/get-started/install).
2. Create a Firebase project and add an **Android** app with package `com.ttd.signature_sync`.
3. Download `google-services.json` into `android/app/`.
4. Set your Realtime Database URL in `lib/config/firebase_config.dart`.
5. Run:

```bash
flutter pub get
flutter run
```

## Optional: FlutterFire CLI

```bash
dart pub global activate flutterfire_cli
flutterfire configure
```

This generates `lib/firebase_options.dart` and wires Android automatically.

## Features

- Transparent PNG signature export (no white background)
- Pen color (black/blue) and stroke width
- Pressure-sensitive stroke width (where supported)
- Real-time sync to web via Firebase Realtime Database
