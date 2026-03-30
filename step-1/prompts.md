# Prompts to grow step-1 into step-2

- Add a Playwright e2e test project under web/e2e-tests with a single test that verifies the home page loads and shows "Hello, Next.js!". Use `@playwright/test` and configure it for Chromium only, with `BASE_URL` from env var defaulting to `http://localhost:3000`.
- Add a Dockerfile for the e2e test container at Dockerfiles.d/web-e2e-tests/Dockerfile. Use `node:24` as the base image, install Chromium system dependencies and Playwright browsers, set `PLAYWRIGHT_BROWSERS_PATH=/usr/local/ms-playwright`, and create a non-root user matching host UID/GID.
- Add a `web-e2e-tests` service to compose.yaml that builds from web/e2e-tests using the Dockerfiles.d/web-e2e-tests/Dockerfile, depends on the web service being healthy, runs `pnpm install && pnpm test`, and is gated behind an `e2e-tests` profile. Set `BASE_URL=http://web:3000`.
- Add a healthcheck to the web service in compose.yaml so the e2e test container can wait for it to be ready. Use a Node.js TCP check on port 3000.
