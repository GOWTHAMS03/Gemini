import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../providers/delivery_provider.dart';
import '../../widgets/app_svg_icons.dart';
import '../../widgets/upi_qr_dialog.dart';

class CashCollectionScreen extends StatefulWidget {
  final DeliveryShopModel shop;

  const CashCollectionScreen({super.key, required this.shop});

  @override
  State<CashCollectionScreen> createState() => _CashCollectionScreenState();
}

class _CashCollectionScreenState extends State<CashCollectionScreen> {
  final _amountCtrl = TextEditingController();
  final _refNoCtrl = TextEditingController();
  String _paymentMode = 'CASH';

  @override
  void dispose() {
    _amountCtrl.dispose();
    _refNoCtrl.dispose();
    super.dispose();
  }

  void _openUpiQrModal() {
    final double? amount = double.tryParse(_amountCtrl.text.trim());
    final collectionAmount = (amount != null && amount > 0) ? amount : widget.shop.outstandingBalance;

    showDialog(
      context: context,
      builder: (ctx) => UpiQrDialog(
        shopName: widget.shop.shopName,
        amount: collectionAmount,
        upiId: 'breadfactory@icici',
        onPaymentConfirmed: () {
          setState(() {
            _paymentMode = 'UPI';
            if (_amountCtrl.text.isEmpty) {
              _amountCtrl.text = collectionAmount.toStringAsFixed(2);
            }
          });
        },
      ),
    );
  }

  void _submitCollection() async {
    final provider = Provider.of<DeliveryProvider>(context, listen: false);
    final double? amount = double.tryParse(_amountCtrl.text.trim());

    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid collection amount.')),
      );
      return;
    }

    if (amount > widget.shop.outstandingBalance) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Collection amount cannot exceed outstanding balance!')),
      );
      return;
    }

    final success = await provider.collectOutstandingAmount(
      shop: widget.shop,
      amount: amount,
      mode: _paymentMode,
      reference: _refNoCtrl.text.trim(),
    );

    if (mounted) {
      if (success) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                const SizedBox(width: 8),
                Text('Successfully collected ₹${amount.toStringAsFixed(2)} !'),
              ],
            ),
            backgroundColor: AppTheme.emeraldGreen,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to submit collection. Saved locally in offline queue.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final textColor = theme.colorScheme.onSurface;
    final mutedColor = isDark ? AppTheme.slateMuted : AppTheme.snowMuted;

    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.shop.shopName} • Receipt'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Current Outlet Balance', style: TextStyle(color: mutedColor, fontSize: 13, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text(
                      '₹${widget.shop.outstandingBalance.toStringAsFixed(2)}',
                      style: TextStyle(fontSize: 28, color: AppTheme.amberAccent, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Collect cash or instant UPI dues from this retail outlet.',
                      style: TextStyle(color: mutedColor, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            Text('Amount to Collect (₹)', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 8),
            TextField(
              controller: _amountCtrl,
              style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 16),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                hintText: 'Enter amount (e.g. 500)',
                prefixText: '₹ ',
                prefixStyle: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
            const SizedBox(height: 20),

            Text('Payment Mode (Instant Only)', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 8),
            Row(
              children: [
                _buildModeOption('CASH', 'Cash Handover', AppSvgIcons.cash),
                const SizedBox(width: 12),
                _buildModeOption('UPI', 'UPI / QR Code', AppSvgIcons.upiQr),
              ],
            ),
            if (_paymentMode == 'UPI') ...[
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: _openUpiQrModal,
                icon: const AppSvgIcon(svgString: AppSvgIcons.upiQr, color: AppTheme.reactIndigo, size: 18),
                label: const Text('Show Payment QR Code', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.reactIndigo)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppTheme.reactIndigo),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
            const SizedBox(height: 20),

            Text(
              _paymentMode == 'UPI' ? 'UPI Reference / UTR (Optional)' : 'Receipt Note (Optional)',
              style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 14),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _refNoCtrl,
              style: TextStyle(color: textColor),
              decoration: InputDecoration(
                hintText: _paymentMode == 'UPI' ? 'Enter 12-digit UTR or UPI ref' : 'Enter payment notes',
              ),
            ),
            const SizedBox(height: 32),

            ElevatedButton.icon(
              onPressed: _submitCollection,
              icon: const Icon(Icons.receipt_long),
              label: const Text('Confirm Receipt & Update Ledger', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              style: ElevatedButton.styleFrom(
                backgroundColor: isDark ? AppTheme.reactIndigo : AppTheme.snowActive,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModeOption(String mode, String label, String svgString) {
    final active = _paymentMode == mode;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _paymentMode = mode;
          });
          if (mode == 'UPI') {
            _openUpiQrModal();
          }
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: active
                ? (isDark ? AppTheme.reactIndigo : AppTheme.snowActive)
                : (isDark ? AppTheme.slateSurface : AppTheme.snowHover),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: active
                  ? (isDark ? AppTheme.reactCyan : AppTheme.snowActive)
                  : (isDark ? AppTheme.slateBorder : AppTheme.snowBorder),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AppSvgIcon(
                svgString: svgString,
                size: 18,
                color: active ? Colors.white : (isDark ? AppTheme.slateMuted : AppTheme.snowMuted),
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color: active ? Colors.white : theme.colorScheme.onSurface,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
