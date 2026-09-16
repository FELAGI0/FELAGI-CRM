# FELAGI CRM

## Что это

FELAGI CRM — backend-скелет веб-CRM для малого бизнеса.

## Стек

- Python 3.13
- FastAPI
- SQLAlchemy 2.0 async
- PostgreSQL 16
- Alembic
- Pydantic v2
- uv
- Docker Compose

## Требования

- Python 3.13+
- uv
- Docker и Docker Compose для запуска в контейнерах
- PostgreSQL 16 для запуска без Docker

## Быстрый старт с Docker

Скопируйте `.env.example` в `.env` и задайте секреты:

```text
POSTGRES_PASSWORD=devpass
JWT_SECRET_KEY=dev-secret-key-at-least-32-characters
```

Запустите сервисы:

```text
docker compose up --build
```

Проверьте health endpoint:

```text
curl http://localhost:8000/api/v1/health
```

Ожидаемый ответ:

```json
{"status":"ok","database":"ok"}
```

Остановите сервисы и удалите volume базы:

```text
docker compose down -v
```

## Быстрый старт без Docker

1. Установите зависимости:

   ```text
   uv sync
   ```

2. Создайте `.env` и укажите параметры локального PostgreSQL.
3. Запустите локальный PostgreSQL.
4. Запустите API:

   ```text
   uv run uvicorn app.main:app --reload
   ```

5. Проверьте `http://localhost:8000/api/v1/health`.

## Деплой

Для Render + Neon выставить `POSTGRES_SSL=true` в env.

## Миграции

Локально с хоста Alembic не подключится к PostgreSQL, потому что порт `db` не опубликован в `compose.yaml`. Это соответствует production-конфигурации. Запускайте миграции через API-контейнер:

```text
docker compose exec api alembic upgrade head
docker compose exec api alembic revision --autogenerate -m "..."
```

## Команды

```text
make check
make lint
make test
make migrate
make alembic-check
```

Все Python-команды используют `uv run`.

## Структура проекта

```text
app/       FastAPI-приложение, core, DB и API v1
alembic/   конфигурация миграций и пустая versions/
tests/     тесты проекта
```

## Что не реализовано на этапе 1

- бизнес-модули users, clients, deals и tasks;
- SQLAlchemy-модели бизнес-сущностей;
- миграции Alembic;
- frontend.
