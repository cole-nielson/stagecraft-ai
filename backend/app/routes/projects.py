from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from ..core.database import get_db
from ..core.auth import get_current_user_required
from ..models.user import User
from ..models.project import Project
from ..models.staging import Staging

router = APIRouter()


# Pydantic schemas
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class StagingResponse(BaseModel):
    id: str
    status: str
    original_image_path: str
    staged_image_path: Optional[str]
    style: str
    room_type: Optional[str]
    created_at: Optional[str]
    completed_at: Optional[str]

    class Config:
        from_attributes = True


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    staging_count: int
    created_at: Optional[str]
    updated_at: Optional[str]

    class Config:
        from_attributes = True


class ProjectWithStagings(ProjectResponse):
    stagings: List[StagingResponse]


@router.get("/projects")
async def list_projects(
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """List all projects for the current user."""
    projects = db.query(Project).filter(Project.user_id == current_user.id).order_by(Project.updated_at.desc()).all()

    return {
        "projects": [
            {
                "id": str(p.id),
                "name": p.name,
                "description": p.description,
                "staging_count": len(p.stagings) if p.stagings else 0,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
            }
            for p in projects
        ]
    }


@router.post("/projects")
async def create_project(
    request: ProjectCreate,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """Create a new project."""
    project = Project(
        user_id=current_user.id,
        name=request.name,
        description=request.description
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    return {
        "id": str(project.id),
        "name": project.name,
        "description": project.description,
        "staging_count": 0,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
    }


@router.get("/projects/{project_id}")
async def get_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """Get a specific project with its stagings."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    return {
        "id": str(project.id),
        "name": project.name,
        "description": project.description,
        "staging_count": len(project.stagings) if project.stagings else 0,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
        "stagings": [s.to_dict() for s in (project.stagings or [])]
    }


@router.put("/projects/{project_id}")
async def update_project(
    project_id: UUID,
    request: ProjectUpdate,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """Update a project."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    if request.name is not None:
        project.name = request.name
    if request.description is not None:
        project.description = request.description

    db.commit()
    db.refresh(project)

    return {
        "id": str(project.id),
        "name": project.name,
        "description": project.description,
        "staging_count": len(project.stagings) if project.stagings else 0,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
    }


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """Delete a project and all its associated stagings (cascade delete)."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    db.delete(project)
    db.commit()

    return {"message": "Project deleted successfully"}


@router.get("/stagings/history")
async def get_staging_history(
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """Get the staging history for the current user."""
    stagings = db.query(Staging).filter(
        Staging.user_id == current_user.id
    ).order_by(Staging.created_at.desc()).limit(limit).all()

    return {
        "stagings": [s.to_dict() for s in stagings]
    }


@router.get("/stagings/unsorted")
async def get_unsorted_stagings(
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """Get stagings that don't belong to any project."""
    stagings = db.query(Staging).filter(
        Staging.user_id == current_user.id,
        Staging.project_id == None
    ).order_by(Staging.created_at.desc()).limit(limit).all()

    return {
        "stagings": [s.to_dict() for s in stagings]
    }


class MoveStagingRequest(BaseModel):
    project_id: Optional[str] = None


@router.patch("/stagings/{staging_id}/project")
async def move_staging_to_project(
    staging_id: UUID,
    request: MoveStagingRequest,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db)
):
    """Move a staging to a different project or remove from project."""
    # Find the staging
    staging = db.query(Staging).filter(
        Staging.id == staging_id,
        Staging.user_id == current_user.id
    ).first()

    if not staging:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staging not found"
        )

    # If project_id is provided, verify it belongs to the user
    if request.project_id:
        project = db.query(Project).filter(
            Project.id == request.project_id,
            Project.user_id == current_user.id
        ).first()

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        staging.project_id = project.id
    else:
        # Remove from project (move to unsorted)
        staging.project_id = None

    db.commit()
    db.refresh(staging)

    return staging.to_dict()
