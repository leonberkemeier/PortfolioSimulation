"""
Price Alert Model
Manages user-defined price alerts for symbols
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()


class AlertCondition(str, enum.Enum):
    """Alert trigger conditions"""
    ABOVE = "above"
    BELOW = "below"
    CROSSES_ABOVE = "crosses_above"
    CROSSES_BELOW = "crosses_below"


class AlertStatus(str, enum.Enum):
    """Alert status"""
    ACTIVE = "active"
    TRIGGERED = "triggered"
    DISABLED = "disabled"
    EXPIRED = "expired"


class PriceAlert(Base):
    """Price Alert Model"""
    __tablename__ = "price_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)  # For future user management
    symbol = Column(String(20), nullable=False, index=True)
    condition = Column(SQLEnum(AlertCondition), nullable=False)
    target_price = Column(Float, nullable=False)
    status = Column(SQLEnum(AlertStatus), default=AlertStatus.ACTIVE, nullable=False)
    
    # Alert metadata
    message = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    triggered_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    
    # Tracking
    last_checked_price = Column(Float, nullable=True)
    last_checked_at = Column(DateTime, nullable=True)
    trigger_count = Column(Integer, default=0)
    
    # Options
    repeat = Column(Boolean, default=False)  # Re-trigger after first trigger
    notify_browser = Column(Boolean, default=True)
    notify_email = Column(Boolean, default=False)

    def __repr__(self):
        return f"<PriceAlert {self.symbol} {self.condition.value} {self.target_price}>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "symbol": self.symbol,
            "condition": self.condition.value,
            "target_price": self.target_price,
            "status": self.status.value,
            "message": self.message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "triggered_at": self.triggered_at.isoformat() if self.triggered_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "last_checked_price": self.last_checked_price,
            "last_checked_at": self.last_checked_at.isoformat() if self.last_checked_at else None,
            "trigger_count": self.trigger_count,
            "repeat": self.repeat,
            "notify_browser": self.notify_browser,
            "notify_email": self.notify_email
        }
