# Worker (no Docker quickstart)

1) Create a `.env` file in the project root (same folder as package.json) with:

```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
AZURE_STORAGE_CONNECTION_STRING=...
AZURE_STORAGE_ACCOUNT_NAME=...
AZURE_STORAGE_ACCOUNT_KEY=...
# Optional when not using Redis from API
RENDER_QUEUE_ENABLED=false
# Optional temp dir
WORK_DIR=%TEMP%
```

2) Install deps:

```
pnpm install
```

3) Run the worker directly:

```
node worker/worker.cjs
```

Notes:
- With `RENDER_QUEUE_ENABLED=false`, the worker will poll Supabase every ~15s for recent `pending` jobs and process them.
- If you enable queueing, set `RENDER_QUEUE_ENABLED=true` and provide `REDIS_URL` (TLS: `rediss://...:6380`).
- Ensure the API host has the same Supabase and Azure envs so it can insert jobs.
