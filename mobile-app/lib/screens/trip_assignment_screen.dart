import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme.dart';
import '../providers/delivery_provider.dart';
import '../services/api_service.dart';

class TripAssignmentScreen extends StatefulWidget {
  const TripAssignmentScreen({Key? key}) : super(key: key);

  @override
  State<TripAssignmentScreen> createState() => _TripAssignmentScreenState();
}

class _TripAssignmentScreenState extends State<TripAssignmentScreen> {
  Map<String, dynamic>? activeTrip;
  bool isLoading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    loadAssignedTrip();
  }

  Future<void> loadAssignedTrip() async {
    try {
      setState(() {
        isLoading = true;
        errorMessage = null;
      });

      final provider = Provider.of<DeliveryProvider>(context, listen: false);
      if (provider.currentDriver == null) {
        setState(() {
          errorMessage = 'No driver information found';
          isLoading = false;
        });
        return;
      }

      final trip = await ApiService().getActiveTrip(provider.currentDriver!.id);
      
      setState(() {
        activeTrip = trip;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        errorMessage = 'Failed to load trip: $e';
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Your Assigned Trip'),
          elevation: 0,
        ),
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (errorMessage != null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Your Assigned Trip'),
          elevation: 0,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 64,
                color: AppTheme.roseError,
              ),
              const SizedBox(height: 16),
              Text(
                errorMessage!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 32),
              ElevatedButton.icon(
                onPressed: loadAssignedTrip,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (activeTrip == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Your Assigned Trip'),
          elevation: 0,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.info_outline,
                size: 64,
                color: theme.colorScheme.primary,
              ),
              const SizedBox(height: 16),
              Text(
                'No active trip assigned',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Check back later for your next assignment',
                style: TextStyle(
                  fontSize: 14,
                  color: theme.colorScheme.onSurface.withOpacity(0.7),
                ),
              ),
              const SizedBox(height: 32),
              ElevatedButton.icon(
                onPressed: loadAssignedTrip,
                icon: const Icon(Icons.refresh),
                label: const Text('Refresh'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Your Assigned Trip'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: loadAssignedTrip,
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Trip Header Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      theme.colorScheme.primary,
                      theme.colorScheme.primary.withOpacity(0.8),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
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
                              'Trip Number',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.white.withOpacity(0.8),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              activeTrip!['tripNumber'] ?? '-',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            activeTrip!['status'] ?? 'UNKNOWN',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Date: ${activeTrip!['tripDate'] ?? '-'}',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white.withOpacity(0.9),
                          ),
                        ),
                        Text(
                          'Route: ${activeTrip!['routeName'] ?? '-'}',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white.withOpacity(0.9),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Trip Details Card
              Card(
                elevation: 2,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Trip Details',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _buildDetailRow(
                        'Dispatch Group',
                        activeTrip!['dispatchGroupName'] ?? '-',
                        theme,
                      ),
                      const SizedBox(height: 8),
                      _buildDetailRow(
                        'Area Region',
                        activeTrip!['areaRegion'] ?? '-',
                        theme,
                      ),
                      const SizedBox(height: 8),
                      _buildDetailRow(
                        'Sales Person',
                        activeTrip!['salesPersonName'] ?? '-',
                        theme,
                      ),
                      const SizedBox(height: 8),
                      _buildDetailRow(
                        'Vehicle',
                        activeTrip!['vehicleNumber'] ?? '-',
                        theme,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Inventory Summary
              Card(
                elevation: 2,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Inventory Summary',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildSummaryBox(
                            'Loaded',
                            activeTrip!['totalLoadedQuantity'] ?? 0,
                            Colors.blue,
                            theme,
                          ),
                          _buildSummaryBox(
                            'Sold',
                            activeTrip!['totalSoldQuantity'] ?? 0,
                            Colors.green,
                            theme,
                          ),
                          _buildSummaryBox(
                            'Returned',
                            activeTrip!['totalReturnedQuantity'] ?? 0,
                            Colors.orange,
                            theme,
                          ),
                          _buildSummaryBox(
                            'Damaged',
                            activeTrip!['totalDamagedQuantity'] ?? 0,
                            Colors.red,
                            theme,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Shop Visits
              if (activeTrip!['shopVisits'] != null &&
                  (activeTrip!['shopVisits'] as List).isNotEmpty)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Scheduled Shops (${(activeTrip!['shopVisits'] as List).length})',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: (activeTrip!['shopVisits'] as List).length,
                      itemBuilder: (context, index) {
                        final shop = (activeTrip!['shopVisits'] as List)[index];
                        final statusColor = _getStatusColor(
                          shop['status'] ?? 'SCHEDULED',
                        );

                        return Card(
                          child: ListTile(
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: statusColor.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(
                                Icons.store,
                                color: statusColor,
                              ),
                            ),
                            title: Text(shop['shopName'] ?? 'Shop ${index + 1}'),
                            subtitle: Text('Seq: ${shop['visitSequence'] ?? '-'}'),
                            trailing: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: statusColor.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                shop['status'] ?? 'SCHEDULED',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: statusColor,
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              const SizedBox(height: 20),

              // Products
              if (activeTrip!['items'] != null &&
                  (activeTrip!['items'] as List).isNotEmpty)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Products Loaded (${(activeTrip!['items'] as List).length})',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: (activeTrip!['items'] as List).length,
                      itemBuilder: (context, index) {
                        final item = (activeTrip!['items'] as List)[index];

                        return Card(
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item['productName'] ?? 'Product ${index + 1}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    color: theme.colorScheme.onSurface,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    _buildInventoryBadge(
                                      'Loaded',
                                      item['loadedQuantity'] ?? 0,
                                    ),
                                    _buildInventoryBadge(
                                      'Available',
                                      item['availableQuantity'] ?? 0,
                                    ),
                                    _buildInventoryBadge(
                                      'Sold',
                                      item['soldQuantity'] ?? 0,
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
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, ThemeData theme) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: theme.colorScheme.onSurface.withOpacity(0.7),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: theme.colorScheme.onSurface,
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryBox(
    String label,
    int value,
    Color color,
    ThemeData theme,
  ) {
    return Column(
      children: [
        Text(
          value.toString(),
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: theme.colorScheme.onSurface.withOpacity(0.7),
          ),
        ),
      ],
    );
  }

  Widget _buildInventoryBadge(String label, int value) {
    return Column(
      children: [
        Text(
          value.toString(),
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 10),
        ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'COMPLETED':
        return Colors.green;
      case 'IN_PROGRESS':
        return Colors.blue;
      case 'SCHEDULED':
        return Colors.orange;
      case 'MISSED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}
