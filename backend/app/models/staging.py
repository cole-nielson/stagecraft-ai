from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, UUID, DECIMAL, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from ..core.database import Base


class Staging(Base):
    __tablename__ = "stagings"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User association
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Project association
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    
    # Status tracking
    status = Column(String(20), nullable=False, default="processing")
    
    # Input data
    original_image_path = Column(Text, nullable=False)  # Filename reference
    original_image_data = Column(Text, nullable=True)   # Base64 encoded image
    style = Column(String(50), nullable=False)
    room_type = Column(String(50), nullable=True)
    quality_mode = Column(String(20), default="premium")
    
    # Output data
    staged_image_path = Column(Text, nullable=True)     # Filename reference
    staged_image_data = Column(Text, nullable=True)     # Base64 encoded image
    processing_time_ms = Column(Integer, nullable=True)
    quality_score = Column(DECIMAL(3, 2), nullable=True)
    architectural_integrity = Column(Boolean, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Optional organization
    property_name = Column(String(200), nullable=True)
    batch_id = Column(UUID(as_uuid=True), nullable=True)

    # Relationships
    project = relationship("Project", back_populates="stagings")

    def to_dict(self, include_image_data: bool = False):
        result = {
            "id": str(self.id),
            "user_id": str(self.user_id) if self.user_id else None,
            "project_id": str(self.project_id) if self.project_id else None,
            "status": self.status,
            "original_image_path": self.original_image_path,
            "style": self.style,
            "room_type": self.room_type,
            "quality_mode": self.quality_mode,
            "staged_image_path": self.staged_image_path,
            "processing_time_ms": self.processing_time_ms,
            "quality_score": float(self.quality_score) if self.quality_score else None,
            "architectural_integrity": self.architectural_integrity,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "error_message": self.error_message,
            "property_name": self.property_name,
            "batch_id": str(self.batch_id) if self.batch_id else None,
        }
        if include_image_data:
            result["original_image_data"] = self.original_image_data
            result["staged_image_data"] = self.staged_image_data
        return result