# Attachment Migrator

Migrates file attachments from one Odoo instance to another. Handles employee (`hr.employee`) and contact (`res.partner`) attachments with progress tracking, retry, and duplicate resolution.

## What it does

- **Lists employees/contacts** with their attachment count from the source Odoo
- **Downloads attachments** from source Odoo to local disk
- **Queues upload jobs** via BullMQ (Redis-backed) to the destination Odoo
- **Matches records by name** — looks up the destination Odoo for a record with the same name to link the attachment (`res_id`)
- **Supports manual duplicate resolution** — if multiple destination records share the same name, the job pauses and a UI tab lets you pick which one to link to
- **Idempotent** — each uploaded attachment stores `description = 'migrated_from:{source_id}'`; re-running skips already-migrated files
- **Progress bar** with live SSE updates showing uploaded/failed/duplicate counts
- **Dead Letter Queue** — failed jobs are listed with error messages and can be retried individually or all at once

## Prerequisites

- Node.js 20+
- Redis (for BullMQ)
- Access to both source and destination Odoo instances via XML-RPC
- Nginx or another reverse proxy (optional — the Express server can serve the built frontend directly)

## Setup

```bash
# Backend
cd backend
cp .env.example .env
# edit .env with your Odoo credentials
npm install
npm start

# Frontend (separate repo, served via nginx or Express static)
cd ../frontend
npm install
npm run build
```

## Architecture

```
POST /api/auth/login          → returns Basic auth token (stored in localStorage)
GET  /api/list/employees      → employees with attachment_count + attachment_ids
GET  /api/list/contacts       → contacts with attachment_count + attachment_ids
POST /api/migrate/employees/:id → starts migration, returns { sessionId, total }
POST /api/migrate/contacts/:id  → starts migration, returns { sessionId, total }
GET  /api/progress/sse/:sessionId → SSE stream of real-time progress
GET  /api/progress/:sessionId   → current progress snapshot
GET  /api/dlq/failed           → list failed jobs
POST /api/dlq/retry/:jobId     → retry one failed job
POST /api/dlq/retry-all        → retry all non-duplicate failed jobs
GET  /api/dlq/duplicates       → list pending duplicate resolutions
POST /api/dlq/resolve-duplicate → resolve a duplicate, retry with chosen dest ID
```

## Queue flow

1. **Download** — source Odoo's `ir.attachment.datas` base64 is decoded and written to `downloads/{res_id}/{id}_{name}`
2. **Queue** — each file gets a BullMQ job in the `attachment-migration` queue
3. **Upload** — worker reads the file from disk, searches destination by name, and creates `ir.attachment` with the matched `res_id`
4. **Cleanup** — file is deleted from `downloads/` after successful upload
5. **Idempotency** — destination attachment stores `description = 'migrated_from:{source_id}'`; subsequent runs skip it

## Disclaimer

This tool is intended to run on your local machine even though it can connect to remote Odoo instances via https. As such, authentication and security features are minimal. To deploy this on the server, you must harden the application by implementing proper authentication, rate limiting, and input validation.
This project is provided for free and the developer takes no responsibility for any data loss or damage caused by its use, proper or otherwise.

### Scope gaps

- **Data migration beyond attachments** — no contacts, employees, or any other Odoo records are created or modified
- **Attachment binary transformation** — files are downloaded and uploaded as-is; no resizing, format conversion, or thumbnail generation
- **Incremental sync** — no tracking of what changed since the last run; it migrates the current state
- **Archived/missing destination records** — if no destination record matches by name, the job fails and goes to the DLQ for manual handling
- **Multi-model support** — only `hr.employee` and `res.partner` are handled. Attachments linked to other models (`project.task`, `account.move`, `sale.order`, etc.) are not migrated
- **Cross-model record matching** — matching is purely by `name`. There is no fallback to email, reference, or external ID mapping

### Production-hardening gaps

- **No HTTPS** — the Express server runs plain HTTP. Credentials are sent Base64-encoded (not encrypted) over the wire. A reverse proxy (nginx) must terminate TLS
- **No session expiry or token revocation** — the auth token is the literal username:password, Base64-encoded, stored in localStorage. It never expires and cannot be revoked without changing the password
- **No rate limiting** — the login endpoint has no brute-force protection
- **No audit logging** — login successes and failures are not logged. Job activity is only visible via console output
- **No health check endpoint** — no `/health` or `/readyz` for load balancers or container orchestrators
- **No graceful shutdown** — SIGTERM/SIGINT are not handled. In-flight uploads may be interrupted without cleanup
- **No process supervisor** — the application is expected to run via `node index.js`. No systemd unit, Dockerfile, or PM2 config is provided
- **No structured logging** — all output is `console.log` / `console.error` with no log levels, JSON formatting, or transport to a central sink (ELK, Datadog, etc.)
- **No connection pooling limits** — the Odoo XML-RPC client and Redis connections are unbounded. Under heavy load, file descriptors may exhaust
- **No request timeout on Odoo create calls** — `ir.attachment.create` for large files can block the worker indefinitely. The execute wrapper has a 25s timeout for reads, but the create itself has no timeout
- **No retry budget per job** — the BullMQ worker will retry indefinitely on infrastructure errors (Redis outage, network blip). No circuit breaker or backoff cap
- **In-memory duplicate state** — pending duplicate resolutions live in a `Map` and are lost on restart. The failed jobs remain in BullMQ, but the dropdown choices disappear
- **No cleanup of stale sessions** — progress sessions (`progressService.js`) accumulate in memory with no TTL or eviction
