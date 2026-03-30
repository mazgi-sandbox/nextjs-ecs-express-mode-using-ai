# CI / GitHub Actions

## Workflows

### E2E Tests (on push/PR to `main`)

| Workflow | Runner | Description |
|----------|--------|-------------|
| `backend.e2e-tests.yaml` | `ubuntu-latest` | Backend image + NestJS E2E tests via Docker Compose |
| `web.e2e-tests.yaml` | `ubuntu-latest` | Full stack + Playwright E2E tests |

> **UID/GID in CI:** E2E workflows append `UID=$(id -u)` and `GID=$(id -g)` to `.env` before `docker compose build` so container user matches the runner (avoids `EACCES` errors).

### Production Builds

| Workflow | Description |
|----------|-------------|
| `backend.build.yaml` | Builds + pushes backend image to GHCR (+ ECR if configured). Passes `GIT_SHA` build-arg. |
| `web.build.yaml` | Builds + pushes web image to GHCR (+ ECR if configured). Passes `GIT_SHA` build-arg for `NEXT_PUBLIC_GIT_SHA`. |

### IaC (Terraform)

| Workflow | Description |
|----------|-------------|
| `iac.yaml` | IaC: PR = plan, push to main = apply. |

## Env file naming convention

| File | Purpose |
|------|---------|
| `.example.env` / `.example.secrets.env` | Templates (committed to repo) |
| `.env` / `.secrets.env` | Local development |
| `.staging.env` / `.staging.secrets.env` | Staging — uploaded to GitHub Actions |
| `.production.env` / `.production.secrets.env` | Production — uploaded to GitHub Actions |

> `.env` and `.secrets.env` are for local `docker compose up`. `.staging.*` and `.production.*` are only used to populate GitHub Actions variables/secrets and should **not** be committed.

## Setup

### For E2E tests only

1. **Variables** — `cp .example.env .staging.env`, edit, then `gh variable set --env Staging --env-file .staging.env`
2. **Secrets** — `cp .example.secrets.env .staging.secrets.env`, edit, then `gh secret set --env Staging --env-file .staging.secrets.env`

For the production environment, use `.production.env` / `.production.secrets.env` and replace `--env Staging` with `--env Production`.

### For cloud deployment (E2E tests + production builds + IaC)

1. **Variables + Secrets** — same as above
2. **OIDC auth** — see [OIDC Setup](oidc-setup.md)

### Reset secrets/variables

```sh
gh secret list --env Staging --json name --jq '.[].name' | xargs -I {} gh secret delete --env Staging {}
gh variable list --env Staging --json name --jq '.[].name' | xargs -I {} gh variable delete --env Staging {}
```

Replace `Staging` with `Production` for the production environment. See [Env file naming convention](#env-file-naming-convention) for the full list of file names.

## Required Secrets

### E2E test secrets

| Secret | Description |
|--------|-------------|
| `AUTH_JWT_SECRET` | Access token signing — `openssl rand -base64 32` |
| `AUTH_JWT_REFRESH_SECRET` | Refresh token signing (must differ) |
| `AUTH_SESSION_SECRET` | Session cookies — `openssl rand -base64 32` |

### IaC secrets

Cloud auth uses OIDC (no static credentials). Only additional secret:

| Secret | Description |
|--------|-------------|
| `TF_VAR_database_password` | PostgreSQL password |

Other backend secrets are stored directly in cloud secret stores (not Terraform-managed).

## Required Variables

### Terraform state backends

| Variable | Example |
|----------|---------|
| `AWS_TF_STATE_BUCKET` | `my-tf-state-bucket` |
| `AWS_TF_STATE_REGION` | `us-east-1` |

### Cloud provider identifiers

| Variable | Example |
|----------|---------|
| `TF_VAR_app_unique_id` | `oauth2-app` |
| `TF_VAR_image_tag` | `latest` (optional) |
| `AWS_IAM_ROLE_ARN` | `arn:aws:iam::123456789012:role/github-actions-iac` |
