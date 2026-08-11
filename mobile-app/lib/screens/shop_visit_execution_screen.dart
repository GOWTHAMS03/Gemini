import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:geolocator/geolocator.dart';
import '../services/api_service.dart';

class ShopVisitExecutionScreen extends StatefulWidget {
  final Map<String, dynamic> trip;
  final Map<String, dynamic> shop;
  final String tripStatus;

  const ShopVisitExecutionScreen({
    Key? key,
    required this.trip,
    required this.shop,
    required this.tripStatus,
  }) : super(key: key);

  @override
  State<ShopVisitExecutionScreen> createState() =>
      _ShopVisitExecutionScreenState();
}

class _ShopVisitExecutionScreenState extends State<ShopVisitExecutionScreen> {
  late Map<String, dynamic> currentShop;
  bool isLoading = false;
  bool isCheckInComplete = false;
  Position? currentPosition;
  DateTime? checkInTime;
  DateTime? checkOutTime;

  // Product sales tracking
  final Map<int, int> productSalesQty = {};
  final TextEditingController billAmountController = TextEditingController();
  final TextEditingController paymentAmountController = TextEditingController();
  final TextEditingController remarksController = TextEditingController();

  @override
  void initState() {
    super.initState();
    currentShop = widget.shop;
    checkInTime = DateTime.tryParse(widget.shop['actualStartTime'] ?? '');
    checkOutTime = DateTime.tryParse(widget.shop['actualEndTime'] ?? '');
    isCheckInComplete = widget.shop['status'] == 'IN_PROGRESS' ||
        widget.shop['status'] == 'COMPLETED';
    _getCurrentLocation();
  }

  Future<void> _getCurrentLocation() async {
    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      setState(() {
        currentPosition = position;
      });
    } catch (e) {
      print('Failed to get location: $e');
    }
  }

  Future<void> _checkInAtShop() async {
    setState(() => isLoading = true);
    try {
      final now = DateTime.now();
      final response = await ApiService().checkInShopVisit(
        widget.trip['id'],
        currentShop['id'],
        now,
        currentPosition,
      );

      setState(() {
        checkInTime = now;
        isCheckInComplete = true;
        currentShop = response;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✓ Checked in successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Check-in failed: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => isLoading = false);
    }
  }

  Future<void> _completeShopVisit() async {
    // Validate required fields
    if (billAmountController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter bill amount'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    if (paymentAmountController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter payment amount'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => isLoading = true);
    try {
      final now = DateTime.now();
      final billAmount = double.tryParse(billAmountController.text) ?? 0;
      final paymentAmount = double.tryParse(paymentAmountController.text) ?? 0;

      final visitData = {
        'tripId': widget.trip['id'],
        'shopVisitId': currentShop['id'],
        'checkOutTime': now,
        'billAmount': billAmount,
        'paymentAmount': paymentAmount,
        'pendingAmount': billAmount - paymentAmount,
        'remarks': remarksController.text,
        'productSales': productSalesQty,
        'location': {
          'latitude': currentPosition?.latitude,
          'longitude': currentPosition?.longitude,
        },
      };

      final response = await ApiService().completeShopVisit(
        visitData,
      );

      setState(() {
        checkOutTime = now;
        currentShop = response;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✓ Shop visit completed successfully'),
            backgroundColor: Colors.green,
          ),
        );
        Future.delayed(const Duration(seconds: 1), () {
          Navigator.pop(context, true);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isCompleted = currentShop['status'] == 'COMPLETED';
    final shopProducts = (currentShop['products'] as List?) ?? [];

    return Scaffold(
      appBar: AppBar(
        title: Text('Shop Visit: ${currentShop['shopName'] ?? 'N/A'}'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Shop Header Card
            Container(
              margin: const EdgeInsets.all(12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    theme.colorScheme.primary,
                    theme.colorScheme.primary.withOpacity(0.8),
                  ],
                ),
                borderRadius: BorderRadius.circular(12),
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
                              currentShop['shopName'] ?? 'Shop',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              currentShop['ownerName'] ?? 'Owner',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.white.withOpacity(0.8),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: _getStatusColor(currentShop['status'] ?? 'PENDING')
                              .withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: _getStatusColor(currentShop['status'] ?? 'PENDING'),
                          ),
                        ),
                        child: Text(
                          currentShop['status'] ?? 'PENDING',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: _getStatusColor(currentShop['status'] ?? 'PENDING'),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Icon(
                        Icons.phone,
                        size: 16,
                        color: Colors.white.withOpacity(0.8),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        currentShop['phone'] ?? '-',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.white.withOpacity(0.8),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.location_on,
                        size: 16,
                        color: Colors.white.withOpacity(0.8),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          currentShop['address'] ?? '-',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.white.withOpacity(0.8),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Check-in Section
            if (!isCheckInComplete && !isCompleted)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: isLoading ? null : _checkInAtShop,
                    icon: const Icon(Icons.login),
                    label: const Text('Check In Now'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      disabledBackgroundColor: Colors.blue.withOpacity(0.5),
                    ),
                  ),
                ),
              ),

            if (isCheckInComplete || isCompleted) ...[
              const SizedBox(height: 16),

              // Visit Times Card
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF2A2A3E) : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: theme.colorScheme.outline.withOpacity(0.2),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Visit Timeline',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildTimeRow(
                      'Planned Time',
                      widget.shop['plannedStartTime'] ?? '-',
                      theme,
                    ),
                    const SizedBox(height: 8),
                    _buildTimeRow(
                      'Check In Time',
                      checkInTime != null
                          ? DateFormat('HH:mm:ss').format(checkInTime!)
                          : '-',
                      theme,
                      isActual: true,
                    ),
                    if (isCompleted) ...[
                      const SizedBox(height: 8),
                      _buildTimeRow(
                        'Check Out Time',
                        checkOutTime != null
                            ? DateFormat('HH:mm:ss').format(checkOutTime!)
                            : '-',
                        theme,
                        isActual: true,
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Products Section
              if (shopProducts.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Product Delivery',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 12),
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: shopProducts.length,
                        itemBuilder: (context, index) {
                          final product = shopProducts[index];
                          final productId = product['id'];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    product['name'] ?? 'Product $index',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13,
                                      color: theme.colorScheme.onSurface,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Text(
                                        'Allocated: ${product['allocatedQuantity'] ?? 0} units',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: theme.colorScheme.onSurface
                                              .withOpacity(0.7),
                                        ),
                                      ),
                                      const Spacer(),
                                      if (!isCompleted)
                                        Expanded(
                                          child: TextField(
                                            keyboardType:
                                                TextInputType.number,
                                            decoration: InputDecoration(
                                              hintText: 'Sold qty',
                                              hintStyle: TextStyle(
                                                fontSize: 12,
                                                color: theme.colorScheme
                                                    .onSurface
                                                    .withOpacity(0.5),
                                              ),
                                              contentPadding:
                                                  const EdgeInsets.symmetric(
                                                horizontal: 8,
                                                vertical: 6,
                                              ),
                                              border: OutlineInputBorder(
                                                borderRadius:
                                                    BorderRadius.circular(6),
                                              ),
                                            ),
                                            onChanged: (value) {
                                              setState(() {
                                                if (value.isEmpty) {
                                                  productSalesQty
                                                      .remove(productId);
                                                } else {
                                                  productSalesQty[productId] =
                                                      int.tryParse(value) ?? 0;
                                                }
                                              });
                                            },
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
                    ],
                  ),
                ),

              const SizedBox(height: 16),

              // Billing Section
              if (!isCompleted)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Billing & Payment',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: billAmountController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Bill Amount (₹)',
                          prefixIcon: const Icon(Icons.receipt),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        onChanged: (_) => setState(() {}),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: paymentAmountController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Payment Received (₹)',
                          prefixIcon: const Icon(Icons.attach_money),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        onChanged: (_) => setState(() {}),
                      ),
                      const SizedBox(height: 12),
                      // Pending Amount Display
                      if (billAmountController.text.isNotEmpty &&
                          paymentAmountController.text.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color:
                                  theme.colorScheme.primary.withOpacity(0.3),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment:
                                MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Pending Amount',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: theme.colorScheme.onSurface,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Text(
                                '₹ ${(double.tryParse(billAmountController.text) ?? 0) - (double.tryParse(paymentAmountController.text) ?? 0)}',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: theme.colorScheme.primary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: remarksController,
                        maxLines: 3,
                        decoration: InputDecoration(
                          labelText: 'Remarks / Notes',
                          prefixIcon: const Icon(Icons.note),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ],
                  ),
                )
            else if (isCompleted)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: Colors.green.withOpacity(0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: Colors.green,
                        size: 24,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Visit Completed',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Colors.green,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Bill: ₹${currentShop['billAmount'] ?? 0} | Payment: ₹${currentShop['paymentAmount'] ?? 0}',
                              style: TextStyle(
                                fontSize: 12,
                                color: theme.colorScheme.onSurface
                                    .withOpacity(0.7),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],

            const SizedBox(height: 16),

            // Action Buttons
            if (!isCompleted)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Cancel'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: isLoading ? null : _completeShopVisit,
                        icon: const Icon(Icons.logout),
                        label: const Text('Complete Visit'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                          disabledBackgroundColor: Colors.green.withOpacity(0.5),
                        ),
                      ),
                    ),
                  ],
                ),
              )
            else
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context, true),
                    child: const Text('Back to Trip'),
                  ),
                ),
              ),

            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeRow(
    String label,
    String time,
    ThemeData theme, {
    bool isActual = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: theme.colorScheme.onSurface.withOpacity(0.7),
          ),
        ),
        Text(
          time,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: isActual
                ? Colors.green
                : theme.colorScheme.onSurface,
          ),
        ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'COMPLETED':
        return Colors.green;
      case 'IN_PROGRESS':
        return Colors.amber;
      case 'PENDING':
        return Colors.grey;
      default:
        return Colors.blue;
    }
  }

  @override
  void dispose() {
    billAmountController.dispose();
    paymentAmountController.dispose();
    remarksController.dispose();
    super.dispose();
  }
}
