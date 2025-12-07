from celery import current_task
from sqlalchemy.orm import Session
from ..core.database import SessionLocal
from ..models.staging import Staging
from .ai_service import AIService
from .celery_app import celery_app
import time
from datetime import datetime, timezone


@celery_app.task(bind=True)
def process_staging(self, staging_id: str):
    """Background task to process room staging with AI."""
    
    db = SessionLocal()
    ai_service = AIService()
    
    try:
        # Get staging record
        staging = db.query(Staging).filter(Staging.id == staging_id).first()
        if not staging:
            return {"error": "Staging not found"}
        
        # Update status to processing
        staging.status = "processing"
        db.commit()
        
        # Update progress
        current_task.update_state(
            state='PROGRESS',
            meta={'progress': 25, 'stage': 'Analyzing room layout...'}
        )
        
        # Simulate room analysis
        time.sleep(2)
        
        # Update progress
        current_task.update_state(
            state='PROGRESS', 
            meta={'progress': 50, 'stage': 'Selecting luxury furnishings...'}
        )
        
        # Process staging with AI (pass staging_id, not file path)
        start_time = time.time()

        # Import asyncio to run async function
        import asyncio
        success, result, quality_score = asyncio.run(ai_service.stage_room(
            staging_id  # Pass staging_id - ai_service loads from Redis
        ))

        processing_time = int((time.time() - start_time) * 1000)

        # Update progress
        current_task.update_state(
            state='PROGRESS',
            meta={'progress': 85, 'stage': 'Finalizing professional staging...'}
        )

        if success:
            # Update staging record with results
            staging.status = "completed"
            staging.staged_image_path = result  # This is now the staged filename
            staging.processing_time_ms = processing_time
            staging.quality_score = quality_score
            staging.architectural_integrity = ai_service.check_architectural_integrity(
                staging_id, result  # Pass staging_id and filename
            )
            staging.completed_at = datetime.now(timezone.utc)
            
            db.commit()
            
            return {
                "status": "completed",
                "staging_id": staging_id,
                "staged_image_path": result,
                "processing_time_ms": processing_time,
                "quality_score": quality_score
            }
        else:
            # Update staging record with error
            staging.status = "failed"
            staging.error_message = result
            staging.processing_time_ms = processing_time
            
            db.commit()
            
            return {
                "status": "failed", 
                "staging_id": staging_id,
                "error": result
            }
            
    except Exception as e:
        # Update staging record with error
        if 'staging' in locals():
            staging.status = "failed"
            staging.error_message = str(e)
            db.commit()
            
        return {
            "status": "failed",
            "staging_id": staging_id, 
            "error": str(e)
        }
    
    finally:
        db.close()