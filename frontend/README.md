# FELAGI CRM Frontend

## Setup

```text
npm install
```

The backend must be running:

```text
docker compose up
```

## Development

```text
npm run dev
```

Open http://localhost:3000.

## Checks

```text
npm run typecheck
npm run lint
npm run test
npm run build
```

## Environment

`VITE_API_URL` sets the API base URL. Default: `/api/v1`.

OpenAPI type generation with `openapi-typescript` is deferred to Stage 6.
