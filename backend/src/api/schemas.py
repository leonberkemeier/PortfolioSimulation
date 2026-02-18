"""Pydantic schemas for API request/response validation."""

from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, validator


# ============ Auth Schemas ============

class UserRegisterRequest(BaseModel):
    """Request to register a new user (admin only)."""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)
    full_name: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, max_length=100)
    is_superuser: Optional[bool] = Field(False)


class UserLoginRequest(BaseModel):
    """Request to login."""
    username: str
    password: str


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """User information response."""
    id: int
    username: str
    email: Optional[str]
    full_name: Optional[str]
    is_active: bool
    is_superuser: bool
    created_at: datetime

    class Config:
        from_attributes = True


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
    dividend_yield: Optional[Decimal]
    annual_income: Optional[Decimal]
    pe_ratio: Optional[Decimal]

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


# ============ Signal Execution Schemas ============

class TradeSignalItem(BaseModel):
    """A single trade signal from model_regime_comparison."""
    ticker: str = Field(..., min_length=1, max_length=20)
    signal_type: str = Field(..., pattern="^(BUY|SELL|HOLD)$")
    model_name: str = Field(..., min_length=1, max_length=100)
    date: str  # ISO format date
    
    # Position sizing
    suggested_weight: float = Field(..., ge=0, le=1)
    suggested_quantity: Optional[int] = None
    
    # Quality metrics
    score: float = Field(..., ge=0, le=100)
    ev: float  # Expected value
    p_win: float = Field(..., ge=0, le=1)
    confidence: float = Field(..., ge=0, le=1)
    kelly_fraction: float
    
    # Context
    reason: str
    current_price: Optional[float] = None
    asset_type: Optional[str] = Field("stock", pattern="^(stock|crypto|bond|commodity)$")


class ExecuteSignalsRequest(BaseModel):
    """Request to execute multiple trade signals."""
    signals: List[TradeSignalItem]
    dry_run: bool = False  # If True, simulate without executing


class SignalExecutionResult(BaseModel):
    """Result of a single signal execution."""
    ticker: str
    signal_type: str
    success: bool
    order_id: Optional[int] = None
    quantity: Optional[float] = None
    price: Optional[float] = None
    total_cost: Optional[float] = None
    message: str
    error: Optional[str] = None


class ExecuteSignalsResponse(BaseModel):
    """Response from executing signals."""
    portfolio_id: int
    model_name: str
    total_signals: int
    executed: int
    failed: int
    skipped: int
    results: List[SignalExecutionResult]
    portfolio_nav_after: Optional[float] = None
    timestamp: datetime


class OpportunitySummaryRequest(BaseModel):
    """Request to get opportunity summary without executing."""
    scores: List[Dict]  # Raw score data
    model_name: str


class OpportunitySummaryResponse(BaseModel):
    """Summary of available opportunities."""
    status: str
    total_scores: int
    positive_ev_count: int
    qualified_opportunities: int
    best_ev: float
    avg_ev: float
    recommendation: str  # "trade" or "wait"
    model_name: str
    date: str


# ============ Model Analytics Schemas ============

class SignalHistoryItem(BaseModel):
    """A single signal from history."""
    id: int
    ticker: str
    signal_type: str
    confidence: float
    model_name: str
    timestamp: datetime
    signal_metadata: Optional[str] = None

    class Config:
        from_attributes = True


class TradeOutcome(BaseModel):
    """Outcome of a trade (buy then sell)."""
    ticker: str
    buy_price: float
    sell_price: float
    quantity: float
    pnl: float
    pnl_pct: float
    holding_days: int
    is_winner: bool


class ModelAnalyticsResponse(BaseModel):
    """Comprehensive analytics for a model."""
    model_name: str
    portfolio_id: Optional[int] = None
    portfolio_exists: bool
    
    # Portfolio metrics
    nav: Optional[float] = None
    total_return_pct: Optional[float] = None
    initial_capital: Optional[float] = None
    current_cash: Optional[float] = None
    deployed_capital: Optional[float] = None
    
    # Signal statistics
    total_signals: int = 0
    buy_signals: int = 0
    sell_signals: int = 0
    hold_signals: int = 0
    avg_confidence: Optional[float] = None
    
    # Trade statistics
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    win_rate: Optional[float] = None
    avg_win_pct: Optional[float] = None
    avg_loss_pct: Optional[float] = None
    profit_factor: Optional[float] = None  # gross profit / gross loss
    
    # Position info
    current_positions: int = 0
    position_tickers: List[str] = []
    
    # Recent activity
    recent_signals: List[SignalHistoryItem] = []
    recent_trades: List[TradeOutcome] = []
    
    # Time info
    first_signal_date: Optional[datetime] = None
    last_signal_date: Optional[datetime] = None
    portfolio_age_days: Optional[int] = None


class ModelComparisonSummary(BaseModel):
    """Summary for comparing multiple models."""
    models: List[ModelAnalyticsResponse]
    total_models: int
    best_performer: Optional[str] = None  # model_name with highest return
    highest_win_rate: Optional[str] = None  # model_name with best win rate
    most_active: Optional[str] = None  # model_name with most trades
    timestamp: datetime


# ============ Screener Schemas ============

class ScreenerOpportunity(BaseModel):
    """A single screener opportunity."""
    ticker: str
    category: str  # dividend, volatility, combined
    dividend_yield: Optional[float] = None
    volatility_percentile: Optional[float] = None
    historical_volatility: Optional[float] = None
    pe_ratio: Optional[float] = None
    market_cap: Optional[float] = None
    last_updated: Optional[str] = None


class ScreenerStatsResponse(BaseModel):
    """Screener statistics and opportunities."""
    dividend_opportunities: List[ScreenerOpportunity]
    volatility_opportunities: List[ScreenerOpportunity]
    combined_opportunities: List[ScreenerOpportunity]
    dividend_count: int
    volatility_count: int
    combined_count: int
    last_scan_date: Optional[str] = None
    status: str


# ============ Health Check ============

class HealthCheckResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    timestamp: datetime
