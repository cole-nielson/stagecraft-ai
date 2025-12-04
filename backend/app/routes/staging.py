from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
import os
import uuid
import shutil
from celery import group
from ..core.database import get_db
from ..models.staging import Staging
from ..services.tasks import process_staging
from ..core.config import settings

router = APIRouter()


@router.post("/stage")
async def stage_room(
    image: UploadFile = File(...),
    room_type: Optional[str] = Form(None),
    quality_mode: Optional[str] = Form("premium"),
    db: Session = Depends(get_db)
):
    """Upload and stage a room photo with luxury AI staging."""
    
    # Validate file
    if not image.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    if image.size > settings.max_upload_size:
        raise HTTPException(status_code=400, detail="File too large")
    
    
    # Save uploaded image
    staging_id = uuid.uuid4()
    file_extension = os.path.splitext(image.filename)[1] or '.jpg'
    original_filename = f"original_{str(staging_id)}{file_extension}"
    original_path = os.path.join(settings.upload_dir, original_filename)
    
    # Ensure upload directory exists
    os.makedirs(settings.upload_dir, exist_ok=True)
    
    # Save file
    with open(original_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    
    # Create staging record
    staging = Staging(
        id=staging_id,
        original_image_path=original_path,
        style="default",
        room_type=room_type,
        quality_mode=quality_mode,
        status="processing"
    )
    
    db.add(staging)
    db.commit()
    
    # Start background processing
    task = process_staging.delay(str(staging_id))
    
    return {
        "id": str(staging_id),
        "status": "processing",
        "original_image_url": f"/api/images/{original_filename}",
        "style": "default",
        "room_type": room_type or "auto-detected",
        "quality_mode": quality_mode,
        "task_id": task.id,
        "estimated_time_seconds": 25
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


@router.post("/stage-batch")
async def stage_batch(
    images: List[UploadFile] = File(...),
    room_types: Optional[List[str]] = Form(None),
    quality_mode: Optional[str] = Form("premium"),
    db: Session = Depends(get_db)
):
    """Upload and stage multiple room photos with luxury AI staging."""
    
    # Validate batch size
    if len(images) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 images allowed per batch")
    
    if len(images) == 0:
        raise HTTPException(status_code=400, detail="At least one image required")
    
    # Validate all files are images
    for image in images:
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail=f"File {image.filename} must be an image")
        
        if image.size > settings.max_upload_size:
            raise HTTPException(status_code=400, detail=f"File {image.filename} too large")
    
    # Generate batch ID
    batch_id = uuid.uuid4()
    
    # Ensure upload directory exists
    os.makedirs(settings.upload_dir, exist_ok=True)
    
    staging_records = []
    task_signatures = []
    
    # Process each image
    for i, image in enumerate(images):
        # Generate staging ID
        staging_id = uuid.uuid4()
        
        # Determine room type
        room_type = None
        if room_types and i < len(room_types):
            room_type = room_types[i]
        
        # Save uploaded image
        file_extension = os.path.splitext(image.filename)[1] or '.jpg'
        original_filename = f"original_{str(staging_id)}{file_extension}"
        original_path = os.path.join(settings.upload_dir, original_filename)
        
        # Save file
        with open(original_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Create staging record
        staging = Staging(
            id=staging_id,
            original_image_path=original_path,
            style="default",
            room_type=room_type,
            quality_mode=quality_mode,
            status="processing",
            batch_id=batch_id
        )
        
        db.add(staging)
        staging_records.append(staging)
        
        # Create task signature for batch processing
        task_signatures.append(process_staging.s(str(staging_id)))
    
    # Commit all staging records
    db.commit()
    
    # Execute all tasks as a group for parallel processing
    job = group(task_signatures)
    group_result = job.apply_async()
    
    # Prepare response
    response_items = []
    for staging in staging_records:
        response_items.append({
            "id": str(staging.id),
            "status": "processing",
            "original_image_url": f"/api/images/{os.path.basename(staging.original_image_path)}",
            "style": "default",
            "room_type": staging.room_type or "auto-detected",
            "quality_mode": staging.quality_mode
        })
    
    return {
        "batch_id": str(batch_id),
        "total_images": len(images),
        "stagings": response_items,
        "group_task_id": group_result.id,
        "estimated_time_seconds": 25 * len(images)
    }


@router.get("/batch/{batch_id}")
async def get_batch_status(batch_id: str, db: Session = Depends(get_db)):
    """Get batch staging status and results."""
    
    stagings = db.query(Staging).filter(Staging.batch_id == batch_id).all()
    if not stagings:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    # Calculate batch statistics
    total = len(stagings)
    completed = sum(1 for s in stagings if s.status == "completed")
    failed = sum(1 for s in stagings if s.status == "failed")
    processing = sum(1 for s in stagings if s.status == "processing")
    
    # Determine overall batch status
    if completed == total:
        batch_status = "completed"
    elif failed == total:
        batch_status = "failed"
    elif failed > 0 or completed > 0:
        batch_status = "partial"
    else:
        batch_status = "processing"
    
    # Build response for each staging
    staging_results = []
    for staging in stagings:
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
        
        staging_results.append(result)
    
    return {
        "batch_id": batch_id,
        "status": batch_status,
        "total": total,
        "completed": completed,
        "failed": failed,
        "processing": processing,
        "stagings": staging_results
    }