import httpx
import pytest

from tests.conftest import auth_headers

pytestmark = [
    pytest.mark.usefixtures("clean_users"),
    pytest.mark.usefixtures("seed_users"),
]

PASSWORD = "StrongPassword123"
NEW_PASSWORD = "BrandNewPassword456"


async def user_headers(client: httpx.AsyncClient, email: str = "user@example.com") -> dict[str, str]:
    return await auth_headers(client, email)


async def get_me(client: httpx.AsyncClient, headers: dict[str, str]) -> dict[str, object]:
    response = await client.get("/api/v1/users/me", headers=headers)
    return response.json()


# --------------------------------------------------------------------------- #
# PATCH /users/me
# --------------------------------------------------------------------------- #


@pytest.mark.integration
async def test_patch_me_sets_name(client: httpx.AsyncClient) -> None:
    headers = await user_headers(client)

    response = await client.patch("/api/v1/users/me", json={"name": "Иван Петров"}, headers=headers)

    assert response.status_code == 200
    assert response.json()["name"] == "Иван Петров"
    # The name survives a fresh read of the same account.
    assert (await get_me(client, headers))["name"] == "Иван Петров"


@pytest.mark.integration
async def test_patch_me_changes_email(client: httpx.AsyncClient) -> None:
    headers = await user_headers(client)

    response = await client.patch(
        "/api/v1/users/me", json={"email": "Moved@Example.com"}, headers=headers
    )

    assert response.status_code == 200
    assert response.json()["email"] == "moved@example.com"


@pytest.mark.integration
async def test_patch_me_can_change_both_fields(client: httpx.AsyncClient) -> None:
    headers = await user_headers(client)

    response = await client.patch(
        "/api/v1/users/me",
        json={"name": "Пётр", "email": "both@example.com"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json() == {
        **response.json(),
        "name": "Пётр",
        "email": "both@example.com",
    }


@pytest.mark.integration
async def test_patch_me_email_taken_by_another(client: httpx.AsyncClient) -> None:
    response = await client.patch(
        "/api/v1/users/me",
        json={"email": "admin@example.com"},
        headers=await user_headers(client),
    )

    assert response.status_code == 409


@pytest.mark.integration
async def test_patch_me_keeping_own_email_is_allowed(client: httpx.AsyncClient) -> None:
    """Re-submitting the unchanged email must not trip the uniqueness check."""
    response = await client.patch(
        "/api/v1/users/me",
        json={"email": "user@example.com", "name": "Same email"},
        headers=await user_headers(client),
    )

    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"


@pytest.mark.integration
async def test_patch_me_empty_payload(client: httpx.AsyncClient) -> None:
    response = await client.patch("/api/v1/users/me", json={}, headers=await user_headers(client))

    assert response.status_code == 422


@pytest.mark.integration
async def test_patch_me_invalid_email(client: httpx.AsyncClient) -> None:
    response = await client.patch(
        "/api/v1/users/me", json={"email": "not-an-email"}, headers=await user_headers(client)
    )

    assert response.status_code == 422


@pytest.mark.integration
async def test_patch_me_blank_name_rejected(client: httpx.AsyncClient) -> None:
    response = await client.patch(
        "/api/v1/users/me", json={"name": "   "}, headers=await user_headers(client)
    )

    assert response.status_code == 422


@pytest.mark.integration
async def test_patch_me_requires_authentication(client: httpx.AsyncClient) -> None:
    response = await client.patch("/api/v1/users/me", json={"name": "Anon"})

    assert response.status_code == 401


@pytest.mark.integration
async def test_patch_me_cannot_change_role_or_active(client: httpx.AsyncClient) -> None:
    """Privilege fields are not part of the self-service payload."""
    headers = await user_headers(client)

    response = await client.patch(
        "/api/v1/users/me", json={"role": "admin"}, headers=headers
    )

    # `role` is not a field of UserUpdateMe, so the payload has no usable field.
    assert response.status_code == 422
    assert (await get_me(client, headers))["role"] == "user"


@pytest.mark.integration
async def test_login_works_with_a_new_email(client: httpx.AsyncClient) -> None:
    headers = await user_headers(client)
    await client.patch("/api/v1/users/me", json={"email": "newmail@example.com"}, headers=headers)

    # The old address no longer resolves.
    old = await client.post(
        "/api/v1/auth/login", json={"email": "user@example.com", "password": PASSWORD}
    )
    new = await client.post(
        "/api/v1/auth/login", json={"email": "newmail@example.com", "password": PASSWORD}
    )

    assert old.status_code == 401
    assert new.status_code == 200


# --------------------------------------------------------------------------- #
# POST /users/me/change-password
# --------------------------------------------------------------------------- #


@pytest.mark.integration
async def test_change_password_success(client: httpx.AsyncClient) -> None:
    response = await client.post(
        "/api/v1/users/me/change-password",
        json={"current_password": PASSWORD, "new_password": NEW_PASSWORD},
        headers=await user_headers(client),
    )

    assert response.status_code == 204


@pytest.mark.integration
async def test_change_password_swaps_old_for_new(client: httpx.AsyncClient) -> None:
    headers = await user_headers(client)
    changed = await client.post(
        "/api/v1/users/me/change-password",
        json={"current_password": PASSWORD, "new_password": NEW_PASSWORD},
        headers=headers,
    )
    assert changed.status_code == 204

    old = await client.post(
        "/api/v1/auth/login", json={"email": "user@example.com", "password": PASSWORD}
    )
    new = await client.post(
        "/api/v1/auth/login", json={"email": "user@example.com", "password": NEW_PASSWORD}
    )

    assert old.status_code == 401
    assert new.status_code == 200


@pytest.mark.integration
async def test_change_password_wrong_current(client: httpx.AsyncClient) -> None:
    response = await client.post(
        "/api/v1/users/me/change-password",
        json={"current_password": "WrongPassword123", "new_password": NEW_PASSWORD},
        headers=await user_headers(client),
    )

    assert response.status_code == 401


@pytest.mark.integration
async def test_change_password_unchanged_after_wrong_current(client: httpx.AsyncClient) -> None:
    headers = await user_headers(client)
    await client.post(
        "/api/v1/users/me/change-password",
        json={"current_password": "WrongPassword123", "new_password": NEW_PASSWORD},
        headers=headers,
    )

    login = await client.post(
        "/api/v1/auth/login", json={"email": "user@example.com", "password": PASSWORD}
    )

    assert login.status_code == 200


@pytest.mark.integration
async def test_change_password_too_short(client: httpx.AsyncClient) -> None:
    response = await client.post(
        "/api/v1/users/me/change-password",
        json={"current_password": PASSWORD, "new_password": "Sh0rt"},
        headers=await user_headers(client),
    )

    assert response.status_code == 422


@pytest.mark.integration
async def test_change_password_without_digit(client: httpx.AsyncClient) -> None:
    response = await client.post(
        "/api/v1/users/me/change-password",
        json={"current_password": PASSWORD, "new_password": "NoDigitsInThisPassword"},
        headers=await user_headers(client),
    )

    assert response.status_code == 422


@pytest.mark.integration
async def test_change_password_requires_authentication(client: httpx.AsyncClient) -> None:
    response = await client.post(
        "/api/v1/users/me/change-password",
        json={"current_password": PASSWORD, "new_password": NEW_PASSWORD},
    )

    assert response.status_code == 401


# --------------------------------------------------------------------------- #
# Route shadowing: /users/me versus the admin /users/{user_id}
# --------------------------------------------------------------------------- #


@pytest.mark.integration
async def test_me_routes_are_not_shadowed_by_admin_routes(client: httpx.AsyncClient) -> None:
    """
    `/users/me` must keep resolving for a plain user even though the admin
    router declares `/users/{user_id}`. FastAPI matches in registration order,
    so this guards the ordering of the two routers.
    """
    headers = await user_headers(client)

    me = await client.get("/api/v1/users/me", headers=headers)
    patch = await client.patch("/api/v1/users/me", json={"name": "Ordered"}, headers=headers)
    password = await client.post(
        "/api/v1/users/me/change-password",
        json={"current_password": PASSWORD, "new_password": NEW_PASSWORD},
        headers=headers,
    )

    assert me.status_code == 200
    assert patch.status_code == 200
    assert password.status_code == 204

    # The admin collection route stays admin-only for the same caller.
    collection = await client.get("/api/v1/users/", headers=headers)
    assert collection.status_code == 403


@pytest.mark.integration
async def test_admin_can_also_use_me_routes(client: httpx.AsyncClient) -> None:
    headers = await auth_headers(client, "admin@example.com")

    response = await client.patch("/api/v1/users/me", json={"name": "Админ"}, headers=headers)

    assert response.status_code == 200
    assert response.json()["name"] == "Админ"


@pytest.mark.integration
async def test_name_defaults_to_null(client: httpx.AsyncClient) -> None:
    """Accounts predating the column read back as null rather than an error."""
    response = await client.get("/api/v1/users/me", headers=await user_headers(client))

    assert response.status_code == 200
    assert response.json()["name"] is None