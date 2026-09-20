import re
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator, model_validator

_PASSWORD_PATTERN = re.compile(r"(?=.*[a-z])(?=.*[A-Z])(?=.*\d)")

Role = Literal["admin", "manager", "user"]


def _validate_password(value: str) -> str:
    if not 12 <= len(value) <= 128:
        raise ValueError("Password must be between 12 and 128 characters")
    if not _PASSWORD_PATTERN.search(value):
        raise ValueError(
            "Password must include a lowercase letter, uppercase letter, and digit"
        )
    return value


class UserCreate(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return value.lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password(value)


class UserAdminCreate(BaseModel):
    """Creation by an administrator, who may also choose the role."""

    email: EmailStr
    password: str
    role: Role = "user"

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return value.lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password(value)


class UserAdminUpdate(BaseModel):
    """Partial update. At least one field must be present."""

    role: Role | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def require_at_least_one_field(self) -> "UserAdminUpdate":
        if self.role is None and self.is_active is None:
            raise ValueError("At least one of role or is_active must be provided")
        return self


class UserRead(BaseModel):
    id: UUID
    email: EmailStr
    role: Literal["admin", "manager", "user"]
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return value.lower()


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str
