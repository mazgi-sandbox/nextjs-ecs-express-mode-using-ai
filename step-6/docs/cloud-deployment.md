# Cloud Deployment

Deploy the backend and web services to AWS.

## Deployment methods

There are two ways to deploy:

- **Manual (Terraform CLI)** — Follow the [AWS ECS Express Mode](cloud-deployment-aws.md) instructions
- **CI/CD (GitHub Actions)** — Automate deployment via GitHub Actions. See [CI / GitHub Actions](ci.md)

## Production images

Before deploying, build production Docker images:

```sh
# Build backend image
docker build \
  -f Dockerfiles.d/backend-build/Dockerfile \
  -t myregistry/backend:latest \
  backend

# Build web image
docker build \
  -f Dockerfiles.d/web-build/Dockerfile \
  -t myregistry/web:latest \
  web/app
```

The resulting images contain compiled output and pruned dependencies. Push them to ECR before deploying. See the [AWS deployment guide](cloud-deployment-aws.md) for registry authentication and image push commands.

## Secrets

Terraform creates empty secret containers in AWS Secrets Manager; 8 of the 9 must be populated manually before deploying. See [Secrets Management](secrets.md) for the full list, naming conventions, and CLI commands.

## Terraform commands

All commands run via Docker Compose with `-chdir`. The `init` command requires `-backend-config` to inject the state backend location:

```sh
docker compose --profile=iac run --rm iac terraform -chdir=aws init \
  -backend-config="bucket=<bucket>" -backend-config="region=<region>"
docker compose --profile=iac run --rm iac terraform -chdir=aws apply -var-file=terraform.tfvars
docker compose --profile=iac run --rm iac terraform -chdir=aws destroy -var-file=terraform.tfvars
```

## Using staging environment variables

To use staging-specific files (`.staging.env` and `.staging.secrets.env`), pass them via `--env-file`:

```sh
docker compose --env-file .staging.env --env-file .staging.secrets.env \
  --profile=iac run --rm iac \
  terraform -chdir=aws apply
```

## Provider guide

- [AWS ECS Express Mode](cloud-deployment-aws.md)
