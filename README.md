# Full-Stack AI App Boilerplate

This repository is a production-grade starter kit for building AI-enabled SaaS products across web and mobile clients. It combines a Turborepo monorepo, shared UI packages, infrastructure primitives, and batteries-included developer tooling so you can clone, configure, and ship in minutes.

## Key Capabilities

- **Apps**: Next.js web app, Expo mobile app, admin console, and docs site.
- **Shared Packages**: UI kits, Prisma database layer, authentication, API routers, Stripe billing, LLM + voice clients, chat state management, analytics, email templates, and utilities.
- **Infrastructure**: Postgres with `pgvector`, Redis, Auth.js, Stripe Billing, OpenAI & Anthropic adapters, voice integrations, UploadThing/S3 uploads, Resend emails, PostHog + Sentry analytics.
- **Developer Experience**: Turborepo + pnpm, TypeScript everywhere, Zod validation, tRPC + OpenAPI, CI/CD pipelines, feature flagging, seeded demo data, and comprehensive docs.

Refer to `docs/` and per-package READMEs for setup instructions, environment variables, and architecture details.

## Getting Started

1. Run `pnpm bootstrap` to install dependencies, provision Docker services, apply migrations, and seed demo data.
2. Fill in provider credentials inside `.env` (copied from `.env.example` during bootstrap).
3. Launch all apps locally with `pnpm dev` (ensure Docker Desktop or the Docker daemon is running).
4. Ingest docs into the vector store as needed with `pnpm tsx scripts/ingest.ts --path docs/knowledge-base`.

## Repository Layout

```
apps/
  web/       # Next.js 15 application (App Router)
  mobile/    # Expo React Native app with EAS updates
  admin/     # Admin console for operations & support
  docs/      # Developer documentation site
packages/
  ui/            # Web design system (Tailwind + shadcn/ui)
  ui-native/     # React Native design system (NativeWind)
  config/        # Shared config (Tailwind, ESLint, TS)
  db/            # Prisma schema, migrations, seeders
  auth/          # Auth.js adapters, guards, middleware
  api/           # tRPC routers + REST/OpenAPI handlers
  payments/      # Stripe wrappers, webhooks, entitlements
  llm/           # LLM provider adapters, prompt tooling
  voice/         # Voice UX modules (ASR/TTS/WebRTC)
  chat/          # Chat state, message schema, persistence
  analytics/     # PostHog, Sentry, optional analytics
  email/         # React Email templates + Resend wrappers
  utils/         # Shared helpers & utilities
scripts/
  bootstrap.ts   # Environment setup (deps, Docker, migrations, seeding)
  migrate.ts     # SQL schema migration utility
  seed.ts        # Database seeding
  ingest.ts      # Knowledge base ingestion
  stripe-dev.sh  # Stripe CLI helpers
```

## Status

The initial commit includes the monorepo scaffold and documentation stubs. Feature implementations, database schema, and integrations should be filled in as you build your product on top of this template.
