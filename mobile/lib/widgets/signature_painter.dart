import 'dart:ui' as ui;

import 'package:flutter/material.dart';

class StrokePoint {
  StrokePoint(this.offset, this.pressure);
  final Offset offset;
  final double pressure;
}

class SignaturePainter extends CustomPainter {
  SignaturePainter({
    required this.strokes,
    required this.color,
    required this.baseStrokeWidth,
  });

  final List<List<StrokePoint>> strokes;
  final Color color;
  final double baseStrokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..isAntiAlias = true;

    for (final stroke in strokes) {
      if (stroke.isEmpty) continue;
      if (stroke.length == 1) {
        final w = _widthFor(stroke.first.pressure);
        paint.strokeWidth = w;
        canvas.drawCircle(stroke.first.offset, w / 2, paint..style = PaintingStyle.fill);
        paint.style = PaintingStyle.stroke;
        continue;
      }
      for (var i = 0; i < stroke.length - 1; i++) {
        final p0 = stroke[i];
        final p1 = stroke[i + 1];
        paint.strokeWidth = (_widthFor(p0.pressure) + _widthFor(p1.pressure)) / 2;
        canvas.drawLine(p0.offset, p1.offset, paint);
      }
    }
  }

  double _widthFor(double pressure) {
    final p = pressure.clamp(0.2, 1.0);
    return baseStrokeWidth * (0.5 + p * 0.9);
  }

  @override
  bool shouldRepaint(covariant SignaturePainter oldDelegate) {
    // Strokes are updated in place; always repaint when the delegate changes.
    return true;
  }

  /// Renders strokes to PNG bytes with a fully transparent background.
  static Future<List<int>?> renderPng({
    required List<List<StrokePoint>> strokes,
    required Color color,
    required double baseStrokeWidth,
    required Size size,
    double pixelRatio = 3.0,
  }) async {
    if (strokes.every((s) => s.isEmpty)) return null;

    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);
    // No background fill — alpha stays 0.

    SignaturePainter(
      strokes: strokes,
      color: color,
      baseStrokeWidth: baseStrokeWidth,
    ).paint(canvas, size);

    final picture = recorder.endRecording();
    final image = await picture.toImage(
      (size.width * pixelRatio).round(),
      (size.height * pixelRatio).round(),
    );
    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    return byteData?.buffer.asUint8List();
  }
}
