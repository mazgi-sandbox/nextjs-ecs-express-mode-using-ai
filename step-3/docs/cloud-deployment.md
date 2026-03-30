# Cloud Deployment

Deploy the web service to AWS.

## Deployment methods

There are two ways to deploy:

- **Manual (Terraform CLI)** — Follow the [AWS ECS Express Mode](cloud-deployment-aws.md) instructions
- **CI/CD (GitHub Actions)** — Automate deployment via GitHub Actions. See [CI / GitHub Actions](ci.md)

## Production images

Before deploying, build the production Docker image:

```sh
docker build \
  -f Dockerfiles.d/web-build/Dockerfile \
  -t myregistry/web:latest \
  web/app
```

Push to ECR before deploying. See the [AWS deployment guide](cloud-deployment-aws.md) for registry authentication and image push commands.

## Terraform commands

All commands run via Docker Compose with `-chdir`. The `init` command requires `-backend-config` to inject the state backend location:

```sh
docker compose --profile=iac run --rm iac terraform -chdir=aws init \
  -backend-config="bucket=<bucket>" -backend-config="region=<region>"
docker compose --profile=iac run --rm iac terraform -chdir=aws apply -var-file=terraform.tfvars
docker compose --profile=iac run --rm iac terraform -chdir=aws destroy -var-file=terraform.tfvars
```

## Provider guide

- [AWS ECS Express Mode](cloud-deployment-aws.md)
