from collections.abc import AsyncIterator
from urllib.parse import quote_plus

from fastapi import Request
from sqlalchemy import URL
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import Settings


def create_database_url(settings: Settings) -> str:
    if settings.database_url:
        return settings.database_url

    password = settings.postgres_password
    if password is None:
        raise ValueError("postgres_password is required when database_url is not set")

    return str(
        URL.create(
            drivername="postgresql+asyncpg",
            username=settings.postgres_user,
            password=quote_plus(password.get_secret_value()),
            host=settings.postgres_host,
            port=settings.postgres_port,
            database=settings.postgres_db,
        )
    )


def create_database_engine(settings: Settings) -> AsyncEngine:
    connect_args = {"ssl": settings.postgres_ssl} if settings.postgres_ssl else {}
    return create_async_engine(
        create_database_url(settings),
        echo=settings.debug,
        pool_pre_ping=True,
        connect_args=connect_args,
    )


async def get_db_session(request: Request) -> AsyncIterator[AsyncSession]:
    session_factory: async_sessionmaker[AsyncSession] = (
        request.app.state.session_factory
    )
    async with session_factory() as session:
        yield session
