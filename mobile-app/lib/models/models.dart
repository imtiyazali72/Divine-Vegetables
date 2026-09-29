class VegetableProduct {
  final int id;
  final String name;
  final String hindiName;
  final String category;
  final String unit;
  final double effectiveRate;
  final String imageUrl;

  VegetableProduct({
    required this.id,
    required this.name,
    required this.hindiName,
    required this.category,
    required this.unit,
    required this.effectiveRate,
    required this.imageUrl,
  });

  factory VegetableProduct.fromJson(Map<String, dynamic> json) {
    return VegetableProduct(
      id: json['id'],
      name: json['name'] ?? '',
      hindiName: json['hindi_name'] ?? '',
      category: json['category'] ?? 'Green Vegetables',
      unit: json['default_unit'] ?? 'KG',
      effectiveRate: (json['effective_rate'] as num).toDouble(),
      imageUrl: json['image_url'] ?? 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400',
    );
  }
}

class ClientProfile {
  final int id;
  final String businessName;
  final String clientType;
  final String paymentCycle;
  final double currentBalance;

  ClientProfile({
    required this.id,
    required this.businessName,
    required this.clientType,
    required this.paymentCycle,
    required this.currentBalance,
  });

  factory ClientProfile.fromJson(Map<String, dynamic> json) {
    return ClientProfile(
      id: json['id'],
      businessName: json['business_name'] ?? '',
      clientType: json['client_type'] ?? 'HOTEL',
      paymentCycle: json['payment_cycle'] ?? 'WEEKLY',
      currentBalance: (json['current_balance'] as num).toDouble(),
    );
  }
}

class OrderModel {
  final int id;
  final String orderNumber;
  final String orderDate;
  final String deliveryDate;
  final String status;
  final double estimatedTotal;
  final double actualFinalTotal;
  final List<dynamic> items;
  final Map<String, dynamic>? route;

  OrderModel({
    required this.id,
    required this.orderNumber,
    required this.orderDate,
    required this.deliveryDate,
    required this.status,
    required this.estimatedTotal,
    required this.actualFinalTotal,
    required this.items,
    this.route,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'],
      orderNumber: json['order_number'] ?? '',
      orderDate: json['order_date'] ?? '',
      deliveryDate: json['delivery_date'] ?? '',
      status: json['status'] ?? 'PENDING',
      estimatedTotal: (json['estimated_total'] as num).toDouble(),
      actualFinalTotal: (json['actual_final_total'] as num).toDouble(),
      items: json['items'] ?? [],
      route: json['route'],
    );
  }
}
