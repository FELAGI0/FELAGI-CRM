from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.api.schemas import Page
from app.modules.clients.schemas import ClientCreate, ClientRead, ClientUpdate
from app.modules.deals.schemas import DealCreate, DealUpdate
from app.modules.tasks.schemas import TaskCreate, TaskUpdate


def test_client_create_email_lowercase() -> None:
    client = ClientCreate(name="Test", email="Test@Example.com")
    assert client.email == "test@example.com"


def test_client_create_email_none() -> None:
    client = ClientCreate(name="Test", email=None)
    assert client.email is None


def test_client_create_empty_name_raises() -> None:
    with pytest.raises(ValidationError):
        ClientCreate(name="")


def test_client_update_empty_payload_raises() -> None:
    with pytest.raises(ValidationError):
        ClientUpdate()


def test_page_schema() -> None:
    page = Page[ClientRead](items=[], total=0, limit=20, offset=0)
    assert page.items == []
    assert page.total == 0


def test_client_read_from_attributes() -> None:
    client = ClientRead(
        id=uuid4(),
        name="Test",
        email=None,
        phone=None,
        company=None,
        notes=None,
        created_by=uuid4(),
        created_at=datetime.now().astimezone(),
        updated_at=datetime.now().astimezone(),
    )
    assert client.name == "Test"


def test_deal_create_amount_negative_raises() -> None:
    with pytest.raises(ValidationError):
        DealCreate(title="Deal", amount=Decimal("-1"), client_id=uuid4())


def test_deal_create_status_default() -> None:
    deal = DealCreate(title="Deal", client_id=uuid4())
    assert deal.status == "new"


def test_deal_create_invalid_status_raises() -> None:
    with pytest.raises(ValidationError):
        DealCreate(title="Deal", status="invalid", client_id=uuid4())


def test_deal_update_empty_payload_raises() -> None:
    with pytest.raises(ValidationError):
        DealUpdate()


def test_deal_create_amount_valid_decimal() -> None:
    deal = DealCreate(
        title="Deal",
        amount=Decimal("100.50"),
        client_id=uuid4(),
    )
    assert deal.amount == Decimal("100.50")


def test_task_create_status_default() -> None:
    task = TaskCreate(title="Task", deal_id=uuid4())
    assert task.status == "todo"


def test_task_create_invalid_status_raises() -> None:
    with pytest.raises(ValidationError):
        TaskCreate(title="Task", deal_id=uuid4(), status="invalid")


def test_task_create_naive_due_date_raises() -> None:
    with pytest.raises(ValidationError):
        TaskCreate(
            title="Task",
            deal_id=uuid4(),
            due_date=datetime(2026, 1, 1),
        )


def test_task_create_timezone_aware_due_date() -> None:
    due_date = datetime(2026, 1, 1, tzinfo=UTC)
    task = TaskCreate(title="Task", deal_id=uuid4(), due_date=due_date)
    assert task.due_date == due_date


def test_task_update_empty_payload_raises() -> None:
    with pytest.raises(ValidationError):
        TaskUpdate()


def test_task_create_assigned_to_none() -> None:
    task = TaskCreate(title="Task", deal_id=uuid4(), assigned_to=None)
    assert task.assigned_to is None
