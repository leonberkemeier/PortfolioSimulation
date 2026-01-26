from datetime import date
from decimal import Decimal
from sqlalchemy import Column, Integer, Date, Numeric, ForeignKey, Text
from sqlalchemy.orm import relationship

from database import Base


class PortfolioSnapshot(Base):
    __tablename__ = "portfolio_snapshot"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolio.id"), nullable=False)
    date = Column(Date, nullable=False)
    nav = Column(Numeric(15, 2), nullable=False)  # Net Asset Value
    total_return = Column(Numeric(10, 4), nullable=False)  # Return % from initial capital
    cash_balance = Column(Numeric(15, 2), nullable=False)

    # Relationships
    portfolio = relationship("Portfolio", back_populates="snapshots")

    def __repr__(self):
        return f"<PortfolioSnapshot(portfolio_id={self.portfolio_id}, date={self.date}, nav={self.nav})>"


class PerformanceMetric(Base):
    __tablename__ = "performance_metric"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolio.id"), nullable=False)
    date = Column(Date, nullable=False)
    sharpe_ratio = Column(Numeric(8, 4), nullable=True)  # Risk-adjusted return
    sortino_ratio = Column(Numeric(8, 4), nullable=True)  # Downside risk-adjusted
    max_drawdown = Column(Numeric(8, 4), nullable=True)  # Worst peak-to-trough
    volatility = Column(Numeric(8, 4), nullable=True)  # Standard deviation of returns
    win_rate = Column(Numeric(5, 2), nullable=True)  # Percentage of profitable trades
    avg_win = Column(Numeric(10, 4), nullable=True)  # Average winning trade %
    avg_loss = Column(Numeric(10, 4), nullable=True)  # Average losing trade %
    total_trades = Column(Integer, nullable=True)  # Number of closed trades

    # Relationships
    portfolio = relationship("Portfolio", back_populates="performance_metrics")

    def __repr__(self):
        return f"<PerformanceMetric(portfolio_id={self.portfolio_id}, date={self.date}, sharpe={self.sharpe_ratio})>"
