import httpx
import pytest
from tests.conftest import auth_headers

pytestmark = [
    pytest.mark.usefixtures("clean_users"),
    pytest.mark.usefixtures("seed_users"),
]

VALID_PASSWORD = "AnotherPassword123"


async def admin_headers(client: httpx.AsyncClient) -> dict[str, str]:
    return await auth_headers(client, "admin@example.com")


async def get_user_id(
    client: httpx.AsyncClient, headers: dict[str, str], email: str
) -> str:
    response = await client.get("/api/v1/users/?limit=100", headers=headers)
    return next(
        user["id"] for user in response.json()["items"] if user["email"] == email
    )


async def create_user(
    client: httpx.AsyncClient,
    headers: dict[str, str],
    **overrides: object,
) -> httpx.Response:
    body = {
        "email": "newuser@example.com",
        "password": VALID_PASSWORD,
        "role": "manager",
        **overrides,
    }
    return await client.post("/api/v1/users/", json=body, headers=headers)


# --------------------------------------------------------------------------- #
# GET /users/
# --------------------------------------------------------------------------- #


@pytest.mark.integration
async def test_list_users_as_admin(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/users/", headers=await admin_headers(client))

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 3
    assert {user["email"] for user in body["items"]} == {
        "admin@example.com",
        "manager@example.com",
        "user@example.com",
    }


@pytest.mark.integration
async def test_list_users_never_exposes_password(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/users/", headers=await admin_headers(client))

    assert "hashed_password" not in response.text
    assert "password" not in response.text


@pytest.mark.integration
@pytest.mark.parametrize("email", ["manager@example.com", "user@example.com"])
async def test_list_users_forbidden_for_non_admin(
    client: httpx.AsyncClient, email: str
) -> None:
    response = await client.get(
        "/api/v1/users/", headers=await auth_headers(client, email)
    )

    assert response.status_code == 403


@pytest.mark.integration
async def test_list_users_requires_authentication(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/users/")

    assert response.status_code == 401


@pytest.mark.integration
async def test_list_users_pagination_and_order(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)

    first_page = await client.get("/api/v1/users/?limit=2&offset=0", headers=headers)
    second_page = await client.get("/api/v1/users/?limit=2&offset=2", headers=headers)

    assert first_page.status_code == 200
    assert first_page.json()["total"] == 3
    assert len(first_page.json()["items"]) == 2
    assert len(second_page.json()["items"]) == 1

    # Pages must partition the collection: no row repeated, none skipped. This is
    # the property that matters, because users seeded in one transaction share a
    # `created_at` and only the `id` tiebreaker makes the order deterministic.
    first_ids = [user["id"] for user in first_page.json()["items"]]
    second_ids = [user["id"] for user in second_page.json()["items"]]
    assert set(first_ids).isdisjoint(second_ids)
    assert len(first_ids) + len(second_ids) == 3


@pytest.mark.integration
async def test_list_users_order_is_stable_across_requests(
    client: httpx.AsyncClient,
) -> None:
    headers = await admin_headers(client)

    first = await client.get("/api/v1/users/?limit=3", headers=headers)
    second = await client.get("/api/v1/users/?limit=3", headers=headers)

    assert [user["id"] for user in first.json()["items"]] == [
        user["id"] for user in second.json()["items"]
    ]


# --------------------------------------------------------------------------- #
# POST /users/
# --------------------------------------------------------------------------- #


@pytest.mark.integration
async def test_create_user_as_admin(client: httpx.AsyncClient) -> None:
    response = await create_user(client, await admin_headers(client))

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "newuser@example.com"
    assert body["role"] == "manager"
    assert body["is_active"] is True
    assert "password" not in response.text
    assert "access_token" not in response.text


@pytest.mark.integration
async def test_create_user_defaults_to_user_role(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)

    response = await client.post(
        "/api/v1/users/",
        json={"email": "norole@example.com", "password": VALID_PASSWORD},
        headers=headers,
    )

    assert response.status_code == 201
    assert response.json()["role"] == "user"


@pytest.mark.integration
async def test_create_user_duplicate_email(client: httpx.AsyncClient) -> None:
    response = await create_user(
        client,
        await admin_headers(client),
        email="admin@example.com",
    )

    assert response.status_code == 409


@pytest.mark.integration
async def test_create_user_normalizes_email(client: httpx.AsyncClient) -> None:
    response = await create_user(
        client,
        await admin_headers(client),
        email="MixedCase@Example.com",
    )

    assert response.status_code == 201
    assert response.json()["email"] == "mixedcase@example.com"


@pytest.mark.integration
async def test_create_user_short_password(client: httpx.AsyncClient) -> None:
    response = await create_user(client, await admin_headers(client), password="Sh0rt")

    assert response.status_code == 422


@pytest.mark.integration
async def test_create_user_password_without_digit(client: httpx.AsyncClient) -> None:
    response = await create_user(
        client,
        await admin_headers(client),
        password="NoDigitsInThisPassword",
    )

    assert response.status_code == 422


@pytest.mark.integration
async def test_create_user_invalid_role(client: httpx.AsyncClient) -> None:
    response = await create_user(client, await admin_headers(client), role="superuser")

    assert response.status_code == 422


@pytest.mark.integration
@pytest.mark.parametrize("email", ["manager@example.com", "user@example.com"])
async def test_create_user_forbidden_for_non_admin(
    client: httpx.AsyncClient, email: str
) -> None:
    response = await create_user(client, await auth_headers(client, email))

    assert response.status_code == 403


@pytest.mark.integration
async def test_created_user_can_log_in(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    await create_user(client, headers)

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "newuser@example.com", "password": VALID_PASSWORD},
    )

    assert login.status_code == 200
    assert "access_token" in login.json()


# --------------------------------------------------------------------------- #
# PATCH /users/{id}
# --------------------------------------------------------------------------- #


@pytest.mark.integration
async def test_update_user_role(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    target = await get_user_id(client, headers, "user@example.com")

    response = await client.patch(
        f"/api/v1/users/{target}", json={"role": "manager"}, headers=headers
    )

    assert response.status_code == 200
    assert response.json()["role"] == "manager"


@pytest.mark.integration
async def test_update_user_is_active(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    target = await get_user_id(client, headers, "user@example.com")

    response = await client.patch(
        f"/api/v1/users/{target}", json={"is_active": False}, headers=headers
    )

    assert response.status_code == 200
    assert response.json()["is_active"] is False


@pytest.mark.integration
async def test_blocked_user_cannot_log_in(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    target = await get_user_id(client, headers, "user@example.com")
    await client.patch(
        f"/api/v1/users/{target}", json={"is_active": False}, headers=headers
    )

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "user@example.com", "password": "StrongPassword123"},
    )

    assert login.status_code == 401


@pytest.mark.integration
async def test_update_own_role_forbidden(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    own_id = await get_user_id(client, headers, "admin@example.com")

    response = await client.patch(
        f"/api/v1/users/{own_id}", json={"role": "user"}, headers=headers
    )

    assert response.status_code == 403


@pytest.mark.integration
async def test_update_own_active_status_forbidden(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    own_id = await get_user_id(client, headers, "admin@example.com")

    response = await client.patch(
        f"/api/v1/users/{own_id}", json={"is_active": False}, headers=headers
    )

    assert response.status_code == 403


@pytest.mark.integration
async def test_update_user_invalid_role(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    target = await get_user_id(client, headers, "user@example.com")

    response = await client.patch(
        f"/api/v1/users/{target}", json={"role": "superuser"}, headers=headers
    )

    assert response.status_code == 422


@pytest.mark.integration
async def test_update_user_empty_payload(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    target = await get_user_id(client, headers, "user@example.com")

    response = await client.patch(f"/api/v1/users/{target}", json={}, headers=headers)

    assert response.status_code == 422


@pytest.mark.integration
async def test_update_user_not_found(client: httpx.AsyncClient) -> None:
    response = await client.patch(
        "/api/v1/users/11111111-1111-4111-8111-111111111111",
        json={"role": "manager"},
        headers=await admin_headers(client),
    )

    assert response.status_code == 404


@pytest.mark.integration
async def test_update_user_forbidden_for_manager(client: httpx.AsyncClient) -> None:
    admin = await admin_headers(client)
    target = await get_user_id(client, admin, "user@example.com")

    response = await client.patch(
        f"/api/v1/users/{target}",
        json={"role": "manager"},
        headers=await auth_headers(client, "manager@example.com"),
    )

    assert response.status_code == 403


# --------------------------------------------------------------------------- #
# DELETE /users/{id}
# --------------------------------------------------------------------------- #


@pytest.mark.integration
async def test_delete_user(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    target = await get_user_id(client, headers, "user@example.com")

    response = await client.delete(f"/api/v1/users/{target}", headers=headers)

    assert response.status_code == 204
    remaining = await client.get("/api/v1/users/", headers=headers)
    assert remaining.json()["total"] == 2


@pytest.mark.integration
async def test_delete_self_forbidden(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    own_id = await get_user_id(client, headers, "admin@example.com")

    response = await client.delete(f"/api/v1/users/{own_id}", headers=headers)

    assert response.status_code == 403


@pytest.mark.integration
async def test_delete_user_with_related_records_conflict(
    client: httpx.AsyncClient,
) -> None:
    headers = await admin_headers(client)
    target = await get_user_id(client, headers, "manager@example.com")

    # The manager authors a client; created_by is RESTRICT, so deletion must fail.
    created = await client.post(
        "/api/v1/clients/",
        json={"name": "Owned by manager"},
        headers=await auth_headers(client, "manager@example.com"),
    )
    assert created.status_code == 201

    response = await client.delete(f"/api/v1/users/{target}", headers=headers)

    assert response.status_code == 409
    assert response.json()["detail"] == "User has related records"


@pytest.mark.integration
async def test_delete_user_not_found(client: httpx.AsyncClient) -> None:
    response = await client.delete(
        "/api/v1/users/11111111-1111-4111-8111-111111111111",
        headers=await admin_headers(client),
    )

    assert response.status_code == 404


@pytest.mark.integration
async def test_delete_user_forbidden_for_manager(client: httpx.AsyncClient) -> None:
    admin = await admin_headers(client)
    target = await get_user_id(client, admin, "user@example.com")

    response = await client.delete(
        f"/api/v1/users/{target}",
        headers=await auth_headers(client, "manager@example.com"),
    )

    assert response.status_code == 403


# --------------------------------------------------------------------------- #
# /users/me must keep working alongside the admin router
# --------------------------------------------------------------------------- #


@pytest.mark.integration
async def test_users_me_still_resolves(client: httpx.AsyncClient) -> None:
    """`/users/me` must not be captured by the admin `/users/{id}` routes."""
    response = await client.get(
        "/api/v1/users/me", headers=await auth_headers(client, "user@example.com")
    )

    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"


@pytest.mark.integration
async def test_admin_router_does_not_shadow_me(client: httpx.AsyncClient) -> None:
    """A plain user still reaches /users/me while /users/ is admin-only."""
    headers = await auth_headers(client, "user@example.com")

    me = await client.get("/api/v1/users/me", headers=headers)
    collection = await client.get("/api/v1/users/", headers=headers)

    assert me.status_code == 200
    assert collection.status_code == 403
