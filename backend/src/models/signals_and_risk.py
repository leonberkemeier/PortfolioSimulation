from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import Column, Integer, String, DateTime, Date, Numeric, ForeignKey, Text
from sqlalchemy.orm import relationship

from database import Base


class ModelSignal(Base):
    __tablename__ = "model_signal"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolio.id"), nullable=False)
    ticker = Column(String(20), nullable=False)
    signal_type = Column(String(10), nullable=False)  # buy, sell, hold
    confidence = Column(Numeric(5, 2), nullable=False)  # 0-100, confidence score
    model_name = Column(String(100), nullable=False)  # Linear, CNN, XGBoost, LLM, etc.
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    signal_metadata = Column(Text, nullable=True)  # JSON string with additional signal info

    # Relationships
    portfolio = relationship("Portfolio", back_populates="model_signals")

    def __repr__(self):
        return f"<ModelSignal(ticker={self.ticker}, signal={self.signal_type}, model={self.model_name})>"


class RiskMetric(Base):
    __tablename__ = "risk_metric"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolio.id"), nullable=False)
    date = Column(Date, nullable=False)
    var_95 = Column(Numeric(10, 4), nullable=True)  # Value at Risk (95% confidence)
    var_99 = Column(Numeric(10, 4), nullable=True)  # Value at Risk (99% confidence)
    correlation_matrix = Column(Text, nullable=True)  # JSON string of correlation matrix
    current_drawdown = Column(Numeric(8, 4), nullable=True)  # Current drawdown from peak
    sector_allocation = Column(Text, nullable=True)  # JSON: sector -> percentage
    liquidity_score = Column(Numeric(5, 2), nullable=True)  # 0-100, how liquid the portfolio is

    # Relationships
    portfolio = relationship("Portfolio", back_populates="risk_metrics")

    def __repr__(self):
        return f"<RiskMetric(portfolio_id={self.portfolio_id}, date={self.date}, var_95={self.var_95})>"
