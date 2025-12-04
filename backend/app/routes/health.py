from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import redis
import time
from ..core.database import get_db
from ..core.config import settings
from ..services.celery_app import celery_app

router = APIRouter()


@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """System health check for monitoring."""
    
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
    
    # Check Redis connection
    try:
        r = redis.from_url(settings.redis_url)
        r.ping()
        health_status["services"]["redis"] = "healthy"
    except Exception as e:
        health_status["services"]["redis"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    # Check Celery workers
    try:
        inspect = celery_app.control.inspect()
        active_workers = inspect.active()
        if active_workers:
            health_status["services"]["celery"] = "healthy"
            health_status["worker_count"] = len(active_workers)
        else:
            health_status["services"]["celery"] = "no active workers"
            health_status["status"] = "degraded"
    except Exception as e:
        health_status["services"]["celery"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    # AI Service basic check
    try:
        # Basic check - in production this would ping the AI service
        if settings.google_ai_api_key:
            health_status["services"]["ai_service"] = "configured"
        else:
            health_status["services"]["ai_service"] = "not configured"
            health_status["status"] = "degraded"
    except Exception as e:
        health_status["services"]["ai_service"] = f"error: {str(e)}"
        health_status["status"] = "degraded"
    
    return health_status