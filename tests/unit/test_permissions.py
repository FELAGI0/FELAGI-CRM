from types import SimpleNamespace

import pytest

from app.api.dependencies.permissions import require_role
from app.core.exceptions import AuthorizationError


@pytest.mark.asyncio
async def test_require_role_allows_matching_role() -> None:
    user = SimpleNamespace(role="admin")

    result = await require_role("admin")(user)

    assert result is user


@pytest.mark.asyncio
async def test_require_role_rejects_other_role() -> None:
    user = SimpleNamespace(role="user")

    with pytest.raises(AuthorizationError, match="Insufficient permissions"):
        await require_role("admin")(user)
