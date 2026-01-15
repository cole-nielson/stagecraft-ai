from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import time
import logging
from ..core.database import get_db
from ..core.config import settings

logger = logging.getLogger(__name__)
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
    """Full system health check with database."""
    
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


@router.get("/health/test-ai")
async def test_ai_service():
    """Test AI service with a simple text-to-image generation."""
    from ..services.ai_service import ai_service
    from google.genai import types

    result = {
        "status": "testing",
        "client_configured": ai_service.client is not None,
        "model_name": ai_service.model_name if hasattr(ai_service, 'model_name') else None,
    }

    if not ai_service.client:
        result["status"] = "failed"
        result["error"] = "AI client not configured"
        return result

    try:
        # Simple test: generate a basic image
        test_prompt = "A simple red apple on a white background"

        config = types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"],
        )

        logger.info(f"Testing AI with prompt: {test_prompt}")
        logger.info(f"Using model: {ai_service.model_name}")

        response = ai_service.client.models.generate_content(
            model=ai_service.model_name,
            contents=[test_prompt],
            config=config
        )

        result["response_type"] = str(type(response))
        result["has_parts"] = hasattr(response, 'parts')
        result["has_candidates"] = hasattr(response, 'candidates')

        if hasattr(response, 'parts') and response.parts:
            result["num_parts"] = len(response.parts)
            parts_info = []
            for i, part in enumerate(response.parts):
                part_info = {
                    "index": i,
                    "has_text": part.text is not None,
                    "has_inline_data": part.inline_data is not None,
                }
                if part.text:
                    part_info["text_preview"] = part.text[:200]
                if part.inline_data:
                    part_info["mime_type"] = getattr(part.inline_data, 'mime_type', 'unknown')
                parts_info.append(part_info)
            result["parts"] = parts_info
            result["status"] = "success" if any(p.get("has_inline_data") for p in parts_info) else "no_image"
        elif hasattr(response, 'candidates') and response.candidates:
            result["num_candidates"] = len(response.candidates)
            candidate = response.candidates[0]
            result["finish_reason"] = str(getattr(candidate, 'finish_reason', 'unknown'))
            if hasattr(candidate, 'content') and candidate.content:
                if hasattr(candidate.content, 'parts'):
                    result["candidate_parts"] = len(candidate.content.parts)
            result["status"] = "candidates_only"
        else:
            result["status"] = "empty_response"

    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)
        import traceback
        result["traceback"] = traceback.format_exc()
        logger.error(f"AI test error: {e}")
        logger.error(traceback.format_exc())

    return result
