from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthorizationError, NotFoundError
from app.modules.deals.service import get_deal_by_id
from app.modules.tasks.model import Task
from app.modules.tasks.schemas import TaskCreate, TaskUpdate
from app.modules.users.model import User
from app.modules.users.service import get_user_by_id


async def create_task(
    session: AsyncSession,
    payload: TaskCreate,
    current_user: User,
) -> Task:
    await get_deal_by_id(session, payload.deal_id)
    assigned_to = payload.assigned_to
    if current_user.role == "user":
        if assigned_to is not None and assigned_to != current_user.id:
            raise AuthorizationError(
                "User can only create tasks assigned to themselves"
            )
        assigned_to = current_user.id
    if assigned_to is not None:
        await get_user_by_id(session, assigned_to)
    task = Task(
        title=payload.title,
        description=payload.description,
        status=payload.status,
        due_date=payload.due_date,
        deal_id=payload.deal_id,
        assigned_to=assigned_to,
        created_by=current_user.id,
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task


async def get_task_by_id(session: AsyncSession, task_id: UUID) -> Task:
    task = await session.get(Task, task_id)
    if task is None:
        raise NotFoundError("Task not found")
    return task


async def list_tasks(
    session: AsyncSession,
    limit: int,
    offset: int,
    status: str | None = None,
    assigned_to: UUID | None = None,
    deal_id: UUID | None = None,
) -> tuple[list[Task], int]:
    filters = []
    if status is not None:
        filters.append(Task.status == status)
    if assigned_to is not None:
        filters.append(Task.assigned_to == assigned_to)
    if deal_id is not None:
        filters.append(Task.deal_id == deal_id)
    total = await session.scalar(select(func.count()).select_from(Task).where(*filters))
    result = await session.execute(
        select(Task)
        .where(*filters)
        .order_by(Task.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars()), total or 0


async def update_task(
    session: AsyncSession,
    task_id: UUID,
    payload: TaskUpdate,
    current_user: User,
) -> Task:
    task = await get_task_by_id(session, task_id)
    if current_user.role == "user":
        if task.assigned_to != current_user.id:
            raise AuthorizationError("User can only update own tasks")
        if payload.assigned_to is not None and payload.assigned_to != current_user.id:
            raise AuthorizationError("User cannot reassign tasks")
    if payload.deal_id is not None:
        await get_deal_by_id(session, payload.deal_id)
    if payload.assigned_to is not None:
        await get_user_by_id(session, payload.assigned_to)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(task, field, value)
    await session.commit()
    await session.refresh(task)
    return task


async def delete_task(
    session: AsyncSession,
    task_id: UUID,
    current_user: User,
) -> None:
    task = await get_task_by_id(session, task_id)
    if current_user.role == "user" and task.assigned_to != current_user.id:
        raise AuthorizationError("User can only delete own tasks")
    await session.delete(task)
    await session.commit()
