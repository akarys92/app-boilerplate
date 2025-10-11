# Getting Started

This document powers the knowledge-base ingestion demo. It summarises the major steps to explore the boilerplate:

1. Run `pnpm bootstrap` to install dependencies, create the JSON datastore, seed demo data, and index docs.
2. Launch the dashboard with `pnpm dev --filter @app/web`.
3. Toggle features by editing `FEATURE_FLAGS` in `.env`.
4. Update markdown in `docs/knowledge-base/` and re-run `pnpm kb:ingest` to refresh search results.
