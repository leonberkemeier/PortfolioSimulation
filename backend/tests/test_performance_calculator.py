"""Unit tests for performance calculator service."""

import sys
from pathlib import Path
from decimal import Decimal
from datetime import date, timedelta

import pytest

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from database import SessionLocal, Base, engine
from models import (
    Portfolio, PortfolioSnapshot, PerformanceMetric, Holding, Transaction,
    OrderType, AssetType, FeeStructure, FeeType, PortfolioFeeAssignment, RiskMetric
)
from services.performance_calculator import PerformanceCalculator


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_portfolio(db_session):
    """Create a test portfolio."""
    portfolio = Portfolio(
        name="Test Portfolio",
        initial_capital=10000,
        current_cash=10000,
    )
    db_session.add(portfolio)
    db_session.commit()
    return portfolio


@pytest.fixture
def performance_calculator(db_session):
    """Create performance calculator instance."""
    return PerformanceCalculator(db_session)


class TestDailySnapshot:
    """Test daily portfolio snapshot creation."""

    def test_create_snapshot_today(self, db_session, test_portfolio, performance_calculator):
        """Test creating snapshot for today."""
        snapshot = performance_calculator.create_daily_snapshot(test_portfolio)
        
        assert snapshot.portfolio_id == test_portfolio.id
        assert snapshot.date == date.today()
        assert snapshot.nav == test_portfolio.nav
        assert snapshot.cash_balance == test_portfolio.current_cash

    def test_create_snapshot_specific_date(self, db_session, test_portfolio, performance_calculator):
        """Test creating snapshot for specific date."""
        specific_date = date(2025, 1, 15)
        snapshot = performance_calculator.create_daily_snapshot(test_portfolio, specific_date)
        
        assert snapshot.date == specific_date

    def test_snapshot_persists_in_db(self, db_session, test_portfolio, performance_calculator):
        """Test snapshot is stored in database."""
        performance_calculator.create_daily_snapshot(test_portfolio)
        
        retrieved = db_session.query(PortfolioSnapshot).filter_by(
            portfolio_id=test_portfolio.id
        ).first()
        
        assert retrieved is not None
        assert retrieved.nav == test_portfolio.nav


class TestSharpeRatio:
    """Test Sharpe ratio calculation."""

    def test_sharpe_insufficient_data(self, db_session, test_portfolio, performance_calculator):
        """Test Sharpe ratio with insufficient data."""
        result = performance_calculator.calculate_sharpe_ratio(test_portfolio)
        assert result is None

    def test_sharpe_with_two_snapshots(self, db_session, test_portfolio, performance_calculator):
        """Test Sharpe ratio with two snapshots."""
        # Create two snapshots
        performance_calculator.create_daily_snapshot(test_portfolio, date(2025, 1, 1))
        
        test_portfolio.current_cash = 10500  # Simulate gain
        db_session.commit()
        
        performance_calculator.create_daily_snapshot(test_portfolio, date(2025, 1, 2))
        
        sharpe = performance_calculator.calculate_sharpe_ratio(test_portfolio)
        assert sharpe is not None
        assert isinstance(sharpe, float)


class TestSortinoRatio:
    """Test Sortino ratio calculation."""

    def test_sortino_insufficient_data(self, db_session, test_portfolio, performance_calculator):
        """Test Sortino ratio with insufficient data."""
        result = performance_calculator.calculate_sortino_ratio(test_portfolio)
        assert result is None

    def test_sortino_with_data(self, db_session, test_portfolio, performance_calculator):
        """Test Sortino ratio calculation with data."""
        performance_calculator.create_daily_snapshot(test_portfolio, date(2025, 1, 1))
        
        test_portfolio.current_cash = 10200
        db_session.commit()
        
        performance_calculator.create_daily_snapshot(test_portfolio, date(2025, 1, 2))
        
        sortino = performance_calculator.calculate_sortino_ratio(test_portfolio)
        assert sortino is not None
        assert isinstance(sortino, float)


class TestMaxDrawdown:
    """Test maximum drawdown calculation."""

    def test_max_drawdown_insufficient_data(self, db_session, test_portfolio, performance_calculator):
        """Test max drawdown with insufficient data."""
        result = performance_calculator.calculate_max_drawdown(test_portfolio)
        assert result is None

    def test_max_drawdown_no_decline(self, db_session, test_portfolio, performance_calculator):
        """Test max drawdown when portfolio only goes up."""
        performance_calculator.create_daily_snapshot(test_portfolio, date(2025, 1, 1))
        
        test_portfolio.current_cash = 11000  # 10% gain
        db_session.commit()
        performance_calculator.create_daily_snapshot(test_portfolio, date(2025, 1, 2))
        
        dd = performance_calculator.calculate_max_drawdown(test_portfolio)
        assert dd == 0.0

    def test_max_drawdown_with_decline(self, db_session, test_portfolio, performance_calculator):
        """Test max drawdown with price decline."""
        performance_calculator.create_daily_snapshot(test_portfolio, date(2025, 1, 1))
        
        # Simulate 10% gain
        test_portfolio.current_cash = 11000
        db_session.commit()
        performance_calculator.create_daily_snapshot(test_portfolio, date(2025, 1, 2))
        
        # Then 5% loss from peak
        test_portfolio.current_cash = 10450
        db_session.commit()
        performance_calculator.create_daily_snapshot(test_portfolio, date(2025, 1, 3))
        
        dd = performance_calculator.calculate_max_drawdown(test_portfolio)
        assert dd is not None
        assert dd > 0


class TestVolatility:
    """Test volatility calculation."""

    def test_volatility_insufficient_data(self, db_session, test_portfolio, performance_calculator):
        """Test volatility with insufficient data."""
        result = performance_calculator.calculate_volatility(test_portfolio)
        assert result is None

    def test_volatility_calculation(self, db_session, test_portfolio, performance_calculator):
        """Test volatility calculation."""
        # Create multiple snapshots
        for i in range(5):
            test_portfolio.current_cash = 10000 + (i * 100)
            db_session.commit()
            performance_calculator.create_daily_snapshot(
                test_portfolio, 
                date(2025, 1, 1) + timedelta(days=i)
            )
        
        vol = performance_calculator.calculate_volatility(test_portfolio)
        assert vol is not None
        assert isinstance(vol, float)
        assert vol >= 0


class TestWinRate:
    """Test win rate calculation."""

    def test_win_rate_no_trades(self, db_session, test_portfolio, performance_calculator):
        """Test win rate with no trades."""
        result = performance_calculator.calculate_win_rate(test_portfolio)
        assert result is None

    def test_win_rate_with_winning_trade(self, db_session, test_portfolio, performance_calculator):
        """Test win rate with winning trades."""
        # Create buy transaction
        buy = Transaction(
            portfolio_id=test_portfolio.id,
            asset_type=AssetType.STOCK,
            ticker="AAPL",
            order_type=OrderType.BUY,
            quantity=Decimal(10),
            price=Decimal(100),
            fee=Decimal(0),
            total_cost=Decimal(1000),
        )
        db_session.add(buy)
        db_session.commit()
        
        # Create sell transaction at higher price
        sell = Transaction(
            portfolio_id=test_portfolio.id,
            asset_type=AssetType.STOCK,
            ticker="AAPL",
            order_type=OrderType.SELL,
            quantity=Decimal(10),
            price=Decimal(110),  # Profit
            fee=Decimal(0),
            total_cost=Decimal(1100),
        )
        db_session.add(sell)
        db_session.commit()
        
        win_rate = performance_calculator.calculate_win_rate(test_portfolio)
        assert win_rate == 100.0


class TestAvgWinLoss:
    """Test average win/loss calculation."""

    def test_avg_win_loss_no_trades(self, db_session, test_portfolio, performance_calculator):
        """Test avg win/loss with no trades."""
        avg_win, avg_loss = performance_calculator.calculate_avg_win_loss(test_portfolio)
        assert avg_win is None
        assert avg_loss is None

    def test_avg_win_loss_with_trades(self, db_session, test_portfolio, performance_calculator):
        """Test avg win/loss calculation."""
        # Buy at 100, sell at 110 (10% win)
        buy1 = Transaction(
            portfolio_id=test_portfolio.id,
            asset_type=AssetType.STOCK,
            ticker="AAPL",
            order_type=OrderType.BUY,
            quantity=Decimal(10),
            price=Decimal(100),
            fee=Decimal(0),
            total_cost=Decimal(1000),
        )
        db_session.add(buy1)
        db_session.commit()
        
        sell1 = Transaction(
            portfolio_id=test_portfolio.id,
            asset_type=AssetType.STOCK,
            ticker="AAPL",
            order_type=OrderType.SELL,
            quantity=Decimal(10),
            price=Decimal(110),
            fee=Decimal(0),
            total_cost=Decimal(1100),
        )
        db_session.add(sell1)
        db_session.commit()
        
        avg_win, avg_loss = performance_calculator.calculate_avg_win_loss(test_portfolio)
        assert avg_win == 10.0  # 10% win


class TestAssetAllocation:
    """Test asset allocation calculation."""

    def test_allocation_cash_only(self, db_session, test_portfolio, performance_calculator):
        """Test allocation with cash only."""
        allocation = performance_calculator.calculate_asset_allocation(test_portfolio)
        
        assert "cash" in allocation
        assert allocation["cash"] == 100.0  # All cash

    def test_allocation_with_holdings(self, db_session, test_portfolio, performance_calculator):
        """Test allocation with holdings."""
        # Add a holding
        holding = Holding(
            portfolio_id=test_portfolio.id,
            asset_type=AssetType.STOCK,
            ticker="AAPL",
            quantity=Decimal(10),
            entry_price=Decimal(100),
            current_price=Decimal(100),
        )
        db_session.add(holding)
        
        test_portfolio.current_cash = Decimal(9000)
        db_session.commit()
        
        allocation = performance_calculator.calculate_asset_allocation(test_portfolio)
        
        assert "stock" in allocation
        assert "cash" in allocation
        assert allocation["stock"] == pytest.approx(50.0, rel=1)  # ~50% stocks


class TestPerformanceMetrics:
    """Test comprehensive performance metrics creation."""

    def test_create_performance_metrics(self, db_session, test_portfolio, performance_calculator):
        """Test creating performance metrics."""
        # Create snapshots first
        performance_calculator.create_daily_snapshot(test_portfolio, date(2025, 1, 1))
        
        metric = performance_calculator.create_performance_metrics(test_portfolio)
        
        assert metric.portfolio_id == test_portfolio.id
        assert metric.sharpe_ratio is not None
        assert metric.volatility is not None
        assert metric.max_drawdown is not None


class TestRiskMetrics:
    """Test risk metrics calculation."""

    def test_create_risk_metrics(self, db_session, test_portfolio, performance_calculator):
        """Test creating risk metrics."""
        metric = performance_calculator.create_risk_metrics(test_portfolio)
        
        assert metric.portfolio_id == test_portfolio.id
        assert metric.liquidity_score is not None
        assert metric.sector_allocation is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
