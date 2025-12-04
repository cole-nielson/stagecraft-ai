from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
import os
import logging
from .core.config import settings
from .core.exceptions import StageCraftException
from .routes import staging_router, health_router, images_router, auth_router, conversations_router
from .middleware import (
    stagecraft_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    general_exception_handler
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Create FastAPI app
app = FastAPI(
    title="StageCraft AI",
    description="Premium AI staging for luxury real estate professionals",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Create uploads directory
os.makedirs(settings.upload_dir, exist_ok=True)

# Add exception handlers
app.add_exception_handler(StageCraftException, stagecraft_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Include routers
app.include_router(staging_router, prefix="/api", tags=["staging"])
app.include_router(health_router, prefix="/api", tags=["health"])
app.include_router(images_router, prefix="/api", tags=["images"])
app.include_router(auth_router, tags=["auth"])
app.include_router(conversations_router, tags=["conversations"])

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "StageCraft AI",
        "description": "Premium AI staging for luxury real estate professionals",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api")
async def api_info():
    """API information."""
    return {
        "name": "StageCraft AI API",
        "version": "1.0.0",
        "endpoints": {
            "staging": "/api/stage",
            "health": "/api/health"
        }
    }