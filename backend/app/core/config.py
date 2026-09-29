import os
try:
    from pydantic_settings import BaseSettings
except ImportError:
    try:
        from pydantic import BaseSettings
    except ImportError:
        from pydantic import BaseModel as BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Divine Vegetables B2B Engine"
    BUSINESS_NAME: str = "Divine Vegetables"
    BUSINESS_TAGLINE: str = "Premium B2B Fresh Produce Supplier"
    BUSINESS_PHONE: str = "+91 98765 43210"
    BUSINESS_EMAIL: str = "orders@divinevegetables.com"
    BUSINESS_ADDRESS: str = "Plot 42, Mandi Yard, Wholesale Market Complex"
    UPI_ID: str = "divineveg@upi"
    
    # Ordering Cutoff Window (10:00 PM to 2:30 AM next day)
    CUTOFF_START_HOUR: int = 22    # 10:00 PM
    CUTOFF_END_HOUR: int = 2       # 2:00 AM
    CUTOFF_END_MINUTE: int = 30    # 30 mins -> 2:30 AM
    
    SECRET_KEY: str = "DIVINE_VEGETABLES_SUPER_SECRET_KEY_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "sqlite:///./divine_vegetables.db")
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    class Config:
        case_sensitive = True

settings = Settings()

