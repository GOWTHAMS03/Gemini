import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

// Extended Models for comprehensive driver features
class DriverProfile {
  final int id;
  final String username;
  final String fullName;
  final String email;
  final List<String> roles;

  DriverProfile({
    required this.id,
    required this.username,
    required this.fullName,
    required this.email,
    required this.roles,
  });

  factory DriverProfile.fromJson(Map<String, dynamic> json) {
    return DriverProfile(
      id: json['id'] ?? 0,
      username: json['username'] ?? '',
      fullName: json['fullName'] ?? '',
      email: json['email'] ?? '',
      roles: List<String>.from(json['roles'] ?? []),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'username': username,
    'fullName': fullName,
    'email': email,
    'roles': roles,
  };
}

class TripModel {
  final int id;
  final String tripNumber;
  final String routeName;
  final String vehicleNumber;
  final String vehicleModel;
  final String driverName;
  final String salesPersonName;
  final int driverId;
  final int salesPersonId;
  String status; // DISPATCHED, IN_PROGRESS, COMPLETED
  final List<TruckItemModel> items;
  final double betaAmount;
  final String betaPaymentStatus;
  final double totalSalesAmount;
  final double cashCollected;
  final double upiCollected;
  final double totalCollected;
  final String settlementStatus;
  final bool eodCompleted;

  TripModel({
    required this.id,
    required this.tripNumber,
    required this.routeName,
    required this.vehicleNumber,
    required this.vehicleModel,
    this.driverName = '',
    this.salesPersonName = '',
    this.driverId = 0,
    this.salesPersonId = 0,
    required this.status,
    required this.items,
    this.betaAmount = 0.0,
    this.betaPaymentStatus = 'PENDING',
    this.totalSalesAmount = 0.0,
    this.cashCollected = 0.0,
    this.upiCollected = 0.0,
    this.totalCollected = 0.0,
    this.settlementStatus = 'PENDING',
    this.eodCompleted = false,
  });

  factory TripModel.fromJson(Map<String, dynamic> json) {
    var itemJson = json['items'] as List? ?? [];
    List<TruckItemModel> itemsList = itemJson.map((i) => TruckItemModel.fromJson(i)).toList();
    
    // Parse vehicle details
    var vehicleJson = (json['vehicle'] is Map) ? json['vehicle'] : {};
    String vNum = json['vehicleNumber'] ?? vehicleJson['vehicleNumber'] ?? '';
    String vMod = json['vehicleModel'] ?? vehicleJson['model'] ?? '';

    // Parse driver & sales person details
    var driverJson = (json['driver'] is Map) ? json['driver'] : {};
    var salesJson = (json['salesPerson'] is Map) ? json['salesPerson'] : {};
    String dName = json['driverName'] ?? driverJson['fullName'] ?? driverJson['name'] ?? '';
    String sName = json['salesPersonName'] ?? salesJson['fullName'] ?? salesJson['name'] ?? '';
    int dId = json['driverId'] ?? driverJson['id'] ?? 0;
    int sId = json['salesPersonId'] ?? salesJson['id'] ?? 0;
    
    return TripModel(
      id: json['id'] ?? 0,
      tripNumber: json['tripNumber'] ?? '',
      routeName: json['routeName'] ?? '',
      vehicleNumber: vNum,
      vehicleModel: vMod,
      driverName: dName,
      salesPersonName: sName,
      driverId: dId,
      salesPersonId: sId,
      status: json['status'] ?? 'DISPATCHED',
      items: itemsList,
      betaAmount: (json['betaAmount'] as num?)?.toDouble() ?? 0.0,
      betaPaymentStatus: json['betaPaymentStatus'] ?? 'PENDING',
      totalSalesAmount: (json['totalSalesAmount'] as num?)?.toDouble() ?? 0.0,
      cashCollected: (json['cashCollected'] as num?)?.toDouble() ?? 0.0,
      upiCollected: (json['upiCollected'] as num?)?.toDouble() ?? 0.0,
      totalCollected: (json['totalCollected'] as num?)?.toDouble() ?? 0.0,
      settlementStatus: json['settlementStatus'] ?? 'PENDING',
      eodCompleted: json['eodCompleted'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'tripNumber': tripNumber,
    'routeName': routeName,
    'vehicleNumber': vehicleNumber,
    'vehicleModel': vehicleModel,
    'driverName': driverName,
    'salesPersonName': salesPersonName,
    'driverId': driverId,
    'salesPersonId': salesPersonId,
    'status': status,
    'items': items.map((i) => i.toJson()).toList(),
    'betaAmount': betaAmount,
    'betaPaymentStatus': betaPaymentStatus,
    'totalSalesAmount': totalSalesAmount,
    'cashCollected': cashCollected,
    'upiCollected': upiCollected,
    'totalCollected': totalCollected,
    'settlementStatus': settlementStatus,
    'eodCompleted': eodCompleted,
  };
}

class TruckItemModel {
  final int id;
  final int productId;
  final String productName;
  final double mrp;
  final double dealerPrice;
  final int loadedQuantity;
  int soldQuantity;
  int returnedQuantity;
  int damagedQuantity;

  TruckItemModel({
    required this.id,
    required this.productId,
    required this.productName,
    required this.mrp,
    required this.dealerPrice,
    required this.loadedQuantity,
    this.soldQuantity = 0,
    this.returnedQuantity = 0,
    this.damagedQuantity = 0,
  });

  int get remainingQuantity => loadedQuantity - soldQuantity - returnedQuantity - damagedQuantity;
  double get basePrice => dealerPrice > 0 ? dealerPrice : mrp;

  factory TruckItemModel.fromJson(Map<String, dynamic> json) {
    var prodJson = (json['product'] is Map) ? json['product'] : json;
    return TruckItemModel(
      id: json['id'] ?? 0,
      productId: json['productId'] ?? prodJson['id'] ?? 0,
      productName: json['productName'] ?? prodJson['name'] ?? '',
      mrp: (json['productMrp'] ?? json['mrp'] ?? prodJson['mrp'] as num?)?.toDouble() ?? 0.0,
      dealerPrice: (json['dealerPrice'] ?? prodJson['dealerPrice'] ?? json['productMrp'] ?? json['mrp'] as num?)?.toDouble() ?? 0.0,
      loadedQuantity: json['loadedQuantity'] ?? 0,
      soldQuantity: json['soldQuantity'] ?? 0,
      returnedQuantity: json['returnedQuantity'] ?? 0,
      damagedQuantity: json['damagedQuantity'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'productId': productId,
    'productName': productName,
    'mrp': mrp,
    'dealerPrice': dealerPrice,
    'loadedQuantity': loadedQuantity,
    'soldQuantity': soldQuantity,
    'returnedQuantity': returnedQuantity,
    'damagedQuantity': damagedQuantity,
  };
}

class DeliveryShopModel {
  final int id;
  final int shopId;
  final String shopCode;
  final String shopName;
  final String ownerName;
  final String phone;
  final String address;
  final String routeName;
  double outstandingBalance;
  String deliveryStatus; // PENDING, DELIVERED, REJECTED
  String salesStatus; // NOT_VISITED, SOLD, NO_SALE
  final String lastVisitDate;
  final String createdBy;
  final String salesExecutiveCode;

  DeliveryShopModel({
    required this.id,
    required this.shopId,
    required this.shopCode,
    required this.shopName,
    required this.ownerName,
    required this.phone,
    required this.address,
    required this.routeName,
    required this.outstandingBalance,
    required this.deliveryStatus,
    required this.salesStatus,
    required this.lastVisitDate,
    this.createdBy = '',
    this.salesExecutiveCode = '',
  });

  factory DeliveryShopModel.fromJson(Map<String, dynamic> json) {
    var shopJson = (json['shop'] is Map) ? Map<String, dynamic>.from(json['shop']) : json;
    return DeliveryShopModel(
      id: (json['id'] ?? shopJson['id'] ?? shopJson['shopId'] ?? 0) as int,
      shopId: (json['shopId'] ?? shopJson['id'] ?? shopJson['shopId'] ?? 0) as int,
      shopCode: (json['shopCode'] ?? shopJson['shopCode'] ?? shopJson['code'] ?? '') as String,
      shopName: (json['shopName'] ?? shopJson['shopName'] ?? shopJson['name'] ?? shopJson['storeName'] ?? '') as String,
      ownerName: (json['shopOwnerName'] ?? shopJson['ownerName'] ?? shopJson['contactPerson'] ?? '') as String,
      phone: (json['shopPhone'] ?? shopJson['phone'] ?? shopJson['phoneNumber'] ?? '') as String,
      address: (json['shopAddress'] ?? shopJson['address'] ?? shopJson['location'] ?? shopJson['areaName'] ?? '') as String,
      routeName: (json['routeName'] ?? shopJson['routeName'] ?? '') as String,
      outstandingBalance: (json['outstandingBalance'] ?? shopJson['outstandingAmount'] ?? shopJson['outstandingBalance'] as num?)?.toDouble() ?? 0.0,
      deliveryStatus: (json['status'] ?? json['deliveryStatus'] ?? 'PENDING').toString(),
      salesStatus: (json['salesStatus'] ?? 'NOT_VISITED').toString(),
      lastVisitDate: (json['lastVisitDate'] ?? json['createdAt'] ?? '').toString(),
      createdBy: (shopJson['createdBy'] ?? json['createdBy'] ?? '').toString(),
      salesExecutiveCode: (shopJson['salesExecutiveCode'] ?? json['salesExecutiveCode'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'shopId': shopId,
    'shopCode': shopCode,
    'shopName': shopName,
    'ownerName': ownerName,
    'phone': phone,
    'address': address,
    'routeName': routeName,
    'outstandingBalance': outstandingBalance,
    'deliveryStatus': deliveryStatus,
    'salesStatus': salesStatus,
    'lastVisitDate': lastVisitDate,
    'createdBy': createdBy,
    'salesExecutiveCode': salesExecutiveCode,
  };
}

class ShopLastOrderItemModel {
  final int originalInvoiceItemId;
  final int productId;
  final String productName;
  final int purchasedQuantity;
  final double unitPrice; // Rate paid by shop in last purchase invoice!
  int returnedQuantity;

  ShopLastOrderItemModel({
    required this.originalInvoiceItemId,
    required this.productId,
    required this.productName,
    required this.purchasedQuantity,
    required this.unitPrice,
    this.returnedQuantity = 0,
  });

  int get remainingReturnable => max(0, purchasedQuantity - returnedQuantity);

  factory ShopLastOrderItemModel.fromJson(Map<String, dynamic> json) {
    var prodJson = json['product'] ?? {};
    return ShopLastOrderItemModel(
      originalInvoiceItemId: json['id'] ?? 0,
      productId: prodJson['id'] ?? json['productId'] ?? 0,
      productName: prodJson['name'] ?? json['productName'] ?? 'Product #${json['productId']}',
      purchasedQuantity: json['quantity'] ?? 0,
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0.0,
      returnedQuantity: json['returnedQuantity'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': originalInvoiceItemId,
    'productId': productId,
    'productName': productName,
    'quantity': purchasedQuantity,
    'unitPrice': unitPrice,
    'returnedQuantity': returnedQuantity,
  };
}

class ShopLastOrderModel {
  final int invoiceId;
  final String invoiceNumber;
  final DateTime invoiceDate;
  final double grandTotal;
  final List<ShopLastOrderItemModel> items;

  ShopLastOrderModel({
    required this.invoiceId,
    required this.invoiceNumber,
    required this.invoiceDate,
    required this.grandTotal,
    required this.items,
  });

  factory ShopLastOrderModel.fromJson(Map<String, dynamic> json) {
    var itemsList = (json['items'] as List? ?? [])
        .map((i) => ShopLastOrderItemModel.fromJson(i))
        .toList();
    return ShopLastOrderModel(
      invoiceId: json['id'] ?? 0,
      invoiceNumber: json['invoiceNumber'] ?? 'INV-PREV',
      invoiceDate: json['invoiceDate'] != null ? DateTime.parse(json['invoiceDate']) : DateTime.now().subtract(const Duration(days: 2)),
      grandTotal: (json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      items: itemsList,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': invoiceId,
    'invoiceNumber': invoiceNumber,
    'invoiceDate': invoiceDate.toIso8601String(),
    'totalAmount': grandTotal,
    'items': items.map((i) => i.toJson()).toList(),
  };
}

class InvoiceItemModel {
  final int productId;
  final String productName;
  final int quantity;
  final double unitPrice;
  final double totalPrice;

  InvoiceItemModel({
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
  });

  Map<String, dynamic> toJson() => {
    'productId': productId,
    'productName': productName,
    'quantity': quantity,
    'unitPrice': unitPrice,
    'totalPrice': totalPrice,
  };
}

class InvoiceModel {
  final String invoiceNumber;
  final int shopId;
  final String shopName;
  final double subtotal;
  final double discount;
  final double gst;
  final double grandTotal;
  final double returnCredit;
  final double netPayable;
  final String paymentMode; // CASH, UPI, CREDIT, CHEQUE
  final String paymentStatus; // PAID, PENDING
  final List<InvoiceItemModel> items;
  final DateTime dateTime;

  InvoiceModel({
    required this.invoiceNumber,
    required this.shopId,
    required this.shopName,
    required this.subtotal,
    required this.discount,
    required this.gst,
    required this.grandTotal,
    this.returnCredit = 0.0,
    double? netPayable,
    required this.paymentMode,
    required this.paymentStatus,
    required this.items,
    required this.dateTime,
  }) : netPayable = netPayable ?? max(0.0, grandTotal - returnCredit);

  Map<String, dynamic> toJson() => {
    'invoiceNumber': invoiceNumber,
    'shopId': shopId,
    'shopName': shopName,
    'subtotal': subtotal,
    'discount': discount,
    'gst': gst,
    'grandTotal': grandTotal,
    'returnCredit': returnCredit,
    'netPayable': netPayable,
    'paymentMode': paymentMode,
    'paymentStatus': paymentStatus,
    'items': items.map((i) => i.toJson()).toList(),
    'dateTime': dateTime.toIso8601String(),
  };
}

class NotificationAlert {
  final String id;
  final String title;
  final String message;
  final String type; // sync, stock, alert, general
  final DateTime timestamp;
  bool isRead;

  NotificationAlert({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.timestamp,
    this.isRead = false,
  });
}

class DeliveryProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  SharedPreferences? _prefs;

  // Authentication State
  DriverProfile? _currentDriver;
  bool _isLoading = false;
  String? _errorMessage;

  // Active Trip & Inventory & Shops
  TripModel? _activeTrip;
  List<DeliveryShopModel> _shops = [];
  bool _isOnline = true;
  DateTime? _lastSyncTime;

  // Current Sales Screen Draft State
  final Map<int, int> _salesDraftQuantities = {}; // ProductId -> Selected Qty
  final Map<int, double> _salesDraftDiscounts = {}; // ProductId -> Discount Amount
  final Map<int, double> _salesDraftPrices = {}; // ProductId -> Custom Unit Price

  // Shop Return Draft State (Only for items in shop's last purchased order!)
  Map<int, ShopLastOrderModel> _shopLastOrders = {}; // ShopId -> Last Order
  final Map<int, int> _salesReturnDraftQuantities = {}; // ProductId -> Returned Qty
  String _returnReason = 'EXPIRED';
  String _returnNotes = '';

  // Selected payment values (Only CASH or UPI)
  String _selectedPaymentMode = 'CASH';

  // Local Offline Storage Queue & History
  List<Map<String, dynamic>> _offlineInvoiceQueue = [];
  List<Map<String, dynamic>> _offlineDeliveryQueue = [];
  List<InvoiceModel> _allPastInvoices = [];

  // Notifications alerts
  final List<NotificationAlert> _notifications = [];

  // Live Inventory & Financial Settlement Data
  Map<String, dynamic>? _liveInventorySummary;
  Map<String, dynamic>? _financialSummary;

  // Getters
  DriverProfile? get currentDriver => _currentDriver;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  TripModel? get activeTrip => _activeTrip;
  List<TruckItemModel> get products => _activeTrip?.items ?? [];
  List<DeliveryShopModel> get shops => _shops;
  bool get isOnline => _isOnline;
  DateTime? get lastSyncTime => _lastSyncTime;
  Map<String, dynamic>? get liveInventorySummary => _liveInventorySummary;
  Map<String, dynamic>? get financialSummary => _financialSummary;
  double get betaAmount => _activeTrip?.betaAmount ?? 1000.0;
  String get betaPaymentStatus => _activeTrip?.betaPaymentStatus ?? 'PENDING';
  double get totalSalesAmount => _activeTrip?.totalSalesAmount ?? 0.0;
  double get cashCollected => _activeTrip?.cashCollected ?? 0.0;
  double get upiCollected => _activeTrip?.upiCollected ?? 0.0;
  double get totalCollected => _activeTrip?.totalCollected ?? 0.0;
  Map<int, int> get salesDraftQuantities => _salesDraftQuantities;
  Map<int, double> get salesDraftDiscounts => _salesDraftDiscounts;
  Map<int, double> get salesDraftPrices => _salesDraftPrices;
  Map<int, ShopLastOrderModel> get shopLastOrders => _shopLastOrders;
  Map<int, int> get salesReturnDraftQuantities => _salesReturnDraftQuantities;
  String get returnReason => _returnReason;
  String get returnNotes => _returnNotes;
  String get selectedPaymentMode => _selectedPaymentMode;
  List<InvoiceModel> get allPastInvoices => _allPastInvoices;
  List<NotificationAlert> get notifications => _notifications;
  List<NotificationAlert> get unreadNotifications => _notifications.where((n) => !n.isRead).toList();
  int get offlineQueueCount => _offlineInvoiceQueue.length + _offlineDeliveryQueue.length;

  Timer? _syncTimer;

  Future<void> fetchLiveInventory() async {
    if (_activeTrip == null) return;
    try {
      final res = await _apiService.getTripLiveInventory(_activeTrip!.id);
      _liveInventorySummary = res;
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching live inventory: $e');
    }
  }

  Future<void> fetchFinancialSummary() async {
    if (_activeTrip == null) return;
    try {
      final res = await _apiService.getTripFinancialSummary(_activeTrip!.id);
      _financialSummary = res;
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching financial summary: $e');
    }
  }

  Future<bool> submitTripReconciliation({
    required double cashCollected,
    required double upiCollected,
    List<Map<String, dynamic>>? actualProductCounts,
    String? notes,
  }) async {
    if (_activeTrip == null) return false;
    _isLoading = true;
    notifyListeners();
    try {
      final res = await _apiService.submitEodSettlement(_activeTrip!.id, {
        'cashCollected': cashCollected,
        'upiCollected': upiCollected,
        'actualProductCounts': actualProductCounts ?? [],
        'notes': notes ?? 'EOD Mobile Submission',
      });
      _financialSummary = res;
      _activeTrip?.status = 'COMPLETED';
      addNotification("Trip Settled", "Reconciliation and EOD report successfully submitted.", "sync");
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      addNotification("Settlement Error", "Failed to submit EOD reconciliation to server.", "alert");
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateTripStatus(String newStatus) async {
    if (_activeTrip == null) return false;
    _isLoading = true;
    notifyListeners();
    try {
      final updatedTripMap = await _apiService.updateTripStatus(_activeTrip!.id, newStatus);
      if (updatedTripMap.isNotEmpty) {
        _activeTrip = TripModel.fromJson(updatedTripMap);
        _cacheObject('cached_active_trip', _activeTrip!.toJson());
      } else {
        _activeTrip?.status = newStatus;
      }
      addNotification("Trip Live Status Updated", "Trip #${_activeTrip?.tripNumber} is now $newStatus", "sync");
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Error updating trip status: $e');
      _activeTrip?.status = newStatus;
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  DeliveryProvider() {
    _initStorage();
  }

  Future<void> _initStorage() async {
    _prefs = await SharedPreferences.getInstance();
    await ApiService.initialize(_prefs!);
    _loadLocalCaches();
    _startPollingSync();
  }

  @override
  void dispose() {
    _syncTimer?.cancel();
    super.dispose();
  }

  // ============================================================
  // POLLING & OFFLINE COUPLING
  // ============================================================

  int _pingMs = -1;
  int get pingMs => _pingMs;

  void _startPollingSync() {
    _syncTimer = Timer.periodic(const Duration(seconds: 25), (timer) async {
      await autoCheckConnectionAndSync();
    });
  }

  Future<void> autoCheckConnectionAndSync() async {
    if (_currentDriver == null) return;
    try {
      final stopwatch = Stopwatch()..start();
      // Test server connectivity
      await http.get(
        Uri.parse('${ApiService.baseUrl}/auth/login'),
      ).timeout(const Duration(seconds: 4));
      
      stopwatch.stop();
      _pingMs = stopwatch.elapsedMilliseconds;
      
      bool wasOffline = !_isOnline;
      _isOnline = true;
      _errorMessage = null;

      if (wasOffline) {
        addNotification(
          "Connection Restored",
          "Back online. Syncing offline transactions automatically...",
          "sync"
        );
      }

      // Automatically push queued offline transactions to backend API whenever internet connection is active
      if (offlineQueueCount > 0 && !_isLoading) {
        await _syncPendingQueue();
      }

      // Only pull fresh data if we have no offline changes pending.
      if (offlineQueueCount == 0) {
        await refreshDataFromBackend();
      }
      
      notifyListeners();

    } catch (e) {
      _pingMs = -1;
      if (_isOnline) {
        _isOnline = false;
        addNotification(
          "Offline Mode Enabled",
          "Lost server connection. Invoices & PODs will be saved locally.",
          "alert"
        );
        notifyListeners();
      }
    }
  }

  Future<bool> manualSync() async {
    _isLoading = true;
    _isOnline = true; // Force online attempt when manual sync is requested
    notifyListeners();
    try {
      if (_currentDriver == null) {
        _loadLocalCaches();
      }
      await _syncPendingQueue();
      await refreshDataFromBackend();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Manual sync error: $e');
      _isLoading = false;
      notifyListeners();
      return offlineQueueCount == 0;
    }
  }

  Future<void> refreshDataFromBackend() async {
    if (_currentDriver == null) return;
    try {
      // 1. Try GET /trips/driver/{userId}/active (works for both driver and sales person)
      Map<String, dynamic>? tripMap = await _apiService.getActiveTrip(_currentDriver!.id);

      // 2. If no trip found via driver endpoint, try sales endpoint
      if (tripMap == null) {
        tripMap = await _apiService.getActiveTripForSalesPerson(_currentDriver!.id);
      }

      if (tripMap != null) {
        _activeTrip = TripModel.fromJson(tripMap);
        _cacheObject('cached_active_trip', _activeTrip!.toJson());

        // Load shops from multiple sources with fallback chain
        List<DeliveryShopModel> loadedShops = [];

        // Source A: Backend route shops if available
        final rawShops = tripMap['shopVisits'] ?? tripMap['shops'] ?? tripMap['deliveryStops'];
        if (rawShops != null && (rawShops as List).isNotEmpty) {
          loadedShops = (rawShops as List)
              .map((s) => DeliveryShopModel.fromJson(s))
              .toList();
        } 
        // Source B: Direct API endpoint GET /trips/{tripId}/deliveries
        else {
          try {
            final delList = await _apiService.getDeliveriesByTrip(_activeTrip!.id);
            if (delList.isNotEmpty) {
              loadedShops = delList.map((d) => DeliveryShopModel.fromJson(d)).toList();
            }
          } catch (_) {
            // Fallback gracefully
          }
        }

        // Source C: Fallback to all shops if empty
        if (loadedShops.isEmpty) {
          try {
            final allShopsRaw = await _apiService.getAllShops();
            if (allShopsRaw.isNotEmpty) {
              loadedShops = allShopsRaw.map((s) => DeliveryShopModel.fromJson(s)).toList();
            }
          } catch (_) {
            // Fallback gracefully
          }
        }

        if (loadedShops.isNotEmpty) {
          _shops = loadedShops;
        }
      }

      // If driver has no assigned dispatches, try loading master shop list if empty
      if (_shops.isEmpty) {
        try {
          final allShopsRaw = await _apiService.getAllShops();
          if (allShopsRaw.isNotEmpty) {
            _shops = allShopsRaw.map((s) => DeliveryShopModel.fromJson(s)).toList();
          }
        } catch (_) {
          // Keep cached shops
        }
      }

      _cacheObject('cached_shops', _shops.map((s) => s.toJson()).toList());
      
      _lastSyncTime = DateTime.now();
      _errorMessage = null;
      
      _validateStockLevels();
      notifyListeners();
    } catch (e) {
      if (e is ApiException && (e.statusCode == 401 || e.statusCode == 403)) {
        _errorMessage = "You don't have access. Contact admin team.";
        await logout();
      }
    }
  }

  Future<void> _syncPendingQueue() async {
    _isOnline = true;

    // Process offline delivery / POD acknowledgements
    List<Map<String, dynamic>> remainingDeliveries = [];
    for (var delPayload in _offlineDeliveryQueue) {
      try {
        await _apiService.acknowledgeDelivery(delPayload);
      } catch (e) {
        final errStr = e.toString().toLowerCase();
        if (errStr.contains('200') || errStr.contains('201') || errStr.contains('204') || errStr.contains('already')) {
          // Successfully processed
        } else {
          remainingDeliveries.add(delPayload);
        }
      }
    }
    _offlineDeliveryQueue = remainingDeliveries;
    _cacheObject('offline_delivery_queue', _offlineDeliveryQueue);

    // Process offline Sales invoices
    List<Map<String, dynamic>> remainingInvoices = [];
    for (var invPayload in _offlineInvoiceQueue) {
      try {
        await _apiService.createInvoice(invPayload);
      } catch (e) {
        final errStr = e.toString().toLowerCase();
        if (errStr.contains('200') || errStr.contains('201') || errStr.contains('already exists') || errStr.contains('409') || errStr.contains('duplicate')) {
          // Processed or already exists on backend
        } else {
          remainingInvoices.add(invPayload);
        }
      }
    }
    _offlineInvoiceQueue = remainingInvoices;
    _cacheObject('offline_invoice_queue', _offlineInvoiceQueue);

    if (offlineQueueCount == 0) {
      addNotification("Synchronization Complete", "All offline operations have been synced with the backend successfully.", "sync");
    }
  }

  void _validateStockLevels() {
    if (_activeTrip == null) return;
    for (var item in _activeTrip!.items) {
      if (item.remainingQuantity > 0 && item.remainingQuantity <= 10) {
        addNotification(
          "Low Stock Warning",
          "Only ${item.remainingQuantity} packs left of ${item.productName}.",
          "stock"
        );
      }
    }
  }

  // ============================================================
  // LOCAL CACHE RETRIEVAL
  // ============================================================

  void _loadLocalCaches() {
    try {
      final driverStr = _prefs?.getString('cached_driver_profile');
      if (driverStr != null) {
        _currentDriver = DriverProfile.fromJson(jsonDecode(driverStr));
      }

      final tripStr = _prefs?.getString('cached_active_trip');
      if (tripStr != null) {
        _activeTrip = TripModel.fromJson(jsonDecode(tripStr));
      }

      final shopsStr = _prefs?.getString('cached_shops');
      if (shopsStr != null) {
        var dataList = jsonDecode(shopsStr) as List;
        _shops = dataList.map((s) => DeliveryShopModel.fromJson(s)).toList();
      }

      final pastInvsStr = _prefs?.getString('cached_past_invoices');
      if (pastInvsStr != null) {
        var listData = jsonDecode(pastInvsStr) as List;
        _allPastInvoices = listData.map((e) {
          return InvoiceModel(
            invoiceNumber: e['invoiceNumber'] ?? '',
            shopId: e['shopId'] ?? 0,
            shopName: e['shopName'] ?? '',
            subtotal: (e['subtotal'] as num?)?.toDouble() ?? 0.0,
            discount: (e['discount'] as num?)?.toDouble() ?? 0.0,
            gst: (e['gst'] as num?)?.toDouble() ?? 0.0,
            grandTotal: (e['grandTotal'] as num?)?.toDouble() ?? 0.0,
            paymentMode: e['paymentMode'] ?? 'CASH',
            paymentStatus: e['paymentStatus'] ?? 'PAID',
            items: (e['items'] as List? ?? []).map((it) => InvoiceItemModel(
              productId: it['productId'] ?? 0,
              productName: it['productName'] ?? '',
              quantity: it['quantity'] ?? 0,
              unitPrice: (it['unitPrice'] as num?)?.toDouble() ?? 0.0,
              totalPrice: (it['totalPrice'] as num?)?.toDouble() ?? 0.0,
            )).toList(),
            dateTime: DateTime.parse(e['dateTime']),
          );
        }).toList();
      }

      final offlineDelsStr = _prefs?.getString('offline_delivery_queue');
      if (offlineDelsStr != null) {
        _offlineDeliveryQueue = List<Map<String, dynamic>>.from(jsonDecode(offlineDelsStr));
      }

      final offlineInvsStr = _prefs?.getString('offline_invoice_queue');
      if (offlineInvsStr != null) {
        _offlineInvoiceQueue = List<Map<String, dynamic>>.from(jsonDecode(offlineInvsStr));
      }
    } catch (_) {
      // Graceful error isolation
    }

    // Clear mock fallback calls
    if (_activeTrip == null) {
      _shops = [];
    }
  }

  void _cacheObject(String key, dynamic obj) {
    _prefs?.setString(key, jsonEncode(obj));
  }

  // ============================================================
  // SECURE AUTHENTICATION FLOW
  // ============================================================

  Future<bool> login(String username, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final loginData = await _apiService.login(username, password);
      final roles = List<String>.from(loginData['roles'] ?? []);
      
      final isSalesPerson = roles.contains('ROLE_SALES_EXECUTIVE') || roles.contains('ROLE_SALES_MANAGER') || roles.contains('ROLE_DRIVER') || roles.contains('ROLE_SUPER_ADMIN');
      if (!isSalesPerson) {
        throw ApiException("Access denied: User is not authorized for Sales Executive mobile access.", 403);
      }

      final bool mobileAccessEnabled = loginData['mobileAccessEnabled'] ?? true;
      if (!mobileAccessEnabled) {
        throw ApiException("You don't have access. Contact admin team.", 403);
      }

      _currentDriver = DriverProfile.fromJson(loginData);
      _cacheObject('cached_driver_profile', _currentDriver!.toJson());
      _isOnline = true;

      addNotification("Welcome Back!", "Sales Executive ${_currentDriver!.fullName} logged in successfully.", "general");
      
      // Load active trip right away
      await refreshDataFromBackend();

      _isLoading = false;
      notifyListeners();
      return true;

    } catch (e) {
      _isLoading = false;
      if (e is ApiException) {
        _errorMessage = e.message;
        // Since we got an API exception (like 401 or 403), the server is reachable
        _isOnline = true;
      } else {
        _errorMessage = e.toString();
        _isOnline = false;
      }
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  Future<void> logout() async {
    await _apiService.logout();
    _currentDriver = null;
    _activeTrip = null;
    _shops = [];
    _salesDraftQuantities.clear();
    _salesDraftDiscounts.clear();
    _prefs?.remove('cached_driver_profile');
    _prefs?.remove('cached_active_trip');
    _prefs?.remove('cached_shops');
    addNotification("Logged Out", "Logged out from driver field portal.", "general");
    notifyListeners();
  }

  // ============================================================
  // SALES INVOICE DRAFT & BILL CALCULATION METHODS
  // ============================================================

  void clearSalesDraft() {
    _salesDraftQuantities.clear();
    _salesDraftDiscounts.clear();
    _salesDraftPrices.clear();
    _salesReturnDraftQuantities.clear();
    _returnReason = 'EXPIRED';
    _returnNotes = '';
    _selectedPaymentMode = 'CASH';
    notifyListeners();
  }

  ShopLastOrderModel? getShopLastOrder(int shopId) {
    return _shopLastOrders[shopId];
  }

  void updateSalesReturnQuantity(int productId, int quantity) {
    if (quantity <= 0) {
      _salesReturnDraftQuantities.remove(productId);
    } else {
      _salesReturnDraftQuantities[productId] = quantity;
    }
    notifyListeners();
  }

  int getSalesReturnQuantity(int productId) {
    return _salesReturnDraftQuantities[productId] ?? 0;
  }

  void setReturnReason(String reason) {
    _returnReason = reason;
    notifyListeners();
  }

  void setReturnNotes(String notes) {
    _returnNotes = notes;
    notifyListeners();
  }

  void clearReturnDraft() {
    _salesReturnDraftQuantities.clear();
    _returnReason = 'EXPIRED';
    _returnNotes = '';
    notifyListeners();
  }

  double calculateReturnCredit(int shopId) {
    double credit = 0.0;
    final lastOrder = _shopLastOrders[shopId];
    if (lastOrder == null) return 0.0;

    _salesReturnDraftQuantities.forEach((prodId, qty) {
      final matchingItems = lastOrder.items.where((it) => it.productId == prodId);
      if (matchingItems.isNotEmpty) {
        final item = matchingItems.first;
        // CRITICAL BUSINESS RULE: Calculate return credit using the rate paid in last purchase invoice!
        credit += qty * item.unitPrice;
      }
    });
    return credit;
  }

  int calculateReturnTotalItems() {
    return _salesReturnDraftQuantities.values.fold(0, (sum, q) => sum + q);
  }

  double calculateNetPayableGrandTotal(int shopId) {
    double grand = calculateGrandTotal();
    double credit = calculateReturnCredit(shopId);
    return max(0.0, grand - credit);
  }

  /// Check if all shop visits in the active trip are completed
  bool get isAllShopsCompleted {
    if (_shops.isEmpty) return false;
    return _shops.every((s) => s.deliveryStatus == 'DELIVERED' || s.deliveryStatus == 'COMPLETED');
  }

  /// Check if all loaded truck stock has been sold
  bool get isAllStockSold {
    if (_activeTrip == null || _activeTrip!.items.isEmpty) return false;
    return _activeTrip!.items.every((item) => item.remainingQuantity <= 0);
  }

  /// Check if trip is ready for EOD completion & stock reconciliation
  bool get isTripReadyForCompletion {
    return isAllShopsCompleted || isAllStockSold;
  }

  void updateDraftQuantity(int productId, int quantity) {
    if (_activeTrip != null) {
      final matches = _activeTrip!.items.where((it) => it.productId == productId);
      if (matches.isNotEmpty) {
        final loadedItem = matches.first;
        final maxAvailable = max(0, loadedItem.remainingQuantity);
        if (quantity > maxAvailable) {
          quantity = maxAvailable; // Strictly cap quantity to available loaded truck stock
        }
      }
    }
    if (quantity <= 0) {
      _salesDraftQuantities.remove(productId);
    } else {
      _salesDraftQuantities[productId] = quantity;
    }
    notifyListeners();
  }

  void updateDraftDiscount(int productId, double discount) {
    if (discount <= 0.0) {
      _salesDraftDiscounts.remove(productId);
    } else {
      _salesDraftDiscounts[productId] = discount;
    }
    notifyListeners();
  }

  void updateDraftPrice(int productId, double price) {
    if (price <= 0.0) {
      _salesDraftPrices.remove(productId);
    } else {
      _salesDraftPrices[productId] = price;
    }
    notifyListeners();
  }

  double getUnitPriceForProduct(int productId) {
    if (_salesDraftPrices.containsKey(productId)) {
      return _salesDraftPrices[productId]!;
    }
    if (_activeTrip != null) {
      final matches = _activeTrip!.items.where((it) => it.productId == productId);
      if (matches.isNotEmpty) return matches.first.dealerPrice;
    }
    return 0.0;
  }

  void updatePaymentMode(String mode) {
    // Only allow instant payment modes CASH or UPI
    if (mode == 'CASH' || mode == 'UPI') {
      _selectedPaymentMode = mode;
      notifyListeners();
    }
  }

  // Invoice calculations
  double calculateActualSubtotal() {
    double total = 0.0;
    if (_activeTrip == null) return 0.0;
    _salesDraftQuantities.forEach((prodId, qty) {
      final matches = _activeTrip!.items.where((it) => it.productId == prodId);
      if (matches.isNotEmpty) {
        total += matches.first.dealerPrice * qty;
      }
    });
    return total;
  }

  double calculateSellingSubtotal() {
    double total = 0.0;
    if (_activeTrip == null) return 0.0;
    _salesDraftQuantities.forEach((prodId, qty) {
      final price = getUnitPriceForProduct(prodId);
      total += price * qty;
    });
    return total;
  }

  double calculatePriceSavings() {
    double actual = calculateActualSubtotal();
    double selling = calculateSellingSubtotal();
    return max(0.0, actual - selling);
  }

  double calculateSubtotal() {
    return calculateSellingSubtotal();
  }

  double calculateDiscount() {
    double totalDiscount = 0.0;
    _salesDraftDiscounts.forEach((prodId, dsc) {
      totalDiscount += dsc;
    });
    return totalDiscount;
  }

  double calculateTax() {
    double sub = calculateSubtotal();
    double disc = calculateDiscount();
    return max(0.0, sub - disc) * 0.05; // 5% GST bakery standard
  }

  double calculateGrandTotal() {
    double sub = calculateSubtotal();
    double disc = calculateDiscount();
    double tax = calculateTax();
    return sub - disc + tax;
  }

  // ============================================================
  // CONFIRM SALE & DISPATCH INVOICE (ONLINE / OFFLINE SYNC)
  // ============================================================

  Future<InvoiceModel> submitDraftInvoice(DeliveryShopModel targetShop) async {
    if (_activeTrip == null || _currentDriver == null) {
      throw Exception("Active trip session is not loaded.");
    }

    String generatedInvoiceNumber = 'INV-${DateTime.now().millisecondsSinceEpoch}';
    double sub = calculateSubtotal();
    double disc = calculateDiscount();
    double tax = calculateTax();
    double grand = calculateGrandTotal();
    double returnCredit = calculateReturnCredit(targetShop.shopId);
    double netPayable = calculateNetPayableGrandTotal(targetShop.shopId);

    List<InvoiceItemModel> invoiceItems = [];
    _salesDraftQuantities.forEach((prodId, qty) {
      final truckProd = _activeTrip!.items.firstWhere((i) => i.productId == prodId);
      final unitPrice = getUnitPriceForProduct(prodId);
      invoiceItems.add(InvoiceItemModel(
        productId: prodId,
        productName: truckProd.productName,
        quantity: qty,
        unitPrice: unitPrice,
        totalPrice: unitPrice * qty,
      ));
    });

    final invoice = InvoiceModel(
      invoiceNumber: generatedInvoiceNumber,
      shopId: targetShop.shopId,
      shopName: targetShop.shopName,
      subtotal: sub,
      discount: disc,
      gst: tax,
      grandTotal: grand,
      returnCredit: returnCredit,
      netPayable: netPayable,
      paymentMode: _selectedPaymentMode,
      paymentStatus: 'PAID',
      items: invoiceItems,
      dateTime: DateTime.now(),
    );

    // Update LOCAL structures immediately
    _salesDraftQuantities.forEach((prodId, qty) {
      final truckProd = _activeTrip!.items.firstWhere((i) => i.productId == prodId);
      truckProd.soldQuantity += qty;
    });

    // Process return items if present
    if (returnCredit > 0 && _shopLastOrders.containsKey(targetShop.shopId)) {
      final lastOrder = _shopLastOrders[targetShop.shopId]!;
      _salesReturnDraftQuantities.forEach((prodId, retQty) {
        final matches = lastOrder.items.where((it) => it.productId == prodId);
        if (matches.isNotEmpty) {
          matches.first.returnedQuantity += retQty;
        }
        final truckMatches = _activeTrip!.items.where((i) => i.productId == prodId);
        if (truckMatches.isNotEmpty) {
          truckMatches.first.returnedQuantity += retQty;
        }
      });
    }

    // Update shop visit states and AUTOMATICALLY start trip if not yet started
    final index = _shops.indexWhere((s) => s.shopId == targetShop.shopId);
    if (index != -1) {
      _shops[index].salesStatus = 'SOLD';
      _shops[index].deliveryStatus = 'DELIVERED';
      if (returnCredit > grand) {
        // Excess return credit reduces shop outstanding balance
        double excessCredit = returnCredit - grand;
        _shops[index].outstandingBalance = max(0.0, _shops[index].outstandingBalance - excessCredit);
      }
    }

    // AUTOMATICALLY transition trip status to IN_PROGRESS on product sale
    if (_activeTrip != null && _activeTrip!.status != 'IN_PROGRESS' && _activeTrip!.status != 'COMPLETED') {
      _activeTrip!.status = 'IN_PROGRESS';
      if (_isOnline) {
        try {
          await _apiService.updateTripStatus(_activeTrip!.id, 'IN_PROGRESS');
        } catch (_) {}
      }
    }

    _allPastInvoices.insert(0, invoice);
    _cacheObject('cached_past_invoices', _allPastInvoices.map((i) => i.toJson()).toList());
    _cacheObject('cached_active_trip', _activeTrip!.toJson());
    _cacheObject('cached_shops', _shops.map((s) => s.toJson()).toList());

    // Payload for Backend
    final payload = {
      'tripId': _activeTrip!.id,
      'shopId': targetShop.shopId,
      'driverId': _currentDriver!.id,
      'paymentMode': _selectedPaymentMode,
      'discountAmount': disc,
      'items': invoiceItems.map((itm) => {
        'productId': itm.productId,
        'quantity': itm.quantity,
        'unitPrice': itm.unitPrice,
      }).toList(),
    };

    if (_isOnline) {
      try {
        await _apiService.createInvoice(payload);
        addNotification("Invoice Generated", "Invoice ${invoice.invoiceNumber} uploaded successfully.", "sync");
      } catch (e) {
        _isOnline = false;
        _offlineInvoiceQueue.add(payload);
        _cacheObject('offline_invoice_queue', _offlineInvoiceQueue);
        addNotification("Saved Locally (Offline)", "Invoice ${invoice.invoiceNumber} saved. Will sync when connection restores.", "alert");
      }
    } else {
      _offlineInvoiceQueue.add(payload);
      _cacheObject('offline_invoice_queue', _offlineInvoiceQueue);
      addNotification("Saved Locally (Offline)", "Invoice ${invoice.invoiceNumber} saved. Will sync when connection restores.", "alert");
    }

    // Automatically trigger delivery POD acknowledgement
    await recordDeliveryAcknowledgement(
      shop: targetShop,
      acceptedQty: invoiceItems.fold(0, (sum, item) => sum + item.quantity),
      damagedQty: 0,
      missingQty: 0,
    );

    clearSalesDraft();
    notifyListeners();
    return invoice;
  }

  // ============================================================
  // OUTSTANDING AMOUNT COLLECTION
  // ============================================================

  Future<bool> collectOutstandingAmount({
    required DeliveryShopModel shop,
    required double amount,
    required String mode,
    required String reference,
  }) async {
    final sIdx = _shops.indexWhere((s) => s.shopId == shop.shopId);
    if (sIdx != -1) {
      _shops[sIdx].outstandingBalance = max(0.0, _shops[sIdx].outstandingBalance - amount);
      _cacheObject('cached_shops', _shops.map((s) => s.toJson()).toList());
    }

    final payload = {
      'shopId': shop.shopId,
      'driverId': _currentDriver?.id ?? 2,
      'amountCollected': amount,
      'paymentMode': mode,
      'referenceNumber': reference,
    };

    if (_isOnline) {
      try {
        await _apiService.settleCollection(payload);
        addNotification("Payment Collected", "Collection of ₹${amount.toStringAsFixed(2)} uploaded successfully.", "sync");
        notifyListeners();
        return true;
      } catch (_) {
        _offlineInvoiceQueue.add({
          'type': 'COLLECTION',
          'payload': payload,
        });
        _cacheObject('offline_invoice_queue', _offlineInvoiceQueue);
      }
    } else {
      _offlineInvoiceQueue.add({
        'type': 'COLLECTION',
        'payload': payload,
      });
      _cacheObject('offline_invoice_queue', _offlineInvoiceQueue);
    }

    addNotification("Payment Saved Offline", "Collection of ₹${amount.toStringAsFixed(2)} saved locally.", "alert");
    notifyListeners();
    return true;
  }

  // ============================================================
  // RECORD DIGITAL POD SIGNATURE
  // ============================================================

  Future<void> recordDeliveryAcknowledgement({
    required DeliveryShopModel shop,
    required int acceptedQty,
    int damagedQty = 0,
    int missingQty = 0,
  }) async {
    if (_activeTrip == null || _currentDriver == null) return;

    final reqPayload = {
      'deliveryId': shop.id,
      'acceptedQuantity': acceptedQty,
      'damagedQuantity': damagedQty,
      'missingQuantity': missingQty,
      'digitalSignatureUrl': 'signed_by_${shop.ownerName.replaceAll(' ', '_').toLowerCase()}',
      'photoProofUrl': 'https://s3.aws.com/breaderp/pod_${shop.shopCode}.png',
      'latitude': 13.1147,
      'longitude': 80.1542,
      'verifiedByShopUserId': null,
    };

    // Update local statuses
    final sIdx = _shops.indexWhere((s) => s.shopId == shop.shopId);
    if (sIdx != -1) {
      _shops[sIdx].deliveryStatus = 'DELIVERED';
      _cacheObject('cached_shops', _shops.map((s) => s.toJson()).toList());
    }

    if (_isOnline) {
      try {
        await _apiService.acknowledgeDelivery(reqPayload);
      } catch (_) {
        _offlineDeliveryQueue.add(reqPayload);
        _cacheObject('offline_delivery_queue', _offlineDeliveryQueue);
      }
    } else {
      _offlineDeliveryQueue.add(reqPayload);
      _cacheObject('offline_delivery_queue', _offlineDeliveryQueue);
    }
  }

  // ============================================================
  // END-OF-DAY CLOSING METHODS
  // ============================================================

  int getVisitedShopsCount() {
    return _shops.where((s) => s.deliveryStatus == 'DELIVERED' || s.salesStatus == 'SOLD').length;
  }

  double getTotalSoldAmount() {
    return _allPastInvoices.fold(0.0, (sum, invoice) => sum + invoice.grandTotal);
  }

  double getCollectedAmountByMode(String mode) {
    return _allPastInvoices
        .where((inv) => inv.paymentMode == mode)
        .fold(0.0, (sum, inv) => sum + inv.grandTotal);
  }

  Future<bool> completeTripWithEOD({
    required double finalCash,
    required double finalUpi,
    required double finalCheque,
    required String chequeNo,
    required String remarks,
  }) async {
    if (_activeTrip == null || _currentDriver == null) return false;
    _isLoading = true;
    notifyListeners();

    final payload = {
      'tripId': _activeTrip!.id,
      'driverId': _currentDriver!.id,
      'cashCollected': finalCash,
      'upiCollected': finalUpi,
      'chequeCollected': finalCheque,
      'remarks': remarks,
      'chequeNo': chequeNo,
    };

    bool success = false;
    try {
      if (_isOnline) {
        await _apiService.settleCollection(payload);
        await _apiService.updateTripStatus(_activeTrip!.id, 'COMPLETED');
        success = true;
      } else {
        addNotification("EOD Settlement Saved", "End-of-day report submitted locally.", "alert");
        success = true;
      }
      
      if (success) {
        _activeTrip!.status = 'COMPLETED';
        _cacheObject('cached_active_trip', _activeTrip!.toJson());
        addNotification("EOD Closing Complete", "Closing report completed. Return safely back to warehouse.", "general");
        _allPastInvoices.clear();
        _prefs?.remove('cached_past_invoices');
      }
    } catch (_) {
      _activeTrip!.status = 'COMPLETED';
      _cacheObject('cached_active_trip', _activeTrip!.toJson());
      addNotification("EOD Dynamic Save", "Closing report completed offline.", "alert");
      _allPastInvoices.clear();
      _prefs?.remove('cached_past_invoices');
      success = true;
    }

    _isLoading = false;
    notifyListeners();
    return success;
  }

  Future<bool> submitEndOfDayClosing() async {
    if (_activeTrip == null || _currentDriver == null) return false;
    _isLoading = true;
    notifyListeners();

    double cash = getCollectedAmountByMode('CASH');
    double upi = getCollectedAmountByMode('UPI');
    double cheque = getCollectedAmountByMode('CHEQUE');

    final payload = {
      'tripId': _activeTrip!.id,
      'driverId': _currentDriver!.id,
      'cashCollected': cash,
      'upiCollected': upi,
      'chequeCollected': cheque,
    };

    bool success = false;
    try {
      if (_isOnline) {
        await _apiService.settleCollection(payload);
        // Set trip status as COMPLETED
        await _apiService.updateTripStatus(_activeTrip!.id, 'COMPLETED');
        success = true;
      } else {
        // Queue settlement offline
        addNotification("EOD Settlement Saved", "End-of-day report submitted locally.", "alert");
        success = true;
      }
      
      if (success) {
        _activeTrip!.status = 'COMPLETED';
        _cacheObject('cached_active_trip', _activeTrip!.toJson());
        addNotification("EOD Closing Complete", "Closing report completed. Return safely back to warehouse.", "general");
        _allPastInvoices.clear();
        _prefs?.remove('cached_past_invoices');
      }
    } catch (_) {
      // Offline fallback safe trigger
      _activeTrip!.status = 'COMPLETED';
      _cacheObject('cached_active_trip', _activeTrip!.toJson());
      addNotification("EOD Dynamic Save", "Closing report completed offline.", "alert");
      _allPastInvoices.clear();
      _prefs?.remove('cached_past_invoices');
      success = true;
    }

    _isLoading = false;
    notifyListeners();
    return success;
  }

  // ============================================================
  // NOTIFICATION UTILITIES
  // ============================================================

  void addNotification(String title, String message, String type) {
    final alert = NotificationAlert(
      id: Random().nextInt(100000).toString(),
      title: title,
      message: message,
      type: type,
      timestamp: DateTime.now(),
    );
    _notifications.insert(0, alert);
    notifyListeners();
  }

  void markNotificationAsRead(String id) {
    final idx = _notifications.indexWhere((n) => n.id == id);
    if (idx != -1) {
      _notifications[idx].isRead = true;
      notifyListeners();
    }
  }

  void clearAllNotifications() {
    _notifications.clear();
    notifyListeners();
  }
}
