"""
Alert Service
Handles price alert checking and triggering logic
"""
from datetime import datetime
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from ..models.alert import PriceAlert, AlertCondition, AlertStatus
import yfinance as yf


class AlertService:
    """Service for managing and checking price alerts"""

    @staticmethod
    def check_alert(alert: PriceAlert, current_price: float) -> bool:
        """
        Check if alert should be triggered based on current price
        
        Args:
            alert: The price alert to check
            current_price: Current market price
            
        Returns:
            True if alert should trigger, False otherwise
        """
        if alert.condition == AlertCondition.ABOVE:
            return current_price > alert.target_price
            
        elif alert.condition == AlertCondition.BELOW:
            return current_price < alert.target_price
            
        elif alert.condition == AlertCondition.CROSSES_ABOVE:
            # Need previous price to detect crossing
            if alert.last_checked_price is None:
                return False
            return (alert.last_checked_price <= alert.target_price and 
                   current_price > alert.target_price)
            
        elif alert.condition == AlertCondition.CROSSES_BELOW:
            # Need previous price to detect crossing
            if alert.last_checked_price is None:
                return False
            return (alert.last_checked_price >= alert.target_price and 
                   current_price < alert.target_price)
        
        return False

    @staticmethod
    def check_all_alerts(db: Session) -> List[Dict]:
        """
        Check all active alerts and trigger those that meet conditions
        
        Args:
            db: Database session
            
        Returns:
            List of triggered alerts with details
        """
        triggered_alerts = []
        
        # Get all active alerts
        alerts = db.query(PriceAlert).filter(
            PriceAlert.status == AlertStatus.ACTIVE
        ).all()
        
        # Group alerts by symbol for efficient price fetching
        symbol_alerts = {}
        for alert in alerts:
            if alert.symbol not in symbol_alerts:
                symbol_alerts[alert.symbol] = []
            symbol_alerts[alert.symbol].append(alert)
        
        # Check each symbol's alerts
        for symbol, symbol_alert_list in symbol_alerts.items():
            try:
                # Fetch current price
                ticker = yf.Ticker(symbol)
                info = ticker.info
                current_price = info.get('currentPrice') or info.get('regularMarketPrice')
                
                if current_price is None:
                    continue
                
                # Check each alert for this symbol
                for alert in symbol_alert_list:
                    # Check expiration
                    if alert.expires_at and datetime.utcnow() > alert.expires_at:
                        alert.status = AlertStatus.EXPIRED
                        db.commit()
                        continue
                    
                    # Check if alert should trigger
                    should_trigger = AlertService.check_alert(alert, current_price)
                    
                    # Update last checked info
                    alert.last_checked_price = current_price
                    alert.last_checked_at = datetime.utcnow()
                    
                    if should_trigger:
                        # Trigger the alert
                        alert.trigger_count += 1
                        alert.triggered_at = datetime.utcnow()
                        
                        # Update status based on repeat setting
                        if not alert.repeat:
                            alert.status = AlertStatus.TRIGGERED
                        
                        triggered_alerts.append({
                            "alert": alert.to_dict(),
                            "current_price": current_price,
                            "triggered_at": datetime.utcnow().isoformat()
                        })
                    
                    db.commit()
                    
            except Exception as e:
                print(f"Error checking alerts for {symbol}: {e}")
                continue
        
        return triggered_alerts

    @staticmethod
    def check_alerts_for_symbol(db: Session, symbol: str) -> List[Dict]:
        """
        Check alerts for a specific symbol
        
        Args:
            db: Database session
            symbol: Stock symbol to check
            
        Returns:
            List of triggered alerts
        """
        triggered_alerts = []
        
        alerts = db.query(PriceAlert).filter(
            PriceAlert.symbol == symbol.upper(),
            PriceAlert.status == AlertStatus.ACTIVE
        ).all()
        
        if not alerts:
            return triggered_alerts
        
        try:
            # Fetch current price
            ticker = yf.Ticker(symbol)
            info = ticker.info
            current_price = info.get('currentPrice') or info.get('regularMarketPrice')
            
            if current_price is None:
                return triggered_alerts
            
            for alert in alerts:
                # Check expiration
                if alert.expires_at and datetime.utcnow() > alert.expires_at:
                    alert.status = AlertStatus.EXPIRED
                    db.commit()
                    continue
                
                # Check if alert should trigger
                should_trigger = AlertService.check_alert(alert, current_price)
                
                # Update last checked info
                alert.last_checked_price = current_price
                alert.last_checked_at = datetime.utcnow()
                
                if should_trigger:
                    # Trigger the alert
                    alert.trigger_count += 1
                    alert.triggered_at = datetime.utcnow()
                    
                    # Update status based on repeat setting
                    if not alert.repeat:
                        alert.status = AlertStatus.TRIGGERED
                    
                    triggered_alerts.append({
                        "alert": alert.to_dict(),
                        "current_price": current_price,
                        "triggered_at": datetime.utcnow().isoformat()
                    })
                
                db.commit()
                
        except Exception as e:
            print(f"Error checking alerts for {symbol}: {e}")
        
        return triggered_alerts
