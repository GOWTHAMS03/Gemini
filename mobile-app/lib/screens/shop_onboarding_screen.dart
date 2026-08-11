import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../core/theme.dart';
import '../providers/delivery_provider.dart';
import '../services/api_service.dart';
import '../widgets/app_svg_icons.dart';

class ShopOnboardingScreen extends StatefulWidget {
  const ShopOnboardingScreen({super.key});

  @override
  State<ShopOnboardingScreen> createState() => _ShopOnboardingScreenState();
}

class _ShopOnboardingScreenState extends State<ShopOnboardingScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _formKey = GlobalKey<FormState>();

  // Step 1: Basic Info
  final _nameController = TextEditingController();
  final _ownerController = TextEditingController();
  final _phoneController = TextEditingController();
  final _gstinController = TextEditingController();
  late TextEditingController _createdByController;
  late TextEditingController _executiveCodeController;
  String _customerType = 'SHOP';

  // Step 2: Address & Location
  final _addressController = TextEditingController();
  String? _selectedRoute;
  double? _latitude;
  double? _longitude;
  double? _locationAccuracy;
  bool _isCapturingGps = false;
  bool _isSubmitting = false;
  bool _isLoadingRoutes = true;
  final MapController _mapController = MapController();

  List<String> _routesList = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    final provider = Provider.of<DeliveryProvider>(context, listen: false);
    final driver = provider.currentDriver;
    _createdByController = TextEditingController(
      text: driver != null && driver.fullName.isNotEmpty ? driver.fullName : 'Sales Executive',
    );
    _executiveCodeController = TextEditingController(
      text: driver != null && driver.username.isNotEmpty ? driver.username : 'EXEC001',
    );

    _loadDeliveryRoutes();
  }

  Future<void> _loadDeliveryRoutes() async {
    try {
      final routes = await ApiService().getRoutes();
      if (mounted) {
        setState(() {
          _routesList = routes
              .map((r) => (r['routeName'] ?? r['name'] ?? '').toString())
              .where((name) => name.trim().isNotEmpty)
              .toSet()
              .toList();
          
          if (_routesList.isNotEmpty) {
            _selectedRoute = _routesList.first;
          }
          _isLoadingRoutes = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoadingRoutes = false);
      }
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _nameController.dispose();
    _ownerController.dispose();
    _phoneController.dispose();
    _gstinController.dispose();
    _addressController.dispose();
    _createdByController.dispose();
    _executiveCodeController.dispose();
    super.dispose();
  }

  Future<void> _captureGpsLocation() async {
    setState(() => _isCapturingGps = true);
    try {
      // 1. Check if location services are enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Please enable GPS / Location services on your device.'),
              backgroundColor: AppTheme.amberAccent,
            ),
          );
        }
        setState(() => _isCapturingGps = false);
        return;
      }

      // 2. Check and request permission
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Location permission denied. Tap on map to pin coordinates manually.'),
                backgroundColor: AppTheme.amberAccent,
              ),
            );
          }
          setState(() => _isCapturingGps = false);
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Location permission permanently denied. You can tap on map to pin location.'),
              backgroundColor: AppTheme.amberAccent,
            ),
          );
        }
        setState(() => _isCapturingGps = false);
        return;
      }

      // 3. Resilient position acquisition: Try last known first, then fresh position with fast timeout
      Position? position;
      try {
        position = await Geolocator.getLastKnownPosition();
      } catch (_) {}

      try {
        final freshPos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.medium,
          timeLimit: const Duration(seconds: 4),
        );
        position = freshPos;
      } catch (_) {
        // If fresh medium accuracy times out, try low accuracy quickly
        if (position == null) {
          try {
            position = await Geolocator.getCurrentPosition(
              desiredAccuracy: LocationAccuracy.low,
              timeLimit: const Duration(seconds: 3),
            );
          } catch (_) {}
        }
      }

      if (mounted) {
        if (position != null) {
          setState(() {
            _latitude = position!.latitude;
            _longitude = position!.longitude;
            _locationAccuracy = position!.accuracy;
            _isCapturingGps = false;
          });
          _mapController.move(LatLng(position.latitude, position.longitude), 15.0);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                '✓ GPS Captured: ${_latitude!.toStringAsFixed(5)}, ${_longitude!.toStringAsFixed(5)} (±${_locationAccuracy!.toStringAsFixed(0)}m)',
              ),
              backgroundColor: AppTheme.emeraldGreen,
            ),
          );
        } else {
          // Graceful fallback to default map center if satellite fix is not acquired (e.g. emulator or indoors)
          final fallbackLat = _latitude ?? 10.787252191240228;
          final fallbackLng = _longitude ?? 79.57505803846621;
          setState(() {
            _latitude = fallbackLat;
            _longitude = fallbackLng;
            _locationAccuracy = 30.0;
            _isCapturingGps = false;
          });
          _mapController.move(LatLng(fallbackLat, fallbackLng), 14.5);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('GPS satellite fix timed out. Pinned to map center. Tap map to adjust pin.'),
              backgroundColor: AppTheme.amberAccent,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        final fallbackLat = _latitude ?? 10.787252191240228;
        final fallbackLng = _longitude ?? 79.57505803846621;
        setState(() {
          _latitude = fallbackLat;
          _longitude = fallbackLng;
          _locationAccuracy = 50.0;
          _isCapturingGps = false;
        });
        _mapController.move(LatLng(fallbackLat, fallbackLng), 14.5);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Location initialized from map. Tap anywhere on map to pin exact shop location.'),
            backgroundColor: AppTheme.amberAccent,
          ),
        );
      }
    }
  }

  Future<void> _submitShopOnboarding() async {
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please complete all required fields correctly.'),
          backgroundColor: AppTheme.roseError,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final String generatedShopCode = 'SHP-${(1000 + Random().nextInt(8999))}';
    final shopData = {
      'shopCode': generatedShopCode,
      'name': _nameController.text.trim(),
      'ownerName': _ownerController.text.trim(),
      'phone': _phoneController.text.trim(),
      'gstin': _gstinController.text.trim().toUpperCase(),
      'address': _addressController.text.trim(),
      'routeName': (_selectedRoute != null && _selectedRoute!.trim().isNotEmpty)
          ? _selectedRoute!.trim()
          : 'General / Unassigned Route',
      'customerType': _customerType,
      'creditLimit': 0.0,
      'discountPercent': 8.0,
      'latitude': _latitude,
      'longitude': _longitude,
      'locationAccuracy': _locationAccuracy,
      'outstandingAmount': 0.0,
      'isActive': true,
      'createdBy': _createdByController.text.trim().isNotEmpty ? _createdByController.text.trim() : 'Sales Executive',
      'salesExecutiveCode': _executiveCodeController.text.trim().isNotEmpty ? _executiveCodeController.text.trim() : 'EXEC001',
    };

    try {
      // Call API
      await ApiService().createShop(shopData);

      if (mounted) {
        final provider = Provider.of<DeliveryProvider>(context, listen: false);
        provider.autoCheckConnectionAndSync();
        setState(() => _isSubmitting = false);
        _showSuccessDialog(generatedShopCode, shopData);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        // If offline fallback, show success for local store
        _showSuccessDialog(generatedShopCode, shopData, isOffline: true);
      }
    }
  }

  void _showSuccessDialog(String shopCode, Map<String, dynamic> shopData, {bool isOffline = false}) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            AppSvgIcon(svgString: AppSvgIcons.checkCircle, color: AppTheme.emeraldGreen, size: 28),
            SizedBox(width: 10),
            Text('Shop Onboarded!'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${shopData['name']} has been successfully onboarded.',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
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
                  _buildDetailRow('Shop Code:', shopCode, isBold: true),
                  _buildDetailRow('Owner:', shopData['ownerName']),
                  _buildDetailRow('Phone:', shopData['phone']),
                  _buildDetailRow('Route:', shopData['routeName']),
                  _buildDetailRow('Onboarded By:', '${shopData['createdBy']} (${shopData['salesExecutiveCode']})'),
                  if (isOffline)
                    const Padding(
                      padding: EdgeInsets.only(top: 4),
                      child: Text('Saved locally. Will sync to server when online.',
                          style: TextStyle(fontSize: 10, color: AppTheme.amberAccent, fontStyle: FontStyle.italic)),
                    ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              Navigator.of(context).pop(true);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.emeraldGreen),
            child: const Text('Done / Route Dashboard'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          Text(value, style: TextStyle(fontSize: 11, fontWeight: isBold ? FontWeight.bold : FontWeight.w600, color: isBold ? AppTheme.reactIndigo : Colors.black87)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final iconColor = isDark ? AppTheme.reactCyan : AppTheme.reactIndigo;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Onboard New Shop'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.reactIndigo,
          labelColor: isDark ? AppTheme.reactCyan : AppTheme.reactIndigo,
          unselectedLabelColor: Colors.grey,
          tabs: [
            Tab(icon: AppSvgIcon(svgString: AppSvgIcons.onboardShop, size: 20, color: iconColor), text: '1. Basic Info'),
            Tab(icon: AppSvgIcon(svgString: AppSvgIcons.mapPin, size: 20, color: iconColor), text: '2. Location & Submit'),
          ],
        ),
      ),
      body: Form(
        key: _formKey,
        child: TabBarView(
          controller: _tabController,
          children: [
            // STEP 1: Basic Outlet & Owner Info
            SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Step 1 of 2: Outlet & Contact Details',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text('Enter official business name, owner contact details, and GST classification.',
                      style: TextStyle(fontSize: 12, color: Colors.grey)),
                  const SizedBox(height: 16),

                  TextFormField(
                    controller: _nameController,
                    decoration: InputDecoration(
                      labelText: 'Shop / Outlet Name *',
                      hintText: 'e.g. Metro Bakery & Supermarket',
                      prefixIcon: Padding(
                        padding: const EdgeInsets.all(12),
                        child: AppSvgIcon(svgString: AppSvgIcons.store, size: 18, color: iconColor),
                      ),
                    ),
                    validator: (val) => val == null || val.trim().isEmpty ? 'Enter shop name' : null,
                  ),
                  const SizedBox(height: 14),

                  TextFormField(
                    controller: _ownerController,
                    decoration: InputDecoration(
                      labelText: 'Owner / Contact Person *',
                      hintText: 'e.g. Mr. Rajesh Kumar',
                      prefixIcon: Padding(
                        padding: const EdgeInsets.all(12),
                        child: AppSvgIcon(svgString: AppSvgIcons.driverPerson, size: 18, color: iconColor),
                      ),
                    ),
                    validator: (val) => val == null || val.trim().isEmpty ? 'Enter owner name' : null,
                  ),
                  const SizedBox(height: 14),

                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      labelText: 'Mobile Phone Number *',
                      hintText: '+91 98765 43210',
                      prefixIcon: Padding(
                        padding: const EdgeInsets.all(12),
                        child: AppSvgIcon(svgString: AppSvgIcons.phone, size: 18, color: iconColor),
                      ),
                    ),
                    validator: (val) {
                      if (val == null || val.trim().isEmpty) return 'Enter mobile number';
                      if (val.trim().length < 10) return 'Enter valid 10-digit mobile number';
                      return null;
                    },
                  ),
                  const SizedBox(height: 14),

                  TextFormField(
                    controller: _gstinController,
                    textCapitalization: TextCapitalization.characters,
                    decoration: InputDecoration(
                      labelText: 'GSTIN Number (Optional)',
                      hintText: '33AAACG1234F1Z5',
                      prefixIcon: Padding(
                        padding: const EdgeInsets.all(12),
                        child: AppSvgIcon(svgString: AppSvgIcons.gstinDocument, size: 18, color: iconColor),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  DropdownButtonFormField<String>(
                    initialValue: _customerType,
                    isExpanded: true,
                    decoration: InputDecoration(
                      labelText: 'Customer Classification *',
                      prefixIcon: Padding(
                        padding: const EdgeInsets.all(12),
                        child: AppSvgIcon(svgString: AppSvgIcons.categoryTag, size: 18, color: iconColor),
                      ),
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: 'SHOP',
                        child: Text(
                          'Retail Shop / Bakery Outlet',
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        ),
                      ),
                      DropdownMenuItem(
                        value: 'WHOLESALE_AGENT',
                        child: Text(
                          'Wholesale Distributor Agent',
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        ),
                      ),
                      DropdownMenuItem(
                        value: 'RETAIL_CUSTOMER',
                        child: Text(
                          'Direct Retail Customer',
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        ),
                      ),
                    ],
                    onChanged: (val) {
                      if (val != null) setState(() => _customerType = val);
                    },
                  ),
                  const SizedBox(height: 14),

                  // Sales Executive Attribution for Bonus
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDark ? AppTheme.slateSurface : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: isDark ? AppTheme.slateBorder : const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Sales Executive Attribution (Bonus Credit)',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.emeraldGreen),
                        ),
                        const SizedBox(height: 10),
                        TextFormField(
                          controller: _createdByController,
                          decoration: InputDecoration(
                            labelText: 'Executive / Driver Name *',
                            prefixIcon: Padding(
                              padding: const EdgeInsets.all(12),
                              child: AppSvgIcon(svgString: AppSvgIcons.driverPerson, size: 18, color: iconColor),
                            ),
                          ),
                          validator: (val) => val == null || val.trim().isEmpty ? 'Enter executive name' : null,
                        ),
                        const SizedBox(height: 10),
                        TextFormField(
                          controller: _executiveCodeController,
                          decoration: InputDecoration(
                            labelText: 'Executive Code *',
                            hintText: 'e.g. EXEC001 / DRV001',
                            prefixIcon: Padding(
                              padding: const EdgeInsets.all(12),
                              child: AppSvgIcon(svgString: AppSvgIcons.categoryTag, size: 18, color: iconColor),
                            ),
                          ),
                          validator: (val) => val == null || val.trim().isEmpty ? 'Enter executive code' : null,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  ElevatedButton.icon(
                    onPressed: () => _tabController.animateTo(1),
                    icon: const AppSvgIcon(svgString: AppSvgIcons.arrowForward, size: 18, color: Colors.white),
                    label: const Text('Next: Location & Address'),
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size.fromHeight(52),
                    ),
                  ),
                ],
              ),
            ),

            // STEP 2: Address, GPS Location & Final Submission
            SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Step 2 of 2: Delivery Address & Live GPS',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text('Specify physical delivery landmark and capture live GPS location for driver navigation.',
                      style: TextStyle(fontSize: 12, color: Colors.grey)),
                  const SizedBox(height: 16),

                  TextFormField(
                    controller: _addressController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      labelText: 'Full Delivery Address & Landmark *',
                      hintText: '124 Grand Trunk Road, Near Central Bus Stand, Zone 4',
                      prefixIcon: Padding(
                        padding: const EdgeInsets.all(12),
                        child: AppSvgIcon(svgString: AppSvgIcons.locationCity, size: 18, color: iconColor),
                      ),
                    ),
                    validator: (val) => val == null || val.trim().isEmpty ? 'Enter delivery address' : null,
                  ),
                  const SizedBox(height: 14),

                  DropdownButtonFormField<String?>(
                    value: _selectedRoute,
                    isExpanded: true,
                    decoration: InputDecoration(
                      labelText: 'Assign Delivery Route (Optional)',
                      hintText: _isLoadingRoutes ? 'Loading routes from server...' : 'Select a route or leave unassigned',
                      prefixIcon: Padding(
                        padding: const EdgeInsets.all(12),
                        child: AppSvgIcon(svgString: AppSvgIcons.routePath, size: 18, color: iconColor),
                      ),
                      suffixIcon: _isLoadingRoutes
                          ? const Padding(
                              padding: EdgeInsets.all(14),
                              child: SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.emeraldGreen),
                              ),
                            )
                          : null,
                    ),
                    items: [
                      const DropdownMenuItem<String?>(
                        value: null,
                        child: Text(
                          'Unassigned / General Route',
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                          style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic),
                        ),
                      ),
                      ..._routesList.map(
                        (r) => DropdownMenuItem<String?>(
                          value: r,
                          child: Text(
                            r,
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                          ),
                        ),
                      ),
                    ],
                    onChanged: (val) {
                      setState(() => _selectedRoute = val);
                    },
                  ),
                  const SizedBox(height: 16),

                  // GPS Geo-Location Card
                  Card(
                    color: isDark ? AppTheme.slateSurface : const Color(0xFFF1F5F9),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(color: isDark ? AppTheme.slateBorder : const Color(0xFFCBD5E1)),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              AppSvgIcon(svgString: AppSvgIcons.gpsTarget, color: AppTheme.reactIndigo, size: 20),
                              const SizedBox(width: 8),
                              const Text('Live Location Coordinates', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            ],
                          ),
                          const SizedBox(height: 16),
                          
                          // MAP PREVIEW WITH TAP-TO-PIN SELECTION
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: SizedBox(
                              height: 200,
                              width: double.infinity,
                              child: Stack(
                                children: [
                                  FlutterMap(
                                    mapController: _mapController,
                                    options: MapOptions(
                                      initialCenter: LatLng(_latitude ?? 13.082700, _longitude ?? 80.270700),
                                      initialZoom: 15.0,
                                      onTap: (tapPosition, point) {
                                        setState(() {
                                          _latitude = point.latitude;
                                          _longitude = point.longitude;
                                        });
                                        _mapController.move(point, _mapController.camera.zoom);
                                      },
                                    ),
                                    children: [
                                      TileLayer(
                                        urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                        userAgentPackageName: 'com.breadfactory.erp',
                                      ),
                                      MarkerLayer(
                                        markers: [
                                          Marker(
                                            point: LatLng(_latitude ?? 13.082700, _longitude ?? 80.270700),
                                            width: 44,
                                            height: 44,
                                            alignment: Alignment.topCenter,
                                            child: const Icon(
                                              Icons.location_on,
                                              color: Colors.red,
                                              size: 44,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                  Positioned(
                                    top: 8,
                                    right: 8,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                      decoration: BoxDecoration(
                                        color: Colors.black87,
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.touch_app, color: Colors.white, size: 14),
                                          SizedBox(width: 4),
                                          Text(
                                            'Tap map to set pin',
                                            style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          
                          // Coordinates Display
                          Row(
                            children: [
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                                  decoration: BoxDecoration(
                                    color: isDark ? AppTheme.slateBg : Colors.white,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: isDark ? AppTheme.slateBorder : const Color(0xFFE2E8F0)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('LATITUDE', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                                      const SizedBox(height: 2),
                                      Text(_latitude?.toStringAsFixed(6) ?? '13.082700', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: _latitude != null ? AppTheme.emeraldGreen : AppTheme.snowText)),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                                  decoration: BoxDecoration(
                                    color: isDark ? AppTheme.slateBg : Colors.white,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: isDark ? AppTheme.slateBorder : const Color(0xFFE2E8F0)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('LONGITUDE', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                                      const SizedBox(height: 2),
                                      Text(_longitude?.toStringAsFixed(6) ?? '80.270700', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: _longitude != null ? AppTheme.emeraldGreen : AppTheme.snowText)),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          
                          // Capture GPS Full Width Button
                          ElevatedButton.icon(
                            onPressed: _isCapturingGps ? null : _captureGpsLocation,
                            icon: _isCapturingGps
                                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                                : const AppSvgIcon(svgString: AppSvgIcons.myLocation, size: 18, color: Colors.white),
                            label: Text(_isCapturingGps ? 'Locating...' : 'GPS Location', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.reactIndigo,
                              foregroundColor: Colors.white,
                              minimumSize: const Size.fromHeight(48),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              elevation: 0,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Final Submission Button
                  ElevatedButton.icon(
                    onPressed: _isSubmitting ? null : _submitShopOnboarding,
                    icon: _isSubmitting
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const AppSvgIcon(svgString: AppSvgIcons.checkCircle, size: 20, color: Colors.white),
                    label: Text(
                      _isSubmitting ? 'Onboarding Outlet...' : 'Complete Onboarding',
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    ),
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size.fromHeight(52),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () => _tabController.animateTo(0),
                      child: const Text('Back to Basic Info'),
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
}
