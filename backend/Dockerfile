FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
# Note: When built from repo root, files are in backend/
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ .

# Create uploads directory
RUN mkdir -p uploads

# Railway provides PORT env variable
ENV PORT=8000
EXPOSE $PORT

# Run application - use shell form to expand $PORT
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
