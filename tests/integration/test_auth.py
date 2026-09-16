import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.model import User

_PASSWORD = "StrongPassword123"
pytestmark = pytest.mark.usefixtures("clean_users")


async def register_user(
    client: httpx.AsyncClient,
    email: str = "user@example.com",
) -> httpx.Response:
    return await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": _PASSWORD},
    )


async def login_user(
    client: httpx.AsyncClient,
    email: str = "user@example.com",
) -> httpx.Response:
    return await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": _PASSWORD},
    )


@pytest.mark.integration
async def test_register_success(client: httpx.AsyncClient) -> None:
    response = await register_user(client, "Demo@Example.com")

    assert response.status_code == 201
    assert response.json()["email"] == "demo@example.com"
    assert "hashed_password" not in response.json()


@pytest.mark.integration
async def test_register_duplicate_email(client: httpx.AsyncClient) -> None:
    await register_user(client)

    response = await register_user(client)

    assert response.status_code == 409


@pytest.mark.integration
async def test_register_duplicate_email_different_case(
    client: httpx.AsyncClient,
) -> None:
    await register_user(client, "demo@example.com")
    response = await register_user(client, "Demo@Example.com")

    assert response.status_code == 409


@pytest.mark.integration
async def test_login_success(client: httpx.AsyncClient) -> None:
    await register_user(client)

    response = await login_user(client)

    assert response.status_code == 200
    assert response.json()["access_token"]
    assert response.json()["refresh_token"]
    assert response.json()["token_type"] == "bearer"


@pytest.mark.integration
async def test_login_wrong_password(client: httpx.AsyncClient) -> None:
    await register_user(client)

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "user@example.com", "password": "WrongPassword123"},
    )

    assert response.status_code == 401


@pytest.mark.integration
async def test_login_nonexistent_email(client: httpx.AsyncClient) -> None:
    response = await login_user(client, "missing@example.com")

    assert response.status_code == 401


@pytest.mark.integration
async def test_refresh_success(client: httpx.AsyncClient) -> None:
    await register_user(client)
    login_response = await login_user(client)

    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": login_response.json()["refresh_token"]},
    )

    assert response.status_code == 200
    assert response.json()["access_token"]
    assert response.json()["refresh_token"]


@pytest.mark.integration
async def test_refresh_with_access_token(client: httpx.AsyncClient) -> None:
    await register_user(client)
    login_response = await login_user(client)

    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": login_response.json()["access_token"]},
    )

    assert response.status_code == 401


@pytest.mark.integration
async def test_access_with_refresh_token_on_me(client: httpx.AsyncClient) -> None:
    await register_user(client)
    login_response = await login_user(client)

    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {login_response.json()['refresh_token']}"},
    )

    assert response.status_code == 401


@pytest.mark.integration
async def test_me_without_token(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/users/me")

    assert response.status_code == 401


@pytest.mark.integration
async def test_me_success(client: httpx.AsyncClient) -> None:
    await register_user(client)
    login_response = await login_user(client)

    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {login_response.json()['access_token']}"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"


@pytest.mark.integration
async def test_inactive_user_cannot_login(
    client: httpx.AsyncClient,
    db_session: AsyncSession,
) -> None:
    await register_user(client)

    from sqlalchemy import update

    await db_session.execute(
        update(User).where(User.email == "user@example.com").values(is_active=False)
    )
    await db_session.commit()

    response = await login_user(client)

    assert response.status_code == 401


@pytest.mark.integration
async def test_rate_limit_register(client: httpx.AsyncClient) -> None:
    for index in range(5):
        response = await register_user(client, f"user{index}@example.com")
        assert response.status_code == 201

    response = await register_user(client, "blocked@example.com")

    assert response.status_code == 429


@pytest.mark.integration
async def test_rate_limit_login(client: httpx.AsyncClient) -> None:
    await register_user(client)
    for _ in range(5):
        response = await login_user(client)
        assert response.status_code == 200

    response = await login_user(client)

    assert response.status_code == 429
