"""add_unit_code_unique

Revision ID: 8d844cf65efb
Revises: 8d900f828fb2
Create Date: 2026-06-25 01:01:46.508117

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8d844cf65efb'
down_revision: Union[str, Sequence[str], None] = '8d900f828fb2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint("uq_units_code", "units", ["code"])


def downgrade() -> None:
    op.drop_constraint("uq_units_code", "units", type_="unique")
