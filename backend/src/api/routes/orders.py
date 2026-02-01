"""Order management endpoints."""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from decimal import Decimal

from ...database import get_db
from ...models import Portfolio, Transaction, Holding, AssetType, OrderType
from ..schemas import OrderRequest, OrderResponse, TransactionResponse, HoldingResponse, OrderHistoryResponse
from ...services.order_engine import OrderEngine
from ...services.price_lookup import PriceLookup
from ...services.intraday_price_service import IntradayPriceService

router = APIRouter()
price_lookup = PriceLookup()
intraday_service = IntradayPriceService(cache_ttl_minutes=5)


@router.post(
    "/{portfolio_id}/buy",
    response_model=OrderResponse,
    status_code=status.HTTP_200_OK,
    summary="Place a buy order"
)
async def place_buy_order(
    portfolio_id: int,
    request: OrderRequest,
    db: Session = Depends(get_db)
):
    """Place a buy order for a portfolio."""
    portfolio = db.query(Portfolio).get(portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )

    engine = OrderEngine(db)
    confirmation = engine.buy(
        portfolio=portfolio,
        ticker=request.ticker,
        asset_type=AssetType[request.asset_type.upper()],
        quantity=Decimal(request.quantity)
    )

    return OrderResponse(
        status=confirmation.status.value,
        ticker=confirmation.ticker,
        asset_type=confirmation.asset_type.value,
        order_type=confirmation.order_type,
        quantity=confirmation.quantity,
        price=confirmation.price,
        fee=confirmation.fee,
        total_cost=confirmation.total_cost,
        timestamp=confirmation.timestamp,
        message=confirmation.message,
        order_id=confirmation.order_id
    )


@router.post(
    "/{portfolio_id}/sell",
    response_model=OrderResponse,
    status_code=status.HTTP_200_OK,
    summary="Place a sell order"
)
async def place_sell_order(
    portfolio_id: int,
    request: OrderRequest,
    db: Session = Depends(get_db)
):
    """Place a sell order for a portfolio."""
    portfolio = db.query(Portfolio).get(portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )

    engine = OrderEngine(db)
    confirmation = engine.sell(
        portfolio=portfolio,
        ticker=request.ticker,
        asset_type=AssetType[request.asset_type.upper()],
        quantity=Decimal(request.quantity)
    )

    return OrderResponse(
        status=confirmation.status.value,
        ticker=confirmation.ticker,
        asset_type=confirmation.asset_type.value,
        order_type=confirmation.order_type,
        quantity=confirmation.quantity,
        price=confirmation.price,
        fee=confirmation.fee,
        total_cost=confirmation.total_cost,
        timestamp=confirmation.timestamp,
        message=confirmation.message,
        order_id=confirmation.order_id
    )


@router.get(
    "/{portfolio_id}/history",
    response_model=OrderHistoryResponse,
    summary="Get order history"
)
async def get_order_history(
    portfolio_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get transaction history for a portfolio."""
    portfolio = db.query(Portfolio).get(portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )

    query = db.query(Transaction).filter_by(portfolio_id=portfolio_id).order_by(Transaction.timestamp.desc())
    total_count = query.count()
    transactions = query.offset(skip).limit(limit).all()

    return OrderHistoryResponse(
        transactions=[TransactionResponse.from_orm(t) for t in transactions],
        total_count=total_count
    )


@router.get(
    "/{portfolio_id}/holdings",
    response_model=List[HoldingResponse],
    summary="Get current holdings"
)
async def get_holdings(
    portfolio_id: int,
    db: Session = Depends(get_db)
):
    """Get current holdings in a portfolio with updated prices and yields."""
    portfolio = db.query(Portfolio).get(portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )

    holdings = db.query(Holding).filter_by(portfolio_id=portfolio_id).all()
    
    # Update current prices and dividend yields for all holdings
    for holding in holdings:
        try:
            # Format ticker for Yahoo Finance
            yahoo_ticker = holding.ticker.upper()
            if holding.asset_type == AssetType.CRYPTO:
                yahoo_ticker = f"{holding.ticker.upper()}-USD"
            elif holding.asset_type == AssetType.BOND:
                bond_mapping = {
                    'US10Y': '^TNX',
                    'US30Y': '^TYX',
                    'US5Y': '^FVX',
                    'US2Y': '^IRX',
                }
                yahoo_ticker = bond_mapping.get(holding.ticker.upper(), holding.ticker.upper())
            elif holding.asset_type == AssetType.COMMODITY:
                commodity_mapping = {
                    'GC': 'GLD',   # Gold -> Gold ETF
                    'SI': 'SLV',   # Silver -> Silver ETF
                    'CL': 'USO',   # Crude Oil -> Oil ETF
                    'NG': 'UNG',   # Natural Gas -> Natural Gas ETF
                }
                yahoo_ticker = commodity_mapping.get(holding.ticker.upper(), holding.ticker.upper())
            
            # Get latest intraday data including dividend yield
            intraday_data = intraday_service.get_intraday_data(yahoo_ticker)
            if intraday_data:
                holding.current_price = Decimal(str(intraday_data.get('current_price', 0)))
                dividend_yield = intraday_data.get('dividend_yield')
                if dividend_yield is not None:
                    holding.dividend_yield = Decimal(str(dividend_yield))
        except Exception as e:
            print(f"Error updating holding {holding.ticker}: {e}")
            # Keep existing prices if update fails
    
    db.commit()
    return [HoldingResponse.from_orm(h) for h in holdings]


@router.get(
    "/quote/{symbol}",
    summary="Get live stock quote",
    responses={
        200: {"description": "Stock quote found"},
        404: {"description": "Symbol not found"},
        500: {"description": "Server error"}
    }
)
async def get_quote(symbol: str):
    """Get live stock quote with real-time price from Yahoo Finance."""
    ticker = symbol.upper()
    
    try:
        # Try to get live intraday data first
        intraday_data = intraday_service.get_intraday_data(ticker)
        
        if intraday_data and 'current_price' in intraday_data:
            # We have live data from Yahoo Finance
            response_data = {
                "symbol": ticker,
                "name": f"{ticker} Inc.",
                "price": float(intraday_data['current_price']),
                "change": float(intraday_data.get('daily_change', 0)),
                "changePercent": float(intraday_data.get('daily_change_pct', 0)),
                "open": float(intraday_data.get('day_open', intraday_data['current_price'])),
                "high": float(intraday_data.get('day_high', intraday_data['current_price'])),
                "low": float(intraday_data.get('day_low', intraday_data['current_price'])),
                "volume": int(intraday_data.get('volume', 0)),
                "previousClose": float(intraday_data.get('day_open', intraday_data['current_price'])),
                "currency": "USD",
                "source": "yahoo_finance_live"
            }
            
            # Add dividend yield if available
            if intraday_data.get('dividend_yield') is not None:
                response_data["dividendYield"] = float(intraday_data['dividend_yield'])
            
            return JSONResponse(
                status_code=200,
                content=response_data
            )
        
        # Fallback to database price if live data unavailable
        db_price = price_lookup.get_stock_price(ticker)
        
        if db_price is None:
            return JSONResponse(
                status_code=404,
                content={"detail": f"Symbol '{ticker}' not found. Please verify the ticker symbol is correct."}
            )
        
        return JSONResponse(
            status_code=200,
            content={
                "symbol": ticker,
                "name": f"{ticker} Inc.",
                "price": float(db_price),
                "change": 0,
                "changePercent": 0,
                "open": float(db_price),
                "high": float(db_price),
                "low": float(db_price),
                "volume": 0,
                "previousClose": float(db_price),
                "currency": "USD",
                "source": "database"
            }
        )
            
    except Exception as e:
        print(f"Error in get_quote for {symbol}: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Error fetching quote for '{symbol}'. The symbol may be invalid or data is unavailable."}
        )
