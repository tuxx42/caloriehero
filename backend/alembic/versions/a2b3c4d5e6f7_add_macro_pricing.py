"""add macro pricing

Revision ID: a2b3c4d5e6f7
Revises: 01029f89a837
Create Date: 2026-02-22 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a2b3c4d5e6f7'
down_revision: Union[str, None] = '01029f89a837'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create app_settings table
    op.create_table('app_settings',
        sa.Column('protein_price_per_gram', sa.Float(), nullable=False, server_default='3.0'),
        sa.Column('carbs_price_per_gram', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('fat_price_per_gram', sa.Float(), nullable=False, server_default='1.5'),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Add per-meal pricing overrides to meals
    op.add_column('meals', sa.Column('protein_price_per_gram', sa.Float(), nullable=True))
    op.add_column('meals', sa.Column('carbs_price_per_gram', sa.Float(), nullable=True))
    op.add_column('meals', sa.Column('fat_price_per_gram', sa.Float(), nullable=True))

    # Add extra macro fields to order_items
    op.add_column('order_items', sa.Column('extra_protein', sa.Float(), nullable=False, server_default='0'))
    op.add_column('order_items', sa.Column('extra_carbs', sa.Float(), nullable=False, server_default='0'))
    op.add_column('order_items', sa.Column('extra_fat', sa.Float(), nullable=False, server_default='0'))

    # Seed default settings row
    op.execute(
        "INSERT INTO app_settings (id, protein_price_per_gram, carbs_price_per_gram, fat_price_per_gram, created_at, updated_at) "
        "VALUES (gen_random_uuid(), 3.0, 1.0, 1.5, now(), now())"
    )


def downgrade() -> None:
    op.drop_column('order_items', 'extra_fat')
    op.drop_column('order_items', 'extra_carbs')
    op.drop_column('order_items', 'extra_protein')
    op.drop_column('meals', 'fat_price_per_gram')
    op.drop_column('meals', 'carbs_price_per_gram')
    op.drop_column('meals', 'protein_price_per_gram')
    op.drop_table('app_settings')
