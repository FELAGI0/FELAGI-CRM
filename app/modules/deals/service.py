from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.modules.clients.service import get_client_by_id
from app.modules.deals.model import Deal
from app.modules.deals.schemas import DealCreate, DealUpdate
from app.modules.users.model import User


async def create_deal(
    session: AsyncSession,
    payload: DealCreate,
    current_user: User,
) -> Deal:
    await get_client_by_id(session, payload.client_id)
    deal = Deal(
        title=payload.title,
        amount=payload.amount,
        status=payload.status,
        client_id=payload.client_id,
        created_by=current_user.id,
    )
    session.add(deal)
    await session.commit()
    await session.refresh(deal)
    return deal


async def get_deal_by_id(session: AsyncSession, deal_id: UUID) -> Deal:
    deal = await session.get(Deal, deal_id)
    if deal is None:
        raise NotFoundError("Deal not found")
    return deal


async def list_deals(
    session: AsyncSession,
    limit: int,
    offset: int,
    status: str | None = None,
    client_id: UUID | None = None,
) -> tuple[list[Deal], int]:
    filters = []
    if status is not None:
        filters.append(Deal.status == status)
    if client_id is not None:
        filters.append(Deal.client_id == client_id)

    total = await session.scalar(select(func.count()).select_from(Deal).where(*filters))
    result = await session.execute(
        select(Deal)
        .where(*filters)
        .order_by(Deal.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars()), total or 0


async def update_deal(
    session: AsyncSession,
    deal_id: UUID,
    payload: DealUpdate,
    current_user: User,
) -> Deal:
    del current_user
    deal = await get_deal_by_id(session, deal_id)
    if payload.client_id is not None:
        await get_client_by_id(session, payload.client_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(deal, field, value)
    await session.commit()
    await session.refresh(deal)
    return deal


async def delete_deal(
    session: AsyncSession,
    deal_id: UUID,
    current_user: User,
) -> None:
    del current_user
    deal = await get_deal_by_id(session, deal_id)
    await session.delete(deal)
    await session.commit()
