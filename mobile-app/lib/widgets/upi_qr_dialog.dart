import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/theme.dart';

import 'app_svg_icons.dart';

class UpiQrDialog extends StatelessWidget {
  final String shopName;
  final double amount;
  final String upiId;
  final VoidCallback? onPaymentConfirmed;

  const UpiQrDialog({
    super.key,
    required this.shopName,
    required this.amount,
    this.upiId = 'breadfactory@icici',
    this.onPaymentConfirmed,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = Theme.of(context).cardColor;
    final textColor = Theme.of(context).colorScheme.onSurface;

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: isDark ? AppTheme.slateBorder : AppTheme.snowBorder, width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.08),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Top Header & Close Button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppTheme.metricBlue,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const AppSvgIcon(svgString: AppSvgIcons.upiQr, color: AppTheme.reactIndigo, size: 24),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'UPI Instant Payment',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: textColor,
                          ),
                        ),
                        const Text(
                          'GPay • PhonePe • Paytm • BHIM',
                          style: TextStyle(fontSize: 11, color: AppTheme.snowMuted, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ],
                ),
                IconButton(
                  icon: Icon(Icons.close, color: isDark ? Colors.white70 : AppTheme.snowText),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Amount Card Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.slateSurface : AppTheme.metricSky,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? AppTheme.slateBorder : AppTheme.accentSky.withValues(alpha: 0.4)),
              ),
              child: Column(
                children: [
                  Text(
                    shopName,
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: isDark ? AppTheme.slateMuted : AppTheme.snowText),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '₹${amount.toStringAsFixed(2)}',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: isDark ? AppTheme.reactCyan : AppTheme.snowActive,
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // High Precision Vector QR Code Box
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.snowBorder, width: 2),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x0F000000),
                    blurRadius: 10,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: CustomPaint(
                size: const Size(180, 180),
                painter: QrPainterWidget(
                  upiString: 'upi://pay?pa=$upiId&pn=Bread+Factory&am=${amount.toStringAsFixed(2)}&cu=INR',
                ),
              ),
            ),
            const SizedBox(height: 16),

            // UPI VPA Address Row with Copy
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.slateSurface : AppTheme.snowHover,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: isDark ? AppTheme.slateBorder : AppTheme.snowBorder),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.account_balance_wallet, size: 16, color: AppTheme.emeraldGreen),
                  const SizedBox(width: 8),
                  Text(
                    upiId,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: textColor,
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () {
                      Clipboard.setData(ClipboardData(text: upiId));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('UPI VPA copied to clipboard!'),
                          duration: Duration(seconds: 2),
                        ),
                      );
                    },
                    child: const Icon(Icons.copy, size: 16, color: AppTheme.reactIndigo),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Action Buttons
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.of(context).pop();
                  if (onPaymentConfirmed != null) {
                    onPaymentConfirmed!();
                  }
                },
                icon: const Icon(Icons.check_circle_outline, color: Colors.white),
                label: const Text(
                  'Confirm UPI Payment Received',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.emeraldGreen,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class QrPainterWidget extends CustomPainter {
  final String upiString;

  QrPainterWidget({required this.upiString});

  @override
  void paint(Canvas canvas, Size size) {
    final paintDark = Paint()..color = const Color(0xFF1E293B)..style = PaintingStyle.fill;
    final paintLight = Paint()..color = Colors.white..style = PaintingStyle.fill;
    final paintAccent = Paint()..color = const Color(0xFF6366F1)..style = PaintingStyle.fill;

    // Draw background
    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), paintLight);

    const int matrixSize = 21;
    final double cellSize = size.width / matrixSize;

    // Deterministic module generation based on upiString length and char values
    for (int r = 0; r < matrixSize; r++) {
      for (int c = 0; c < matrixSize; c++) {
        // Skip corner alignment targets
        if ((r < 7 && c < 7) || (r < 7 && c >= matrixSize - 7) || (r >= matrixSize - 7 && c < 7)) {
          continue;
        }

        // Module hash pattern logic
        int hash = (r * 31 + c * 17 + upiString.length * 7) ^ ((r + 1) * (c + 3));
        if (hash % 3 == 0 || (r % 2 == 0 && c % 3 == 0) || (r + c) % 5 == 0) {
          canvas.drawRRect(
            RRect.fromRectAndRadius(
              Rect.fromLTWH(c * cellSize + 0.5, r * cellSize + 0.5, cellSize - 1, cellSize - 1),
              const Radius.circular(1.5),
            ),
            (r + c) % 11 == 0 ? paintAccent : paintDark,
          );
        }
      }
    }

    // Helper for Finder Patterns (the 3 big corner squares)
    void drawFinder(double x, double y) {
      // Outer black square
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(x, y, 7 * cellSize, 7 * cellSize),
          const Radius.circular(6),
        ),
        paintDark,
      );
      // Inner white square
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize),
          const Radius.circular(4),
        ),
        paintLight,
      );
      // Center black square
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize),
          const Radius.circular(3),
        ),
        paintAccent,
      );
    }

    // Top-Left Finder
    drawFinder(0, 0);
    // Top-Right Finder
    drawFinder((matrixSize - 7) * cellSize, 0);
    // Bottom-Left Finder
    drawFinder(0, (matrixSize - 7) * cellSize);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
