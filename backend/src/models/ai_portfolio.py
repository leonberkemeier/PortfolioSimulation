"""AI Model Portfolio — stores the 5 greenfield portfolios pushed by the AI PC daily."""

from datetime import datetime
from sqlalchemy import Column, Integer, SmallInteger, String, Text, DateTime
from ..database import Base


class AIModelPortfolio(Base):
    """
    One row per risk profile per daily run.
    The AI PC (deploy_on_ai-pc) pushes these via POST /api/portfolio/greenfield_models.
    Users fetch their assigned portfolio via GET /api/portfolio/my-ai-portfolio.
    """

    __tablename__ = "ai_model_portfolios"

    id             = Column(Integer, primary_key=True, index=True)
    profile_id     = Column(SmallInteger, nullable=False, index=True)  # 1–5
    profile_name   = Column(String(100), nullable=False)
    execution_date = Column(String(10), nullable=False)   # ISO date, e.g. "2026-05-30"
    # JSON array: [{"ticker": "AAPL", "weight": 0.0667}, ...]
    positions_json = Column(Text, nullable=False)
    created_at     = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return (
            f"<AIModelPortfolio(profile_id={self.profile_id}, "
            f"name={self.profile_name!r}, date={self.execution_date!r})>"
        )
