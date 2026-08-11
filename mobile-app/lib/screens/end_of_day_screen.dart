import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../providers/delivery_provider.dart';
import '../../widgets/app_svg_icons.dart';

class EndOfDayScreen extends StatefulWidget {
  const EndOfDayScreen({super.key});

  @override
  State<EndOfDayScreen> createState() => _EndOfDayScreenState();
}

class _EndOfDayScreenState extends State<EndOfDayScreen> {
  final _collectedCashCtrl = TextEditingController();
  final _collectedUpiCtrl = TextEditingController();
  final _commentsCtrl = TextEditingController();

  @override
  void dispose() {
    _collectedCashCtrl.dispose();
    _collectedUpiCtrl.dispose();
    _commentsCtrl.dispose();
    super.dispose();
  }

  void _submitEodDetails(BuildContext context, double totalExpectedSales) async {
    final provider = Provider.of<DeliveryProvider>(context, listen: false);

    final finalCash = double.tryParse(_collectedCashCtrl.text.trim()) ?? 0.0;
    final finalUpi = double.tryParse(_collectedUpiCtrl.text.trim()) ?? 0.0;
    final remarks = _commentsCtrl.text.trim();

    final actualSum = finalCash + finalUpi;
    final isDiscrepancy = (actualSum - totalExpectedSales).abs() > 0.01;

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (isDiscrepancy) {
      final proceed = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: theme.cardColor,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              AppSvgIcon(svgString: AppSvgIcons.info, color: AppTheme.amberAccent, size: 22),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Handover Discrepancy Alert',
                  style: TextStyle(color: AppTheme.amberAccent, fontWeight: FontWeight.bold, fontSize: 17),
                ),
              ),
            ],
          ),
          content: Text(
            'Your declared handover amount (₹${actualSum.toStringAsFixed(2)}) does not match expected route sales (₹${totalExpectedSales.toStringAsFixed(2)}).\n\nDo you want to submit anyway? Discrepancies will be logged in audit trail.',
            style: TextStyle(color: theme.colorScheme.onSurface, fontSize: 13),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: Text('Review Entry', style: TextStyle(color: isDark ? AppTheme.slateMuted : AppTheme.snowMuted)),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.amberAccent,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Submit Anyway', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );

      if (proceed != true) return;
    }

    if (!context.mounted) return;

    final bool success = await provider.completeTripWithEOD(
      finalCash: finalCash,
      finalUpi: finalUpi,
      finalCheque: 0.0,
      chequeNo: '',
      remarks: remarks,
    );

    if (success && context.mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          backgroundColor: theme.cardColor,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              AppSvgIcon(svgString: AppSvgIcons.checkCircle, color: AppTheme.emeraldGreen, size: 24),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Trip Finalized & Closed',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                ),
              ),
            ],
          ),
          content: Text(
            'Your route inventory and cash/UPI handover ledger have been closed successfully.\n\nYou may return safely to the central plant repository.',
            style: TextStyle(color: isDark ? AppTheme.slateMuted : AppTheme.snowMuted, fontSize: 13),
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                Navigator.of(context).pop();
                provider.logout();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: isDark ? AppTheme.reactIndigo : AppTheme.snowActive,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Sign Out to Login', style: TextStyle(fontWeight: FontWeight.bold)),
            )
          ],
        ),
      );
    } else if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('EOD submission failed. Saved in local offline queue.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<DeliveryProvider>(context);
    final isOnline = provider.isOnline;

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final textColor = theme.colorScheme.onSurface;
    final borderColor = isDark ? AppTheme.slateBorder : AppTheme.snowBorder;

    final totalCashExpected = provider.allPastInvoices.where((i) => i.paymentMode == 'CASH').fold(0.0, (sum, i) => sum + i.grandTotal);
    final totalUpiExpected = provider.allPastInvoices.where((i) => i.paymentMode == 'UPI').fold(0.0, (sum, i) => sum + i.grandTotal);
    final totalExpectedMoney = totalCashExpected + totalUpiExpected;

    return Scaffold(
      appBar: AppBar(
        title: const Text('End-Of-Day (EOD) Settlement'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Connection Status Banner
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isOnline
                    ? AppTheme.emeraldGreen.withValues(alpha: 0.12)
                    : AppTheme.amberAccent.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isOnline ? AppTheme.emeraldGreen : AppTheme.amberAccent),
              ),
              child: Row(
                children: [
                  AppSvgIcon(
                    svgString: AppSvgIcons.sync,
                    color: isOnline ? AppTheme.emeraldGreen : AppTheme.amberAccent,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      isOnline
                          ? 'System Online: End-of-day summary will sync directly with Gemini server.'
                          : 'Offline Mode Active: End-of-day report will be saved locally in route ledger.',
                      style: TextStyle(
                        color: isOnline ? AppTheme.emeraldGreen : AppTheme.amberAccent,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            Text(
              'Route Expected Sales Ledger',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textColor),
            ),
            const SizedBox(height: 10),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _buildClosingRow(
                      context,
                      'Expected Cash Receipts',
                      '₹${totalCashExpected.toStringAsFixed(2)}',
                      textColor,
                      svgIcon: AppSvgIcons.cash,
                    ),
                    Divider(height: 20, color: borderColor),
                    _buildClosingRow(
                      context,
                      'Expected UPI Receipts',
                      '₹${totalUpiExpected.toStringAsFixed(2)}',
                      isDark ? AppTheme.reactCyan : AppTheme.snowActive,
                      svgIcon: AppSvgIcons.upiQr,
                    ),
                    Divider(height: 20, color: borderColor),
                    _buildClosingRow(
                      context,
                      'Total Handover Target',
                      '₹${totalExpectedMoney.toStringAsFixed(2)}',
                      AppTheme.amberAccent,
                      svgIcon: AppSvgIcons.eodClosing,
                      isBold: true,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            Text(
              'Driver Cash & Digital Declaration',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textColor),
            ),
            const SizedBox(height: 10),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    _buildClosingDeclField(
                      context,
                      'Actual Cash Handover (₹)',
                      _collectedCashCtrl,
                      hint: totalCashExpected.toStringAsFixed(2),
                      svgIcon: AppSvgIcons.cash,
                    ),
                    const SizedBox(height: 16),
                    _buildClosingDeclField(
                      context,
                      'Actual UPI Total Verified (₹)',
                      _collectedUpiCtrl,
                      hint: totalUpiExpected.toStringAsFixed(2),
                      svgIcon: AppSvgIcons.upiQr,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            _buildClosingDeclField(
              context,
              'Driver Observations / Route Notes',
              _commentsCtrl,
              keyboardType: TextInputType.text,
              hint: 'e.g. Traffic delays, extra shop request',
              svgIcon: AppSvgIcons.info,
            ),
            const SizedBox(height: 30),

            ElevatedButton.icon(
              onPressed: () => _submitEodDetails(context, totalExpectedMoney),
              icon: const AppSvgIcon(svgString: AppSvgIcons.eodClosing, size: 20, color: Colors.white),
              label: const Text('Complete Trip & Submit EOD Closing', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              style: ElevatedButton.styleFrom(
                backgroundColor: isDark ? AppTheme.reactIndigo : AppTheme.snowActive,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                minimumSize: const Size.fromHeight(52),
                elevation: 0,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildClosingDeclField(
    BuildContext context,
    String label,
    TextEditingController ctrl, {
    TextInputType keyboardType = const TextInputType.numberWithOptions(decimal: true),
    String hint = '0.00',
    required String svgIcon,
  }) {
    final theme = Theme.of(context);
    final textColor = theme.colorScheme.onSurface;
    final isDark = theme.brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            AppSvgIcon(svgString: svgIcon, size: 16, color: theme.colorScheme.primary),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: isDark ? AppTheme.slateMuted : AppTheme.snowMuted,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        TextField(
          controller: ctrl,
          style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 15),
          keyboardType: keyboardType,
          decoration: InputDecoration(
            hintText: hint,
          ),
        ),
      ],
    );
  }

  Widget _buildClosingRow(
    BuildContext context,
    String label,
    String value,
    Color col, {
    required String svgIcon,
    bool isBold = false,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              AppSvgIcon(svgString: svgIcon, size: 16, color: col),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color: isBold ? theme.colorScheme.onSurface : (isDark ? AppTheme.slateMuted : AppTheme.snowMuted),
                  fontSize: isBold ? 14 : 13,
                  fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
                ),
              ),
            ],
          ),
          Text(
            value,
            style: TextStyle(
              color: col,
              fontSize: isBold ? 18 : 14,
              fontWeight: isBold ? FontWeight.w800 : FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
