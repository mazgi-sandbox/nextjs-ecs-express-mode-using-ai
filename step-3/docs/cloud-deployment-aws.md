# AWS ECS Express Mode

See [Cloud Deployment](cloud-deployment.md) for production image builds and architecture overview.

## Prerequisites

- An AWS account with appropriate permissions
- AWS CLI installed on the host
- Docker Engine + Docker Compose running (Terraform runs inside a container)

### Authenticate with AWS on the host

The `iac` container mounts `~/.aws` as read-only, so credentials configured on the host are automatically available inside the container.

**Option A — Long-lived credentials (IAM user)**

```sh
aws configure
# Enter your Access Key ID, Secret Access Key, default region, and output format.
# This writes to ~/.aws/credentials and ~/.aws/config.
```

**Option B — SSO / Identity Center**

```sh
aws configure sso
# Follow the prompts to set up an SSO profile.

aws sso login --profile YOUR_PROFILE
```

List available profiles to find the correct name:

```sh
aws configure list-profiles
```

When using an SSO profile, set the `AWS_PROFILE` environment variable so the container picks it up:

```sh
export AWS_PROFILE=YOUR_PROFILE
```

Or add `AWS_PROFILE` to your `.env` file — the `iac` service loads it via `env_file`.

**Verify**

```sh
aws sts get-caller-identity
```

If this returns your account and ARN, the credentials are ready and will be available in the `iac` container.

## 1. Create the Terraform state bucket

```sh
aws s3api create-bucket --bucket YOUR_BUCKET_NAME --region us-east-1
aws s3api put-bucket-versioning --bucket YOUR_BUCKET_NAME \
  --versioning-configuration Status=Enabled
```

Set the bucket name in `.env` as `AWS_TF_STATE_BUCKET` and pass it via `-backend-config` at `terraform init` time (see step 3), so you do not need to edit `versions.tf`.

## 2. Configure variables

```sh
cp iac/aws/terraform.tfvars.example iac/aws/terraform.tfvars
cp iac/aws/ephemeral/terraform.tfvars.example iac/aws/ephemeral/terraform.tfvars
```

Edit `iac/aws/terraform.tfvars`:

- `aws_region` — your AWS region (default: `us-east-1`)

Edit `iac/aws/ephemeral/terraform.tfvars`:

- `image_tag` — container image tag (default: `latest`)

## 3. Create persistent infrastructure and push images

```sh
source .env
docker compose --profile=iac run --rm iac terraform -chdir=aws init \
  -backend-config="bucket=$AWS_TF_STATE_BUCKET" \
  -backend-config="region=$AWS_TF_STATE_REGION"
docker compose --profile=iac run --rm iac terraform -chdir=aws apply -var-file=terraform.tfvars
```

> **Note:** On a fresh AWS account that has never used ECS, the first `terraform apply` may fail because the `AWSServiceRoleForECS` service-linked role does not yet exist. AWS creates this role automatically in the background, so simply re-running `terraform apply` will succeed.

Then build and push the production web image (the registry URL comes from the persistent layer output):

```sh
# Authenticate Docker with ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push web
docker build \
  -f Dockerfiles.d/web-build/Dockerfile \
  -t ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/oauth2-app-web:latest \
  web/app
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/oauth2-app-web:latest
```

The ephemeral layer derives the registry URL from the persistent layer's ECR repository outputs. The `image_tag` variable defaults to `latest`.

## 4. Deploy ephemeral infrastructure

```sh
source .env
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral init \
  -backend-config="bucket=$AWS_TF_STATE_BUCKET" \
  -backend-config="region=$AWS_TF_STATE_REGION"
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral apply -var-file=terraform.tfvars
```

Verify the deployed URLs:

```sh
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral output
```

## 5. Tear down (after testing)

```sh
docker compose --profile=iac run --rm iac terraform -chdir=aws/ephemeral destroy -var-file=terraform.tfvars
```

Persistent ECR repositories remain — images are available for the next test cycle.

## Resources created

| Layer | Resource | Description |
|-------|----------|-------------|
| Persistent | ECR | Docker image repository (web) |
| Persistent | VPC | Custom VPC with public + private subnets across 2 AZs |
| Persistent | Internet Gateway | Public subnet internet access |
| Persistent | Security Groups | Web (3000) |
| Persistent | IAM Roles | ECS task execution role + ECS Express infrastructure role |
| Ephemeral | NAT Gateway | Private subnet outbound access (ECR image pull) |
| Ephemeral | ECS Express (web) | Next.js app on port 3000, auto-scaling 1-2 tasks |

> **Note:** NAT Gateway incurs cost even when idle. Adjust for production use.
