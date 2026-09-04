# Deploy CloudCompare AI on Railway

This moves the backend off Render (which keeps sleeping / crash-looping on the
free tier) to **Railway**, which keeps long-running services alive. The Vercel
frontend stays as the primary UI and simply points its `/api` proxy at the new
Railway backend URL.

> **Cost note:** Railway has a small trial credit, then the **Hobby** plan
> (~$5/mo, pay-as-you-go per CPU/RAM/egress). Unlike Render's free tier,
> Railway does **not** sleep your service — which is exactly what fixes the
> intermittent 502s.

## What's in this repo for Railway

| File | Purpose |
|---|---|
| `railway.json` (root) | Backend: build via `Dockerfile.render` (Docker), healthcheck `/api/test`, restart on failure. |
| `cloudcompare-frontend/railway.json` | Frontend preview: Nixpacks build, served by `serve.mjs`. |
| `cloudcompare-frontend/serve.mjs` | Minimal SPA static server that respects Railway's `PORT`. |
| `RenderDatabaseConfig.java` | Converts Railway's `postgres://DATABASE_URL` → JDBC URL + TLS. |

## 1. Deploy the backend (Spring Boot + Postgres)

### Install the CLI & log in
```bash
npm install -g @railway/cli
railway login
```

### Create a project and link it
From the repo root (`~/CLOUD-COMPARE-AI`):
```bash
railway init        # create a new project (name it, e.g. cloudcompare-ai)
```

### Add the Postgres database, then add the web service
Using the **Railway dashboard** (easiest and most visual):
1. Click **+ New → Database → PostgreSQL**. Rename it `Postgres` (so the
   reference variable below matches) or note its name.
2. Click **+ New → Service → GitHub** and pick this repo, OR use the CLI:
   ```bash
   railway add postgresql
   railway service   # create/choose the backend web service
   ```

### Set environment variables on the backend service
In the backend service → **Variables** tab, add:

| Key | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference variable — auto-injects the Postgres connection string; rename `Postgres` to your DB service name if different) |
| `JWT_SECRET` | a long random string, e.g. `openssl rand -hex 64` |
| `GROK_API_KEYS` | your Groq API key (optional; leave blank for mock data) |
| `CORS_ALLOWED_ORIGINS` | `https://cloud-compare-ai-flax.vercel.app` |

`PORT` and `DATABASE_URL` resolve automatically. `server.port=${PORT:8080}` in
`application.properties` makes Spring Boot bind to Railway's injected port.

### Deploy
```bash
railway up          # from repo root — builds Dockerfile.render and starts it
railway domain      # prints your backend URL, e.g. https://something.up.railway.app
railway logs        # follow logs; confirm "CloudCompare AI Engine is active"
```

Health check path is `/api/test` (set in `railway.json`), so Railway marks the
deploy healthy and won't kill a slow cold start (timeout 300s).

## 2. Point the Vercel frontend at the new backend

Update `cloudcompare-frontend/vercel.json` so the `/api` proxy targets the
Railway backend URL, then push to `main`:

```json
"rewrites": [
  { "source": "/api/:path*", "destination": "https://something.up.railway.app/api/:path*" },
  { "source": "/api/:path*/", "destination": "https://something.up.railway.app/api/:path*/" },
  { "source": "/(.*)", "destination": "/index.html" }
]
```

Vercel redeploys automatically. You should also delete the `VITE_API_BASE`
variable if you ever set one (the proxy handles routing now).

## 3. (Optional) Frontend preview on Railway

Keeps Vercel as the primary frontend, but gives you a Railway-hosted copy to
compare against.
```bash
cd cloudcompare-frontend
railway init        # or link to a new service
railway variables set VITE_API_BASE=https://something.up.railway.app
railway up
railway domain
```
The static build is served by `serve.mjs` on Railway's `PORT`. Set
`VITE_API_BASE` to the backend URL so the preview can talk to the API.

## Verify the migration worked
- `https://your-app.up.railway.app/api/test` → `{"success":true,"status":"ok"}`
- Vercel frontend → **Compare Services** returns ranked providers (API now goes
  through the Railway backend).
- **Sign up → redeploy/restart the Railway service → log back in** with the same
  credentials. Success means Postgres persistence is wired.

## Troubleshooting
- **"Failed to start" / connection error:** confirm `DATABASE_URL` is set to the
  reference `${{Postgres.DATABASE_URL}}`, and that the Postgres service exists.
  The `sslmode=require` in `RenderDatabaseConfig` handles Railway's TLS.
- **Health check fails / deployment shown as crashed:** check `railway logs` for
  the port. Spring Boot must bind to `PORT`. It's set via `server.port=${PORT:8080}`.
- **CORS errors:** make sure `CORS_ALLOWED_ORIGINS` on Railway contains your
  Vercel origin exactly (no trailing slash).
