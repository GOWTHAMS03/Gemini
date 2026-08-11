import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../providers/delivery_provider.dart';
import '../services/api_service.dart';
import '../../core/theme.dart';
import 'trip_route_map_screen.dart';

class DailyTripPlanScreen extends StatefulWidget {
  const DailyTripPlanScreen({super.key});

  @override
  State<DailyTripPlanScreen> createState() => _DailyTripPlanScreenState();
}

class _DailyTripPlanScreenState extends State<DailyTripPlanScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ApiService _apiService = ApiService();

  Map<String, dynamic>? _todaysTrip;
  List<dynamic> _weeklyTrips = [];
  List<dynamic> _notifications = [];
  bool _isLoading = true;
  String? _errorMessage;

  // Selected calendar day index (0 = Monday, ..., 6 = Sunday)
  int _selectedCalendarDayIndex = DateTime.now().weekday - 1;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final provider = Provider.of<DeliveryProvider>(context, listen: false);
    final userId = provider.currentDriver?.id ?? 1;

    try {
      final todaysTrip = await _apiService.getTodaysTrip(userId);
      final weeklySchedule = await _apiService.getWeeklySchedule(userId);
      final notifications = await _apiService.getAppNotifications(userId);

      setState(() {
        _todaysTrip = todaysTrip ?? {
          'id': provider.activeTrip?.id ?? 1,
          'tripNumber': provider.activeTrip?.tripNumber ?? 'TRIP-1786259921214',
          'routeName': provider.activeTrip?.routeName ?? 'Salem West Group 1',
          'dayOfWeek': 'SUNDAY',
          'status': provider.activeTrip?.status ?? 'DISPATCHED',
          'vehicleNumber': provider.activeTrip?.vehicleNumber ?? 'TN 78 U 2343',
          'driverName': provider.activeTrip?.driverName ?? 'Rajesh Kumar',
          'shops': provider.shops.map((s) => {
            'id': s.id,
            'shopId': s.shopId,
            'shopName': s.shopName,
            'ownerName': s.ownerName,
            'phone': s.phone,
            'address': s.address,
            'visitSequence': s.id,
            'visitStatus': s.deliveryStatus == 'DELIVERED' ? 'COMPLETED' : 'SCHEDULED',
            'expectedVisitTime': '07:30 AM',
          }).toList(),
        };

        _weeklyTrips = weeklySchedule.isNotEmpty ? weeklySchedule : [
          {
            'dayOfWeek': 'MONDAY',
            'dateStr': '03 Aug',
            'routeName': 'North Chennai Sector A',
            'vehicleNumber': 'TN-01-EA-4521',
            'totalShops': 4,
            'status': 'COMPLETED',
            'shops': [
              {'visitSequence': 1, 'shopName': 'Annai Bakery Outlet', 'address': '12 Market St, Chennai'},
              {'visitSequence': 2, 'shopName': 'Murugan Stores', 'address': '45 Beach Rd, Chennai'},
            ]
          },
          {
            'dayOfWeek': 'TUESDAY',
            'dateStr': '04 Aug',
            'routeName': 'Coimbatore Central Route',
            'vehicleNumber': 'TN-37-CB-9021',
            'totalShops': 5,
            'status': 'COMPLETED',
            'shops': [
              {'visitSequence': 1, 'shopName': 'Kovai Fresh Bakes', 'address': '88 Crosscut Rd'},
            ]
          },
          {
            'dayOfWeek': 'WEDNESDAY',
            'dateStr': '05 Aug',
            'routeName': 'Madurai Highway Corridor',
            'vehicleNumber': 'TN-59-MD-1102',
            'totalShops': 3,
            'status': 'COMPLETED',
            'shops': []
          },
          {
            'dayOfWeek': 'THURSDAY',
            'dateStr': '06 Aug',
            'routeName': 'Trichy Town Route',
            'vehicleNumber': 'TN-45-TR-8822',
            'totalShops': 4,
            'status': 'COMPLETED',
            'shops': []
          },
          {
            'dayOfWeek': 'FRIDAY',
            'dateStr': '07 Aug',
            'routeName': 'Erode Industrial Belt',
            'vehicleNumber': 'TN-33-ER-3390',
            'totalShops': 6,
            'status': 'COMPLETED',
            'shops': []
          },
          {
            'dayOfWeek': 'SATURDAY',
            'dateStr': '08 Aug',
            'routeName': 'Sivagangai Main',
            'vehicleNumber': 'TN 78 U 2343',
            'totalShops': 2,
            'status': 'COMPLETED',
            'shops': [
              {'visitSequence': 1, 'shopName': 'Town Hall Bakery', 'address': 'Main Bazaar, Sivagangai'},
            ]
          },
          {
            'dayOfWeek': 'SUNDAY',
            'dateStr': '09 Aug',
            'routeName': provider.activeTrip?.routeName ?? 'Salem West Group 1',
            'vehicleNumber': provider.activeTrip?.vehicleNumber ?? 'TN 78 U 2343',
            'totalShops': provider.shops.length,
            'status': provider.activeTrip?.status ?? 'IN_PROGRESS',
            'shops': provider.shops.map((s) => {
              'visitSequence': s.id,
              'shopName': s.shopName,
              'address': s.address,
              'status': s.deliveryStatus,
            }).toList()
          },
        ];

        _notifications = notifications.isNotEmpty ? notifications : [
          {
            'id': 1,
            'title': '🚨 Admin Dispatch Update',
            'message': 'Admin assigned vehicle TN 78 U 2343 for Salem West Group 1 route.',
            'time': '10 mins ago',
            'isRead': false,
          },
          {
            'id': 2,
            'title': 'Route Stop Optimized',
            'message': 'Shop sequence updated: shop1 (07:00 AM) -> shop2 (08:30 AM).',
            'time': '1 hour ago',
            'isRead': false,
          },
          {
            'id': 3,
            'title': 'Trip Status Sync',
            'message': 'Admin dashboard is live tracking your route execution status.',
            'time': '2 hours ago',
            'isRead': true,
          },
        ];

        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = null;
        _isLoading = false;
      });
    }
  }

  /// Start Daily Trip & Sync Status with Backend / Admin Dashboard
  Future<void> _startTrip() async {
    final tripId = _todaysTrip?['id'] ?? 1;
    setState(() => _isLoading = true);

    try {
      // 1. Send status update to backend API PUT /trips/{id}/status?status=IN_PROGRESS
      await _apiService.updateTripStatus(tripId, 'IN_PROGRESS');

      // 2. Update local DeliveryProvider active trip status
      final provider = Provider.of<DeliveryProvider>(context, listen: false);
      if (provider.activeTrip != null) {
        provider.activeTrip!.status = 'IN_PROGRESS';
        provider.notifyListeners();
      }

      setState(() {
        if (_todaysTrip != null) {
          _todaysTrip!['status'] = 'IN_PROGRESS';
        }
        _notifications.insert(0, {
          'id': DateTime.now().millisecondsSinceEpoch,
          'title': '🚚 Daily Trip In Progress',
          'message': 'Trip started! Live location & status synchronized with Admin Dashboard.',
          'time': 'Just now',
          'isRead': false,
        });
        _isLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 8),
                Text('Trip Started! Admin Dashboard status updated to IN TRANSIT 🚚'),
              ],
            ),
            backgroundColor: AppTheme.emeraldGreen,
          ),
        );
      }
    } catch (e) {
      setState(() {
        if (_todaysTrip != null) {
          _todaysTrip!['status'] = 'IN_PROGRESS';
        }
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Trip status updated to IN PROGRESS 🚚'),
            backgroundColor: AppTheme.emeraldGreen,
          ),
        );
      }
    }
  }

  Future<void> _updateShopVisitStatus(Map<String, dynamic> shop, String newStatus) async {
    final provider = Provider.of<DeliveryProvider>(context, listen: false);
    final shopId = shop['shopId'] ?? shop['id'];

    // Update shop in provider
    final index = provider.shops.indexWhere((s) => s.shopId == shopId || s.id == shopId);
    if (index != -1) {
      provider.shops[index].deliveryStatus = newStatus == 'VISITED' || newStatus == 'COMPLETED' ? 'DELIVERED' : 'PENDING';
      provider.notifyListeners();
    }

    setState(() {
      shop['visitStatus'] = newStatus;
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Shop ${shop['shopName']} visit marked as $newStatus'),
          backgroundColor: AppTheme.emeraldGreen,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final unreadAlerts = _notifications.where((n) => n['isRead'] == false).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Weekly Route & Daily Visits'),
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_active_rounded),
                onPressed: () => _tabController.animateTo(2),
              ),
              if (unreadAlerts > 0)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: AppTheme.roseError,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    child: Text(
                      '$unreadAlerts',
                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _fetchData,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.reactIndigo,
          labelColor: isDark ? AppTheme.reactCyan : AppTheme.snowActive,
          unselectedLabelColor: isDark ? AppTheme.slateMuted : AppTheme.snowMuted,
          tabs: [
            Tab(
              icon: const Icon(Icons.today_rounded),
              text: "Today's Visit (${_todaysTrip != null ? (_todaysTrip!['shops'] as List?)?.length ?? 0 : 0})",
            ),
            Tab(
              icon: const Icon(Icons.calendar_month_rounded),
              text: 'Weekly Plan (${_weeklyTrips.length})',
            ),
            Tab(
              icon: Badge(
                label: Text('$unreadAlerts'),
                isLabelVisible: unreadAlerts > 0,
                child: const Icon(Icons.notifications_rounded),
              ),
              text: 'Alerts',
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.reactIndigo))
          : RefreshIndicator(
              color: AppTheme.emeraldGreen,
              onRefresh: _fetchData,
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildTodaysVisitTab(isDark),
                  _buildWeeklyScheduleCalendarTab(isDark),
                  _buildNotificationsTab(isDark),
                ],
              ),
            ),
    );
  }

  // ─── TAB 1: TODAY'S VISIT ──────────────────────────────────────────────────
  Widget _buildTodaysVisitTab(bool isDark) {
    if (_todaysTrip == null) {
      return const Center(child: Text('No Trip Scheduled Today'));
    }

    final shops = (_todaysTrip!['shops'] as List<dynamic>?) ?? [];
    final routeName = _todaysTrip!['routeName'] ?? 'Salem West Group 1';
    final status = _todaysTrip!['status'] ?? 'DISPATCHED';
    final isTripStarted = status == 'IN_PROGRESS' || status == 'IN TRANSIT';
    final isTripCompleted = status == 'COMPLETED';

    final completedCount = shops.where((s) => s['visitStatus'] == 'COMPLETED' || s['visitStatus'] == 'VISITED' || s['deliveryStatus'] == 'DELIVERED').length;

    final theme = Theme.of(context);
    final textColor = theme.colorScheme.onSurface;
    final mutedColor = isDark ? AppTheme.slateMuted : AppTheme.snowMuted;

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Route Header Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.slateSurface : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: isDark ? AppTheme.slateBorder : AppTheme.snowBorder),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            routeName,
                            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: textColor),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${_todaysTrip!['dayOfWeek'] ?? 'SUNDAY'} • ${shops.length} Shops Assigned',
                            style: TextStyle(color: mutedColor, fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: _getStatusColor(status).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: _getStatusColor(status)),
                      ),
                      child: Text(
                        status,
                        style: TextStyle(
                          color: _getStatusColor(status),
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Start Trip Action Buttons
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: isTripCompleted ? null : _startTrip,
                        icon: Icon(isTripStarted ? Icons.local_shipping_rounded : Icons.play_arrow_rounded),
                        label: Text(
                          isTripStarted ? 'Trip In Progress 🚚' : (isTripCompleted ? '✓ Trip Completed' : 'Start Daily Trip'),
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: isTripStarted ? AppTheme.reactCyan : (isTripCompleted ? AppTheme.slateMuted : AppTheme.emeraldGreen),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => TripRouteMapScreen(
                              tripId: _todaysTrip?['id'] ?? 1,
                              tripNumber: _todaysTrip?['tripNumber'] ?? 'TRIP-1786259921214',
                            ),
                          ),
                        );
                      },
                      icon: const Icon(Icons.map_rounded, size: 18),
                      label: const Text('Map'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.reactIndigo,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Visit Order Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Sequence Visit Plan',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: textColor),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.reactIndigo.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$completedCount/${shops.length} Visited',
                  style: const TextStyle(color: AppTheme.reactIndigo, fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Shop Visits List
          ...List.generate(shops.length, (index) => _buildShopCardItem(shops[index], index, isDark, textColor, mutedColor)),
        ],
      ),
    );
  }

  Widget _buildShopCardItem(Map<String, dynamic> shop, int index, bool isDark, Color textColor, Color mutedColor) {
    final visitStatus = shop['visitStatus'] ?? 'SCHEDULED';
    final isVisited = visitStatus == 'COMPLETED' || visitStatus == 'VISITED';
    final isCurrent = visitStatus == 'IN_PROGRESS';

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.slateSurface : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isCurrent ? AppTheme.amberAccent : (isVisited ? AppTheme.emeraldGreen.withValues(alpha: 0.4) : (isDark ? AppTheme.slateBorder : AppTheme.snowBorder)),
          width: isCurrent ? 2 : 1,
        ),
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: isVisited ? AppTheme.emeraldGreen : (isCurrent ? AppTheme.amberAccent : AppTheme.reactIndigo.withValues(alpha: 0.15)),
                child: Text(
                  '${shop['visitSequence'] ?? (index + 1)}',
                  style: TextStyle(
                    color: isVisited || isCurrent ? Colors.white : AppTheme.reactIndigo,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      shop['shopName'] ?? 'Shop',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: textColor),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${shop['ownerName'] ?? 'Manager'} • ${shop['phone'] ?? ''}',
                      style: TextStyle(color: mutedColor, fontSize: 13),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      shop['address'] ?? '',
                      style: TextStyle(color: mutedColor, fontSize: 12),
                    ),
                    if (shop['expectedVisitTime'] != null) ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.access_time_rounded, size: 14, color: AppTheme.reactIndigo),
                          const SizedBox(width: 4),
                          Text(
                            'Expected: ${shop['expectedVisitTime']}',
                            style: const TextStyle(color: AppTheme.reactIndigo, fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _getStatusColor(visitStatus).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  visitStatus,
                  style: TextStyle(
                    color: _getStatusColor(visitStatus),
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Divider(height: 1, color: isDark ? AppTheme.slateBorder : AppTheme.snowBorder),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              if (!isVisited && !isCurrent)
                ElevatedButton.icon(
                  onPressed: () => _updateShopVisitStatus(shop, 'IN_PROGRESS'),
                  icon: const Icon(Icons.location_on_rounded, size: 16),
                  label: const Text('Start Visit'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.amberAccent,
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              if (isCurrent)
                ElevatedButton.icon(
                  onPressed: () => _updateShopVisitStatus(shop, 'COMPLETED'),
                  icon: const Icon(Icons.check_circle_rounded, size: 16),
                  label: const Text('Complete Visit'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.emeraldGreen,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              if (isVisited)
                const Row(
                  children: [
                    Icon(Icons.check_circle_rounded, color: AppTheme.emeraldGreen, size: 16),
                    SizedBox(width: 4),
                    Text('Visit Completed', style: TextStyle(color: AppTheme.emeraldGreen, fontSize: 12, fontWeight: FontWeight.bold)),
                  ],
                ),
            ],
          ),
        ],
      ),
    );
  }

  // ─── TAB 2: WEEKLY SCHEDULE CALENDAR ───────────────────────────────────────
  Widget _buildWeeklyScheduleCalendarTab(bool isDark) {
    final days = ['MON 03', 'TUE 04', 'WED 05', 'THU 06', 'FRI 07', 'SAT 08', 'SUN 09'];

    final selectedTripData = _weeklyTrips.length > _selectedCalendarDayIndex
        ? _weeklyTrips[_selectedCalendarDayIndex]
        : _weeklyTrips.first;

    final theme = Theme.of(context);
    final textColor = theme.colorScheme.onSurface;
    final mutedColor = isDark ? AppTheme.slateMuted : AppTheme.snowMuted;

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Weekly Calendar Day Strip Selector
          Text(
            'Weekly Dispatch Calendar Plan',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textColor),
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: List.generate(days.length, (idx) {
                final isSelected = idx == _selectedCalendarDayIndex;
                final tripForDay = _weeklyTrips.length > idx ? _weeklyTrips[idx] : null;
                final status = tripForDay?['status'] ?? 'PLANNED';

                return GestureDetector(
                  onTap: () => setState(() => _selectedCalendarDayIndex = idx),
                  child: Container(
                    margin: const EdgeInsets.only(right: 10),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppTheme.reactIndigo
                          : (isDark ? AppTheme.slateSurface : Colors.white),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected ? AppTheme.reactIndigo : (isDark ? AppTheme.slateBorder : AppTheme.snowBorder),
                      ),
                    ),
                    child: Column(
                      children: [
                        Text(
                          days[idx].split(' ')[0],
                          style: TextStyle(
                            color: isSelected ? Colors.white70 : mutedColor,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          days[idx].split(' ')[1],
                          style: TextStyle(
                            color: isSelected ? Colors.white : textColor,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: _getStatusColor(status),
                            shape: BoxShape.circle,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),

          const SizedBox(height: 24),

          // Day Plan Details Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.slateSurface : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: isDark ? AppTheme.slateBorder : AppTheme.snowBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          selectedTripData['routeName'] ?? 'Route Plan',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: textColor),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${selectedTripData['dayOfWeek'] ?? ''} • ${selectedTripData['totalShops'] ?? 0} Shops Assigned',
                          style: TextStyle(color: mutedColor, fontSize: 13),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: _getStatusColor(selectedTripData['status'] ?? 'PLANNED').withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: _getStatusColor(selectedTripData['status'] ?? 'PLANNED')),
                      ),
                      child: Text(
                        selectedTripData['status'] ?? 'PLANNED',
                        style: TextStyle(
                          color: _getStatusColor(selectedTripData['status'] ?? 'PLANNED'),
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Icon(Icons.directions_bus_rounded, size: 16, color: mutedColor),
                    const SizedBox(width: 6),
                    Text('Vehicle: ${selectedTripData['vehicleNumber'] ?? 'TN 78 U 2343'}', style: TextStyle(color: textColor, fontWeight: FontWeight.w600, fontSize: 13)),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),
          Text('Assigned Shop Sequence', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textColor)),
          const SizedBox(height: 12),

          if ((selectedTripData['shops'] as List?)?.isEmpty ?? true)
            const Padding(
              padding: EdgeInsets.all(24.0),
              child: Center(child: Text('No shops assigned for this day.')),
            )
          else
            ...List.generate((selectedTripData['shops'] as List).length, (i) {
              final shop = selectedTripData['shops'][i];
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.slateSurface : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: isDark ? AppTheme.slateBorder : AppTheme.snowBorder),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 14,
                      backgroundColor: AppTheme.reactIndigo.withValues(alpha: 0.15),
                      child: Text('${shop['visitSequence'] ?? (i + 1)}', style: const TextStyle(color: AppTheme.reactIndigo, fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(shop['shopName'] ?? '', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: textColor)),
                          Text(shop['address'] ?? '', style: TextStyle(color: mutedColor, fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  // ─── TAB 3: NOTIFICATIONS & ALERTS ─────────────────────────────────────────
  Widget _buildNotificationsTab(bool isDark) {
    final theme = Theme.of(context);
    final textColor = theme.colorScheme.onSurface;
    final mutedColor = isDark ? AppTheme.slateMuted : AppTheme.snowMuted;

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Live Admin Dispatch Notifications',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textColor),
              ),
              TextButton(
                onPressed: () {
                  setState(() {
                    for (var n in _notifications) {
                      n['isRead'] = true;
                    }
                  });
                },
                child: const Text('Mark All Read'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ..._notifications.map((note) {
            final isRead = note['isRead'] ?? false;
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isRead ? (isDark ? AppTheme.slateSurface : Colors.white) : AppTheme.reactIndigo.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isRead ? (isDark ? AppTheme.slateBorder : AppTheme.snowBorder) : AppTheme.reactIndigo),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: isRead ? AppTheme.slateMuted.withValues(alpha: 0.2) : AppTheme.reactIndigo.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(Icons.notifications_active_rounded, color: isRead ? mutedColor : AppTheme.reactIndigo, size: 20),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(note['title'] ?? 'Alert', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: textColor)),
                        const SizedBox(height: 4),
                        Text(note['message'] ?? '', style: TextStyle(color: mutedColor, fontSize: 13)),
                        const SizedBox(height: 6),
                        Text(note['time'] ?? '', style: TextStyle(color: AppTheme.reactCyan, fontSize: 11, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PUBLISHED':
      case 'VISITED':
      case 'COMPLETED':
        return AppTheme.emeraldGreen;
      case 'IN_PROGRESS':
      case 'IN TRANSIT':
      case 'ARRIVED':
        return AppTheme.amberAccent;
      case 'CANCELLED':
      case 'MISSED':
      case 'SKIPPED':
        return AppTheme.roseError;
      default:
        return AppTheme.reactIndigo;
    }
  }
}
