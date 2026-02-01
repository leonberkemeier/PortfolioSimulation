"""Advanced Performance Metrics Calculator for portfolio analysis."""

import numpy as np
from typing import List, Dict, Optional
from decimal import Decimal
from datetime import datetime


class AdvancedMetrics:
    """Service for calculating advanced portfolio performance metrics."""
    
    @staticmethod
    def calculate_returns(nav_values: List[float]) -> List[float]:
        """
        Calculate period returns from NAV values.
        
        Args:
            nav_values: List of Net Asset Values
            
        Returns:
            List of period returns (as decimals, e.g., 0.05 for 5%)
        """
        if len(nav_values) < 2:
            return []
        
        returns = []
        for i in range(1, len(nav_values)):
            if nav_values[i-1] != 0:
                ret = (nav_values[i] - nav_values[i-1]) / nav_values[i-1]
                returns.append(ret)
            else:
                returns.append(0.0)
        
        return returns
    
    @staticmethod
    def calculate_sharpe_ratio(
        returns: List[float],
        risk_free_rate: float = 0.04,
        periods_per_year: int = 252
    ) -> Optional[float]:
        """
        Calculate Sharpe Ratio (risk-adjusted returns).
        
        Formula: (Average Return - Risk-Free Rate) / Standard Deviation of Returns
        
        Args:
            returns: List of period returns
            risk_free_rate: Annual risk-free rate (default 4%)
            periods_per_year: Trading periods per year (252 for daily, 52 for weekly)
            
        Returns:
            Annualized Sharpe Ratio or None if insufficient data
        """
        if len(returns) < 2:
            return None
        
        # Convert to numpy array for calculations
        returns_array = np.array(returns)
        
        # Calculate average return and standard deviation
        avg_return = np.mean(returns_array)
        std_return = np.std(returns_array, ddof=1)  # Sample std dev
        
        if std_return == 0:
            return None
        
        # Annualize
        annualized_return = avg_return * periods_per_year
        annualized_std = std_return * np.sqrt(periods_per_year)
        
        # Calculate Sharpe Ratio
        sharpe = (annualized_return - risk_free_rate) / annualized_std
        
        return round(float(sharpe), 2)
    
    @staticmethod
    def calculate_sortino_ratio(
        returns: List[float],
        risk_free_rate: float = 0.04,
        periods_per_year: int = 252
    ) -> Optional[float]:
        """
        Calculate Sortino Ratio (downside risk-adjusted returns).
        
        Like Sharpe, but only penalizes downside volatility.
        
        Args:
            returns: List of period returns
            risk_free_rate: Annual risk-free rate (default 4%)
            periods_per_year: Trading periods per year
            
        Returns:
            Annualized Sortino Ratio or None
        """
        if len(returns) < 2:
            return None
        
        returns_array = np.array(returns)
        
        # Calculate average return
        avg_return = np.mean(returns_array)
        
        # Calculate downside deviation (only negative returns)
        downside_returns = returns_array[returns_array < 0]
        
        if len(downside_returns) == 0:
            return None
        
        downside_std = np.std(downside_returns, ddof=1)
        
        if downside_std == 0:
            return None
        
        # Annualize
        annualized_return = avg_return * periods_per_year
        annualized_downside_std = downside_std * np.sqrt(periods_per_year)
        
        # Calculate Sortino Ratio
        sortino = (annualized_return - risk_free_rate) / annualized_downside_std
        
        return round(float(sortino), 2)
    
    @staticmethod
    def calculate_max_drawdown(nav_values: List[float]) -> Dict[str, float]:
        """
        Calculate Maximum Drawdown and related metrics.
        
        Drawdown = (Trough Value - Peak Value) / Peak Value
        
        Args:
            nav_values: List of Net Asset Values
            
        Returns:
            Dict with max_drawdown, peak_value, trough_value, recovery_date_index
        """
        if len(nav_values) < 2:
            return {
                'max_drawdown': 0.0,
                'max_drawdown_pct': 0.0,
                'peak_value': 0.0,
                'trough_value': 0.0,
                'peak_index': 0,
                'trough_index': 0,
                'current_drawdown_pct': 0.0
            }
        
        nav_array = np.array(nav_values)
        
        # Calculate running maximum (peak)
        running_max = np.maximum.accumulate(nav_array)
        
        # Calculate drawdown at each point
        drawdown = (nav_array - running_max) / running_max
        
        # Find maximum drawdown
        max_dd_index = np.argmin(drawdown)
        max_dd = drawdown[max_dd_index]
        
        # Find the peak that led to this drawdown
        peak_index = np.argmax(running_max[:max_dd_index + 1])
        
        # Current drawdown (from most recent peak)
        current_dd = drawdown[-1]
        
        return {
            'max_drawdown': round(float(max_dd), 4),
            'max_drawdown_pct': round(float(max_dd * 100), 2),
            'peak_value': round(float(nav_array[peak_index]), 2),
            'trough_value': round(float(nav_array[max_dd_index]), 2),
            'peak_index': int(peak_index),
            'trough_index': int(max_dd_index),
            'current_drawdown_pct': round(float(current_dd * 100), 2)
        }
    
    @staticmethod
    def calculate_calmar_ratio(
        nav_values: List[float],
        periods_per_year: int = 252
    ) -> Optional[float]:
        """
        Calculate Calmar Ratio (return / max drawdown).
        
        Measures return per unit of drawdown risk.
        
        Args:
            nav_values: List of Net Asset Values
            periods_per_year: Trading periods per year
            
        Returns:
            Calmar Ratio or None
        """
        if len(nav_values) < 2:
            return None
        
        # Calculate annualized return
        total_return = (nav_values[-1] - nav_values[0]) / nav_values[0]
        periods = len(nav_values) - 1
        years = periods / periods_per_year
        
        if years == 0:
            return None
        
        annualized_return = (1 + total_return) ** (1 / years) - 1
        
        # Calculate max drawdown
        dd_metrics = AdvancedMetrics.calculate_max_drawdown(nav_values)
        max_dd = abs(dd_metrics['max_drawdown'])
        
        if max_dd == 0:
            return None
        
        calmar = annualized_return / max_dd
        
        return round(float(calmar), 2)
    
    @staticmethod
    def calculate_alpha_beta(
        portfolio_returns: List[float],
        benchmark_returns: List[float],
        risk_free_rate: float = 0.04,
        periods_per_year: int = 252
    ) -> Dict[str, Optional[float]]:
        """
        Calculate Alpha and Beta relative to a benchmark.
        
        Beta: Sensitivity to market movements
        Alpha: Excess return beyond what Beta would predict
        
        Args:
            portfolio_returns: Portfolio period returns
            benchmark_returns: Benchmark period returns (e.g., S&P 500)
            risk_free_rate: Annual risk-free rate
            periods_per_year: Trading periods per year
            
        Returns:
            Dict with alpha and beta values
        """
        if len(portfolio_returns) != len(benchmark_returns) or len(portfolio_returns) < 2:
            return {'alpha': None, 'beta': None}
        
        portfolio_array = np.array(portfolio_returns)
        benchmark_array = np.array(benchmark_returns)
        
        # Calculate beta (covariance / variance)
        covariance = np.cov(portfolio_array, benchmark_array)[0][1]
        benchmark_variance = np.var(benchmark_array, ddof=1)
        
        if benchmark_variance == 0:
            return {'alpha': None, 'beta': None}
        
        beta = covariance / benchmark_variance
        
        # Calculate alpha
        portfolio_avg = np.mean(portfolio_array)
        benchmark_avg = np.mean(benchmark_array)
        
        # Annualize
        annualized_portfolio = portfolio_avg * periods_per_year
        annualized_benchmark = benchmark_avg * periods_per_year
        daily_rf = risk_free_rate / periods_per_year
        
        # Alpha = Portfolio Return - [Risk-Free Rate + Beta * (Benchmark Return - Risk-Free Rate)]
        alpha = portfolio_avg - (daily_rf + beta * (benchmark_avg - daily_rf))
        annualized_alpha = alpha * periods_per_year
        
        return {
            'alpha': round(float(annualized_alpha), 4),
            'alpha_pct': round(float(annualized_alpha * 100), 2),
            'beta': round(float(beta), 2)
        }
    
    @staticmethod
    def calculate_value_at_risk(
        returns: List[float],
        confidence_level: float = 0.95
    ) -> Optional[float]:
        """
        Calculate Value at Risk (VaR).
        
        VaR = Maximum expected loss at a given confidence level
        
        Args:
            returns: List of period returns
            confidence_level: Confidence level (0.95 for 95%, 0.99 for 99%)
            
        Returns:
            VaR as a decimal (e.g., -0.05 for 5% loss)
        """
        if len(returns) < 10:
            return None
        
        returns_array = np.array(returns)
        
        # Calculate VaR at specified confidence level
        var = np.percentile(returns_array, (1 - confidence_level) * 100)
        
        return round(float(var), 4)
    
    @staticmethod
    def calculate_all_metrics(
        nav_values: List[float],
        benchmark_returns: Optional[List[float]] = None,
        risk_free_rate: float = 0.04,
        periods_per_year: int = 252
    ) -> Dict:
        """
        Calculate all advanced metrics at once.
        
        Args:
            nav_values: List of Net Asset Values
            benchmark_returns: Optional benchmark returns for alpha/beta
            risk_free_rate: Annual risk-free rate
            periods_per_year: Trading periods per year
            
        Returns:
            Dictionary with all calculated metrics
        """
        if len(nav_values) < 2:
            return {}
        
        # Calculate returns
        returns = AdvancedMetrics.calculate_returns(nav_values)
        
        metrics = {
            'total_return_pct': round(((nav_values[-1] - nav_values[0]) / nav_values[0]) * 100, 2),
            'sharpe_ratio': AdvancedMetrics.calculate_sharpe_ratio(returns, risk_free_rate, periods_per_year),
            'sortino_ratio': AdvancedMetrics.calculate_sortino_ratio(returns, risk_free_rate, periods_per_year),
            'calmar_ratio': AdvancedMetrics.calculate_calmar_ratio(nav_values, periods_per_year),
            'value_at_risk_95': AdvancedMetrics.calculate_value_at_risk(returns, 0.95),
            'value_at_risk_99': AdvancedMetrics.calculate_value_at_risk(returns, 0.99)
        }
        
        # Add drawdown metrics
        dd_metrics = AdvancedMetrics.calculate_max_drawdown(nav_values)
        metrics.update(dd_metrics)
        
        # Add alpha/beta if benchmark provided
        if benchmark_returns and len(benchmark_returns) == len(returns):
            ab_metrics = AdvancedMetrics.calculate_alpha_beta(returns, benchmark_returns, risk_free_rate, periods_per_year)
            metrics.update(ab_metrics)
        
        # Calculate volatility
        if len(returns) > 0:
            volatility = np.std(returns, ddof=1) * np.sqrt(periods_per_year)
            metrics['volatility'] = round(float(volatility), 4)
            metrics['volatility_pct'] = round(float(volatility * 100), 2)
        
        return metrics
    
    @staticmethod
    def get_risk_assessment(metrics: Dict) -> str:
        """
        Generate risk assessment based on metrics.
        
        Args:
            metrics: Dictionary of calculated metrics
            
        Returns:
            Risk assessment string (LOW, MODERATE, HIGH, VERY HIGH)
        """
        sharpe = metrics.get('sharpe_ratio', 0)
        max_dd_pct = abs(metrics.get('max_drawdown_pct', 0))
        volatility_pct = metrics.get('volatility_pct', 0)
        
        # Risk score (lower is better)
        risk_score = 0
        
        # Sharpe component
        if sharpe and sharpe < 0.5:
            risk_score += 3
        elif sharpe and sharpe < 1.0:
            risk_score += 2
        elif sharpe and sharpe < 1.5:
            risk_score += 1
        
        # Drawdown component
        if max_dd_pct > 50:
            risk_score += 3
        elif max_dd_pct > 30:
            risk_score += 2
        elif max_dd_pct > 15:
            risk_score += 1
        
        # Volatility component
        if volatility_pct > 40:
            risk_score += 3
        elif volatility_pct > 25:
            risk_score += 2
        elif volatility_pct > 15:
            risk_score += 1
        
        # Assess risk
        if risk_score >= 7:
            return "VERY HIGH"
        elif risk_score >= 5:
            return "HIGH"
        elif risk_score >= 3:
            return "MODERATE"
        else:
            return "LOW"
