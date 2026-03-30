# Prompts to grow step-0 into step-1

- Create a minimal Next.js App Router app under web/app/ with TypeScript. Include: `app/layout.tsx` (root layout with html/body), `app/page.tsx` (home page showing "Hello, Next.js!"), `package.json` (next 16.x, react 19.x, react-dom 19.x, typescript 6.x, @types/node, @types/react), `tsconfig.json` (moduleResolution: bundler, jsx: react-jsx, next plugin, include .next/types), `next.config.js` (reactStrictMode: true, allowedDevOrigins: ['web']), `next-env.d.ts`, and `.gitignore` (node_modules, .next, out, etc.).
- Create a web dev Dockerfile at Dockerfiles.d/web/Dockerfile based on `node:24-bookworm-slim`. Install `git` via apt-get, enable corepack, install `npm-check-updates` and `sort-package-json` globally. Create a developer user matching host UID/GID args (remove the default node user first, then create with groupadd/useradd). Prepare pnpm as the developer user. Clear the default entrypoint.
- Create a compose.yaml with a `web` service that builds from web/app using Dockerfiles.d/web/Dockerfile, runs `pnpm install && pnpm dev`, maps port 3000, mounts the project root as a volume, sets `PNPM_HOME` for persistent pnpm store, and loads `.env` via `env_file`.
- Create .example.env with commented-out `UID` and `GID` variables (Linux only, not needed on macOS).
- Create a .dockerignore file to exclude node_modules, .git, .next, and other build artifacts.
- Create a .gitignore file to exclude node_modules, .env, .secrets.env, .pnpm-store, and other common patterns.
- Create a README.md with project title, prerequisites (Docker), quick start instructions (`cp .example.env .env && docker compose up`), URL table (localhost:3000), and a project structure tree.
