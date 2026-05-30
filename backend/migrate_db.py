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
        # Create all tables (no-op for existing tables)
        Base.metadata.create_all(bind=engine)
        print("✅ Database migration completed successfully!")
        print("📊 Tables created/updated:")
        for table_name in Base.metadata.tables.keys():
            print(f"   - {table_name}")

        # Additive migrations: add new columns to existing tables if missing
        _add_column_if_missing("users", "risk_profile_id", "INTEGER")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise


def _add_column_if_missing(table: str, column: str, col_type: str):
    """Add a column to a table if it doesn't already exist (SQLite-safe)."""
    from sqlalchemy import text
    with engine.connect() as conn:
        result = conn.execute(text(f"PRAGMA table_info({table})"))
        existing = [row[1] for row in result.fetchall()]
        if column not in existing:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
            conn.commit()
            print(f"   ✚ Added column {table}.{column}")
        else:
            print(f"   ✓ Column {table}.{column} already exists")

if __name__ == "__main__":
    migrate_database()
