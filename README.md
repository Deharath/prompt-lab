# Prompt Lab

Test, compare, and evaluate prompts across multiple LLM providers with live streaming, rich metrics, and cost tracking — all in one place.

## What It Is

Prompt Lab is a monorepo that provides:

- A web UI for designing and iterating on prompts
- An API for running jobs and streaming results via SSE
- A pluggable evaluation engine with built‑in metrics and provider integrations

Current providers: OpenAI, Google Gemini, Anthropic. Tokens and estimated costs are tracked per job.

## Highlights

- Multi‑provider: OpenAI, Gemini, Anthropic (extensible via a provider interface)
- Live streaming (SSE): token‑level output with cancellation support
- Metrics: readability, structure, quality (precision/recall/F‑score, ROUGE, BLEU), sentiment, keywords, latency, token count
- Prometheus: `/metrics` endpoint + HTTP request histograms/counters
- Database: SQLite via Drizzle ORM; WAL mode and indexes in place
- Safe defaults: rate limiting, request size limits, CORS, optional `helmet`

## Repo Layout

```
prompt-lab/
├── apps/
│   ├── api/   # Express API (SSE, jobs, metrics)
│   └── web/   # React (Vite) frontend
├── packages/
│   ├── evaluation-engine/  # Providers, metrics, DB, services
│   └── shared-types/       # Shared TypeScript contracts
└── scripts/                # DB migrations and utilities
```

## Quick Start (Local)

Prerequisites: Node 18+, pnpm

1. Install deps

```
pnpm install
```

2. Configure environment

```
cp .env.example .env.local
# then edit .env.local with your keys
# OPENAI_API_KEY=...
# GEMINI_API_KEY=...
# ANTHROPIC_API_KEY=...
```

3. Migrate database

```
pnpm migrate
```

4. Run both servers

```
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3000

## API Overview

Base URL: same origin as the API server (default `http://localhost:3000`).

- `POST /jobs`: Create a job (provider, model, prompt, optional params)
- `GET /jobs`: List jobs with filters (limit, offset, status, since)
- `GET /jobs/:id`: Get job by id
- `GET /jobs/:id/stream`: Server‑Sent Events stream (status, token, metrics, done)
- `PUT /jobs/:id/cancel`: Cancel a pending/running job
- `DELETE /jobs/:id`: Delete a job
- `POST /jobs/:id/retry`: Retry a failed job
- `GET /health`, `/health/ready`, `/health/live`, `/health/ping`: Health probes
- `GET /metrics`: Prometheus metrics exposition
- `GET /api/metrics/*`: Explore available metric plugins

Example: create and stream a job with OpenAI

```
curl -s -X POST http://localhost:3000/jobs \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "Summarize: Prompt Lab is an evaluation tool...",
    "provider": "openai",
    "model": "gpt-4o-mini",
    "temperature": 0.2
  }'

# Then stream updates (SSE)
curl -N http://localhost:3000/jobs/<JOB_ID>/stream
```

SSE events you may see:

- `status`: running | evaluating | completed | failed | cancelled
- `token`: partial text chunks as the model streams
- `metrics`: final metrics JSON after completion
- `job-error`: recoverable/application errors
- `done`: end of stream

## Configuration

Copy `.env.example` to `.env.local` and tune as needed:

- `DATABASE_URL`: `sqlite://./db/db.sqlite` by default
- `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`: provider auth
- Rate limits: `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_GLOBAL_MAX`, `RATE_LIMIT_JOBS_MAX`
- Security: `REQUEST_SIZE_LIMIT`, `TRUST_PROXY`
- Features: `WORKER_ENABLED` (toggle background worker mode)

CORS: In development all origins are allowed. For production, set `ALLOWED_ORIGINS` (comma‑separated) to restrict origins.

## Development

Useful root scripts:

- `pnpm dev`: run API and Web together
- `pnpm build`: build all packages
- `pnpm test`: run tests (engine, api, web)
- `pnpm lint` / `pnpm format` / `pnpm tsc`
- `pnpm migrate`: run DB migrations
- `pnpm db:reset`: reset local DB (destructive)
- `pnpm docker:run`: local Docker build and run

Testing stack: Vitest across packages; API E2E test is available; Playwright is included for browser flows.

## Docker

```
docker build -t prompt-lab .
docker run -d -p 3000:3000 \
  -e OPENAI_API_KEY=... \
  -e GEMINI_API_KEY=... \
  -e ANTHROPIC_API_KEY=... \
  prompt-lab
```

## Security & Reliability

- Rate limiting on write endpoints; JSON body size limits
- Optional `helmet` headers in production; request id tagging and structured logging
- Graceful SSE handling with keep‑alives and client disconnect detection
- Sentiment metrics auto‑disabled on low‑memory systems or via env flags

## Contributing

PRs and issues are welcome. If you plan a larger change (new provider, metrics plugin), please open an issue to discuss design and scope first.

## License

MIT — see `LICENSE`.
