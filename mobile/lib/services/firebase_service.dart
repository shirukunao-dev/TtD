import 'dart:convert';

import 'package:firebase_database/firebase_database.dart';

class FirebaseService {
  FirebaseService(this._db);

  final FirebaseDatabase _db;

  DatabaseReference sessionRef(String sessionId) =>
      _db.ref('sessions/${sessionId.trim().toUpperCase()}');

  Future<void> uploadSignature({
    required String sessionId,
    required String dataUrl,
  }) async {
    await sessionRef(sessionId).child('signature').set({
      'dataUrl': dataUrl,
      'updatedAt': ServerValue.timestamp,
      'source': 'android',
    });
  }

  /// Encodes raw PNG bytes as a data URL for the web editor.
  static String pngToDataUrl(List<int> pngBytes) {
    final b64 = base64Encode(pngBytes);
    return 'data:image/png;base64,$b64';
  }
}
