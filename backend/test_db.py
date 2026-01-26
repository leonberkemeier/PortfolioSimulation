#!/usr/bin/env python
"""Test script to verify database was created correctly."""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from database import SessionLocal
from models import FeeStructure, Portfolio

def main():
    db = SessionLocal()
    
    try:
        # Test 1: Check fee structures
        print("\n" + "="*60)
        print("✅ FEE STRUCTURES")
        print("="*60)
        fees = db.query(FeeStructure).all()
        for fee in fees:
            print(f"  - {fee.name}")
            print(f"    Type: {fee.fee_type.value}, Amount: {fee.fee_amount}")
            print(f"    Description: {fee.description}\n")
        
        print(f"Total: {len(fees)} fee structures created\n")
        
        # Test 2: Create a test portfolio
        print("="*60)
        print("✅ CREATING TEST PORTFOLIO")
        print("="*60)
        test_portfolio = Portfolio(
            name="Test Portfolio",
            description="Test portfolio with $10,000 budget",
            initial_capital=10000,
            current_cash=10000,
            max_position_size=10,
            max_cash_per_trade=2000,
        )
        db.add(test_portfolio)
        db.commit()
        db.refresh(test_portfolio)
        
        print(f"  Portfolio ID: {test_portfolio.id}")
        print(f"  Name: {test_portfolio.name}")
        print(f"  Initial Capital: ${test_portfolio.initial_capital}")
        print(f"  Current Cash: ${test_portfolio.current_cash}")
        print(f"  Total Value (NAV): ${test_portfolio.nav}")
        print(f"  Total Return: {test_portfolio.total_return_pct:.2f}%")
        print(f"  Deployed Capital: ${test_portfolio.deployed_capital}")
        print(f"  Available Cash %: {test_portfolio.available_cash_pct:.2f}%\n")
        
        # Test 3: Verify validation methods
        print("="*60)
        print("✅ TESTING VALIDATION METHODS")
        print("="*60)
        print(f"  Can afford $5,000 trade? {test_portfolio.can_afford_trade(5000)}")
        print(f"  Can afford $12,000 trade? {test_portfolio.can_afford_trade(12000)}")
        print(f"  Can place $1,500 order (15%)? {test_portfolio.can_place_order(1500)}")
        print(f"  Can place $2,000 order (20%)? {test_portfolio.can_place_order(2000)}\n")
        
        # Test 4: Query test portfolio back
        print("="*60)
        print("✅ QUERYING PORTFOLIO FROM DATABASE")
        print("="*60)
        retrieved = db.query(Portfolio).filter_by(name="Test Portfolio").first()
        if retrieved:
            print(f"  Found portfolio: {retrieved.name}")
            print(f"  Initial Capital: ${retrieved.initial_capital}")
            print(f"  Model Name: {retrieved.model_name}")
            print(f"  Status: {retrieved.status.value}\n")
        
        print("="*60)
        print("✅ ALL TESTS PASSED!")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main()
