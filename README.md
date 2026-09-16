# FELAGI CRM

## Что это

FELAGI CRM — backend веб-CRM для малого бизнеса. На Этапе 2 реализованы пользователи и JWT-аутентификация.

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

## Authentication

### `POST /api/v1/auth/register`

Регистрация пользователя.

```json
{"email":"user@example.com","password":"StrongPassword123"}
```

Пароль должен содержать 12–128 символов, lowercase-букву, uppercase-букву и цифру. Ответ `201 Created` содержит `UserRead`.

### `POST /api/v1/auth/login`

Вход пользователя.

```json
{"email":"user@example.com","password":"StrongPassword123"}
```

Ответ `200 OK` содержит `TokenPair`: `access_token`, `refresh_token` и `token_type`.

### `POST /api/v1/auth/refresh`

Обновление пары токенов.

```json
{"refresh_token":"..."}
```

Ответ `200 OK` содержит новую `TokenPair`.

### `GET /api/v1/users/me`

Текущий пользователь. Передайте access token:

```text
Authorization: Bearer <access_token>
```

Ответ `200 OK` содержит `UserRead`.

## Roles

Пользователь имеет поле `role`: `admin`, `manager` или `user`. Значение по умолчанию — `user`. Логика доступа по ролям будет добавлена на Этапе 3.

## Tokens

- Access token действует 15 минут (`JWT_ACCESS_TOKEN_EXPIRE_MINUTES`).
- Refresh token действует 7 дней (`JWT_REFRESH_TOKEN_EXPIRE_DAYS`).
- Access token нельзя использовать как refresh token и наоборот.
- `/auth/refresh` возвращает новую пару access и refresh tokens.

## Rate limiting

`/auth/register` и `/auth/login` ограничены пятью запросами в минуту на IP. При превышении API возвращает `429 Too Many Requests`.

## Тесты

```text
uv run python -m pytest tests/ -q
```

- Unit tests покрывают Argon2 password hashing и JWT helpers.
- Integration tests используют Testcontainers PostgreSQL и `httpx.AsyncClient`.
- Coverage создаётся через `pytest-cov`.

## Переменные окружения

- `JWT_SECRET_KEY` — обязательный ключ подписи JWT, не менее 32 символов.
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` — TTL access token, по умолчанию `15`.
- `JWT_REFRESH_TOKEN_EXPIRE_DAYS` — TTL refresh token, по умолчанию `7`.
- `POSTGRES_SSL` — `false` локально, `true` для Render + Neon.

## Деплой

Для Render + Neon выставить `POSTGRES_SSL=true` в env.

## Миграции

Локально с хоста Alembic не подключится к PostgreSQL, потому что порт `db` не опубликован в `compose.yaml`. Это соответствует production-конфигурации. Миграции создаются через API-контейнер и сохраняются на хосте благодаря mount `./alembic:/app/alembic`:

```text
docker compose exec api alembic revision --autogenerate -m "..."
docker compose exec api alembic upgrade head
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
app/       FastAPI-приложение, core, DB, API v1 и доменные modules/
alembic/   конфигурация миграций и versions/
tests/     unit и integration тесты
```

## Что не реализовано

- бизнес-модули clients, deals и tasks;
- авторизация по ролям;
- frontend.
