# Document Signature Editor (Web)

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with Firebase web config, or edit src/config/firebase.js
npm run dev
```

Open http://localhost:5173

## Usage

1. Note the **Session ID** in the sidebar (share with the phone app).
2. Upload PDF, JPG, or PNG.
3. When the phone sends a signature, it appears on the canvas — drag, resize, rotate with handles.
4. Export as PNG, JPG, or PDF.

## DOC / DOCX

- **DOCX**: optional Mammoth.js HTML preview (layout approximate).
- **DOC**: convert to PDF (Word export, LibreOffice, or CloudConvert) for accurate signing.
