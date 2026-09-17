from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.api.dependencies.pagination import pagination
from app.api.dependencies.permissions import require_role
from app.api.schemas import Page
from app.db.session import get_db_session
from app.modules.deals.schemas import DealCreate, DealRead, DealUpdate
from app.modules.deals.service import (
    create_deal,
    delete_deal,
    get_deal_by_id,
    list_deals,
    update_deal,
)
from app.modules.users.model import User

router = APIRouter(prefix="/deals", tags=["deals"])


@router.post("/", response_model=DealRead, status_code=status.HTTP_201_CREATED)
async def create(
    payload: DealCreate,
    current_user: User = Depends(require_role("admin", "manager")),
    session: AsyncSession = Depends(get_db_session),
) -> DealRead:
    deal = await create_deal(session, payload, current_user)
    return DealRead.model_validate(deal)


@router.get("/", response_model=Page[DealRead])
async def list_all(
    status_filter: str | None = Query(default=None, alias="status"),
    client_id: UUID | None = Query(default=None),
    page: tuple[int, int] = Depends(pagination),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> Page[DealRead]:
    del current_user
    limit, offset = page
    deals, total = await list_deals(
        session,
        limit,
        offset,
        status=status_filter,
        client_id=client_id,
    )
    return Page[DealRead](
        items=[DealRead.model_validate(deal) for deal in deals],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{deal_id}", response_model=DealRead)
async def get_one(
    deal_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> DealRead:
    del current_user
    deal = await get_deal_by_id(session, deal_id)
    return DealRead.model_validate(deal)


@router.patch("/{deal_id}", response_model=DealRead)
async def update(
    deal_id: UUID,
    payload: DealUpdate,
    current_user: User = Depends(require_role("admin", "manager")),
    session: AsyncSession = Depends(get_db_session),
) -> DealRead:
    deal = await update_deal(session, deal_id, payload, current_user)
    return DealRead.model_validate(deal)


@router.delete("/{deal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    deal_id: UUID,
    current_user: User = Depends(require_role("admin", "manager")),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    await delete_deal(session, deal_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
