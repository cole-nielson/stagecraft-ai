from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import httpx
from datetime import timedelta
from urllib.parse import urlencode
from ..core.database import get_db
from ..core.config import settings
from ..core.auth import create_access_token, get_current_user_required
from ..models.user import User
import uuid

router = APIRouter()

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