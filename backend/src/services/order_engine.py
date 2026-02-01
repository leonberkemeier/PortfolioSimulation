"""Order engine for processing portfolio trades with validation and fee calculation."""

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Optional, Tuple
from enum import Enum

from ..models import Portfolio, Holding, Transaction, OrderType, AssetType, FeeStructure
from .price_lookup import PriceLookup


class OrderStatus(str, Enum):
    """Order execution status."""
    SUCCESS = "success"
    INSUFFICIENT_CASH = "insufficient_cash"
    INSUFFICIENT_HOLDINGS = "insufficient_holdings"
    POSITION_SIZE_LIMIT = "position_size_limit"
    ALLOCATION_LIMIT = "allocation_limit"
    INVALID_ASSET = "invalid_asset"
    VALIDATION_ERROR = "validation_error"


@dataclass
class OrderConfirmation:
    """Confirmation details for an executed order."""
    status: OrderStatus
    ticker: str
    asset_type: AssetType
    order_type: str
    quantity: Decimal
    price: Decimal
    fee: Decimal
    total_cost: Decimal
    timestamp: datetime
    message: str
    order_id: Optional[int] = None


class OrderEngine:
    """Engine for processing buy and sell orders."""

    def __init__(self, db_session):
        """
        Initialize order engine.
        
        Args:
            db_session: SQLAlchemy session for database operations
        """
        self.db = db_session
        self.price_lookup = PriceLookup()

    def buy(
        self,
        portfolio: Portfolio,
        ticker: str,
        asset_type: AssetType,
        quantity: Decimal,
        fee_structure: Optional[FeeStructure] = None,
    ) -> OrderConfirmation:
        """
        Process a buy order.
        
        Args:
            portfolio: Portfolio to buy for
            ticker: Asset ticker/symbol
            asset_type: Type of asset (STOCK, CRYPTO, BOND, COMMODITY)
            quantity: Number of units to buy
            fee_structure: Fee structure to apply (uses first assignment if not specified)
            
        Returns:
            OrderConfirmation with execution details
        """
        # Get fee structure
        if fee_structure is None and portfolio.fee_assignments:
            fee_structure = portfolio.fee_assignments[0].fee_structure
        
        # Get current price
        price = self.price_lookup.get_price(ticker, asset_type)
        if price is None:
            return OrderConfirmation(
                status=OrderStatus.INVALID_ASSET,
                ticker=ticker,
                asset_type=asset_type,
                order_type="buy",
                quantity=quantity,
                price=Decimal(0),
                fee=Decimal(0),
                total_cost=Decimal(0),
                timestamp=datetime.utcnow(),
                message=f"Asset not found in database: {ticker}",
            )

        # Calculate cost and fees
        transaction_amount = quantity * price
        fee = Decimal(fee_structure.calculate_fee(float(transaction_amount))) if fee_structure else Decimal(0)
        total_cost = transaction_amount + fee

        # Validate order
        validation_result = self._validate_buy_order(portfolio, ticker, asset_type, quantity, price, total_cost)
        if validation_result[0] != OrderStatus.SUCCESS:
            return OrderConfirmation(
                status=validation_result[0],
                ticker=ticker,
                asset_type=asset_type,
                order_type="buy",
                quantity=quantity,
                price=price,
                fee=fee,
                total_cost=total_cost,
                timestamp=datetime.utcnow(),
                message=validation_result[1],
            )

        # Execute order
        try:
            # Deduct cash
            portfolio.current_cash -= total_cost

            # Update or create holding
            existing_holding = next(
                (h for h in portfolio.holdings if h.ticker == ticker and h.asset_type == asset_type),
                None,
            )

            if existing_holding:
                # Update existing position (calculate new average entry price)
                old_value = existing_holding.quantity * existing_holding.entry_price
                new_value = quantity * price
                existing_holding.quantity += quantity
                existing_holding.entry_price = (old_value + new_value) / existing_holding.quantity
                existing_holding.current_price = price
            else:
                # Create new holding
                holding = Holding(
                    portfolio_id=portfolio.id,
                    asset_type=asset_type,
                    ticker=ticker,
                    quantity=quantity,
                    entry_price=price,
                    current_price=price,
                )
                portfolio.holdings.append(holding)
                self.db.add(holding)

            # Record transaction
            transaction = Transaction(
                portfolio_id=portfolio.id,
                asset_type=asset_type,
                ticker=ticker,
                order_type=OrderType.BUY,
                quantity=quantity,
                price=price,
                fee=fee,
                total_cost=total_cost,
            )
            portfolio.transactions.append(transaction)
            self.db.add(transaction)

            # Commit changes
            self.db.commit()
            self.db.refresh(portfolio)

            return OrderConfirmation(
                status=OrderStatus.SUCCESS,
                ticker=ticker,
                asset_type=asset_type,
                order_type="buy",
                quantity=quantity,
                price=price,
                fee=fee,
                total_cost=total_cost,
                timestamp=transaction.timestamp,
                message=f"Successfully bought {quantity} {ticker} at ${price}",
                order_id=transaction.id,
            )

        except Exception as e:
            self.db.rollback()
            return OrderConfirmation(
                status=OrderStatus.VALIDATION_ERROR,
                ticker=ticker,
                asset_type=asset_type,
                order_type="buy",
                quantity=quantity,
                price=price,
                fee=fee,
                total_cost=total_cost,
                timestamp=datetime.utcnow(),
                message=f"Order execution failed: {str(e)}",
            )

    def sell(
        self,
        portfolio: Portfolio,
        ticker: str,
        asset_type: AssetType,
        quantity: Decimal,
        fee_structure: Optional[FeeStructure] = None,
    ) -> OrderConfirmation:
        """
        Process a sell order.
        
        Args:
            portfolio: Portfolio to sell from
            ticker: Asset ticker/symbol
            asset_type: Type of asset
            quantity: Number of units to sell
            fee_structure: Fee structure to apply
            
        Returns:
            OrderConfirmation with execution details
        """
        # Get fee structure
        if fee_structure is None and portfolio.fee_assignments:
            fee_structure = portfolio.fee_assignments[0].fee_structure

        # Get current price
        price = self.price_lookup.get_price(ticker, asset_type)
        if price is None:
            return OrderConfirmation(
                status=OrderStatus.INVALID_ASSET,
                ticker=ticker,
                asset_type=asset_type,
                order_type="sell",
                quantity=quantity,
                price=Decimal(0),
                fee=Decimal(0),
                total_cost=Decimal(0),
                timestamp=datetime.utcnow(),
                message=f"Asset not found in database: {ticker}",
            )

        # Calculate proceeds and fees
        transaction_amount = quantity * price
        fee = Decimal(fee_structure.calculate_fee(float(transaction_amount))) if fee_structure else Decimal(0)
        net_proceeds = transaction_amount - fee

        # Validate order
        validation_result = self._validate_sell_order(portfolio, ticker, asset_type, quantity)
        if validation_result[0] != OrderStatus.SUCCESS:
            return OrderConfirmation(
                status=validation_result[0],
                ticker=ticker,
                asset_type=asset_type,
                order_type="sell",
                quantity=quantity,
                price=price,
                fee=fee,
                total_cost=net_proceeds,
                timestamp=datetime.utcnow(),
                message=validation_result[1],
            )

        # Execute order
        try:
            # Add proceeds to cash
            portfolio.current_cash += net_proceeds

            # Update holding
            holding = next(
                (h for h in portfolio.holdings if h.ticker == ticker and h.asset_type == asset_type)
            )
            holding.quantity -= quantity

            # Remove holding if fully sold
            if holding.quantity == 0:
                portfolio.holdings.remove(holding)
                self.db.delete(holding)

            # Record transaction
            transaction = Transaction(
                portfolio_id=portfolio.id,
                asset_type=asset_type,
                ticker=ticker,
                order_type=OrderType.SELL,
                quantity=quantity,
                price=price,
                fee=fee,
                total_cost=net_proceeds,
            )
            portfolio.transactions.append(transaction)
            self.db.add(transaction)

            # Commit changes
            self.db.commit()
            self.db.refresh(portfolio)

            return OrderConfirmation(
                status=OrderStatus.SUCCESS,
                ticker=ticker,
                asset_type=asset_type,
                order_type="sell",
                quantity=quantity,
                price=price,
                fee=fee,
                total_cost=net_proceeds,
                timestamp=transaction.timestamp,
                message=f"Successfully sold {quantity} {ticker} at ${price}",
                order_id=transaction.id,
            )

        except Exception as e:
            self.db.rollback()
            return OrderConfirmation(
                status=OrderStatus.VALIDATION_ERROR,
                ticker=ticker,
                asset_type=asset_type,
                order_type="sell",
                quantity=quantity,
                price=price,
                fee=fee,
                total_cost=net_proceeds,
                timestamp=datetime.utcnow(),
                message=f"Order execution failed: {str(e)}",
            )

    def _validate_buy_order(
        self,
        portfolio: Portfolio,
        ticker: str,
        asset_type: AssetType,
        quantity: Decimal,
        price: Decimal,
        total_cost: Decimal,
    ) -> Tuple[OrderStatus, str]:
        """Validate buy order against portfolio constraints."""
        
        # Check sufficient cash
        if not portfolio.can_afford_trade(total_cost):
            return (
                OrderStatus.INSUFFICIENT_CASH,
                f"Insufficient cash. Need ${total_cost}, have ${portfolio.current_cash}",
            )

        # Check position size limit
        position_value = quantity * price
        if not portfolio.can_place_order(position_value):
            if portfolio.max_position_size:
                max_allowed = portfolio.total_value * portfolio.max_position_size / 100
                return (
                    OrderStatus.POSITION_SIZE_LIMIT,
                    f"Position exceeds limit. Max: ${max_allowed}, requested: ${position_value}",
                )

        # Check max cash per trade
        if portfolio.max_cash_per_trade and total_cost > portfolio.max_cash_per_trade:
            return (
                OrderStatus.ALLOCATION_LIMIT,
                f"Trade exceeds max per trade. Max: ${portfolio.max_cash_per_trade}, requested: ${total_cost}",
            )

        return (OrderStatus.SUCCESS, "Validation passed")

    def _validate_sell_order(
        self,
        portfolio: Portfolio,
        ticker: str,
        asset_type: AssetType,
        quantity: Decimal,
    ) -> Tuple[OrderStatus, str]:
        """Validate sell order against portfolio holdings."""
        
        # Find holding
        holding = next(
            (h for h in portfolio.holdings if h.ticker == ticker and h.asset_type == asset_type),
            None,
        )

        if not holding:
            return (
                OrderStatus.INSUFFICIENT_HOLDINGS,
                f"No holdings of {ticker} to sell",
            )

        # Check sufficient quantity
        if holding.quantity < quantity:
            return (
                OrderStatus.INSUFFICIENT_HOLDINGS,
                f"Insufficient holdings. Have {holding.quantity}, trying to sell {quantity}",
            )

        return (OrderStatus.SUCCESS, "Validation passed")
