from celery import Celery
from ..core.config import settings

# Create Celery app
celery_app = Celery(
    "stagecraft",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.services.tasks"]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    result_expires=3600,
    timezone="UTC",
    enable_utc=True,
    worker_concurrency=2,
    task_routes={
        "app.services.tasks.process_staging": {"queue": "staging"},
    }
)