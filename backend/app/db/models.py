import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.db.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    role = Column(String)  # OWNER, CLIENT_HOTEL, CLIENT_CAFE
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    security_question = Column(String, default="What is your favorite place?")
    security_answer = Column(String, default="Nagpur")
    
    client = relationship("Client", back_populates="users")

class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    business_name = Column(String, index=True)
    client_type = Column(String)  # HOTEL, CAFE
    payment_cycle = Column(String)  # DAILY, WEEKLY, MONTHLY
    credit_limit = Column(Float, default=50000.0)
    current_balance = Column(Float, default=0.0)  # Udhaar amount due
    is_order_locked = Column(Boolean, default=False)
    address = Column(String)
    phone = Column(String)
    contact_person = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    users = relationship("User", back_populates="client")
    orders = relationship("Order", back_populates="client")
    invoices = relationship("Invoice", back_populates="client")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    hindi_name = Column(String)
    category = Column(String)  # Green Vegetables, Root Vegetables, Exotic, Herbs
    default_unit = Column(String, default="KG")  # KG, PETI, BAG, PIECE, GUCHHA
    base_rate_hotel = Column(Float, default=0.0)
    base_rate_cafe = Column(Float, default=0.0)
    image_url = Column(String, nullable=True)
    is_available = Column(Boolean, default=True)

class ClientPriceOverride(Base):
    __tablename__ = "client_price_overrides"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    custom_rate = Column(Float)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    order_date = Column(DateTime, default=datetime.datetime.utcnow)
    delivery_date = Column(String)  # YYYY-MM-DD
    delivery_slot = Column(String, default="Morning 5:00 AM - 7:00 AM")
    status = Column(String, default="PENDING")  # PENDING, PACKED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
    estimated_total = Column(Float, default=0.0)
    actual_final_total = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    
    client = relationship("Client", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    invoice = relationship("Invoice", back_populates="order", uselist=False)
    delivery_route = relationship("DeliveryRoute", back_populates="order", uselist=False)

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    product_name = Column(String)
    unit = Column(String)
    ordered_qty = Column(Float)  # Client requested qty
    actual_packed_qty = Column(Float, nullable=True)  # Final weighted qty at dispatch
    price_per_unit = Column(Float)
    subtotal = Column(Float)
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product")

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True)  # DV-INV-2026-001
    order_id = Column(Integer, ForeignKey("orders.id"))
    client_id = Column(Integer, ForeignKey("clients.id"))
    invoice_date = Column(DateTime, default=datetime.datetime.utcnow)
    due_date = Column(String)
    total_amount = Column(Float)
    balance_due = Column(Float)
    status = Column(String, default="UNPAID")  # UNPAID, PARTIAL, PAID
    pdf_filename = Column(String, nullable=True)
    
    order = relationship("Order", back_populates="invoice")
    client = relationship("Client", back_populates="invoices")

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    amount_paid = Column(Float)
    payment_date = Column(DateTime, default=datetime.datetime.utcnow)
    payment_mode = Column(String)  # UPI, CASH, CHEQUE, BANK_TRANSFER
    reference_no = Column(String, nullable=True)
    notes = Column(String, nullable=True)

class DeliveryRoute(Base):
    __tablename__ = "delivery_routes"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    driver_name = Column(String, default="Ramesh Kumar (Van 04)")
    driver_phone = Column(String, default="+91 98123 45678")
    current_location = Column(String, default="Mandi Hub Yard")
    route_status = Column(String, default="Dispatched from Mandi")  # Dispatched, En Route Hotel Hub, Delivered
    estimated_arrival = Column(String, default="6:15 AM")
    latitude = Column(Float, default=21.1458)
    longitude = Column(Float, default=79.0882)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    order = relationship("Order", back_populates="delivery_route")

class InventoryStock(Base):
    __tablename__ = "inventory_stocks"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, nullable=True)
    item_name = Column(String, index=True)
    unit = Column(String, default="KG")
    leftover_qty = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class PriceHistory(Base):
    __tablename__ = "price_histories"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    base_rate_hotel = Column(Float)
    base_rate_cafe = Column(Float)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)

    product = relationship("Product")


