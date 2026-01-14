from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    database_url: str
    
    # AI Services
    google_ai_api_key: str = ""
    
    # Security
    secret_key: str
    cors_origins: str = "http://localhost:3000"
    
    # File Upload
    upload_dir: str = "./uploads"
    max_upload_size: int = 10485760  # 10MB
    
    # AI Configuration
    ai_timeout_seconds: int = 60
    max_concurrent_jobs: int = 5
    image_quality: str = "high"
    
    # App Settings
    debug: bool = False
    log_level: str = "INFO"

    # OAuth Settings
    google_client_id: str = ""
    google_client_secret: str = ""
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days

    # Watermark Settings (disabled)
    watermark_enabled: bool = False
    
    def get_cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(',')]
    
    class Config:
        env_file = ".env"


settings = Settings()