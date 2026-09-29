from typing import List, Optional
from pydantic import BaseModel
import datetime

class UserBase(BaseModel):
    username: str
    full_name: str
    role: str

class UserCreate(UserBase):
    password: str
    client_id: Optional[int] = None

class UserOut(UserBase):
    id: int
    client_id: Optional[int] = None
    class Config:
        from_attributes = True

class ClientBase(BaseModel):
    business_name: str
    client_type: str  # HOTEL, CAFE
    payment_cycle: str  # DAILY, WEEKLY, MONTHLY
    credit_limit: float = 50000.0
    address: str
    phone: str
    contact_person: str

class ClientCreate(ClientBase):
    pass

class ClientOut(ClientBase):
    id: int
    current_balance: float
    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    hindi_name: Optional[str] = None
    category: str
    default_unit: str = "KG"
    base_rate_hotel: float
    base_rate_cafe: float
    image_url: Optional[str] = None
    is_available: bool = True

class ProductOut(ProductBase):
    id: int
    effective_rate_for_client: Optional[float] = None
    class Config:
        from_attributes = True

class PriceOverrideCreate(BaseModel):
    client_id: int
    product_id: int
    custom_rate: float

class OrderItemCreate(BaseModel):
    product_id: int
    ordered_qty: float

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    delivery_date: str
    notes: Optional[str] = None

class WeightItemUpdate(BaseModel):
    item_id: int
    actual_packed_qty: float

class OrderFulfillUpdate(BaseModel):
    order_id: int
    items: List[WeightItemUpdate]

class OrderOut(BaseModel):
    id: int
    order_number: str
    client_id: int
    order_date: datetime.datetime
    delivery_date: str
    delivery_slot: str
    status: str
    estimated_total: float
    actual_final_total: float
    notes: Optional[str] = None
    class Config:
        from_attributes = True

class InvoiceOut(BaseModel):
    id: int
    invoice_number: str
    order_id: int
    client_id: int
    invoice_date: datetime.datetime
    due_date: str
    total_amount: float
    balance_due: float
    status: str
    pdf_filename: Optional[str] = None
    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    client_id: int
    invoice_id: Optional[int] = None
    amount_paid: float
    payment_mode: str
    reference_no: Optional[str] = None
    notes: Optional[str] = None
