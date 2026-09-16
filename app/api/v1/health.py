import structlog
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session

router = APIRouter()
logger = structlog.get_logger(__name__)


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    response_model=None,
)
async def health_check(
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, str] | JSONResponse:
    try:
        await session.execute(text("SELECT 1"))
    except Exception as exc:
        logger.warning("health_check_failed", error_type=type(exc).__name__)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "degraded", "database": "unavailable"},
        )
    return {"status": "ok", "database": "ok"}
