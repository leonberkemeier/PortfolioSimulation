"""Analytics and performance endpoints."""

from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import date
import yfinance as yf

from ...database import get_db
from ...models import Portfolio, PerformanceMetric, PortfolioSnapshot, RiskMetric
from ..schemas import (
    PerformanceMetricResponse, PortfolioSnapshotResponse, RiskAnalyticsResponse,
    SnapshotHistoryResponse, AllocationResponse
)
from ...services.performance_calculator import PerformanceCalculator
from ...services.technical_indicators import TechnicalIndicators
from ...services.advanced_metrics import AdvancedMetrics

router = APIRouter()


@router.get(
    "/{portfolio_id}/performance",
    response_model=PerformanceMetricResponse,
    summary="Get current performance metrics"
)
async def get_performance_metrics(
    portfolio_id: int,
    db: Session = Depends(get_db)
):
    """Get latest performance metrics for a portfolio."""
    portfolio = db.query(Portfolio).get(portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )

    metric = (
        db.query(PerformanceMetric)
        .filter_by(portfolio_id=portfolio_id)
        .order_by(PerformanceMetric.date.desc())
        .first()
    )

    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No performance metrics available"
        )

    return PerformanceMetricResponse.from_orm(metric)


@router.get(
    "/{portfolio_id}/snapshots",
    response_model=SnapshotHistoryResponse,
    summary="Get portfolio snapshots history"
)
async def get_snapshots(
    portfolio_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get historical daily snapshots for a portfolio."""
    portfolio = db.query(Portfolio).get(portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )

    query = (
        db.query(PortfolioSnapshot)
        .filter_by(portfolio_id=portfolio_id)
        .order_by(PortfolioSnapshot.date.desc())
    )
    total_count = query.count()
    snapshots = query.offset(skip).limit(limit).all()

    return SnapshotHistoryResponse(
        snapshots=[PortfolioSnapshotResponse.from_orm(s) for s in snapshots],
        total_count=total_count
    )


@router.get(
    "/{portfolio_id}/risk",
    response_model=RiskAnalyticsResponse,
    summary="Get risk analytics"
)
async def get_risk_analytics(
    portfolio_id: int,
    db: Session = Depends(get_db)
):
    """Get latest risk metrics for a portfolio."""
    portfolio = db.query(Portfolio).get(portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )

    metric = (
        db.query(RiskMetric)
        .filter_by(portfolio_id=portfolio_id)
        .order_by(RiskMetric.date.desc())
        .first()
    )

    if not metric:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No risk metrics available"
        )

    return RiskAnalyticsResponse.from_orm(metric)


@router.get(
    "/{portfolio_id}/allocation",
    response_model=AllocationResponse,
    summary="Get asset allocation"
)
async def get_allocation(
    portfolio_id: int,
    db: Session = Depends(get_db)
):
    """Get current asset allocation for a portfolio."""
    portfolio = db.query(Portfolio).get(portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )

    calc = PerformanceCalculator(db)
    allocation = calc.calculate_asset_allocation(portfolio)

    return AllocationResponse(
        stock=allocation.get("stock", 0),
        crypto=allocation.get("crypto", 0),
        bond=allocation.get("bond", 0),
        commodity=allocation.get("commodity", 0),
        cash=allocation.get("cash", 0)
    )


@router.post(
    "/{portfolio_id}/snapshot",
    response_model=PortfolioSnapshotResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create daily snapshot"
)
async def create_snapshot(
    portfolio_id: int,
    snapshot_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Create a daily snapshot of portfolio state."""
    portfolio = db.query(Portfolio).get(portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )

    calc = PerformanceCalculator(db)
    snapshot = calc.create_daily_snapshot(portfolio, snapshot_date)

    return PortfolioSnapshotResponse.from_orm(snapshot)


@router.post(
    "/{portfolio_id}/metrics",
    response_model=PerformanceMetricResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Calculate performance metrics"
)
async def calculate_metrics(
    portfolio_id: int,
    metric_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Calculate performance metrics for a portfolio."""
    portfolio = db.query(Portfolio).get(portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )

    calc = PerformanceCalculator(db)
    metric = calc.create_performance_metrics(portfolio, metric_date)

    return PerformanceMetricResponse.from_orm(metric)


# ============ Technical Indicators ============

@router.get(
    "/indicators/{symbol}",
    summary="Get technical indicators for a symbol"
)
async def get_technical_indicators(
    symbol: str,
    period: str = Query("3mo", description="Time period: 1mo, 3mo, 6mo, 1y, 2y, 5y"),
    interval: str = Query("1d", description="Data interval: 1d, 1wk, 1mo")
):
    """
    Calculate technical indicators for a symbol.
    
    Returns moving averages, RSI, MACD, Bollinger Bands, and trading signals.
    """
    try:
        # Fetch historical data from Yahoo Finance
        ticker = yf.Ticker(symbol.upper())
        hist = ticker.history(period=period, interval=interval)
        
        if hist.empty:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No data found for symbol '{symbol}'"
            )
        
        # Extract closing prices
        prices = hist['Close'].tolist()
        
        # Calculate all indicators
        indicators = TechnicalIndicators.calculate_all_indicators(prices)
        
        # Get latest values
        latest_values = TechnicalIndicators.get_latest_values(indicators)
        
        # Generate signals
        signals = TechnicalIndicators.generate_signals(indicators, prices)
        
        # Prepare response with chart data
        timestamps = [str(ts) for ts in hist.index]
        
        return {
            "symbol": symbol.upper(),
            "period": period,
            "interval": interval,
            "data_points": len(prices),
            "current_price": round(prices[-1], 2) if prices else None,
            "indicators": {
                "moving_averages": {
                    "sma_20": latest_values.get('sma_20'),
                    "sma_50": latest_values.get('sma_50'),
                    "sma_200": latest_values.get('sma_200'),
                    "ema_12": latest_values.get('ema_12'),
                    "ema_26": latest_values.get('ema_26')
                },
                "rsi": {
                    "value": latest_values.get('rsi'),
                    "signal": "OVERBOUGHT" if latest_values.get('rsi', 50) > 70 else "OVERSOLD" if latest_values.get('rsi', 50) < 30 else "NEUTRAL"
                },
                "macd": {
                    "macd": latest_values.get('macd'),
                    "signal": latest_values.get('macd_signal'),
                    "histogram": latest_values.get('macd_histogram'),
                    "trend": "BULLISH" if latest_values.get('macd', 0) > latest_values.get('macd_signal', 0) else "BEARISH"
                },
                "bollinger_bands": {
                    "upper": latest_values.get('bb_upper'),
                    "middle": latest_values.get('bb_middle'),
                    "lower": latest_values.get('bb_lower'),
                    "width": round(latest_values.get('bb_upper', 0) - latest_values.get('bb_lower', 0), 2) if latest_values.get('bb_upper') else None
                }
            },
            "signals": signals,
            "chart_data": {
                "timestamps": timestamps,
                "prices": prices,
                "sma_20": indicators.get('sma_20'),
                "sma_50": indicators.get('sma_50'),
                "sma_200": indicators.get('sma_200'),
                "rsi": indicators.get('rsi'),
                "macd": indicators.get('macd'),
                "macd_signal": indicators.get('macd_signal'),
                "bb_upper": indicators.get('bb_upper'),
                "bb_middle": indicators.get('bb_middle'),
                "bb_lower": indicators.get('bb_lower')
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating indicators: {str(e)}"
        )


# ============ Advanced Portfolio Metrics ============

@router.get(
    "/{portfolio_id}/advanced-metrics",
    summary="Get advanced performance metrics"
)
async def get_advanced_metrics(
    portfolio_id: int,
    db: Session = Depends(get_db)
):
    """
    Calculate advanced metrics: Sharpe, Sortino, Max Drawdown, Alpha, Beta, VaR.
    """
    portfolio = db.query(Portfolio).get(portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Get NAV history
    snapshots = (
        db.query(PortfolioSnapshot)
        .filter_by(portfolio_id=portfolio_id)
        .order_by(PortfolioSnapshot.date.asc())
        .all()
    )
    
    if len(snapshots) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient history to calculate metrics (need at least 2 data points)"
        )
    
    # Extract NAV values
    nav_values = [float(s.total_value) for s in snapshots]
    
    # Calculate all metrics
    metrics = AdvancedMetrics.calculate_all_metrics(nav_values)
    
    # Get risk assessment
    risk_level = AdvancedMetrics.get_risk_assessment(metrics)
    
    return {
        "portfolio_id": portfolio_id,
        "portfolio_name": portfolio.name,
        "data_points": len(nav_values),
        "start_value": nav_values[0],
        "current_value": nav_values[-1],
        "metrics": {
            "returns": {
                "total_return_pct": metrics.get('total_return_pct'),
            },
            "risk_adjusted": {
                "sharpe_ratio": metrics.get('sharpe_ratio'),
                "sortino_ratio": metrics.get('sortino_ratio'),
                "calmar_ratio": metrics.get('calmar_ratio')
            },
            "risk": {
                "volatility_pct": metrics.get('volatility_pct'),
                "max_drawdown_pct": metrics.get('max_drawdown_pct'),
                "current_drawdown_pct": metrics.get('current_drawdown_pct'),
                "value_at_risk_95_pct": round(metrics.get('value_at_risk_95', 0) * 100, 2) if metrics.get('value_at_risk_95') else None,
                "value_at_risk_99_pct": round(metrics.get('value_at_risk_99', 0) * 100, 2) if metrics.get('value_at_risk_99') else None
            },
            "market_comparison": {
                "alpha_pct": metrics.get('alpha_pct'),
                "beta": metrics.get('beta')
            }
        },
        "risk_assessment": risk_level,
        "interpretation": {
            "sharpe": "Excellent (>2)" if metrics.get('sharpe_ratio', 0) > 2 else "Good (1-2)" if metrics.get('sharpe_ratio', 0) > 1 else "Fair (0-1)" if metrics.get('sharpe_ratio', 0) > 0 else "Poor (<0)",
            "max_drawdown": "Low Risk (<10%)" if abs(metrics.get('max_drawdown_pct', 100)) < 10 else "Moderate (10-25%)" if abs(metrics.get('max_drawdown_pct', 100)) < 25 else "High (25-50%)" if abs(metrics.get('max_drawdown_pct', 100)) < 50 else "Very High (>50%)"
        }
    }
