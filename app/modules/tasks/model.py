from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.modules.deals.model import Deal
    from app.modules.users.model import User


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (
        CheckConstraint(
            "status IN ('todo', 'in_progress', 'done')",
            name="ck_tasks_status_valid",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        String(16),
        default="todo",
        server_default="todo",
    )
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deal_id: Mapped[UUID] = mapped_column(
        Uuid,
        ForeignKey("deals.id", ondelete="CASCADE"),
        index=True,
    )
    assigned_to: Mapped[UUID | None] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
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

    deal: Mapped["Deal"] = relationship(
        back_populates="tasks",
        lazy="raise",
    )
    assignee: Mapped["User"] = relationship(
        foreign_keys="[Task.assigned_to]",
        back_populates="assigned_tasks",
        lazy="raise",
    )
    creator: Mapped["User"] = relationship(
        foreign_keys="[Task.created_by]",
        back_populates="created_tasks",
        lazy="raise",
    )
