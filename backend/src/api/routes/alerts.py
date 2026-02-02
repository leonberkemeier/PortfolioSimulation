"""
Alert Routes
API endpoints for managing price alerts
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from ...database import get_db
from ...models.alert import PriceAlert, AlertCondition, AlertStatus
from ...services.alert_service import AlertService


router = APIRouter()


# Pydantic schemas
class AlertCreate(BaseModel):
    symbol: str
    condition: AlertCondition
    target_price: float
    message: Optional[str] = None
    expires_at: Optional[datetime] = None
    repeat: bool = False
    notify_browser: bool = True
    notify_email: bool = False


class AlertUpdate(BaseModel):
    target_price: Optional[float] = None
    message: Optional[str] = None
    status: Optional[AlertStatus] = None
    expires_at: Optional[datetime] = None
    repeat: Optional[bool] = None


class AlertResponse(BaseModel):
    id: int
    symbol: str
    condition: str
    target_price: float
    status: str
    message: Optional[str]
    created_at: str
    triggered_at: Optional[str]
    expires_at: Optional[str]
    last_checked_price: Optional[float]
    last_checked_at: Optional[str]
    trigger_count: int
    repeat: bool

    class Config:
        from_attributes = True


@router.post("/", response_model=AlertResponse)
async def create_alert(alert_data: AlertCreate, db: Session = Depends(get_db)):
    """Create a new price alert"""
    try:
        alert = PriceAlert(
            symbol=alert_data.symbol.upper(),
            condition=alert_data.condition,
            target_price=alert_data.target_price,
            message=alert_data.message,
            expires_at=alert_data.expires_at,
            repeat=alert_data.repeat,
            notify_browser=alert_data.notify_browser,
            notify_email=alert_data.notify_email,
            status=AlertStatus.ACTIVE
        )
        
        db.add(alert)
        db.commit()
        db.refresh(alert)
        
        return alert.to_dict()
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create alert: {str(e)}")


@router.get("/", response_model=List[AlertResponse])
async def get_alerts(
    symbol: Optional[str] = None,
    status: Optional[AlertStatus] = None,
    active_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get all alerts with optional filtering"""
    try:
        query = db.query(PriceAlert)
        
        if symbol:
            query = query.filter(PriceAlert.symbol == symbol.upper())
        
        if status:
            query = query.filter(PriceAlert.status == status)
        
        if active_only:
            query = query.filter(PriceAlert.status == AlertStatus.ACTIVE)
        
        alerts = query.order_by(PriceAlert.created_at.desc()).all()
        return [alert.to_dict() for alert in alerts]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch alerts: {str(e)}")


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(alert_id: int, db: Session = Depends(get_db)):
    """Get a specific alert by ID"""
    alert = db.query(PriceAlert).filter(PriceAlert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return alert.to_dict()


@router.put("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: int,
    alert_data: AlertUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing alert"""
    alert = db.query(PriceAlert).filter(PriceAlert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    try:
        if alert_data.target_price is not None:
            alert.target_price = alert_data.target_price
        if alert_data.message is not None:
            alert.message = alert_data.message
        if alert_data.status is not None:
            alert.status = alert_data.status
        if alert_data.expires_at is not None:
            alert.expires_at = alert_data.expires_at
        if alert_data.repeat is not None:
            alert.repeat = alert_data.repeat
        
        db.commit()
        db.refresh(alert)
        
        return alert.to_dict()
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update alert: {str(e)}")


@router.delete("/{alert_id}")
async def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    """Delete an alert"""
    alert = db.query(PriceAlert).filter(PriceAlert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    try:
        db.delete(alert)
        db.commit()
        return {"message": "Alert deleted successfully", "id": alert_id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete alert: {str(e)}")


@router.post("/check")
async def check_alerts(
    symbol: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Check alerts and trigger those that meet conditions
    If symbol provided, only check alerts for that symbol
    """
    try:
        if symbol:
            triggered = AlertService.check_alerts_for_symbol(db, symbol)
        else:
            triggered = AlertService.check_all_alerts(db)
        
        return {
            "checked_at": datetime.utcnow().isoformat(),
            "triggered_count": len(triggered),
            "triggered_alerts": triggered
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check alerts: {str(e)}")


@router.post("/{alert_id}/disable")
async def disable_alert(alert_id: int, db: Session = Depends(get_db)):
    """Disable an alert"""
    alert = db.query(PriceAlert).filter(PriceAlert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    try:
        alert.status = AlertStatus.DISABLED
        db.commit()
        db.refresh(alert)
        
        return alert.to_dict()
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to disable alert: {str(e)}")


@router.post("/{alert_id}/enable")
async def enable_alert(alert_id: int, db: Session = Depends(get_db)):
    """Enable a disabled alert"""
    alert = db.query(PriceAlert).filter(PriceAlert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    try:
        if alert.status == AlertStatus.DISABLED:
            alert.status = AlertStatus.ACTIVE
        db.commit()
        db.refresh(alert)
        
        return alert.to_dict()
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to enable alert: {str(e)}")
