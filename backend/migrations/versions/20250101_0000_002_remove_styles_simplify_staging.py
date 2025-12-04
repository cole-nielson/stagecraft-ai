"""remove_styles_table_and_simplify_staging

Revision ID: 20250101_0000_002
Revises: 20241228_1200_001_initial_tables
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20250101_0000_002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    """Remove styles table and simplify staging system."""
    
    # Drop the styles table entirely
    op.drop_table('styles')
    
    # Update existing staging records to use 'default' style
    # This preserves existing data while removing the style complexity
    op.execute("UPDATE stagings SET style = 'default' WHERE style IN ('modern_luxury', 'classic_elegance', 'contemporary_chic')")


def downgrade():
    """Recreate styles table and restore style references."""
    
    # Recreate styles table
    op.create_table('styles',
        sa.Column('id', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('preview_image_path', sa.Text(), nullable=True),
        sa.Column('prompt_template', sa.Text(), nullable=True),
        sa.Column('active', sa.Boolean(), nullable=True, default=True),
        sa.Column('sort_order', sa.Integer(), nullable=True, default=0),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Insert the original styles
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
    
    # Restore style references in staging table (set to modern_luxury as default)
    op.execute("UPDATE stagings SET style = 'modern_luxury' WHERE style = 'default'")