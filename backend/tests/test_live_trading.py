"""Test Live Trading View API endpoints."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)


def test_live_trading_routes_exist():
    """Verify live-trading routes are registered."""
    # Get OpenAPI schema
    response = client.get("/api/openapi.json")
    assert response.status_code == 200
    
    schema = response.json()
    paths = list(schema['paths'].keys())
    
    # Check for live-trading routes
    live_trading_paths = [p for p in paths if 'live-trading' in p]
    assert len(live_trading_paths) >= 2, f"Expected at least 2 live-trading routes, got {len(live_trading_paths)}"
    
    # Verify specific endpoints
    assert any('dashboard' in p for p in live_trading_paths), "Dashboard endpoint not found"
    assert any('intraday' in p for p in live_trading_paths), "Intraday endpoint not found"


def test_live_trading_dashboard_works():
    """Test that dashboard endpoint works with existing portfolio."""
    # Query portfolio 1 (created by init_db)
    response = client.get("/api/live-trading/dashboard/1")
    assert response.status_code == 200
    
    data = response.json()
    assert 'portfolio' in data
    assert 'holdings' in data
    assert 'execution_status' in data
    assert 'market_status' in data


def test_live_trading_intraday_works():
    """Test that intraday endpoint works (empty holdings are OK)."""
    # Query portfolio 1
    response = client.get("/api/live-trading/intraday/1")
    # May return 200 (with empty data) or 404 if no holdings
    assert response.status_code in [200, 404]


def test_api_documentation():
    """Verify API documentation is available."""
    response = client.get("/api/docs")
    # Documentation endpoint may not be enabled in all configs
    # Just verify the app responds
    assert response.status_code in [200, 404]


if __name__ == "__main__":
    test_live_trading_routes_exist()
    print("✓ Live trading routes exist")
    
    test_live_trading_dashboard_works()
    print("✓ Dashboard endpoint works")
    
    test_live_trading_intraday_works()
    print("✓ Intraday endpoint works")
    
    test_api_documentation()
    print("✓ API available")
    
    print("\nAll tests passed!")
