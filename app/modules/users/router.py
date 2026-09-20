from uuid import UUID

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.api.dependencies.pagination import pagination
from app.api.dependencies.permissions import require_role
from app.api.schemas import Page
from app.core.exceptions import AuthenticationError
from app.core.rate_limit import limiter
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)
from app.db.session import get_db_session
from app.modules.users.model import User
from app.modules.users.schemas import (
    RefreshRequest,
    TokenPair,
    UserAdminCreate,
    UserAdminUpdate,
    UserCreate,
    UserLogin,
    UserRead,
)
from app.modules.users.service import (
    authenticate_user,
    create_user,
    create_user_admin,
    delete_user_admin,
    get_user_by_id,
    list_users,
    update_user_admin,
)

auth_router = APIRouter(prefix="/auth", tags=["auth"])
users_router = APIRouter(prefix="/users", tags=["users"])

# Administrative user management. Every route requires the admin role, and the
# router is mounted under its own prefix so the rule cannot be bypassed by a
# route added to `users_router` later.
users_admin_router = APIRouter(
    prefix="/users",
    tags=["users-admin"],
    dependencies=[Depends(require_role("admin"))],
)


@auth_router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("5/minute")
async def register(
    request: Request,
    payload: UserCreate,
    session: AsyncSession = Depends(get_db_session),
) -> UserRead:
    del request
    user = await create_user(session, payload)
    return UserRead.model_validate(user)


@auth_router.post("/login", response_model=TokenPair)
@limiter.limit("5/minute")
async def login(
    request: Request,
    payload: UserLogin,
    session: AsyncSession = Depends(get_db_session),
) -> TokenPair:
    del request
    user = await authenticate_user(session, payload)
    return _create_token_pair(user)


@auth_router.post("/refresh", response_model=TokenPair)
async def refresh(
    payload: RefreshRequest,
    session: AsyncSession = Depends(get_db_session),
) -> TokenPair:
    token_payload = decode_refresh_token(payload.refresh_token)
    try:
        user_id = UUID(token_payload["sub"])
    except (KeyError, ValueError) as exc:
        raise AuthenticationError("Not authenticated") from exc

    try:
        user = await get_user_by_id(session, user_id)
    except Exception as exc:
        raise AuthenticationError("Not authenticated") from exc

    if not user.is_active:
        raise AuthenticationError("Not authenticated")
    return _create_token_pair(user)


@users_router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@users_admin_router.get("/", response_model=Page[UserRead])
async def list_all(
    page: tuple[int, int] = Depends(pagination),
    session: AsyncSession = Depends(get_db_session),
) -> Page[UserRead]:
    limit, offset = page
    users, total = await list_users(session, limit, offset)
    return Page[UserRead](
        items=[UserRead.model_validate(user) for user in users],
        total=total,
        limit=limit,
        offset=offset,
    )


@users_admin_router.post(
    "/",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    payload: UserAdminCreate,
    session: AsyncSession = Depends(get_db_session),
) -> UserRead:
    # No auto-login: the administrator creates the account, the owner signs in.
    user = await create_user_admin(session, payload)
    return UserRead.model_validate(user)


@users_admin_router.patch("/{user_id}", response_model=UserRead)
async def update(
    user_id: UUID,
    payload: UserAdminUpdate,
    current_user: User = Depends(require_role("admin")),
    session: AsyncSession = Depends(get_db_session),
) -> UserRead:
    user = await update_user_admin(session, user_id, payload, current_user)
    return UserRead.model_validate(user)


@users_admin_router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    user_id: UUID,
    current_user: User = Depends(require_role("admin")),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    await delete_user_admin(session, user_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _create_token_pair(user: User) -> TokenPair:
    subject = str(user.id)
    return TokenPair(
        access_token=create_access_token(subject),
        refresh_token=create_refresh_token(subject),
    )
