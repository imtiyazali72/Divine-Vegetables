import 'package:flutter/material.dart';

class LedgerInvoicesScreen extends StatelessWidget {
  final Map<String, dynamic> authData;
  const LedgerInvoicesScreen({Key? key, required this.authData}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final client = authData['client'] ?? {};
    final businessName = client['business_name'] ?? 'Hotel Account';
    final currentBalance = (client['current_balance'] ?? 14500.0) as double;
    final paymentCycle = client['payment_cycle'] ?? 'WEEKLY';

    return Scaffold(
      backgroundColor: const Color(0xFF090D16),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        title: const Text("📖 Udhaar & Billing Ledger", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Outstanding Udhaar Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF059669), Color(0xFF0F5132)],
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 10)],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    businessName.toUpperCase(),
                    style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1),
                  ),
                  const SizedBox(height: 10),
                  const Text("CURRENT OUTSTANDING UDHAAR", style: TextStyle(color: Color(0xFFD1E7DD), fontSize: 10)),
                  Text(
                    "₹${currentBalance.toStringAsFixed(2)}",
                    style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("Payment Cycle: $paymentCycle", style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                      const Text("Credit Limit: ₹1,00,000", style: TextStyle(color: Colors.white70, fontSize: 11)),
                    ],
                  )
                ],
              ),
            ),

            const SizedBox(height: 24),
            const Text("RECENT DIVINE VEGETABLES PDF INVOICES", style: TextStyle(color: Color(0xFF10B981), fontSize: 12, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),

            // Demo Invoice Items
            _buildInvoiceTile("DV-INV-2026-0104", "13 Sep 2026", 4850.0, "UNPAID"),
            _buildInvoiceTile("DV-INV-2026-0098", "06 Sep 2026", 9650.0, "PAID"),
          ],
        ),
      ),
    );
  }

  Widget _buildInvoiceTile(String invNo, String date, double amount, String status) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white10),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              const Icon(Icons.picture_as_pdf, color: Color(0xFFEF4444), size: 30),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(invNo, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                  Text(date, style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 11)),
                ],
              )
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text("₹${amount.toStringAsFixed(2)}", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
              Text(
                status,
                style: TextStyle(
                  color: status == 'PAID' ? const Color(0xFF34D399) : const Color(0xFFF87171),
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          )
        ],
      ),
    );
  }
}
