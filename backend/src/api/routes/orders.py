"""Order management endpoints."""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from decimal import Decimal

from ...database import get_db
from ...models import Portfolio, Transaction, Holding, AssetType, OrderType
from ..schemas import OrderRequest, OrderResponse, TransactionResponse, HoldingResponse, OrderHistoryResponse
from ...services.order_engine import OrderEngine

router = APIRouter()


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
    """Get current holdings in a portfolio."""
    portfolio = db.query(Portfolio).get(portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )

    holdings = db.query(Holding).filter_by(portfolio_id=portfolio_id).all()
    return [HoldingResponse.from_orm(h) for h in holdings]
