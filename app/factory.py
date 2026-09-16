from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.api.v1.router import api_router
from app.core.config import Settings, settings
from app.core.exceptions import AppError
from app.core.logging import setup_logging
from app.core.middleware import RequestIDMiddleware
from app.db.session import create_database_engine


def create_app(settings_override: Settings | None = None) -> FastAPI:
    app_settings = settings_override or settings
    setup_logging(app_settings)
    app = FastAPI(title=app_settings.app_name, debug=app_settings.debug)

    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

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
