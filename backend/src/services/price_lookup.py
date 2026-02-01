"""Price lookup service for fetching current prices from financial_data_aggregator database."""

from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, Dict, Tuple
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from ..config import FINANCIAL_DATA_DB_URL
from ..models import AssetType


class PriceLookup:
    """Service for looking up asset prices from financial_data_aggregator database."""

    def __init__(self):
        """Initialize connection to financial_data_aggregator database."""
        self.engine = create_engine(FINANCIAL_DATA_DB_URL)
        self.SessionLocal = sessionmaker(bind=self.engine)

    def get_stock_price(self, ticker: str) -> Optional[Decimal]:
        """
        Get latest stock price for a ticker.
        
        Args:
            ticker: Stock ticker (e.g., 'AAPL', 'MSFT')
            
        Returns:
            Latest close price or None if not found
        """
        try:
            db = self.SessionLocal()
            result = db.execute(
                text("""
                SELECT fsp.close_price FROM fact_stock_price fsp
                JOIN dim_company dc ON fsp.company_id = dc.company_id
                WHERE dc.ticker = :ticker
                ORDER BY fsp.date_id DESC
                LIMIT 1
                """),
                {"ticker": ticker}
            ).fetchone()
            db.close()
            return Decimal(result[0]) if result else None
        except Exception as e:
            print(f"Error fetching stock price for {ticker}: {e}")
            return None

    def get_crypto_price(self, symbol: str) -> Optional[Decimal]:
        """
        Get latest cryptocurrency price.
        
        Args:
            symbol: Crypto symbol (e.g., 'BTC', 'ETH')
            
        Returns:
            Latest price or None if not found
        """
        try:
            db = self.SessionLocal()
            result = db.execute(
                text("""
                SELECT current_price FROM fact_crypto_price
                WHERE symbol = :symbol
                ORDER BY timestamp DESC
                LIMIT 1
                """),
                {"symbol": symbol}
            ).fetchone()
            db.close()
            return Decimal(result[0]) if result else None
        except Exception as e:
            print(f"Error fetching crypto price for {symbol}: {e}")
            return None

    def get_bond_price(self, period: str) -> Optional[Decimal]:
        """
        Get latest bond/treasury yield.
        
        Args:
            period: Bond period (e.g., '3MO', '10Y', '30Y')
            
        Returns:
            Latest yield/price or None if not found
        """
        try:
            db = self.SessionLocal()
            result = db.execute(
                text("""
                SELECT price FROM fact_bond_price
                WHERE period = :period
                ORDER BY date DESC
                LIMIT 1
                """),
                {"period": period}
            ).fetchone()
            db.close()
            return Decimal(result[0]) if result else None
        except Exception as e:
            print(f"Error fetching bond price for {period}: {e}")
            return None

    def get_commodity_price(self, symbol: str) -> Optional[Decimal]:
        """
        Get latest commodity price (futures or spot).
        
        Args:
            symbol: Commodity symbol (e.g., 'CL=F' for oil, 'GC=F' for gold)
            
        Returns:
            Latest price or None if not found
        """
        try:
            db = self.SessionLocal()
            result = db.execute(
                text("""
                SELECT close FROM fact_commodity_price
                WHERE symbol = :symbol
                ORDER BY date DESC
                LIMIT 1
                """),
                {"symbol": symbol}
            ).fetchone()
            db.close()
            return Decimal(result[0]) if result else None
        except Exception as e:
            print(f"Error fetching commodity price for {symbol}: {e}")
            return None

    def get_price(self, ticker: str, asset_type: AssetType) -> Optional[Decimal]:
        """
        Get price for any asset type.
        
        Args:
            ticker: Asset ticker/symbol
            asset_type: Type of asset (STOCK, CRYPTO, BOND, COMMODITY)
            
        Returns:
            Latest price or None if not found
        """
        if asset_type == AssetType.STOCK:
            return self.get_stock_price(ticker)
        elif asset_type == AssetType.CRYPTO:
            return self.get_crypto_price(ticker)
        elif asset_type == AssetType.BOND:
            return self.get_bond_price(ticker)
        elif asset_type == AssetType.COMMODITY:
            return self.get_commodity_price(ticker)
        return None

    def get_prices_batch(self, tickers: Dict[str, AssetType]) -> Dict[str, Optional[Decimal]]:
        """
        Get prices for multiple assets efficiently.
        
        Args:
            tickers: Dict mapping ticker -> AssetType
            
        Returns:
            Dict mapping ticker -> price (None if not found)
        """
        prices = {}
        for ticker, asset_type in tickers.items():
            prices[ticker] = self.get_price(ticker, asset_type)
        return prices

    def validate_asset_exists(self, ticker: str, asset_type: AssetType) -> bool:
        """
        Check if asset exists in financial_data_aggregator database.
        
        Args:
            ticker: Asset ticker/symbol
            asset_type: Type of asset
            
        Returns:
            True if asset found, False otherwise
        """
        price = self.get_price(ticker, asset_type)
        return price is not None
