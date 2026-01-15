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
            # Use gemini-3-pro-image-preview for image generation
            self.model_name = 'gemini-3-pro-image-preview'
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
    
    def stage_room_from_bytes_sync(self, image_bytes: bytes) -> Tuple[bool, Optional[bytes], Optional[float], Optional[str]]:
        """
        Stage a room using AI. Takes image bytes directly.
        Returns (success, staged_image_bytes, quality_score, error_message).
        Synchronous version for background tasks.
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

            staged_image = self._generate_staged_image_sync(processed_image, prompt)

            if staged_image:
                # Convert back to bytes
                staged_bytes = self._image_to_bytes(staged_image)
                processing_time = int((time.time() - start_time) * 1000)
                logger.info(f"Staging completed in {processing_time}ms")
                return True, staged_bytes, 0.85, None
            else:
                return False, None, None, "AI failed to generate staged image. The image may have been rejected by content filters. Try a different photo."

        except Exception as e:
            logger.error(f"Error during staging: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return False, None, None, f"Error during staging: {str(e)}"
    
    def _generate_staged_image_sync(self, image: Image.Image, prompt: str) -> Optional[Image.Image]:
        """Generate staged image using Gemini - following official docs pattern."""
        try:
            logger.info("Calling Gemini for image staging...")
            logger.info(f"Using model: {self.model_name}")

            # Configure to return both text and image
            config = types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            )

            # Use official docs pattern: pass PIL Image directly with prompt
            # Order: prompt first, then image (as shown in docs)
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[prompt, image],
                config=config
            )

            logger.info(f"Response received: {type(response)}")
            logger.info(f"Response has parts attr: {hasattr(response, 'parts')}")

            # Use official docs pattern: response.parts directly
            if hasattr(response, 'parts') and response.parts:
                logger.info(f"Number of parts: {len(response.parts)}")
                for i, part in enumerate(response.parts):
                    logger.info(f"Part {i}: text={part.text is not None}, inline_data={part.inline_data is not None}")

                    if part.inline_data is not None:
                        logger.info(f"Found inline_data!")
                        # Use as_image() method as shown in docs
                        if hasattr(part, 'as_image'):
                            result_image = part.as_image()
                            logger.info("Successfully generated staged image using as_image()")
                            return result_image
                        else:
                            # Fallback to direct data access
                            image_data = part.inline_data.data
                            result_image = Image.open(io.BytesIO(image_data))
                            logger.info("Successfully generated staged image from inline_data")
                            return result_image
                    elif part.text:
                        logger.info(f"Part {i} text: {part.text[:300]}...")

            # Fallback: try candidates path
            elif hasattr(response, 'candidates') and response.candidates:
                logger.info("Using candidates path...")
                candidate = response.candidates[0]
                finish_reason = getattr(candidate, 'finish_reason', 'unknown')
                logger.info(f"Candidate finish_reason: {finish_reason}")

                # Check for problematic finish reasons
                finish_reason_str = str(finish_reason)
                if 'OTHER' in finish_reason_str:
                    logger.error("Gemini returned FinishReason.OTHER - image may have been rejected by safety filters")
                elif 'SAFETY' in finish_reason_str:
                    logger.error("Gemini blocked the request due to safety filters")
                elif 'RECITATION' in finish_reason_str:
                    logger.error("Gemini blocked due to recitation policy")

                if hasattr(candidate, 'content') and candidate.content:
                    logger.info("Candidate has content")
                    if hasattr(candidate.content, 'parts'):
                        parts = candidate.content.parts
                        if parts is None:
                            logger.warning("candidate.content.parts is None - Gemini likely rejected the image")
                        elif len(parts) == 0:
                            logger.warning("candidate.content.parts is empty")
                        else:
                            logger.info(f"Found {len(parts)} parts in candidate")
                            for i, part in enumerate(parts):
                                has_text = part.text is not None
                                has_inline = part.inline_data is not None
                                logger.info(f"Candidate part {i}: text={has_text}, inline_data={has_inline}")

                                if part.inline_data is not None:
                                    logger.info(f"Found inline_data! mime_type={getattr(part.inline_data, 'mime_type', 'unknown')}")
                                    if hasattr(part, 'as_image'):
                                        logger.info("Using as_image() method")
                                        result = part.as_image()
                                        logger.info(f"as_image() returned: {type(result)}")
                                        return result
                                    logger.info("Using direct data access")
                                    image_data = part.inline_data.data
                                    logger.info(f"Data length: {len(image_data) if image_data else 0}")
                                    logger.info(f"Data type: {type(image_data)}")

                                    # Handle base64 encoded data (SDK may return string)
                                    if isinstance(image_data, str):
                                        logger.info("Data is base64 string, decoding...")
                                        image_data = base64.b64decode(image_data)
                                        logger.info(f"Decoded length: {len(image_data)}")

                                    # Debug: show first bytes to identify format
                                    if image_data:
                                        first_bytes = image_data[:20]
                                        logger.info(f"First 20 bytes (hex): {first_bytes.hex()}")
                                        logger.info(f"First 20 bytes (repr): {repr(first_bytes)}")

                                    # Try to open the image
                                    try:
                                        result = Image.open(io.BytesIO(image_data))
                                        logger.info(f"Opened image: {result.size}")
                                        return result
                                    except Exception as img_err:
                                        logger.error(f"PIL failed to open: {img_err}")
                                        # Maybe it's base64 even though it's bytes?
                                        try:
                                            logger.info("Trying base64 decode anyway...")
                                            decoded = base64.b64decode(image_data)
                                            logger.info(f"Base64 decoded length: {len(decoded)}")
                                            logger.info(f"Decoded first bytes: {decoded[:20].hex()}")
                                            result = Image.open(io.BytesIO(decoded))
                                            logger.info(f"Opened after base64 decode: {result.size}")
                                            return result
                                        except Exception as decode_err:
                                            logger.error(f"Base64 fallback also failed: {decode_err}")
                                            raise img_err
                                elif part.text:
                                    logger.info(f"Part {i} has text: {part.text[:200]}...")
                    else:
                        logger.warning("Candidate content has no parts attr")
                else:
                    logger.warning("Candidate has no content")
            else:
                logger.warning("Response has no parts and no candidates")

            logger.warning("No image generated by Gemini - no inline_data found in any path")
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
