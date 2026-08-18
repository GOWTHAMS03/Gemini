import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../providers/delivery_provider.dart';
import '../services/api_service.dart';
import '../../widgets/app_svg_icons.dart';
import 'shop_acknowledgement_screen.dart';
import 'sales_screen.dart';
import 'shop_details_screen.dart';
import 'truck_inventory_screen.dart';
import 'end_of_day_screen.dart';
import 'esc_pos_printer_screen.dart';
import 'shop_onboarding_screen.dart';
import 'shop_return_screen.dart';
import 'package:url_launcher/url_launcher.dart';
import 'daily_trip_plan_screen.dart';
import 'trip_route_map_screen.dart';
import 'login_screen.dart';

class DriverDashboardScreen extends StatefulWidget {
  const DriverDashboardScreen({super.key});

  @override
  State<DriverDashboardScreen> createState() => _DriverDashboardScreenState();
}

class _DriverDashboardScreenState extends State<DriverDashboardScreen> {
  bool _isHeaderFolded = false;

  void _showStartTripVerificationModal(BuildContext context, DeliveryProvider provider) {
    if (provider.activeTrip == null) return;
    final trip = provider.activeTrip!;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    bool isChecked = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(context).viewInsets.bottom + 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.withValues(alpha: 0.4),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.emeraldGreen.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.play_arrow_rounded, color: AppTheme.emeraldGreen, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Verify & Start Sales Route Trip',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: isDark ? Colors.white : Colors.black87,
                              ),
                            ),
                            Text(
                              'Trip #${trip.tripNumber}',
                              style: const TextStyle(fontSize: 12, color: AppTheme.reactCyan, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: isDark ? AppTheme.slateBorder : Colors.black12),
                    ),
                    child: Column(
                      children: [
                        _buildVerificationRow('Route Corridor:', trip.routeName.isNotEmpty ? trip.routeName : 'Standard Route', isDark),
                        const SizedBox(height: 8),
                        _buildVerificationRow('Vehicle & Fleet:', trip.vehicleNumber.isNotEmpty ? trip.vehicleNumber : 'Delivery Van', isDark),
                        const SizedBox(height: 8),
                        _buildVerificationRow('Loaded Truck Inventory:', '${trip.totalLoadedQuantity} Pkts Loaded', isDark, isHighlight: true),
                        const SizedBox(height: 8),
                        _buildVerificationRow('Planned Customer Outlets:', '${provider.shops.length} Stops', isDark),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  InkWell(
                    onTap: () => setModalState(() => isChecked = !isChecked),
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.emeraldGreen.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.emeraldGreen.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          Checkbox(
                            value: isChecked,
                            onChanged: (val) => setModalState(() => isChecked = val ?? false),
                            activeColor: AppTheme.emeraldGreen,
                          ),
                          const Expanded(
                            child: Text(
                              'I verify that truck inventory is loaded and the vehicle is departing now.',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.emeraldGreen),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: isChecked ? () async {
                        Navigator.pop(ctx);
                        await provider.startTripWithVerification();
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('🚀 Trip Started! Active route execution underway.'),
                              backgroundColor: AppTheme.emeraldGreen,
                            ),
                          );
                        }
                      } : null,
                      icon: const Icon(Icons.play_arrow_rounded, color: Colors.white),
                      label: const Text('Confirm & Start Trip Now', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.emeraldGreen,
                        disabledBackgroundColor: Colors.grey.withValues(alpha: 0.3),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showEndTripVerificationModal(BuildContext context, DeliveryProvider provider) {
    if (provider.activeTrip == null) return;
    final trip = provider.activeTrip!;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    bool isChecked = false;
    final completedVisits = provider.shops.where((s) => s.deliveryStatus == 'DELIVERED' || s.salesStatus == 'SOLD').length;
    final totalShops = provider.shops.length;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(context).viewInsets.bottom + 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.withValues(alpha: 0.4),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.purple.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.check_circle_rounded, color: Colors.purple, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Verify & End Sales Route Trip',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: isDark ? Colors.white : Colors.black87,
                              ),
                            ),
                            Text(
                              'Trip #${trip.tripNumber} Reconciliation',
                              style: const TextStyle(fontSize: 12, color: Colors.purple, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: isDark ? AppTheme.slateBorder : Colors.black12),
                    ),
                    child: Column(
                      children: [
                        _buildVerificationRow('Completed Visits:', '$completedVisits / $totalShops Shops', isDark),
                        const SizedBox(height: 8),
                        _buildVerificationRow('Delivered Stock:', '${trip.totalSoldQuantity} Pkts', isDark),
                        const SizedBox(height: 8),
                        _buildVerificationRow('Remaining Truck Returns:', '${provider.totalRemainingPkts} Pkts returning', isDark, isHighlight: true),
                        const SizedBox(height: 8),
                        _buildVerificationRow('Collected Cash / UPI:', '₹${provider.totalSalesCollection.toStringAsFixed(0)}', isDark, isHighlight: true),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  InkWell(
                    onTap: () => setModalState(() => isChecked = !isChecked),
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.purple.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.purple.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          Checkbox(
                            value: isChecked,
                            onChanged: (val) => setModalState(() => isChecked = val ?? false),
                            activeColor: Colors.purple,
                          ),
                          const Expanded(
                            child: Text(
                              'I verify that all shop deliveries, invoices, and collected payments are finalized for return reconciliation.',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.purple),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: isChecked ? () async {
                        Navigator.pop(ctx);
                        await provider.endTripWithVerification();
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('🏁 Trip Completed & Reconciled!'),
                              backgroundColor: Colors.purple,
                            ),
                          );
                        }
                      } : null,
                      icon: const Icon(Icons.check_circle_rounded, color: Colors.white),
                      label: const Text('Confirm & End Trip Now', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.purple,
                        disabledBackgroundColor: Colors.grey.withValues(alpha: 0.3),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildVerificationRow(String label, String value, bool isDark, {bool isHighlight = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: isDark ? Colors.white60 : Colors.black54,
            fontWeight: FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 12,
            color: isHighlight
                ? (isDark ? AppTheme.reactCyan : AppTheme.reactIndigo)
                : (isDark ? Colors.white : Colors.black87),
            fontWeight: isHighlight ? FontWeight.bold : FontWeight.w600,
          ),
        ),
      ],
    );
  }

  void _showLiveTripStatusPicker(BuildContext context, DeliveryProvider provider) {
    if (provider.activeTrip == null) return;
    
    final currentStatus = provider.activeTrip!.status;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  const Icon(Icons.swap_calls_rounded, color: AppTheme.reactCyan, size: 22),
                  const SizedBox(width: 8),
                  Text(
                    'Update Live Trip Status',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : Colors.black,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'Trip #${provider.activeTrip!.tripNumber} • Live sync to Admin Hub',
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? Colors.white60 : Colors.black54,
                ),
              ),
              const SizedBox(height: 16),
              _buildStatusOption(
                context,
                provider,
                statusKey: 'DISPATCHED',
                title: 'DISPATCHED (Ready at Factory)',
                icon: Icons.inventory_2_rounded,
                color: Colors.blue,
                isSelected: currentStatus == 'DISPATCHED',
              ),
              _buildStatusOption(
                context,
                provider,
                statusKey: 'IN_PROGRESS',
                title: 'IN PROGRESS (In Transit 🚚 - Verified Start)',
                icon: Icons.local_shipping_rounded,
                color: AppTheme.emeraldGreen,
                isSelected: currentStatus == 'IN_PROGRESS' || currentStatus == 'IN TRANSIT',
              ),
              _buildStatusOption(
                context,
                provider,
                statusKey: 'PAUSED',
                title: 'PAUSED (Break / Maintenance ⏸️)',
                icon: Icons.pause_circle_filled_rounded,
                color: Colors.amber,
                isSelected: currentStatus == 'PAUSED',
              ),
              _buildStatusOption(
                context,
                provider,
                statusKey: 'COMPLETED',
                title: 'COMPLETED (End & Settle Trip ✓)',
                icon: Icons.check_circle_rounded,
                color: Colors.purple,
                isSelected: currentStatus == 'COMPLETED',
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatusOption(
    BuildContext context,
    DeliveryProvider provider, {
    required String statusKey,
    required String title,
    required IconData icon,
    required Color color,
    required bool isSelected,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () async {
          Navigator.pop(context);
          if (statusKey == 'IN_PROGRESS') {
            _showStartTripVerificationModal(context, provider);
          } else if (statusKey == 'COMPLETED') {
            _showEndTripVerificationModal(context, provider);
          } else {
            final success = await provider.updateTripStatus(statusKey);
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    success
                        ? '✓ Live trip status updated to $statusKey'
                        : 'Trip status set to $statusKey (offline mode)',
                  ),
                  backgroundColor: color,
                ),
              );
            }
          }
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: isSelected
                ? color.withValues(alpha: 0.15)
                : (isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC)),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? color : (isDark ? Colors.white12 : Colors.black12),
              width: isSelected ? 1.5 : 1,
            ),
          ),
          child: Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
              ),
              if (isSelected)
                Icon(Icons.check_rounded, color: color, size: 18),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<DeliveryProvider>(context);

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final textColor = theme.colorScheme.onSurface;
    final mutedColor = isDark ? AppTheme.slateMuted : AppTheme.snowMuted;
    final borderColor = isDark ? AppTheme.slateBorder : AppTheme.snowBorder;

    if (provider.currentDriver == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) {
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (_) => const LoginScreen()),
            (route) => false,
          );
        }
      });
      return Scaffold(
        backgroundColor: theme.scaffoldBackgroundColor,
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final loadedPkts = provider.activeTrip?.items.fold(0, (sum, i) => sum + i.loadedQuantity) ?? 0;

    return Scaffold(
      appBar: AppBar(
        leading: Builder(
          builder: (context) => IconButton(
            icon: AppSvgIcon(svgString: AppSvgIcons.hamburgerMenu, size: 20, color: theme.colorScheme.primary),
            tooltip: 'Open Navigation Drawer',
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        title: FittedBox(
          fit: BoxFit.scaleDown,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: Image.asset(
                  'assets/logo.jfif',
                  height: 24,
                  width: 24,
                  fit: BoxFit.cover,
                  errorBuilder: (ctx, e, s) => const SizedBox.shrink(),
                ),
              ),
              const SizedBox(width: 8),
              const Text('Gemini Foods'),
            ],
          ),
        ),
        actions: [
          IconButton(
            icon: const Badge(
              label: Text('1'),
              child: Icon(Icons.notifications_active_rounded, size: 22, color: AppTheme.reactCyan),
            ),
            tooltip: 'Admin Dispatch Alerts',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const DailyTripPlanScreen()),
              );
            },
          ),
          IconButton(
            icon: AppSvgIcon(svgString: AppSvgIcons.onboardShop, size: 20, color: theme.colorScheme.primary),
            tooltip: 'Onboard New Outlet',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const ShopOnboardingScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.print, size: 22, color: AppTheme.emeraldGreen),
            tooltip: 'ESC/POS Printer Connection',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const EscPosPrinterScreen()),
              );
            },
          ),
        ],
      ),
      drawer: AppNavigationDrawer(provider: provider),
      body: NotificationListener<ScrollNotification>(
        onNotification: (scrollNotification) {
          if (scrollNotification is ScrollUpdateNotification) {
            if (scrollNotification.metrics.pixels > 60 && !_isHeaderFolded) {
              setState(() => _isHeaderFolded = true);
            } else if (scrollNotification.metrics.pixels <= 10 && _isHeaderFolded) {
              setState(() => _isHeaderFolded = false);
            }
          }
          return false;
        },
        child: RefreshIndicator(
          color: AppTheme.emeraldGreen,
          backgroundColor: isDark ? AppTheme.slateSurface : Colors.white,
          strokeWidth: 2.5,
          displacement: 20,
          onRefresh: () async {
            await provider.refreshDataFromBackend();
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.only(bottom: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AnimatedCrossFade(
                  duration: const Duration(milliseconds: 300),
                  firstCurve: Curves.easeInOut,
                  secondCurve: Curves.easeInOut,
                  crossFadeState: _isHeaderFolded ? CrossFadeState.showFirst : CrossFadeState.showSecond,
                  firstChild:
                    // ─── Folded Summary Header Card (Scroll Collapsed Mode) ─────────────
                    Container(
                      margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: isDark ? AppTheme.slateSurface : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: isDark ? AppTheme.slateBorder : const Color(0xFFE2E8F0)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: AppTheme.reactIndigo.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              Icons.local_shipping_rounded,
                              size: 18,
                              color: isDark ? AppTheme.reactCyan : AppTheme.reactIndigo,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        '${provider.activeTrip?.tripNumber ?? "TRIP-2026"} • ${provider.activeTrip?.vehicleNumber.isNotEmpty == true ? provider.activeTrip!.vehicleNumber : "Assigned Van"}',
                                        style: TextStyle(color: textColor, fontSize: 12, fontWeight: FontWeight.bold),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: AppTheme.emeraldGreen.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(color: AppTheme.emeraldGreen.withValues(alpha: 0.3)),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(Icons.account_balance_wallet_rounded, size: 11, color: AppTheme.emeraldGreen),
                                          const SizedBox(width: 3),
                                          Text(
                                            '₹${provider.totalCollected.toStringAsFixed(0)} Collected Today',
                                            style: const TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                              color: AppTheme.emeraldGreen,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Route: ${provider.activeTrip?.routeName.isNotEmpty == true ? provider.activeTrip!.routeName : "Standard Route"} • $loadedPkts Pkts',
                                  style: TextStyle(color: mutedColor, fontSize: 11, fontWeight: FontWeight.w500),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          InkWell(
                            onTap: () => setState(() => _isHeaderFolded = false),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                              decoration: BoxDecoration(
                                color: isDark ? AppTheme.reactIndigo.withValues(alpha: 0.2) : const Color(0xFFEEF2FF),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: isDark ? AppTheme.reactCyan.withValues(alpha: 0.3) : const Color(0xFFC7D2FE)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.unfold_more_rounded, size: 14, color: isDark ? AppTheme.reactCyan : AppTheme.reactIndigo),
                                  const SizedBox(width: 2),
                                  Text(
                                    'Expand',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: isDark ? AppTheme.reactCyan : AppTheme.reactIndigo,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  secondChild:
                  // Vehicle Summary Banner Card
                  Container(
                    margin: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark ? AppTheme.slateSurface : AppTheme.metricSky,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: isDark ? AppTheme.slateBorder : AppTheme.accentSky.withValues(alpha: 0.5)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Flexible(
                                          child: Text(
                                            provider.activeTrip?.tripNumber ?? 'TRIP-1722770000',
                                            style: TextStyle(
                                              color: isDark ? AppTheme.reactCyan : AppTheme.snowActive,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 12,
                                            ),
                                            overflow: TextOverflow.ellipsis,
                                            maxLines: 1,
                                          ),
                                        ),
                                        const SizedBox(width: 4),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: provider.isOnline
                                                ? AppTheme.emeraldGreen.withValues(alpha: 0.15)
                                                : AppTheme.amberAccent.withValues(alpha: 0.15),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(
                                                !provider.isOnline || provider.pingMs == -1
                                                    ? Icons.signal_wifi_off
                                                    : (provider.pingMs < 100
                                                        ? Icons.wifi
                                                        : (provider.pingMs < 300
                                                            ? Icons.network_wifi_3_bar
                                                            : (provider.pingMs < 600
                                                                ? Icons.network_wifi_2_bar
                                                                : Icons.network_wifi_1_bar))),
                                                size: 10,
                                                color: provider.isOnline ? AppTheme.emeraldGreen : AppTheme.amberAccent,
                                              ),
                                              const SizedBox(width: 3),
                                              Text(
                                                provider.isOnline
                                                    ? (provider.pingMs != -1 ? '${provider.pingMs}ms' : 'ONLINE')
                                                    : 'OFFLINE',
                                                style: TextStyle(
                                                  color: provider.isOnline ? AppTheme.emeraldGreen : AppTheme.amberAccent,
                                                  fontSize: 9,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        // Collected Today Quick Badge with Wallet Icon
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                          decoration: BoxDecoration(
                                            color: AppTheme.emeraldGreen.withValues(alpha: 0.15),
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: AppTheme.emeraldGreen.withValues(alpha: 0.3)),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              const Icon(Icons.account_balance_wallet_rounded, size: 13, color: AppTheme.emeraldGreen),
                                              const SizedBox(width: 4),
                                              Text(
                                                '₹${provider.totalCollected.toStringAsFixed(0)} Collected Today',
                                                style: const TextStyle(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.bold,
                                                  color: AppTheme.emeraldGreen,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  InkWell(
                                    onTap: () => setState(() => _isHeaderFolded = true),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: isDark ? AppTheme.slateSurface : Colors.white.withValues(alpha: 0.6),
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(color: borderColor),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.unfold_less_rounded, size: 12, color: mutedColor),
                                          const SizedBox(width: 2),
                                          Text('Fold', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: mutedColor)),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                'Vehicle: ${provider.activeTrip?.vehicleNumber.isNotEmpty == true ? provider.activeTrip!.vehicleNumber : (provider.activeTrip != null ? "Assigned Van" : "Not Dispatched")}${provider.activeTrip?.vehicleModel.isNotEmpty == true ? " • ${provider.activeTrip!.vehicleModel}" : ""}',
                                style: TextStyle(color: textColor, fontSize: 15, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Route: ${provider.activeTrip?.routeName.isNotEmpty == true ? provider.activeTrip!.routeName : "Standard Delivery Corridor"}',
                                style: TextStyle(color: mutedColor, fontSize: 12),
                              ),
                              if (provider.activeTrip?.salesPersonName.isNotEmpty == true || provider.activeTrip?.driverName.isNotEmpty == true) ...[
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    if (provider.activeTrip?.salesPersonName.isNotEmpty == true)
                                      Expanded(
                                        child: Text(
                                          '👔 Rep: ${provider.activeTrip!.salesPersonName}',
                                          style: TextStyle(color: mutedColor, fontSize: 11, fontWeight: FontWeight.w500),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    if (provider.activeTrip?.salesPersonName.isNotEmpty == true && provider.activeTrip?.driverName.isNotEmpty == true)
                                      const SizedBox(width: 8),
                                    if (provider.activeTrip?.driverName.isNotEmpty == true)
                                      Expanded(
                                        child: Text(
                                          '🚚 Driver: ${provider.activeTrip!.driverName}',
                                          style: TextStyle(color: mutedColor, fontSize: 11, fontWeight: FontWeight.w500),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                  ],
                                ),
                              ],
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 6,
                                children: [
                                  // Explicit Start Trip Button (if not yet started)
                                  if (provider.activeTrip != null && provider.activeTrip?.status != 'IN_PROGRESS' && provider.activeTrip?.status != 'IN TRANSIT' && provider.activeTrip?.status != 'COMPLETED')
                                    GestureDetector(
                                      onTap: () => _showStartTripVerificationModal(context, provider),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: AppTheme.emeraldGreen,
                                          borderRadius: BorderRadius.circular(8),
                                          boxShadow: [
                                            BoxShadow(
                                              color: AppTheme.emeraldGreen.withValues(alpha: 0.4),
                                              blurRadius: 6,
                                              offset: const Offset(0, 2),
                                            ),
                                          ],
                                        ),
                                        child: const Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(Icons.play_arrow_rounded, size: 15, color: Colors.white),
                                            SizedBox(width: 4),
                                            Text(
                                              '▶ Start Trip (Verify)',
                                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),

                                  // Explicit End Trip Button (if in progress)
                                  if (provider.activeTrip != null && (provider.activeTrip?.status == 'IN_PROGRESS' || provider.activeTrip?.status == 'IN TRANSIT'))
                                    GestureDetector(
                                      onTap: () => _showEndTripVerificationModal(context, provider),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: Colors.purple,
                                          borderRadius: BorderRadius.circular(8),
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.purple.withValues(alpha: 0.4),
                                              blurRadius: 6,
                                              offset: const Offset(0, 2),
                                            ),
                                          ],
                                        ),
                                        child: const Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(Icons.check_circle_rounded, size: 15, color: Colors.white),
                                            SizedBox(width: 4),
                                            Text(
                                              '🏁 End & Settle Trip',
                                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),

                                  // Live Status Picker Button on Dashboard Banner
                                  GestureDetector(
                                    onTap: () {
                                      if (provider.activeTrip != null) {
                                        _showLiveTripStatusPicker(context, provider);
                                      } else {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(builder: (_) => const DailyTripPlanScreen()),
                                        );
                                      }
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: isDark ? AppTheme.slateSurface : const Color(0xFFE2E8F0),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: isDark ? AppTheme.slateBorder : Colors.black12),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            (provider.activeTrip?.status == 'IN_PROGRESS' || provider.activeTrip?.status == 'IN TRANSIT')
                                                ? Icons.local_shipping_rounded
                                                : (provider.activeTrip?.status == 'COMPLETED' ? Icons.check_circle_rounded : Icons.swap_calls_rounded),
                                            size: 13,
                                            color: isDark ? Colors.white70 : Colors.black87,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            'Status: ${provider.activeTrip?.status ?? "DRAFT"} ⚡',
                                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: isDark ? Colors.white70 : Colors.black87),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),

                                  // View Route Map Button
                                  GestureDetector(
                                    onTap: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => TripRouteMapScreen(
                                            tripId: provider.activeTrip?.id ?? 1,
                                            tripNumber: provider.activeTrip?.tripNumber ?? 'TRIP-2026-001',
                                          ),
                                        ),
                                      );
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: AppTheme.reactIndigo,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.map_rounded, size: 13, color: Colors.white),
                                          SizedBox(width: 4),
                                          Text(
                                            'Route Map',
                                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),

                                  // Loaded Stock Quick Button
                                  GestureDetector(
                                    onTap: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(builder: (_) => const TruckInventoryScreen()),
                                      );
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: isDark ? AppTheme.slateSurface : const Color(0xFFE0E7FF),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                          color: isDark ? AppTheme.slateBorder : const Color(0xFFC7D2FE),
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            Icons.inventory_2_rounded,
                                            size: 13,
                                            color: isDark ? AppTheme.reactCyan : AppTheme.reactIndigo,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            '$loadedPkts Pkts Loaded',
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                              color: isDark ? AppTheme.reactCyan : AppTheme.reactIndigo,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isDark ? AppTheme.reactIndigo.withValues(alpha: 0.2) : AppTheme.metricBlue,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: AnimatedDrivingTruck(
                            color: isDark ? AppTheme.reactCyan : AppTheme.snowActive,
                            size: 28,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                  // Trip Beta Allowance & Sales Collection Card
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: isDark
                            ? [const Color(0xFF1E293B), const Color(0xFF0F172A)]
                            : [const Color(0xFFF0FDF4), const Color(0xFFE0F2FE)],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isDark ? AppTheme.slateBorder : AppTheme.emeraldGreen.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: AppTheme.emeraldGreen.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(Icons.account_balance_wallet, size: 20, color: AppTheme.emeraldGreen),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'TRIP BETA',
                                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.emeraldGreen),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    Wrap(
                                      crossAxisAlignment: WrapCrossAlignment.center,
                                      spacing: 6,
                                      runSpacing: 2,
                                      children: [
                                        Text(
                                          '₹${provider.betaAmount.toStringAsFixed(0)}',
                                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textColor),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: provider.betaPaymentStatus == 'PAID'
                                                ? AppTheme.emeraldGreen.withValues(alpha: 0.2)
                                                : AppTheme.amberAccent.withValues(alpha: 0.2),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            provider.betaPaymentStatus,
                                            style: TextStyle(
                                              fontSize: 9,
                                              fontWeight: FontWeight.bold,
                                              color: provider.betaPaymentStatus == 'PAID'
                                                  ? AppTheme.emeraldGreen
                                                  : AppTheme.amberAccent,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(width: 1, height: 36, color: borderColor),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'COLLECTED TODAY',
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: mutedColor),
                              ),
                              Text(
                                '₹${provider.totalCollected.toStringAsFixed(0)}',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textColor),
                              ),
                              Text(
                                'Cash: ₹${provider.cashCollected.toStringAsFixed(0)} • UPI: ₹${provider.upiCollected.toStringAsFixed(0)}',
                                style: TextStyle(fontSize: 9, color: mutedColor),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                // ─── Route Execution Progress & Metric Performance Card ─────────────
                Builder(
                  builder: (context) {
                    final totalShops = provider.shops.length;
                    final deliveredShops = provider.shops.where((s) => s.deliveryStatus == 'DELIVERED').length;
                    final progressPct = totalShops > 0 ? (deliveredShops / totalShops) : 0.0;

                    return Container(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: borderColor),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.analytics_rounded, size: 16, color: AppTheme.emeraldGreen),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Route Dispatch Execution',
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textColor),
                                  ),
                                ],
                              ),
                              Text(
                                '${(progressPct * 100).toStringAsFixed(0)}%',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: AppTheme.emeraldGreen),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: LinearProgressIndicator(
                              value: progressPct,
                              minHeight: 7,
                              backgroundColor: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                              valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.emeraldGreen),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Expanded(
                                child: _buildMiniStatTile(
                                  label: 'Delivered',
                                  value: '$deliveredShops/$totalShops',
                                  icon: Icons.check_circle_outline_rounded,
                                  color: AppTheme.emeraldGreen,
                                  isDark: isDark,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _buildMiniStatTile(
                                  label: 'Pending',
                                  value: '${totalShops - deliveredShops}',
                                  icon: Icons.pending_actions_rounded,
                                  color: AppTheme.amberAccent,
                                  isDark: isDark,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: _buildMiniStatTile(
                                  label: 'Collection',
                                  value: '₹${provider.totalCollected.toStringAsFixed(0)}',
                                  icon: Icons.payments_outlined,
                                  color: AppTheme.reactIndigo,
                                  isDark: isDark,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),

                // ─── Executive Quick Action Driver Grid ─────────────────────────────
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: borderColor),
                  ),
                  child: Row(
                    children: [
                      _buildQuickActionButton(
                        icon: Icons.point_of_sale_rounded,
                        label: 'Spot Sale',
                        color: AppTheme.emeraldGreen,
                        isDark: isDark,
                        onTap: () {
                          if (provider.shops.isNotEmpty) {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => SalesScreen(shop: provider.shops.first)),
                            );
                          } else {
                            Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const ShopOnboardingScreen()),
                            );
                          }
                        },
                      ),
                      _buildQuickActionButton(
                        icon: Icons.inventory_2_rounded,
                        label: 'Stock Log',
                        color: AppTheme.reactIndigo,
                        isDark: isDark,
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const TruckInventoryScreen()),
                          );
                        },
                      ),
                      _buildQuickActionButton(
                        icon: Icons.map_rounded,
                        label: 'Route Map',
                        color: const Color(0xFF0284C7),
                        isDark: isDark,
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => TripRouteMapScreen(
                                tripId: provider.activeTrip?.id ?? 1,
                                tripNumber: provider.activeTrip?.tripNumber ?? 'TRIP-2026-001',
                              ),
                            ),
                          );
                        },
                      ),
                      _buildQuickActionButton(
                        icon: Icons.account_balance_wallet_rounded,
                        label: 'Cash Settle',
                        color: const Color(0xFFD97706),
                        isDark: isDark,
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const EndOfDayScreen()),
                          );
                        },
                      ),
                    ],
                  ),
                ),

                // Offline Sync Prompt Banner
                if (provider.isOnline && provider.offlineQueueCount > 0)
                  GestureDetector(
                    onTap: () async {
                      bool success = await provider.manualSync();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(success ? 'Successfully synced all offline data!' : 'Failed to sync. Please try again.'),
                            backgroundColor: success ? AppTheme.emeraldGreen : AppTheme.roseError,
                          ),
                        );
                      }
                    },
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: AppTheme.amberAccent.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.amberAccent, width: 1.5),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.cloud_upload_outlined, color: AppTheme.amberAccent, size: 24),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'You have ${provider.offlineQueueCount} offline transactions',
                                  style: const TextStyle(
                                    color: AppTheme.amberAccent,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                                const Text(
                                  'Tap here to sync to server',
                                  style: TextStyle(
                                    color: AppTheme.amberAccent,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (provider.isLoading)
                            const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(color: AppTheme.amberAccent, strokeWidth: 2),
                            )
                          else
                            const Icon(Icons.chevron_right, color: AppTheme.amberAccent),
                        ],
                      ),
                    ),
                  ),

                // Interactive Swipe Gesture Instructions Bar
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: isDark ? AppTheme.slateSurface : AppTheme.metricViolet,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: isDark ? AppTheme.slateBorder : AppTheme.snowBorder),
                  ),
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const AppSvgIcon(svgString: AppSvgIcons.swipeRight, size: 16, color: AppTheme.emeraldGreen),
                        const SizedBox(width: 4),
                        Text(
                          'Swipe Right: Spot Sale',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textColor),
                        ),
                        const SizedBox(width: 12),
                        Text('•', style: TextStyle(color: mutedColor)),
                        const SizedBox(width: 12),
                        const AppSvgIcon(svgString: AppSvgIcons.swipeLeft, size: 16, color: AppTheme.reactIndigo),
                        const SizedBox(width: 4),
                        Text(
                          'Swipe Left: Sign POD',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textColor),
                        ),
                      ],
                    ),
                  ),
                ),

                // ─── Assigned Outlet Route Stops Header ────────────────────────
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: isDark ? AppTheme.reactIndigo.withValues(alpha: 0.2) : const Color(0xFFEEF2FF),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          Icons.storefront_rounded,
                          size: 18,
                          color: isDark ? AppTheme.reactCyan : AppTheme.reactIndigo,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Assigned Outlet Route Stops',
                          style: TextStyle(color: textColor, fontSize: 15, fontWeight: FontWeight.bold),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 6),
                      if (provider.shops.isNotEmpty) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: isDark ? AppTheme.slateSurface : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: borderColor),
                          ),
                          child: Text(
                            '${provider.shops.where((s) => s.deliveryStatus == 'DELIVERED').length}/${provider.shops.length} Done',
                            style: TextStyle(
                              color: isDark ? AppTheme.reactCyan : AppTheme.reactIndigo,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                      ],
                      IconButton(
                        icon: const Icon(Icons.refresh_rounded, size: 20),
                        tooltip: 'Refresh Outlets',
                        color: mutedColor,
                        onPressed: () async {
                          await provider.refreshDataFromBackend();
                        },
                      ),
                    ],
                  ),
                ),

                // ─── Outlet Cards List / Empty State ──────────────────────────
                if (provider.shops.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Container(
                      padding: const EdgeInsets.all(28),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: borderColor, width: 1.2),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 72,
                            height: 72,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: isDark
                                    ? [const Color(0xFF312E81), const Color(0xFF1E1B4B)]
                                    : [const Color(0xFFEEF2FF), const Color(0xFFE0E7FF)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.storefront_rounded,
                              size: 36,
                              color: isDark ? AppTheme.reactCyan : AppTheme.reactIndigo,
                            ),
                          ),
                          const SizedBox(height: 20),
                          Text(
                            'No Outlets Assigned Yet',
                            style: TextStyle(
                              color: textColor,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Your assigned customer shop stops will appear here once active trips or routes are dispatched. Swipe down anytime to refresh.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: mutedColor,
                              fontSize: 13,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 20),
                          Wrap(
                            alignment: WrapAlignment.center,
                            spacing: 10,
                            runSpacing: 10,
                            children: [
                              ElevatedButton.icon(
                                onPressed: () async {
                                  await provider.refreshDataFromBackend();
                                },
                                icon: const Icon(Icons.sync_rounded, size: 18),
                                label: const Text('Refresh & Load Outlets'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: isDark ? const Color(0xFF4F46E5) : AppTheme.reactIndigo,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                  elevation: 2,
                                ),
                              ),
                              OutlinedButton.icon(
                                onPressed: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(builder: (_) => const ShopOnboardingScreen()),
                                  );
                                },
                                icon: const Icon(Icons.add_business_rounded, size: 18),
                                label: const Text('Onboard Outlet'),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: isDark ? AppTheme.reactCyan : AppTheme.reactIndigo,
                                  side: BorderSide(color: isDark ? AppTheme.reactCyan : AppTheme.reactIndigo),
                                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  )
                else ...[
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    itemCount: provider.shops.length,
                    itemBuilder: (context, index) {
                      final shop = provider.shops[index];
                      final isCompleted = shop.deliveryStatus == 'DELIVERED';
                      final stopNumber = index + 1;

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Dismissible(
                          key: ValueKey('shop_${shop.shopId}_$index'),
                          direction: DismissDirection.horizontal,

                          // Right Swipe Action (Spot Sale)
                          background: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            decoration: BoxDecoration(
                              color: AppTheme.emeraldGreen,
                              borderRadius: BorderRadius.circular(18),
                            ),
                            alignment: Alignment.centerLeft,
                            child: const Row(
                              children: [
                                AppSvgIcon(svgString: AppSvgIcons.spotSale, color: Colors.white, size: 24),
                                SizedBox(width: 10),
                                Text(
                                  'Spot Sale',
                                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                                ),
                              ],
                            ),
                          ),

                          // Left Swipe Action (Sign POD)
                          secondaryBackground: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            decoration: BoxDecoration(
                              color: AppTheme.reactIndigo,
                              borderRadius: BorderRadius.circular(18),
                            ),
                            alignment: Alignment.centerRight,
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                Text(
                                  'Sign POD',
                                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                                ),
                                SizedBox(width: 10),
                                AppSvgIcon(svgString: AppSvgIcons.podSignature, color: Colors.white, size: 24),
                              ],
                            ),
                          ),

                          confirmDismiss: (direction) async {
                            if (direction == DismissDirection.startToEnd) {
                              Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => SalesScreen(shop: shop)),
                              );
                            } else if (direction == DismissDirection.endToStart) {
                              final isEligible = shop.deliveryStatus == 'DELIVERED' || shop.deliveryStatus == 'COMPLETED' || shop.salesStatus == 'SOLD';
                              if (!isEligible) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('POD is locked 🔒. Please visit shop and complete product sale first!'),
                                    backgroundColor: AppTheme.amberAccent,
                                  ),
                                );
                              } else {
                                Navigator.of(context).push(
                                  MaterialPageRoute(builder: (_) => ShopAcknowledgementScreen(shop: shop)),
                                );
                              }
                            }
                            return false;
                          },

                          child: Container(
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1E293B) : Colors.white,
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: isCompleted
                                    ? AppTheme.emeraldGreen.withValues(alpha: 0.3)
                                    : borderColor,
                                width: 1.2,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
                                  blurRadius: 10,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(14.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // ─── Header: Stop Number + Shop Code + Status Tag ───
                                  Row(
                                    children: [
                                      // Stop Badge
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: isDark
                                              ? const Color(0xFF312E81)
                                              : const Color(0xFFEEF2FF),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(
                                              Icons.location_on_rounded,
                                              size: 12,
                                              color: isDark ? AppTheme.reactCyan : AppTheme.reactIndigo,
                                            ),
                                            const SizedBox(width: 3),
                                            Text(
                                              'Stop #$stopNumber',
                                              style: TextStyle(
                                                color: isDark ? AppTheme.reactCyan : AppTheme.reactIndigo,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 11,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 8),

                                      // Shop Code Pill
                                      if (shop.shopCode.isNotEmpty)
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            shop.shopCode,
                                            style: TextStyle(
                                              color: mutedColor,
                                              fontWeight: FontWeight.w600,
                                              fontSize: 11,
                                            ),
                                          ),
                                        ),

                                      const Spacer(),

                                      // Delivery Status Tag
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: isCompleted
                                              ? AppTheme.emeraldGreen.withValues(alpha: 0.15)
                                              : AppTheme.amberAccent.withValues(alpha: 0.15),
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(
                                            color: isCompleted
                                                ? AppTheme.emeraldGreen.withValues(alpha: 0.3)
                                                : AppTheme.amberAccent.withValues(alpha: 0.3),
                                            width: 0.8,
                                          ),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(
                                              isCompleted ? Icons.check_circle_rounded : Icons.schedule_rounded,
                                              size: 12,
                                              color: isCompleted ? AppTheme.emeraldGreen : AppTheme.amberAccent,
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              isCompleted ? 'Delivered' : 'Pending',
                                              style: TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                                color: isCompleted ? AppTheme.emeraldGreen : AppTheme.amberAccent,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 10),

                                  // ─── Shop Name & Store Avatar ───
                                  Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        width: 38,
                                        height: 38,
                                        decoration: BoxDecoration(
                                          gradient: LinearGradient(
                                            colors: isCompleted
                                                ? [const Color(0xFF10B981), const Color(0xFF059669)]
                                                : [const Color(0xFF6366F1), const Color(0xFF4F46E5)],
                                            begin: Alignment.topLeft,
                                            end: Alignment.bottomRight,
                                          ),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: Icon(
                                          isCompleted ? Icons.check_rounded : Icons.store_rounded,
                                          color: Colors.white,
                                          size: 20,
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              shop.shopName.isNotEmpty ? shop.shopName : 'Customer Outlet',
                                              style: TextStyle(
                                                fontWeight: FontWeight.bold,
                                                color: textColor,
                                                fontSize: 15,
                                              ),
                                            ),
                                            const SizedBox(height: 3),
                                            if (shop.ownerName.isNotEmpty || shop.phone.isNotEmpty)
                                              Row(
                                                children: [
                                                  if (shop.ownerName.isNotEmpty) ...[
                                                    Icon(Icons.person_outline_rounded, size: 13, color: mutedColor),
                                                    const SizedBox(width: 3),
                                                    Flexible(
                                                      child: Text(
                                                        shop.ownerName,
                                                        style: TextStyle(color: mutedColor, fontSize: 12),
                                                        overflow: TextOverflow.ellipsis,
                                                      ),
                                                    ),
                                                  ],
                                                  if (shop.phone.isNotEmpty) ...[
                                                    const SizedBox(width: 6),
                                                    Text('•', style: TextStyle(color: mutedColor, fontSize: 12)),
                                                    const SizedBox(width: 6),
                                                    GestureDetector(
                                                      onTap: () async {
                                                        final uri = Uri.parse('tel:${shop.phone.replaceAll(' ', '')}');
                                                        if (await canLaunchUrl(uri)) {
                                                          await launchUrl(uri);
                                                        }
                                                      },
                                                      child: Row(
                                                        mainAxisSize: MainAxisSize.min,
                                                        children: [
                                                          const Icon(Icons.call_rounded, size: 12, color: AppTheme.emeraldGreen),
                                                          const SizedBox(width: 2),
                                                          Text(
                                                            shop.phone,
                                                            style: const TextStyle(
                                                              color: AppTheme.emeraldGreen,
                                                              fontSize: 12,
                                                              fontWeight: FontWeight.w600,
                                                            ),
                                                          ),
                                                        ],
                                                      ),
                                                    ),
                                                  ],
                                                ],
                                              ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),

                                  // ─── Address & Route Strip ───
                                  if (shop.address.isNotEmpty) ...[
                                    const SizedBox(height: 6),
                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Icon(Icons.near_me_outlined, size: 13, color: mutedColor),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(
                                            shop.address,
                                            style: TextStyle(color: mutedColor, fontSize: 12, height: 1.3),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],

                                  // ─── Financial Status Bar (Outstanding Balance) ───
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: shop.outstandingBalance > 0
                                              ? AppTheme.roseError.withValues(alpha: 0.12)
                                              : AppTheme.emeraldGreen.withValues(alpha: 0.12),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(
                                              shop.outstandingBalance > 0
                                                  ? Icons.account_balance_wallet_outlined
                                                  : Icons.check_circle_outline_rounded,
                                              size: 12,
                                              color: shop.outstandingBalance > 0
                                                  ? AppTheme.roseError
                                                  : AppTheme.emeraldGreen,
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              shop.outstandingBalance > 0
                                                  ? 'Due: ₹${shop.outstandingBalance.toStringAsFixed(0)}'
                                                  : 'All Dues Clear',
                                              style: TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                                color: shop.outstandingBalance > 0
                                                    ? AppTheme.roseError
                                                    : AppTheme.emeraldGreen,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      if (shop.routeName.isNotEmpty) ...[
                                        const SizedBox(width: 6),
                                        Flexible(
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: isDark ? const Color(0xFF334155) : const Color(0xFFF8FAFC),
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: Text(
                                              shop.routeName,
                                              style: TextStyle(color: mutedColor, fontSize: 11),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),

                                  const SizedBox(height: 10),
                                  Divider(height: 1, color: borderColor),
                                  const SizedBox(height: 8),

                                  // ─── Actions Bar (Info, Sale, Return, Sign POD) ───
                                  Row(
                                    children: [
                                      // Shop Details Button
                                      IconButton(
                                        icon: Icon(Icons.info_outline_rounded, color: mutedColor, size: 20),
                                        tooltip: 'Shop Profile & History',
                                        onPressed: () {
                                          Navigator.of(context).push(
                                            MaterialPageRoute(
                                              builder: (_) => ShopDetailsScreen(shop: shop),
                                            ),
                                          );
                                        },
                                      ),
                                      const Spacer(),

                                      // Spot Sale Button
                                      OutlinedButton.icon(
                                        onPressed: () {
                                          Navigator.of(context).push(
                                            MaterialPageRoute(
                                              builder: (_) => SalesScreen(shop: shop),
                                            ),
                                          );
                                        },
                                        icon: const AppSvgIcon(
                                          svgString: AppSvgIcons.spotSale,
                                          size: 13,
                                          color: AppTheme.reactIndigo,
                                        ),
                                        label: const Text(
                                          'Sale',
                                          style: TextStyle(
                                            color: AppTheme.reactIndigo,
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        style: OutlinedButton.styleFrom(
                                          side: const BorderSide(color: AppTheme.reactIndigo),
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                          minimumSize: Size.zero,
                                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                        ),
                                      ),
                                      const SizedBox(width: 6),

                                      // Shop Return Button
                                      OutlinedButton.icon(
                                        onPressed: () {
                                          Navigator.of(context).push(
                                            MaterialPageRoute(
                                              builder: (_) => ShopReturnScreen(initialShop: shop),
                                            ),
                                          );
                                        },
                                        icon: const AppSvgIcon(
                                          svgString: AppSvgIcons.returnBoxes,
                                          size: 13,
                                          color: AppTheme.roseError,
                                        ),
                                        label: const Text(
                                          'Return',
                                          style: TextStyle(
                                            color: AppTheme.roseError,
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        style: OutlinedButton.styleFrom(
                                          side: const BorderSide(color: AppTheme.roseError),
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                          minimumSize: Size.zero,
                                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                        ),
                                      ),
                                      const SizedBox(width: 6),

                                      // Live Signature POD Button
                                      ElevatedButton.icon(
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: isCompleted
                                              ? (isDark ? AppTheme.slateSurface : const Color(0xFFF1F5F9))
                                              : AppTheme.emeraldGreen,
                                          foregroundColor: isCompleted ? textColor : Colors.white,
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                          elevation: isCompleted ? 0 : 1,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                        ),
                                        onPressed: () {
                                          final isEligible = shop.deliveryStatus == 'DELIVERED' || shop.deliveryStatus == 'COMPLETED' || shop.salesStatus == 'SOLD';
                                          if (!isEligible) {
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              const SnackBar(
                                                content: Text('POD is locked 🔒. Please visit shop and complete product sale first!'),
                                                backgroundColor: AppTheme.amberAccent,
                                              ),
                                            );
                                            return;
                                          }
                                          Navigator.of(context).push(
                                            MaterialPageRoute(
                                              builder: (_) => ShopAcknowledgementScreen(shop: shop),
                                            ),
                                          );
                                        },
                                        icon: AppSvgIcon(
                                          svgString: AppSvgIcons.podSignature,
                                          size: 15,
                                          color: isCompleted ? textColor : Colors.white,
                                        ),
                                        label: Text(
                                          isCompleted ? 'View POD' : 'Sign POD',
                                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),

                  // ─── Route Completion Assistant Card (When Shops <= 3) ──────────────
                  if (provider.shops.length <= 3)
                    Container(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: isDark
                              ? [const Color(0xFF1E1B4B), const Color(0xFF0F172A)]
                              : [const Color(0xFFEFF6FF), const Color(0xFFF0FDF4)],
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: isDark ? AppTheme.slateBorder : const Color(0xFFBFDBFE)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.auto_awesome, color: AppTheme.reactIndigo, size: 18),
                              const SizedBox(width: 8),
                              Text(
                                'Route Pilot Field Insights',
                                style: TextStyle(fontWeight: FontWeight.bold, color: textColor, fontSize: 13),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '${provider.shops.length} outlet stop(s) assigned for this trip session. You can onboard new outlets along your route or perform unassigned spot sales anytime.',
                            style: TextStyle(color: mutedColor, fontSize: 11, height: 1.3),
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              ElevatedButton.icon(
                                onPressed: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(builder: (_) => const ShopOnboardingScreen()),
                                  );
                                },
                                icon: const Icon(Icons.add_business_rounded, size: 14),
                                label: const Text('Onboard New Outlet', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.reactIndigo,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                              ),
                              OutlinedButton.icon(
                                onPressed: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(builder: (_) => const TruckInventoryScreen()),
                                  );
                                },
                                icon: const Icon(Icons.inventory_2_outlined, size: 14),
                                label: const Text('Check Stock Log', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: isDark ? AppTheme.reactCyan : AppTheme.reactIndigo,
                                  side: BorderSide(color: isDark ? AppTheme.reactCyan : AppTheme.reactIndigo),
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMiniStatTile({
    required String label,
    required String value,
    required IconData icon,
    required Color color,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 12, color: color),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.bold),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: isDark ? Colors.white : const Color(0xFF0F172A)),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 18, color: color),
              ),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white70 : const Color(0xFF334155),
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class AppNavigationDrawer extends StatefulWidget {
  final DeliveryProvider provider;

  const AppNavigationDrawer({super.key, required this.provider});

  @override
  State<AppNavigationDrawer> createState() => _AppNavigationDrawerState();
}

class _AppNavigationDrawerState extends State<AppNavigationDrawer> {
  int _selectedModuleIndex = 0;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final textColor = theme.colorScheme.onSurface;
    final mutedColor = isDark ? AppTheme.slateMuted : AppTheme.snowMuted;
    final borderColor = isDark ? AppTheme.slateBorder : AppTheme.snowBorder;

    final driverName = widget.provider.currentDriver?.fullName ?? 'Rajesh (Driver Lead)';
    final driverEmail = widget.provider.currentDriver?.email ?? 'rajesh@geminifood.com';

    return Drawer(
      backgroundColor: theme.cardColor,
      child: SafeArea(
        child: Column(
          children: [
            // Driver Profile & Brand Header Box
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.slateSurface : AppTheme.metricSky,
                border: Border(bottom: BorderSide(color: borderColor)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: isDark ? AppTheme.slateBg : Colors.white,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.asset(
                                'assets/logo.jfif',
                                width: 28,
                                height: 28,
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Gemini Foods',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                  color: textColor,
                                  letterSpacing: -0.3,
                                ),
                              ),
                              const Text(
                                'Field Distribution Suite',
                                style: TextStyle(fontSize: 10, color: AppTheme.snowMuted, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: widget.provider.isOnline
                              ? AppTheme.emeraldGreen.withValues(alpha: 0.15)
                              : AppTheme.amberAccent.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              !widget.provider.isOnline || widget.provider.pingMs == -1
                                  ? Icons.signal_wifi_off
                                  : (widget.provider.pingMs < 100
                                      ? Icons.wifi
                                      : (widget.provider.pingMs < 300
                                          ? Icons.network_wifi_3_bar
                                          : (widget.provider.pingMs < 600
                                              ? Icons.network_wifi_2_bar
                                              : Icons.network_wifi_1_bar))),
                              size: 10,
                              color: widget.provider.isOnline ? AppTheme.emeraldGreen : AppTheme.amberAccent,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              widget.provider.isOnline
                                  ? (widget.provider.pingMs != -1 ? '${widget.provider.pingMs}ms' : 'ONLINE')
                                  : 'OFFLINE',
                              style: TextStyle(
                                color: widget.provider.isOnline ? AppTheme.emeraldGreen : AppTheme.amberAccent,
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundColor: isDark ? AppTheme.reactIndigo : AppTheme.snowActive,
                        child: Text(
                          driverName.substring(0, 1).toUpperCase(),
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              driverName,
                              style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 14),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              driverEmail,
                              style: TextStyle(color: mutedColor, fontSize: 11),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Drawer Navigation Content List
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4.0, vertical: 4.0),
                    child: Text(
                      'FIELD DASHBOARDS & MODULES',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: mutedColor,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Main Navigation Modules
                  _buildNavTile(
                    context,
                    index: 0,
                    title: 'Delivery & Sales Route',
                    svgString: AppSvgIcons.truck,
                    onTap: () {
                      setState(() => _selectedModuleIndex = 0);
                      Navigator.of(context).pop();
                    },
                  ),
                  _buildNavTile(
                    context,
                    index: 5,
                    title: 'Weekly Route & Daily Visits',
                    svgString: AppSvgIcons.onboardShop,
                    onTap: () {
                      setState(() => _selectedModuleIndex = 5);
                      Navigator.of(context).pop();
                      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const DailyTripPlanScreen()));
                    },
                  ),
                  _buildNavTile(
                    context,
                    index: 1,
                    title: 'Live Truck Inventory',
                    svgString: AppSvgIcons.inventoryBoxes,
                    onTap: () {
                      setState(() => _selectedModuleIndex = 1);
                      Navigator.of(context).pop();
                      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const TruckInventoryScreen()));
                    },
                  ),
                  _buildNavTile(
                    context,
                    index: 2,
                    title: 'End-Of-Day (EOD) Closing',
                    svgString: AppSvgIcons.eodClosing,
                    onTap: () {
                      setState(() => _selectedModuleIndex = 2);
                      Navigator.of(context).pop();
                      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const EndOfDayScreen()));
                    },
                  ),
                  _buildNavTile(
                    context,
                    index: 3,
                    title: 'Shop Returns & Credit Notes',
                    svgString: AppSvgIcons.returnBoxes,
                    onTap: () {
                      setState(() => _selectedModuleIndex = 3);
                      Navigator.of(context).pop();
                      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ShopReturnScreen()));
                    },
                  ),
                  _buildNavTile(
                    context,
                    index: 4,
                    title: 'Onboard New Outlet',
                    svgString: AppSvgIcons.onboardShop,
                    onTap: () {
                      setState(() => _selectedModuleIndex = 4);
                      Navigator.of(context).pop();
                      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ShopOnboardingScreen()));
                    },
                  ),
                ],
              ),
            ),

            // Drawer Footer: Branding & Sign Out Button
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.slateSurface : AppTheme.snowHover,
                border: Border(top: BorderSide(color: borderColor)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.auto_awesome, size: 16, color: AppTheme.amberAccent),
                          const SizedBox(width: 6),
                          Text(
                            'Gemini Food',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textColor),
                          ),
                        ],
                      ),
                      Text(
                        'v2.4.0',
                        style: TextStyle(fontSize: 11, color: mutedColor, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        Navigator.of(context).pop();
                        await widget.provider.logout();
                        if (context.mounted) {
                          Navigator.of(context).pushAndRemoveUntil(
                            MaterialPageRoute(builder: (_) => const LoginScreen()),
                            (route) => false,
                          );
                        }
                      },
                      icon: const AppSvgIcon(svgString: AppSvgIcons.logout, size: 16, color: AppTheme.roseError),
                      label: const Text(
                        'Sign Out',
                        style: TextStyle(color: AppTheme.roseError, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: AppTheme.roseError.withValues(alpha: 0.4)),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavTile(
    BuildContext context, {
    required int index,
    required String title,
    required String svgString,
    required VoidCallback onTap,
  }) {
    final isSelected = _selectedModuleIndex == index;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
            decoration: BoxDecoration(
              color: isSelected
                  ? (isDark ? AppTheme.slateSurface : AppTheme.snowActive)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
              border: isSelected
                  ? Border.all(color: isDark ? AppTheme.reactCyan : AppTheme.snowActive)
                  : null,
            ),
            child: Row(
              children: [
                AppSvgIcon(
                  svgString: svgString,
                  size: 18,
                  color: isSelected ? Colors.white : (isDark ? AppTheme.slateMuted : AppTheme.snowMuted),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    title,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                      color: isSelected ? Colors.white : theme.colorScheme.onSurface,
                    ),
                  ),
                ),
                if (isSelected)
                  Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      color: AppTheme.emeraldGreen,
                      shape: BoxShape.circle,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
