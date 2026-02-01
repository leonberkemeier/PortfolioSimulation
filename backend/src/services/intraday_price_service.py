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
                'dividend_yield': self._get_dividend_yield(ticker),
                'dividend_rate': self._get_dividend_rate(ticker),
                'pe_ratio': self._get_pe_ratio(ticker)
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
            
            # First try dividendYield - this is ALREADY a percentage from Yahoo (e.g., 0.4 means 0.4%)
            dividend_yield = info.get('dividendYield')
            if dividend_yield is not None and dividend_yield > 0:
                # This is already a percentage, don't multiply by 100
                if dividend_yield < 50:  # Sanity check (50% would be very high)
                    return round(float(dividend_yield), 2)
            
            # Try trailingAnnualDividendYield - this is a DECIMAL (e.g., 0.004 means 0.4%)
            trailing_yield = info.get('trailingAnnualDividendYield')
            if trailing_yield is not None and trailing_yield > 0:
                # Convert decimal to percentage
                if trailing_yield < 0.5:  # If less than 0.5, it's a decimal
                    return round(float(trailing_yield * 100), 2)
                elif trailing_yield < 50:  # Already a percentage
                    return round(float(trailing_yield), 2)
            
            # Calculate from dividend and price as fallback
            dividend_rate = info.get('dividendRate')
            current_price = info.get('currentPrice') or info.get('regularMarketPrice')
            if dividend_rate and current_price and current_price > 0:
                calculated_yield = (dividend_rate / current_price) * 100
                if calculated_yield < 50:  # Sanity check
                    return round(float(calculated_yield), 2)
            
            return None
        except Exception as e:
            print(f"Error fetching dividend yield for {ticker}: {e}")
            return None
    
    def _get_dividend_rate(self, ticker: str) -> Optional[float]:
        """
        Fetch annual dividend per share for a ticker from Yahoo Finance.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Annual dividend per share (e.g., 1.04 for $1.04/share) or None
        """
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            
            # Get the dividend rate (annual dividend per share)
            dividend_rate = info.get('dividendRate')
            if dividend_rate and dividend_rate > 0:
                return round(float(dividend_rate), 2)
            
            # Try trailing annual dividend rate
            trailing_rate = info.get('trailingAnnualDividendRate')
            if trailing_rate and trailing_rate > 0:
                return round(float(trailing_rate), 2)
            
            return None
        except Exception as e:
            print(f"Error fetching dividend rate for {ticker}: {e}")
            return None
    
    def _get_pe_ratio(self, ticker: str) -> Optional[float]:
        """
        Fetch P/E ratio (Price-to-Earnings) for a ticker from Yahoo Finance.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            P/E ratio (e.g., 25.5) or None if not available
        """
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            
            # Try trailing P/E ratio first (most common)
            trailing_pe = info.get('trailingPE')
            if trailing_pe is not None and trailing_pe > 0:
                # Sanity check: P/E should typically be between 0 and 1000
                if 0 < trailing_pe < 1000:
                    return round(float(trailing_pe), 2)
            
            # Try forward P/E ratio
            forward_pe = info.get('forwardPE')
            if forward_pe is not None and forward_pe > 0:
                if 0 < forward_pe < 1000:
                    return round(float(forward_pe), 2)
            
            return None
        except Exception as e:
            print(f"Error fetching P/E ratio for {ticker}: {e}")
            return None
    
    def clear_cache(self):
        """Clear all cached data."""
        self.cache.clear()
        self.cache_timestamps.clear()
        self.intraday_data.clear()
