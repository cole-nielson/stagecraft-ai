from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional, List
import os
import uuid
from celery import group
from ..core.database import get_db
from ..models.staging import Staging
from ..services.tasks import process_staging
from ..services.rate_limiter import rate_limiter
from ..services.image_storage import image_storage
from ..core.config import settings

router = APIRouter()


def get_client_ip(request: Request) -> str:
    """Get client IP, handling proxies."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def check_rate_limits(request: Request, image_count: int = 1):
    """Check both user and global rate limits."""
    client_ip = get_client_ip(request)

    # Check global limit first
    global_allowed, global_remaining = rate_limiter.check_global_limit()
    if not global_allowed:
        raise HTTPException(
            status_code=429,
            detail="Daily limit reached. This free demo allows 30 generations per day. Please try again tomorrow!"
        )

    # Check user limit
    user_allowed, user_remaining = rate_limiter.check_user_limit(client_ip)
    if not user_allowed:
        raise HTTPException(
            status_code=429,
            detail="You've reached your daily limit of 10 free generations. Please try again tomorrow!"
        )

    # Check if batch would exceed limits
    if image_count > user_remaining:
        raise HTTPException(
            status_code=429,
            detail=f"You only have {user_remaining} generations remaining today. Please reduce your batch size."
        )

    if image_count > global_remaining:
        raise HTTPException(
            status_code=429,
            detail=f"Only {global_remaining} generations remaining for today's demo. Please reduce your batch size."
        )

    return client_ip


@router.post("/stage")
async def stage_room(
    request: Request,
    image: UploadFile = File(...),
    room_type: Optional[str] = Form(None),
    quality_mode: Optional[str] = Form("premium"),
    db: Session = Depends(get_db)
):
    """Upload and stage a room photo with luxury AI staging."""

    # Check rate limits
    client_ip = check_rate_limits(request, image_count=1)

    # Validate file
    if not image.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    if image.size > settings.max_upload_size:
        raise HTTPException(status_code=400, detail="File too large")
    
    
    # Generate staging ID and store image in Redis
    staging_id = uuid.uuid4()
    file_extension = os.path.splitext(image.filename)[1] or '.jpg'
    original_filename = f"original_{str(staging_id)}{file_extension}"

    # Read image bytes and store in Redis (accessible by both backend and worker)
    image_bytes = await image.read()
    if not image_storage.store_image(str(staging_id), image_bytes, "original"):
        raise HTTPException(status_code=500, detail="Failed to store image")

    # Store metadata for content type
    image_storage.store_image_metadata(str(staging_id), original_filename, image.content_type)

    # Create staging record (path is now just a reference, not actual file path)
    staging = Staging(
        id=staging_id,
        original_image_path=original_filename,  # Just store the filename reference
        style="default",
        room_type=room_type,
        quality_mode=quality_mode,
        status="processing"
    )
    
    db.add(staging)
    db.commit()
    
    # Start background processing
    task = process_staging.delay(str(staging_id))

    # Increment rate limit counter after successful submission
    rate_limiter.increment_usage(client_ip)

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
    request: Request,
    images: List[UploadFile] = File(...),
    room_types: Optional[List[str]] = Form(None),
    quality_mode: Optional[str] = Form("premium"),
    db: Session = Depends(get_db)
):
    """Upload and stage multiple room photos with luxury AI staging."""

    # Check rate limits for batch size
    client_ip = check_rate_limits(request, image_count=len(images))

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

        # Store image in Redis
        file_extension = os.path.splitext(image.filename)[1] or '.jpg'
        original_filename = f"original_{str(staging_id)}{file_extension}"

        # Read and store image bytes in Redis
        image_bytes = await image.read()
        if not image_storage.store_image(str(staging_id), image_bytes, "original"):
            raise HTTPException(status_code=500, detail=f"Failed to store image {image.filename}")

        # Store metadata
        image_storage.store_image_metadata(str(staging_id), original_filename, image.content_type)

        # Create staging record
        staging = Staging(
            id=staging_id,
            original_image_path=original_filename,  # Just the filename reference
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

    # Increment rate limit counter for each image
    for _ in images:
        rate_limiter.increment_usage(client_ip)

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