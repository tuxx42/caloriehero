"""add plan item extras

Revision ID: b3c4d5e6f7g8
Revises: a2b3c4d5e6f7
Create Date: 2026-02-22 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b3c4d5e6f7g8'
down_revision: Union[str, None] = 'a2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('meal_plan_items', sa.Column('extra_protein', sa.Float(), nullable=False, server_default='0'))
    op.add_column('meal_plan_items', sa.Column('extra_carbs', sa.Float(), nullable=False, server_default='0'))
    op.add_column('meal_plan_items', sa.Column('extra_fat', sa.Float(), nullable=False, server_default='0'))


def downgrade() -> None:
    op.drop_column('meal_plan_items', 'extra_fat')
    op.drop_column('meal_plan_items', 'extra_carbs')
    op.drop_column('meal_plan_items', 'extra_protein')
