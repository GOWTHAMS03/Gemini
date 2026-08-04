import 'package:flutter/foundation.dart';
import '../models/delivery_model.dart';

class DeliveryProvider with ChangeNotifier {
  final List<DeliveryStopModel> _stops = [
    DeliveryStopModel(
      id: 'DEL-101',
      shopName: 'City Supermarket & Bakery',
      ownerName: 'Vikram Mehta',
      phone: '+91 98400 12345',
      address: '#42, Anna Nagar 100ft Road, Chennai',
      routeName: 'North Chennai Route A',
      isCompleted: false,
      items: [
        DeliveryItemModel(productName: 'Standard White Bread (400g)', allocatedQty: 100, acceptedQty: 100),
        DeliveryItemModel(productName: 'Butter Sweet Bun (6 Pcs)', allocatedQty: 50, acceptedQty: 50),
      ],
    ),
    DeliveryStopModel(
      id: 'DEL-102',
      shopName: 'Ganesh Daily Provisions',
      ownerName: 'Ganesh Selvam',
      phone: '+91 98400 67890',
      address: '#115, T. Nagar 5th Block, Chennai',
      routeName: 'North Chennai Route A',
      isCompleted: false,
      items: [
        DeliveryItemModel(productName: 'Whole Wheat Milk Bread (400g)', allocatedQty: 60, acceptedQty: 60),
        DeliveryItemModel(productName: 'Fruit Slice Cake (250g)', allocatedQty: 30, acceptedQty: 30),
      ],
    ),
  ];

  List<DeliveryStopModel> get stops => _stops;

  void completeDelivery(String id) {
    final index = _stops.indexWhere((s) => s.id == id);
    if (index != -1) {
      _stops[index].isCompleted = true;
      notifyListeners();
    }
  }
}
