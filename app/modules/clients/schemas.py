from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator, model_validator


class ClientCreate(BaseModel):
    name: str
    email: EmailStr | None = None
    phone: str | None = None
    company: str | None = None
    notes: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if not 1 <= len(value) <= 255:
            raise ValueError("Name must be between 1 and 255 characters")
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr | None) -> str | None:
        return value.lower() if value is not None else None


class ClientUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    company: str | None = None
    notes: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is not None and not 1 <= len(value) <= 255:
            raise ValueError("Name must be between 1 and 255 characters")
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr | None) -> str | None:
        return value.lower() if value is not None else None

    @model_validator(mode="after")
    def validate_not_empty(self) -> "ClientUpdate":
        if all(value is None for value in self.model_dump().values()):
            raise ValueError("At least one field must be provided")
        return self


class ClientRead(BaseModel):
    id: UUID
    name: str
    email: EmailStr | None
    phone: str | None
    company: str | None
    notes: str | None
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
