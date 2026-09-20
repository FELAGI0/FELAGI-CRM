from uuid import UUID

from sqlalchemy import exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    NotFoundError,
)
from app.core.security import hash_password, verify_password
from app.modules.clients.model import Client
from app.modules.deals.model import Deal
from app.modules.tasks.model import Task
from app.modules.users.model import User
from app.modules.users.schemas import (
    UserAdminCreate,
    UserAdminUpdate,
    UserCreate,
    UserLogin,
)


async def create_user(session: AsyncSession, payload: UserCreate) -> User:
    email = payload.email.lower()
    if await _get_user_by_email_or_none(session, email) is not None:
        raise ConflictError("Email already registered")

    user = User(
        email=email,
        hashed_password=hash_password(payload.password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def create_user_admin(session: AsyncSession, payload: UserAdminCreate) -> User:
    """Create a user with an explicit role. Administrators only."""
    email = payload.email.lower()
    if await _get_user_by_email_or_none(session, email) is not None:
        raise ConflictError("Email already registered")

    user = User(
        email=email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def list_users(
    session: AsyncSession,
    limit: int,
    offset: int,
) -> tuple[list[User], int]:
    total = await session.scalar(select(func.count()).select_from(User))
    # `created_at` defaults to `func.now()`, which is the transaction timestamp in
    # PostgreSQL, so rows created together share an identical value. Ordering by
    # `id` as well makes the order total, which keeps offset pagination from
    # repeating or skipping rows across pages.
    result = await session.execute(
        select(User)
        .order_by(User.created_at.desc(), User.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars()), total or 0


async def update_user_admin(
    session: AsyncSession,
    user_id: UUID,
    payload: UserAdminUpdate,
    current_user: User,
) -> User:
    """
    Change another user's role or active flag.

    An administrator may not modify their own role or active state: doing so
    could lock them out of the very endpoint that would undo it, so the request
    is refused outright rather than silently ignored.
    """
    if user_id == current_user.id:
        raise AuthorizationError("Cannot modify own role or active status")

    user = await get_user_by_id(session, user_id)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    await session.commit()
    await session.refresh(user)
    return user


async def delete_user_admin(
    session: AsyncSession,
    user_id: UUID,
    current_user: User,
) -> None:
    """
    Remove a user.

    The `created_by` foreign keys on clients, deals and tasks are RESTRICT, so a
    user who authored any record cannot be deleted without orphaning it. That is
    reported as a 409 rather than surfaced as a database error.
    """
    if user_id == current_user.id:
        raise AuthorizationError("Cannot delete own account")

    user = await get_user_by_id(session, user_id)

    has_records = await session.scalar(
        select(
            or_(
                exists().where(Client.created_by == user_id),
                exists().where(Deal.created_by == user_id),
                exists().where(Task.created_by == user_id),
            )
        )
    )
    if has_records:
        raise ConflictError("User has related records")

    await session.delete(user)
    await session.commit()


async def get_user_by_email(session: AsyncSession, email: str) -> User:
    user = await _get_user_by_email_or_none(session, email.lower())
    if user is None:
        raise NotFoundError("User not found")
    return user


async def get_user_by_id(session: AsyncSession, user_id: UUID) -> User:
    user = await session.get(User, user_id)
    if user is None:
        raise NotFoundError("User not found")
    return user


async def authenticate_user(session: AsyncSession, payload: UserLogin) -> User:
    user = await _get_user_by_email_or_none(session, payload.email.lower())
    if (
        user is None
        or not user.is_active
        or not verify_password(payload.password, user.hashed_password)
    ):
        raise AuthenticationError("Invalid credentials")
    return user


async def _get_user_by_email_or_none(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()
