from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, Integer, String, DateTime, Numeric, Enum
from sqlalchemy.orm import relationship
import enum

from database import Base


class PortfolioStatus(str, enum.Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"


class Portfolio(Base):
    __tablename__ = "portfolio"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    initial_capital = Column(Numeric(15, 2), nullable=False)  # Total budget to manage
    current_cash = Column(Numeric(15, 2), nullable=False)  # Available cash
    max_cash_per_trade = Column(Numeric(15, 2), nullable=True)  # Max cash to deploy per single trade
    max_position_size = Column(Numeric(5, 2), nullable=True)  # Max % of portfolio per position (0-100)
    max_allocation_per_asset_class = Column(Numeric(5, 2), nullable=True)  # Max % per asset class (0-100)
    creation_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(Enum(PortfolioStatus), default=PortfolioStatus.ACTIVE, nullable=False)
    model_name = Column(String(100), nullable=True)  # Linear, CNN, XGBoost, LLM, or None for manual

    # Relationships
    holdings = relationship("Holding", back_populates="portfolio", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="portfolio", cascade="all, delete-orphan")
    snapshots = relationship("PortfolioSnapshot", back_populates="portfolio", cascade="all, delete-orphan")
    performance_metrics = relationship("PerformanceMetric", back_populates="portfolio", cascade="all, delete-orphan")
    model_signals = relationship("ModelSignal", back_populates="portfolio", cascade="all, delete-orphan")
    risk_metrics = relationship("RiskMetric", back_populates="portfolio", cascade="all, delete-orphan")
    fee_assignments = relationship("PortfolioFeeAssignment", back_populates="portfolio", cascade="all, delete-orphan")

    @property
    def total_value(self) -> Decimal:
        """Calculate total portfolio value (holdings + cash)"""
        holdings_value = sum(
            h.quantity * h.current_price for h in self.holdings if h.current_price
        )
        return Decimal(holdings_value) + self.current_cash

    @property
    def nav(self) -> Decimal:
        """Net Asset Value = total value"""
        return self.total_value

    @property
    def total_return_pct(self) -> float:
        """Total return as percentage from initial capital"""
        if self.initial_capital == 0:
            return 0.0
        return float((self.total_value - self.initial_capital) / self.initial_capital * 100)

    @property
    def deployed_capital(self) -> Decimal:
        """Capital currently deployed in holdings"""
        return self.total_value - self.current_cash

    @property
    def available_cash_pct(self) -> float:
        """Percentage of initial capital available as cash"""
        if self.initial_capital == 0:
            return 0.0
        return float(self.current_cash / self.initial_capital * 100)

    @property
    def deployed_pct(self) -> float:
        """Percentage of initial capital deployed in positions"""
        if self.initial_capital == 0:
            return 0.0
        return float(self.deployed_capital / self.initial_capital * 100)

    def can_afford_trade(self, trade_amount: Decimal) -> bool:
        """Check if portfolio has enough cash for a trade"""
        return self.current_cash >= trade_amount

    def can_place_order(self, order_size: Decimal) -> bool:
        """Check if order respects position size limit"""
        if not self.max_position_size or self.total_value == 0:
            return True
        position_pct = (order_size / self.total_value) * 100
        return position_pct <= self.max_position_size

    def __repr__(self):
        return f"<Portfolio(id={self.id}, name={self.name}, nav={self.nav}, cash={self.current_cash})>"
