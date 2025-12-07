from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
import os
import re
from ..services.image_storage import image_storage

router = APIRouter()


def extract_staging_id(filename: str) -> tuple[str, str]:
    """
    Extract staging_id and image type from filename.
    Formats: original_{staging_id}.jpg or staged_{staging_id}.jpg
    """
    # Match pattern: (original|staged)_{uuid}.{ext}
    match = re.match(r'^(original|staged)_([a-f0-9-]+)\.\w+$', filename)
    if match:
        image_type = match.group(1)
        staging_id = match.group(2)
        return staging_id, image_type
    return None, None


@router.get("/images/{filename}")
async def serve_image(filename: str):
    """Serve uploaded and staged images from Redis storage."""

    # Security: Only allow image files and prevent directory traversal
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
    file_ext = os.path.splitext(filename)[1].lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type")

    if '..' in filename or '/' in filename or '\\' in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    # Extract staging ID and image type from filename
    staging_id, image_type = extract_staging_id(filename)
    if not staging_id or not image_type:
        raise HTTPException(status_code=400, detail="Invalid filename format")

    # Get image from Redis
    image_bytes = image_storage.get_image(staging_id, image_type)
    if not image_bytes:
        raise HTTPException(status_code=404, detail="Image not found")

    # Determine content type
    content_type = f"image/{file_ext[1:]}"
    if file_ext == '.jpg':
        content_type = "image/jpeg"

    return Response(
        content=image_bytes,
        media_type=content_type,
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "Cache-Control": "public, max-age=3600"
        }
    )