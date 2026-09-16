from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.core.config import settings
from app.core.exceptions import AuthenticationError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)


def test_hash_password_differs_from_plain() -> None:
    password = "StrongPassword123"

    assert hash_password(password) != password


def test_verify_password_correct() -> None:
    password = "StrongPassword123"

    assert verify_password(password, hash_password(password))


def test_verify_password_wrong() -> None:
    password_hash = hash_password("StrongPassword123")

    assert not verify_password("WrongPassword123", password_hash)


def test_access_token_decodes_as_access() -> None:
    token = create_access_token("user-id")

    assert decode_access_token(token)["sub"] == "user-id"


def test_refresh_token_decodes_as_refresh() -> None:
    token = create_refresh_token("user-id")

    assert decode_refresh_token(token)["sub"] == "user-id"


def test_access_token_rejected_as_refresh() -> None:
    token = create_access_token("user-id")

    with pytest.raises(AuthenticationError):
        decode_refresh_token(token)


def test_refresh_token_rejected_as_access() -> None:
    token = create_refresh_token("user-id")

    with pytest.raises(AuthenticationError):
        decode_access_token(token)


def test_expired_token_raises() -> None:
    token = create_access_token("user-id", expires_delta=timedelta(minutes=-1))

    with pytest.raises(AuthenticationError):
        decode_access_token(token)


def test_tampered_token_raises() -> None:
    token = create_access_token("user-id")

    with pytest.raises(AuthenticationError):
        decode_access_token(f"{token}tampered")


def test_decode_token_missing_sub_raises() -> None:
    token = jwt.encode(
        {
            "iat": datetime.now(UTC),
            "exp": datetime.now(UTC) + timedelta(minutes=1),
            "token_type": "access",
        },
        settings.jwt_secret_key.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )

    with pytest.raises(AuthenticationError):
        decode_access_token(token)
