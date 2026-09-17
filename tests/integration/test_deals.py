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


async def create_client(
    client: httpx.AsyncClient,
    headers: dict[str, str],
    **payload: object,
) -> httpx.Response:
    return await client.post(
        "/api/v1/clients/",
        json={"name": "Test Client", **payload},
        headers=headers,
    )


async def create_deal(
    client: httpx.AsyncClient,
    headers: dict[str, str],
    client_id: str,
    **payload: object,
) -> httpx.Response:
    return await client.post(
        "/api/v1/deals/",
        json={"title": "Test Deal", "client_id": client_id, **payload},
        headers=headers,
    )


async def create_deal_fixture(
    client: httpx.AsyncClient,
    headers: dict[str, str],
    **payload: object,
) -> tuple[dict[str, object], httpx.Response]:
    client_response = await create_client(client, headers)
    client_id = client_response.json()["id"]
    deal_response = await create_deal(client, headers, client_id, **payload)
    return client_response.json(), deal_response


@pytest.mark.integration
async def test_create_deal_success(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    client_data, response = await create_deal_fixture(client, headers, amount="100.50")

    assert response.status_code == 201
    assert response.json()["client_id"] == client_data["id"]
    assert response.json()["amount"] == "100.50"
    assert response.json()["created_by"]


@pytest.mark.integration
async def test_create_deal_with_nonexistent_client_404(
    client: httpx.AsyncClient,
) -> None:
    response = await create_deal(
        client,
        await admin_headers(client),
        str(uuid4()),
    )

    assert response.status_code == 404


@pytest.mark.integration
async def test_create_deal_amount_null(client: httpx.AsyncClient) -> None:
    _, response = await create_deal_fixture(client, await admin_headers(client))

    assert response.status_code == 201
    assert response.json()["amount"] is None


@pytest.mark.integration
async def test_create_deal_default_status(client: httpx.AsyncClient) -> None:
    _, response = await create_deal_fixture(client, await admin_headers(client))

    assert response.status_code == 201
    assert response.json()["status"] == "new"


@pytest.mark.integration
async def test_create_deal_invalid_status_422(client: httpx.AsyncClient) -> None:
    _, response = await create_deal_fixture(
        client,
        await admin_headers(client),
        status="invalid",
    )

    assert response.status_code == 422


@pytest.mark.integration
async def test_create_deal_negative_amount_422(client: httpx.AsyncClient) -> None:
    _, response = await create_deal_fixture(
        client,
        await admin_headers(client),
        amount=-1,
    )

    assert response.status_code == 422


@pytest.mark.integration
async def test_get_deal_by_id(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, created = await create_deal_fixture(client, headers)

    response = await client.get(
        f"/api/v1/deals/{created.json()['id']}",
        headers=headers,
    )

    assert response.status_code == 200


@pytest.mark.integration
async def test_get_deal_404(client: httpx.AsyncClient) -> None:
    response = await client.get(
        f"/api/v1/deals/{uuid4()}",
        headers=await admin_headers(client),
    )

    assert response.status_code == 404


@pytest.mark.integration
async def test_update_deal_title(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, created = await create_deal_fixture(client, headers)

    response = await client.patch(
        f"/api/v1/deals/{created.json()['id']}",
        json={"title": "Updated Deal"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Updated Deal"


@pytest.mark.integration
async def test_update_deal_amount(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, created = await create_deal_fixture(client, headers)

    response = await client.patch(
        f"/api/v1/deals/{created.json()['id']}",
        json={"amount": "250.75"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["amount"] == "250.75"


@pytest.mark.integration
async def test_update_deal_status(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, created = await create_deal_fixture(client, headers)

    response = await client.patch(
        f"/api/v1/deals/{created.json()['id']}",
        json={"status": "won"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "won"


@pytest.mark.integration
async def test_update_deal_client_id(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, created = await create_deal_fixture(client, headers)
    second_client = await create_client(client, headers, name="Second Client")

    response = await client.patch(
        f"/api/v1/deals/{created.json()['id']}",
        json={"client_id": second_client.json()["id"]},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["client_id"] == second_client.json()["id"]


@pytest.mark.integration
async def test_update_deal_nonexistent_client_404(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, created = await create_deal_fixture(client, headers)

    response = await client.patch(
        f"/api/v1/deals/{created.json()['id']}",
        json={"client_id": str(uuid4())},
        headers=headers,
    )

    assert response.status_code == 404


@pytest.mark.integration
async def test_update_deal_404(client: httpx.AsyncClient) -> None:
    response = await client.patch(
        f"/api/v1/deals/{uuid4()}",
        json={"title": "Updated"},
        headers=await admin_headers(client),
    )

    assert response.status_code == 404


@pytest.mark.integration
async def test_update_deal_empty_payload_422(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, created = await create_deal_fixture(client, headers)

    response = await client.patch(
        f"/api/v1/deals/{created.json()['id']}",
        json={},
        headers=headers,
    )

    assert response.status_code == 422


@pytest.mark.integration
async def test_delete_deal(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    _, created = await create_deal_fixture(client, headers)
    deal_id = created.json()["id"]

    response = await client.delete(f"/api/v1/deals/{deal_id}", headers=headers)

    assert response.status_code == 204
    get_response = await client.get(
        f"/api/v1/deals/{deal_id}",
        headers=headers,
    )
    assert get_response.status_code == 404


@pytest.mark.integration
async def test_delete_deal_cascades_tasks(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    client_response = await create_client(client, headers)
    deal_response = await create_deal(client, headers, client_response.json()["id"])
    deal_id = deal_response.json()["id"]
    task_ids = []
    for _ in range(2):
        task_response = await client.post(
            "/api/v1/tasks/",
            json={"title": "Task", "deal_id": deal_id},
            headers=headers,
        )
        assert task_response.status_code == 201
        task_ids.append(task_response.json()["id"])

    delete_response = await client.delete(f"/api/v1/deals/{deal_id}", headers=headers)

    assert delete_response.status_code == 204
    for task_id in task_ids:
        task_response = await client.get(
            f"/api/v1/tasks/{task_id}",
            headers=headers,
        )
        assert task_response.status_code == 404


@pytest.mark.integration
async def test_delete_deal_404(client: httpx.AsyncClient) -> None:
    response = await client.delete(
        f"/api/v1/deals/{uuid4()}",
        headers=await admin_headers(client),
    )

    assert response.status_code == 404


@pytest.mark.integration
async def test_list_deals_empty(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/deals/", headers=await admin_headers(client))

    assert response.status_code == 200
    assert response.json()["items"] == []
    assert response.json()["total"] == 0


@pytest.mark.integration
async def test_list_deals_pagination(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    for _ in range(3):
        await create_deal_fixture(client, headers)

    response = await client.get("/api/v1/deals/?limit=2", headers=headers)

    assert response.status_code == 200
    assert len(response.json()["items"]) == 2
    assert response.json()["total"] == 3


@pytest.mark.integration
async def test_list_deals_filter_by_status(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    await create_deal_fixture(client, headers, status="won")
    await create_deal_fixture(client, headers, status="new")

    response = await client.get("/api/v1/deals/?status=won", headers=headers)

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["status"] == "won"


@pytest.mark.integration
async def test_list_deals_filter_by_client_id(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    first_client, _ = await create_deal_fixture(client, headers)
    await create_deal_fixture(client, headers)

    response = await client.get(
        f"/api/v1/deals/?client_id={first_client['id']}",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1


@pytest.mark.integration
async def test_list_deals_combined_filters(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    first_client, _ = await create_deal_fixture(client, headers, status="won")
    await create_deal_fixture(client, headers, status="new")

    response = await client.get(
        f"/api/v1/deals/?status=won&client_id={first_client['id']}",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1


@pytest.mark.integration
async def test_unauthorized_deal_endpoints(client: httpx.AsyncClient) -> None:
    create_response = await client.post(
        "/api/v1/deals/",
        json={"title": "Deal", "client_id": str(uuid4())},
    )
    list_response = await client.get("/api/v1/deals/")
    get_response = await client.get(f"/api/v1/deals/{uuid4()}")
    update_response = await client.patch(
        f"/api/v1/deals/{uuid4()}",
        json={"title": "x"},
    )
    delete_response = await client.delete(f"/api/v1/deals/{uuid4()}")

    assert create_response.status_code == 401
    assert list_response.status_code == 401
    assert get_response.status_code == 401
    assert update_response.status_code == 401
    assert delete_response.status_code == 401
