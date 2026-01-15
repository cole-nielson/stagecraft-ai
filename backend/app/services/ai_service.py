from google import genai
from google.genai import types
from PIL import Image
import io
import base64
import time
import logging
from typing import Optional, Tuple, Dict, Any
from ..core.config import settings

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self):
        """Initialize the AI service with Google Gemini."""
        if settings.google_ai_api_key:
            self.client = genai.Client(api_key=settings.google_ai_api_key)
            self.model_name = 'gemini-3-pro-image-preview'
        else:
            self.client = None
            logger.warning("No Google AI API key configured")

    def get_staging_prompt(self) -> str:
        """
        Staging prompt optimized for real estate virtual staging.
        Balances creative freedom with structural preservation.
        """
        return """You are a professional virtual stager for real estate photography.
Your task is to add stylish, modern furniture to this empty room photograph.

REQUIREMENTS:
1. PRESERVE the exact camera angle, perspective, and room structure
2. KEEP all walls, windows, doors, flooring, ceiling, and architectural features identical
3. DO NOT change the room's dimensions, lighting conditions, or wall colors
4. ADD only furniture, rugs, artwork, plants, and decorative accessories

STYLE GUIDANCE:
- Use contemporary, neutral-toned furniture that appeals to broad buyer demographics
- Include a cohesive color palette that complements the existing room
- Add tasteful staging elements: throw pillows, books, plants, lamps
- Ensure furniture scale is appropriate for the room size
- Create an inviting, move-in ready atmosphere

Generate a photorealistic staged version of this room."""

    def stage_room_from_bytes_sync(self, image_bytes: bytes) -> Tuple[bool, Optional[bytes], Optional[float], Optional[str]]:
        """
        Stage a room using AI. Takes image bytes directly.
        Returns (success, staged_image_bytes, quality_score, error_message).
        """
        start_time = time.time()

        try:
            # Load and validate image
            image = Image.open(io.BytesIO(image_bytes))
            validation_result = self._validate_image(image)
            if not validation_result['is_valid']:
                return False, None, None, validation_result['reason']

            # Preprocess and stage
            processed_image = self._preprocess_image(image)
            if not self.client:
                return False, None, None, "AI service not configured"

            staged_image = self._generate_staged_image(processed_image)

            if staged_image:
                staged_bytes = self._image_to_bytes(staged_image)
                processing_time = int((time.time() - start_time) * 1000)
                logger.info(f"Staging completed in {processing_time}ms")
                return True, staged_bytes, 0.85, None
            else:
                return False, None, None, "AI failed to generate staged image. Try a different photo."

        except Exception as e:
            logger.error(f"Staging error: {str(e)}")
            return False, None, None, f"Error during staging: {str(e)}"

    def _generate_staged_image(self, image: Image.Image) -> Optional[Image.Image]:
        """Generate staged image using Gemini API."""
        try:
            logger.info(f"Calling Gemini model: {self.model_name}")

            config = types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            )

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[self.get_staging_prompt(), image],
                config=config
            )

            # Extract image from response
            return self._extract_image_from_response(response)

        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return None

    def _extract_image_from_response(self, response) -> Optional[Image.Image]:
        """Extract PIL Image from Gemini response, handling various response formats."""

        # Try response.parts first (preferred path)
        if hasattr(response, 'parts') and response.parts:
            for part in response.parts:
                if part.inline_data is not None:
                    if hasattr(part, 'as_image'):
                        return part.as_image()
                    return self._decode_image_data(part.inline_data.data)

        # Fallback to candidates path
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            finish_reason = str(getattr(candidate, 'finish_reason', ''))

            if 'OTHER' in finish_reason or 'SAFETY' in finish_reason:
                logger.warning(f"Request may have been filtered: {finish_reason}")
                return None

            if hasattr(candidate, 'content') and candidate.content:
                parts = getattr(candidate.content, 'parts', None)
                if parts:
                    for part in parts:
                        if part.inline_data is not None:
                            if hasattr(part, 'as_image'):
                                return part.as_image()
                            return self._decode_image_data(part.inline_data.data)

        logger.warning("No image data found in Gemini response")
        return None

    def _decode_image_data(self, data) -> Optional[Image.Image]:
        """Decode image data from Gemini, handling base64 encoding."""
        try:
            # SDK returns bytes that are actually base64-encoded
            if isinstance(data, bytes):
                # Check if it looks like base64 (starts with common base64 chars)
                if data[:4] in [b'/9j/', b'iVBO', b'R0lG', b'Qk0=']:
                    data = base64.b64decode(data)
                else:
                    # Try direct open first, fallback to base64
                    try:
                        return Image.open(io.BytesIO(data))
                    except:
                        data = base64.b64decode(data)
            elif isinstance(data, str):
                data = base64.b64decode(data)

            return Image.open(io.BytesIO(data))
        except Exception as e:
            logger.error(f"Failed to decode image data: {e}")
            return None

    def _validate_image(self, image: Image.Image) -> Dict[str, Any]:
        """Validate uploaded image meets requirements."""
        width, height = image.size

        if width < 512 or height < 512:
            return {'is_valid': False, 'reason': "Image too small. Minimum 512x512 pixels required."}

        if image.mode not in ['RGB', 'RGBA']:
            return {'is_valid': False, 'reason': "Invalid format. Please use JPEG or PNG images."}

        return {'is_valid': True, 'reason': ''}

    def _preprocess_image(self, image: Image.Image) -> Image.Image:
        """Prepare image for AI processing."""
        if image.mode != 'RGB':
            image = image.convert('RGB')
        return image

    def _image_to_bytes(self, image: Image.Image, format: str = "JPEG", quality: int = 95) -> bytes:
        """Convert PIL Image to bytes."""
        buffer = io.BytesIO()
        image.save(buffer, format=format, quality=quality)
        return buffer.getvalue()


# Singleton instance
ai_service = AIService()
