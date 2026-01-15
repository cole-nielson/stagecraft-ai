# Build Changes Summary

This document summarizes the architectural simplification performed on StageCraft AI.

## Overview

The application was simplified from a 5-service architecture to a 2-service architecture to reduce complexity, cost, and deployment friction.

## Before vs After

### Before (Over-Engineered)
```
Frontend (Vercel)
    ↓
Backend API (Railway)
    ↓
Celery Worker (Railway) ←→ Redis (Railway)
    ↓
PostgreSQL (Railway)
```
**Services: 5** (Frontend, Backend, Celery Worker, Redis, PostgreSQL)

### After (Simplified)
```
Frontend (Vercel)
    ↓
Backend API (Railway)
    ↓
PostgreSQL (Railway)
```
**Services: 2** (Frontend + Backend with PostgreSQL)

## Files Deleted

| File | Reason |
|------|--------|
| `backend/app/services/celery_app.py` | Celery removed |
| `backend/app/services/tasks.py` | Celery tasks removed |
| `backend/app/celery.py` | Celery entry point removed |
| `backend/app/services/image_storage.py` | Redis storage removed |
| `backend/app/services/rate_limiter.py` | Redis rate limiting removed |
| `backend/app/services/watermark.py` | Unused feature |
| `frontend/src/components/BatchResults.tsx` | Batch mode removed |
| `frontend/src/components/BatchResultsModal.tsx` | Batch mode removed |
| `docker-compose.prod.yml` | Simplified to single compose file |
| `nginx/` directory | Nginx proxy removed |

## Files Modified

### Backend

| File | Changes |
|------|---------|
| `backend/app/services/ai_service.py` | Rewritten to work with image bytes directly, uses `gemini-3-pro-image-preview` model |
| `backend/app/routes/staging.py` | Replaced Celery with FastAPI BackgroundTasks, removed batch endpoints |
| `backend/app/routes/images.py` | Serves images from PostgreSQL (base64) instead of Redis |
| `backend/app/routes/health.py` | Simplified, removed Redis/Celery health checks |
| `backend/app/models/staging.py` | Added `original_image_data` and `staged_image_data` columns (Text, base64) |
| `backend/app/core/config.py` | Removed Redis URL requirement |
| `backend/requirements.txt` | Removed celery, redis; added google-genai, email-validator |
| `backend/Dockerfile` | Updated paths for Railway (COPY backend/...), uses $PORT env variable |

### Frontend

| File | Changes |
|------|---------|
| `frontend/src/pages/StagingPage.tsx` | Removed batch mode UI, improved error display for failed stagings |
| `frontend/src/hooks/useStaging.ts` | Simplified, removed batch processing functions |
| `frontend/src/services/api.ts` | Removed batch API calls |

## Key Technical Changes

### 1. Image Storage: Redis → PostgreSQL

**Before:**
```python
# Stored in Redis with TTL
redis_client.setex(f"image:{image_id}", 3600, image_bytes)
```

**After:**
```python
# Stored as base64 in PostgreSQL
staging.original_image_data = base64.b64encode(image_bytes).decode('utf-8')
staging.staged_image_data = base64.b64encode(result_bytes).decode('utf-8')
```

### 2. Task Processing: Celery → BackgroundTasks

**Before:**
```python
# Celery task
@celery_app.task
def process_staging(staging_id: str, image_data: bytes):
    ...

# Called via
process_staging.delay(staging_id, image_data)
```

**After:**
```python
# FastAPI BackgroundTasks
def process_staging_background(staging_id: str, image_bytes: bytes):
    asyncio.run(_process_staging_async(staging_id, image_bytes))

# Called via
background_tasks.add_task(process_staging_background, staging_id, image_bytes)
```

### 3. AI Model & SDK

Uses the `google-genai` SDK (not the older `google-generativeai` package) with `gemini-3-pro-image-preview` model for image generation.

```python
from google import genai
from google.genai import types

# Initialize client
self.client = genai.Client(api_key=settings.google_ai_api_key)
self.model_name = 'gemini-3-pro-image-preview'

# Generate content with image output
config = types.GenerateContentConfig(
    response_modalities=["TEXT", "IMAGE"],
)
response = self.client.models.generate_content(
    model=self.model_name,
    contents=[prompt, image],
    config=config
)
```

**Important:** The SDK returns image data as base64-encoded bytes. Must decode before opening with PIL:
```python
image_data = part.inline_data.data
if data[:4] in [b'/9j/', b'iVBO']:  # Base64 signatures
    image_data = base64.b64decode(image_data)
result = Image.open(io.BytesIO(image_data))
```

### 4. Dockerfile Changes

Railway builds from the repository root, so paths needed updating:

```dockerfile
# Before
COPY requirements.txt .
COPY app/ ./app/

# After  
COPY backend/requirements.txt .
COPY backend/app/ ./app/
```

Railway also provides the port via `$PORT` environment variable:

```dockerfile
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

## Environment Variables

### Railway Backend
```
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-provided by Railway
GOOGLE_AI_API_KEY=your_api_key
SECRET_KEY=random_secret
JWT_SECRET_KEY=random_secret
CORS_ORIGINS=https://your-frontend.vercel.app
```

### Vercel Frontend
```
VITE_API_URL=https://your-backend.up.railway.app
```

## Removed Features

1. **Batch Processing** - Upload multiple images at once (removed for simplicity)
2. **Rate Limiting** - Redis-based rate limiting (can be re-added with in-memory or DB-based solution)
3. **Watermarking** - Unused feature that was never completed

## Benefits of Simplification

1. **Lower Cost** - No Redis service ($5-10/month saved)
2. **Simpler Deployment** - Single backend service instead of backend + worker
3. **Easier Debugging** - All processing in one service, simpler logs
4. **Faster Cold Starts** - No Celery worker to spin up
5. **Less Code** - ~500 lines removed

## Potential Future Enhancements

If scaling becomes necessary:

1. **Rate Limiting** - Add in-memory rate limiting with `slowapi` or database-based
2. **Queue Processing** - Re-add Celery/Redis only if concurrent processing becomes a bottleneck
3. **File Storage** - Move images to S3/Cloudflare R2 if PostgreSQL size becomes an issue
