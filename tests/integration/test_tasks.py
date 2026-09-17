from uuid import uuid4

import httpx
import pytest
from tests.conftest import auth_headers

pytestmark = [
    pytest.mark.usefixtures("clean_users"),
    pytest.mark.usefixtures("seed_users"),
]


async def admin_headers(client: httpx.AsyncClient) -> dict[str, str]:
    return await auth_headers(client, "admin@example.com")


async def manager_headers(client: httpx.AsyncClient) -> dict[str, str]:
    return await auth_headers(client, "manager@example.com")


async def create_client(
    client: httpx.AsyncClient,
    headers: dict[str, str],
) -> httpx.Response:
    return await client.post(
        "/api/v1/clients/",
        json={"name": "Task Client"},
        headers=headers,
    )


async def create_deal(
    client: httpx.AsyncClient,
    headers: dict[str, str],
    client_id: str,
) -> httpx.Response:
    return await client.post(
        "/api/v1/deals/",
        json={"title": "Task Deal", "client_id": client_id},
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
        json={"title": "Test Task", "deal_id": deal_id, **payload},
        headers=headers,
    )


async def task_context(
    client: httpx.AsyncClient,
    headers: dict[str, str],
) -> tuple[dict[str, object], dict[str, object]]:
    client_response = await create_client(client, headers)
    deal_response = await create_deal(client, headers, client_response.json()["id"])
    return client_response.json(), deal_response.json()


@pytest.mark.integration
async def test_create_task_success(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, deal = await task_context(client, headers)

    response = await create_task(client, headers, deal["id"])

    assert response.status_code == 201
    assert response.json()["title"] == "Test Task"
    assert response.json()["deal_id"] == deal["id"]
    assert response.json()["created_by"]


@pytest.mark.integration
async def test_create_task_as_manager(client: httpx.AsyncClient) -> None:
    headers = await manager_headers(client)
    _, deal = await task_context(client, headers)

    response = await create_task(client, headers, deal["id"])

    assert response.status_code == 201


@pytest.mark.integration
async def test_create_task_with_assignee(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, deal = await task_context(client, headers)
    user_headers = await auth_headers(client, "user@example.com")
    user_response = await client.get("/api/v1/users/me", headers=user_headers)

    response = await create_task(
        client,
        headers,
        deal["id"],
        assigned_to=user_response.json()["id"],
    )

    assert response.status_code == 201
    assert response.json()["assigned_to"] == user_response.json()["id"]


@pytest.mark.integration
async def test_create_task_without_assignee(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, deal = await task_context(client, headers)

    response = await create_task(client, headers, deal["id"])

    assert response.status_code == 201
    assert response.json()["assigned_to"] is None


@pytest.mark.integration
async def test_create_task_nonexistent_deal_404(client: httpx.AsyncClient) -> None:
    response = await create_task(client, await admin_headers(client), str(uuid4()))

    assert response.status_code == 404


@pytest.mark.integration
async def test_create_task_nonexistent_assignee_404(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, deal = await task_context(client, headers)

    response = await create_task(client, headers, deal["id"], assigned_to=str(uuid4()))

    assert response.status_code == 404


@pytest.mark.integration
async def test_create_task_invalid_status_422(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, deal = await task_context(client, headers)

    response = await create_task(client, headers, deal["id"], status="invalid")

    assert response.status_code == 422


@pytest.mark.integration
async def test_create_task_naive_due_date_422(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, deal = await task_context(client, headers)

    response = await create_task(
        client,
        headers,
        deal["id"],
        due_date="2026-01-01T00:00:00",
    )

    assert response.status_code == 422


@pytest.mark.integration
async def test_get_task_by_id(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, deal = await task_context(client, headers)
    created = await create_task(client, headers, deal["id"])

    response = await client.get(
        f"/api/v1/tasks/{created.json()['id']}",
        headers=headers,
    )

    assert response.status_code == 200


@pytest.mark.integration
async def test_get_task_404(client: httpx.AsyncClient) -> None:
    response = await client.get(
        f"/api/v1/tasks/{uuid4()}",
        headers=await admin_headers(client),
    )

    assert response.status_code == 404


@pytest.mark.integration
async def test_list_tasks_empty(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/tasks/", headers=await admin_headers(client))

    assert response.status_code == 200
    assert response.json()["total"] == 0


@pytest.mark.integration
async def test_list_tasks_pagination(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, deal = await task_context(client, headers)
    for _ in range(3):
        await create_task(client, headers, deal["id"])

    response = await client.get("/api/v1/tasks/?limit=2", headers=headers)

    assert response.status_code == 200
    assert len(response.json()["items"]) == 2
    assert response.json()["total"] == 3


@pytest.mark.integration
async def test_list_tasks_filter_by_status(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, deal = await task_context(client, headers)
    await create_task(client, headers, deal["id"], status="done")
    await create_task(client, headers, deal["id"])

    response = await client.get("/api/v1/tasks/?status=done", headers=headers)

    assert response.status_code == 200
    assert response.json()["total"] == 1


@pytest.mark.integration
async def test_list_tasks_filter_by_assigned_to(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, deal = await task_context(client, headers)
    created = await create_task(client, headers, deal["id"])
    assigned_to = created.json()["created_by"]
    await create_task(client, headers, deal["id"], assigned_to=assigned_to)

    response = await client.get(
        f"/api/v1/tasks/?assigned_to={assigned_to}",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1


@pytest.mark.integration
async def test_list_tasks_filter_by_deal_id(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, deal = await task_context(client, headers)
    await create_task(client, headers, deal["id"])

    response = await client.get(
        f"/api/v1/tasks/?deal_id={deal['id']}",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1


@pytest.mark.integration
async def test_list_tasks_combined_filters(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, deal = await task_context(client, headers)
    await create_task(client, headers, deal["id"], status="done")
    await create_task(client, headers, deal["id"], status="todo")

    response = await client.get(
        f"/api/v1/tasks/?status=done&deal_id={deal['id']}",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1


@pytest.mark.integration
async def test_update_task_title(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, deal = await task_context(client, headers)
    created = await create_task(client, headers, deal["id"])

    response = await client.patch(
        f"/api/v1/tasks/{created.json()['id']}",
        json={"title": "Updated Task"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Updated Task"


@pytest.mark.integration
async def test_update_task_status(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, deal = await task_context(client, headers)
    created = await create_task(client, headers, deal["id"])

    response = await client.patch(
        f"/api/v1/tasks/{created.json()['id']}",
        json={"status": "done"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "done"


@pytest.mark.integration
async def test_update_task_assigned_to(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, deal = await task_context(client, headers)
    created = await create_task(client, headers, deal["id"])

    response = await client.patch(
        f"/api/v1/tasks/{created.json()['id']}",
        json={"assigned_to": created.json()["created_by"]},
        headers=headers,
    )

    assert response.status_code == 200


@pytest.mark.integration
async def test_update_task_deal_id(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, first_deal = await task_context(client, headers)
    second_client, second_deal = await task_context(client, headers)
    del second_client
    created = await create_task(client, headers, first_deal["id"])

    response = await client.patch(
        f"/api/v1/tasks/{created.json()['id']}",
        json={"deal_id": second_deal["id"]},
        headers=headers,
    )

    assert response.status_code == 200


@pytest.mark.integration
async def test_update_task_nonexistent_deal_404(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, deal = await task_context(client, headers)
    created = await create_task(client, headers, deal["id"])

    response = await client.patch(
        f"/api/v1/tasks/{created.json()['id']}",
        json={"deal_id": str(uuid4())},
        headers=headers,
    )

    assert response.status_code == 404


@pytest.mark.integration
async def test_update_task_404(client: httpx.AsyncClient) -> None:
    response = await client.patch(
        f"/api/v1/tasks/{uuid4()}",
        json={"title": "Updated"},
        headers=await admin_headers(client),
    )

    assert response.status_code == 404


@pytest.mark.integration
async def test_update_task_empty_payload_422(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, deal = await task_context(client, headers)
    created = await create_task(client, headers, deal["id"])

    response = await client.patch(
        f"/api/v1/tasks/{created.json()['id']}",
        json={},
        headers=headers,
    )

    assert response.status_code == 422


@pytest.mark.integration
async def test_delete_task(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, deal = await task_context(client, headers)
    created = await create_task(client, headers, deal["id"])
    task_id = created.json()["id"]

    response = await client.delete(f"/api/v1/tasks/{task_id}", headers=headers)

    assert response.status_code == 204
    get_response = await client.get(f"/api/v1/tasks/{task_id}", headers=headers)
    assert get_response.status_code == 404


@pytest.mark.integration
async def test_delete_task_404(client: httpx.AsyncClient) -> None:
    response = await client.delete(
        f"/api/v1/tasks/{uuid4()}",
        headers=await admin_headers(client),
    )

    assert response.status_code == 404


@pytest.mark.integration
async def test_unauthorized_task_endpoints(client: httpx.AsyncClient) -> None:
    create_response = await client.post(
        "/api/v1/tasks/",
        json={"title": "Task", "deal_id": str(uuid4())},
    )
    list_response = await client.get("/api/v1/tasks/")
    get_response = await client.get(f"/api/v1/tasks/{uuid4()}")
    update_response = await client.patch(
        f"/api/v1/tasks/{uuid4()}",
        json={"title": "x"},
    )
    delete_response = await client.delete(f"/api/v1/tasks/{uuid4()}")

    assert create_response.status_code == 401
    assert list_response.status_code == 401
    assert get_response.status_code == 401
    assert update_response.status_code == 401
    assert delete_response.status_code == 401
