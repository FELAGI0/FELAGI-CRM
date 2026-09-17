from collections.abc import Callable
from typing import Any

from fastapi import Depends

from app.api.dependencies.auth import get_current_user
from app.core.exceptions import AuthorizationError
from app.modules.users.model import User


def require_role(*roles: str) -> Callable[..., Any]:
    async def check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise AuthorizationError("Insufficient permissions")
        return current_user

    return check
