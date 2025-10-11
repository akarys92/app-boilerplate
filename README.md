# Full-Stack AI App Boilerplate

Spin up a production-flavoured AI SaaS demo in minutes. This monorepo bundles a Next.js dashboard, Expo mobile shell, shared UI systems, an in-memory datastore, seed scripts, and mocked integrations for auth, payments, chat, voice, analytics, and email. Clone the repo, run a single command, and explore the fully wired experience without touching any code.

## TL;DR

```bash
pnpm bootstrap   # installs deps, prepares the demo datastore, ingests docs
pnpm dev         # runs the Next.js demo dashboard
```

The bootstrap script copies `.env.example`, installs workspace dependencies, creates a JSON datastore under `data/`, seeds demo users/products/messages, and ingests markdown docs into the knowledge base. No Docker or external services are required—the integrations are mocked so everything works out-of-the-box.

## Demo Features

The seeded dashboard highlights the major modules you can extend:

- **Authentication** – A demo founder account with mock session management.
- **Stripe-style billing** – Pricing table, active subscription, and customer portal links.
- **AI chat** – Deterministic assistant that summarises prompts and streams responses.
- **Voice** – Simulated transcription + TTS preview data seeded for the dashboard.
- **Knowledge base** – Markdown is converted into vector-ready embeddings for RAG demos.
- **Analytics & audit logs** – Events and audit entries tracked as you seed and interact.
- **Email** – Resend-style campaign stats plus sample transactional email logging.

All of these modules live in dedicated packages under `packages/` and expose simple TypeScript APIs so you can swap the mocked implementations for real infrastructure when you are ready.

## Repository Layout

```
apps/
  web/       # Next.js dashboard that stitches every module together
  admin/     # Placeholder admin console (wire it up to @app/api when needed)
  docs/      # Static developer docs scaffold
  mobile/    # Expo entry point that consumes the shared UI-native kit
packages/
  analytics/ # Event + audit tracking backed by the JSON datastore
  api/       # Aggregated helpers consumed by the dashboard and admin app
  auth/      # Demo auth/session helpers with deterministic hashing
  chat/      # Chat runtime that calls the lightweight LLM adapter
  config/    # Environment + feature flag loader built on zod
  db/        # File-backed datastore helpers (read/write JSON)
  email/     # Mock email + campaign helpers that touch audit logs
  llm/       # Provider-agnostic chat abstractions (mocked here)
  payments/  # Stripe-style product + checkout helpers
  ui/        # Web design system (unstyled React components with inline styles)
  ui-native/ # React Native counterparts used by the Expo shell
  utils/     # Shared utility helpers (IDs, formatting, math)
  voice/     # Voice session mocks (ASR/TTS)
scripts/
  bootstrap.ts  # Copies envs, installs deps, seeds + ingests demo data
  migrate.ts    # Ensures the JSON datastore exists
  seed.ts       # Seeds demo users, products, chat threads, analytics, voice, email
  ingest.ts     # Converts markdown into the knowledge base entries
```

## Quickstart

1. **Install** – Run `pnpm bootstrap`. Pass `--skip-install` or `--skip-data` if you only need part of the workflow.
2. **Explore** – Start the web demo with `pnpm dev --filter @app/web`. Visit [http://localhost:3000](http://localhost:3000) to explore the dashboard.
3. **Hack** – Modify packages under `packages/` and the dashboard will hot-reload thanks to Next.js transpiling workspace packages.
4. **Scripts** – Re-run `pnpm db:seed` to reset demo data or `pnpm kb:ingest` after editing markdown in `docs/knowledge-base/`.

## Environment

Configuration is controlled through `.env`:

```ini
NODE_ENV=development
DATABASE_FILE=data/database.json
KNOWLEDGE_BASE_FILE=data/knowledge-base.json
DEFAULT_USER_EMAIL=founder@example.com
FEATURE_FLAGS={"voice":true}
```

You can toggle modules by editing `FEATURE_FLAGS` (JSON or comma-separated `flag=true/false`) and reloading the dashboard.

## Extending the Template

- Replace the mocked datastore in `@app/db` with Prisma or your preferred ORM. The rest of the modules only rely on the exported helper functions.
- Swap the `@app/llm` implementation with OpenAI/Anthropic SDK calls. The chat UI will stream whatever you return.
- Wire `@app/payments` to Stripe Checkout + Billing customer portals.
- Expand `apps/admin` and `apps/mobile` using the shared UI systems for a consistent feel.

The goal is to provide an opinionated starting point that demonstrates the complete product surface area (auth, billing, chat, voice, analytics, docs) so you can iterate from a working base instead of building scaffolding from scratch.

