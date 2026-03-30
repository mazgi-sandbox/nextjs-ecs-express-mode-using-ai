# Secrets Management

AWS Secrets Manager stores the 4 backend secrets. Terraform creates the secret containers (empty) and automatically populates `DATABASE_URL`. The remaining 3 secrets must be populated manually or via CI **before** deploying.

## Secrets list

| # | Environment variable | Description | How to generate / obtain |
|---|----------------------|-------------|--------------------------|
| 1 | `DATABASE_URL` | PostgreSQL connection string | **Auto-managed by Terraform** |
| 2 | `AUTH_JWT_SECRET` | JWT access token signing secret | `openssl rand -base64 32` |
| 3 | `AUTH_JWT_REFRESH_SECRET` | JWT refresh token signing secret | `openssl rand -base64 32` (must differ from `AUTH_JWT_SECRET`) |
| 4 | `AUTH_SESSION_SECRET` | Express session secret | `openssl rand -base64 32` |

> **Note:** `DATABASE_URL` is the only secret whose value is computed by Terraform (from the database endpoint). All others require manual input.

## Secret names

### AWS Secrets Manager

Defined in `iac/aws/secrets-manager.tf`. Names use the pattern `{app_unique_id}/backend/{ENV_VAR}`.

| Secret name | Terraform resource |
|---|---|
| `oauth2-app/backend/DATABASE_URL` | `aws_secretsmanager_secret.backend_database_url` |
| `oauth2-app/backend/AUTH_JWT_SECRET` | `aws_secretsmanager_secret.backend_jwt_secret` |
| `oauth2-app/backend/AUTH_JWT_REFRESH_SECRET` | `aws_secretsmanager_secret.backend_jwt_refresh_secret` |
| `oauth2-app/backend/AUTH_SESSION_SECRET` | `aws_secretsmanager_secret.backend_session_secret` |

Populate via CLI:

```sh
aws secretsmanager put-secret-value \
  --secret-id "oauth2-app/backend/AUTH_JWT_SECRET" \
  --secret-string "$(openssl rand -base64 32)"
```

## Deployment workflow

1. **`terraform apply`** — creates secret containers (empty), the database, ECR repos, ECS services, and auto-populates `DATABASE_URL`
2. **Populate secrets** — set the 3 manually-managed secrets via CLI or cloud console (see commands above)

## Access control

| Provider | Mechanism | Permissions |
|---|---|---|
| AWS | IAM policy on ECS execution role | `secretsmanager:GetSecretValue` for all 4 secrets |
