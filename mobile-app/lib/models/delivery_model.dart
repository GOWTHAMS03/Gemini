class DeliveryItemModel {
  final String productName;
  final int allocatedQty;
  int acceptedQty;
  int damagedQty;

  DeliveryItemModel({
    required this.productName,
    required this.allocatedQty,
    required this.acceptedQty,
    this.damagedQty = 0,
  });
}

class DeliveryStopModel {
  final String id;
  final String shopName;
  final String ownerName;
  final String phone;
  final String address;
  final String routeName;
  bool isCompleted;
  final List<DeliveryItemModel> items;

  DeliveryStopModel({
    required this.id,
    required this.shopName,
    required this.ownerName,
    required this.phone,
    required this.address,
    required this.routeName,
    this.isCompleted = false,
    required this.items,
  });
}
