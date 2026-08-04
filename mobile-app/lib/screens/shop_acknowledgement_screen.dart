import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/delivery_model.dart';
import '../providers/delivery_provider.dart';

class ShopAcknowledgementScreen extends StatefulWidget {
  final DeliveryStopModel stop;

  const ShopAcknowledgementScreen({super.key, required this.stop});

  @override
  State<ShopAcknowledgementScreen> createState() => _ShopAcknowledgementScreenState();
}

class _ShopAcknowledgementScreenState extends State<ShopAcknowledgementScreen> {
  bool _signatureCaptured = false;

  void _submitAcknowledgement() {
    Provider.of<DeliveryProvider>(context, listen: false).completeDelivery(widget.stop.id);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Delivery Acknowledged & Proof of Delivery Saved!')),
    );
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('POD - ${widget.stop.shopName}'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.stop.shopName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 4),
                  Text('Owner: ${widget.stop.ownerName} | ${widget.stop.phone}', style: const TextStyle(color: Colors.grey)),
                ],
              ),
            ),
            const SizedBox(height: 20),

            const Text('Delivered Items Verification', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 12),

            ...widget.stop.items.map((item) => Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item.productName, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                            Text('Dispatched: ${item.allocatedQty} Pkts', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                          ],
                        ),
                      ),
                      Container(
                        width: 80,
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.emerald.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.emerald),
                        ),
                        child: Text(
                          '${item.acceptedQty} Accepted',
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: Colors.emerald, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      )
                    ],
                  ),
                )),

            const SizedBox(height: 24),
            const Text('Shop Owner Digital Signature Canvas', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(height: 12),

            GestureDetector(
              onTap: () {
                setState(() {
                  _signatureCaptured = true;
                });
              },
              child: Container(
                height: 140,
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: _signatureCaptured ? Colors.emerald : Colors.amber),
                ),
                child: Center(
                  child: _signatureCaptured
                      ? const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.check_circle, color: Colors.emerald, size: 36),
                            SizedBox(height: 4),
                            Text('Signature Recorded', style: TextStyle(color: Colors.emerald, fontWeight: FontWeight.bold)),
                          ],
                        )
                      : const Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.draw, color: Colors.grey, size: 36),
                            SizedBox(height: 4),
                            Text('Tap to Sign Canvas', style: TextStyle(color: Colors.grey)),
                          ],
                        ),
                ),
              ),
            ),

            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _signatureCaptured ? _submitAcknowledgement : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.emerald,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.vertical: 16,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Confirm Delivery & Sign POD', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
