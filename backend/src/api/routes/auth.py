"""Authentication routes for user registration and login."""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ...database import get_db
from ...models.user import User
from ...utils.auth import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    get_current_user
)
from ...config import ACCESS_TOKEN_EXPIRE_MINUTES
from ..schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse
)

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register a new user (admin only)."""
    # Only superusers can create new users
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create new users"
        )
    
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        is_superuser=user_data.is_superuser or False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and receive JWT token."""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information."""
    return current_user


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all users (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can list users"
        )
    
    users = db.query(User).all()
    return users


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a user (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete users"
        )
    
    # Can't delete yourself
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": f"User {user.username} deleted successfully"}


@router.post("/logout")
async def logout():
    """Logout (client should discard token)."""
    return {"message": "Successfully logged out"}
