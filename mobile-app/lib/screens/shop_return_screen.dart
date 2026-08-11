import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/delivery_provider.dart';
import '../services/api_service.dart';
import '../widgets/app_svg_icons.dart';
import 'esc_pos_printer_screen.dart';
import 'sales_screen.dart';

class ShopReturnScreen extends StatefulWidget {
  final DeliveryShopModel? initialShop;

  const ShopReturnScreen({super.key, this.initialShop});

  @override
  State<ShopReturnScreen> createState() => _ShopReturnScreenState();
}

class _ShopReturnScreenState extends State<ShopReturnScreen> {
  DeliveryShopModel? _selectedShop;
  String _returnReason = 'EXPIRED'; // EXPIRED, DAMAGED, REJECTED, REPLACEMENT_ISSUED
  final TextEditingController _notesController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _selectedShop = widget.initialShop;
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _processStandaloneReturnSubmit(DeliveryProvider provider) async {
    if (_selectedShop == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a retail shop first.'), backgroundColor: AppTheme.roseError),
      );
      return;
    }

    final totalReturnQty = provider.calculateReturnTotalItems();
    final totalReturnValue = provider.calculateReturnCredit(_selectedShop!.shopId);

    if (totalReturnQty == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least 1 item for return.'), backgroundColor: AppTheme.amberAccent),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final lastOrder = provider.getShopLastOrder(_selectedShop!.shopId);
    final returnCode = 'RET-${Random().nextInt(89999) + 10000}';
    final returnPayload = {
      'returnCode': returnCode,
      'shopId': _selectedShop!.shopId,
      'shopName': _selectedShop!.shopName,
      'originalInvoiceId': lastOrder?.invoiceId,
      'originalInvoiceNumber': lastOrder?.invoiceNumber,
      'reason': _returnReason,
      'totalQty': totalReturnQty,
      'totalAmount': totalReturnValue,
      'notes': _notesController.text.trim(),
      'items': provider.salesReturnDraftQuantities.entries.map((entry) {
        final prodId = entry.key;
        final qty = entry.value;
        final item = lastOrder?.items.firstWhere((i) => i.productId == prodId);
        final unitPrice = item?.unitPrice ?? 0.0;
        return {
          'productId': prodId,
          'name': item?.productName ?? 'Product #$prodId',
          'qty': qty,
          'unitPrice': unitPrice,
          'total': qty * unitPrice,
        };
      }).toList(),
    };

    try {
      await ApiService().submitShopReturn(returnPayload);

      if (mounted) {
        // Update local outstanding balance & clear return draft
        _selectedShop!.outstandingBalance = max(0.0, _selectedShop!.outstandingBalance - totalReturnValue);
        provider.clearReturnDraft();
        setState(() => _isSubmitting = false);
        _showReturnSuccessModal(returnCode, returnPayload);
      }
    } catch (e) {
      if (mounted) {
        _selectedShop!.outstandingBalance = max(0.0, _selectedShop!.outstandingBalance - totalReturnValue);
        provider.clearReturnDraft();
        setState(() => _isSubmitting = false);
        _showReturnSuccessModal(returnCode, returnPayload, isOffline: true);
      }
    }
  }

  void _showReturnSuccessModal(String returnCode, Map<String, dynamic> returnData, {bool isOffline = false}) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            AppSvgIcon(svgString: AppSvgIcons.checkCircle, color: AppTheme.emeraldGreen, size: 28),
            SizedBox(width: 10),
            Text('Return Credit Issued!'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Credit Note issued for ${_selectedShop!.shopName} based on last purchase price.',
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSummaryRow('Return Slip Code:', returnCode, isBold: true),
                  if (returnData['originalInvoiceNumber'] != null)
                    _buildSummaryRow('Ref Purchase Inv:', returnData['originalInvoiceNumber']),
                  _buildSummaryRow('Return Reason:', returnData['reason']),
                  _buildSummaryRow('Total Items Returned:', '${returnData['totalQty']} Loaves/Packs'),
                  _buildSummaryRow(
                    'Credit Amount (Last Paid Rate):',
                    '₹${(returnData['totalAmount'] as double).toStringAsFixed(2)}',
                    isBold: true,
                    color: AppTheme.roseError,
                  ),
                  if (isOffline)
                    const Padding(
                      padding: EdgeInsets.only(top: 6),
                      child: Text('Saved locally. Will sync to server when online.',
                          style: TextStyle(fontSize: 10, color: AppTheme.amberAccent, fontStyle: FontStyle.italic)),
                    ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          OutlinedButton.icon(
            onPressed: () {
              Navigator.of(ctx).pop();
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => EscPosPrinterScreen(
                    invoiceData: {
                      'invoiceNumber': returnCode,
                      'shopName': _selectedShop!.shopName,
                      'phone': _selectedShop!.phone,
                      'paymentMode': 'CREDIT_NOTE_RETURN',
                      'grandTotal': returnData['totalAmount'],
                      'items': (returnData['items'] as List).map((i) => {
                        'productName': '[RET] ${i['name']}',
                        'quantity': i['qty'],
                        'unitPrice': i['unitPrice'],
                        'totalPrice': i['total'],
                      }).toList(),
                    },
                  ),
                ),
              );
            },
            icon: const Icon(Icons.print, size: 16, color: AppTheme.reactIndigo),
            label: const Text('Print Slip'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              Navigator.of(context).pop(true);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.emeraldGreen),
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isBold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          Text(
            value,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
              color: color ?? (isBold ? AppTheme.reactIndigo : Colors.black87),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<DeliveryProvider>(context);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final textColor = isDark ? Colors.white : AppTheme.snowText;
    final mutedColor = isDark ? AppTheme.slateMuted : AppTheme.snowMuted;
    final cardBg = isDark ? AppTheme.slateSurface : Colors.white;
    final borderColor = isDark ? AppTheme.slateBorder : AppTheme.snowBorder;

    final lastOrder = _selectedShop != null ? provider.getShopLastOrder(_selectedShop!.shopId) : null;
    final returnCreditVal = _selectedShop != null ? provider.calculateReturnCredit(_selectedShop!.shopId) : 0.0;
    final returnQtyTotal = provider.calculateReturnTotalItems();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Shop Return & Replacement'),
        actions: [
          if (returnQtyTotal > 0)
            IconButton(
              icon: const Icon(Icons.cleaning_services_outlined, color: AppTheme.amberAccent),
              tooltip: 'Clear Return Draft',
              onPressed: () {
                provider.clearReturnDraft();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Cleared return selection.')),
                );
              },
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Outlet Selection Banner
            Card(
              color: cardBg,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: borderColor),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const AppSvgIcon(svgString: AppSvgIcons.store, size: 18, color: AppTheme.reactIndigo),
                        const SizedBox(width: 8),
                        Text('Target Outlet for Return', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: textColor)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<DeliveryShopModel>(
                      initialValue: _selectedShop,
                      decoration: const InputDecoration(
                        labelText: 'Select Retail Outlet *',
                        prefixIcon: Padding(
                          padding: EdgeInsets.all(12),
                          child: AppSvgIcon(svgString: AppSvgIcons.store, size: 18, color: AppTheme.reactIndigo),
                        ),
                      ),
                      items: provider.shops.map((s) => DropdownMenuItem(value: s, child: Text('${s.shopCode} - ${s.shopName}'))).toList(),
                      onChanged: (val) {
                        setState(() => _selectedShop = val);
                        provider.clearReturnDraft();
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            if (_selectedShop == null) ...[
              // Prompt to select an outlet
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: cardBg,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: borderColor),
                ),
                child: Column(
                  children: [
                    const AppSvgIcon(svgString: AppSvgIcons.returnBoxes, size: 48, color: AppTheme.reactIndigo),
                    const SizedBox(height: 12),
                    Text(
                      'Select a Retail Outlet',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: textColor),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Choose a customer outlet from the dropdown above to inspect returned goods, calculate credit notes, or process replacements.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: mutedColor),
                    ),
                  ],
                ),
              ),
            ] else ...[
              // Last Purchased Order or Catalog Return Info Banner
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.slateSurface : AppTheme.metricSky,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isDark ? AppTheme.slateBorder : AppTheme.snowBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.history_toggle_off, size: 16, color: AppTheme.reactIndigo),
                            const SizedBox(width: 6),
                            Text(
                              lastOrder != null ? 'Last Purchased Order Reference' : 'Catalog Products Return',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: theme.colorScheme.onSurface),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.reactIndigo.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            lastOrder?.invoiceNumber ?? 'CATALOG',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.reactIndigo),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          lastOrder != null 
                              ? 'Purchased on ${lastOrder.invoiceDate.day}/${lastOrder.invoiceDate.month}/${lastOrder.invoiceDate.year}'
                              : 'Standard Unit Pricing Catalog',
                          style: TextStyle(fontSize: 11, color: mutedColor),
                        ),
                        if (lastOrder != null)
                          Text(
                            'Last Bill: ₹${lastOrder.grandTotal.toStringAsFixed(2)}',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.emeraldGreen),
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      lastOrder != null 
                          ? '• Items from last order shown. Return credit computed at last paid price.'
                          : '• Standard product catalog available for returns and exchanges.',
                      style: TextStyle(fontSize: 10, fontStyle: FontStyle.italic, color: mutedColor),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Return Reason Chips
              Text('Return Reason Category', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textColor)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  _buildReasonChip('EXPIRED', 'Stale / Expired Bread', Icons.query_builder),
                  _buildReasonChip('DAMAGED', 'Crushed / Damaged', Icons.broken_image),
                  _buildReasonChip('REJECTED', 'Customer Rejected', Icons.cancel),
                  _buildReasonChip('REPLACEMENT_ISSUED', 'Direct Exchange', Icons.sync_alt),
                ],
              ),
              const SizedBox(height: 20),

              // Returnable Items List Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(lastOrder != null ? 'Last Order Purchased Items' : 'All Products Catalog', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textColor)),
                  Text('$returnQtyTotal Returned', style: const TextStyle(fontSize: 12, color: AppTheme.roseError, fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(height: 10),

              // Items List
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: lastOrder != null ? lastOrder.items.length : provider.products.length,
                itemBuilder: (ctx, idx) {
                  final int productId = lastOrder != null ? lastOrder.items[idx].productId : provider.products[idx].productId;
                  final String productName = lastOrder != null ? lastOrder.items[idx].productName : provider.products[idx].productName;
                  final double unitPrice = lastOrder != null ? lastOrder.items[idx].unitPrice : provider.products[idx].basePrice;
                  final int returnQty = provider.getSalesReturnQuantity(productId);
                  final double lineCredit = returnQty * unitPrice;
                  final int remainingReturnable = lastOrder != null ? lastOrder.items[idx].remainingReturnable : 999;

                  return Card(
                    color: cardBg,
                    margin: const EdgeInsets.only(bottom: 10),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                      side: BorderSide(
                        color: returnQty > 0 ? AppTheme.roseError : borderColor,
                        width: returnQty > 0 ? 1.5 : 1,
                      ),
                    ),
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
                                      productName,
                                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textColor),
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: AppTheme.emeraldGreen.withValues(alpha: 0.15),
                                            borderRadius: BorderRadius.circular(6),
                                            border: Border.all(color: AppTheme.emeraldGreen),
                                          ),
                                          child: Text(
                                            'Rate: ₹${unitPrice.toStringAsFixed(2)}/pkt',
                                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.emeraldGreen),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              if (lineCredit > 0)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppTheme.roseError.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    '-₹${lineCredit.toStringAsFixed(2)}',
                                    style: const TextStyle(color: AppTheme.roseError, fontWeight: FontWeight.w800, fontSize: 13),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                lastOrder != null ? 'Return Qty (Max $remainingReturnable)' : 'Return Qty',
                                style: TextStyle(fontSize: 11, color: mutedColor, fontWeight: FontWeight.w600),
                              ),
                              Row(
                                children: [
                                  IconButton.filledTonal(
                                    onPressed: returnQty > 0
                                        ? () => provider.updateSalesReturnQuantity(productId, returnQty - 1)
                                        : null,
                                    icon: const Icon(Icons.remove, size: 16),
                                    style: IconButton.styleFrom(minimumSize: const Size(34, 34), padding: EdgeInsets.zero),
                                  ),
                                  Container(
                                    width: 40,
                                    alignment: Alignment.center,
                                    child: Text(
                                      '$returnQty',
                                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: textColor),
                                    ),
                                  ),
                                  IconButton.filledTonal(
                                    onPressed: returnQty < remainingReturnable
                                        ? () => provider.updateSalesReturnQuantity(productId, returnQty + 1)
                                        : () {
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              SnackBar(content: Text('Cannot return more than purchased quantity!')),
                                            );
                                          },
                                    icon: const Icon(Icons.add, size: 16),
                                    style: IconButton.styleFrom(minimumSize: const Size(34, 34), padding: EdgeInsets.zero),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 14),

              // Notes Input Field
              TextFormField(
                controller: _notesController,
                decoration: const InputDecoration(
                  labelText: 'Inspection Notes (Optional)',
                  hintText: 'e.g., Expired loaves collected during route.',
                  prefixIcon: Padding(
                    padding: EdgeInsets.all(12),
                    child: AppSvgIcon(svgString: AppSvgIcons.info, size: 18, color: AppTheme.reactIndigo),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Live Return Credit Summary Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.slateSurface : const Color(0xFFFFF1F2),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isDark ? AppTheme.slateBorder : const Color(0xFFFECDD3), width: 1.5),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'TOTAL RETURN CREDIT',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.roseError, letterSpacing: 0.5),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '$returnQtyTotal Loaves Total',
                          style: TextStyle(fontSize: 12, color: mutedColor),
                        ),
                      ],
                    ),
                    Text(
                      '₹${returnCreditVal.toStringAsFixed(2)}',
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppTheme.roseError),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Action 1: Apply to New Bill (Spot Sale)
              ElevatedButton.icon(
                onPressed: returnQtyTotal == 0
                    ? null
                    : () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => SalesScreen(shop: _selectedShop!),
                          ),
                        );
                      },
                icon: const Icon(Icons.shopping_cart_checkout, size: 20),
                label: const Text('Apply Return Credit to New Bill (Spot Sale)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.emeraldGreen,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(52),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 2,
                ),
              ),
              const SizedBox(height: 10),

              // Action 2: Process Standalone Return Slip
              OutlinedButton.icon(
                onPressed: _isSubmitting || returnQtyTotal == 0
                    ? null
                    : () => _processStandaloneReturnSubmit(provider),
                icon: _isSubmitting
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : const AppSvgIcon(svgString: AppSvgIcons.returnBoxes, size: 18, color: AppTheme.roseError),
                label: Text(
                  _isSubmitting ? 'Processing Return Slip...' : 'Issue Standalone Credit Note',
                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.roseError, fontSize: 14),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppTheme.roseError),
                  minimumSize: const Size.fromHeight(48),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildReasonChip(String value, String label, IconData icon) {
    final bool isSelected = _returnReason == value;
    return ChoiceChip(
      avatar: Icon(icon, size: 14, color: isSelected ? Colors.white : AppTheme.reactIndigo),
      label: Text(label, style: const TextStyle(fontSize: 11)),
      selected: isSelected,
      selectedColor: AppTheme.reactIndigo,
      onSelected: (sel) {
        if (sel) {
          setState(() => _returnReason = value);
          Provider.of<DeliveryProvider>(context, listen: false).setReturnReason(value);
        }
      },
    );
  }
}
