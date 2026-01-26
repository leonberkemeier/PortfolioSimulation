"""Main FastAPI application for Trading Simulator."""

from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import SessionLocal, get_db
from schemas import HealthCheckResponse, ErrorResponse
from routes import portfolios, orders, analytics

# Create FastAPI app
app = FastAPI(
    title="Trading Simulator API",
    description="Portfolio simulation and backtesting API",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ Health Check ============

@app.get(
    "/health",
    response_model=HealthCheckResponse,
    tags=["Health"],
    summary="Health check endpoint"
)
async def health_check():
    """Check if API is running and database is accessible."""
    return HealthCheckResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.utcnow()
    )


# ============ Include Routes ============

app.include_router(
    portfolios.router,
    prefix="/api/portfolios",
    tags=["Portfolios"]
)

app.include_router(
    orders.router,
    prefix="/api/orders",
    tags=["Orders"]
)

app.include_router(
    analytics.router,
    prefix="/api/analytics",
    tags=["Analytics"]
)

# ============ Error Handlers ============

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions with consistent error format."""
    return {
        "status_code": exc.status_code,
        "error": exc.detail,
        "message": str(exc),
        "details": None
    }


@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    """Handle validation errors."""
    return {
        "status_code": 400,
        "error": "Validation Error",
        "message": str(exc),
        "details": None
    }


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions."""
    return {
        "status_code": 500,
        "error": "Internal Server Error",
        "message": "An unexpected error occurred",
        "details": str(exc) if str(exc) else None
    }


# ============ Startup/Shutdown ============

@app.on_event("startup")
async def startup_event():
    """Initialize on startup."""
    print("🚀 Trading Simulator API starting...")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    print("🛑 Trading Simulator API shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
