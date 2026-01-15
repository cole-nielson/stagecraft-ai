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
                    parts = candidate.content.parts
                    result["candidate_parts"] = len(parts)
                    parts_detail = []
                    has_image = False
                    for i, part in enumerate(parts):
                        detail = {
                            "index": i,
                            "has_text": part.text is not None,
                            "has_inline_data": part.inline_data is not None,
                        }
                        if part.text:
                            detail["text_preview"] = part.text[:300]
                        if part.inline_data:
                            has_image = True
                            detail["mime_type"] = getattr(part.inline_data, 'mime_type', 'unknown')
                            detail["data_length"] = len(part.inline_data.data) if part.inline_data.data else 0
                        parts_detail.append(detail)
                    result["candidate_parts_detail"] = parts_detail
                    result["status"] = "success_image" if has_image else "text_only_no_image"
            else:
                result["status"] = "candidates_no_content"
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


@router.get("/health/test-ai-edit")
async def test_ai_image_edit():
    """Test AI service with image editing (input image + prompt)."""
    from ..services.ai_service import ai_service
    from google.genai import types
    from PIL import Image
    import io

    result = {
        "status": "testing",
        "test_type": "image_editing",
        "client_configured": ai_service.client is not None,
        "model_name": ai_service.model_name,
    }

    if not ai_service.client:
        result["status"] = "failed"
        result["error"] = "AI client not configured"
        return result

    try:
        # Create a simple test image (solid color room-like image)
        test_image = Image.new('RGB', (800, 600), color=(240, 240, 235))
        result["test_image_size"] = f"{test_image.size[0]}x{test_image.size[1]}"
        result["test_image_mode"] = test_image.mode

        test_prompt = "Add a modern sofa and coffee table to this empty room. Generate an image."

        config = types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"],
        )

        logger.info(f"Testing image edit with prompt: {test_prompt}")
        logger.info(f"Input image: {test_image.size}, mode={test_image.mode}")

        # This is how the staging code calls it
        response = ai_service.client.models.generate_content(
            model=ai_service.model_name,
            contents=[test_prompt, test_image],
            config=config
        )

        result["response_type"] = str(type(response))
        result["has_parts"] = hasattr(response, 'parts') and bool(response.parts)
        result["has_candidates"] = hasattr(response, 'candidates') and bool(response.candidates)

        # Check response.parts first
        if hasattr(response, 'parts') and response.parts:
            result["path_used"] = "response.parts"
            parts_detail = []
            has_image = False
            for i, part in enumerate(response.parts):
                detail = {"index": i, "has_text": part.text is not None, "has_inline_data": part.inline_data is not None}
                if part.text:
                    detail["text_preview"] = part.text[:300]
                if part.inline_data:
                    has_image = True
                    detail["mime_type"] = getattr(part.inline_data, 'mime_type', 'unknown')
                    detail["data_length"] = len(part.inline_data.data) if part.inline_data.data else 0
                parts_detail.append(detail)
            result["parts_detail"] = parts_detail
            result["status"] = "success_image" if has_image else "text_only"

        # Fallback to candidates
        elif hasattr(response, 'candidates') and response.candidates:
            result["path_used"] = "response.candidates"
            candidate = response.candidates[0]
            result["finish_reason"] = str(getattr(candidate, 'finish_reason', 'unknown'))

            if hasattr(candidate, 'content') and candidate.content and hasattr(candidate.content, 'parts'):
                parts = candidate.content.parts
                parts_detail = []
                has_image = False
                for i, part in enumerate(parts):
                    detail = {"index": i, "has_text": part.text is not None, "has_inline_data": part.inline_data is not None}
                    if part.text:
                        detail["text_preview"] = part.text[:300]
                    if part.inline_data:
                        has_image = True
                        detail["mime_type"] = getattr(part.inline_data, 'mime_type', 'unknown')
                        detail["data_length"] = len(part.inline_data.data) if part.inline_data.data else 0
                    parts_detail.append(detail)
                result["parts_detail"] = parts_detail
                result["status"] = "success_image" if has_image else "text_only"
            else:
                result["status"] = "no_content_parts"
        else:
            result["status"] = "empty_response"

    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)
        import traceback
        result["traceback"] = traceback.format_exc()

    return result
