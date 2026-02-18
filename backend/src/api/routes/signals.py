"""
Signal execution endpoints for model integration.

Receives trade signals from model_regime_comparison and executes them
against portfolios in the Trading Simulator.
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...database import get_db
from ...models import Portfolio, Holding, AssetType
from ...services.order_engine import OrderEngine, OrderStatus
from ..schemas import (
    TradeSignalItem,
    ExecuteSignalsRequest,
    ExecuteSignalsResponse,
    SignalExecutionResult,
)

router = APIRouter()


@router.post(
    "/{portfolio_id}/execute",
    response_model=ExecuteSignalsResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute trade signals for a portfolio"
)
async def execute_signals(
    portfolio_id: int,
    request: ExecuteSignalsRequest,
    db: Session = Depends(get_db)
):
    """
    Execute trade signals from model_regime_comparison.
    
    Signals are validated and executed in order:
    1. SELL signals first (to free up capital)
    2. BUY signals second (using available capital)
    
    Args:
        portfolio_id: Target portfolio ID
        request: ExecuteSignalsRequest with list of signals
        
    Returns:
        ExecuteSignalsResponse with execution results
    """
    # Get portfolio
    portfolio = db.query(Portfolio).get(portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Portfolio {portfolio_id} not found"
        )
    
    # Initialize order engine
    engine = OrderEngine(db)
    
    # Separate signals by type
    sell_signals = [s for s in request.signals if s.signal_type == "SELL"]
    buy_signals = [s for s in request.signals if s.signal_type == "BUY"]
    
    results: List[SignalExecutionResult] = []
    executed = 0
    failed = 0
    skipped = 0
    
    # Get model name from first signal
    model_name = request.signals[0].model_name if request.signals else "unknown"
    
    # Process SELL signals first
    for signal in sell_signals:
        if request.dry_run:
            results.append(SignalExecutionResult(
                ticker=signal.ticker,
                signal_type="SELL",
                success=True,
                message=f"[DRY RUN] Would sell entire position of {signal.ticker}",
            ))
            skipped += 1
            continue
        
        result = _execute_sell_signal(engine, portfolio, signal, db)
        results.append(result)
        
        if result.success:
            executed += 1
        else:
            failed += 1
    
    # Commit sells before buys (to free capital)
    if not request.dry_run and sell_signals:
        db.commit()
        db.refresh(portfolio)
    
    # Process BUY signals
    for signal in buy_signals:
        if request.dry_run:
            # Calculate theoretical quantity
            qty = signal.suggested_quantity
            if qty is None and signal.current_price and signal.current_price > 0:
                available = float(portfolio.current_cash) * signal.suggested_weight
                qty = int(available / signal.current_price)
            
            results.append(SignalExecutionResult(
                ticker=signal.ticker,
                signal_type="BUY",
                success=True,
                quantity=qty,
                price=signal.current_price,
                message=f"[DRY RUN] Would buy {qty} shares of {signal.ticker}",
            ))
            skipped += 1
            continue
        
        result = _execute_buy_signal(engine, portfolio, signal, db)
        results.append(result)
        
        if result.success:
            executed += 1
        else:
            failed += 1
    
    # Final commit
    if not request.dry_run:
        db.commit()
        db.refresh(portfolio)
    
    # Get updated NAV
    nav_after = float(portfolio.nav) if hasattr(portfolio, 'nav') else None
    
    return ExecuteSignalsResponse(
        portfolio_id=portfolio_id,
        model_name=model_name,
        total_signals=len(request.signals),
        executed=executed,
        failed=failed,
        skipped=skipped,
        results=results,
        portfolio_nav_after=nav_after,
        timestamp=datetime.utcnow()
    )


@router.post(
    "/model/{model_name}/execute",
    response_model=ExecuteSignalsResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute signals for a model's portfolio (auto-creates if needed)"
)
async def execute_signals_for_model(
    model_name: str,
    request: ExecuteSignalsRequest,
    initial_capital: float = 100000.0,
    db: Session = Depends(get_db)
):
    """
    Execute trade signals for a model's portfolio.
    
    If no portfolio exists for this model, one will be created automatically.
    
    Args:
        model_name: Model name (e.g., "xgboost", "linear", "cnn", "llm")
        request: ExecuteSignalsRequest with list of signals
        initial_capital: Starting capital if creating new portfolio
        
    Returns:
        ExecuteSignalsResponse with execution results
    """
    # Find or create portfolio for this model
    portfolio = db.query(Portfolio).filter(Portfolio.model_name == model_name).first()
    
    if not portfolio:
        # Create new portfolio for this model
        portfolio = Portfolio(
            name=f"{model_name.upper()} Model Portfolio",
            initial_capital=Decimal(str(initial_capital)),
            current_cash=Decimal(str(initial_capital)),
            model_name=model_name,
            status="active"
        )
        db.add(portfolio)
        db.commit()
        db.refresh(portfolio)
    
    # Override model_name in signals to match portfolio
    for signal in request.signals:
        signal.model_name = model_name
    
    # Execute signals
    return await execute_signals(portfolio.id, request, db)


@router.get(
    "/{portfolio_id}/holdings",
    summary="Get current holdings for signal generation"
)
async def get_holdings_for_signals(
    portfolio_id: int,
    db: Session = Depends(get_db)
):
    """
    Get current holdings in a format useful for signal generation.
    
    Returns ticker list for use as current_holdings parameter
    in SignalGenerator.generate_signals().
    """
    portfolio = db.query(Portfolio).get(portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Portfolio {portfolio_id} not found"
        )
    
    holdings = db.query(Holding).filter(Holding.portfolio_id == portfolio_id).all()
    
    return {
        "portfolio_id": portfolio_id,
        "model_name": portfolio.model_name,
        "current_cash": float(portfolio.current_cash),
        "nav": float(portfolio.nav) if hasattr(portfolio, 'nav') else float(portfolio.current_cash),
        "holdings": [
            {
                "ticker": h.ticker,
                "quantity": float(h.quantity),
                "asset_type": h.asset_type.value if h.asset_type else "stock",
                "entry_price": float(h.entry_price),
                "current_price": float(h.current_price) if h.current_price else None
            }
            for h in holdings
        ],
        "ticker_list": [h.ticker for h in holdings]
    }


@router.get(
    "/model/{model_name}/holdings",
    summary="Get holdings for a model's portfolio"
)
async def get_model_holdings(
    model_name: str,
    db: Session = Depends(get_db)
):
    """Get holdings for a model's portfolio."""
    portfolio = db.query(Portfolio).filter(Portfolio.model_name == model_name).first()
    
    if not portfolio:
        return {
            "portfolio_id": None,
            "model_name": model_name,
            "exists": False,
            "holdings": [],
            "ticker_list": []
        }
    
    return await get_holdings_for_signals(portfolio.id, db)


# === Helper Functions ===

def _execute_buy_signal(
    engine: OrderEngine,
    portfolio: Portfolio,
    signal: TradeSignalItem,
    db: Session
) -> SignalExecutionResult:
    """Execute a BUY signal."""
    # Determine quantity
    quantity = signal.suggested_quantity
    
    if quantity is None or quantity <= 0:
        # Calculate from weight and available cash
        if signal.current_price and signal.current_price > 0:
            available = float(portfolio.current_cash) * signal.suggested_weight
            quantity = int(available / signal.current_price)
        else:
            return SignalExecutionResult(
                ticker=signal.ticker,
                signal_type="BUY",
                success=False,
                message="Cannot calculate quantity: missing price",
                error="No price available"
            )
    
    if quantity <= 0:
        return SignalExecutionResult(
            ticker=signal.ticker,
            signal_type="BUY",
            success=False,
            message="Insufficient capital for minimum position",
            error="Quantity would be zero or negative"
        )
    
    # Determine asset type
    asset_type = AssetType.STOCK
    if signal.asset_type:
        try:
            asset_type = AssetType[signal.asset_type.upper()]
        except KeyError:
            pass
    
    # Execute buy
    confirmation = engine.buy(
        portfolio=portfolio,
        ticker=signal.ticker,
        asset_type=asset_type,
        quantity=Decimal(str(quantity))
    )
    
    if confirmation.status == OrderStatus.SUCCESS:
        return SignalExecutionResult(
            ticker=signal.ticker,
            signal_type="BUY",
            success=True,
            order_id=confirmation.order_id,
            quantity=float(confirmation.quantity),
            price=float(confirmation.price),
            total_cost=float(confirmation.total_cost),
            message=confirmation.message
        )
    else:
        return SignalExecutionResult(
            ticker=signal.ticker,
            signal_type="BUY",
            success=False,
            message=confirmation.message,
            error=confirmation.status.value
        )


def _execute_sell_signal(
    engine: OrderEngine,
    portfolio: Portfolio,
    signal: TradeSignalItem,
    db: Session
) -> SignalExecutionResult:
    """Execute a SELL signal (sells entire position)."""
    # Find existing holding
    holding = next(
        (h for h in portfolio.holdings if h.ticker.upper() == signal.ticker.upper()),
        None
    )
    
    if not holding or holding.quantity <= 0:
        return SignalExecutionResult(
            ticker=signal.ticker,
            signal_type="SELL",
            success=False,
            message=f"No position to sell for {signal.ticker}",
            error="No holding found"
        )
    
    # Determine asset type from holding
    asset_type = holding.asset_type or AssetType.STOCK
    
    # Execute sell (entire position)
    confirmation = engine.sell(
        portfolio=portfolio,
        ticker=signal.ticker,
        asset_type=asset_type,
        quantity=holding.quantity
    )
    
    if confirmation.status == OrderStatus.SUCCESS:
        return SignalExecutionResult(
            ticker=signal.ticker,
            signal_type="SELL",
            success=True,
            order_id=confirmation.order_id,
            quantity=float(confirmation.quantity),
            price=float(confirmation.price),
            total_cost=float(confirmation.total_cost),
            message=confirmation.message
        )
    else:
        return SignalExecutionResult(
            ticker=signal.ticker,
            signal_type="SELL",
            success=False,
            message=confirmation.message,
            error=confirmation.status.value
        )
