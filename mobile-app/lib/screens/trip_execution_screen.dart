import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'shop_visit_execution_screen.dart';
import 'trip_route_map_screen.dart';

class TripExecutionScreen extends StatefulWidget {
  final Map<String, dynamic> trip;

  const TripExecutionScreen({
    super.key,
    required this.trip,
  });

  @override
  State<TripExecutionScreen> createState() => _TripExecutionScreenState();
}

class _TripExecutionScreenState extends State<TripExecutionScreen> {
  late Map<String, dynamic> currentTrip;
  bool isUpdating = false;

  @override
  void initState() {
    super.initState();
    currentTrip = widget.trip;
  }

  Future<void> _startTrip() async {
    setState(() => isUpdating = true);
    try {
      final response = await ApiService().startTrip(
        currentTrip['id'],
      );
      setState(() {
        currentTrip = response;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🚀 Trip started successfully with live timestamp'),
            backgroundColor: Colors.green,
          ),
        );
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
      setState(() => isUpdating = false);
    }
  }

  Future<void> _endTrip() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Verify & End Trip?'),
        content: const Text('Are you sure you want to end this trip? All shop deliveries, collections, and remaining returns will be reconciled.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.purple),
            child: const Text('Verify & End Trip'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => isUpdating = true);
    try {
      final response = await ApiService().completeTrip(
        currentTrip['id'],
      );
      setState(() {
        currentTrip = response;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🏁 Trip completed and reconciled successfully!'),
            backgroundColor: Colors.purple,
          ),
        );
        Future.delayed(const Duration(seconds: 1), () {
          Navigator.pop(context);
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
      setState(() => isUpdating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final status = currentTrip['status'] ?? 'SCHEDULED';
    final shopVisits = (currentTrip['shopVisits'] as List?) ?? [];
    final completedShops = shopVisits
        .where((s) => s['status'] == 'COMPLETED')
        .length;

    return Scaffold(
      appBar: AppBar(
        title: Text('Trip ${currentTrip['tripNumber'] ?? 'N/A'}'),
        elevation: 0,
        actions: [
          if (status == 'IN_PROGRESS')
            Padding(
              padding: const EdgeInsets.all(8),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.amber,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    'IN PROGRESS',
                    style: TextStyle(
                      color: Colors.black,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Trip Header Card
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
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Trip Date',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.white.withOpacity(0.7),
                            ),
                          ),
                          Text(
                            currentTrip['tripDate'] ?? '-',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'Progress',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.white.withOpacity(0.7),
                            ),
                          ),
                          Text(
                            '$completedShops / ${shopVisits.length} shops',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: shopVisits.isEmpty
                          ? 0
                          : completedShops / shopVisits.length,
                      minHeight: 6,
                      backgroundColor: Colors.white.withOpacity(0.2),
                      valueColor: AlwaysStoppedAnimation(
                        Colors.white.withOpacity(0.9),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Trip Info Card
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
                  _buildInfoRow('Route', currentTrip['routeName'] ?? '-'),
                  const SizedBox(height: 8),
                  _buildInfoRow(
                    'Vehicle',
                    currentTrip['vehicleNumber'] ?? '-',
                  ),
                  const SizedBox(height: 8),
                  _buildInfoRow(
                    'Sales Person',
                    currentTrip['salesPersonName'] ?? '-',
                  ),
                  const SizedBox(height: 8),
                  _buildInfoRow(
                    'Status',
                    status,
                    valueColor: _getStatusColor(status),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Control Buttons
            if (status == 'SCHEDULED')
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: isUpdating ? null : _startTrip,
                    icon: const Icon(Icons.play_arrow),
                    label: const Text('Start Trip'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      disabledBackgroundColor: Colors.green.withOpacity(0.5),
                    ),
                  ),
                ),
              )
            else if (status == 'IN_PROGRESS')
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: isUpdating ? null : _endTrip,
                    icon: const Icon(Icons.stop),
                    label: const Text('End Trip'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      disabledBackgroundColor: Colors.red.withOpacity(0.5),
                    ),
                  ),
                ),
              ),

            // View Route Map Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => TripRouteMapScreen(
                          tripId: currentTrip['id'],
                          tripNumber: currentTrip['tripNumber'] ?? 'N/A',
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.map_rounded, size: 20),
                  label: const Text('📍 View Route Map'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF6366F1),
                    side: const BorderSide(color: Color(0xFF6366F1), width: 1.5),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Shop Visits List
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Shops to Visit (${shopVisits.length})',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (shopVisits.isEmpty)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 32),
                        child: Column(
                          children: [
                            Icon(
                              Icons.store,
                              size: 48,
                              color: theme.colorScheme.outline.withOpacity(0.5),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'No shops assigned',
                              style: TextStyle(
                                color: theme.colorScheme.outline,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: shopVisits.length,
                      itemBuilder: (context, index) {
                        final shop = shopVisits[index];
                        final visitStatus = shop['status'] ?? 'PENDING';
                        final sequence = shop['visitSequence'] ?? index + 1;
                        final isCompleted = visitStatus == 'COMPLETED';
                        final isInProgress = visitStatus == 'IN_PROGRESS';

                        return GestureDetector(
                          onTap: status == 'IN_PROGRESS'
                              ? () async {
                                  final result = await Navigator.push<bool>(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          ShopVisitExecutionScreen(
                                        trip: currentTrip,
                                        shop: shop,
                                        tripStatus: status,
                                      ),
                                    ),
                                  );
                                  if (result == true) {
                                    setState(() {
                                      // Refresh shop visit status
                                      shopVisits[index]['status'] =
                                          'COMPLETED';
                                    });
                                  }
                                }
                              : null,
                          child: Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: _getStatusColor(visitStatus)
                                      .withOpacity(0.3),
                                  width: 2,
                                ),
                              ),
                              child: Row(
                                children: [
                                  // Sequence Badge
                                  Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(
                                      color: _getStatusColor(visitStatus)
                                          .withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                        color: _getStatusColor(visitStatus),
                                        width: 2,
                                      ),
                                    ),
                                    child: Center(
                                      child: Text(
                                        '$sequence',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: _getStatusColor(visitStatus),
                                          fontSize: 14,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  // Shop Info
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          shop['shopName'] ?? 'Shop $sequence',
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                            color: theme.colorScheme.onSurface,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          shop['ownerName'] ?? 'N/A',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: theme.colorScheme.onSurface
                                                .withOpacity(0.7),
                                          ),
                                        ),
                                        if (isCompleted)
                                          Text(
                                            'Completed at ${shop['actualEndTime'] ?? '-'}',
                                            style: const TextStyle(
                                              fontSize: 11,
                                              color: Colors.green,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                  // Status Icon
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: _getStatusColor(visitStatus)
                                          .withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          isCompleted
                                              ? Icons.check_circle
                                              : isInProgress
                                                  ? Icons.timer
                                                  : Icons.schedule,
                                          size: 16,
                                          color:
                                              _getStatusColor(visitStatus),
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          visitStatus,
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color:
                                                _getStatusColor(visitStatus),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(
    String label,
    String value, {
    Color? valueColor,
  }) {
    final theme = Theme.of(context);
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
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: valueColor ?? theme.colorScheme.onSurface,
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
}
