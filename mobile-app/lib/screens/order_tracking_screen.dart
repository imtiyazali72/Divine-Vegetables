import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class OrderTrackingScreen extends StatefulWidget {
  final Map<String, dynamic> authData;
  const OrderTrackingScreen({Key? key, required this.authData}) : super(key: key);

  @override
  _OrderTrackingScreenState createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  List<OrderModel> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchOrders();
  }

  void _fetchOrders() async {
    final client = widget.authData['client'];
    final clientId = client != null ? client['id'] : 1;

    final orders = await ApiService.fetchOrders(clientId);
    setState(() {
      _orders = orders;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF090D16),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        title: const Text("🚚 Morning Delivery Tracker", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _orders.length,
              itemBuilder: (context, index) {
                final order = _orders[index];
                final route = order.route;

                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF111827),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withOpacity(0.08)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            "#${order.orderNumber}",
                            style: const TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: order.status == 'PACKED' || order.status == 'DELIVERED' 
                                  ? const Color(0xFF10B981).withOpacity(0.2)
                                  : const Color(0xFFEF4444).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              order.status,
                              style: TextStyle(
                                color: order.status == 'PACKED' || order.status == 'DELIVERED'
                                    ? const Color(0xFF34D399)
                                    : const Color(0xFFF87171),
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        "Delivery Window: ${order.deliveryDate} (Morning 5:00 - 7:00 AM)",
                        style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 11),
                      ),
                      const SizedBox(height: 12),
                      const Divider(color: Colors.white10),

                      // Route Timeline
                      const Text("LIVE ROUTE TIMELINE:", style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 16),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              route != null ? route['route_status'] : "Order Received at Mandi Hub",
                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.local_shipping, color: Colors.amberAccent, size: 16),
                          const SizedBox(width: 8),
                          Text(
                            "Location: ${route != null ? route['current_location'] : 'Mandi Hub Dispatch'}",
                            style: const TextStyle(color: Colors.amberAccent, fontSize: 11),
                          ),
                        ],
                      ),

                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1F2937),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              "Driver: ${route != null ? route['driver_name'] : 'Ramesh (Van 02)'}",
                              style: const TextStyle(color: Colors.white70, fontSize: 11),
                            ),
                            Text(
                              "📞 ${route != null ? route['driver_phone'] : '+91 98765 12345'}",
                              style: const TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      )
                    ],
                  ),
                );
              },
            ),
    );
  }
}
