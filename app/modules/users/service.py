from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationError, ConflictError, NotFoundError
from app.core.security import hash_password, verify_password
from app.modules.users.model import User
from app.modules.users.schemas import UserCreate, UserLogin


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
