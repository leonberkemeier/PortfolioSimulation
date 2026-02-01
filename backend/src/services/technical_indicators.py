"""Technical Indicators Service for calculating trading signals."""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta


class TechnicalIndicators:
    """Service for calculating technical indicators from price data."""
    
    @staticmethod
    def calculate_sma(prices: List[float], period: int) -> List[Optional[float]]:
        """
        Calculate Simple Moving Average.
        
        Args:
            prices: List of closing prices
            period: Number of periods for moving average
            
        Returns:
            List of SMA values (None for insufficient data points)
        """
        if len(prices) < period:
            return [None] * len(prices)
        
        sma = []
        for i in range(len(prices)):
            if i < period - 1:
                sma.append(None)
            else:
                avg = sum(prices[i - period + 1:i + 1]) / period
                sma.append(round(avg, 2))
        
        return sma
    
    @staticmethod
    def calculate_ema(prices: List[float], period: int) -> List[Optional[float]]:
        """
        Calculate Exponential Moving Average.
        
        Args:
            prices: List of closing prices
            period: Number of periods for EMA
            
        Returns:
            List of EMA values
        """
        if len(prices) < period:
            return [None] * len(prices)
        
        multiplier = 2 / (period + 1)
        ema = []
        
        # Start with SMA for first EMA value
        sma_value = sum(prices[:period]) / period
        ema.append(sma_value)
        
        # Calculate EMA for remaining values
        for i in range(period, len(prices)):
            ema_value = (prices[i] * multiplier) + (ema[-1] * (1 - multiplier))
            ema.append(round(ema_value, 2))
        
        # Pad beginning with None
        return [None] * (period - 1) + ema
    
    @staticmethod
    def calculate_rsi(prices: List[float], period: int = 14) -> List[Optional[float]]:
        """
        Calculate Relative Strength Index.
        
        Args:
            prices: List of closing prices
            period: RSI period (default 14)
            
        Returns:
            List of RSI values (0-100)
        """
        if len(prices) < period + 1:
            return [None] * len(prices)
        
        # Calculate price changes
        deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
        
        # Separate gains and losses
        gains = [max(delta, 0) for delta in deltas]
        losses = [abs(min(delta, 0)) for delta in deltas]
        
        rsi = [None]  # First value is None (no prior price)
        
        # Calculate initial average gain and loss
        avg_gain = sum(gains[:period]) / period
        avg_loss = sum(losses[:period]) / period
        
        # Calculate first RSI
        if avg_loss == 0:
            rsi.append(100.0)
        else:
            rs = avg_gain / avg_loss
            rsi.append(round(100 - (100 / (1 + rs)), 2))
        
        # Calculate subsequent RSI values using smoothed averages
        for i in range(period, len(gains)):
            avg_gain = (avg_gain * (period - 1) + gains[i]) / period
            avg_loss = (avg_loss * (period - 1) + losses[i]) / period
            
            if avg_loss == 0:
                rsi.append(100.0)
            else:
                rs = avg_gain / avg_loss
                rsi.append(round(100 - (100 / (1 + rs)), 2))
        
        return rsi
    
    @staticmethod
    def calculate_macd(
        prices: List[float],
        fast_period: int = 12,
        slow_period: int = 26,
        signal_period: int = 9
    ) -> Dict[str, List[Optional[float]]]:
        """
        Calculate MACD (Moving Average Convergence Divergence).
        
        Args:
            prices: List of closing prices
            fast_period: Fast EMA period (default 12)
            slow_period: Slow EMA period (default 26)
            signal_period: Signal line period (default 9)
            
        Returns:
            Dict with 'macd', 'signal', and 'histogram' lists
        """
        # Calculate EMAs
        fast_ema = TechnicalIndicators.calculate_ema(prices, fast_period)
        slow_ema = TechnicalIndicators.calculate_ema(prices, slow_period)
        
        # Calculate MACD line (fast EMA - slow EMA)
        macd_line = []
        for i in range(len(prices)):
            if fast_ema[i] is not None and slow_ema[i] is not None:
                macd_line.append(round(fast_ema[i] - slow_ema[i], 2))
            else:
                macd_line.append(None)
        
        # Calculate signal line (EMA of MACD)
        macd_values_only = [x for x in macd_line if x is not None]
        if len(macd_values_only) >= signal_period:
            signal_ema = TechnicalIndicators.calculate_ema(macd_values_only, signal_period)
            
            # Pad signal line to match MACD line length
            none_count = len([x for x in macd_line if x is None])
            signal_line = [None] * none_count + signal_ema
        else:
            signal_line = [None] * len(macd_line)
        
        # Calculate histogram (MACD - Signal)
        histogram = []
        for i in range(len(macd_line)):
            if macd_line[i] is not None and signal_line[i] is not None:
                histogram.append(round(macd_line[i] - signal_line[i], 2))
            else:
                histogram.append(None)
        
        return {
            'macd': macd_line,
            'signal': signal_line,
            'histogram': histogram
        }
    
    @staticmethod
    def calculate_bollinger_bands(
        prices: List[float],
        period: int = 20,
        std_dev: float = 2.0
    ) -> Dict[str, List[Optional[float]]]:
        """
        Calculate Bollinger Bands.
        
        Args:
            prices: List of closing prices
            period: Moving average period (default 20)
            std_dev: Number of standard deviations (default 2.0)
            
        Returns:
            Dict with 'upper', 'middle', and 'lower' band lists
        """
        if len(prices) < period:
            return {
                'upper': [None] * len(prices),
                'middle': [None] * len(prices),
                'lower': [None] * len(prices)
            }
        
        middle_band = TechnicalIndicators.calculate_sma(prices, period)
        upper_band = []
        lower_band = []
        
        for i in range(len(prices)):
            if i < period - 1:
                upper_band.append(None)
                lower_band.append(None)
            else:
                # Calculate standard deviation for the period
                period_prices = prices[i - period + 1:i + 1]
                mean = middle_band[i]
                variance = sum((x - mean) ** 2 for x in period_prices) / period
                std = variance ** 0.5
                
                upper_band.append(round(mean + (std_dev * std), 2))
                lower_band.append(round(mean - (std_dev * std), 2))
        
        return {
            'upper': upper_band,
            'middle': middle_band,
            'lower': lower_band
        }
    
    @staticmethod
    def calculate_all_indicators(
        prices: List[float],
        include_sma: List[int] = [20, 50, 200],
        include_ema: List[int] = [12, 26],
        include_rsi: bool = True,
        include_macd: bool = True,
        include_bollinger: bool = True
    ) -> Dict:
        """
        Calculate all technical indicators at once.
        
        Args:
            prices: List of closing prices
            include_sma: List of SMA periods to calculate
            include_ema: List of EMA periods to calculate
            include_rsi: Whether to include RSI
            include_macd: Whether to include MACD
            include_bollinger: Whether to include Bollinger Bands
            
        Returns:
            Dictionary with all calculated indicators
        """
        result = {}
        
        # Moving Averages
        if include_sma:
            for period in include_sma:
                result[f'sma_{period}'] = TechnicalIndicators.calculate_sma(prices, period)
        
        if include_ema:
            for period in include_ema:
                result[f'ema_{period}'] = TechnicalIndicators.calculate_ema(prices, period)
        
        # RSI
        if include_rsi:
            result['rsi'] = TechnicalIndicators.calculate_rsi(prices)
        
        # MACD
        if include_macd:
            macd_data = TechnicalIndicators.calculate_macd(prices)
            result['macd'] = macd_data['macd']
            result['macd_signal'] = macd_data['signal']
            result['macd_histogram'] = macd_data['histogram']
        
        # Bollinger Bands
        if include_bollinger:
            bb_data = TechnicalIndicators.calculate_bollinger_bands(prices)
            result['bb_upper'] = bb_data['upper']
            result['bb_middle'] = bb_data['middle']
            result['bb_lower'] = bb_data['lower']
        
        return result
    
    @staticmethod
    def get_latest_values(indicators: Dict) -> Dict:
        """
        Get the most recent value for each indicator.
        
        Args:
            indicators: Dictionary of indicator lists
            
        Returns:
            Dictionary with latest non-None values
        """
        latest = {}
        for key, values in indicators.items():
            # Get last non-None value
            non_none = [v for v in values if v is not None]
            if non_none:
                latest[key] = non_none[-1]
        
        return latest
    
    @staticmethod
    def generate_signals(indicators: Dict, prices: List[float]) -> Dict[str, str]:
        """
        Generate trading signals based on indicators.
        
        Args:
            indicators: Dictionary of calculated indicators
            prices: List of closing prices
            
        Returns:
            Dictionary with signal recommendations
        """
        signals = {}
        latest = TechnicalIndicators.get_latest_values(indicators)
        
        # RSI Signals
        if 'rsi' in latest:
            rsi = latest['rsi']
            if rsi > 70:
                signals['rsi'] = 'OVERBOUGHT - Consider selling'
            elif rsi < 30:
                signals['rsi'] = 'OVERSOLD - Consider buying'
            else:
                signals['rsi'] = 'NEUTRAL'
        
        # MACD Signals
        if 'macd' in latest and 'macd_signal' in latest:
            if latest['macd'] > latest['macd_signal']:
                signals['macd'] = 'BULLISH - MACD above signal'
            else:
                signals['macd'] = 'BEARISH - MACD below signal'
        
        # Bollinger Bands Signals
        if 'bb_upper' in latest and 'bb_lower' in latest and prices:
            current_price = prices[-1]
            if current_price > latest['bb_upper']:
                signals['bollinger'] = 'OVERBOUGHT - Price above upper band'
            elif current_price < latest['bb_lower']:
                signals['bollinger'] = 'OVERSOLD - Price below lower band'
            else:
                signals['bollinger'] = 'NEUTRAL - Within bands'
        
        # Moving Average Crossover
        if 'sma_50' in latest and 'sma_200' in latest:
            if latest['sma_50'] > latest['sma_200']:
                signals['ma_crossover'] = 'GOLDEN CROSS - Bullish'
            else:
                signals['ma_crossover'] = 'DEATH CROSS - Bearish'
        
        return signals
