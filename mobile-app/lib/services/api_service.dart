import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class ApiException implements Exception {
  final String message;
  final int statusCode;

  ApiException(this.message, this.statusCode);

  @override
  String toString() => 'ApiException: $message (Status: $statusCode)';
}

class ApiService {
  // Production AWS EC2 Server IP
  static const String _PROD_IP = '32.236.155.239';
  static const String _API_VERSION = 'v1';

  static late String _baseUrl;
  static SharedPreferences? _prefs;

  static final ApiService _instance = ApiService._internal();

  factory ApiService() {
    return _instance;
  }

  ApiService._internal();

  static String _formatUrl(String hostOrIp) {
    String clean = hostOrIp.trim().replaceAll('http://', '').replaceAll('https://', '');
    if (clean.endsWith('/')) clean = clean.substring(0, clean.length - 1);
    if (clean.endsWith('/api/v1')) return 'http://$clean';
    if (clean.contains(':')) {
      return 'http://$clean/api/$_API_VERSION';
    }
    return 'http://$clean/api/$_API_VERSION';
  }

  static Future<void> initialize(SharedPreferences prefs) async {
    _prefs = prefs;
    
    // Check if custom IP was explicitly configured
    final savedIp = _prefs?.getString('custom_server_ip');
    if (savedIp != null && savedIp.isNotEmpty) {
      _baseUrl = _formatUrl(savedIp);
      return;
    }

    // Default immediately to AWS EC2 Production Server
    _baseUrl = _formatUrl(_PROD_IP);
  }

  static void setServerIp(String ip) {
    String clean = ip.trim();
    if (clean.isEmpty) clean = _PROD_IP;
    _baseUrl = _formatUrl(clean);
    _prefs?.setString('custom_server_ip', clean);
  }

  static String get baseUrl => _baseUrl;

  String? _getToken() {
    return _prefs?.getString('auth_token');
  }

  Future<void> _saveToken(String token) async {
    await _prefs?.setString('auth_token', token);
  }

  Future<void> _clearToken() async {
    await _prefs?.remove('auth_token');
  }

  Map<String, String> _getHeaders({bool includeAuth = true}) {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (includeAuth) {
      final token = _getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return headers;
  }

  // ============================================================
  // AUTH ENDPOINTS
  // ============================================================

  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/login'),
        headers: _getHeaders(includeAuth: false),
        body: jsonEncode({
          'username': username,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await _saveToken(data['accessToken']);
        return data;
      } else if (response.statusCode == 401) {
        final msg = response.body.isNotEmpty ? response.body : 'Invalid username or password';
        throw ApiException(msg, 401);
      } else {
        throw ApiException('Login failed', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Connect error: $e', 0);
    }
  }

  Future<Map<String, dynamic>> register(
    String username,
    String password,
    String fullName,
    String email,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/register'),
        headers: _getHeaders(includeAuth: false),
        body: jsonEncode({
          'username': username,
          'password': password,
          'fullName': fullName,
          'email': email,
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        throw ApiException('Registration failed', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Registration error: $e', 0);
    }
  }

  // ============================================================
  // TRIP ENDPOINTS
  // ============================================================

  Future<Map<String, dynamic>?> getActiveTrip(int driverId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/trips/driver/$driverId/active'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 204) {
        return null;
      } else {
        throw ApiException('Failed to fetch active trip', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Get active trip error: $e', 0);
    }
  }

  Future<Map<String, dynamic>?> getActiveTripForSalesPerson(int salesPersonId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/trips/sales/$salesPersonId/active'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else if (response.statusCode == 204) {
        return null;
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, dynamic>> startTrip(int tripId) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/trips/$tripId/start'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw ApiException('Failed to start trip', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Start trip error: $e', 0);
    }
  }

  Future<Map<String, dynamic>> completeTrip(int tripId) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/trips/$tripId/complete'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw ApiException('Failed to complete trip', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Complete trip error: $e', 0);
    }
  }

  Future<Map<String, dynamic>> updateTripStatus(int tripId, String status) async {
    try {
      final response = await http.put(
        Uri.parse('$_baseUrl/trips/$tripId/status?status=$status'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw ApiException('Failed to update trip status', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Update trip status error: $e', 0);
    }
  }

  // ============================================================
  // MEDIA & POD PROOF UPLOAD ENDPOINTS
  // ============================================================

  Future<String?> uploadPodProofImage(List<int> bytes, String filename) async {
    try {
      var request = http.MultipartRequest('POST', Uri.parse('$_baseUrl/pod/upload-proof'));
      request.headers.addAll(_getHeaders(includeAuth: true));
      request.files.add(http.MultipartFile.fromBytes('file', bytes, filename: filename));

      var streamedResponse = await request.send().timeout(const Duration(seconds: 25));
      var response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return data['secure_url'] ?? data['url'];
      }
    } catch (e) {
      // Gracefully log
    }
    return null;
  }

  // ============================================================
  // DELIVERY ENDPOINTS
  // ============================================================

  Future<List<Map<String, dynamic>>> getDeliveriesByTrip(int tripId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/deliveries/trip/$tripId'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data);
      } else {
        return [];
      }
    } catch (e) {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getAllShops() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/shops'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data);
      } else {
        return [];
      }
    } catch (e) {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getRoutes() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/routes'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data);
      } else {
        return [];
      }
    } catch (e) {
      return [];
    }
  }

  Future<Map<String, dynamic>> acknowledgeDelivery(Map<String, dynamic> payload) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/deliveries/acknowledge'),
        headers: _getHeaders(),
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        throw ApiException('Failed to acknowledge delivery', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Acknowledge delivery error: $e', 0);
    }
  }

  // ============================================================
  // INVOICE ENDPOINTS
  // ============================================================

  Future<Map<String, dynamic>> createInvoice(Map<String, dynamic> invoiceData) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/invoices'),
        headers: _getHeaders(),
        body: jsonEncode(invoiceData),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        throw ApiException('Failed to create invoice', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Create invoice error: $e', 0);
    }
  }

  Future<List<Map<String, dynamic>>> getInvoicesByShop(int shopId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/invoices/shop/$shopId'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data);
      } else {
        throw ApiException('Failed to fetch shop invoices', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Get shop history error: $e', 0);
    }
  }

  Future<List<Map<String, dynamic>>> getInvoicesByTrip(int tripId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/invoices/trip/$tripId'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data);
      } else {
        throw ApiException('Failed to fetch trip invoices', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Get trip invoices error: $e', 0);
    }
  }

  // ============================================================
  // DAILY SETTLEMENT ENDPOINTS
  // ============================================================

  Future<Map<String, dynamic>> settleCollection(Map<String, dynamic> settlementData) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/collections/settle'),
        headers: _getHeaders(),
        body: jsonEncode(settlementData),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        throw ApiException('Failed to submit collection settlement', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Settle collection error: $e', 0);
    }
  }

  Future<Map<String, dynamic>> createShop(Map<String, dynamic> shopData) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/shops'),
        headers: _getHeaders(),
        body: jsonEncode(shopData),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        throw ApiException('Failed to onboard new shop', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Create shop error: $e', 0);
    }
  }

  Future<List<Map<String, dynamic>>> getEligibleInvoicesForShop(int shopId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/returns/eligible-invoices/$shopId'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data);
      } else {
        throw ApiException('Failed to fetch eligible invoices for return', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Get eligible return invoices error: $e', 0);
    }
  }

  Future<Map<String, dynamic>> processReplacementBilling(Map<String, dynamic> payload) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/returns/replacement-billing'),
        headers: _getHeaders(),
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        throw ApiException('Failed to process replacement billing', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Replacement billing error: $e', 0);
    }
  }

  Future<Map<String, dynamic>> submitShopReturn(Map<String, dynamic> returnData) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/returns'),
        headers: _getHeaders(),
        body: jsonEncode(returnData),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        throw ApiException('Failed to process shop return', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Submit shop return error: $e', 0);
    }
  }

  // ============================================================
  // TRIP BETA, LIVE TRUCK INVENTORY & EOD SETTLEMENT
  // ============================================================

  Future<Map<String, dynamic>> getTripBeta(int tripId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/trips/$tripId/beta'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw ApiException('Failed to fetch trip beta', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Get trip beta error: $e', 0);
    }
  }

  Future<Map<String, dynamic>> getTripLiveInventory(int tripId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/trips/$tripId/inventory'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw ApiException('Failed to fetch live truck inventory', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Get live inventory error: $e', 0);
    }
  }

  Future<Map<String, dynamic>> getTripFinancialSummary(int tripId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/trips/$tripId/summary'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw ApiException('Failed to fetch trip financial summary', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Get trip financial summary error: $e', 0);
    }
  }

  Future<Map<String, dynamic>> submitEodSettlement(int tripId, Map<String, dynamic> eodPayload) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/trips/$tripId/eod'),
        headers: _getHeaders(),
        body: jsonEncode(eodPayload),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        throw ApiException('Failed to submit EOD settlement', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Submit EOD settlement error: $e', 0);
    }
  }

  Future<void> logout() async {
    await _clearToken();
  }

  // ─── Route Map & Proximity ─────────────────────────────────────────────────

  Future<Map<String, dynamic>> getTripRoute(int tripId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/trips/$tripId/route'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw ApiException('Failed to fetch trip route', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Get trip route error: $e', 0);
    }
  }

  Future<Map<String, dynamic>> verifyDriverProximity(
    int tripId,
    int shopId,
    double driverLatitude,
    double driverLongitude, {
    double radiusMeters = 200,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/trips/$tripId/verify-proximity?shopId=$shopId'),
        headers: _getHeaders(),
        body: jsonEncode({
          'driverLatitude': driverLatitude,
          'driverLongitude': driverLongitude,
          'radiusMeters': radiusMeters,
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw ApiException('Proximity verification failed', response.statusCode);
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Verify proximity error: $e', 0);
    }
  }

  // ─── Shop Visit Execution ──────────────────────────────────────────────────

  Future<Map<String, dynamic>> checkInShopVisit(
    dynamic tripId,
    dynamic shopVisitId,
    DateTime checkInTime,
    dynamic position,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/trips/$tripId/shop-visits/$shopVisitId/check-in'),
        headers: _getHeaders(),
        body: jsonEncode({
          'checkInTime': checkInTime.toIso8601String(),
          'latitude': position?.latitude,
          'longitude': position?.longitude,
        }),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        return {'status': 'CHECKED_IN', 'id': shopVisitId};
      }
    } catch (e) {
      return {'status': 'CHECKED_IN', 'id': shopVisitId};
    }
  }

  Future<Map<String, dynamic>> completeShopVisit(Map<String, dynamic> visitData) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/trips/${visitData['tripId']}/shop-visits/${visitData['shopVisitId']}/complete'),
        headers: _getHeaders(),
        body: jsonEncode(visitData),
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        return {'status': 'COMPLETED', ...visitData};
      }
    } catch (e) {
      return {'status': 'COMPLETED', ...visitData};
    }
  }

  // ─── Weekly Trip Plan & Shop Visit Mobile APIs ───────────────────────────

  Future<Map<String, dynamic>?> getTodaysTrip(dynamic userId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/weekly-plans/mobile/today?userId=$userId'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map<String, dynamic> && !data.containsKey('message')) {
          return data;
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<List<dynamic>> getWeeklySchedule(dynamic userId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/weekly-plans/mobile/weekly?userId=$userId'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<Map<String, dynamic>> startDailyTrip(dynamic dailyTripId) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/weekly-plans/mobile/daily-trips/$dailyTripId/start'),
      headers: _getHeaders(),
    ).timeout(const Duration(seconds: 10));
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> completeDailyTrip(dynamic dailyTripId) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/weekly-plans/mobile/daily-trips/$dailyTripId/complete'),
      headers: _getHeaders(),
    ).timeout(const Duration(seconds: 10));
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> updateDailyShopVisitStatus(
    dynamic tripShopId,
    String visitStatus, {
    String? notes,
    double? orderAmount,
    double? paymentCollected,
  }) async {
    final response = await http.put(
      Uri.parse('$_baseUrl/weekly-plans/mobile/shops/$tripShopId/status'),
      headers: _getHeaders(),
      body: jsonEncode({
        'visitStatus': visitStatus,
        if (notes != null) 'notes': notes,
        if (orderAmount != null) 'orderAmount': orderAmount,
        if (paymentCollected != null) 'paymentCollected': paymentCollected,
      }),
    ).timeout(const Duration(seconds: 10));
    return jsonDecode(response.body);
  }

  Future<List<dynamic>> getAppNotifications(dynamic userId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/weekly-plans/mobile/notifications?userId=$userId'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<void> markNotificationRead(dynamic notificationId) async {
    try {
      await http.put(
        Uri.parse('$_baseUrl/weekly-plans/mobile/notifications/$notificationId/read'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 5));
    } catch (_) {}
  }
}
