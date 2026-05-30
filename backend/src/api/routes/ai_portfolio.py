"""AI Model Portfolio routes.

POST /api/portfolio/greenfield_models  — called by deploy_on_ai-pc daily
GET  /api/portfolio/my-ai-portfolio    — called by the frontend for the logged-in user
"""

import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...database import get_db
from ...models.ai_portfolio import AIModelPortfolio
from ...models.user import User
from ...utils.auth import get_current_user
from ..schemas import (
    GreenfieldModelsPayload,
    AIPortfolioResponse,
    AIPortfolioPosition,
)

router = APIRouter()


@router.post("/greenfield_models", status_code=status.HTTP_201_CREATED)
async def receive_greenfield_models(
    payload: GreenfieldModelsPayload,
    db: Session = Depends(get_db),
):
    """
    Receive the 5 AI-built model portfolios from deploy_on_ai-pc.

    Called once per day by the AI PC daemon after the greenfield_portfolio_task
    completes. No user auth required — this is a machine-to-machine call over
    Tailscale. In production, protect this endpoint with a shared API key.

    Upserts one row per profile_id: if a portfolio for that profile and date
    already exists, it is overwritten with the new positions.
    """
    saved = 0
    for model in payload.models:
        positions_json = json.dumps(
            [{"ticker": p.ticker, "weight": p.weight} for p in model.positions]
        )

        # Check if we already have a record for this profile + date
        existing = (
            db.query(AIModelPortfolio)
            .filter(
                AIModelPortfolio.profile_id == model.profile_id,
                AIModelPortfolio.execution_date == model.execution_date,
            )
            .first()
        )

        if existing:
            existing.positions_json = positions_json
            existing.profile_name   = model.profile_name
        else:
            db.add(
                AIModelPortfolio(
                    profile_id=model.profile_id,
                    profile_name=model.profile_name,
                    execution_date=model.execution_date,
                    positions_json=positions_json,
                )
            )
        saved += 1

    db.commit()
    return {"message": f"Saved {saved} model portfolio(s) for {payload.execution_date}."}


@router.get("/my-ai-portfolio", response_model=AIPortfolioResponse)
async def get_my_ai_portfolio(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return the AI-built model portfolio for the logged-in user's risk profile.

    Looks up the user's risk_profile_id and returns the most recently pushed
    model portfolio for that profile.

    Raises 404 if:
    - The user hasn't completed the risk assessment (risk_profile_id is null)
    - The AI PC hasn't pushed any portfolios yet
    """
    if current_user.risk_profile_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="no_profile",  # frontend uses this to show the assessment prompt
        )

    record = (
        db.query(AIModelPortfolio)
        .filter(AIModelPortfolio.profile_id == current_user.risk_profile_id)
        .order_by(AIModelPortfolio.execution_date.desc(), AIModelPortfolio.created_at.desc())
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="no_portfolio",  # frontend shows "waiting for AI PC" state
        )

    positions = [
        AIPortfolioPosition(**p)
        for p in json.loads(record.positions_json)
    ]

    return AIPortfolioResponse(
        profile_id=record.profile_id,
        profile_name=record.profile_name,
        execution_date=record.execution_date,
        positions=positions,
        created_at=record.created_at,
    )
