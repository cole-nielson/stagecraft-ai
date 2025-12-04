"""Create conversations table

Revision ID: conversations
Revises: oauth_fields
Create Date: 2025-09-02 17:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'conversations'
down_revision = 'oauth_fields'
branch_labels = None
depends_on = None

def upgrade():
    # Create conversations table
    op.create_table('conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(200), nullable=True),
        sa.Column('messages', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    )
    
    # Add foreign key constraint
    op.create_foreign_key('fk_conversations_user_id', 'conversations', 'users', ['user_id'], ['id'])
    
    # Add indexes
    op.create_index('ix_conversations_user_id', 'conversations', ['user_id'])
    op.create_index('ix_conversations_created_at', 'conversations', ['created_at'])

def downgrade():
    # Drop indexes
    op.drop_index('ix_conversations_created_at', 'conversations')
    op.drop_index('ix_conversations_user_id', 'conversations')
    
    # Drop foreign key constraint
    op.drop_constraint('fk_conversations_user_id', 'conversations', type_='foreignkey')
    
    # Drop table
    op.drop_table('conversations')