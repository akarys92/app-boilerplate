# Scripts

This folder contains helper scripts that prepare the local development environment.

## `bootstrap.ts`

Sets up the repository from scratch:

```bash
pnpm bootstrap
```

Steps performed:

1. Ensure a `.env` file exists (copied from `.env.example` if missing).
2. Install dependencies with `pnpm install`.
3. Start Docker services (Postgres + Redis) when `docker-compose.yml` is present.
4. Run database migrations and seed demo data.

Flags:

- `--skip-install`, `--skip-docker`, `--skip-db` – skip individual phases.
- `--force-env` – overwrite the existing `.env` file from the template.

## `migrate.ts`

Applies the SQL schema for the demo database.

```bash
pnpm db:migrate
```

Use `pnpm db:migrate -- --reset` to drop existing public tables before reapplying the schema.

## `seed.ts`

Populates the database with deterministic demo entities, a sample chat thread, and knowledge base embeddings generated from `README.md`.

```bash
pnpm db:seed
```

## `ingest.ts`

Ingests Markdown docs into the vector store tables (documents + embeddings). You can point it to any folder containing `.md`/`.mdx` files.

```bash
pnpm tsx scripts/ingest.ts --path docs --dry-run
pnpm tsx scripts/ingest.ts --path docs/knowledge-base
```

The script produces deterministic placeholder embeddings so it runs offline without calling an external LLM.

## `stripe-dev.sh`

Convenience wrapper around the Stripe CLI for forwarding webhooks to the local Next.js API route.

```bash
./scripts/stripe-dev.sh --trigger checkout.session.completed
```

Flags:

- `--forward-to <url>` – override the default webhook URL (`http://localhost:3000/api/webhooks/stripe`).
- `--live` – listen for live-mode events instead of test data.
- `--trigger <event>` – trigger one or more Stripe test events after the listener starts.

Ensure the [Stripe CLI](https://stripe.com/docs/stripe-cli) is installed before running the script.
