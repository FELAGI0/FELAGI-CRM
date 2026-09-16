import re
import time
from uuid import uuid4

import structlog
from starlette.types import ASGIApp, Message, Receive, Scope, Send

_REQUEST_ID_PATTERN = re.compile(r"^[a-zA-Z0-9\-_.]{1,128}$")


class RequestIDMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app
        self.logger = structlog.get_logger(__name__)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id = self._get_request_id(scope)
        status_code = 500
        started_at = time.perf_counter()
        structlog.contextvars.bind_contextvars(request_id=request_id)
        self.logger.info(
            "request_started",
            method=scope.get("method"),
            path=scope.get("path"),
        )

        async def send_with_request_id(message: Message) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
                headers = list(message.get("headers", []))
                headers.append((b"x-request-id", request_id.encode("ascii")))
                message = {**message, "headers": headers}
            await send(message)

        try:
            await self.app(scope, receive, send_with_request_id)
        finally:
            self.logger.info(
                "request_finished",
                method=scope.get("method"),
                path=scope.get("path"),
                status_code=status_code,
                duration_ms=round((time.perf_counter() - started_at) * 1000, 2),
            )
            structlog.contextvars.clear_contextvars()

    @staticmethod
    def _get_request_id(scope: Scope) -> str:
        for name, value in scope.get("headers", []):
            if name.lower() == b"x-request-id":
                candidate = value.decode("latin-1")
                if _REQUEST_ID_PATTERN.fullmatch(candidate):
                    return str(candidate)
                break
        return str(uuid4())
