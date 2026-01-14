"""Add OAuth fields to user table

Revision ID: oauth_fields
Revises: 20250101_0000_002
Create Date: 2025-09-02 17:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'oauth_fields'
down_revision = '20250101_0000_002'
branch_labels = None
depends_on = None

def upgrade():
    # Add OAuth fields to users table
    op.add_column('users', sa.Column('google_id', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('avatar_url', sa.String(500), nullable=True))
    
    # Add unique constraint on google_id
    op.create_unique_constraint('uq_users_google_id', 'users', ['google_id'])

def downgrade():
    # Remove unique constraint
    op.drop_constraint('uq_users_google_id', 'users', type_='unique')
    
    # Remove OAuth fields
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'google_id')