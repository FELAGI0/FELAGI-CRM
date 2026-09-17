from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.modules.clients.model import Client
    from app.modules.tasks.model import Task
    from app.modules.users.model import User


class Deal(Base):
    __tablename__ = "deals"
    __table_args__ = (
        CheckConstraint(
            "amount IS NULL OR amount >= 0",
            name="ck_deals_amount_non_negative",
        ),
        CheckConstraint(
            "status IN ('new', 'in_progress', 'won', 'lost')",
            name="ck_deals_status_valid",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(255))
    amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(
        String(16),
        default="new",
        server_default="new",
    )
    client_id: Mapped[UUID] = mapped_column(
        Uuid,
        ForeignKey("clients.id", ondelete="RESTRICT"),
        index=True,
    )
    created_by: Mapped[UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    client: Mapped["Client"] = relationship(
        back_populates="deals",
        lazy="raise",
    )
    creator: Mapped["User"] = relationship(lazy="raise")
    tasks: Mapped[list["Task"]] = relationship(
        back_populates="deal",
        lazy="raise",
        cascade="all, delete-orphan",
    )
