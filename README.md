# StageCraft AI

**The most sophisticated AI staging tool for luxury real estate professionals.**

StageCraft AI transforms empty properties into beautifully staged spaces that sell faster and for higher prices. Built specifically for real estate agents who demand premium results without the complexity.

## 🎯 **Key Features**

- **Professional AI Staging**: Transform empty rooms with luxury furnishings in under 30 seconds
- **Architectural Integrity**: Never modifies structural elements - preserves authentic character
- **Luxury Focus**: Three sophisticated styles designed for $1M+ properties
- **Marketing Ready**: 4K resolution output perfect for MLS and property marketing
- **Premium UI**: Sophisticated interface matching luxury real estate standards

## 🏗️ **Architecture**

### Tech Stack
- **Frontend**: React + TypeScript + Mantine UI + Framer Motion
- **Backend**: Python + FastAPI + PostgreSQL + Redis + Celery
- **AI**: Google Gemini Vision Pro integration
- **Deployment**: Docker + Docker Compose

### Core Design Principles
1. **Luxury First**: Every pixel reinforces premium positioning
2. **Simplicity Over Complexity**: Master prompt engineering vs complex AI systems
3. **Professional Focus**: Built for real estate professionals, not consumers
4. **Quality Over Speed**: 30 seconds for perfect results vs 5 seconds for mediocre

## 🚀 **Quick Start**

### Prerequisites
- Docker and Docker Compose installed
- Google AI API key (for Gemini Vision Pro)

### 1. Clone & Setup
```bash
git clone <repository>
cd real_ai
cp .env.example .env
```

### 2. Configure Environment
Edit `.env` file with your API keys:
```bash
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
SECRET_KEY=your_secure_secret_key_here
```

### 3. Launch with Docker
```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔧 **Development Setup**

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Background Workers
```bash
cd backend
celery -A app.celery worker --loglevel=info
```

## 📋 **API Endpoints**

### Core Staging API
- `POST /api/stage` - Upload and stage room photo
- `GET /api/stage/{staging_id}` - Get staging status/results
- `GET /api/styles` - Get available luxury styles
- `GET /api/health` - System health check

### Image Serving
- `GET /api/images/{filename}` - Serve uploaded/staged images

## 🎨 **Luxury Staging Styles**

### 1. Modern Luxury
- Clean lines and premium materials
- Sophisticated neutrals with minimal accents
- Perfect for contemporary high-end properties

### 2. Classic Elegance
- Timeless pieces and rich textures
- Traditional luxury with warm accent colors
- Ideal for established luxury homes

### 3. Contemporary Chic
- Current design trends with designer pieces
- Editorial styling with curated accessories
- Great for design-forward properties

## 🔍 **Quality Standards**

### AI Processing
- **Architectural Preservation**: 100% integrity of structural elements
- **Processing Time**: Under 30 seconds per staging
- **Quality Score**: AI-calculated rating based on multiple factors
- **Resolution**: 4K minimum for professional marketing

### User Experience
- **Premium UI**: Luxury design system with sophisticated interactions
- **Professional Workflow**: Optimized for real estate agent efficiency
- **Error Handling**: Comprehensive validation and user feedback
- **Mobile Responsive**: Works beautifully on all devices

## 🐳 **Deployment Options**

### Development (Local)
```bash
docker-compose up -d
```

### Production (VPS)
```bash
# Clone to server
git clone <repository> stagecraft-ai
cd stagecraft-ai

# Configure production environment
cp .env.example .env
# Edit .env with production settings

# Deploy with production compose
docker-compose -f docker-compose.prod.yml up -d

# Setup SSL with Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

### Cloud Platforms
- **Railway**: One-click deploy from GitHub
- **DigitalOcean App Platform**: Docker-based deployment
- **AWS/GCP**: Full container orchestration

## 📊 **System Requirements**

### Minimum (Development)
- 4GB RAM
- 2 CPU cores
- 10GB storage
- Docker support

### Recommended (Production)
- 8GB RAM
- 4 CPU cores
- 50GB storage
- SSD storage
- CDN for global image delivery

## 🔒 **Security Features**

- **File Upload Validation**: Comprehensive image format and size checks
- **Rate Limiting**: Prevents abuse with per-IP limits
- **CORS Configuration**: Restricted to allowed origins
- **API Key Authentication**: Secure access control
- **Error Handling**: No sensitive information leakage
- **HTTPS Enforcement**: SSL/TLS encryption

## 📈 **Monitoring & Health**

### Health Checks
- Database connectivity
- Redis cache status  
- Celery workers
- AI service availability
- Disk space monitoring

### Metrics
- Processing success rate
- Average response times
- Queue lengths
- User satisfaction scores
- Architectural integrity validation

## 🛠️ **Troubleshooting**

### Common Issues

**Services won't start:**
```bash
docker-compose down
docker-compose up -d --build
```

**Database migration errors:**
```bash
docker-compose exec backend alembic upgrade head
```

**AI processing fails:**
- Verify Google AI API key is correct
- Check API quota and billing
- Ensure image meets quality requirements

**File upload issues:**
- Check upload directory permissions
- Verify file size limits
- Ensure supported image formats

### Debug Mode
```bash
# Enable debug logging
export DEBUG=true
docker-compose up -d
```

## 📝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Standards
- **Code Quality**: Follow TypeScript/Python best practices
- **Testing**: Write tests for new features
- **Documentation**: Update README for significant changes
- **UI/UX**: Maintain luxury design standards
- **Performance**: Ensure fast response times

## 📄 **License**

This project is proprietary software designed for luxury real estate professionals.

## 🆘 **Support**

For technical support or feature requests:
- Create GitHub issue for bugs
- Contact team for enterprise features
- Check documentation for common solutions

---

**StageCraft AI** - Transforming luxury real estate with sophisticated AI staging.