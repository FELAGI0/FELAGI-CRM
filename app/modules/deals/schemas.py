from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

DealStatus = Literal["new", "in_progress", "won", "lost"]


class DealCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    amount: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    status: DealStatus = "new"
    client_id: UUID


class DealUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    amount: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    status: DealStatus | None = None
    client_id: UUID | None = None

    @model_validator(mode="after")
    def validate_not_empty(self) -> "DealUpdate":
        if all(value is None for value in self.model_dump().values()):
            raise ValueError("At least one field must be provided")
        return self


class DealRead(BaseModel):
    id: UUID
    title: str
    amount: Decimal | None
    status: DealStatus
    client_id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
