import { useCallback, useEffect, useState } from 'react';
import { subscribeSignature } from '../services/firebaseSync.js';

function generateSessionId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export default function SessionPanel({ sessionId, onSessionIdChange, onSignatureReceived }) {
  const [connected, setConnected] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    if (!sessionId?.trim()) {
      setConnected(false);
      return undefined;
    }

    setConnected(true);
    const unsub = subscribeSignature(sessionId, (sig) => {
      setLastSync(sig.updatedAt ? new Date(sig.updatedAt) : new Date());
      onSignatureReceived(sig.dataUrl);
    });

    return () => {
      unsub();
      setConnected(false);
    };
  }, [sessionId, onSignatureReceived]);

  const handleGenerate = useCallback(() => {
    onSessionIdChange(generateSessionId());
  }, [onSessionIdChange]);

  return (
    <section>
      <div className="field">
        <label htmlFor="session-id">Session ID</label>
        <div className="session-row">
          <input
            id="session-id"
            value={sessionId}
            onChange={(e) => onSessionIdChange(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={12}
          />
          <button type="button" className="btn btn-secondary" onClick={handleGenerate} title="Generate">
            ↻
          </button>
        </div>
      </div>
      <div className={`status ${connected ? 'status-live' : 'status-wait'}`}>
        {connected
          ? `Listening for mobile signatures${lastSync ? ` · last ${lastSync.toLocaleTimeString()}` : ''}`
          : 'Enter a Session ID to connect'}
      </div>
    </section>
  );
}
