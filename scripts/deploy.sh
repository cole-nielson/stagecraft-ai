#!/bin/bash

# StageCraft AI Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Environments: dev, prod

set -e  # Exit on any error

ENVIRONMENT=${1:-dev}
PROJECT_NAME="stagecraft-ai"

echo "🚀 Deploying StageCraft AI (Environment: $ENVIRONMENT)"

# Validate environment
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    echo "❌ Invalid environment. Use 'dev' or 'prod'"
    exit 1
fi

# Check if required files exist
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure."
    exit 1
fi

# Check Docker and Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads
mkdir -p backups
mkdir -p ssl

# Set appropriate permissions
chmod 755 uploads
chmod 755 backups

if [ "$ENVIRONMENT" == "dev" ]; then
    echo "🔧 Starting development environment..."
    
    # Build and start services
    docker-compose down
    docker-compose build
    docker-compose up -d
    
    # Wait for services to start
    echo "⏳ Waiting for services to start..."
    sleep 10
    
    # Run database migrations
    echo "📊 Running database migrations..."
    docker-compose exec backend alembic upgrade head
    
    # Check service health
    echo "🏥 Checking service health..."
    if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
        echo "✅ Backend service is healthy"
    else
        echo "⚠️  Backend service might not be ready yet"
    fi
    
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend service is healthy"
    else
        echo "⚠️  Frontend service might not be ready yet"
    fi
    
    echo ""
    echo "🎉 Development deployment complete!"
    echo ""
    echo "Access URLs:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:8000"
    echo "  API Docs: http://localhost:8000/docs"
    echo ""
    echo "Useful commands:"
    echo "  View logs: docker-compose logs -f"
    echo "  Stop:      docker-compose down"
    echo "  Restart:   docker-compose restart"

elif [ "$ENVIRONMENT" == "prod" ]; then
    echo "🏭 Starting production environment..."
    
    # Validate production requirements
    if ! grep -q "yourdomain.com" .env; then
        echo "⚠️  Remember to update domain settings in .env and nginx config"
    fi
    
    # Build and start services
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml build
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to start
    echo "⏳ Waiting for services to start..."
    sleep 15
    
    # Run database migrations
    echo "📊 Running database migrations..."
    docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
    
    echo ""
    echo "🎉 Production deployment complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Configure SSL certificates in ./ssl/"
    echo "  2. Update domain settings in nginx config"
    echo "  3. Set up DNS records"
    echo "  4. Configure monitoring and backups"
    echo ""
    echo "Useful commands:"
    echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  Stop:      docker-compose -f docker-compose.prod.yml down"
fi

echo ""
echo "📋 Service Status:"
docker-compose ps