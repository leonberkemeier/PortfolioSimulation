"""Create initial admin user for the Trading Simulator."""

import sys
import getpass
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from src.database import SessionLocal
from src.models.user import User
from src.utils.auth import get_password_hash


def create_admin():
    """Create the initial admin user."""
    print("🔐 Create Admin User for Trading Simulator")
    print("=" * 50)
    
    db = SessionLocal()
    
    try:
        # Check if any users exist
        user_count = db.query(User).count()
        if user_count > 0:
            print(f"\n⚠️  Warning: {user_count} user(s) already exist in the database.")
            response = input("Do you want to create another admin user anyway? (yes/no): ")
            if response.lower() not in ['yes', 'y']:
                print("❌ Admin creation cancelled.")
                return
        
        # Get username
        while True:
            username = input("\nEnter admin username: ").strip()
            if len(username) < 3:
                print("❌ Username must be at least 3 characters.")
                continue
            
            # Check if username exists
            existing = db.query(User).filter(User.username == username).first()
            if existing:
                print(f"❌ Username '{username}' already exists.")
                continue
            
            break
        
        # Get password
        while True:
            password = getpass.getpass("Enter admin password: ")
            if len(password) < 6:
                print("❌ Password must be at least 6 characters.")
                continue
            
            password_confirm = getpass.getpass("Confirm password: ")
            if password != password_confirm:
                print("❌ Passwords do not match.")
                continue
            
            break
        
        # Get optional details
        full_name = input("Enter full name (optional, press Enter to skip): ").strip() or None
        email = input("Enter email (optional, press Enter to skip): ").strip() or None
        
        # Create admin user
        admin_user = User(
            username=username,
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            is_active=True,
            is_superuser=True  # This is the key - makes them an admin
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("\n" + "=" * 50)
        print("✅ Admin user created successfully!")
        print("=" * 50)
        print(f"Username: {admin_user.username}")
        print(f"Full Name: {admin_user.full_name or 'Not provided'}")
        print(f"Email: {admin_user.email or 'Not provided'}")
        print(f"Is Admin: {admin_user.is_superuser}")
        print(f"Created: {admin_user.created_at}")
        print("=" * 50)
        print("\n🎉 You can now login at: http://localhost:5173/login")
        print(f"   Username: {admin_user.username}")
        print("   Password: [the password you just entered]")
        print("\n💡 As an admin, you can create more users from the API or create another script.")
        
    except Exception as e:
        print(f"\n❌ Error creating admin user: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
