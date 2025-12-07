# StageCraft AI

**AI-Powered Virtual Staging for Real Estate**

Transform empty rooms into professionally staged spaces using Google's Gemini AI. Upload a photo of an empty room and receive a photorealistic staged version in seconds.

[Live Demo](https://stagecraft-ai.vercel.app) | [Backend API](https://stagecraft-ai-production.up.railway.app/docs)

---

## Overview

StageCraft AI addresses a real problem in real estate: professional home staging costs $2,000-$5,000+ per property and takes days to coordinate. This application generates photorealistic staged rooms instantly using generative AI, enabling real estate professionals to market properties faster and more cost-effectively.

### Key Features

- **AI-Powered Staging** - Uses Google Gemini's image generation to add realistic furniture while preserving architectural details
- **Batch Processing** - Stage up to 10 rooms simultaneously with parallel Celery task processing
- **Real-Time Progress** - Polling-based status updates show processing progress and estimated completion time
- **Rate Limiting** - Redis-based rate limiting (10/user/day, 30 global/day) for API cost control
- **OAuth Authentication** - Google OAuth integration for user management
- **Distributed Architecture** - Separate API and worker services with shared Redis storage for horizontal scaling

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│                         (Vercel - React/Vite)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Upload    │  │  Processing │  │   Results   │  │    Auth     │    │
│  │  Dropzone   │  │   States    │  │   Display   │  │   Modal     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ REST API
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          BACKEND API                                     │
│                      (Railway - FastAPI)                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Staging   │  │    Auth     │  │   Images    │  │   Health    │    │
│  │   Routes    │  │   Routes    │  │   Routes    │  │   Routes    │    │
│  └──────┬──────┘  └─────────────┘  └──────┬──────┘  └─────────────┘    │
│         │                                  │                             │
│         ▼                                  ▼                             │
│  ┌─────────────┐                   ┌─────────────┐                      │
│  │    Rate     │                   │   Image     │                      │
│  │   Limiter   │                   │   Storage   │◄─────────────────┐   │
│  └──────┬──────┘                   └──────┬──────┘                  │   │
└─────────┼──────────────────────────────────┼────────────────────────┼───┘
          │                                  │                        │
          ▼                                  ▼                        │
┌─────────────────┐              ┌─────────────────┐                  │
│   PostgreSQL    │              │      Redis      │◄─────────┐       │
│    (Railway)    │              │    (Railway)    │          │       │
└─────────────────┘              └────────┬────────┘          │       │
                                          │ Task Queue        │       │
                                          ▼                   │       │
                               ┌─────────────────────────────────────┐
                               │          CELERY WORKER              │
                               │         (Railway - Python)          │
                               │  ┌─────────────┐  ┌─────────────┐  │
                               │  │     AI      │  │   Image     │  │
                               │  │   Service   │  │   Storage   │──┘
                               │  │  (Gemini)   │  │   (Redis)   │
                               │  └─────────────┘  └─────────────┘
                               └─────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework with hooks |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Mantine UI** | Component library |
| **TanStack Query** | Server state management & polling |
| **Framer Motion** | Animations |
| **Axios** | HTTP client |

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | Async Python web framework |
| **Celery** | Distributed task queue |
| **SQLAlchemy** | ORM |
| **Alembic** | Database migrations |
| **Pydantic** | Request/response validation |
| **Pillow** | Image processing |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **Google Gemini** | AI image generation |
| **PostgreSQL** | Primary database |
| **Redis** | Task queue broker + distributed image storage |
| **Docker** | Containerization |
| **Railway** | Backend hosting (API + Worker + DB + Redis) |
| **Vercel** | Frontend hosting |

---

## Technical Highlights

### 1. Distributed Image Storage with Redis

A key challenge: the backend API and Celery workers run as separate containers that can't share a filesystem. I solved this by implementing Redis-based image storage, allowing both services to access uploaded and processed images:

```python
class ImageStorage:
    IMAGE_TTL = 60 * 60 * 24  # 24 hours

    def store_image(self, staging_id: str, image_bytes: bytes, image_type: str):
        key = f"image:{image_type}:{staging_id}"
        encoded = base64.b64encode(image_bytes).decode('utf-8')
        self.redis.setex(key, self.IMAGE_TTL, encoded)

    def get_image(self, staging_id: str, image_type: str) -> Optional[bytes]:
        key = f"image:{image_type}:{staging_id}"
        encoded = self.redis.get(key)
        return base64.b64decode(encoded) if encoded else None
```

### 2. Async Task Processing with Progress Updates

Long-running AI tasks are offloaded to Celery workers, with progress updates stored for frontend polling:

```python
@celery_app.task(bind=True)
def process_staging(self, staging_id: str):
    current_task.update_state(
        state='PROGRESS',
        meta={'progress': 50, 'stage': 'Generating staged room...'}
    )

    # Process with Gemini AI
    success, result, quality_score = asyncio.run(
        ai_service.stage_room(staging_id)
    )
```

### 3. IP-Based Rate Limiting

Redis-backed rate limiting protects the API while ensuring fair usage for the portfolio demo:

```python
class RateLimiter:
    USER_DAILY_LIMIT = 10
    GLOBAL_DAILY_LIMIT = 30

    def check_user_limit(self, client_ip: str) -> tuple[bool, int]:
        key = f"ratelimit:user:{client_ip}:{date.today()}"
        current = int(self.redis.get(key) or 0)
        return current < self.USER_DAILY_LIMIT, self.USER_DAILY_LIMIT - current
```

### 4. Optimistic UI with Smart Polling

TanStack Query handles server state with automatic polling that stops when processing completes:

```typescript
const stagingStatusQuery = useQuery({
  queryKey: ['staging-status', stagingId],
  queryFn: () => stagingApi.getStagingStatus(stagingId),
  enabled: !!stagingId,
  refetchInterval: (query) => {
    const status = query.state.data?.status;
    // Stop polling when done
    if (status === 'completed' || status === 'failed') return false;
    return 2000; // Poll every 2 seconds while processing
  },
});
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Google AI API key ([Get one here](https://makersuite.google.com/app/apikey))

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/cole-nielson/stagecraft-ai.git
   cd stagecraft-ai
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Add your GOOGLE_AI_API_KEY to .env
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/stage` | Upload image and start AI staging |
| `GET` | `/api/stage/{id}` | Get staging status and results |
| `POST` | `/api/stage-batch` | Batch upload (up to 10 images) |
| `GET` | `/api/batch/{id}` | Get batch processing status |
| `GET` | `/api/images/{filename}` | Serve processed images |
| `GET` | `/api/health` | Health check with service status |

---

## Project Structure

```
stagecraft-ai/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks (useStaging)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   ├── styles/          # Mantine theme & CSS
│   │   └── types/           # TypeScript interfaces
│   └── package.json
│
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── core/            # Config, database, auth utilities
│   │   ├── models/          # SQLAlchemy models
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic
│   │   │   ├── ai_service.py       # Gemini AI integration
│   │   │   ├── celery_app.py       # Task queue config
│   │   │   ├── image_storage.py    # Redis image storage
│   │   │   ├── rate_limiter.py     # Rate limiting
│   │   │   └── tasks.py            # Celery tasks
│   │   └── middleware/      # Error handlers
│   ├── migrations/          # Alembic database migrations
│   └── requirements.txt
│
├── docker-compose.yml       # Local multi-service setup
├── railway.json             # Railway deployment config
└── vercel.json              # Vercel deployment config
```

---

## Deployment

### Backend (Railway)
Auto-deploys from `main` branch. Four services:
- **stagecraft-ai** - FastAPI application (port 8000)
- **worker** - Celery worker processing `staging` queue
- **PostgreSQL** - Managed database
- **Redis** - Task broker + image storage

### Frontend (Vercel)
Auto-deploys from `main` branch:
- Build: `npm run build`
- Output: `dist`
- Env: `VITE_API_URL` pointing to Railway backend

---

## Future Improvements

- [ ] WebSocket for real-time progress (replace polling)
- [ ] Multiple staging styles (Modern, Traditional, Minimalist)
- [ ] Before/after comparison slider component
- [ ] Room type auto-detection
- [ ] Image resolution upscaling
- [ ] Stripe integration for premium tier

---

## License

MIT License

---

## Author

**Cole Nielson**
- [GitHub](https://github.com/cole-nielson)
- [LinkedIn](https://linkedin.com/in/cole-nielson)
