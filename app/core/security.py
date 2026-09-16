from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from pwdlib import PasswordHash

from app.core.config import settings
from app.core.exceptions import AuthenticationError

_password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return _password_hash.verify(password, password_hash)


def create_access_token(
    subject: str,
    expires_delta: timedelta | None = None,
) -> str:
    now = datetime.now(UTC)
    default_minutes = settings.jwt_access_token_expire_minutes
    delta = expires_delta or timedelta(minutes=default_minutes)
    payload = {"sub": subject, "iat": now, "exp": now + delta}
    return str(
        jwt.encode(
            payload,
            settings.jwt_secret_key.get_secret_value(),
            algorithm=settings.jwt_algorithm,
        )
    )


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key.get_secret_value(),
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.PyJWTError as exc:
        raise AuthenticationError(
            "Invalid or expired access token", "invalid_token"
        ) from exc

    if not isinstance(payload, dict) or not payload.get("sub"):
        raise AuthenticationError("Invalid access token", "invalid_token")
    return payload
