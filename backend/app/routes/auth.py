from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
import httpx
from datetime import timedelta
from urllib.parse import urlencode
from ..core.database import get_db
from ..core.config import settings
from ..core.auth import create_access_token, get_current_user_required, hash_password, verify_password
from ..models.user import User
import uuid

router = APIRouter()


# Pydantic schemas for auth
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict

@router.get("/auth/google")
async def google_login():
    """Initiate Google OAuth login."""
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": "http://localhost:8000/auth/google/callback",
        "scope": "openid email profile",
        "response_type": "code",
        "access_type": "offline",
        "prompt": "select_account"
    }
    
    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return RedirectResponse(url=auth_url)

@router.get("/auth/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback."""
    try:
        # Exchange code for token
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": "http://localhost:8000/auth/google/callback"
        }
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data)
            token_json = token_response.json()
            
            if "access_token" not in token_json:
                raise HTTPException(status_code=400, detail="Failed to get access token")
            
            # Get user info
            access_token = token_json["access_token"]
            user_info_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            user_info = user_info_response.json()
            
            if "email" not in user_info:
                raise HTTPException(status_code=400, detail="Failed to get user email")
            
            # Find or create user
            user = db.query(User).filter(User.email == user_info["email"]).first()
            if not user:
                user = User(
                    email=user_info["email"],
                    name=user_info.get("name", ""),
                    google_id=user_info.get("id"),
                    avatar_url=user_info.get("picture"),
                    auth_provider="google",
                    api_key=str(uuid.uuid4())
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            else:
                # Update Google info if user exists
                user.google_id = user_info.get("id")
                user.avatar_url = user_info.get("picture")
                if not user.auth_provider:
                    user.auth_provider = "google"
                db.commit()
            
            # Create JWT token
            access_token = create_access_token(
                data={"sub": user.email},
                expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
            )
            
            # Redirect to frontend with token
            frontend_url = f"http://localhost:3000/auth/success?token={access_token}"
            return RedirectResponse(url=frontend_url)
            
    except Exception as e:
        print(f"OAuth error: {e}")
        error_url = f"http://localhost:3000/auth/error?error={str(e)}"
        return RedirectResponse(url=error_url)

@router.get("/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user_required)):
    """Get current user information."""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "name": current_user.name,
        "plan": current_user.plan,
        "usage_limit": current_user.usage_limit,
        "current_usage": current_user.current_usage
    }

@router.post("/auth/logout")
async def logout():
    """Logout endpoint (client-side token removal)."""
    return {"message": "Logged out successfully"}


@router.post("/auth/register")
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user with email and password."""
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Validate password length
    if len(request.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )

    # Create new user
    user = User(
        email=request.email,
        name=request.name,
        password_hash=hash_password(request.password),
        auth_provider="email",
        api_key=str(uuid.uuid4())
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create JWT token
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
    )

    return {
        "token": access_token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "plan": user.plan,
            "usage_limit": user.usage_limit,
            "current_usage": user.current_usage
        }
    }


@router.post("/auth/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password."""
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Check if user has a password (might be OAuth-only user)
    if not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account uses Google sign-in. Please use Google to log in."
        )

    # Verify password
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Create JWT token
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
    )

    return {
        "token": access_token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "plan": user.plan,
            "usage_limit": user.usage_limit,
            "current_usage": user.current_usage
        }
    }