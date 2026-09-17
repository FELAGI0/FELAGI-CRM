from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.api.dependencies.pagination import pagination
from app.api.dependencies.permissions import require_role
from app.api.schemas import Page
from app.db.session import get_db_session
from app.modules.clients.schemas import ClientCreate, ClientRead, ClientUpdate
from app.modules.clients.service import (
    create_client,
    delete_client,
    get_client_by_id,
    list_clients,
    update_client,
)
from app.modules.users.model import User

router = APIRouter(prefix="/clients", tags=["clients"])


@router.post("/", response_model=ClientRead, status_code=status.HTTP_201_CREATED)
async def create(
    payload: ClientCreate,
    current_user: User = Depends(require_role("admin", "manager")),
    session: AsyncSession = Depends(get_db_session),
) -> ClientRead:
    client = await create_client(session, payload, current_user)
    return ClientRead.model_validate(client)


@router.get("/", response_model=Page[ClientRead])
async def list_all(
    current_user: User = Depends(get_current_user),
    page: tuple[int, int] = Depends(pagination),
    session: AsyncSession = Depends(get_db_session),
) -> Page[ClientRead]:
    del current_user
    limit, offset = page
    clients, total = await list_clients(session, limit, offset)
    return Page[ClientRead](
        items=[ClientRead.model_validate(client) for client in clients],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{client_id}", response_model=ClientRead)
async def get_one(
    client_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> ClientRead:
    del current_user
    client = await get_client_by_id(session, client_id)
    return ClientRead.model_validate(client)


@router.patch("/{client_id}", response_model=ClientRead)
async def update(
    client_id: UUID,
    payload: ClientUpdate,
    current_user: User = Depends(require_role("admin", "manager")),
    session: AsyncSession = Depends(get_db_session),
) -> ClientRead:
    client = await update_client(session, client_id, payload, current_user)
    return ClientRead.model_validate(client)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    client_id: UUID,
    current_user: User = Depends(require_role("admin", "manager")),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    await delete_client(session, client_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
