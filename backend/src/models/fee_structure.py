from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

from ..database import Base


class FeeType(str, enum.Enum):
    FLAT = "flat"  # Fixed amount per trade
    PERCENT = "percent"  # Percentage of transaction
    TIERED = "tiered"  # Volume-based tiers
    ZERO = "zero"  # No fees


class FeeStructure(Base):
    __tablename__ = "fee_structure"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    fee_type = Column(Enum(FeeType), nullable=False)
    fee_amount = Column(Numeric(10, 4), default=0, nullable=False)  # For FLAT: amount, PERCENT: percentage
    description = Column(String(500), nullable=True)

    # Relationships
    portfolio_assignments = relationship("PortfolioFeeAssignment", back_populates="fee_structure", cascade="all, delete-orphan")

    def calculate_fee(self, transaction_amount: float) -> float:
        """Calculate fee based on fee type"""
        if self.fee_type == FeeType.ZERO:
            return 0.0
        elif self.fee_type == FeeType.FLAT:
            return float(self.fee_amount)
        elif self.fee_type == FeeType.PERCENT:
            return transaction_amount * float(self.fee_amount) / 100
        elif self.fee_type == FeeType.TIERED:
            # Tiered: use fee_amount as percentage (could be extended for more complex tiers)
            return transaction_amount * float(self.fee_amount) / 100
        return 0.0

    def __repr__(self):
        return f"<FeeStructure(name={self.name}, type={self.fee_type})>"


class PortfolioFeeAssignment(Base):
    __tablename__ = "portfolio_fee_assignment"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolio.id"), nullable=False)
    fee_structure_id = Column(Integer, ForeignKey("fee_structure.id"), nullable=False)

    # Relationships
    portfolio = relationship("Portfolio", back_populates="fee_assignments")
    fee_structure = relationship("FeeStructure", back_populates="portfolio_assignments")

    def __repr__(self):
        return f"<PortfolioFeeAssignment(portfolio_id={self.portfolio_id}, fee_id={self.fee_structure_id})>"
