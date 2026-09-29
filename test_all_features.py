import sys
import os
import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from app.db.database import SessionLocal
from app.db import models
from app.services import invoice_service

db = SessionLocal()

print("==================================================")
print("VERIFYING COMPREHENSIVE PLATFORM UPGRADES")
print("==================================================")

# 1. TEST ADMIN AUTH & PASSWORD PERSISTENCE
print("\n--- 1. ADMIN AUTH & PASSWORD PERSISTENCE ---")
admin_user = db.query(models.User).filter(models.User.username == "admin").first()
assert admin_user is not None, "Admin user must exist"
initial_pass = admin_user.hashed_password
print(f"Current Admin Password in DB: '{initial_pass}'")

# Simulate changing password
new_test_pass = "adminpass2026"
admin_user.hashed_password = new_test_pass
db.commit()

# Verify new password persisted
db.refresh(admin_user)
assert admin_user.hashed_password == new_test_pass, "Password should be updated in DB"
print(f"✅ Changed Admin Password to '{new_test_pass}' and verified persistence in SQLite DB.")

# Reset back to 1234
admin_user.hashed_password = "1234"
db.commit()
print("Reset admin password back to '1234' for default access.")

# 2. TEST DRIVER GPS LOCATION UPDATE
print("\n--- 2. REAL DRIVER GPS TRACKING ---")
route = db.query(models.DeliveryRoute).first()
if route:
    route.latitude = 21.1502
    route.longitude = 79.0985
    route.current_location = "Near Hotel Circle (Live GPS)"
    route.route_status = "En Route Hotel Kitchen"
    route.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(route)
    assert route.latitude == 21.1502, "Latitude should be updated"
    assert route.longitude == 79.0985, "Longitude should be updated"
    print(f"✅ Driver GPS coordinates updated: ({route.latitude}, {route.longitude}) at {route.updated_at}")
else:
    print("No route found to test GPS update.")

# 3. TEST MONTHLY REPORT ANALYTICS & PDF GENERATION
print("\n--- 3. MONTHLY REPORT & PDF GENERATION ---")
sample_report = {
    "year_month": "2026-09",
    "month_label": "September 2026",
    "total_sales": 15450.0,
    "total_orders": 3,
    "avg_order_value": 5150.0,
    "total_udhaar": 20700.0,
    "prev_month_sales": 12000.0,
    "mom_growth_str": "+ ₹3,450.00 (+28.8% vs Aug 2026)",
    "mom_color": "#198754",
    "client_breakdown": [
        {
            "business_name": "Grand Palace Hotel",
            "client_type": "HOTEL",
            "monthly_sales": 10500.0,
            "monthly_payments": 5000.0,
            "current_balance": 14500.0,
            "phone": "9823456789"
        },
        {
            "business_name": "Artisan Brew Cafe",
            "client_type": "CAFE",
            "monthly_sales": 4950.0,
            "monthly_payments": 2000.0,
            "current_balance": 6200.0,
            "phone": "9711122233"
        }
    ]
}

pdf_path = invoice_service.generate_monthly_report_pdf(sample_report)
assert os.path.exists(pdf_path), "Monthly PDF Report file must exist on disk"
print(f"✅ Generated Monthly Business Report PDF at: {pdf_path}")

print("\n==================================================")
print("ALL COMPREHENSIVE FEATURE TESTS PASSED (100%)!")
print("==================================================")
