"""Pydantic schemas for API request/response validation."""

from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, validator


# ============ Portfolio Schemas ============

class PortfolioCreateRequest(BaseModel):
    """Request to create a new portfolio."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    initial_capital: float = Field(..., gt=0)
    model_name: Optional[str] = Field(None, max_length=100)
    max_position_size: Optional[float] = Field(None, ge=0, le=100)
    max_cash_per_trade: Optional[float] = Field(None, gt=0)
    max_allocation_per_asset_class: Optional[float] = Field(None, ge=0, le=100)
    fee_structure_id: Optional[int] = Field(None)


class PortfolioUpdateRequest(BaseModel):
    """Request to update portfolio settings."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    max_position_size: Optional[float] = Field(None, ge=0, le=100)
    max_cash_per_trade: Optional[float] = Field(None, gt=0)
    max_allocation_per_asset_class: Optional[float] = Field(None, ge=0, le=100)


class PortfolioResponse(BaseModel):
    """Portfolio response with current state."""
    id: int
    name: str
    description: Optional[str]
    initial_capital: Decimal
    current_cash: Decimal
    nav: Decimal
    total_return_pct: float
    deployed_capital: Decimal
    deployed_pct: float
    available_cash_pct: float
    status: str
    model_name: Optional[str]
    creation_date: datetime
    max_position_size: Optional[float]
    max_cash_per_trade: Optional[float]
    max_allocation_per_asset_class: Optional[float]

    class Config:
        from_attributes = True


class PortfolioListResponse(BaseModel):
    """List of portfolios with summary stats."""
    portfolios: List[PortfolioResponse]
    total_count: int
    total_nav: Decimal


# ============ Order Schemas ============

class OrderRequest(BaseModel):
    """Request to place a buy or sell order."""
    ticker: str = Field(..., min_length=1, max_length=20)
    asset_type: str = Field(..., pattern="^(stock|crypto|bond|commodity)$")
    quantity: float = Field(..., gt=0)
    order_type: str = Field(..., pattern="^(buy|sell)$")
    fee_structure_id: Optional[int] = Field(None)


class OrderResponse(BaseModel):
    """Confirmation of order execution."""
    status: str
    ticker: str
    asset_type: str
    order_type: str
    quantity: Decimal
    price: Decimal
    fee: Decimal
    total_cost: Decimal
    timestamp: datetime
    message: str
    order_id: Optional[int]


class TransactionResponse(BaseModel):
    """Transaction details from history."""
    id: int
    ticker: str
    asset_type: str
    order_type: str
    quantity: Decimal
    price: Decimal
    fee: Decimal
    total_cost: Decimal
    timestamp: datetime

    class Config:
        from_attributes = True


class HoldingResponse(BaseModel):
    """Current portfolio holding."""
    id: int
    ticker: str
    asset_type: str
    quantity: Decimal
    entry_price: Decimal
    current_price: Optional[Decimal]
    entry_value: Decimal
    current_value: Decimal
    unrealized_pl: Decimal
    unrealized_pl_pct: float

    class Config:
        from_attributes = True


class OrderHistoryResponse(BaseModel):
    """Order history with pagination."""
    transactions: List[TransactionResponse]
    total_count: int


# ============ Performance Schemas ============

class PerformanceMetricResponse(BaseModel):
    """Performance metrics for a portfolio."""
    portfolio_id: int
    date: date
    sharpe_ratio: Optional[Decimal]
    sortino_ratio: Optional[Decimal]
    max_drawdown: Optional[Decimal]
    volatility: Optional[Decimal]
    win_rate: Optional[Decimal]
    avg_win: Optional[Decimal]
    avg_loss: Optional[Decimal]
    total_trades: Optional[int]

    class Config:
        from_attributes = True


class PortfolioSnapshotResponse(BaseModel):
    """Daily portfolio snapshot."""
    portfolio_id: int
    date: date
    nav: Decimal
    total_return: Decimal
    cash_balance: Decimal

    class Config:
        from_attributes = True


class SnapshotHistoryResponse(BaseModel):
    """Historical snapshots with pagination."""
    snapshots: List[PortfolioSnapshotResponse]
    total_count: int


class RiskAnalyticsResponse(BaseModel):
    """Risk metrics for portfolio."""
    portfolio_id: int
    date: date
    var_95: Optional[Decimal]
    var_99: Optional[Decimal]
    current_drawdown: Optional[Decimal]
    sector_allocation: Optional[Dict[str, float]]
    liquidity_score: Optional[Decimal]

    class Config:
        from_attributes = True


class AllocationResponse(BaseModel):
    """Asset allocation breakdown."""
    stock: Optional[float]
    crypto: Optional[float]
    bond: Optional[float]
    commodity: Optional[float]
    cash: float


# ============ Fee Structure Schemas ============

class FeeStructureResponse(BaseModel):
    """Fee structure details."""
    id: int
    name: str
    fee_type: str
    fee_amount: Decimal
    description: Optional[str]

    class Config:
        from_attributes = True


# ============ Error Schemas ============

class ErrorResponse(BaseModel):
    """Standard error response."""
    status_code: int
    error: str
    message: str
    details: Optional[Dict] = None


# ============ Model Signal Schemas ============

class ModelSignalRequest(BaseModel):
    """Request to record a model signal."""
    ticker: str = Field(..., min_length=1, max_length=20)
    signal_type: str = Field(..., pattern="^(buy|sell|hold)$")
    confidence: float = Field(..., ge=0, le=100)
    model_name: str = Field(..., min_length=1, max_length=100)
    signal_metadata: Optional[str] = None


class ModelSignalResponse(BaseModel):
    """Model signal details."""
    id: int
    portfolio_id: int
    ticker: str
    signal_type: str
    confidence: Decimal
    model_name: str
    timestamp: datetime
    signal_metadata: Optional[str]

    class Config:
        from_attributes = True


# ============ Model Comparison Schemas ============

class ModelPerformanceResponse(BaseModel):
    """Performance comparison for a model."""
    model_name: str
    total_signals: int
    win_rate: Optional[float]
    avg_win: Optional[float]
    avg_loss: Optional[float]
    sharpe_ratio: Optional[float]
    total_pnl: Decimal


class ModelComparisonResponse(BaseModel):
    """Comparison of multiple models."""
    portfolio_id: int
    models: List[ModelPerformanceResponse]
    date: date


# ============ Health Check ============

class HealthCheckResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    timestamp: datetime
