from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
from ..core.config import settings

router = APIRouter()


@router.get("/images/{filename}")
async def serve_image(filename: str):
    """Serve uploaded and staged images."""
    
    # Security: Only allow image files and prevent directory traversal
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
    file_ext = os.path.splitext(filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    if '..' in filename or '/' in filename or '\\' in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    file_path = os.path.join(settings.upload_dir, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(
        file_path,
        media_type=f"image/{file_ext[1:]}",
        filename=filename
    )