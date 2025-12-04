"""Initial tables

Revision ID: 001
Revises: 
Create Date: 2024-12-28 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table('users',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('api_key', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=True),
        sa.Column('company', sa.String(length=200), nullable=True),
        sa.Column('plan', sa.String(length=20), nullable=True),
        sa.Column('usage_limit', sa.Integer(), nullable=True),
        sa.Column('current_usage', sa.Integer(), nullable=True),
        sa.Column('billing_cycle_start', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('last_active', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('api_key'),
        sa.UniqueConstraint('email')
    )

    # Create styles table
    op.create_table('styles',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('preview_image_path', sa.Text(), nullable=True),
        sa.Column('prompt_template', sa.Text(), nullable=True),
        sa.Column('active', sa.Boolean(), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create stagings table
    op.create_table('stagings',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('original_image_path', sa.Text(), nullable=False),
        sa.Column('style', sa.String(length=50), nullable=False),
        sa.Column('room_type', sa.String(length=50), nullable=True),
        sa.Column('quality_mode', sa.String(length=20), nullable=True),
        sa.Column('staged_image_path', sa.Text(), nullable=True),
        sa.Column('processing_time_ms', sa.Integer(), nullable=True),
        sa.Column('quality_score', sa.DECIMAL(precision=3, scale=2), nullable=True),
        sa.Column('architectural_integrity', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('property_name', sa.String(length=200), nullable=True),
        sa.Column('batch_id', UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for performance
    op.create_index(op.f('ix_stagings_user_id'), 'stagings', ['user_id'], unique=False)
    op.create_index(op.f('ix_stagings_status'), 'stagings', ['status'], unique=False)
    op.create_index(op.f('ix_stagings_created_at'), 'stagings', ['created_at'], unique=False)

    # Insert default styles
    styles_table = sa.table('styles',
        sa.column('id', sa.String),
        sa.column('name', sa.String),
        sa.column('description', sa.Text),
        sa.column('active', sa.Boolean),
        sa.column('sort_order', sa.Integer)
    )
    
    op.bulk_insert(styles_table, [
        {
            'id': 'modern_luxury',
            'name': 'Modern Luxury',
            'description': 'Clean lines, premium materials, sophisticated neutrals for contemporary high-end properties',
            'active': True,
            'sort_order': 1
        },
        {
            'id': 'classic_elegance',
            'name': 'Classic Elegance', 
            'description': 'Timeless pieces, rich textures, traditional luxury for established wealth appeal',
            'active': True,
            'sort_order': 2
        },
        {
            'id': 'contemporary_chic',
            'name': 'Contemporary Chic',
            'description': 'Current design trends, designer pieces, editorial styling for design-forward properties',
            'active': True,
            'sort_order': 3
        }
    ])


def downgrade() -> None:
    op.drop_index(op.f('ix_stagings_created_at'), table_name='stagings')
    op.drop_index(op.f('ix_stagings_status'), table_name='stagings')
    op.drop_index(op.f('ix_stagings_user_id'), table_name='stagings')
    op.drop_table('stagings')
    op.drop_table('styles')
    op.drop_table('users')