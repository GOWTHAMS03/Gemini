import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../../providers/delivery_provider.dart';
import '../../widgets/app_svg_icons.dart';

class TruckInventoryScreen extends StatefulWidget {
  const TruckInventoryScreen({super.key});

  @override
  State<TruckInventoryScreen> createState() => _TruckInventoryScreenState();
}

class _TruckInventoryScreenState extends State<TruckInventoryScreen> {
  String _searchQuery = '';
  String _stockFilter = 'ALL'; // ALL, LOW, AVAILABLE

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
          title: const Text('Live Truck Inventory'),
        ),
        body: Center(
          child: Text('No active trip loaded to verify stock.', style: TextStyle(color: mutedColor)),
        ),
      );
    }

    final totalLoaded = trip.items.fold(0, (sum, i) => sum + i.loadedQuantity);
    final totalSold = trip.items.fold(0, (sum, i) => sum + i.soldQuantity);
    final totalRemaining = trip.items.fold(0, (sum, i) => sum + i.remainingQuantity);

    final filteredItems = trip.items.where((item) {
      final matchesSearch = item.productName.toLowerCase().contains(_searchQuery.toLowerCase());
      if (_stockFilter == 'ALL') {
        return matchesSearch;
      } else if (_stockFilter == 'LOW') {
        return matchesSearch && item.remainingQuantity <= 10;
      } else {
        return matchesSearch && item.remainingQuantity > 0;
      }
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Truck Inventory'),
        actions: [
          IconButton(
            icon: AppSvgIcon(svgString: AppSvgIcons.sync, size: 20, color: theme.colorScheme.primary),
            tooltip: 'Refresh Inventory',
            onPressed: () async {
              await provider.refreshDataFromBackend();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Truck Inventory refreshed.')),
                );
              }
            },
          )
        ],
      ),
      body: RefreshIndicator(
        color: AppTheme.emeraldGreen,
        backgroundColor: isDark ? AppTheme.slateSurface : Colors.white,
        strokeWidth: 2.5,
        displacement: 20,
        onRefresh: () async {
          await provider.refreshDataFromBackend();
        },
        child: Column(
          children: [
            // Top Pastel Metric Cards Summary Grid (Matching React Dashboard Cards)
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: _buildMetricCard(
                    context,
                    title: 'Loaded',
                    value: '$totalLoaded',
                    unit: 'pkts',
                    svgIcon: AppSvgIcons.inventoryBoxes,
                    bgColor: isDark ? AppTheme.slateSurface : AppTheme.metricSky,
                    accentColor: isDark ? AppTheme.reactCyan : AppTheme.snowActive,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildMetricCard(
                    context,
                    title: 'Sold',
                    value: '$totalSold',
                    unit: 'pkts',
                    svgIcon: AppSvgIcons.spotSale,
                    bgColor: isDark ? AppTheme.slateSurface : AppTheme.metricEmerald,
                    accentColor: AppTheme.emeraldGreen,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildMetricCard(
                    context,
                    title: 'Stock Left',
                    value: '$totalRemaining',
                    unit: 'pkts',
                    svgIcon: AppSvgIcons.truck,
                    bgColor: isDark ? AppTheme.slateSurface : AppTheme.metricViolet,
                    accentColor: AppTheme.reactIndigo,
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 6.0),
            child: Column(
              children: [
                // Search Input Field
                TextField(
                  onChanged: (val) {
                    setState(() {
                      _searchQuery = val;
                    });
                  },
                  style: TextStyle(color: textColor),
                  decoration: InputDecoration(
                    hintText: 'Search stock by bread name...',
                    prefixIcon: Padding(
                      padding: const EdgeInsets.all(12.0),
                      child: AppSvgIcon(svgString: AppSvgIcons.info, size: 18, color: mutedColor),
                    ),
                  ),
                ),
                const SizedBox(height: 10),

                // Segmented Pill Filter Switcher (React Admin Style)
                Container(
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: isDark ? AppTheme.slateSurface : AppTheme.snowHover,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: borderColor),
                  ),
                  child: Row(
                    children: [
                      _buildPillFilter('All Stock', 'ALL'),
                      _buildPillFilter('Low Stock (≤10)', 'LOW'),
                      _buildPillFilter('Available', 'AVAILABLE'),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 6),

          // Stock Items List
          Expanded(
            child: filteredItems.isEmpty
                ? Center(
                    child: SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Text(
                          'No matching items found in truck stock.\nSwipe down to refresh from server.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: mutedColor, fontSize: 13, height: 1.4),
                        ),
                      ),
                    ),
                  )
                : ListView.builder(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: filteredItems.length,
                    itemBuilder: (context, index) {
                      final item = filteredItems[index];
                      final isLow = item.remainingQuantity <= 10;

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: Padding(
                          padding: const EdgeInsets.all(14.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      item.productName,
                                      style: TextStyle(fontWeight: FontWeight.bold, color: textColor, fontSize: 16),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: isLow
                                          ? AppTheme.roseError.withValues(alpha: 0.15)
                                          : AppTheme.emeraldGreen.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      isLow ? 'Low Stock Warning' : 'In Stock',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: isLow ? AppTheme.roseError : AppTheme.emeraldGreen,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),

                              // Dealer Rate Badge
                              Row(
                                children: [
                                  const AppSvgIcon(svgString: AppSvgIcons.lockActual, size: 14, color: AppTheme.snowMuted),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Dealer Rate: ₹${item.dealerPrice.toStringAsFixed(2)}',
                                    style: TextStyle(color: mutedColor, fontSize: 12, fontWeight: FontWeight.w500),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Divider(height: 1, color: borderColor),
                              const SizedBox(height: 12),

                              // Quantities Grid Row (Loaded | Sold | Stock Left)
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildStockStatBox(
                                      context,
                                      title: 'Loaded',
                                      value: '${item.loadedQuantity}',
                                      col: textColor,
                                    ),
                                  ),
                                  Container(width: 1, height: 32, color: borderColor),
                                  Expanded(
                                    child: _buildStockStatBox(
                                      context,
                                      title: 'Sold',
                                      value: '${item.soldQuantity}',
                                      col: mutedColor,
                                    ),
                                  ),
                                  Container(width: 1, height: 32, color: borderColor),
                                  Expanded(
                                    child: _buildStockStatBox(
                                      context,
                                      title: 'Remaining',
                                      value: '${item.remainingQuantity}',
                                      col: isLow ? AppTheme.roseError : AppTheme.emeraldGreen,
                                      isBold: true,
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
        ],
      ),
      ),
    );
  }

  Widget _buildMetricCard(
    BuildContext context, {
    required String title,
    required String value,
    required String unit,
    required String svgIcon,
    required Color bgColor,
    required Color accentColor,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isDark ? AppTheme.slateBorder : AppTheme.snowBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isDark ? AppTheme.slateMuted : AppTheme.snowText),
              ),
              AppSvgIcon(svgString: svgIcon, size: 16, color: accentColor),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                value,
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: accentColor, letterSpacing: -0.5),
              ),
              const SizedBox(width: 4),
              Text(
                unit,
                style: TextStyle(fontSize: 10, color: isDark ? AppTheme.slateMuted : AppTheme.snowMuted, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPillFilter(String label, String value) {
    final active = _stockFilter == value;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _stockFilter = value;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: active
                ? (isDark ? AppTheme.slateSurface : Colors.white)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: active
                ? [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : [],
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: active ? theme.colorScheme.onSurface : (isDark ? AppTheme.slateMuted : AppTheme.snowMuted),
              fontWeight: active ? FontWeight.bold : FontWeight.w600,
              fontSize: 11,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStockStatBox(BuildContext context, {required String title, required String value, required Color col, bool isBold = false}) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Column(
      children: [
        Text(
          title,
          style: TextStyle(fontSize: 11, color: isDark ? AppTheme.slateMuted : AppTheme.snowMuted, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: isBold ? FontWeight.w800 : FontWeight.bold,
            color: col,
          ),
        ),
      ],
    );
  }
}
