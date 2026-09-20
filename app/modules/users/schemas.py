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
    name: str | None = None
    role: Literal["admin", "manager", "user"]
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserUpdateMe(BaseModel):
    """Self-service profile update. At least one field must be present."""

    name: str | None = None
    email: EmailStr | None = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr | None) -> str | None:
        return value.lower() if value is not None else None

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            raise ValueError("Name must not be empty")
        if len(stripped) > 255:
            raise ValueError("Name must be at most 255 characters")
        return stripped

    @model_validator(mode="after")
    def require_at_least_one_field(self) -> "UserUpdateMe":
        if self.name is None and self.email is None:
            raise ValueError("At least one of name or email must be provided")
        return self


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return _validate_password(value)


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
