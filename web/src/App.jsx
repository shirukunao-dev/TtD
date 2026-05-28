import { useCallback, useState } from 'react';
import DocumentEditor from './components/DocumentEditor.jsx';
import SessionPanel from './components/SessionPanel.jsx';

function generateSessionId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export default function App() {
  const [sessionId, setSessionId] = useState(generateSessionId);
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);

  const handleSignature = useCallback((dataUrl) => {
    setSignatureDataUrl(dataUrl);
  }, []);

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>Document Signature Editor</h1>
        <p className="subtitle">
          Sync signatures from your Android app in real time, then place them on PDFs and images.
        </p>

        <SessionPanel
          sessionId={sessionId}
          onSessionIdChange={setSessionId}
          onSignatureReceived={handleSignature}
        />

        <div className="status status-wait">
          Share Session ID <strong>{sessionId}</strong> with your phone app before sending a signature.
        </div>

        {signatureDataUrl && (
          <div className="field">
            <label>Latest signature</label>
            <img
              src={signatureDataUrl}
              alt="Synced signature"
              style={{
                maxWidth: '100%',
                background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 16px 16px',
                borderRadius: 8,
                border: '1px solid var(--border)',
              }}
            />
          </div>
        )}

        <div className="export-group">
          <h3>Workflow</h3>
          <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            <li>Set Session ID on PC and phone</li>
            <li>Draw &amp; send from Android</li>
            <li>Upload document here</li>
            <li>Drag, resize, rotate signature</li>
            <li>Export PDF or image</li>
          </ol>
        </div>
      </aside>

      <DocumentEditor signatureDataUrl={signatureDataUrl} />
    </div>
  );
}
