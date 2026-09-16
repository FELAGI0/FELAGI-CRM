from uuid import UUID

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
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
    UserCreate,
    UserLogin,
    UserRead,
)
from app.modules.users.service import (
    authenticate_user,
    create_user,
    get_user_by_id,
)

auth_router = APIRouter(prefix="/auth", tags=["auth"])
users_router = APIRouter(prefix="/users", tags=["users"])


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


def _create_token_pair(user: User) -> TokenPair:
    subject = str(user.id)
    return TokenPair(
        access_token=create_access_token(subject),
        refresh_token=create_refresh_token(subject),
    )
