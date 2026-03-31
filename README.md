# nextjs-ecs-express-mode-using-ai

A step-by-step example project for developing a Next.js app on AWS ECS Express Mode, built incrementally using AI. Each step adds a layer of functionality, and each step's `prompts.md` contains the AI prompts used to grow it into the next step.

## Steps

| Step | Description | What's included |
|------|-------------|-----------------|
| [step-0](step-0/) | Empty starting point | Only `prompts.md` with instructions to bootstrap step-1 |
| [step-1](step-1/) | Next.js app with Docker Compose | Minimal Next.js App Router app, web dev Dockerfile, compose.yaml |
| [step-2](step-2/) | Add Playwright E2E tests | Playwright e2e test project, e2e test Dockerfile, compose e2e-tests profile |
| [step-3](step-3/) | Add AWS IaC and CI/CD | Terraform (VPC, ECR, ECS Express for web), GitHub Actions workflows, IaC Dockerfile |
| [step-4](step-4/) | Add NestJS backend | Minimal NestJS API, backend Dockerfile, ECS Express backend service, web depends on backend |
| [step-5](step-5/) | Add Prisma + Items CRUD | PostgreSQL with Prisma, Items model and CRUD API/UI, RDS in Terraform, Secrets Manager |
| [step-6](step-6/) | Add user authentication | Email/password signup/signin, JWT tokens, TOTP MFA, auth-gated items, i18n, settings page |
| [step-99-final](step-99-final/) | Full application | Email verification, password reset, mail service (SMTP/Mailpit), comprehensive e2e tests |

## How to use

Each step directory is a self-contained project. To run any step locally:

```sh
cd step-N
cp .example.env .env        # adjust if needed
docker compose up
```

To understand how each step was built, read the `prompts.md` file in the *previous* step. For example, `step-0/prompts.md` contains the prompts that produce step-1.

## Technology stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript 6
- **Backend**: NestJS 11, Prisma 7, PostgreSQL 17
- **Infrastructure**: AWS ECS Express Mode, Terraform, GitHub Actions
- **Testing**: Playwright (E2E), Jest (backend E2E)
- **Auth**: JWT + TOTP MFA (step-6+), email verification (step-99)
- **Dev environment**: Docker Compose, pnpm

## License

[MIT](LICENSE)
