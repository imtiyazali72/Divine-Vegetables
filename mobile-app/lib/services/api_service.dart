import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/models.dart';

class ApiService {
  // Default server IP: 10.0.2.2 for emulator, or local IP / localhost
  static String serverIp = "10.0.2.2"; 
  static String get baseUrl => "http://$serverIp:8000/api";

  static Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/auth/login"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"username": username.trim(), "password": password.trim()}),
      ).timeout(const Duration(seconds: 8));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return data;
      } else {
        return {"error": data["detail"] ?? "Invalid credentials"};
      }
    } catch (e) {
      return {"error": "Server Connection Error! Cannot reach $baseUrl. Check laptop IP & backend status."};
    }
  }

  static Future<Map<String, dynamic>> registerClient({
    required String businessName,
    required String clientType,
    required String phone,
    required String password,
    String? contactPerson,
    String? address,
  }) async {
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/auth/register-client"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "business_name": businessName.trim(),
          "client_type": clientType.trim(),
          "phone": phone.trim(),
          "password": password.trim(),
          "contact_person": (contactPerson ?? "").trim(),
          "address": (address ?? "").trim(),
        }),
      ).timeout(const Duration(seconds: 8));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return data;
      } else {
        return {"error": data["detail"] ?? "Registration failed"};
      }
    } catch (e) {
      return {"error": "Server Connection Error! Cannot reach $baseUrl."};
    }
  }

  static Future<Map<String, dynamic>> getCutoffStatus() async {
    try {
      final response = await http.get(Uri.parse("$baseUrl/cutoff-status")).timeout(const Duration(seconds: 5));
      return jsonDecode(response.body);
    } catch (e) {
      return {"is_open": true, "message": "Nightly Order Window Active (10 PM - 2:30 AM)"};
    }
  }

  static Future<List<VegetableProduct>> fetchProducts(int clientId, String clientType) async {
    try {
      final response = await http.get(Uri.parse("$baseUrl/products?client_id=$clientId&client_type=$clientType")).timeout(const Duration(seconds: 8));
      if (response.statusCode == 200) {
        List data = jsonDecode(response.body);
        return data.map((item) => VegetableProduct.fromJson(item)).toList();
      }
    } catch (e) {
      print("API Error: $e");
    }
    return [];
  }

  static Future<Map<String, dynamic>> placeOrder({
    required int clientId,
    required List<Map<String, dynamic>> items,
    required String deliveryDate,
    String? notes,
  }) async {
    try {
      final response = await http.post(
        Uri.parse("$baseUrl/orders/place"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "client_id": clientId,
          "items": items,
          "delivery_date": deliveryDate,
          "notes": notes ?? "",
          "bypass_cutoff": true
        }),
      ).timeout(const Duration(seconds: 10));
      return jsonDecode(response.body);
    } catch (e) {
      return {"error": e.toString()};
    }
  }

  static Future<List<OrderModel>> fetchOrders(int clientId) async {
    try {
      final response = await http.get(Uri.parse("$baseUrl/orders?client_id=$clientId")).timeout(const Duration(seconds: 8));
      if (response.statusCode == 200) {
        List data = jsonDecode(response.body);
        return data.map((item) => OrderModel.fromJson(item)).toList();
      }
    } catch (e) {
      print("API Error: $e");
    }
    return [];
  }
}
