"""Live Trading View API routes."""

from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from typing import List
from sqlalchemy import desc

from ...database import get_db
from ...models import Portfolio, Holding, Transaction
from ...services.intraday_price_service import IntradayPriceService

router = APIRouter(prefix="/live-trading", tags=["live-trading"])
intraday_service = IntradayPriceService(cache_ttl_minutes=5)


@router.get("/dashboard/{portfolio_id}")
async def get_live_trading_dashboard(portfolio_id: int):
    """
    Get live trading dashboard data for a portfolio.
    
    Includes:
    - Current holdings with real-time prices from Yahoo Finance
    - Intraday chart data
    - Unrealized P&L (based on real-time prices)
    - Market status and portfolio statistics
    
    Args:
        portfolio_id: The portfolio ID
        
    Returns:
        Dashboard data with holdings, performance, and execution info
    """
    db = next(get_db())
    
    try:
        # Get portfolio
        portfolio = db.query(Portfolio).filter(
            Portfolio.id == portfolio_id
        ).first()
        
        if not portfolio:
            raise HTTPException(status_code=404, detail="Portfolio not found")
        
        # Get current holdings
        holdings = db.query(Holding).filter(
            Holding.portfolio_id == portfolio_id,
            Holding.quantity > 0
        ).all()
        
        # Get intraday data for all holdings
        tickers = [h.ticker for h in holdings]
        intraday_data = intraday_service.get_batch_intraday(tickers)
        
        # Calculate unrealized P&L based on real-time prices
        holdings_with_prices = []
        total_unrealized_pnl = 0
        
        for holding in holdings:
            # Get intraday data if available (optional)
            intraday_info = intraday_data.get(holding.ticker) if intraday_data else None
            
            if intraday_info:
                current_price = intraday_info['current_price']
                daily_change_pct = intraday_info['daily_change_pct']
                chart_data = intraday_info['chart_data']
            else:
                # Fallback to entry price if intraday data unavailable
                current_price = holding.entry_price
                daily_change_pct = 0.0
                chart_data = []
            
            unrealized_pnl = (current_price - holding.entry_price) * holding.quantity
            total_unrealized_pnl += unrealized_pnl
            
            holdings_with_prices.append({
                'id': holding.id,
                'ticker': holding.ticker,
                'quantity': holding.quantity,
                'entry_price': float(holding.entry_price),
                'current_price': float(current_price),
                'daily_change_pct': daily_change_pct,
                'unrealized_pnl': float(unrealized_pnl),
                'intraday_data': intraday_info or {'chart_data': []}
            })
        
        # Get recent transactions (last 50)
        recent_transactions = db.query(Transaction).filter(
            Transaction.portfolio_id == portfolio_id
        ).order_by(desc(Transaction.timestamp)).limit(50).all()
        
        # Build execution log
        execution_log = []
        for tx in recent_transactions:
            execution_log.append({
                'action': tx.order_type.value if hasattr(tx.order_type, 'value') else str(tx.order_type),
                'ticker': tx.ticker,
                'quantity': float(tx.quantity),
                'price': float(tx.price),
                'timestamp': tx.timestamp.isoformat(),
                'notes': f'Order executed at {tx.timestamp.strftime("%I:%M %p")}'
            })
        
        # Get last transaction timestamp (first in reverse order)
        last_execution = None
        if recent_transactions:
            last_execution = recent_transactions[0].timestamp.isoformat()
        
        # Calculate next execution (market close of next trading day)
        next_execution = None
        next_close = datetime.now().replace(hour=16, minute=0, second=0, microsecond=0)
        if next_close < datetime.now():
            next_close = next_close + timedelta(days=1)
        next_execution = next_close.isoformat()
        
        # Market status (simple: OPEN if before 4 PM, CLOSED after)
        now = datetime.now()
        market_status = 'OPEN' if now.hour < 16 else 'CLOSED'
        
        return {
            'portfolio': {
                'id': portfolio.id,
                'name': portfolio.name,
                'nav': float(portfolio.nav),
                'current_cash': float(portfolio.current_cash),
                'initial_capital': float(portfolio.initial_capital),
                'deployed_pct': float(portfolio.deployed_pct) if hasattr(portfolio.deployed_pct, '__float__') else portfolio.deployed_pct
            },
            'holdings': holdings_with_prices,
            'total_unrealized_pnl': float(total_unrealized_pnl),
            'real_time_portfolio_value': float(portfolio.nav) + float(total_unrealized_pnl),
            'execution_status': {
                'last_execution': last_execution,
                'next_execution': next_execution,
                'pending_orders': [],
                'execution_log': execution_log
            },
            'market_status': market_status,
            'timestamp': now.isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        db.close()


@router.get("/intraday/{portfolio_id}")
async def get_intraday_view(portfolio_id: int):
    """
    Get intraday price data for all holdings in a portfolio.
    
    Args:
        portfolio_id: The portfolio ID
        
    Returns:
        Intraday data with chart information for each holding
    """
    db = next(get_db())
    
    try:
        holdings = db.query(Holding).filter(
            Holding.portfolio_id == portfolio_id,
            Holding.quantity > 0
        ).all()
        
        intraday_data = {}
        if holdings:
            tickers = [h.ticker for h in holdings]
            intraday_data = intraday_service.get_batch_intraday(tickers)
        
        return {
            'portfolio_id': portfolio_id,
            'intraday_data': intraday_data,
            'timestamp': datetime.now().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        db.close()
