from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

from ..database import Base


class AssetType(str, enum.Enum):
    STOCK = "stock"
    CRYPTO = "crypto"
    BOND = "bond"
    COMMODITY = "commodity"


class OrderType(str, enum.Enum):
    BUY = "buy"
    SELL = "sell"


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    FILLED = "filled"
    PARTIAL = "partial"
    CANCELLED = "cancelled"


class Holding(Base):
    __tablename__ = "holding"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolio.id"), nullable=False)
    asset_type = Column(Enum(AssetType), nullable=False)
    ticker = Column(String(20), nullable=False)
    quantity = Column(Numeric(15, 8), nullable=False)
    entry_price = Column(Numeric(15, 8), nullable=False)
    entry_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    current_price = Column(Numeric(15, 8), nullable=True)
    dividend_yield = Column(Numeric(10, 4), nullable=True)  # Annual yield percentage (e.g., 3.5 for 3.5%)

    # Relationships
    portfolio = relationship("Portfolio", back_populates="holdings")

    @property
    def entry_value(self) -> Decimal:
        """Total value at entry (quantity * entry_price)"""
        return self.quantity * self.entry_price

    @property
    def current_value(self) -> Decimal:
        """Current value if current_price is available"""
        if self.current_price:
            return self.quantity * self.current_price
        return self.entry_value

    @property
    def unrealized_pl(self) -> Decimal:
        """Unrealized profit/loss"""
        return self.current_value - self.entry_value

    @property
    def unrealized_pl_pct(self) -> float:
        """Unrealized P&L as percentage"""
        if self.entry_value == 0:
            return 0.0
        return float(self.unrealized_pl / self.entry_value * 100)

    @property
    def annual_income(self) -> Decimal:
        """Estimated annual dividend/yield income"""
        if not self.dividend_yield or not self.current_price:
            return Decimal('0')
        # Calculate annual income: current_value * (yield / 100)
        return self.current_value * (self.dividend_yield / Decimal('100'))

    def __repr__(self):
        return f"<Holding(ticker={self.ticker}, qty={self.quantity}, value={self.current_value})>"


class Transaction(Base):
    __tablename__ = "transaction"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolio.id"), nullable=False)
    asset_type = Column(Enum(AssetType), nullable=False)
    ticker = Column(String(20), nullable=False)
    order_type = Column(Enum(OrderType), nullable=False)
    quantity = Column(Numeric(15, 8), nullable=False)
    price = Column(Numeric(15, 8), nullable=False)
    fee = Column(Numeric(15, 2), default=0, nullable=False)
    total_cost = Column(Numeric(15, 2), nullable=False)  # quantity * price + fee for buy, quantity * price - fee for sell
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    portfolio = relationship("Portfolio", back_populates="transactions")

    def __repr__(self):
        return f"<Transaction(ticker={self.ticker}, type={self.order_type}, qty={self.quantity}, price={self.price})>"
