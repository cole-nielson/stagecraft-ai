from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import json
from ..core.database import get_db
from ..core.auth import get_current_user_required, get_current_user
from ..models.conversation import Conversation
from ..models.user import User

router = APIRouter()

class MessageSchema(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: Optional[str] = None
    staging_id: Optional[str] = None  # Link to staging result if applicable

class ConversationCreateSchema(BaseModel):
    title: Optional[str] = None
    messages: List[MessageSchema]

class ConversationUpdateSchema(BaseModel):
    title: Optional[str] = None
    messages: Optional[List[MessageSchema]] = None

@router.post("/api/conversations", response_model=dict)
async def create_conversation(
    conversation_data: ConversationCreateSchema,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """Create a new conversation."""
    # Generate title if not provided
    title = conversation_data.title
    if not title and conversation_data.messages:
        # Use first user message as title (truncated)
        first_user_message = next(
            (msg for msg in conversation_data.messages if msg.role == 'user'), 
            None
        )
        if first_user_message:
            title = first_user_message.content[:50] + ("..." if len(first_user_message.content) > 50 else "")
    
    # Create conversation
    conversation = Conversation(
        user_id=current_user.id,
        title=title or "New Conversation",
        messages=json.dumps([msg.dict() for msg in conversation_data.messages])
    )
    
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    
    return conversation.to_dict()

@router.get("/api/conversations", response_model=List[dict])
async def list_conversations(
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """List all conversations for the current user."""
    conversations = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.updated_at.desc()).all()
    
    return [conv.to_dict() for conv in conversations]

@router.get("/api/conversations/{conversation_id}", response_model=dict)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """Get a specific conversation."""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return conversation.to_dict()

@router.put("/api/conversations/{conversation_id}", response_model=dict)
async def update_conversation(
    conversation_id: str,
    update_data: ConversationUpdateSchema,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """Update a conversation."""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Update fields
    if update_data.title is not None:
        conversation.title = update_data.title
    
    if update_data.messages is not None:
        conversation.messages = json.dumps([msg.dict() for msg in update_data.messages])
    
    db.commit()
    db.refresh(conversation)
    
    return conversation.to_dict()

@router.delete("/api/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """Delete a conversation."""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    db.delete(conversation)
    db.commit()
    
    return {"message": "Conversation deleted successfully"}