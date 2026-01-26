"""Portfolio management endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from decimal import Decimal

from database import get_db
from models import Portfolio, FeeStructure, PortfolioFeeAssignment, PortfolioStatus
from schemas import (
    PortfolioCreateRequest, PortfolioUpdateRequest, PortfolioResponse,
    PortfolioListResponse
)

router = APIRouter()


# ============ Create Portfolio ============

@router.post(
    "",
    response_model=PortfolioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new portfolio"
)
async def create_portfolio(
    request: PortfolioCreateRequest,
    db: Session = Depends(get_db)
):
    """Create a new portfolio with initial capital and constraints."""
    # Create portfolio
    portfolio = Portfolio(
        name=request.name,
        description=request.description,
        initial_capital=Decimal(request.initial_capital),
        current_cash=Decimal(request.initial_capital),
        model_name=request.model_name,
        max_position_size=request.max_position_size,
        max_cash_per_trade=Decimal(request.max_cash_per_trade) if request.max_cash_per_trade else None,
        max_allocation_per_asset_class=request.max_allocation_per_asset_class,
    )

    db.add(portfolio)
    db.flush()

    # Assign fee structure if provided
    if request.fee_structure_id:
        fee_structure = db.query(FeeStructure).get(request.fee_structure_id)
        if not fee_structure:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fee structure not found"
            )
        assignment = PortfolioFeeAssignment(
            portfolio_id=portfolio.id,
            fee_structure_id=request.fee_structure_id
        )
        db.add(assignment)

    db.commit()
    db.refresh(portfolio)

    return PortfolioResponse.from_orm(portfolio)


# ============ List Portfolios ============

@router.get(
    "",
    response_model=PortfolioListResponse,
    summary="List all portfolios"
)
async def list_portfolios(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get list of all portfolios with pagination."""
    query = db.query(Portfolio)

    if status_filter:
        query = query.filter(Portfolio.status == status_filter)

    total_count = query.count()
    portfolios = query.offset(skip).limit(limit).all()

    # Calculate total NAV
    total_nav = sum(p.nav for p in portfolios) if portfolios else Decimal(0)

    return PortfolioListResponse(
        portfolios=[PortfolioResponse.from_orm(p) for p in portfolios],
        total_count=total_count,
        total_nav=total_nav
    )


# ============ Get Portfolio Detail ============

@router.get(
    "/{portfolio_id}",
    response_model=PortfolioResponse,
    summary="Get portfolio details"
)
async def get_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific portfolio."""
    portfolio = db.query(Portfolio).get(portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Portfolio {portfolio_id} not found"
        )

    return PortfolioResponse.from_orm(portfolio)


# ============ Update Portfolio ============

@router.put(
    "/{portfolio_id}",
    response_model=PortfolioResponse,
    summary="Update portfolio settings"
)
async def update_portfolio(
    portfolio_id: int,
    request: PortfolioUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update portfolio settings (name, limits, etc.)."""
    portfolio = db.query(Portfolio).get(portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Portfolio {portfolio_id} not found"
        )

    # Update fields
    if request.name is not None:
        portfolio.name = request.name
    if request.description is not None:
        portfolio.description = request.description
    if request.max_position_size is not None:
        portfolio.max_position_size = request.max_position_size
    if request.max_cash_per_trade is not None:
        portfolio.max_cash_per_trade = Decimal(request.max_cash_per_trade)
    if request.max_allocation_per_asset_class is not None:
        portfolio.max_allocation_per_asset_class = request.max_allocation_per_asset_class

    db.commit()
    db.refresh(portfolio)

    return PortfolioResponse.from_orm(portfolio)


# ============ Delete Portfolio ============

@router.delete(
    "/{portfolio_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Archive a portfolio"
)
async def delete_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db)
):
    """Archive a portfolio (mark as deleted, don't actually delete data)."""
    portfolio = db.query(Portfolio).get(portfolio_id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Portfolio {portfolio_id} not found"
        )

    portfolio.status = PortfolioStatus.DELETED
    db.commit()

    return None
