"""Database migration script to add user authentication tables."""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from src.database import Base, engine, init_db
from src.models import User, Portfolio

def migrate_database():
    """Create or update database tables."""
    print("🔄 Starting database migration...")
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database migration completed successfully!")
        print("📊 Tables created/updated:")
        for table_name in Base.metadata.tables.keys():
            print(f"   - {table_name}")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    migrate_database()
