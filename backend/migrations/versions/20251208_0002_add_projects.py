"""Create projects table and add project_id to stagings

Revision ID: add_projects
Revises: add_password_auth
Create Date: 2025-12-08 16:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_projects'
down_revision = 'add_password_auth'
branch_labels = None
depends_on = None


def upgrade():
    # Create projects table
    op.create_table('projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    )

    # Add foreign key constraint for projects.user_id -> users.id
    op.create_foreign_key('fk_projects_user_id', 'projects', 'users', ['user_id'], ['id'])

    # Add indexes on projects
    op.create_index('ix_projects_user_id', 'projects', ['user_id'])
    op.create_index('ix_projects_created_at', 'projects', ['created_at'])

    # Add project_id column to stagings table
    op.add_column('stagings', sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=True))

    # Add foreign key constraint for stagings.project_id -> projects.id
    op.create_foreign_key('fk_stagings_project_id', 'stagings', 'projects', ['project_id'], ['id'])

    # Add foreign key constraint for stagings.user_id -> users.id (if not exists)
    # Note: This might already exist, so we wrap it in a try/except
    try:
        op.create_foreign_key('fk_stagings_user_id', 'stagings', 'users', ['user_id'], ['id'])
    except Exception:
        pass  # Foreign key might already exist

    # Add index on stagings.project_id
    op.create_index('ix_stagings_project_id', 'stagings', ['project_id'])


def downgrade():
    # Drop index on stagings.project_id
    op.drop_index('ix_stagings_project_id', 'stagings')

    # Drop foreign key constraint for stagings.project_id
    op.drop_constraint('fk_stagings_project_id', 'stagings', type_='foreignkey')

    # Drop project_id column from stagings
    op.drop_column('stagings', 'project_id')

    # Drop indexes on projects
    op.drop_index('ix_projects_created_at', 'projects')
    op.drop_index('ix_projects_user_id', 'projects')

    # Drop foreign key constraint for projects.user_id
    op.drop_constraint('fk_projects_user_id', 'projects', type_='foreignkey')

    # Drop projects table
    op.drop_table('projects')
