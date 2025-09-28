# Getting Started

This document powers the vector store ingestion demo. It summarizes the major steps to spin up the boilerplate:

1. Run `pnpm bootstrap` to provision dependencies, containers, and the database.
2. Launch the apps with `pnpm dev`.
3. Update `.env` with provider keys to unlock LLM, voice, auth, and payments integrations.
4. Sync docs into the vector store via `pnpm tsx scripts/ingest.ts --path docs/knowledge-base`.
