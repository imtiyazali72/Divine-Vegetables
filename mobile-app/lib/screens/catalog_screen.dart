import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class CatalogScreen extends StatefulWidget {
  final Map<String, dynamic> authData;
  final Function(Map<int, double>) onOpenCart;

  const CatalogScreen({Key? key, required this.authData, required this.onOpenCart}) : super(key: key);

  @override
  _CatalogScreenState createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  List<VegetableProduct> _products = [];
  Map<String, dynamic> _cutoffStatus = {};
  final Map<int, double> _cartQuantities = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCatalog();
  }

  void _loadCatalog() async {
    final client = widget.authData['client'];
    final clientId = client != null ? client['id'] : 1;
    final clientType = client != null ? client['client_type'] : 'HOTEL';

    final cutoff = await ApiService.getCutoffStatus();
    final prods = await ApiService.fetchProducts(clientId, clientType);

    setState(() {
      _cutoffStatus = cutoff;
      _products = prods;
      _isLoading = false;
    });
  }

  void _updateQuantity(int productId, double delta) {
    setState(() {
      double current = _cartQuantities[productId] ?? 0.0;
      double next = current + delta;
      if (next <= 0) {
        _cartQuantities.remove(productId);
      } else {
        _cartQuantities[productId] = double.parse(next.toStringAsFixed(1));
      }
    });
  }

  double _calculateTotalItems() {
    double total = 0.0;
    _cartQuantities.forEach((prodId, qty) {
      total += qty;
    });
    return total;
  }

  @override
  Widget build(BuildContext context) {
    final client = widget.authData['client'];
    final businessName = client != null ? client['business_name'] : 'Hotel Account';
    final clientType = client != null ? client['client_type'] : 'HOTEL';

    return Scaffold(
      backgroundColor: const Color(0xFF090D16),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              businessName,
              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            Text(
              "Type: $clientType • Mandi Rates Applied at Dispatch",
              style: const TextStyle(color: Color(0xFF10B981), fontSize: 11),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Cutoff Window Timer Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: const Color(0xFF059669).withOpacity(0.2),
            child: Row(
              children: [
                const Icon(Icons.timer, color: Color(0xFF10B981), size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _cutoffStatus['message'] ?? "Nightly Order Window Active (10 PM - 2:30 AM)",
                    style: const TextStyle(color: Color(0xFF34D399), fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),

          // Market Notice Badge
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            color: const Color(0xFFF59E0B).withOpacity(0.15),
            child: const Text(
              "🏷️ Daily Mandi Market Rates & Actual Weighted Invoice applied upon dispatch.",
              style: TextStyle(color: Colors.amberAccent, fontSize: 11, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
          ),

          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _products.length,
                    itemBuilder: (context, index) {
                      final prod = _products[index];
                      final qty = _cartQuantities[prod.id] ?? 0.0;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF111827),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white.withOpacity(0.08)),
                        ),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: Image.network(
                                prod.imageUrl,
                                width: 60,
                                height: 60,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Container(color: Colors.grey, width: 60, height: 60),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    prod.name,
                                    style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                                  ),
                                  Text(
                                    prod.hindiName,
                                    style: const TextStyle(color: Color(0xFF10B981), fontSize: 11),
                                  ),
                                  const SizedBox(height: 4),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF1F2937),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      "Unit: ${prod.unit}",
                                      style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // Quantity Selector
                            Row(
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.remove_circle, color: Color(0xFFEF4444)),
                                  onPressed: () => _updateQuantity(prod.id, -1.0),
                                ),
                                Text(
                                  "${qty.toStringAsFixed(1)} ${prod.unit}",
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.add_circle, color: Color(0xFF10B981)),
                                  onPressed: () => _updateQuantity(prod.id, 1.0),
                                ),
                              ],
                            )
                          ],
                        ),
                      );
                    },
                  ),
          ),

          // Bottom Cart Bar
          if (_cartQuantities.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Color(0xFF1F2937),
                boxShadow: [BoxShadow(color: Colors.black54, blurRadius: 10)],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text("SELECTED QUANTITY", style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 10, fontWeight: FontWeight.bold)),
                      Text(
                        "${_calculateTotalItems().toStringAsFixed(1)} Units",
                        style: const TextStyle(color: Color(0xFF10B981), fontSize: 18, fontWeight: FontWeight.w900),
                      ),
                    ],
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () => widget.onOpenCart(_cartQuantities),
                    child: const Text("Review & Place Order →", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
