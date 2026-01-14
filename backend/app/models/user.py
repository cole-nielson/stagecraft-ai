from sqlalchemy import Column, String, DateTime, Integer, UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from ..core.database import Base


class User(Base):
    __tablename__ = "users"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Basic info
    email = Column(String(255), unique=True, nullable=False)
    api_key = Column(String(255), unique=True, nullable=False)
    name = Column(String(100), nullable=True)
    company = Column(String(200), nullable=True)
    google_id = Column(String(100), unique=True, nullable=True)
    avatar_url = Column(String(500), nullable=True)

    # Authentication
    password_hash = Column(String(255), nullable=True)  # Nullable for OAuth-only users
    auth_provider = Column(String(20), default="email")  # "email" or "google"
    
    # Subscription
    plan = Column(String(20), default="trial")
    usage_limit = Column(Integer, default=10)
    current_usage = Column(Integer, default=0)
    billing_cycle_start = Column(DateTime(timezone=True), server_default=func.now())
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_active = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    conversations = relationship("Conversation", back_populates="user")
    projects = relationship("Project", back_populates="user")
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "email": self.email,
            "name": self.name,
            "company": self.company,
            "plan": self.plan,
            "usage_limit": self.usage_limit,
            "current_usage": self.current_usage,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_active": self.last_active.isoformat() if self.last_active else None,
        }