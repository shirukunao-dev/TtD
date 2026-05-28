import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../services/firebase_service.dart';
import 'signature_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.firebase});

  final FirebaseService firebase;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _controller = TextEditingController();
  String? _error;

  String _generateSessionId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    final now = DateTime.now().millisecondsSinceEpoch;
    final buf = StringBuffer();
    for (var i = 0; i < 6; i++) {
      buf.write(chars[(now + i * 7) % chars.length]);
    }
    return buf.toString();
  }

  void _openCanvas() {
    final id = _controller.text.trim().toUpperCase();
    if (id.length < 4) {
      setState(() => _error = 'Session ID must be at least 4 characters');
      return;
    }
    setState(() => _error = null);
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => SignatureScreen(
          sessionId: id,
          firebase: widget.firebase,
        ),
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Signature Pad')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Connect to PC',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            const Text(
              'Enter the same Session ID shown in the web app. '
              'Your signature will sync in real time when you tap Send to PC.',
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _controller,
              textCapitalization: TextCapitalization.characters,
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z0-9]')),
                LengthLimitingTextInputFormatter(12),
              ],
              decoration: InputDecoration(
                labelText: 'Session ID',
                hintText: 'e.g. ABC123',
                errorText: _error,
                border: const OutlineInputBorder(),
                suffixIcon: IconButton(
                  tooltip: 'Generate',
                  onPressed: () {
                    _controller.text = _generateSessionId();
                    setState(() => _error = null);
                  },
                  icon: const Icon(Icons.refresh),
                ),
              ),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _openCanvas,
              child: const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Text('Open signature canvas'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
