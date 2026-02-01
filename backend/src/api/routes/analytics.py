"""Analytics and performance endpoints."""

from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import date

from ...database import get_db
from ...models import Portfolio, PerformanceMetric, PortfolioSnapshot, RiskMetric
from ..schemas import (
    PerformanceMetricResponse, PortfolioSnapshotResponse, RiskAnalyticsResponse,
    SnapshotHistoryResponse, AllocationResponse
)
from ...services.performance_calculator import PerformanceCalculator

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
