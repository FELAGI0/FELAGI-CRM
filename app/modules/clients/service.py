from uuid import UUID

from sqlalchemy import exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.modules.clients.model import Client
from app.modules.clients.schemas import ClientCreate, ClientUpdate
from app.modules.deals.model import Deal
from app.modules.users.model import User


async def create_client(
    session: AsyncSession,
    payload: ClientCreate,
    current_user: User,
) -> Client:
    client = Client(
        name=payload.name,
        email=payload.email.lower() if payload.email is not None else None,
        phone=payload.phone,
        company=payload.company,
        notes=payload.notes,
        created_by=current_user.id,
    )
    session.add(client)
    await session.commit()
    await session.refresh(client)
    return client


async def get_client_by_id(session: AsyncSession, client_id: UUID) -> Client:
    client = await session.get(Client, client_id)
    if client is None:
        raise NotFoundError("Client not found")
    return client


async def list_clients(
    session: AsyncSession,
    limit: int,
    offset: int,
) -> tuple[list[Client], int]:
    total = await session.scalar(select(func.count()).select_from(Client))
    result = await session.execute(
        select(Client).order_by(Client.created_at.desc()).limit(limit).offset(offset)
    )
    return list(result.scalars()), total or 0


async def update_client(
    session: AsyncSession,
    client_id: UUID,
    payload: ClientUpdate,
    current_user: User,
) -> Client:
    del current_user
    client = await get_client_by_id(session, client_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(client, field, value)
    await session.commit()
    await session.refresh(client)
    return client


async def delete_client(
    session: AsyncSession,
    client_id: UUID,
    current_user: User,
) -> None:
    del current_user
    client = await get_client_by_id(session, client_id)
    has_deals = await session.scalar(
        select(exists().where(Deal.client_id == client_id))
    )
    if has_deals:
        raise ConflictError("Client has deals")
    await session.delete(client)
    await session.commit()
