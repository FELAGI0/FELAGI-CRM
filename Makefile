.PHONY: install up down logs lint format format-check typecheck test check migrate alembic-check clean

install:
	uv sync

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f api

lint:
	uv run python -m ruff check .

format:
	uv run python -m ruff format .

format-check:
	uv run python -m ruff format --check .

typecheck:
	uv run python -m mypy app

test:
	uv run python -m pytest tests/ -q

check: lint format-check typecheck test

migrate:
	uv run alembic upgrade head

alembic-check:
	uv run alembic check

clean:
	python -c "import shutil; [shutil.rmtree(path, ignore_errors=True) for path in ['__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache']]"
