import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../providers/delivery_provider.dart';
import '../../widgets/app_svg_icons.dart';
import '../../widgets/upi_qr_dialog.dart';
import 'invoice_preview_screen.dart';
import 'esc_pos_printer_screen.dart';

class SalesScreen extends StatefulWidget {
  final DeliveryShopModel shop;

  const SalesScreen({super.key, required this.shop});

  @override
  State<SalesScreen> createState() => _SalesScreenState();
}

class _SalesScreenState extends State<SalesScreen> {
  final Map<int, TextEditingController> _qtyControllers = {};
  final Map<int, TextEditingController> _priceControllers = {};
  bool _isSubmitting = false;
  bool _isSubmitted = false;
  InvoiceModel? _submittedInvoice;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = Provider.of<DeliveryProvider>(context, listen: false);
      final existingMatches = provider.allPastInvoices.where((i) => i.shopId == widget.shop.shopId);
      if (existingMatches.isNotEmpty) {
        setState(() {
          _submittedInvoice = existingMatches.first;
          _isSubmitted = true;
        });
      } else if (widget.shop.salesStatus == 'SOLD') {
        setState(() {
          _isSubmitted = true;
        });
      }
    });
  }

  @override
  void dispose() {
    for (var ctrl in _qtyControllers.values) {
      ctrl.dispose();
    }
    for (var ctrl in _priceControllers.values) {
      ctrl.dispose();
    }
    super.dispose();
  }

  void _showSellingPriceEditDialog(BuildContext context, TruckItemModel item, DeliveryProvider provider) {
    if (_isSubmitted) return;

    final currentSellingPrice = provider.getUnitPriceForProduct(item.productId);
    final dialogController = TextEditingController(text: currentSellingPrice.toStringAsFixed(2));

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: theme.cardColor,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.metricBlue,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const AppSvgIcon(svgString: AppSvgIcons.editSelling, color: AppTheme.reactIndigo, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Modify Selling Price',
                style: TextStyle(
                  color: theme.colorScheme.onSurface,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              item.productName,
              style: TextStyle(color: theme.colorScheme.onSurface, fontWeight: FontWeight.bold, fontSize: 14),
            ),
            const SizedBox(height: 12),

            // Read-Only Actual Price Box
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.slateSurface : AppTheme.metricViolet,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: isDark ? AppTheme.slateBorder : AppTheme.snowBorder),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.lock_outline, size: 16, color: AppTheme.snowMuted),
                      const SizedBox(width: 6),
                      Text(
                        'Actual Price (Fixed)',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: theme.colorScheme.onSurface),
                      ),
                    ],
                  ),
                  Text(
                    '₹${item.dealerPrice.toStringAsFixed(2)}',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppTheme.amberAccent),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Editable Selling Price Input
            TextField(
              controller: dialogController,
              autofocus: true,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: TextStyle(color: theme.colorScheme.onSurface, fontWeight: FontWeight.bold, fontSize: 16),
              decoration: InputDecoration(
                labelText: 'Negotiated Selling Price (₹)',
                prefixText: '₹ ',
                prefixStyle: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold, fontSize: 16),
                helperText: 'Actual price remains fixed. Only selling price is updated.',
                helperMaxLines: 2,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text('Cancel', style: TextStyle(color: isDark ? AppTheme.slateMuted : AppTheme.snowMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.emeraldGreen,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () {
              final newPrice = double.tryParse(dialogController.text.trim());
              if (newPrice != null && newPrice >= 0) {
                provider.updateDraftPrice(item.productId, newPrice);
                if (_priceControllers.containsKey(item.productId)) {
                  _priceControllers[item.productId]!.text = newPrice.toStringAsFixed(2);
                }
              }
              Navigator.of(ctx).pop();
            },
            child: const Text('Save Selling Price', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _openUpiQrModal(BuildContext context, double amount) {
    final provider = Provider.of<DeliveryProvider>(context, listen: false);

    showDialog(
      context: context,
      builder: (ctx) => UpiQrDialog(
        shopName: widget.shop.shopName,
        amount: amount,
        upiId: 'breadfactory@icici',
        onPaymentConfirmed: () {
          provider.updatePaymentMode('UPI');
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.white),
                  SizedBox(width: 8),
                  Text('UPI Payment Verified & Selected!'),
                ],
              ),
              backgroundColor: AppTheme.emeraldGreen,
            ),
          );
        },
      ),
    );
  }

  Map<String, dynamic> _buildInvoicePayload({InvoiceModel? existingInvoice}) {
    final provider = Provider.of<DeliveryProvider>(context, listen: false);
    final trip = provider.activeTrip;

    if (existingInvoice != null) {
      return {
        'invoiceNumber': existingInvoice.invoiceNumber,
        'shop': {
          'shopName': widget.shop.shopName,
          'address': widget.shop.address,
        },
        'items': existingInvoice.items.map((itm) => {
          'productId': itm.productId,
          'productName': itm.productName,
          'quantity': itm.quantity,
          'price': itm.unitPrice,
          'total': itm.totalPrice,
        }).toList(),
        'subtotal': existingInvoice.subtotal,
        'discount': existingInvoice.discount,
        'gst': existingInvoice.gst,
        'grandTotal': existingInvoice.grandTotal,
        'returnCredit': existingInvoice.returnCredit,
        'netPayable': existingInvoice.netPayable,
        'paymentMode': existingInvoice.paymentMode,
        'isSubmitted': true,
      };
    }

    List<Map<String, dynamic>> itemsList = [];
    if (trip != null) {
      provider.salesDraftQuantities.forEach((prodId, qty) {
        final matches = trip.items.where((it) => it.productId == prodId);
        if (matches.isNotEmpty) {
          final prd = matches.first;
          final sellingPrice = provider.getUnitPriceForProduct(prodId);
          itemsList.add({
            'productId': prodId,
            'productName': prd.productName,
            'quantity': qty,
            'actualPrice': prd.dealerPrice,
            'price': sellingPrice,
            'total': sellingPrice * qty,
          });
        }
      });
    }

    final returnCredit = provider.calculateReturnCredit(widget.shop.shopId);
    final netPayable = provider.calculateNetPayableGrandTotal(widget.shop.shopId);

    return {
      'invoiceNumber': _submittedInvoice?.invoiceNumber ?? 'INV-RECORDED',
      'shop': {
        'shopName': widget.shop.shopName,
        'address': widget.shop.address,
      },
      'items': itemsList,
      'actualSubtotal': provider.calculateActualSubtotal(),
      'subtotal': provider.calculateSellingSubtotal(),
      'priceSavings': provider.calculatePriceSavings(),
      'discount': provider.calculateDiscount(),
      'gst': provider.calculateTax(),
      'grandTotal': provider.calculateGrandTotal(),
      'returnCredit': returnCredit,
      'netPayable': netPayable,
      'paymentMode': provider.selectedPaymentMode,
      'isSubmitted': _isSubmitted,
    };
  }

  void _openInvoicePreview(BuildContext context) {
    final invoiceData = _buildInvoicePayload(existingInvoice: _submittedInvoice);
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => InvoicePreviewScreen(invoiceData: invoiceData),
      ),
    );
  }

  void _openThermalPrinter(BuildContext context) {
    final invoiceData = _buildInvoicePayload(existingInvoice: _submittedInvoice);
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => EscPosPrinterScreen(invoiceData: invoiceData),
      ),
    );
  }

  void _showShareToast(BuildContext context, String platform) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.share, color: Colors.white, size: 18),
            const SizedBox(width: 8),
            Text('Sent receipt link via $platform!'),
          ],
        ),
        backgroundColor: AppTheme.reactCyan,
      ),
    );
  }

  Future<void> _submitOrder(BuildContext context) async {
    final provider = Provider.of<DeliveryProvider>(context, listen: false);
    if (provider.salesDraftQuantities.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one item quantity to place an order!')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final invoice = await provider.submitDraftInvoice(widget.shop);
      if (!context.mounted) return;
      setState(() {
        _submittedInvoice = invoice;
        _isSubmitted = true;
        _isSubmitting = false;
      });

      _showOrderSuccessSheet(context, invoice);
    } catch (e) {
      if (!context.mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Order submission failed: $e'),
          backgroundColor: AppTheme.roseError,
        ),
      );
    }
  }

  void _showOrderSuccessSheet(BuildContext context, InvoiceModel invoice) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(28),
            topRight: Radius.circular(28),
          ),
          border: Border.all(color: isDark ? AppTheme.slateBorder : AppTheme.snowBorder),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.2),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.emeraldGreen.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_rounded, color: AppTheme.emeraldGreen, size: 48),
            ),
            const SizedBox(height: 16),
            Text(
              'Order Submitted Successfully!',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Invoice: ${invoice.invoiceNumber}',
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: AppTheme.reactIndigo,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Collected ₹${invoice.netPayable.toStringAsFixed(2)} via ${invoice.paymentMode}',
              style: TextStyle(
                fontSize: 13,
                color: isDark ? AppTheme.slateMuted : AppTheme.snowMuted,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildActionIconButton(
                  context: context,
                  icon: Icons.receipt_long_rounded,
                  label: 'Preview Invoice',
                  color: AppTheme.reactIndigo,
                  onTap: () {
                    Navigator.of(ctx).pop();
                    _openInvoicePreview(context);
                  },
                ),
                _buildActionIconButton(
                  context: context,
                  icon: Icons.print_rounded,
                  label: 'Print Thermal',
                  color: AppTheme.emeraldGreen,
                  onTap: () {
                    Navigator.of(ctx).pop();
                    _openThermalPrinter(context);
                  },
                ),
                _buildActionIconButton(
                  context: context,
                  icon: Icons.share_rounded,
                  label: 'Share Bill',
                  color: AppTheme.reactCyan,
                  onTap: () {
                    _showShareToast(context, 'WhatsApp Business');
                  },
                ),
              ],
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.emeraldGreen,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () {
                  Navigator.of(ctx).pop();
                  Navigator.of(context).pop();
                },
                child: const Text('Done & Return to Outlets', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionIconButton({
    required BuildContext context,
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withValues(alpha: isDark ? 0.2 : 0.12),
                shape: BoxShape.circle,
                border: Border.all(color: color.withValues(alpha: 0.4), width: 1.5),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: isDark ? Colors.white70 : AppTheme.snowText,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<DeliveryProvider>(context);
    final trip = provider.activeTrip;

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final textColor = theme.colorScheme.onSurface;
    final mutedColor = isDark ? AppTheme.slateMuted : AppTheme.snowMuted;
    final borderColor = isDark ? AppTheme.slateBorder : AppTheme.snowBorder;

    if (trip == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Store Sales'),
        ),
        body: Center(
          child: Text('No active trip loaded to verify dynamic stock.', style: TextStyle(color: mutedColor)),
        ),
      );
    }

    final actualSubtotal = provider.calculateActualSubtotal();
    final sellingSubtotal = provider.calculateSellingSubtotal();
    final priceSavings = provider.calculatePriceSavings();
    final tax = provider.calculateTax();
    final grandTotal = provider.calculateGrandTotal();
    final netPayable = provider.calculateNetPayableGrandTotal(widget.shop.shopId);
    final returnCredit = provider.calculateReturnCredit(widget.shop.shopId);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.shop.shopName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            Text(
              _isSubmitted ? 'Order Completed • Billed' : 'Spot Sale • Custom Selling Prices',
              style: TextStyle(
                fontSize: 11,
                color: _isSubmitted ? AppTheme.emeraldGreen : AppTheme.reactIndigo,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        actions: [
          // After successfully submitting order: show ONLY Icon Buttons for invoice preview, print, and share
          if (_isSubmitted) ...[
            IconButton(
              icon: const Icon(Icons.receipt_long_rounded, color: AppTheme.reactIndigo),
              tooltip: 'Preview Invoice Blueprint',
              onPressed: () => _openInvoicePreview(context),
            ),
            IconButton(
              icon: const Icon(Icons.print_rounded, color: AppTheme.emeraldGreen),
              tooltip: 'Print Thermal Receipt',
              onPressed: () => _openThermalPrinter(context),
            ),
            IconButton(
              icon: const Icon(Icons.share_rounded, color: AppTheme.reactCyan),
              tooltip: 'Share Receipt',
              onPressed: () => _showShareToast(context, 'WhatsApp Business'),
            ),
          ] else ...[
            IconButton(
              icon: Icon(Icons.refresh, color: theme.colorScheme.primary),
              tooltip: 'Clear Draft',
              onPressed: () {
                provider.clearSalesDraft();
                for (var c in _qtyControllers.values) {
                  c.clear();
                }
                for (var item in trip.items) {
                  if (_priceControllers.containsKey(item.productId)) {
                    _priceControllers[item.productId]!.text = item.dealerPrice.toStringAsFixed(2);
                  }
                }
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cleared sale draft.')));
              },
            ),
          ],
        ],
      ),
      body: Column(
        children: [
          // Shop Return & Exchange Card (from last purchased order)
          _buildShopReturnSection(context, provider),

          // Stock items list with Actual vs Selling Price
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: trip.items.length,
              itemBuilder: (context, index) {
                final item = trip.items[index];

                if (!_qtyControllers.containsKey(item.productId)) {
                  _qtyControllers[item.productId] = TextEditingController();
                }
                final qtyController = _qtyControllers[item.productId]!;

                if (!_priceControllers.containsKey(item.productId)) {
                  final initialPrice = provider.getUnitPriceForProduct(item.productId);
                  _priceControllers[item.productId] = TextEditingController(text: initialPrice.toStringAsFixed(2));
                }

                final sellingPrice = provider.getUnitPriceForProduct(item.productId);
                final actualPrice = item.dealerPrice;
                final curQty = provider.salesDraftQuantities[item.productId] ?? 0;
                final lineSellingTotal = sellingPrice * curQty;
                final isCustomPrice = sellingPrice != actualPrice;

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.productName,
                                    style: TextStyle(fontWeight: FontWeight.bold, color: textColor, fontSize: 15),
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: isDark ? AppTheme.slateSurface : AppTheme.metricSky,
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          'Truck Stock: ${item.remainingQuantity} pkts',
                                          style: TextStyle(
                                            color: item.remainingQuantity <= 10
                                                ? AppTheme.amberAccent
                                                : (isDark ? AppTheme.reactCyan : AppTheme.snowActive),
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            if (curQty > 0)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: AppTheme.emeraldGreen.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppTheme.emeraldGreen),
                                ),
                                child: Text(
                                  '₹${lineSellingTotal.toStringAsFixed(2)}',
                                  style: const TextStyle(
                                    color: AppTheme.emeraldGreen,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Divider(height: 1, color: borderColor),
                        const SizedBox(height: 10),

                        // Prices Comparison Row: Actual Price (Read-only) vs Selling Price (Editable)
                        Row(
                          children: [
                            // Read-Only Actual Price Badge
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: isDark ? AppTheme.slateSurface : AppTheme.snowHover,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: borderColor),
                              ),
                              child: Row(
                                children: [
                                  const AppSvgIcon(svgString: AppSvgIcons.lockActual, size: 14, color: AppTheme.snowMuted),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Actual: ₹${actualPrice.toStringAsFixed(2)}',
                                    style: TextStyle(
                                      color: mutedColor,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),

                            // Editable Selling Price Button
                            InkWell(
                              onTap: _isSubmitted ? null : () => _showSellingPriceEditDialog(context, item, provider),
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: isCustomPrice
                                      ? AppTheme.emeraldGreen.withValues(alpha: 0.15)
                                      : (isDark ? AppTheme.slateSurface : AppTheme.metricBlue),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: isCustomPrice ? AppTheme.emeraldGreen : borderColor,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    AppSvgIcon(
                                      svgString: AppSvgIcons.editSelling,
                                      size: 14,
                                      color: isCustomPrice ? AppTheme.emeraldGreen : theme.colorScheme.primary,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      'Selling: ₹${sellingPrice.toStringAsFixed(2)}',
                                      style: TextStyle(
                                        color: isCustomPrice ? AppTheme.emeraldGreen : textColor,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),

                        // Quantity Selector Row
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              _isSubmitted ? 'Order Delivered' : 'Order Quantity',
                              style: TextStyle(color: mutedColor, fontSize: 12, fontWeight: FontWeight.w600),
                            ),
                            Container(
                              decoration: BoxDecoration(
                                color: isDark ? AppTheme.slateSurface : AppTheme.snowHover,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: borderColor),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove_circle_outline, color: AppTheme.roseError, size: 22),
                                    onPressed: (_isSubmitted || curQty <= 0)
                                        ? null
                                        : () {
                                            provider.updateDraftQuantity(item.productId, curQty - 1);
                                            qtyController.text = (curQty - 1 > 0) ? '${curQty - 1}' : '';
                                          },
                                  ),
                                  SizedBox(
                                    width: 40,
                                    child: TextField(
                                      enabled: !_isSubmitted,
                                      controller: qtyController,
                                      onChanged: (val) {
                                        int? qty = int.tryParse(val) ?? 0;
                                        if (qty > item.remainingQuantity) {
                                          qty = item.remainingQuantity;
                                          qtyController.text = '$qty';
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(content: Text('Cannot exceed truck stock of ${item.remainingQuantity}!')),
                                          );
                                        }
                                        provider.updateDraftQuantity(item.productId, qty);
                                      },
                                      keyboardType: TextInputType.number,
                                      textAlign: TextAlign.center,
                                      style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 15),
                                      decoration: InputDecoration(
                                        contentPadding: EdgeInsets.zero,
                                        border: InputBorder.none,
                                        enabledBorder: InputBorder.none,
                                        focusedBorder: InputBorder.none,
                                        hintText: '0',
                                        hintStyle: TextStyle(color: mutedColor),
                                      ),
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.add_circle_outline, color: AppTheme.emeraldGreen, size: 22),
                                    onPressed: (_isSubmitted)
                                        ? null
                                        : () {
                                            if (curQty < item.remainingQuantity) {
                                              provider.updateDraftQuantity(item.productId, curQty + 1);
                                              qtyController.text = '${curQty + 1}';
                                            } else {
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                const SnackBar(content: Text('Cannot exceed available truck stock!')),
                                              );
                                            }
                                          },
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Bill Summary & Calculation Section
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: theme.cardColor,
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
              border: Border(top: BorderSide(color: borderColor, width: 1.5)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
                  blurRadius: 16,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Actual Price Total Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Total Actual Price (Fixed MRP/Dealer)', style: TextStyle(color: mutedColor, fontSize: 13)),
                    Text(
                      '₹${actualSubtotal.toStringAsFixed(2)}',
                      style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ],
                ),
                const SizedBox(height: 6),

                // Selling Price Subtotal Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Total Selling Price (Negotiated)', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 13)),
                    Text(
                      '₹${sellingSubtotal.toStringAsFixed(2)}',
                      style: const TextStyle(color: AppTheme.emeraldGreen, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ],
                ),
                if (priceSavings > 0) ...[
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Discount / Customer Savings', style: TextStyle(color: AppTheme.amberAccent, fontSize: 12, fontWeight: FontWeight.bold)),
                      Text(
                        '- ₹${priceSavings.toStringAsFixed(2)}',
                        style: const TextStyle(color: AppTheme.amberAccent, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('GST (5%)', style: TextStyle(color: mutedColor, fontSize: 13)),
                    Text('₹${tax.toStringAsFixed(2)}', style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 14)),
                  ],
                ),
                if (returnCredit > 0) ...[
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.remove_circle, size: 14, color: AppTheme.roseError),
                          SizedBox(width: 4),
                          Text('Less: Expired Return Credit (Last Rate)', style: TextStyle(color: AppTheme.roseError, fontSize: 12, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      Text(
                        '- ₹${returnCredit.toStringAsFixed(2)}',
                        style: const TextStyle(color: AppTheme.roseError, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ],
                  ),
                ],
                Divider(height: 20, color: borderColor),

                // Grand Total & Net Amount Payable
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          returnCredit > 0 ? 'Net Amount Payable' : 'Grand Total',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textColor),
                        ),
                        if (returnCredit > 0)
                          Text('Original Bill ₹${grandTotal.toStringAsFixed(2)} - Return Credit', style: TextStyle(fontSize: 10, color: mutedColor)),
                      ],
                    ),
                    Text(
                      '₹${netPayable.toStringAsFixed(2)}',
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: isDark ? AppTheme.reactCyan : AppTheme.snowActive),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Payment mode selector (CASH & UPI / QR Code)
                if (!_isSubmitted) ...[
                  Row(
                    children: [
                      Text('Payment Mode', style: TextStyle(color: textColor, fontSize: 13, fontWeight: FontWeight.bold)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppTheme.emeraldGreen.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text('Instant Settlement', style: TextStyle(color: AppTheme.emeraldGreen, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(child: _buildPaymentBtn(context, 'CASH', Icons.payments)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildPaymentBtn(context, 'UPI', Icons.qr_code_2)),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // SUBMIT ORDER BUTTON (Replaces old Preview & Post Invoice button)
                  ElevatedButton(
                    onPressed: (provider.salesDraftQuantities.isEmpty || _isSubmitting)
                        ? null
                        : () => _submitOrder(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isDark ? AppTheme.reactIndigo : AppTheme.snowActive,
                      disabledBackgroundColor: isDark ? AppTheme.slateSurface : AppTheme.snowHover,
                      foregroundColor: Colors.white,
                      disabledForegroundColor: mutedColor,
                      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 2,
                    ),
                    child: _isSubmitting
                        ? const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                              ),
                              SizedBox(width: 12),
                              Text(
                                'Submitting Sale...',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                              ),
                            ],
                          )
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.check_circle_rounded, size: 20, color: Colors.white),
                                  const SizedBox(width: 8),
                                  Text(
                                    provider.salesDraftQuantities.isEmpty
                                        ? 'Select Items to Submit'
                                        : 'Submit Order (${provider.salesDraftQuantities.values.fold(0, (a, b) => a + b)} items)',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                                  ),
                                ],
                              ),
                              if (provider.salesDraftQuantities.isNotEmpty)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    '₹${netPayable.toStringAsFixed(2)}',
                                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Colors.white),
                                  ),
                                ),
                            ],
                          ),
                  ),
                ] else ...[
                  // POST-SUBMISSION STATE: Shows Invoice Details and Sleek Icon Buttons
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0F291E) : const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.emeraldGreen.withValues(alpha: 0.5)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: const BoxDecoration(
                                color: AppTheme.emeraldGreen,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.check_rounded, color: Colors.white, size: 18),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Order Submitted & Completed!',
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.emeraldGreen),
                                  ),
                                  Text(
                                    'Invoice #${_submittedInvoice?.invoiceNumber ?? "SAVED"} • ₹${(_submittedInvoice?.netPayable ?? netPayable).toStringAsFixed(2)} (${_submittedInvoice?.paymentMode ?? "CASH"})',
                                    style: TextStyle(fontSize: 11, color: isDark ? AppTheme.slateMuted : const Color(0xFF065F46)),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            // Preview Invoice Icon Button
                            _buildActionIconButton(
                              context: context,
                              icon: Icons.receipt_long_rounded,
                              label: 'Preview Invoice',
                              color: AppTheme.reactIndigo,
                              onTap: () => _openInvoicePreview(context),
                            ),
                            // Print Receipt Icon Button
                            _buildActionIconButton(
                              context: context,
                              icon: Icons.print_rounded,
                              label: 'Print Thermal',
                              color: AppTheme.emeraldGreen,
                              onTap: () => _openThermalPrinter(context),
                            ),
                            // Share WhatsApp Icon Button
                            _buildActionIconButton(
                              context: context,
                              icon: Icons.share_rounded,
                              label: 'Share Bill',
                              color: AppTheme.reactCyan,
                              onTap: () => _showShareToast(context, 'WhatsApp Business'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: () => Navigator.of(context).pop(),
                            icon: const Icon(Icons.arrow_back, size: 16),
                            label: const Text('Back to Outlets / Route', style: TextStyle(fontWeight: FontWeight.bold)),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: isDark ? Colors.white : AppTheme.snowActive,
                              side: BorderSide(color: borderColor),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShopReturnSection(BuildContext context, DeliveryProvider provider) {
    final lastOrder = provider.getShopLastOrder(widget.shop.shopId);
    if (lastOrder == null || lastOrder.items.isEmpty) return const SizedBox.shrink();

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final returnCredit = provider.calculateReturnCredit(widget.shop.shopId);

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.slateSurface : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: returnCredit > 0 ? AppTheme.roseError : (isDark ? AppTheme.slateBorder : AppTheme.snowBorder),
          width: returnCredit > 0 ? 1.5 : 1,
        ),
      ),
      child: ExpansionTile(
        initiallyExpanded: returnCredit > 0,
        shape: const RoundedRectangleBorder(side: BorderSide.none),
        tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppTheme.roseError.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const AppSvgIcon(svgString: AppSvgIcons.returnBoxes, color: AppTheme.roseError, size: 18),
        ),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Shop Return & Exchange',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
            if (returnCredit > 0)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.roseError,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '-₹${returnCredit.toStringAsFixed(2)}',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 11),
                ),
              ),
          ],
        ),
        subtitle: Text(
          'Ref Last Purchase: ${lastOrder.invoiceNumber} (${lastOrder.items.length} items)',
          style: TextStyle(fontSize: 11, color: isDark ? AppTheme.slateMuted : AppTheme.snowMuted),
        ),
        children: [
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Select return items from last purchased order (Rates paid last time applied automatically):',
                  style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: isDark ? AppTheme.slateMuted : AppTheme.snowMuted),
                ),
                const SizedBox(height: 10),
                ...lastOrder.items.map((item) {
                  final returnQty = provider.getSalesReturnQuantity(item.productId);
                  final lineCredit = returnQty * item.unitPrice;
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: isDark ? AppTheme.slateBorder : AppTheme.snowBorder),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.productName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              const SizedBox(height: 2),
                              Row(
                                children: [
                                  Text(
                                    'Paid Last: ₹${item.unitPrice.toStringAsFixed(2)}',
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.emeraldGreen),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Bought: ${item.purchasedQuantity} pkts',
                                    style: TextStyle(fontSize: 10, color: isDark ? AppTheme.slateMuted : AppTheme.snowMuted),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Row(
                          children: [
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              icon: const Icon(Icons.remove_circle_outline, color: AppTheme.roseError, size: 20),
                              onPressed: (_isSubmitted || returnQty <= 0)
                                  ? null
                                  : () => provider.updateSalesReturnQuantity(item.productId, returnQty - 1),
                            ),
                            Text('$returnQty', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              icon: const Icon(Icons.add_circle_outline, color: AppTheme.emeraldGreen, size: 20),
                              onPressed: (_isSubmitted || returnQty >= item.remainingReturnable)
                                  ? null
                                  : () => provider.updateSalesReturnQuantity(item.productId, returnQty + 1),
                            ),
                          ],
                        ),
                        if (lineCredit > 0)
                          Padding(
                            padding: const EdgeInsets.only(left: 6),
                            child: Text(
                              '-₹${lineCredit.toStringAsFixed(0)}',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.roseError, fontSize: 12),
                            ),
                          ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentBtn(BuildContext context, String mode, IconData icon) {
    final provider = Provider.of<DeliveryProvider>(context);
    final active = provider.selectedPaymentMode == mode;

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return GestureDetector(
      onTap: _isSubmitted
          ? null
          : () {
              provider.updatePaymentMode(mode);
              if (mode == 'UPI') {
                _openUpiQrModal(context, provider.calculateGrandTotal());
              }
            },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: active
              ? (isDark ? AppTheme.reactIndigo : AppTheme.snowActive)
              : (isDark ? AppTheme.slateSurface : AppTheme.snowHover),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: active
                ? (isDark ? AppTheme.reactCyan : AppTheme.snowActive)
                : (isDark ? AppTheme.slateBorder : AppTheme.snowBorder),
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: active ? Colors.white : (isDark ? AppTheme.slateMuted : AppTheme.snowMuted)),
            const SizedBox(width: 8),
            Text(
              mode == 'UPI' ? 'UPI / QR Code' : 'Cash Instant',
              style: TextStyle(
                color: active ? Colors.white : theme.colorScheme.onSurface,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
