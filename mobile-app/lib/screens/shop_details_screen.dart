import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../providers/delivery_provider.dart';
import '../widgets/app_svg_icons.dart';
import 'shop_return_screen.dart';

class ShopDetailsScreen extends StatelessWidget {
  final DeliveryShopModel shop;

  const ShopDetailsScreen({super.key, required this.shop});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<DeliveryProvider>(context);
    final shopInvoices = provider.allPastInvoices.where((inv) => inv.shopId == shop.shopId).toList();

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final textColor = isDark ? Colors.white : AppTheme.snowText;
    final mutedColor = isDark ? AppTheme.slateMuted : AppTheme.snowMuted;
    final cardBg = isDark ? AppTheme.slateSurface : Colors.white;
    final borderColor = isDark ? AppTheme.slateBorder : AppTheme.snowBorder;

    return Scaffold(
      appBar: AppBar(
        title: Text(shop.shopName, style: TextStyle(fontWeight: FontWeight.bold, color: textColor)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Shop Identity Banner Card
            Card(
              color: cardBg,
              elevation: isDark ? 0 : 1,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: borderColor),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.reactIndigo.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.reactIndigo.withValues(alpha: 0.3)),
                          ),
                          child: Row(
                            children: [
                              const AppSvgIcon(svgString: AppSvgIcons.store, size: 14, color: AppTheme.reactIndigo),
                              const SizedBox(width: 6),
                              Text(
                                shop.shopCode,
                                style: const TextStyle(
                                  color: AppTheme.reactIndigo,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 12,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: shop.deliveryStatus == 'DELIVERED'
                                ? AppTheme.emeraldGreen.withValues(alpha: 0.15)
                                : AppTheme.amberAccent.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: shop.deliveryStatus == 'DELIVERED' ? AppTheme.emeraldGreen : AppTheme.amberAccent,
                            ),
                          ),
                          child: Text(
                            shop.deliveryStatus,
                            style: TextStyle(
                              color: shop.deliveryStatus == 'DELIVERED' ? AppTheme.emeraldGreen : AppTheme.amberAccent,
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      shop.shopName,
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: textColor),
                    ),
                    const SizedBox(height: 12),
                    const Divider(height: 1),
                    const SizedBox(height: 12),

                    _buildInfoTile(
                      iconSvg: AppSvgIcons.driverPerson,
                      label: 'Owner Name',
                      value: shop.ownerName,
                      textColor: textColor,
                      mutedColor: mutedColor,
                    ),
                    const SizedBox(height: 8),
                    _buildInfoTile(
                      iconSvg: AppSvgIcons.phone,
                      label: 'Contact',
                      value: shop.phone,
                      textColor: textColor,
                      mutedColor: mutedColor,
                    ),
                    const SizedBox(height: 8),
                    _buildInfoTile(
                      iconSvg: AppSvgIcons.locationCity,
                      label: 'Address',
                      value: shop.address,
                      textColor: textColor,
                      mutedColor: mutedColor,
                    ),
                    const SizedBox(height: 8),
                    _buildInfoTile(
                      iconSvg: AppSvgIcons.routePath,
                      label: 'Route Name',
                      value: shop.routeName,
                      textColor: textColor,
                      mutedColor: mutedColor,
                    ),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => ShopReturnScreen(initialShop: shop),
                            ),
                          );
                        },
                        icon: const AppSvgIcon(svgString: AppSvgIcons.returnBoxes, size: 16, color: AppTheme.roseError),
                        label: const Text(
                          'Process Return / Replacement',
                          style: TextStyle(color: AppTheme.roseError, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: AppTheme.roseError),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Financial & Dues Summary Header
            Text(
              'Outlet Financial Status',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textColor),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: Card(
                    color: cardBg,
                    elevation: isDark ? 0 : 1,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                      side: BorderSide(color: borderColor),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(14.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const AppSvgIcon(svgString: AppSvgIcons.cash, size: 14, color: AppTheme.roseError),
                              const SizedBox(width: 6),
                              Text('Outstanding Dues', style: TextStyle(color: mutedColor, fontSize: 12, fontWeight: FontWeight.w600)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '₹${shop.outstandingBalance.toStringAsFixed(2)}',
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppTheme.roseError),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Card(
                    color: cardBg,
                    elevation: isDark ? 0 : 1,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                      side: BorderSide(color: borderColor),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(14.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const AppSvgIcon(svgString: AppSvgIcons.categoryTag, size: 14, color: AppTheme.emeraldGreen),
                              const SizedBox(width: 6),
                              Text('Payment Terms', style: TextStyle(color: mutedColor, fontSize: 12, fontWeight: FontWeight.w600)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Instant Cash/UPI',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppTheme.emeraldGreen),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Sales and Visit Metrics Header
            Text(
              'Visits & Order History',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textColor),
            ),
            const SizedBox(height: 10),
            Card(
              color: cardBg,
              elevation: isDark ? 0 : 1,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: borderColor),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    _buildHistoryRow('Sales Status', shop.salesStatus, AppTheme.amberAccent, textColor: textColor, mutedColor: mutedColor),
                    Divider(color: borderColor, height: 16),
                    _buildHistoryRow('Last Visit Date', shop.lastVisitDate, textColor, textColor: textColor, mutedColor: mutedColor),
                    Divider(color: borderColor, height: 16),
                    _buildHistoryRow('Total Orders Today', '${shopInvoices.length}', textColor, textColor: textColor, mutedColor: mutedColor),
                    Divider(color: borderColor, height: 16),
                    _buildHistoryRow(
                      'Total Purchases Today',
                      '₹${shopInvoices.fold(0.0, (sum, i) => sum + i.grandTotal).toStringAsFixed(2)}',
                      AppTheme.emeraldGreen,
                      textColor: textColor,
                      mutedColor: mutedColor,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Invoices section Header
            Text(
              'Previous Invoices Today',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textColor),
            ),
            const SizedBox(height: 10),
            if (shopInvoices.isEmpty)
              Card(
                color: cardBg,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                  side: BorderSide(color: borderColor),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Center(
                    child: Column(
                      children: [
                        AppSvgIcon(svgString: AppSvgIcons.info, size: 28, color: mutedColor),
                        const SizedBox(height: 8),
                        Text('No orders recorded at this shop today.', style: TextStyle(color: mutedColor, fontSize: 13, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: shopInvoices.length,
                itemBuilder: (context, index) {
                  final invoice = shopInvoices[index];
                  return Card(
                    color: cardBg,
                    margin: const EdgeInsets.only(bottom: 8),
                    elevation: isDark ? 0 : 1,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                      side: BorderSide(color: borderColor),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.reactIndigo.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const AppSvgIcon(svgString: AppSvgIcons.eodClosing, size: 20, color: AppTheme.reactIndigo),
                      ),
                      title: Text(
                        invoice.invoiceNumber,
                        style: TextStyle(fontWeight: FontWeight.bold, color: textColor, fontSize: 14),
                      ),
                      subtitle: Text(
                        '${invoice.paymentMode} | ${invoice.items.length} Items | '
                        '${invoice.dateTime.hour.toString().padLeft(2, '0')}:${invoice.dateTime.minute.toString().padLeft(2, '0')}',
                        style: TextStyle(color: mutedColor, fontSize: 11),
                      ),
                      trailing: Text(
                        '₹${invoice.grandTotal.toStringAsFixed(2)}',
                        style: const TextStyle(color: AppTheme.emeraldGreen, fontWeight: FontWeight.w800, fontSize: 15),
                      ),
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoTile({
    required String iconSvg,
    required String label,
    required String value,
    required Color textColor,
    required Color mutedColor,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 2),
          child: AppSvgIcon(svgString: iconSvg, size: 14, color: AppTheme.reactIndigo),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 90,
          child: Text(label, style: TextStyle(color: mutedColor, fontSize: 12, fontWeight: FontWeight.w500)),
        ),
        const Text(': ', style: TextStyle(color: Colors.grey, fontSize: 12)),
        Expanded(
          child: Text(value, style: TextStyle(color: textColor, fontSize: 12, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }

  Widget _buildHistoryRow(String label, String value, Color valueColor, {required Color textColor, required Color mutedColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: mutedColor, fontSize: 12, fontWeight: FontWeight.w500)),
          Text(value, style: TextStyle(color: valueColor, fontWeight: FontWeight.bold, fontSize: 12)),
        ],
      ),
    );
  }
}
