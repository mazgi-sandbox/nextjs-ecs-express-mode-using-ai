# Local Development

## 1. Set up environment variables

```sh
cp .example.secrets.env .secrets.env
```

Edit `.secrets.env` and replace placeholders. See [.example.secrets.env](../.example.secrets.env) for all variables.

**Linux only** — set UID/GID so bind-mounted files are owned by your user:

```sh
test $(uname -s) = 'Linux' && {
  echo "GID=$(id -g)"
  echo "UID=$(id -u)"
} >> .secrets.env || :
```

Run `docker compose build` after changing UID/GID.

**JWT secrets:** `openssl rand -base64 32`

## 2. Start the backend and web

```sh
docker compose up
```

Containers auto-upgrade dependencies, apply DB schema, and start in watch mode.

| URL | Description |
|-----|-------------|
| http://localhost:4000 | Backend API |
| http://localhost:4000/api | Swagger UI |
| http://localhost:3000 | Web |

## 3. Run E2E tests

### Web (Playwright)

```sh
docker compose --profile=e2e-tests run --rm web-e2e-tests
docker compose --profile=e2e-tests down --remove-orphans
```

