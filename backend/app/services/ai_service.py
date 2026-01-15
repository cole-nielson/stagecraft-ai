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
        # Configure Google Gemini with the new SDK
        if settings.google_ai_api_key:
            self.client = genai.Client(api_key=settings.google_ai_api_key)
            self.model_name = 'gemini-2.0-flash-exp'  # Model that supports image generation
        else:
            self.client = None
            logger.warning("No Google AI API key configured")
    
    def get_staging_prompt(self) -> str:
        """Enhanced staging prompt with strong architectural preservation instructions."""
        return """Stage this empty room with furniture for real estate marketing. 

CRITICAL: Preserve ALL architectural elements exactly as shown:
- Keep all walls, windows, doors, and structural features UNCHANGED
- Do NOT modify room dimensions, ceiling height, or wall positions  
- Do NOT alter lighting fixtures, built-ins, or architectural details
- ONLY add removable furniture, rugs, and decorative items
- Maintain the exact same camera angle and perspective

Add appropriate furniture that appeals to potential buyers while keeping the original room structure 100% identical.

Generate a new image of this room with furniture added."""
    
    async def stage_room_from_bytes(self, image_bytes: bytes) -> Tuple[bool, Optional[bytes], Optional[float], Optional[str]]:
        """
        Stage a room using AI. Takes image bytes directly.
        Returns (success, staged_image_bytes, quality_score, error_message).
        """
        start_time = time.time()

        try:
            # Load as PIL Image
            image = Image.open(io.BytesIO(image_bytes))

            # Validate image
            validation_result = self._validate_image(image)
            if not validation_result['is_valid']:
                return False, None, None, validation_result['reason']

            # Generate staging prompt
            prompt = self.get_staging_prompt()

            # Preprocess image
            processed_image = self._preprocess_image(image)

            # Stage with Gemini
            if not self.client:
                return False, None, None, "AI service not configured"

            staged_image = await self._generate_staged_image(processed_image, prompt)
            
            if staged_image:
                # Convert back to bytes
                staged_bytes = self._image_to_bytes(staged_image)
                processing_time = int((time.time() - start_time) * 1000)
                logger.info(f"Staging completed in {processing_time}ms")
                return True, staged_bytes, 0.85, None
            else:
                return False, None, None, "AI failed to generate staged image"

        except Exception as e:
            logger.error(f"Error during staging: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return False, None, None, f"Error during staging: {str(e)}"
    
    async def _generate_staged_image(self, image: Image.Image, prompt: str) -> Optional[Image.Image]:
        """Generate staged image using Gemini with the new SDK."""
        try:
            logger.info("Calling Gemini for image staging...")
            logger.info(f"Using model: {self.model_name}")
            
            # Convert PIL Image to bytes for the API
            img_buffer = io.BytesIO()
            image.save(img_buffer, format='JPEG', quality=95)
            img_bytes = img_buffer.getvalue()
            
            # Create the content with image and text
            contents = [
                types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
                types.Part.from_text(text=prompt)
            ]
            
            # Configure to return both text and image
            config = types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            )
            
            # Generate content using async API
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=config
            )
            
            logger.info(f"Response received")
            
            if response and response.candidates:
                candidate = response.candidates[0]
                logger.info(f"Candidate finish_reason: {getattr(candidate, 'finish_reason', 'unknown')}")
                
                if hasattr(candidate, 'content') and candidate.content:
                    if hasattr(candidate.content, 'parts'):
                        logger.info(f"Number of parts: {len(candidate.content.parts)}")
                        for i, part in enumerate(candidate.content.parts):
                            logger.info(f"Part {i}: has text={part.text is not None}, has inline_data={part.inline_data is not None}")
                            
                            # Check for inline image data
                            if part.inline_data is not None:
                                logger.info(f"Found inline_data with mime_type: {part.inline_data.mime_type}")
                                image_data = part.inline_data.data
                                result_image = Image.open(io.BytesIO(image_data))
                                logger.info("Successfully generated staged image from Gemini")
                                return result_image
                            elif part.text:
                                logger.info(f"Part {i} has text: {part.text[:200]}...")
            else:
                logger.warning(f"No candidates in response")
            
            logger.warning("No image generated by Gemini - no inline_data found in response")
            return None
            
        except Exception as e:
            logger.error(f"Gemini staging error: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return None
    
    def _validate_image(self, image: Image.Image) -> Dict[str, Any]:
        """Validate uploaded image."""
        result = {'is_valid': True, 'reason': ''}
        
        width, height = image.size
        if width < 512 or height < 512:
            result['is_valid'] = False
            result['reason'] = "Image resolution too low. Please use images with at least 512x512 pixels."
            return result
        
        if image.mode not in ['RGB', 'RGBA']:
            result['is_valid'] = False
            result['reason'] = "Invalid image format. Please use RGB images."
            return result
        
        return result
    
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
