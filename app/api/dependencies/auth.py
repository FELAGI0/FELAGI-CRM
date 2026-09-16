from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationError
from app.core.security import decode_access_token
from app.db.session import get_db_session
from app.modules.users.model import User
from app.modules.users.service import get_user_by_id

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    session: AsyncSession = Depends(get_db_session),
) -> User:
    if credentials is None:
        raise AuthenticationError("Not authenticated")

    payload = decode_access_token(credentials.credentials)
    try:
        user_id = UUID(payload["sub"])
    except (KeyError, ValueError) as exc:
        raise AuthenticationError("Not authenticated") from exc

    try:
        user = await get_user_by_id(session, user_id)
    except Exception as exc:
        raise AuthenticationError("Not authenticated") from exc

    if not user.is_active:
        raise AuthenticationError("Not authenticated")
    return user
