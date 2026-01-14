from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
import os
import base64
import uuid as uuid_module
from uuid import UUID
from datetime import datetime, timezone
import logging

from ..core.database import get_db, SessionLocal
from ..core.auth import get_current_user
from ..models.staging import Staging
from ..models.user import User
from ..services.ai_service import ai_service
from ..core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


async def process_staging_background(staging_id: str, image_bytes: bytes):
    """Background task to process room staging with AI."""
    db = SessionLocal()
    
    try:
        # Get staging record
        staging = db.query(Staging).filter(Staging.id == staging_id).first()
        if not staging:
            logger.error(f"Staging {staging_id} not found")
            return

        logger.info(f"Processing staging {staging_id}")

        # Process with AI service
        success, staged_bytes, quality_score, error = await ai_service.stage_room_from_bytes(image_bytes)

        if success and staged_bytes:
            # Update staging record with success
            staging.status = "completed"
            staging.staged_image_path = f"staged_{staging_id}.jpg"
            staging.staged_image_data = base64.b64encode(staged_bytes).decode('utf-8')
            staging.quality_score = quality_score
            staging.architectural_integrity = True
            staging.completed_at = datetime.now(timezone.utc)
            logger.info(f"Staging {staging_id} completed successfully")
        else:
            # Update staging record with failure
            staging.status = "failed"
            staging.error_message = error or "AI staging failed"
            logger.error(f"Staging {staging_id} failed: {error}")

        db.commit()

    except Exception as e:
        logger.error(f"Error processing staging {staging_id}: {str(e)}")
        try:
            staging = db.query(Staging).filter(Staging.id == staging_id).first()
            if staging:
                staging.status = "failed"
                staging.error_message = str(e)
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


@router.post("/stage")
async def stage_room(
    request: Request,
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    room_type: Optional[str] = Form(None),
    quality_mode: Optional[str] = Form("premium"),
    project_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Upload and stage a room photo with AI staging."""

    # Validate file type
    if not image.content_type or not image.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Read image bytes
    image_bytes = await image.read()
    
    # Validate file size
    if len(image_bytes) > settings.max_upload_size:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    # Generate staging ID
    staging_id = uuid_module.uuid4()
    file_extension = os.path.splitext(image.filename or "image.jpg")[1] or '.jpg'
    original_filename = f"original_{str(staging_id)}{file_extension}"

    # Encode image as base64 for storage
    original_image_b64 = base64.b64encode(image_bytes).decode('utf-8')

    # Create staging record
    staging = Staging(
        id=staging_id,
        original_image_path=original_filename,
        original_image_data=original_image_b64,
        style="default",
        room_type=room_type,
        quality_mode=quality_mode,
        status="processing",
        user_id=current_user.id if current_user else None,
        project_id=UUID(project_id) if project_id else None
    )

    db.add(staging)
    db.commit()

    # Start background processing
    background_tasks.add_task(process_staging_background, str(staging_id), image_bytes)

    return {
        "id": str(staging_id),
        "status": "processing",
        "original_image_url": f"/api/images/{original_filename}",
        "style": "default",
        "room_type": room_type or "auto-detected",
        "quality_mode": quality_mode,
        "project_id": project_id,
        "estimated_time_seconds": 30
    }


@router.get("/stage/{staging_id}")
async def get_staging_status(staging_id: str, db: Session = Depends(get_db)):
    """Get staging status and results."""
    
    staging = db.query(Staging).filter(Staging.id == staging_id).first()
    if not staging:
        raise HTTPException(status_code=404, detail="Staging not found")
    
    result = {
        "id": str(staging.id),
        "status": staging.status,
        "original_image_url": f"/api/images/{os.path.basename(staging.original_image_path)}",
        "style": "default",
        "room_type": staging.room_type,
        "quality_mode": staging.quality_mode,
        "created_at": staging.created_at.isoformat() if staging.created_at else None,
    }
    
    if staging.status == "completed":
        result.update({
            "staged_image_url": f"/api/images/{os.path.basename(staging.staged_image_path)}" if staging.staged_image_path else None,
            "processing_time_ms": staging.processing_time_ms,
            "quality_score": float(staging.quality_score) if staging.quality_score else None,
            "architectural_integrity": staging.architectural_integrity,
            "completed_at": staging.completed_at.isoformat() if staging.completed_at else None,
        })
    elif staging.status == "failed":
        result["error"] = staging.error_message
    
    return result
