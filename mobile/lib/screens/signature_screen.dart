import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../services/firebase_service.dart';
import '../widgets/signature_painter.dart';

class SignatureScreen extends StatefulWidget {
  const SignatureScreen({
    super.key,
    required this.sessionId,
    required this.firebase,
  });

  final String sessionId;
  final FirebaseService firebase;

  @override
  State<SignatureScreen> createState() => _SignatureScreenState();
}

class _SignatureScreenState extends State<SignatureScreen> {
  final List<List<StrokePoint>> _strokes = [];
  List<StrokePoint>? _currentStroke;
  final GlobalKey _canvasKey = GlobalKey();

  Color _penColor = Colors.black;
  double _strokeWidth = 4.0;
  bool _sending = false;

  static const _blue = Color(0xFF1565C0);

  void _startStroke(Offset localPosition, double pressure) {
    setState(() {
      _currentStroke = [StrokePoint(localPosition, pressure)];
      _strokes.add(_currentStroke!);
    });
  }

  void _extendStroke(Offset localPosition, double pressure) {
    if (_currentStroke == null) return;
    setState(() {
      _currentStroke!.add(StrokePoint(localPosition, pressure));
    });
  }

  void _endStroke() {
    setState(() => _currentStroke = null);
  }

  void _clear() {
    setState(() {
      _strokes.clear();
      _currentStroke = null;
    });
  }

  Future<void> _sendToPc() async {
    final box = _canvasKey.currentContext?.findRenderObject() as RenderBox?;
    if (box == null) return;

    final png = await SignaturePainter.renderPng(
      strokes: List.from(_strokes),
      color: _penColor,
      baseStrokeWidth: _strokeWidth,
      size: box.size,
      pixelRatio: 3.0,
    );

    if (png == null || png.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Draw a signature first')),
      );
      return;
    }

    setState(() => _sending = true);
    try {
      final dataUrl = FirebaseService.pngToDataUrl(png);
      await widget.firebase.uploadSignature(
        sessionId: widget.sessionId,
        dataUrl: dataUrl,
      );
      if (!mounted) return;
      HapticFeedback.mediumImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Signature sent to PC')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Send failed: $e')),
      );
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Offset? _localPosition(PointerEvent event) {
    final box = _canvasKey.currentContext?.findRenderObject() as RenderBox?;
    if (box == null) return null;
    return box.globalToLocal(event.position);
  }

  double _pressure(PointerEvent event) {
    final p = event.pressure;
    if (p > 0 && p <= 1) return p;
    return 1.0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Session ${widget.sessionId}'),
        actions: [
          IconButton(
            tooltip: 'Clear',
            onPressed: _strokes.isEmpty ? null : _clear,
            icon: const Icon(Icons.delete_outline),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                const Text('Color:'),
                const SizedBox(width: 8),
                _ColorChip(
                  color: Colors.black,
                  selected: _penColor == Colors.black,
                  onTap: () => setState(() => _penColor = Colors.black),
                ),
                const SizedBox(width: 8),
                _ColorChip(
                  color: _blue,
                  selected: _penColor == _blue,
                  onTap: () => setState(() => _penColor = _blue),
                ),
                const Spacer(),
                const Text('Width'),
                Expanded(
                  child: Slider(
                    value: _strokeWidth,
                    min: 2,
                    max: 12,
                    divisions: 10,
                    label: _strokeWidth.round().toString(),
                    onChanged: (v) => setState(() => _strokeWidth = v),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade400),
                  borderRadius: BorderRadius.circular(12),
                  color: Colors.grey.shade200,
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(11),
                  child: RepaintBoundary(
                    key: _canvasKey,
                    child: Listener(
                      behavior: HitTestBehavior.opaque,
                      onPointerDown: (e) {
                        final pos = _localPosition(e);
                        if (pos != null) _startStroke(pos, _pressure(e));
                      },
                      onPointerMove: (e) {
                        if (e.buttons == 0) return;
                        final pos = _localPosition(e);
                        if (pos != null) _extendStroke(pos, _pressure(e));
                      },
                      onPointerUp: (_) => _endStroke(),
                      onPointerCancel: (_) => _endStroke(),
                      child: CustomPaint(
                        painter: SignaturePainter(
                          strokes: _strokes,
                          color: _penColor,
                          baseStrokeWidth: _strokeWidth,
                        ),
                        child: const SizedBox.expand(),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: FilledButton.icon(
                  onPressed: _sending ? null : _sendToPc,
                  icon: _sending
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.send),
                  label: Text(_sending ? 'Sending…' : 'Send to PC'),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ColorChip extends StatelessWidget {
  const _ColorChip({
    required this.color,
    required this.selected,
    required this.onTap,
  });

  final Color color;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          border: Border.all(
            color: selected ? Theme.of(context).colorScheme.primary : Colors.grey,
            width: selected ? 3 : 1,
          ),
        ),
      ),
    );
  }
}
