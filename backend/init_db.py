#!/usr/bin/env python
"""Initialize the trading simulator database with tables and seed data."""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.database import init_db, SessionLocal
from src.models import FeeStructure, FeeType


def seed_fee_structures():
    """Seed initial fee structures for testing."""
    db = SessionLocal()
    try:
        # Check if structures already exist
        if db.query(FeeStructure).count() > 0:
            print("Fee structures already exist, skipping seed...")
            return

        fee_structures = [
            FeeStructure(
                name="Zero Fee",
                fee_type=FeeType.ZERO,
                fee_amount=0,
                description="No trading fees - ideal for testing without cost impact"
            ),
            FeeStructure(
                name="Low Cost (0.05%)",
                fee_type=FeeType.PERCENT,
                fee_amount=0.05,
                description="Low percentage fee at 0.05% per trade"
            ),
            FeeStructure(
                name="Standard (0.1%)",
                fee_type=FeeType.PERCENT,
                fee_amount=0.1,
                description="Standard percentage fee at 0.1% per trade"
            ),
            FeeStructure(
                name="High Cost (0.5%)",
                fee_type=FeeType.PERCENT,
                fee_amount=0.5,
                description="High percentage fee at 0.5% per trade"
            ),
            FeeStructure(
                name="Flat $5",
                fee_type=FeeType.FLAT,
                fee_amount=5.00,
                description="Fixed $5 fee per trade"
            ),
            FeeStructure(
                name="Flat $10",
                fee_type=FeeType.FLAT,
                fee_amount=10.00,
                description="Fixed $10 fee per trade"
            ),
        ]

        db.add_all(fee_structures)
        db.commit()
        print(f"✅ Created {len(fee_structures)} fee structures")

    except Exception as e:
        print(f"❌ Error seeding fee structures: {e}")
        db.rollback()
    finally:
        db.close()


def main():
    """Initialize database and seed data."""
    print("🗄️  Initializing Trading Simulator database...")
    
    try:
        # Create tables
        init_db()
        print("✅ Database tables created")
        
        # Seed initial data
        seed_fee_structures()
        
        print("✅ Database initialization complete!")
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
