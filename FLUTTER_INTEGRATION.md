# Flutter Mobile Integration - Copy-Paste Ready Code

## Complete Updated main.dart

Replace your current `mobile-app/lib/main.dart` with this version:

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme.dart';
import 'providers/delivery_provider.dart';
import 'screens/login_screen.dart';
import 'screens/driver_dashboard_screen.dart';
import 'services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  await ApiService.initialize(prefs);
  
  final bool isLoggedIn = prefs.getString('cached_driver_profile') != null;

  runApp(BreadErpApp(isLoggedIn: isLoggedIn));
}

class BreadErpApp extends StatelessWidget {
  final bool isLoggedIn;
  
  const BreadErpApp({super.key, required this.isLoggedIn});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => DeliveryProvider()),
      ],
      child: MaterialApp(
        title: 'Bread Factory ERP Mobile',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        home: isLoggedIn ? const DriverDashboardScreen() : const LoginScreen(),
      ),
    );
  }
}
```

---

## Updated Driver Dashboard with Trip Assignment Integration

Replace the relevant sections of `mobile-app/lib/screens/driver_dashboard_screen.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../providers/delivery_provider.dart';
import '../../widgets/app_svg_icons.dart';
import 'shop_acknowledgement_screen.dart';
import 'sales_screen.dart';
import 'shop_details_screen.dart';
import 'truck_inventory_screen.dart';
import 'end_of_day_screen.dart';
import 'esc_pos_printer_screen.dart';
import 'shop_onboarding_screen.dart';
import 'shop_return_screen.dart';
import 'trip_assignment_screen.dart';  // NEW IMPORT
import 'login_screen.dart';

class DriverDashboardScreen extends StatelessWidget {
  const DriverDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<DeliveryProvider>(context);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

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

    return Scaffold(
      appBar: AppBar(
        title: const Text('Field Sales & Route Stops'),
        actions: [
          // NEW: Trip Assignment Button
          IconButton(
            icon: const Icon(Icons.assignment, size: 24),
            tooltip: 'My Assigned Trip',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => const TripAssignmentScreen(),
                ),
              );
            },
          ),
          IconButton(
            icon: AppSvgIcon(
              svgString: AppSvgIcons.onboardShop,
              size: 20,
              color: theme.colorScheme.primary,
            ),
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
          IconButton(
            icon: AppSvgIcon(
              svgString: AppSvgIcons.sync,
              size: 20,
              color: theme.colorScheme.primary,
            ),
            tooltip: 'Sync Local Data',
            onPressed: () async {
              bool success = await provider.manualSync();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      success
                          ? 'Synced route data & offline transactions successfully!'
                          : 'Failed to sync. Please try again.',
                    ),
                    backgroundColor:
                        success ? AppTheme.emeraldGreen : AppTheme.roseError,
                  ),
                );
              }
            },
          )
        ],
      ),
      drawer: AppNavigationDrawer(provider: provider),
      body: Column(
        children: [
          // ENHANCED: Vehicle Summary Banner with Trip Info
          Container(
            margin: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.slateSurface : AppTheme.metricSky,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark
                    ? AppTheme.slateBorder
                    : AppTheme.accentSky.withValues(alpha: 0.5),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          provider.activeTrip?.tripNumber ?? 'NO TRIP',
                          style: TextStyle(
                            color: isDark
                                ? AppTheme.reactCyan
                                : AppTheme.snowActive,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
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
                                                : Icons
                                                    .network_wifi_1_bar))),
                                size: 12,
                                color: provider.isOnline
                                    ? AppTheme.emeraldGreen
                                    : AppTheme.amberAccent,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                provider.isOnline
                                    ? (provider.pingMs != -1
                                        ? '${provider.pingMs}ms'
                                        : 'ONLINE')
                                    : 'OFFLINE',
                                style: TextStyle(
                                  color: provider.isOnline
                                      ? AppTheme.emeraldGreen
                                      : AppTheme.amberAccent,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Vehicle: ${provider.activeTrip?.vehicleNumber ?? "TN-01-EA-4521"}',
                      style: TextStyle(
                        color: theme.colorScheme.onSurface,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Route: ${provider.activeTrip?.routeName ?? "North Chennai Route A"}',
                      style: TextStyle(
                        color: theme.colorScheme.onSurface.withOpacity(0.7),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const TripAssignmentScreen(),
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDark
                          ? AppTheme.reactIndigo.withValues(alpha: 0.2)
                          : AppTheme.metricBlue,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AnimatedDrivingTruck(
                          color: isDark ? AppTheme.reactCyan : AppTheme.snowActive,
                          size: 28,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'View Trip',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: isDark
                                ? AppTheme.reactCyan
                                : AppTheme.snowActive,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              ],
            ),
          ),
          // ... rest of the dashboard content
        ],
      ),
    );
  }
}

// Navigation Drawer - Add new menu items
class AppNavigationDrawer extends StatelessWidget {
  final DeliveryProvider provider;

  const AppNavigationDrawer({Key? key, required this.provider})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          // Drawer Header
          DrawerHeader(
            decoration: BoxDecoration(
              color: theme.colorScheme.primary,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text(
                  provider.currentDriver?.fullName ?? 'Driver',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Driver ID: ${provider.currentDriver?.id ?? '-'}',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.8),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          
          // Navigation Items
          ListTile(
            leading: const Icon(Icons.home),
            title: const Text('Dashboard'),
            onTap: () {
              Navigator.pop(context);
            },
          ),
          
          // NEW: Trip Assignment
          ListTile(
            leading: const Icon(Icons.assignment),
            title: const Text('My Assigned Trip'),
            subtitle: const Text('View trip details and inventory'),
            onTap: () {
              Navigator.pop(context);
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => const TripAssignmentScreen(),
                ),
              );
            },
          ),
          
          const Divider(),
          
          // Existing menu items
          ListTile(
            leading: const Icon(Icons.store),
            title: const Text('Shop Details'),
            onTap: () {
              Navigator.pop(context);
              // Navigate to shop details
            },
          ),
          
          ListTile(
            leading: const Icon(Icons.sell),
            title: const Text('Record Sales'),
            onTap: () {
              Navigator.pop(context);
              // Navigate to sales screen
            },
          ),
          
          ListTile(
            leading: const Icon(Icons.local_shipping),
            title: const Text('Truck Inventory'),
            onTap: () {
              Navigator.pop(context);
              // Navigate to inventory
            },
          ),
          
          ListTile(
            leading: const Icon(Icons.rotate_left),
            title: const Text('Returns'),
            onTap: () {
              Navigator.pop(context);
              // Navigate to returns
            },
          ),
          
          const Divider(),
          
          ListTile(
            leading: const Icon(Icons.print),
            title: const Text('Printer Settings'),
            onTap: () {
              Navigator.pop(context);
              // Navigate to printer settings
            },
          ),
          
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Logout'),
            onTap: () {
              Navigator.pop(context);
              provider.logout();
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
          ),
        ],
      ),
    );
  }
}

// Animated Truck Widget (if not already defined)
class AnimatedDrivingTruck extends StatefulWidget {
  final Color color;
  final double size;

  const AnimatedDrivingTruck({
    Key? key,
    required this.color,
    this.size = 24,
  }) : super(key: key);

  @override
  State<AnimatedDrivingTruck> createState() => _AnimatedDrivingTruckState();
}

class _AnimatedDrivingTruckState extends State<AnimatedDrivingTruck>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat();
    _animation = Tween<double>(begin: 0, end: 1).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Icon(Icons.local_shipping, color: widget.color, size: widget.size);
      },
    );
  }
}
```

---

## pubspec.yaml Dependencies

Ensure your `mobile-app/pubspec.yaml` includes these dependencies:

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Provider for state management
  provider: ^6.0.0
  
  # HTTP and JSON
  http: ^1.1.0
  dio: ^5.3.0
  
  # Local storage
  shared_preferences: ^2.2.0
  
  # Location tracking
  geolocator: ^10.1.0
  
  # UI components
  google_maps_flutter: ^2.5.0
  
  # Date/Time
  intl: ^0.19.0
  
  # State management and utils
  uuid: ^4.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
```

---

## API Service Extensions

Add these methods to `mobile-app/lib/services/api_service.dart` if not already present:

```dart
// Add to ApiService class

/// Get active trip for driver
Future<Map<String, dynamic>?> getActiveTrip(int driverId) async {
  try {
    final response = await http.get(
      Uri.parse('$_baseUrl/trips/driver/$driverId/active'),
      headers: _getHeaders(),
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else if (response.statusCode == 204) {
      return null; // No active trip
    } else {
      throw ApiException('Failed to fetch active trip', response.statusCode);
    }
  } catch (e) {
    if (e is ApiException) rethrow;
    throw ApiException('Get active trip error: $e', 0);
  }
}

/// Get trip details
Future<Map<String, dynamic>> getTripDetails(int tripId) async {
  try {
    final response = await http.get(
      Uri.parse('$_baseUrl/trips/$tripId'),
      headers: _getHeaders(),
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw ApiException('Failed to fetch trip details', response.statusCode);
    }
  } catch (e) {
    if (e is ApiException) rethrow;
    throw ApiException('Get trip details error: $e', 0);
  }
}

/// Get shops for trip
Future<List<Map<String, dynamic>>> getTripShops(int tripId) async {
  try {
    final response = await http.get(
      Uri.parse('$_baseUrl/trips/$tripId/shops'),
      headers: _getHeaders(),
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      return List<Map<String, dynamic>>.from(jsonDecode(response.body));
    } else {
      throw ApiException('Failed to fetch trip shops', response.statusCode);
    }
  } catch (e) {
    if (e is ApiException) rethrow;
    throw ApiException('Get trip shops error: $e', 0);
  }
}
```

---

## Testing the Mobile Integration

### 1. Run the Mobile App
```bash
cd mobile-app
flutter pub get
flutter run
```

### 2. Login Flow
- Enter username: `sales_arun`
- Enter password: `arun123`
- Click Login

### 3. Test Trip Assignment Screen
- On dashboard, click the assignment icon (top-right)
- Or tap "My Assigned Trip" in navigation drawer
- Should display active trip details
- Verify all sections load without errors

### 4. Verify Data Display
```
✓ Trip number displays
✓ Trip date shows
✓ Route name shows
✓ Dispatch group shows
✓ Vehicle info shows
✓ Inventory summary shows (Loaded, Sold, Returned, Damaged)
✓ Shop list shows scheduled shops
✓ Products list shows loaded products
```

---

## Common Issues & Solutions

### Issue: TripAssignmentScreen import error
```
error: TripAssignmentScreen not found
```
**Solution:** Ensure file exists at:
```
mobile-app/lib/screens/trip_assignment_screen.dart
```

### Issue: API Connection Error on Trip Load
```
ApiException: Connect error: Connection refused
```
**Solution:**
1. Check backend is running on port 9023
2. On login screen, change server IP to your computer's IP
3. For emulator: Use `10.0.2.2:9023`
4. For physical device: Use your PC's local IP (e.g., `192.168.1.100:9023`)

### Issue: Null pointer when accessing trip data
**Solution:** Check backend returns complete trip object with all fields:
```json
{
  "id": 1,
  "tripNumber": "TRIP-123",
  "tripDate": "2026-08-08",
  "status": "DISPATCHED",
  "dispatchGroupName": "Team A",
  "routeName": "Salem Route",
  "totalLoadedQuantity": 100,
  "totalSoldQuantity": 0,
  "totalReturnedQuantity": 0,
  "totalDamagedQuantity": 0,
  "shopVisits": [],
  "items": []
}
```

### Issue: Blank TripAssignmentScreen
**Solution:**
1. Verify driver has active trip assigned in database
2. Check API endpoint: `GET /api/v1/trips/driver/{driverId}/active`
3. Verify response is not null/empty
4. Check Flutter console for error messages

---

## File Locations Reference

**Main files to update:**
- ✓ `mobile-app/lib/main.dart` - App entry point
- ✓ `mobile-app/lib/screens/driver_dashboard_screen.dart` - Dashboard with trip integration
- ✓ `mobile-app/lib/screens/trip_assignment_screen.dart` - New trip details screen
- ✓ `mobile-app/lib/services/api_service.dart` - API endpoints
- ✓ `mobile-app/pubspec.yaml` - Dependencies

---

## Next Steps

1. ✅ Copy TripAssignmentScreen.dart to screens folder
2. ✅ Update main.dart with new imports
3. ✅ Update driver_dashboard_screen.dart with navigation
4. ✅ Update pubspec.yaml with dependencies
5. ✅ Run `flutter pub get`
6. ✅ Run `flutter run` to start app
7. ✅ Login and test trip assignment flow

**Your mobile app is ready to show assigned trips!**
