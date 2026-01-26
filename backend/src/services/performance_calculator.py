"""Performance calculation service for portfolios."""

from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import List, Optional, Dict, Tuple
import statistics
import json

from models import (
    Portfolio, PortfolioSnapshot, PerformanceMetric, Holding, Transaction,
    OrderType, RiskMetric, AssetType
)
from numpy import std, mean
import numpy as np


class PerformanceCalculator:
    """Calculates portfolio performance metrics and snapshots."""

    def __init__(self, db_session):
        """
        Initialize performance calculator.
        
        Args:
            db_session: SQLAlchemy session for database operations
        """
        self.db = db_session

    def create_daily_snapshot(
        self,
        portfolio: Portfolio,
        snapshot_date: date = None
    ) -> PortfolioSnapshot:
        """
        Create a daily portfolio snapshot.
        
        Args:
            portfolio: Portfolio to snapshot
            snapshot_date: Date for snapshot (defaults to today)
            
        Returns:
            PortfolioSnapshot object
        """
        if snapshot_date is None:
            snapshot_date = date.today()

        nav = portfolio.nav
        total_return_pct = portfolio.total_return_pct
        cash = portfolio.current_cash

        snapshot = PortfolioSnapshot(
            portfolio_id=portfolio.id,
            date=snapshot_date,
            nav=nav,
            total_return=Decimal(total_return_pct),
            cash_balance=cash,
        )

        self.db.add(snapshot)
        self.db.commit()
        return snapshot

    def calculate_sharpe_ratio(
        self,
        portfolio: Portfolio,
        risk_free_rate: float = 0.02,
        days: int = 252
    ) -> Optional[float]:
        """
        Calculate Sharpe ratio for portfolio.
        
        Formula: (avg_return - risk_free_rate) / std_dev
        
        Args:
            portfolio: Portfolio to analyze
            risk_free_rate: Annual risk-free rate (default 2%)
            days: Trading days for annualization (default 252)
            
        Returns:
            Sharpe ratio or None if insufficient data
        """
        # Get historical snapshots
        snapshots = (
            self.db.query(PortfolioSnapshot)
            .filter_by(portfolio_id=portfolio.id)
            .order_by(PortfolioSnapshot.date)
            .all()
        )

        if len(snapshots) < 2:
            return None

        # Calculate daily returns
        daily_returns = []
        for i in range(1, len(snapshots)):
            prev_nav = float(snapshots[i - 1].nav)
            curr_nav = float(snapshots[i].nav)
            if prev_nav > 0:
                daily_return = (curr_nav - prev_nav) / prev_nav
                daily_returns.append(daily_return)

        if not daily_returns or len(daily_returns) < 2:
            return None

        avg_return = mean(daily_returns)
        std_dev = std(daily_returns)

        if std_dev == 0:
            return 0.0

        # Annualize metrics
        annual_return = avg_return * days
        annual_volatility = std_dev * np.sqrt(days)

        # Calculate Sharpe ratio
        sharpe = (annual_return - risk_free_rate) / annual_volatility if annual_volatility > 0 else 0.0
        return float(sharpe)

    def calculate_sortino_ratio(
        self,
        portfolio: Portfolio,
        risk_free_rate: float = 0.02,
        days: int = 252
    ) -> Optional[float]:
        """
        Calculate Sortino ratio (downside risk-adjusted return).
        
        Formula: (avg_return - risk_free_rate) / downside_std_dev
        
        Args:
            portfolio: Portfolio to analyze
            risk_free_rate: Annual risk-free rate
            days: Trading days for annualization
            
        Returns:
            Sortino ratio or None if insufficient data
        """
        snapshots = (
            self.db.query(PortfolioSnapshot)
            .filter_by(portfolio_id=portfolio.id)
            .order_by(PortfolioSnapshot.date)
            .all()
        )

        if len(snapshots) < 2:
            return None

        # Calculate daily returns
        daily_returns = []
        for i in range(1, len(snapshots)):
            prev_nav = float(snapshots[i - 1].nav)
            curr_nav = float(snapshots[i].nav)
            if prev_nav > 0:
                daily_return = (curr_nav - prev_nav) / prev_nav
                daily_returns.append(daily_return)

        if not daily_returns or len(daily_returns) < 2:
            return None

        avg_return = mean(daily_returns)

        # Calculate downside deviation (only negative returns)
        downside_returns = [r for r in daily_returns if r < 0]
        if not downside_returns:
            downside_std = 0
        else:
            downside_std = std(downside_returns)

        if downside_std == 0:
            return 0.0

        # Annualize metrics
        annual_return = avg_return * days
        annual_downside = downside_std * np.sqrt(days)

        sortino = (annual_return - risk_free_rate) / annual_downside if annual_downside > 0 else 0.0
        return float(sortino)

    def calculate_max_drawdown(self, portfolio: Portfolio) -> Optional[float]:
        """
        Calculate maximum drawdown (worst peak-to-trough decline).
        
        Args:
            portfolio: Portfolio to analyze
            
        Returns:
            Max drawdown as percentage or None if insufficient data
        """
        snapshots = (
            self.db.query(PortfolioSnapshot)
            .filter_by(portfolio_id=portfolio.id)
            .order_by(PortfolioSnapshot.date)
            .all()
        )

        if len(snapshots) < 2:
            return None

        navs = [float(s.nav) for s in snapshots]
        
        max_dd = 0.0
        peak = navs[0]

        for nav in navs[1:]:
            if nav > peak:
                peak = nav
            dd = (peak - nav) / peak if peak > 0 else 0
            max_dd = max(max_dd, dd)

        return float(max_dd) * 100  # Return as percentage

    def calculate_volatility(self, portfolio: Portfolio, days: int = 252) -> Optional[float]:
        """
        Calculate portfolio volatility (annualized standard deviation of returns).
        
        Args:
            portfolio: Portfolio to analyze
            days: Trading days for annualization
            
        Returns:
            Annualized volatility or None if insufficient data
        """
        snapshots = (
            self.db.query(PortfolioSnapshot)
            .filter_by(portfolio_id=portfolio.id)
            .order_by(PortfolioSnapshot.date)
            .all()
        )

        if len(snapshots) < 2:
            return None

        # Calculate daily returns
        daily_returns = []
        for i in range(1, len(snapshots)):
            prev_nav = float(snapshots[i - 1].nav)
            curr_nav = float(snapshots[i].nav)
            if prev_nav > 0:
                daily_return = (curr_nav - prev_nav) / prev_nav
                daily_returns.append(daily_return)

        if not daily_returns or len(daily_returns) < 2:
            return None

        daily_volatility = std(daily_returns)
        annual_volatility = daily_volatility * np.sqrt(days)
        return float(annual_volatility)

    def calculate_win_rate(self, portfolio: Portfolio) -> Optional[float]:
        """
        Calculate win rate (% of profitable closed positions).
        
        Args:
            portfolio: Portfolio to analyze
            
        Returns:
            Win rate as percentage or None if no trades
        """
        # Get all buy transactions
        buy_txns = (
            self.db.query(Transaction)
            .filter_by(portfolio_id=portfolio.id, order_type=OrderType.BUY)
            .order_by(Transaction.timestamp)
            .all()
        )

        if not buy_txns:
            return None

        wins = 0
        total = 0

        # For each buy, find corresponding sells
        for buy in buy_txns:
            sell_txns = (
                self.db.query(Transaction)
                .filter_by(
                    portfolio_id=portfolio.id,
                    ticker=buy.ticker,
                    asset_type=buy.asset_type,
                    order_type=OrderType.SELL,
                )
                .filter(Transaction.timestamp > buy.timestamp)
                .all()
            )

            for sell in sell_txns:
                total += 1
                # Compare sell price to buy price
                if sell.price > buy.price:
                    wins += 1

        if total == 0:
            return None

        return (wins / total) * 100

    def calculate_avg_win_loss(
        self, portfolio: Portfolio
    ) -> Tuple[Optional[float], Optional[float]]:
        """
        Calculate average win and loss percentages.
        
        Args:
            portfolio: Portfolio to analyze
            
        Returns:
            Tuple of (avg_win_pct, avg_loss_pct) or (None, None)
        """
        buy_txns = (
            self.db.query(Transaction)
            .filter_by(portfolio_id=portfolio.id, order_type=OrderType.BUY)
            .all()
        )

        if not buy_txns:
            return None, None

        wins = []
        losses = []

        for buy in buy_txns:
            sell_txns = (
                self.db.query(Transaction)
                .filter_by(
                    portfolio_id=portfolio.id,
                    ticker=buy.ticker,
                    asset_type=buy.asset_type,
                    order_type=OrderType.SELL,
                )
                .filter(Transaction.timestamp > buy.timestamp)
                .all()
            )

            for sell in sell_txns:
                pnl_pct = ((sell.price - buy.price) / buy.price) * 100
                if pnl_pct > 0:
                    wins.append(pnl_pct)
                else:
                    losses.append(pnl_pct)

        avg_win = mean(wins) if wins else None
        avg_loss = mean(losses) if losses else None

        return float(avg_win) if avg_win else None, float(avg_loss) if avg_loss else None

    def create_performance_metrics(
        self,
        portfolio: Portfolio,
        metric_date: date = None
    ) -> PerformanceMetric:
        """
        Create a comprehensive performance metrics record for a date.
        
        Args:
            portfolio: Portfolio to analyze
            metric_date: Date for metrics (defaults to today)
            
        Returns:
            PerformanceMetric object
        """
        if metric_date is None:
            metric_date = date.today()

        metric = PerformanceMetric(
            portfolio_id=portfolio.id,
            date=metric_date,
            sharpe_ratio=Decimal(self.calculate_sharpe_ratio(portfolio) or 0),
            sortino_ratio=Decimal(self.calculate_sortino_ratio(portfolio) or 0),
            max_drawdown=Decimal(self.calculate_max_drawdown(portfolio) or 0),
            volatility=Decimal(self.calculate_volatility(portfolio) or 0),
            win_rate=Decimal(self.calculate_win_rate(portfolio) or 0),
        )

        avg_win, avg_loss = self.calculate_avg_win_loss(portfolio)
        if avg_win is not None:
            metric.avg_win = Decimal(avg_win)
        if avg_loss is not None:
            metric.avg_loss = Decimal(avg_loss)

        # Count closed positions
        closed_trades = (
            self.db.query(Transaction)
            .filter_by(portfolio_id=portfolio.id, order_type=OrderType.SELL)
            .count()
        )
        metric.total_trades = closed_trades

        self.db.add(metric)
        self.db.commit()
        return metric

    def calculate_correlation_matrix(self, portfolio: Portfolio) -> Optional[Dict]:
        """
        Calculate correlation matrix across holdings.
        
        Args:
            portfolio: Portfolio to analyze
            
        Returns:
            Dict with correlation matrix or None if insufficient holdings
        """
        holdings = portfolio.holdings
        if len(holdings) < 2:
            return None

        # For now, return simplified correlation structure
        # Full implementation would fetch prices and calculate correlations
        correlation_data = {
            "holdings": [h.ticker for h in holdings],
            "count": len(holdings),
        }

        return correlation_data

    def calculate_asset_allocation(self, portfolio: Portfolio) -> Dict[str, float]:
        """
        Calculate portfolio allocation by asset type.
        
        Args:
            portfolio: Portfolio to analyze
            
        Returns:
            Dict mapping asset type to percentage allocation
        """
        allocation = {}
        total_value = float(portfolio.nav)

        if total_value == 0:
            return allocation

        for asset_type in AssetType:
            holdings_value = sum(
                float(h.current_value) for h in portfolio.holdings
                if h.asset_type == asset_type
            )
            allocation[asset_type.value] = (holdings_value / total_value) * 100

        # Add cash allocation
        allocation["cash"] = (float(portfolio.current_cash) / total_value) * 100

        return allocation

    def create_risk_metrics(
        self,
        portfolio: Portfolio,
        metric_date: date = None
    ) -> RiskMetric:
        """
        Create comprehensive risk metrics record.
        
        Args:
            portfolio: Portfolio to analyze
            metric_date: Date for metrics
            
        Returns:
            RiskMetric object
        """
        if metric_date is None:
            metric_date = date.today()

        metric = RiskMetric(
            portfolio_id=portfolio.id,
            date=metric_date,
            var_95=Decimal(0),  # TODO: Calculate VaR
            var_99=Decimal(0),  # TODO: Calculate VaR
            current_drawdown=Decimal(self.calculate_max_drawdown(portfolio) or 0),
        )

        # Add allocation data
        allocation = self.calculate_asset_allocation(portfolio)
        metric.sector_allocation = json.dumps(allocation)

        # Calculate liquidity score (0-100)
        cash_pct = (float(portfolio.current_cash) / float(portfolio.initial_capital)) * 100
        metric.liquidity_score = Decimal(min(100, cash_pct))

        self.db.add(metric)
        self.db.commit()
        return metric
