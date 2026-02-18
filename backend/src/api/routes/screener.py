"""
Stock Screener API endpoints.

Exposes stock-screener opportunities to the frontend dashboard
for display and filtering decisions.
"""

import sqlite3
import logging
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, status

from ..schemas import ScreenerOpportunity, ScreenerStatsResponse

router = APIRouter()
logger = logging.getLogger(__name__)

# Path to stock-screener database (relative to project structure)
SCREENER_DB_PATH = Path(__file__).parent.parent.parent.parent.parent.parent / "stock-screener" / "stock_screener.db"


def _get_screener_connection():
    """Get connection to screener database."""
    if not SCREENER_DB_PATH.exists():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Stock screener database not found at {SCREENER_DB_PATH}"
        )
    
    conn = sqlite3.connect(str(SCREENER_DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def _fetch_dividend_opportunities(
    conn: sqlite3.Connection,
    min_yield: float = 0.03,
    max_pe: float = 20.0,
    limit: int = 50
) -> List[ScreenerOpportunity]:
    """Fetch dividend opportunities from screener DB."""
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            s.ticker,
            d.dividend_yield,
            d.pe_ratio,
            d.market_cap_eur,
            d.volatility,
            d.date
        FROM stocks s
        JOIN (
            SELECT ticker, MAX(date) as max_date
            FROM stock_data
            GROUP BY ticker
        ) latest ON s.ticker = latest.ticker
        JOIN stock_data d ON s.ticker = d.ticker AND d.date = latest.max_date
        WHERE d.dividend_yield >= ?
          AND d.pe_ratio > 0 
          AND d.pe_ratio <= ?
          AND d.market_cap_eur > 0
        ORDER BY d.dividend_yield DESC
        LIMIT ?
    """, (min_yield, max_pe, limit))
    
    opportunities = []
    for row in cursor.fetchall():
        opportunities.append(ScreenerOpportunity(
            ticker=row['ticker'],
            category="dividend",
            dividend_yield=row['dividend_yield'],
            pe_ratio=row['pe_ratio'],
            market_cap=row['market_cap_eur'],
            historical_volatility=row['volatility'],
            last_updated=row['date']
        ))
    
    return opportunities


def _fetch_volatility_opportunities(
    conn: sqlite3.Connection,
    min_volatility: float = 0.25,
    limit: int = 50
) -> List[ScreenerOpportunity]:
    """Fetch volatility opportunities from screener DB."""
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            s.ticker,
            d.dividend_yield,
            d.pe_ratio,
            d.market_cap_eur,
            d.volatility,
            d.beta,
            d.date
        FROM stocks s
        JOIN (
            SELECT ticker, MAX(date) as max_date
            FROM stock_data
            GROUP BY ticker
        ) latest ON s.ticker = latest.ticker
        JOIN stock_data d ON s.ticker = d.ticker AND d.date = latest.max_date
        WHERE d.volatility >= ?
          AND d.market_cap_eur > 0
        ORDER BY d.volatility DESC
        LIMIT ?
    """, (min_volatility, limit))
    
    opportunities = []
    for row in cursor.fetchall():
        # Calculate volatility percentile (rough estimate)
        vol_percentile = min(1.0, row['volatility'] / 0.6) * 100  # 60% vol = 100th percentile
        
        opportunities.append(ScreenerOpportunity(
            ticker=row['ticker'],
            category="volatility",
            dividend_yield=row['dividend_yield'],
            pe_ratio=row['pe_ratio'],
            market_cap=row['market_cap_eur'],
            historical_volatility=row['volatility'],
            volatility_percentile=vol_percentile,
            last_updated=row['date']
        ))
    
    return opportunities


@router.get(
    "/stats",
    response_model=ScreenerStatsResponse,
    summary="Get screener statistics and opportunities"
)
async def get_screener_stats(
    min_dividend_yield: float = Query(0.03, ge=0, le=1, description="Minimum dividend yield (0.03 = 3%)"),
    max_pe: float = Query(20.0, ge=0, description="Maximum P/E ratio for dividend stocks"),
    min_volatility: float = Query(0.25, ge=0, le=2, description="Minimum volatility"),
    limit: int = Query(25, ge=1, le=100, description="Max opportunities per category")
):
    """
    Get comprehensive screener statistics including:
    - Dividend opportunities
    - Volatility opportunities
    - Combined high-quality opportunities
    """
    try:
        conn = _get_screener_connection()
        
        # Get opportunities
        dividend_opps = _fetch_dividend_opportunities(conn, min_dividend_yield, max_pe, limit)
        volatility_opps = _fetch_volatility_opportunities(conn, min_volatility, limit)
        
        # Combined opportunities (stocks that appear in both)
        dividend_tickers = {o.ticker for o in dividend_opps}
        combined_opps = [o for o in volatility_opps if o.ticker in dividend_tickers]
        
        # Update category for combined
        for opp in combined_opps:
            opp.category = "combined"
        
        # Get last scan date
        cursor = conn.cursor()
        cursor.execute("SELECT MAX(date) as last_date FROM stock_data")
        row = cursor.fetchone()
        last_scan_date = row['last_date'] if row else None
        
        conn.close()
        
        return ScreenerStatsResponse(
            dividend_opportunities=dividend_opps,
            volatility_opportunities=volatility_opps,
            combined_opportunities=combined_opps,
            dividend_count=len(dividend_opps),
            volatility_count=len(volatility_opps),
            combined_count=len(combined_opps),
            last_scan_date=last_scan_date,
            status="success"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get screener stats: {e}")
        return ScreenerStatsResponse(
            dividend_opportunities=[],
            volatility_opportunities=[],
            combined_opportunities=[],
            dividend_count=0,
            volatility_count=0,
            combined_count=0,
            last_scan_date=None,
            status=f"error: {str(e)}"
        )


@router.get(
    "/dividend",
    response_model=List[ScreenerOpportunity],
    summary="Get dividend opportunities"
)
async def get_dividend_opportunities(
    min_yield: float = Query(0.03, ge=0, le=1, description="Minimum dividend yield"),
    max_pe: float = Query(20.0, ge=0, description="Maximum P/E ratio"),
    limit: int = Query(50, ge=1, le=200, description="Max results")
):
    """Get stocks that pass dividend screening criteria."""
    try:
        conn = _get_screener_connection()
        opportunities = _fetch_dividend_opportunities(conn, min_yield, max_pe, limit)
        conn.close()
        return opportunities
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get dividend opportunities: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get(
    "/volatility",
    response_model=List[ScreenerOpportunity],
    summary="Get volatility opportunities"
)
async def get_volatility_opportunities(
    min_volatility: float = Query(0.25, ge=0, le=2, description="Minimum volatility"),
    limit: int = Query(50, ge=1, le=200, description="Max results")
):
    """Get high-volatility stocks for momentum trading."""
    try:
        conn = _get_screener_connection()
        opportunities = _fetch_volatility_opportunities(conn, min_volatility, limit)
        conn.close()
        return opportunities
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get volatility opportunities: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get(
    "/tickers",
    response_model=List[str],
    summary="Get all screened tickers"
)
async def get_all_tickers(
    limit: int = Query(500, ge=1, le=2000, description="Max tickers to return")
):
    """Get list of all tickers in the screener database."""
    try:
        conn = _get_screener_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT DISTINCT ticker 
            FROM stocks 
            ORDER BY ticker 
            LIMIT ?
        """, (limit,))
        
        tickers = [row['ticker'] for row in cursor.fetchall()]
        conn.close()
        return tickers
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get tickers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get(
    "/health",
    summary="Check screener database health"
)
async def screener_health():
    """Check if screener database is accessible."""
    try:
        conn = _get_screener_connection()
        cursor = conn.cursor()
        
        # Get basic stats
        cursor.execute("SELECT COUNT(*) as count FROM stocks")
        stock_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM stock_data")
        data_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT MAX(date) as last_date FROM stock_data")
        last_date = cursor.fetchone()['last_date']
        
        conn.close()
        
        return {
            "status": "healthy",
            "database_path": str(SCREENER_DB_PATH),
            "stock_count": stock_count,
            "data_points": data_count,
            "last_update": last_date
        }
        
    except HTTPException:
        raise
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "database_path": str(SCREENER_DB_PATH)
        }
