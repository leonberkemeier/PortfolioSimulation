"""Intraday Price Service for fetching and caching real-time stock data."""

import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from decimal import Decimal


class IntradayPriceService:
    """Service for fetching and caching intraday price data from Yahoo Finance."""
    
    def __init__(self, cache_ttl_minutes=5):
        """
        Initialize the service with cache TTL.
        
        Args:
            cache_ttl_minutes: Time to live for cached prices in minutes
        """
        self.cache = {}
        self.cache_timestamps = {}
        self.cache_ttl = cache_ttl_minutes * 60  # Convert to seconds
        self.intraday_data = {}  # Store intraday data for charts
    
    def _is_cache_valid(self, ticker: str) -> bool:
        """Check if cached data is still valid."""
        if ticker not in self.cache_timestamps:
            return False
        age = (datetime.now() - self.cache_timestamps[ticker]).total_seconds()
        return age < self.cache_ttl
    
    def get_intraday_data(self, ticker: str, interval='1h') -> Optional[Dict]:
        """
        Get intraday historical data (1h intervals).
        
        Args:
            ticker: Stock ticker symbol (e.g., 'AAPL')
            interval: Data interval ('1h' for hourly)
            
        Returns:
            Dictionary with intraday data or None if failed
            {
                'ticker': str,
                'current_price': float,
                'day_open': float,
                'day_high': float,
                'day_low': float,
                'daily_change_pct': float,
                'volume': int,
                'chart_data': [(timestamp, price), ...],
                'timestamp': str (ISO format),
                'last_update': str
            }
        """
        if self._is_cache_valid(ticker):
            return self.intraday_data.get(ticker)
        
        try:
            # Fetch intraday data for today
            data = yf.download(
                ticker,
                period='1d',
                interval=interval,  # 1-hour intervals
                progress=False
            )
            
            if data.empty:
                return None
            
            # Handle both single and multi-ticker downloads
            # For single ticker, columns are MultiIndex like ('Close', 'AAPL')
            # For multi-ticker, columns are like 'Close', 'High', etc.
            if isinstance(data.columns, pd.MultiIndex):
                # Single ticker download
                close_col = ('Close', ticker)
                open_col = ('Open', ticker)
                high_col = ('High', ticker)
                low_col = ('Low', ticker)
            else:
                # Multi-ticker or direct column names
                close_col = 'Close'
                open_col = 'Open'
                high_col = 'High'
                low_col = 'Low'
            
            current_price = float(data[close_col].iloc[-1])
            day_open = float(data[open_col].iloc[0])
            day_high = float(data[high_col].max())
            day_low = float(data[low_col].min())
            daily_change = ((current_price - day_open) / day_open) * 100
            
            # Build chart data (timestamps, prices)
            chart_data = []
            close_prices = data[close_col]
            for timestamp, price in zip(close_prices.index, close_prices.values):
                try:
                    chart_data.append((str(timestamp), float(price)))
                except (TypeError, ValueError):
                    continue
            
            # Get volume - handle MultiIndex columns
            if isinstance(data.columns, pd.MultiIndex):
                volume_col = ('Volume', ticker)
            else:
                volume_col = 'Volume'
            
            try:
                volume = int(data[volume_col].sum()) if volume_col in data.columns else 0
            except (TypeError, ValueError):
                volume = 0
            
            result = {
                'ticker': ticker,
                'current_price': current_price,
                'day_open': day_open,
                'day_high': day_high,
                'day_low': day_low,
                'daily_change_pct': daily_change,
                'volume': volume,
                'chart_data': chart_data,
                'timestamp': datetime.now().isoformat(),
                'last_update': str(data.index[-1]),
                'dividend_yield': self._get_dividend_yield(ticker)
            }
            
            self.intraday_data[ticker] = result
            self.cache_timestamps[ticker] = datetime.now()
            return result
        
        except Exception as e:
            print(f"Error fetching intraday data for {ticker}: {e}")
            return None
    
    def get_batch_intraday(self, tickers: List[str]) -> Dict[str, Dict]:
        """
        Fetch intraday data for multiple tickers efficiently.
        
        Args:
            tickers: List of ticker symbols
            
        Returns:
            Dictionary mapping ticker -> intraday data
        """
        results = {}
        for ticker in tickers:
            data = self.get_intraday_data(ticker)
            if data:
                results[ticker] = data
        return results
    
    def _get_dividend_yield(self, ticker: str) -> Optional[float]:
        """
        Fetch dividend yield for a ticker from Yahoo Finance.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Dividend yield as percentage (e.g., 3.5 for 3.5%) or None
        """
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            
            # Try to get dividend yield (already as percentage in some cases)
            dividend_yield = info.get('dividendYield')
            if dividend_yield and dividend_yield > 0:
                # Yahoo returns this as a decimal (e.g., 0.035 for 3.5%)
                # But check if it's already a percentage by seeing if > 1
                if dividend_yield < 1:
                    return float(dividend_yield * 100)  # Convert from decimal to percentage
                else:
                    # Already a percentage or invalid
                    return float(dividend_yield) if dividend_yield < 100 else None
            
            # For bonds/ETFs, try trailing annual dividend yield
            trailing_yield = info.get('trailingAnnualDividendYield')
            if trailing_yield and trailing_yield > 0:
                if trailing_yield < 1:
                    return float(trailing_yield * 100)
                else:
                    return float(trailing_yield) if trailing_yield < 100 else None
            
            # Calculate from dividend and price
            dividend_rate = info.get('dividendRate')
            current_price = info.get('currentPrice') or info.get('regularMarketPrice')
            if dividend_rate and current_price and current_price > 0:
                calculated_yield = (dividend_rate / current_price) * 100
                return float(calculated_yield) if calculated_yield < 100 else None
            
            return None
        except Exception as e:
            print(f"Error fetching dividend yield for {ticker}: {e}")
            return None
    
    def clear_cache(self):
        """Clear all cached data."""
        self.cache.clear()
        self.cache_timestamps.clear()
        self.intraday_data.clear()
