import logging
import sys

import structlog
from structlog.stdlib import ProcessorFormatter
from structlog.types import Processor

from app.core.config import Settings


def setup_logging(settings: Settings) -> None:
    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]
    renderer: structlog.types.Processor
    if settings.environment == "dev":
        renderer = structlog.dev.ConsoleRenderer()
    else:
        renderer = structlog.processors.JSONRenderer()

    formatter = ProcessorFormatter(
        processor=renderer,
        foreign_pre_chain=shared_processors,
    )
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(settings.log_level)

    uvicorn_error = logging.getLogger("uvicorn.error")
    uvicorn_error.handlers.clear()
    uvicorn_error.addHandler(handler)
    uvicorn_error.setLevel(settings.log_level)
    uvicorn_error.propagate = False

    uvicorn_access = logging.getLogger("uvicorn.access")
    uvicorn_access.disabled = True

    structlog.configure(
        processors=[
            *shared_processors,
            ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=False,
    )
