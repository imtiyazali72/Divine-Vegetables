from app.db.database import SessionLocal, engine, Base
from app.db import models
from app.services import cutoff_service, invoice_service

# Create tables
Base.metadata.create_all(bind=engine)
db = SessionLocal()

print("--- 1. Testing Cutoff Service ---")
cutoff = cutoff_service.get_cutoff_status()
print("Cutoff Status:", cutoff)

print("\n--- 2. Querying Seeded Products & Clients ---")
products = db.query(models.Product).all()
print(f"Total Products Seeded: {len(products)}")
for p in products[:3]:
    print(f" - {p.name} ({p.hindi_name}): Hotel Base ₹{p.base_rate_hotel}/kg | Cafe Base ₹{p.base_rate_cafe}/kg")

clients = db.query(models.Client).all()
print(f"Total Clients Seeded: {len(clients)}")
for c in clients:
    print(f" - {c.business_name} ({c.client_type}): Cycle {c.payment_cycle}, Balance ₹{c.current_balance}")

print("\n--- 3. Testing PDF Invoice Generation for Divine Vegetables ---")
order_data = {
    "id": 101,
    "invoice_number": "DV-INV-2026-0101",
    "order_date": "13 Sep 2026"
}
client_data = {
    "business_name": "Grand Palace Hotel",
    "client_type": "HOTEL",
    "payment_cycle": "WEEKLY",
    "address": "74 Ring Road, Hotel District",
    "phone": "+91 98234 56789",
    "contact_person": "Chef Rajesh",
    "current_balance": 14500.0
}
items_data = [
    {"product_name": "Potato (Aloo)", "unit": "KG", "ordered_qty": 50.0, "actual_packed_qty": 51.5, "price_per_unit": 24.0},
    {"product_name": "Tomato Hybrid (Tamatar)", "unit": "KG", "ordered_qty": 30.0, "actual_packed_qty": 29.8, "price_per_unit": 38.0},
    {"product_name": "Onion Red (Pyaz)", "unit": "KG", "ordered_qty": 40.0, "actual_packed_qty": 40.0, "price_per_unit": 32.0},
    {"product_name": "Paneer Fresh Dairy", "unit": "KG", "ordered_qty": 10.0, "actual_packed_qty": 10.2, "price_per_unit": 320.0}
]

pdf_path = invoice_service.generate_invoice_pdf(order_data, client_data, items_data)
print(f"✅ Generated Divine Vegetables Branded PDF Invoice at: {pdf_path}")

db.close()
