import httpx
import pytest
from tests.conftest import auth_headers

pytestmark = [
    pytest.mark.usefixtures("clean_users"),
    pytest.mark.usefixtures("seed_users"),
]

_PASSWORD = "StrongPassword123"


async def role_headers(client: httpx.AsyncClient, role: str) -> dict[str, str]:
    return await auth_headers(client, f"{role}@example.com")


async def admin_headers(client: httpx.AsyncClient) -> dict[str, str]:
    return await role_headers(client, "admin")


async def manager_headers(client: httpx.AsyncClient) -> dict[str, str]:
    return await role_headers(client, "manager")


async def user_headers(client: httpx.AsyncClient) -> dict[str, str]:
    return await role_headers(client, "user")


async def current_user_id(
    client: httpx.AsyncClient,
    headers: dict[str, str],
) -> str:
    response = await client.get("/api/v1/users/me", headers=headers)
    return response.json()["id"]


async def create_client(
    client: httpx.AsyncClient,
    headers: dict[str, str],
) -> httpx.Response:
    return await client.post(
        "/api/v1/clients/",
        json={"name": "RBAC Client"},
        headers=headers,
    )


async def create_deal(
    client: httpx.AsyncClient,
    headers: dict[str, str],
    client_id: str,
) -> httpx.Response:
    return await client.post(
        "/api/v1/deals/",
        json={"title": "RBAC Deal", "client_id": client_id},
        headers=headers,
    )


async def create_task(
    client: httpx.AsyncClient,
    headers: dict[str, str],
    deal_id: str,
    **payload: object,
) -> httpx.Response:
    return await client.post(
        "/api/v1/tasks/",
        json={"title": "RBAC Task", "deal_id": deal_id, **payload},
        headers=headers,
    )


async def deal_context(
    client: httpx.AsyncClient,
    headers: dict[str, str],
) -> tuple[dict[str, object], dict[str, object]]:
    client_response = await create_client(client, headers)
    deal_response = await create_deal(client, headers, client_response.json()["id"])
    return client_response.json(), deal_response.json()


async def task_context(
    client: httpx.AsyncClient,
    headers: dict[str, str],
    **payload: object,
) -> tuple[dict[str, object], dict[str, object], dict[str, object]]:
    client_data, deal_data = await deal_context(client, headers)
    task_response = await create_task(client, headers, deal_data["id"], **payload)
    return client_data, deal_data, task_response.json()


@pytest.mark.integration
async def test_create_client_admin_201(client: httpx.AsyncClient) -> None:
    response = await create_client(client, await admin_headers(client))
    assert response.status_code == 201


@pytest.mark.integration
async def test_create_client_manager_201(client: httpx.AsyncClient) -> None:
    response = await create_client(client, await manager_headers(client))
    assert response.status_code == 201


@pytest.mark.integration
async def test_create_client_user_403(client: httpx.AsyncClient) -> None:
    response = await create_client(client, await user_headers(client))
    assert response.status_code == 403


@pytest.mark.integration
async def test_update_client_user_403(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    created = await create_client(client, headers)
    response = await client.patch(
        f"/api/v1/clients/{created.json()['id']}",
        json={"name": "Updated"},
        headers=await user_headers(client),
    )
    assert response.status_code == 403


@pytest.mark.integration
async def test_delete_client_user_403(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    created = await create_client(client, headers)
    response = await client.delete(
        f"/api/v1/clients/{created.json()['id']}",
        headers=await user_headers(client),
    )
    assert response.status_code == 403


@pytest.mark.integration
async def test_list_clients_user_200(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/clients/", headers=await user_headers(client))
    assert response.status_code == 200


@pytest.mark.integration
async def test_get_client_user_200(client: httpx.AsyncClient) -> None:
    admin = await admin_headers(client)
    created = await create_client(client, admin)
    response = await client.get(
        f"/api/v1/clients/{created.json()['id']}",
        headers=await user_headers(client),
    )
    assert response.status_code == 200


@pytest.mark.integration
async def test_create_deal_admin_201(client: httpx.AsyncClient) -> None:
    client_data, _ = await deal_context(client, await admin_headers(client))
    response = await create_deal(client, await admin_headers(client), client_data["id"])
    assert response.status_code == 201


@pytest.mark.integration
async def test_create_deal_manager_201(client: httpx.AsyncClient) -> None:
    headers = await manager_headers(client)
    client_response = await create_client(client, headers)
    response = await create_deal(client, headers, client_response.json()["id"])
    assert response.status_code == 201


@pytest.mark.integration
async def test_create_deal_user_403(client: httpx.AsyncClient) -> None:
    admin = await admin_headers(client)
    client_response = await create_client(client, admin)
    response = await create_deal(
        client,
        await user_headers(client),
        client_response.json()["id"],
    )
    assert response.status_code == 403


@pytest.mark.integration
async def test_update_deal_user_403(client: httpx.AsyncClient) -> None:
    admin = await admin_headers(client)
    _, deal = await deal_context(client, admin)
    response = await client.patch(
        f"/api/v1/deals/{deal['id']}",
        json={"title": "Updated"},
        headers=await user_headers(client),
    )
    assert response.status_code == 403


@pytest.mark.integration
async def test_delete_deal_user_403(client: httpx.AsyncClient) -> None:
    admin = await admin_headers(client)
    _, deal = await deal_context(client, admin)
    response = await client.delete(
        f"/api/v1/deals/{deal['id']}",
        headers=await user_headers(client),
    )
    assert response.status_code == 403


@pytest.mark.integration
async def test_list_deals_user_200(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/deals/", headers=await user_headers(client))
    assert response.status_code == 200


@pytest.mark.integration
async def test_get_deal_user_200(client: httpx.AsyncClient) -> None:
    admin = await admin_headers(client)
    _, deal = await deal_context(client, admin)
    response = await client.get(
        f"/api/v1/deals/{deal['id']}",
        headers=await user_headers(client),
    )
    assert response.status_code == 200


@pytest.mark.integration
async def test_create_task_admin_any_assignee_201(client: httpx.AsyncClient) -> None:
    admin = await admin_headers(client)
    _, deal = await deal_context(client, admin)
    user_id = await current_user_id(client, await user_headers(client))
    response = await create_task(client, admin, deal["id"], assigned_to=user_id)
    assert response.status_code == 201


@pytest.mark.integration
async def test_create_task_admin_no_assignee_201(client: httpx.AsyncClient) -> None:
    _, deal, _ = await task_context(client, await admin_headers(client))
    assert deal["id"]


@pytest.mark.integration
async def test_create_task_manager_any_assignee_201(client: httpx.AsyncClient) -> None:
    manager = await manager_headers(client)
    _, deal = await deal_context(client, manager)
    user_id = await current_user_id(client, await user_headers(client))
    response = await create_task(client, manager, deal["id"], assigned_to=user_id)
    assert response.status_code == 201


@pytest.mark.integration
async def test_create_task_user_self_assignee_201(client: httpx.AsyncClient) -> None:
    user = await user_headers(client)
    user_id = await current_user_id(client, user)
    admin = await admin_headers(client)
    _, deal = await deal_context(client, admin)
    response = await create_task(client, user, deal["id"], assigned_to=user_id)
    assert response.status_code == 201


@pytest.mark.integration
async def test_create_task_user_no_assignee_auto_self_201(
    client: httpx.AsyncClient,
) -> None:
    user = await user_headers(client)
    user_id = await current_user_id(client, user)
    admin = await admin_headers(client)
    _, deal = await deal_context(client, admin)
    response = await create_task(client, user, deal["id"])
    assert response.status_code == 201
    assert response.json()["assigned_to"] == user_id


@pytest.mark.integration
async def test_create_task_user_other_assignee_403(client: httpx.AsyncClient) -> None:
    user = await user_headers(client)
    manager_id = await current_user_id(client, await manager_headers(client))
    admin = await admin_headers(client)
    _, deal = await deal_context(client, admin)
    response = await create_task(client, user, deal["id"], assigned_to=manager_id)
    assert response.status_code == 403


@pytest.mark.integration
async def test_update_task_admin_any_200(client: httpx.AsyncClient) -> None:
    admin = await admin_headers(client)
    _, _, task = await task_context(client, admin)
    response = await client.patch(
        f"/api/v1/tasks/{task['id']}",
        json={"title": "Updated"},
        headers=admin,
    )
    assert response.status_code == 200


@pytest.mark.integration
async def test_update_task_manager_any_200(client: httpx.AsyncClient) -> None:
    manager = await manager_headers(client)
    _, _, task = await task_context(client, manager)
    response = await client.patch(
        f"/api/v1/tasks/{task['id']}",
        json={"title": "Updated"},
        headers=manager,
    )
    assert response.status_code == 200


@pytest.mark.integration
async def test_update_task_user_assignee_own_200(client: httpx.AsyncClient) -> None:
    user = await user_headers(client)
    user_id = await current_user_id(client, user)
    admin = await admin_headers(client)
    _, deal = await deal_context(client, admin)
    task = await create_task(client, admin, deal["id"], assigned_to=user_id)
    response = await client.patch(
        f"/api/v1/tasks/{task.json()['id']}",
        json={"title": "Updated"},
        headers=user,
    )
    assert response.status_code == 200


@pytest.mark.integration
async def test_update_task_user_not_assignee_403(client: httpx.AsyncClient) -> None:
    admin = await admin_headers(client)
    _, _, task = await task_context(client, admin)
    response = await client.patch(
        f"/api/v1/tasks/{task['id']}",
        json={"title": "Updated"},
        headers=await user_headers(client),
    )
    assert response.status_code == 403


@pytest.mark.integration
async def test_update_task_user_cannot_reassign_403(client: httpx.AsyncClient) -> None:
    user = await user_headers(client)
    user_id = await current_user_id(client, user)
    manager_id = await current_user_id(client, await manager_headers(client))
    admin = await admin_headers(client)
    _, deal = await deal_context(client, admin)
    task = await create_task(client, admin, deal["id"], assigned_to=user_id)
    response = await client.patch(
        f"/api/v1/tasks/{task.json()['id']}",
        json={"assigned_to": manager_id},
        headers=user,
    )
    assert response.status_code == 403


@pytest.mark.integration
async def test_delete_task_admin_204(client: httpx.AsyncClient) -> None:
    admin = await admin_headers(client)
    _, _, task = await task_context(client, admin)
    response = await client.delete(f"/api/v1/tasks/{task['id']}", headers=admin)
    assert response.status_code == 204


@pytest.mark.integration
async def test_delete_task_manager_204(client: httpx.AsyncClient) -> None:
    manager = await manager_headers(client)
    _, _, task = await task_context(client, manager)
    response = await client.delete(f"/api/v1/tasks/{task['id']}", headers=manager)
    assert response.status_code == 204


@pytest.mark.integration
async def test_delete_task_user_assignee_own_204(client: httpx.AsyncClient) -> None:
    user = await user_headers(client)
    user_id = await current_user_id(client, user)
    admin = await admin_headers(client)
    _, deal = await deal_context(client, admin)
    task = await create_task(client, admin, deal["id"], assigned_to=user_id)
    response = await client.delete(
        f"/api/v1/tasks/{task.json()['id']}",
        headers=user,
    )
    assert response.status_code == 204


@pytest.mark.integration
async def test_delete_task_user_not_assignee_403(client: httpx.AsyncClient) -> None:
    admin = await admin_headers(client)
    _, _, task = await task_context(client, admin)
    response = await client.delete(
        f"/api/v1/tasks/{task['id']}",
        headers=await user_headers(client),
    )
    assert response.status_code == 403


@pytest.mark.integration
async def test_health_no_auth_200(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
