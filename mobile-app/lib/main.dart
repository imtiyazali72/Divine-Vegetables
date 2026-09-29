import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'screens/catalog_screen.dart';
import 'screens/order_tracking_screen.dart';
import 'screens/ledger_invoices_screen.dart';
import 'services/api_service.dart';

void main() {
  runApp(const DivineVegetablesApp());
}

class DivineVegetablesApp extends StatelessWidget {
  const DivineVegetablesApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Divine Vegetables B2B',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF090D16),
        primaryColor: const Color(0xFF10B981),
      ),
      home: const MainNavigationWrapper(),
    );
  }
}

class MainNavigationWrapper extends StatefulWidget {
  const MainNavigationWrapper({Key? key}) : super(key: key);

  @override
  _MainNavigationWrapperState createState() => _MainNavigationWrapperState();
}

class _MainNavigationWrapperState extends State<MainNavigationWrapper> {
  Map<String, dynamic>? _authData;
  int _currentIndex = 0;

  void _onLoginSuccess(Map<String, dynamic> data) {
    setState(() {
      _authData = data;
    });
  }

  void _handlePlaceOrder(Map<int, double> cart) async {
    final client = _authData!['client'];
    final clientId = client != null ? client['id'] : 1;

    List<Map<String, dynamic>> items = [];
    cart.forEach((prodId, qty) {
      items.add({"product_id": prodId, "ordered_qty": qty});
    });

    final res = await ApiService.placeOrder(
      clientId: clientId,
      items: items,
      deliveryDate: "2026-09-14",
    );

    if (res.containsKey("order_number")) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Order #${res['order_number']} placed successfully for morning delivery!")),
      );
      setState(() {
        _currentIndex = 1; // Switch to Order Tracker
      });
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res["detail"] ?? "Order Failed")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_authData == null) {
      return LoginScreen(onLoginSuccess: _onLoginSuccess);
    }

    final pages = [
      CatalogScreen(authData: _authData!, onOpenCart: _handlePlaceOrder),
      OrderTrackingScreen(authData: _authData!),
      LedgerInvoicesScreen(authData: _authData!),
    ];

    return Scaffold(
      body: pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        backgroundColor: const Color(0xFF111827),
        selectedItemColor: const Color(0xFF10B981),
        unselectedItemColor: const Color(0xFF9CA3AF),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.shopping_basket), label: 'Catalog'),
          BottomNavigationBarItem(icon: Icon(Icons.local_shipping), label: 'Delivery'),
          BottomNavigationBarItem(icon: Icon(Icons.menu_book), label: 'Ledger'),
        ],
      ),
    );
  }
}
