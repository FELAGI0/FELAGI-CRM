from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.api.v1.router import api_router
from app.core.config import Settings, settings
from app.core.exceptions import AppError
from app.core.logging import setup_logging
from app.core.middleware import RequestIDMiddleware
from app.core.rate_limit import limiter
from app.db.session import create_database_engine


async def _rate_limit_handler(
    _request: Request,
    exc: Exception,
) -> JSONResponse:
    if isinstance(exc, RateLimitExceeded):
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded", "code": None},
        )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "code": None},
    )


def create_app(settings_override: Settings | None = None) -> FastAPI:
    app_settings = settings_override or settings
    setup_logging(app_settings)
    app = FastAPI(title=app_settings.app_name, debug=app_settings.debug)

    app.state.limiter = limiter
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(SlowAPIMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_exception_handler(RateLimitExceeded, _rate_limit_handler)

    @app.exception_handler(AppError)
    async def handle_app_error(_request: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail, "code": exc.code},
        )

    engine = create_database_engine(app_settings)
    app.state.session_factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    app.state.engine = engine
    app.include_router(api_router, prefix=app_settings.api_v1_prefix)
    return app
