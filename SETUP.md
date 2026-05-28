# Setup checklist

## 1. Firebase (one project for both apps)

1. [Create a Firebase project](https://console.firebase.google.com/).
2. **Realtime Database** → Create database → Start in test mode (dev).
3. **Web app** → copy config into `web/src/config/firebase.js`.
4. **Android app** → package `com.ttd.signature_sync` → download `google-services.json` → `mobile/android/app/google-services.json`.
5. Set the same database URL in `mobile/lib/config/firebase_config.dart`.
6. Deploy rules: `firebase deploy --only database` (requires Firebase CLI).

## 2. Web app

**Option A — single HTML file (no Node.js):**

Copy `web/standalone-editor.html` to the other PC and open in Chrome or Edge.
Requires internet (Firebase + CDN libraries).

**Option B — full dev server:**

```bash
cd web
npm install
npm run dev
```

## 3. Flutter app (first-time scaffold)

If `flutter` is not set up yet, install the [Flutter SDK](https://docs.flutter.dev/get-started/install).

Then either:

**Option A** — generate platform folders (recommended if `android/` is incomplete):

```bash
cd mobile
flutter create . --org com.ttd.signature_sync --project-name signature_sync
flutter pub get
```

**Option B** — new project and copy sources:

```bash
flutter create signature_sync --org com.ttd.signature_sync
# Copy lib/, pubspec.yaml, and merge android/app/google-services.json
```

```bash
flutter run
```

## 4. End-to-end test

1. Start web app → note Session ID (e.g. `K7M2XP`).
2. Open Android app → enter same Session ID → draw → **Send to PC**.
3. On web → upload a PDF or image → signature appears → drag/resize/rotate → **Export PDF**.
