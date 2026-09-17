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
    body = {"name": "Test Client", **payload}
    return await client.post("/api/v1/clients/", json=body, headers=headers)


async def create_deal(
    client: httpx.AsyncClient,
    headers: dict[str, str],
    client_id: str,
) -> httpx.Response:
    return await client.post(
        "/api/v1/deals/",
        json={"title": "Test Deal", "client_id": client_id},
        headers=headers,
    )


@pytest.mark.integration
async def test_create_client_success(client: httpx.AsyncClient) -> None:
    response = await create_client(client, await admin_headers(client))

    assert response.status_code == 201
    assert response.json()["name"] == "Test Client"


@pytest.mark.integration
async def test_create_client_as_manager(client: httpx.AsyncClient) -> None:
    response = await create_client(
        client,
        await auth_headers(client, "manager@example.com"),
    )

    assert response.status_code == 201


@pytest.mark.integration
async def test_create_client_email_lowercase(client: httpx.AsyncClient) -> None:
    response = await create_client(
        client,
        await admin_headers(client),
        email="Test@Ex.com",
    )

    assert response.status_code == 201
    assert response.json()["email"] == "test@ex.com"


@pytest.mark.integration
async def test_create_client_email_null(client: httpx.AsyncClient) -> None:
    response = await create_client(client, await admin_headers(client), email=None)

    assert response.status_code == 201
    assert response.json()["email"] is None


@pytest.mark.integration
async def test_create_client_empty_name_returns_422(client: httpx.AsyncClient) -> None:
    response = await create_client(client, await admin_headers(client), name="")

    assert response.status_code == 422


@pytest.mark.integration
async def test_get_client_by_id(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    created = await create_client(client, headers)

    response = await client.get(
        f"/api/v1/clients/{created.json()['id']}",
        headers=headers,
    )

    assert response.status_code == 200


@pytest.mark.integration
async def test_get_client_returns_404(client: httpx.AsyncClient) -> None:
    response = await client.get(
        "/api/v1/clients/00000000-0000-0000-0000-000000000000",
        headers=await admin_headers(client),
    )

    assert response.status_code == 404


@pytest.mark.integration
async def test_list_clients_empty(client: httpx.AsyncClient) -> None:
    response = await client.get(
        "/api/v1/clients/",
        headers=await admin_headers(client),
    )

    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0, "limit": 20, "offset": 0}


@pytest.mark.integration
async def test_list_clients_pagination(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    for index in range(3):
        response = await create_client(client, headers, name=f"Client {index}")
        assert response.status_code == 201

    response = await client.get("/api/v1/clients/?limit=2&offset=0", headers=headers)

    assert response.status_code == 200
    assert len(response.json()["items"]) == 2
    assert response.json()["total"] == 3


@pytest.mark.integration
async def test_list_clients_second_page(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    for index in range(3):
        await create_client(client, headers, name=f"Client {index}")

    response = await client.get("/api/v1/clients/?limit=2&offset=2", headers=headers)

    assert response.status_code == 200
    assert len(response.json()["items"]) == 1


@pytest.mark.integration
async def test_update_client(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    created = await create_client(client, headers)

    response = await client.patch(
        f"/api/v1/clients/{created.json()['id']}",
        json={"company": "FELAGI"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["company"] == "FELAGI"


@pytest.mark.integration
async def test_update_client_returns_404(client: httpx.AsyncClient) -> None:
    response = await client.patch(
        "/api/v1/clients/00000000-0000-0000-0000-000000000000",
        json={"name": "Updated"},
        headers=await admin_headers(client),
    )

    assert response.status_code == 404


@pytest.mark.integration
async def test_update_client_empty_payload_returns_422(
    client: httpx.AsyncClient,
) -> None:
    headers = await admin_headers(client)
    created = await create_client(client, headers)

    response = await client.patch(
        f"/api/v1/clients/{created.json()['id']}",
        json={},
        headers=headers,
    )

    assert response.status_code == 422


@pytest.mark.integration
async def test_delete_client(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    created = await create_client(client, headers)
    client_id = created.json()["id"]

    response = await client.delete(f"/api/v1/clients/{client_id}", headers=headers)

    assert response.status_code == 204
    get_response = await client.get(f"/api/v1/clients/{client_id}", headers=headers)
    assert get_response.status_code == 404


@pytest.mark.integration
async def test_delete_client_returns_404(client: httpx.AsyncClient) -> None:
    response = await client.delete(
        "/api/v1/clients/00000000-0000-0000-0000-000000000000",
        headers=await admin_headers(client),
    )

    assert response.status_code == 404


@pytest.mark.integration
async def test_delete_client_with_deals_conflict(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    client_response = await create_client(client, headers)
    client_id = client_response.json()["id"]
    deal_response = await create_deal(client, headers, client_id)
    assert deal_response.status_code == 201

    response = await client.delete(f"/api/v1/clients/{client_id}", headers=headers)
    get_response = await client.get(f"/api/v1/clients/{client_id}", headers=headers)

    assert response.status_code == 409
    assert get_response.status_code == 200


@pytest.mark.integration
async def test_delete_client_after_deal_removed(client: httpx.AsyncClient) -> None:
    headers = await admin_headers(client)
    client_response = await create_client(client, headers)
    client_id = client_response.json()["id"]
    deal_response = await create_deal(client, headers, client_id)
    deal_id = deal_response.json()["id"]

    delete_deal_response = await client.delete(
        f"/api/v1/deals/{deal_id}",
        headers=headers,
    )
    delete_client_response = await client.delete(
        f"/api/v1/clients/{client_id}",
        headers=headers,
    )

    assert delete_deal_response.status_code == 204
    assert delete_client_response.status_code == 204


@pytest.mark.integration
async def test_unauthorized_client_endpoints(client: httpx.AsyncClient) -> None:
    create_response = await client.post("/api/v1/clients/", json={"name": "Test"})
    list_response = await client.get("/api/v1/clients/")
    get_response = await client.get(
        "/api/v1/clients/00000000-0000-0000-0000-000000000000"
    )
    update_response = await client.patch(
        "/api/v1/clients/00000000-0000-0000-0000-000000000000",
        json={"name": "Test"},
    )
    delete_response = await client.delete(
        "/api/v1/clients/00000000-0000-0000-0000-000000000000"
    )

    assert create_response.status_code == 401
    assert list_response.status_code == 401
    assert get_response.status_code == 401
    assert update_response.status_code == 401
    assert delete_response.status_code == 401
