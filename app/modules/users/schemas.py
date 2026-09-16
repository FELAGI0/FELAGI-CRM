import re
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

_PASSWORD_PATTERN = re.compile(r"(?=.*[a-z])(?=.*[A-Z])(?=.*\d)")


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
        if not 12 <= len(value) <= 128:
            raise ValueError("Password must be between 12 and 128 characters")
        if not _PASSWORD_PATTERN.search(value):
            raise ValueError(
                "Password must include a lowercase letter, uppercase letter, and digit"
            )
        return value


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
