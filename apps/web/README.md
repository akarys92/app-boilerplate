# Web App (Next.js)

This Next.js 15 application is the primary web client. It consumes the shared packages for UI, API access, and authentication.

## Scripts

- `pnpm dev` – Start the Next.js dev server.
- `pnpm build` – Build for production.
- `pnpm lint` – Run lint rules shared via `@app/config`.

## Features

- App Router with server actions.
- Tailwind CSS + shadcn/ui components from `@app/ui`.
- Auth.js v5 integration via `@app/auth`.
- tRPC + REST handlers from `@app/api`.
- Stripe checkout + billing UI from `@app/payments`.
- Chat + voice demos when enabled via feature flags.
