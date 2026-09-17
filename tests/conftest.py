import os
import subprocess
import sys
from collections.abc import AsyncIterator, Iterator

import httpx
import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from testcontainers.community.postgres import PostgresContainer

from app.core.config import Settings
from app.core.rate_limit import limiter
from app.core.security import hash_password
from app.factory import create_app
from app.modules.users.model import User

_PASSWORD = "StrongPassword123"


@pytest.fixture(scope="session")
def postgres_container() -> Iterator[PostgresContainer]:
    with PostgresContainer("postgres:16-alpine") as container:
        yield container


@pytest.fixture(scope="session")
def test_settings(postgres_container: PostgresContainer) -> Settings:
    database_url = postgres_container.get_connection_url().replace(
        "postgresql+psycopg2", "postgresql+asyncpg"
    )
    return Settings.model_validate(
        {
            "database_url": database_url,
            "jwt_secret_key": "test-secret-key-at-least-32-characters",
        }
    )


@pytest.fixture(scope="session", autouse=True)
def apply_migrations(test_settings: Settings) -> None:
    environment = os.environ | {
        "DATABASE_URL": test_settings.database_url or "",
        "JWT_SECRET_KEY": test_settings.jwt_secret_key.get_secret_value(),
        "POSTGRES_SSL": "false",
    }
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        check=True,
        env=environment,
    )


@pytest.fixture(scope="session")
def app(test_settings: Settings):
    return create_app(settings_override=test_settings)


@pytest.fixture(scope="session")
def session_factory(app) -> async_sessionmaker[AsyncSession]:
    return app.state.session_factory


@pytest.fixture
async def clean_users(
    session_factory: async_sessionmaker[AsyncSession],
) -> AsyncIterator[None]:
    async with session_factory() as session:
        await session.execute(text("TRUNCATE tasks, deals, clients, users CASCADE"))
        await session.commit()
    limiter.reset()
    yield
    async with session_factory() as session:
        await session.execute(text("TRUNCATE tasks, deals, clients, users CASCADE"))
        await session.commit()
    limiter.reset()


@pytest.fixture
async def seed_users(
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        session.add_all(
            [
                User(
                    email="admin@example.com",
                    hashed_password=hash_password(_PASSWORD),
                    role="admin",
                ),
                User(
                    email="manager@example.com",
                    hashed_password=hash_password(_PASSWORD),
                    role="manager",
                ),
                User(
                    email="user@example.com",
                    hashed_password=hash_password(_PASSWORD),
                    role="user",
                ),
            ]
        )
        await session.commit()


@pytest.fixture
async def db_session(
    session_factory: async_sessionmaker[AsyncSession],
) -> AsyncIterator[AsyncSession]:
    async with session_factory() as session:
        yield session


@pytest.fixture
async def client(app) -> AsyncIterator[httpx.AsyncClient]:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://testserver",
    ) as test_client:
        yield test_client


async def auth_headers(client: httpx.AsyncClient, email: str) -> dict[str, str]:
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": _PASSWORD},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
