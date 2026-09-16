FROM python:3.13-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/
ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_DOWNLOADS=never
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./

FROM python:3.13-slim AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
RUN useradd --create-home --uid 1000 appuser
WORKDIR /app
COPY --from=builder --chown=appuser:appuser /app /app
COPY --chown=appuser:appuser entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
ENV PATH="/app/.venv/bin:$PATH"
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS http://localhost:8000/api/v1/health || exit 1
ENTRYPOINT ["/app/entrypoint.sh"]
