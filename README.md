# TtD — Tablet-to-Desktop Document Signing

**Draw a signature on your phone → it appears on your PC document instantly.**

No accounts, no servers to manage — just a 6-character session code to pair your devices.

![How it works](https://img.shields.io/badge/Android-Flutter-blue?logo=flutter)
![Web](https://img.shields.io/badge/Web-React-61DAFB?logo=react)
![Sync](https://img.shields.io/badge/Sync-Firebase%20RTDB-FFCA28?logo=firebase)

---

## How to use

### 1. Open the editor on your PC

Two ways:

- **No install** — Copy `web/standalone-editor.html` to your PC and open in Chrome/Edge. Everything runs in the browser.
- **Developer mode** — `cd web && npm install && npm run dev` then open `http://localhost:5173`.

### 2. Get a Session ID

The web app shows a 6-character code (e.g. `K7M2XP`). Generate a new one or type your own.

### 3. Draw your signature on your phone

**Option A — Flutter app (Android):**

```bash
cd mobile && flutter run
```

Enter the same Session ID, draw your signature, tap **Send to PC**.

**Option B — Phone browser (no app needed):**

Open `web/standalone-signature-pad.html` on your phone. Enter the Session ID or scan the QR code from the PC screen. Draw and send.

### 4. Place & export

- Upload a **PDF, JPG, or PNG** document onto the web editor.
- The signature appears as a stamp — drag, resize, rotate into position.
- Export as **PNG, JPG, or PDF**.

---

## What makes this different

| Feature | Detail |
|---------|--------|
| **No backend** | Just Firebase Realtime Database — no server to run |
| **No account needed** | Session-based pairing, 6-character code |
| **Transparent signatures** | PNG with alpha channel — clean overlay on any document |
| **Offline-capable mobile** | Flutter app works independently, syncs when sent |
| **Two mobile paths** | Native Android app or browser-based signature pad |
| **Export options** | PNG, JPG, or PDF with embedded signature |

---

## Quick start for developers

### Web app

```bash
cd web
npm install
npm run dev
```

### Mobile app

```bash
cd mobile
flutter pub get
flutter run
```

### Firebase setup

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Realtime Database** (test mode for development).
3. Add an **Android** app (package: `com.ttd.signature_sync`) and a **Web** app.
4. Copy config into:
   - `web/src/config/firebase.js`
   - `mobile/lib/config/firebase_config.dart`
5. Place `google-services.json` in `mobile/android/app/`.

See [SETUP.md](SETUP.md) for detailed steps.

---

## Tech stack

| Part | Stack |
|------|-------|
| Mobile | Flutter, CustomPainter, firebase_database |
| Web | React 18, Vite 6, Fabric.js 6, PDF.js, jsPDF |
| Realtime | Firebase Realtime Database (asia-southeast1) |
| Standalone | Pure HTML/JS — no build step required |

## Project layout

```
TtD/
├── mobile/                    Flutter Android app
│   └── lib/
│       ├── screens/           Home & Signature screens
│       ├── services/          Firebase service
│       └── widgets/           Signature painter
├── web/                       React document editor
│   ├── src/
│   │   ├── components/        Editor & Session panel
│   │   ├── services/          Firebase sync & export
│   │   └── utils/             DOCX conversion
│   ├── standalone-editor.html       No-build PC editor
│   └── standalone-signature-pad.html No-build phone pad
└── firebase/                  RTDB security rules
```
