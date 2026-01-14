from sqlalchemy import Column, String, DateTime, Text, UUID, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from ..core.database import Base


class Project(Base):
    __tablename__ = "projects"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User association
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Project info
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="projects")
    stagings = relationship("Staging", back_populates="project", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "name": self.name,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "staging_count": len(self.stagings) if self.stagings else 0,
        }
