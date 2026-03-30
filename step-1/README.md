# nextjs-ecs-express-mode-using-ai — Step 1

Next.js web app with Docker Compose for local development.

## Prerequisites

- Docker Engine + Docker Compose (e.g. [Docker Desktop](https://www.docker.com/products/docker-desktop/), [Podman](https://podman.io/), [Colima](https://github.com/abiosoft/colima))

## Quick Start

```sh
cp .example.env .env
docker compose up
```

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Web |

## Project Structure

```
.
├── compose.yaml
├── .example.env
├── web/
│   └── app/               # Next.js app
└── Dockerfiles.d/
```
