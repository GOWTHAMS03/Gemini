import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/delivery_provider.dart';
import 'shop_acknowledgement_screen.dart';

class DriverDashboardScreen extends StatelessWidget {
  const DriverDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<DeliveryProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Driver Field Route'),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Synced offline logs with server successfully!')),
              );
            },
          )
        ],
      ),
      body: Column(
        children: [
          // Vehicle Summary Banner
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.amber.withOpacity(0.3)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text('TRIP-1722770000', style: TextStyle(color: Colors.amber, fontWeight: FontWeight.bold)),
                    SizedBox(height: 4),
                    Text('Vehicle: TN-01-EA-4521', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                    Text('Route: North Chennai A', style: TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.amber.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.local_shipping, color: Colors.amber, size: 28),
                )
              ],
            ),
          ),

          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Assigned Shop Delivery Stops',
                style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ),

          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: provider.stops.length,
              itemBuilder: (context, index) {
                final stop = provider.stops[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile,
                  title: Text(stop.shopName, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                  subtitle: Text('${stop.address}\nOwner: ${stop.ownerName}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                  isThreeLine: true,
                  trailing: stop.isCompleted
                      ? const Chip(
                          label: Text('Delivered', style: TextStyle(fontSize: 10, color: Colors.emeraldAccent)),
                          backgroundColor: Color(0xFF064E3B),
                        )
                      : ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.amber,
                            foregroundColor: Colors.black,
                          ),
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => ShopAcknowledgementScreen(stop: stop),
                              ),
                            );
                          },
                          child: const Text('Process POD'),
                        ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
