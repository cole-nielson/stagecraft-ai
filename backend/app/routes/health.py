from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import time
from ..core.database import get_db
from ..core.config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    """Simple health check - no database required."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
    }


@router.get("/health/full")
async def full_health_check(db: Session = Depends(get_db)):
    """Full system health check with database and AI service status."""
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "services": {}
    }

    # Check database connection
    try:
        db.execute(text("SELECT 1"))
        health_status["services"]["database"] = "healthy"
    except Exception as e:
        health_status["services"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"

    # AI Service check
    if settings.google_ai_api_key:
        health_status["services"]["ai_service"] = "configured"
    else:
        health_status["services"]["ai_service"] = "not configured"
        health_status["status"] = "degraded"

    return health_status
