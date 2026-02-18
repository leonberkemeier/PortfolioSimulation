"""
Model analytics endpoints for dashboard integration.

Provides analytics, signal history, and performance metrics per model
for the model comparison dashboard.
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ...database import get_db
from ...models import Portfolio, Transaction, ModelSignal, Holding, OrderType
from ..schemas import (
    ModelAnalyticsResponse,
    ModelComparisonSummary,
    SignalHistoryItem,
    TradeOutcome,
)

router = APIRouter()


def _calculate_trade_outcomes(
    transactions: List[Transaction],
) -> List[TradeOutcome]:
    """
    Calculate trade outcomes by matching buy/sell pairs.
    
    Uses FIFO matching: first buy matched with first sell for same ticker.
    """
    outcomes = []
    
    # Group transactions by ticker
    by_ticker = {}
    for t in transactions:
        if t.ticker not in by_ticker:
            by_ticker[t.ticker] = {"buys": [], "sells": []}
        
        if t.order_type == OrderType.BUY:
            by_ticker[t.ticker]["buys"].append(t)
        else:
            by_ticker[t.ticker]["sells"].append(t)
    
    # Match buys with sells (FIFO)
    for ticker, trades in by_ticker.items():
        buys = sorted(trades["buys"], key=lambda x: x.timestamp)
        sells = sorted(trades["sells"], key=lambda x: x.timestamp)
        
        buy_idx = 0
        for sell in sells:
            if buy_idx >= len(buys):
                break
            
            buy = buys[buy_idx]
            buy_idx += 1
            
            # Calculate outcome
            buy_price = float(buy.price)
            sell_price = float(sell.price)
            quantity = float(min(buy.quantity, sell.quantity))
            pnl = (sell_price - buy_price) * quantity
            pnl_pct = ((sell_price - buy_price) / buy_price) * 100 if buy_price > 0 else 0
            holding_days = (sell.timestamp - buy.timestamp).days
            
            outcomes.append(TradeOutcome(
                ticker=ticker,
                buy_price=buy_price,
                sell_price=sell_price,
                quantity=quantity,
                pnl=pnl,
                pnl_pct=pnl_pct,
                holding_days=max(0, holding_days),
                is_winner=pnl > 0
            ))
    
    return outcomes


def _get_model_analytics(
    db: Session,
    model_name: str,
    recent_limit: int = 10
) -> ModelAnalyticsResponse:
    """Get comprehensive analytics for a single model."""
    
    # Find portfolio for this model
    portfolio = db.query(Portfolio).filter(
        Portfolio.model_name == model_name
    ).first()
    
    if not portfolio:
        return ModelAnalyticsResponse(
            model_name=model_name,
            portfolio_exists=False
        )
    
    # Get signals for this model/portfolio
    signals = db.query(ModelSignal).filter(
        ModelSignal.portfolio_id == portfolio.id
    ).order_by(ModelSignal.timestamp.desc()).all()
    
    # Get transactions
    transactions = db.query(Transaction).filter(
        Transaction.portfolio_id == portfolio.id
    ).order_by(Transaction.timestamp).all()
    
    # Get holdings
    holdings = db.query(Holding).filter(
        Holding.portfolio_id == portfolio.id
    ).all()
    
    # Calculate signal statistics
    total_signals = len(signals)
    buy_signals = sum(1 for s in signals if s.signal_type.lower() == "buy")
    sell_signals = sum(1 for s in signals if s.signal_type.lower() == "sell")
    hold_signals = sum(1 for s in signals if s.signal_type.lower() == "hold")
    
    avg_confidence = None
    if signals:
        avg_confidence = float(sum(float(s.confidence) for s in signals) / len(signals))
    
    # Calculate trade outcomes
    outcomes = _calculate_trade_outcomes(transactions)
    
    # Trade statistics
    total_trades = len(outcomes)
    winning_trades = sum(1 for o in outcomes if o.is_winner)
    losing_trades = total_trades - winning_trades
    
    win_rate = None
    avg_win_pct = None
    avg_loss_pct = None
    profit_factor = None
    
    if total_trades > 0:
        win_rate = (winning_trades / total_trades) * 100
        
        winners = [o for o in outcomes if o.is_winner]
        losers = [o for o in outcomes if not o.is_winner]
        
        if winners:
            avg_win_pct = sum(o.pnl_pct for o in winners) / len(winners)
        if losers:
            avg_loss_pct = sum(abs(o.pnl_pct) for o in losers) / len(losers)
        
        gross_profit = sum(o.pnl for o in winners) if winners else 0
        gross_loss = abs(sum(o.pnl for o in losers)) if losers else 0
        if gross_loss > 0:
            profit_factor = gross_profit / gross_loss
    
    # Recent signals
    recent_signals = [
        SignalHistoryItem(
            id=s.id,
            ticker=s.ticker,
            signal_type=s.signal_type,
            confidence=float(s.confidence),
            model_name=s.model_name,
            timestamp=s.timestamp,
            signal_metadata=s.signal_metadata
        )
        for s in signals[:recent_limit]
    ]
    
    # Recent trades (most recent outcomes)
    recent_trades = sorted(outcomes, key=lambda x: x.holding_days, reverse=True)[:recent_limit]
    
    # Time info
    first_signal_date = signals[-1].timestamp if signals else None
    last_signal_date = signals[0].timestamp if signals else None
    portfolio_age_days = None
    if portfolio.creation_date:
        portfolio_age_days = (datetime.utcnow() - portfolio.creation_date).days
    
    return ModelAnalyticsResponse(
        model_name=model_name,
        portfolio_id=portfolio.id,
        portfolio_exists=True,
        
        # Portfolio metrics
        nav=float(portfolio.nav),
        total_return_pct=portfolio.total_return_pct,
        initial_capital=float(portfolio.initial_capital),
        current_cash=float(portfolio.current_cash),
        deployed_capital=float(portfolio.deployed_capital),
        
        # Signal statistics
        total_signals=total_signals,
        buy_signals=buy_signals,
        sell_signals=sell_signals,
        hold_signals=hold_signals,
        avg_confidence=avg_confidence,
        
        # Trade statistics
        total_trades=total_trades,
        winning_trades=winning_trades,
        losing_trades=losing_trades,
        win_rate=win_rate,
        avg_win_pct=avg_win_pct,
        avg_loss_pct=avg_loss_pct,
        profit_factor=profit_factor,
        
        # Position info
        current_positions=len(holdings),
        position_tickers=[h.ticker for h in holdings],
        
        # Recent activity
        recent_signals=recent_signals,
        recent_trades=recent_trades,
        
        # Time info
        first_signal_date=first_signal_date,
        last_signal_date=last_signal_date,
        portfolio_age_days=portfolio_age_days
    )


@router.get(
    "/{model_name}/analytics",
    response_model=ModelAnalyticsResponse,
    summary="Get comprehensive analytics for a model"
)
async def get_model_analytics(
    model_name: str,
    recent_limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get detailed analytics for a specific model including:
    - Portfolio performance metrics (NAV, returns)
    - Signal statistics (counts, confidence)
    - Trade statistics (win rate, P&L)
    - Recent activity (signals, trades)
    """
    return _get_model_analytics(db, model_name, recent_limit)


@router.get(
    "/comparison",
    response_model=ModelComparisonSummary,
    summary="Compare all models"
)
async def compare_models(
    db: Session = Depends(get_db)
):
    """
    Get comparison summary of all models with portfolios.
    
    Includes analytics for each model and identifies:
    - Best performer (highest return)
    - Highest win rate
    - Most active (most trades)
    """
    # Get all portfolios with model names
    portfolios = db.query(Portfolio).filter(
        Portfolio.model_name.isnot(None),
        Portfolio.model_name != ""
    ).all()
    
    # Get analytics for each model
    model_analytics = []
    for portfolio in portfolios:
        analytics = _get_model_analytics(db, portfolio.model_name)
        model_analytics.append(analytics)
    
    # Find best performers
    best_performer = None
    highest_win_rate = None
    most_active = None
    
    if model_analytics:
        # Best return
        with_returns = [m for m in model_analytics if m.total_return_pct is not None]
        if with_returns:
            best = max(with_returns, key=lambda x: x.total_return_pct or 0)
            best_performer = best.model_name
        
        # Highest win rate
        with_win_rates = [m for m in model_analytics if m.win_rate is not None]
        if with_win_rates:
            best_wr = max(with_win_rates, key=lambda x: x.win_rate or 0)
            highest_win_rate = best_wr.model_name
        
        # Most active
        if model_analytics:
            most = max(model_analytics, key=lambda x: x.total_trades)
            if most.total_trades > 0:
                most_active = most.model_name
    
    return ModelComparisonSummary(
        models=model_analytics,
        total_models=len(model_analytics),
        best_performer=best_performer,
        highest_win_rate=highest_win_rate,
        most_active=most_active,
        timestamp=datetime.utcnow()
    )


@router.get(
    "/{model_name}/signals",
    response_model=List[SignalHistoryItem],
    summary="Get signal history for a model"
)
async def get_signal_history(
    model_name: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Get paginated signal history for a model."""
    portfolio = db.query(Portfolio).filter(
        Portfolio.model_name == model_name
    ).first()
    
    if not portfolio:
        return []
    
    signals = db.query(ModelSignal).filter(
        ModelSignal.portfolio_id == portfolio.id
    ).order_by(
        ModelSignal.timestamp.desc()
    ).offset(skip).limit(limit).all()
    
    return [
        SignalHistoryItem(
            id=s.id,
            ticker=s.ticker,
            signal_type=s.signal_type,
            confidence=float(s.confidence),
            model_name=s.model_name,
            timestamp=s.timestamp,
            signal_metadata=s.signal_metadata
        )
        for s in signals
    ]


@router.get(
    "/{model_name}/trades",
    response_model=List[TradeOutcome],
    summary="Get trade outcomes for a model"
)
async def get_trade_outcomes(
    model_name: str,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Get completed trade outcomes (buy-sell pairs) for a model."""
    portfolio = db.query(Portfolio).filter(
        Portfolio.model_name == model_name
    ).first()
    
    if not portfolio:
        return []
    
    transactions = db.query(Transaction).filter(
        Transaction.portfolio_id == portfolio.id
    ).order_by(Transaction.timestamp).all()
    
    outcomes = _calculate_trade_outcomes(transactions)
    return outcomes[:limit]


@router.get(
    "",
    response_model=List[str],
    summary="List all model names"
)
async def list_models(
    db: Session = Depends(get_db)
):
    """Get list of all model names that have portfolios."""
    portfolios = db.query(Portfolio.model_name).filter(
        Portfolio.model_name.isnot(None),
        Portfolio.model_name != ""
    ).distinct().all()
    
    return [p.model_name for p in portfolios if p.model_name]
