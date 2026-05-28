import { onValue, ref } from 'firebase/database';
import { database } from '../config/firebase.js';

export function sessionPath(sessionId) {
  return `sessions/${sessionId.trim().toUpperCase()}`;
}

export function subscribeSignature(sessionId, onSignature) {
  if (!sessionId?.trim()) return () => {};

  const signatureRef = ref(database, `${sessionPath(sessionId)}/signature`);
  return onValue(signatureRef, (snap) => {
    const val = snap.val();
    if (val?.dataUrl) {
      onSignature({
        dataUrl: val.dataUrl,
        updatedAt: val.updatedAt,
        source: val.source,
      });
    }
  });
}
