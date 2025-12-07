"""
Redis-based image storage for distributed deployments.
Both backend and worker services can access the same images via Redis.
"""
import redis
import base64
from typing import Optional
from ..core.config import settings


class ImageStorage:
    """Store and retrieve images via Redis for distributed access."""

    # TTL for images in Redis (24 hours)
    IMAGE_TTL = 60 * 60 * 24

    def __init__(self):
        self.redis = redis.from_url(settings.redis_url)

    def _get_key(self, image_type: str, staging_id: str) -> str:
        """Generate Redis key for an image."""
        return f"image:{image_type}:{staging_id}"

    def store_image(self, staging_id: str, image_bytes: bytes, image_type: str = "original") -> bool:
        """
        Store image bytes in Redis.

        Args:
            staging_id: Unique ID for the staging job
            image_bytes: Raw image bytes
            image_type: Either 'original' or 'staged'

        Returns:
            True if stored successfully
        """
        try:
            key = self._get_key(image_type, staging_id)
            # Store as base64 for safe serialization
            encoded = base64.b64encode(image_bytes).decode('utf-8')
            self.redis.setex(key, self.IMAGE_TTL, encoded)
            return True
        except Exception as e:
            print(f"Failed to store image in Redis: {e}")
            return False

    def get_image(self, staging_id: str, image_type: str = "original") -> Optional[bytes]:
        """
        Retrieve image bytes from Redis.

        Args:
            staging_id: Unique ID for the staging job
            image_type: Either 'original' or 'staged'

        Returns:
            Image bytes or None if not found
        """
        try:
            key = self._get_key(image_type, staging_id)
            encoded = self.redis.get(key)
            if encoded:
                return base64.b64decode(encoded)
            return None
        except Exception as e:
            print(f"Failed to retrieve image from Redis: {e}")
            return None

    def delete_image(self, staging_id: str, image_type: str = "original") -> bool:
        """Delete image from Redis."""
        try:
            key = self._get_key(image_type, staging_id)
            self.redis.delete(key)
            return True
        except Exception:
            return False

    def store_image_metadata(self, staging_id: str, filename: str, content_type: str):
        """Store image metadata (filename, content type)."""
        try:
            key = f"image:meta:{staging_id}"
            self.redis.hset(key, mapping={
                "filename": filename,
                "content_type": content_type
            })
            self.redis.expire(key, self.IMAGE_TTL)
        except Exception as e:
            print(f"Failed to store image metadata: {e}")

    def get_image_metadata(self, staging_id: str) -> Optional[dict]:
        """Get image metadata."""
        try:
            key = f"image:meta:{staging_id}"
            data = self.redis.hgetall(key)
            if data:
                return {k.decode(): v.decode() for k, v in data.items()}
            return None
        except Exception:
            return None


# Singleton instance
image_storage = ImageStorage()
