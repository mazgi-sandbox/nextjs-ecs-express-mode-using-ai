# nextjs-ecs-express-mode-using-ai — Step 3

Next.js web app with Playwright E2E tests, IaC (AWS), and GitHub Actions CI/CD.

## Services

| Service | Technology | Port |
|---------|-----------|------|
| web | Next.js 16 | 3000 |

## Prerequisites

- Docker Engine + Docker Compose (e.g. [Docker Desktop](https://www.docker.com/products/docker-desktop/), [Podman](https://podman.io/), [Colima](https://github.com/abiosoft/colima))

## Quick Start

```sh
cp .example.env .env
docker compose up web
```

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Web |

## E2E Tests

```sh
docker compose --profile e2e-tests run --rm web-e2e-tests
docker compose --profile e2e-tests down --remove-orphans
```

## Project Structure

```
.
├── compose.yaml
├── .example.env
├── web/
│   ├── app/               # Next.js app
│   └── e2e-tests/         # Playwright E2E tests
├── iac/                   # Terraform IaC (AWS)
├── Dockerfiles.d/
├── .github/               # GitHub Actions workflows + custom actions
└── docs/
```

## Documentation

- Cloud Deployment — [overview](docs/cloud-deployment.md) / [AWS](docs/cloud-deployment-aws.md)
- [CI / GitHub Actions](docs/ci.md) — workflows, required secrets and variables
- [OIDC Setup](docs/oidc-setup.md) — one-time AWS OIDC authentication setup
- [GitHub Actions Variables](.example.env) — CI/CD and cloud deployment variables
