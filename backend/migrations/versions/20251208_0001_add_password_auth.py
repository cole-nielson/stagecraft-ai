"""Add password auth fields to users table

Revision ID: add_password_auth
Revises: conversations
Create Date: 2025-12-08 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'add_password_auth'
down_revision = 'conversations'
branch_labels = None
depends_on = None


def upgrade():
    # Add password authentication fields to users table
    op.add_column('users', sa.Column('password_hash', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('auth_provider', sa.String(20), server_default='email', nullable=True))


def downgrade():
    # Remove password authentication fields
    op.drop_column('users', 'auth_provider')
    op.drop_column('users', 'password_hash')
