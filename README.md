# StageCraft AI

**AI-Powered Virtual Staging for Real Estate**

Transform empty rooms into professionally staged spaces using Google's Gemini AI. Upload a photo of an empty room and receive a photorealistic staged version in seconds.

[Live Demo](https://stagecraft-ai-zkvg.vercel.app) | [Backend API](https://stagecraft-ai-production-5711.up.railway.app/docs)

---

## Overview

StageCraft AI addresses a real problem in real estate: professional home staging costs $2,000-$5,000+ per property and takes days to coordinate. This application generates photorealistic staged rooms instantly using generative AI, enabling real estate professionals to market properties faster and more cost-effectively.

### Key Features

- **AI-Powered Staging** - Uses Google Gemini's `gemini-3-pro-image-preview` model to add realistic furniture while preserving architectural details
- **Real-Time Progress** - Polling-based status updates show processing progress and estimated completion time
- **User Authentication** - Email/password and Google OAuth for user management
- **Image History** - Staged images stored in PostgreSQL for user history
- **Simple Architecture** - Single backend service with FastAPI BackgroundTasks (no Celery/Redis complexity)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                │
│                      (Vercel - React/Vite)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Upload    │  │  Processing │  │   Results   │              │
│  │  Dropzone   │  │   States    │  │   Display   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└────────────────────────────┬─────────────────────────────────────┘
                             │ REST API
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                        BACKEND API                                │
│                    (Railway - FastAPI)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Staging   │  │    Auth     │  │   Images    │              │
│  │   Routes    │  │   Routes    │  │   Routes    │              │
│  └──────┬──────┘  └─────────────┘  └──────┬──────┘              │
│         │                                  │                      │
│         ▼                                  ▼                      │
│  ┌─────────────┐                   ┌─────────────┐              │
│  │ Background  │                   │  PostgreSQL │              │
│  │   Tasks     │                   │   (Images)  │              │
│  └──────┬──────┘                   └─────────────┘              │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │  AI Service │                                                │
│  │  (Gemini)   │                                                │
│  └─────────────┘                                                │
└──────────────────────────────────────────────────────────────────┘
                             │
                             ▼
                   ┌─────────────────┐
                   │   PostgreSQL    │
                   │   (Railway)     │
                   └─────────────────┘
```

**Services: 2** (Frontend + Backend with PostgreSQL)

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
| **BackgroundTasks** | Async task processing |
| **SQLAlchemy** | ORM |
| **Alembic** | Database migrations |
| **Pydantic** | Request/response validation |
| **Pillow** | Image processing |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **Google Gemini** | AI image generation (`gemini-3-pro-image-preview`) |
| **PostgreSQL** | Primary database + image storage (base64) |
| **Docker** | Containerization |
| **Railway** | Backend hosting (API + DB) |
| **Vercel** | Frontend hosting |

---

## Technical Highlights

### 1. Base64 Image Storage in PostgreSQL

Images are stored as base64-encoded text in PostgreSQL, eliminating the need for separate file storage:

```python
# Staging model with image data columns
class Staging(Base):
    __tablename__ = "stagings"
    
    original_image_data = Column(Text)  # Base64 encoded
    staged_image_data = Column(Text)    # Base64 encoded
```

### 2. FastAPI BackgroundTasks for AI Processing

Long-running AI tasks are processed in the background using FastAPI's built-in BackgroundTasks:

```python
@router.post("/stage")
async def stage_room(
    background_tasks: BackgroundTasks,
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Create staging record
    staging = Staging(id=staging_id, status="processing", ...)
    db.add(staging)
    db.commit()
    
    # Process in background
    background_tasks.add_task(process_staging_background, str(staging_id), image_bytes)
    
    return {"id": str(staging_id), "status": "processing"}
```

### 3. Smart Polling with TanStack Query

TanStack Query handles server state with automatic polling that stops when processing completes:

```typescript
const stagingStatusQuery = useQuery({
  queryKey: ['staging-status', stagingId],
  queryFn: () => stagingApi.getStagingStatus(stagingId),
  enabled: !!stagingId,
  refetchInterval: (query) => {
    const status = query.state.data?.status;
    if (status === 'completed' || status === 'failed') return false;
    return 2000; // Poll every 2 seconds while processing
  },
});
```

### 4. Gemini AI Integration

Direct integration with Google's Gemini API for image generation:

```python
class AIService:
    def __init__(self):
        genai.configure(api_key=settings.google_ai_api_key)
        self.gemini_model = genai.GenerativeModel('gemini-3-pro-image-preview')
    
    async def stage_room_from_bytes(self, image_bytes: bytes):
        image = Image.open(io.BytesIO(image_bytes))
        response = self.gemini_model.generate_content([prompt, image])
        # Extract generated image from response
        ...
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose (for local PostgreSQL)
- Google AI API key ([Get one here](https://aistudio.google.com/app/apikey))

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/cole-nielson/stagecraft-ai.git
   cd stagecraft-ai
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your GOOGLE_AI_API_KEY
   ```

3. **Start PostgreSQL**
   ```bash
   docker-compose up -d postgres
   ```

4. **Start the backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

5. **Start the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/stage` | Upload image and start AI staging |
| `GET` | `/api/stage/{id}` | Get staging status and results |
| `GET` | `/api/images/{filename}` | Serve processed images |
| `GET` | `/api/health` | Simple health check |
| `GET` | `/api/health/full` | Full health check with database status |
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | Login with email/password |
| `GET` | `/auth/me` | Get current user info |

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
│   │   │   ├── staging.py   # Image staging endpoints
│   │   │   ├── auth.py      # Authentication endpoints
│   │   │   ├── images.py    # Image serving endpoints
│   │   │   └── health.py    # Health check endpoints
│   │   ├── services/        # Business logic
│   │   │   └── ai_service.py  # Gemini AI integration
│   │   └── middleware/      # Error handlers
│   ├── migrations/          # Alembic database migrations
│   └── requirements.txt
│
├── docker-compose.yml       # Local development setup
├── railway.json             # Railway deployment config
└── BUILD_CHANGES.md         # Architecture change summary
```

---

## Deployment

### Backend (Railway)

Single service deployment:

1. Connect GitHub repo to Railway
2. Add PostgreSQL addon
3. Set environment variables:
   - `DATABASE_URL` (auto-provided by Railway PostgreSQL)
   - `GOOGLE_AI_API_KEY`
   - `SECRET_KEY`
   - `JWT_SECRET_KEY`
   - `CORS_ORIGINS` (your Vercel frontend URL)

### Frontend (Vercel)

1. Import from GitHub
2. Set root directory to `frontend`
3. Set environment variable:
   - `VITE_API_URL` (your Railway backend URL)

---

## Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/stagecraft
GOOGLE_AI_API_KEY=your_gemini_api_key
SECRET_KEY=random_secret_key
JWT_SECRET_KEY=another_random_key
CORS_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000
```

---

## License

MIT License

---

## Author

**Cole Nielson**
- [GitHub](https://github.com/cole-nielson)
- [LinkedIn](https://www.linkedin.com/in/cole-nielson-b05724196/)
