from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.api.dependencies.pagination import pagination
from app.api.schemas import Page
from app.db.session import get_db_session
from app.modules.tasks.schemas import TaskCreate, TaskRead, TaskUpdate
from app.modules.tasks.service import (
    create_task,
    delete_task,
    get_task_by_id,
    list_tasks,
    update_task,
)
from app.modules.users.model import User

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("/", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create(
    payload: TaskCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> TaskRead:
    task = await create_task(session, payload, current_user)
    return TaskRead.model_validate(task)


@router.get("/", response_model=Page[TaskRead])
async def list_all(
    status_filter: str | None = Query(default=None, alias="status"),
    assigned_to: UUID | None = Query(default=None),
    deal_id: UUID | None = Query(default=None),
    page: tuple[int, int] = Depends(pagination),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> Page[TaskRead]:
    del current_user
    limit, offset = page
    tasks, total = await list_tasks(
        session,
        limit,
        offset,
        status=status_filter,
        assigned_to=assigned_to,
        deal_id=deal_id,
    )
    return Page[TaskRead](
        items=[TaskRead.model_validate(task) for task in tasks],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{task_id}", response_model=TaskRead)
async def get_one(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> TaskRead:
    del current_user
    task = await get_task_by_id(session, task_id)
    return TaskRead.model_validate(task)


@router.patch("/{task_id}", response_model=TaskRead)
async def update(
    task_id: UUID,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> TaskRead:
    task = await update_task(session, task_id, payload, current_user)
    return TaskRead.model_validate(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    await delete_task(session, task_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
