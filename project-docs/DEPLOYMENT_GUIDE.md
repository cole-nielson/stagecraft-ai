# StageCraft AI - Deployment Guide & Technical Setup

## 🎯 **Deployment Philosophy: Simple, Independent, Scalable**

StageCraft AI should be **vendor-independent** and **easy to deploy** anywhere. No lock-in to Vercel, AWS-specific services, or complex orchestration systems.

## 🛠️ **Recommended Tech Stack**

### Option A: Python + FastAPI (Recommended for AI workloads)
```bash
# Backend Stack
FastAPI          # Fast, modern API framework
Uvicorn          # ASGI server
Pillow           # Image processing
Requests         # HTTP client for AI APIs
SQLAlchemy       # Database ORM
Alembic          # Database migrations
Redis            # Caching and job queue
Celery           # Background task processing

# Frontend Stack  
React            # UI framework (not Next.js - unnecessary complexity)
TypeScript       # Type safety
Mantine          # Premium UI components
Framer Motion    # Smooth animations
React Query      # API state management
Vite             # Fast build tool
```

### Option B: Node.js + Express (If staying JavaScript)
```bash
# Backend Stack
Express          # Web framework
Multer           # File upload handling
Sharp            # Image processing
Bull             # Job queue
Prisma           # Database ORM
Redis            # Caching and queue storage

# Frontend Stack (same as Option A)
React + TypeScript + Mantine + Vite
```

## 🏗️ **Architecture Overview**

### Simple 3-Tier Architecture
```
[Frontend (React)] → [API (FastAPI/Express)] → [Database + Redis + File Storage]
                            ↓
                      [AI Services (Google Gemini)]
```

### Why This Architecture?
- **Simple**: Easy to understand, deploy, and maintain
- **Scalable**: Each tier can be scaled independently  
- **Portable**: Runs anywhere - cloud, VPS, or local
- **Cost-Effective**: No expensive managed services required

## 🐳 **Docker Setup (Recommended)**

### Project Structure
```
stagecraft-ai/
├── docker-compose.yml
├── .env
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt (Python) or package.json (Node)
│   ├── app/
│   │   ├── main.py (or app.js)
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   └── migrations/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── public/
└── nginx/
    └── nginx.conf
```

### Docker Compose Configuration
```yaml
version: '3.8'

services:
  # Frontend
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules

  # Backend API  
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/stagecraft
      - REDIS_URL=redis://redis:6379/0
      - GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY}
    volumes:
      - ./backend:/app
      - ./uploads:/app/uploads
    depends_on:
      - postgres
      - redis

  # Background Workers (for AI processing)
  worker:
    build: ./backend
    command: celery -A app.celery worker --loglevel=info
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/stagecraft
      - REDIS_URL=redis://redis:6379/0
      - GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY}
    depends_on:
      - postgres
      - redis

  # Database
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=stagecraft
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # Cache & Queue
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Reverse Proxy (Production)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
```

## 🚀 **Deployment Options**

### Option 1: Simple VPS Deployment (Recommended for MVP)
**Best for**: Testing, small scale, full control

**Requirements**:
- VPS with 2GB+ RAM, 20GB+ storage
- Ubuntu 22.04 or similar
- Docker and Docker Compose installed

**Setup Steps**:
```bash
# 1. Server setup
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker $USER

# 2. Clone and setup
git clone <your-repo> stagecraft-ai
cd stagecraft-ai
cp .env.example .env
# Edit .env with your API keys

# 3. Deploy
docker-compose up -d

# 4. Setup SSL with Let's Encrypt
sudo apt install certbot
sudo certbot --nginx -d yourdomain.com
```

**Monthly Cost**: $10-20 (DigitalOcean, Linode, Vultr)

### Option 2: Cloud Platform (Railway, Render, Fly.io)
**Best for**: Easy deployment, automatic scaling

**Railway Deployment**:
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and deploy
railway login
railway new
railway add # Add PostgreSQL and Redis services
railway up # Deploy from GitHub
```

**Monthly Cost**: $15-30 for small scale

### Option 3: Traditional Cloud (AWS, GCP, Azure)
**Best for**: Enterprise scale, full control

**AWS Setup** (simplified):
- **Compute**: ECS Fargate or EC2 instances
- **Database**: RDS PostgreSQL
- **Cache**: ElastiCache Redis  
- **Storage**: S3 for uploaded images
- **CDN**: CloudFront for global image delivery

**Monthly Cost**: $50-200+ depending on usage

### Option 4: Kubernetes (Enterprise)
**Best for**: Large scale, complex requirements

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stagecraft-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: stagecraft-backend
  template:
    metadata:
      labels:
        app: stagecraft-backend
    spec:
      containers:
      - name: backend
        image: stagecraft/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: stagecraft-secrets
              key: database-url
```

## 🔧 **Environment Configuration**

### Required Environment Variables
```bash
# .env file
# API Keys
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
XAI_API_KEY=your_xai_api_key_here  # Optional

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/stagecraft

# Redis (for caching and job queue)
REDIS_URL=redis://localhost:6379/0

# File Storage
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE=10485760  # 10MB in bytes

# Security
SECRET_KEY=your_very_secure_secret_key_here
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# AI Configuration
AI_TIMEOUT_SECONDS=60
MAX_CONCURRENT_JOBS=5
IMAGE_QUALITY=high  # high, medium, low

# Optional: External Storage (for production)
AWS_S3_BUCKET=stagecraft-images
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-west-2

# Optional: Monitoring
SENTRY_DSN=your_sentry_dsn_for_error_tracking
```

### Frontend Environment Variables
```bash
# .env (frontend)
REACT_APP_API_URL=http://localhost:8000  # Backend URL
REACT_APP_UPLOAD_MAX_SIZE=10485760
REACT_APP_SUPPORTED_FORMATS=image/jpeg,image/png
REACT_APP_SENTRY_DSN=your_frontend_sentry_dsn
```

## 📊 **Database Setup**

### PostgreSQL Schema (simplified)
```sql
-- Users table (for Phase 2)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Stagings table (core data)
CREATE TABLE stagings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'processing',
    
    -- Input data
    original_image_path TEXT NOT NULL,
    style VARCHAR(50) NOT NULL,
    room_type VARCHAR(50),
    
    -- Output data
    staged_image_path TEXT,
    processing_time_ms INTEGER,
    quality_score DECIMAL(3,2),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    error_message TEXT,
    
    -- Indexing for performance
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Styles configuration
CREATE TABLE styles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    preview_image_path TEXT,
    prompt_template TEXT,
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0
);

-- Insert default styles
INSERT INTO styles (id, name, description, active, sort_order) VALUES
('modern_luxury', 'Modern Luxury', 'Clean lines, premium materials, sophisticated neutrals', true, 1),
('classic_elegance', 'Classic Elegance', 'Timeless pieces, rich textures, traditional luxury', true, 2),
('contemporary_chic', 'Contemporary Chic', 'Current design trends, designer pieces, editorial styling', true, 3);
```

### Database Migrations
```python
# Using Alembic (Python) or similar migration tool
# migration: create_initial_tables.py

def upgrade():
    # Create all tables
    op.execute("""
        CREATE TABLE IF NOT EXISTS stagings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            -- ... rest of schema
        );
    """)
    
def downgrade():
    op.drop_table('stagings')
```

## 🔒 **Security Configuration**

### Basic Security Checklist
- [ ] **HTTPS Only**: SSL certificates configured
- [ ] **API Key Authentication**: Secure API key generation and validation
- [ ] **Rate Limiting**: Prevent abuse (10 requests/minute per IP)
- [ ] **File Upload Security**: Validate file types, scan for malware
- [ ] **CORS Configuration**: Restrict to allowed origins
- [ ] **Environment Secrets**: Never commit API keys to git
- [ ] **Database Security**: Connection encryption, backup strategy

### Nginx Security Configuration
```nginx
# nginx/nginx.conf
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;  # Force HTTPS
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # API Proxy
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # File Upload Size
    client_max_body_size 10M;
}
```

## 📈 **Monitoring & Maintenance**

### Health Check Endpoints
```python
# Backend health checks
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "database": check_database_connection(),
        "redis": check_redis_connection(),
        "ai_service": check_ai_service_status(),
        "disk_space": check_disk_space()
    }
```

### Basic Monitoring Stack
```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  # Application monitoring
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      
  # Visualization
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

  # Log aggregation
  loki:
    image: grafana/loki
    ports:
      - "3100:3100"
      
volumes:
  grafana_data:
```

### Backup Strategy
```bash
# Database backup script
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="stagecraft"

# Create database backup
docker exec stagecraft_postgres_1 pg_dump -U user $DB_NAME > $BACKUP_DIR/db_$DATE.sql

# Backup uploaded images
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz ./uploads/

# Clean old backups (keep 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

# Run daily via cron
# 0 2 * * * /path/to/backup.sh
```

## 🚀 **Quick Start Guide**

### 1. Local Development Setup
```bash
# Clone repository
git clone <your-repo> stagecraft-ai
cd stagecraft-ai

# Setup environment
cp .env.example .env
# Edit .env with your API keys

# Start with Docker
docker-compose up -d

# Or run locally (Python example)
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

cd ../frontend  
npm install
npm run dev
```

### 2. Production Deployment
```bash
# VPS deployment
ssh your-server
sudo apt update && sudo apt install docker.io docker-compose -y

git clone <your-repo> stagecraft-ai
cd stagecraft-ai
cp .env.example .env
# Edit .env with production settings

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Setup SSL
sudo apt install certbot
sudo certbot --nginx -d yourdomain.com

# Setup monitoring (optional)
docker-compose -f docker-compose.monitoring.yml up -d
```

## 💰 **Cost Estimation**

### Development Phase
- **Local Development**: $0
- **Google AI API**: ~$5-10/month (testing)
- **Total**: $5-10/month

### MVP Production
- **VPS**: $10-20/month (2GB RAM, 20GB storage)
- **Domain & SSL**: $15/year
- **Google AI API**: $50-100/month (moderate usage)
- **Total**: $65-125/month

### Scale Phase
- **Cloud Infrastructure**: $100-300/month
- **CDN & Storage**: $20-50/month  
- **AI API Costs**: $200-500/month
- **Monitoring & Tools**: $20-50/month
- **Total**: $340-900/month

## 🎯 **Success Metrics**

### Technical Metrics
- **Uptime**: 99.9% availability target
- **Response Time**: < 2s for API calls, < 30s for AI processing
- **Error Rate**: < 1% of requests
- **User Satisfaction**: 4.5+ stars on quality

### Business Metrics  
- **Monthly Active Users**: Growth trajectory
- **Conversion Rate**: Free trial to paid
- **Processing Volume**: Images staged per month
- **Revenue per User**: Average monthly revenue