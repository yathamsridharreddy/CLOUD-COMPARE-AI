# Render liveness fix: stop health-check HTTP 429 responses

## Root cause

The previous Render setting was `healthCheckPath: /api/test`.
`RateLimitFilter` is a servlet filter applied to every request whose URI starts
with `/api`. It maintains a shared, per-client-IP counter with a limit of
**50 requests per 15 minutes**, using the first `X-Forwarded-For` address when
present, otherwise `getRemoteAddr()`.

Consequently, `GET /api/test` consumes the same quota as other API requests.
The 51st request within that IP's window is rejected by
`RateLimitFilter.doFilter()` with **HTTP 429**, before the controller executes.
Marking `/api/test` as `permitAll()` in Spring Security does not bypass a
separate servlet rate-limiting filter. A restart clears the in-memory counters,
which explains how probes can pass again until the same quota is exhausted.

`JwtAuthorizationFilter` does not generate 429. The health controller does not
call the AI provider; provider failures and controller exception handling are
not the source of this health-check 429. No port or PostgreSQL change is needed
for this counter/health-check interaction.

The code identifies the failing path and counter rule; the exact production
probe IP/cadence would require request logs. Regression tests exercise this
case locally rather than flooding the production API.

## Change made

```text
GET https://cloudcompare-ai-api.onrender.com/health
HTTP 200
Content-Type: text/plain

OK
```

- `HealthController` returns a constant `OK`. It has no collaborators and makes
  no database, JWT, AI-provider, or other external-service calls.
- Spring Security permits **only GET `/health`** as a new public route.
- `JwtAuthorizationFilter.shouldNotFilter()` skips that exact GET path, even
  when an Authorization header is supplied. It does not parse the token or
  query `CustomUserDetailsService`/`UserRepository` for a health probe.
- `RateLimitFilter` explicitly bypasses that probe before resolving the client
  IP or reading/updating its quota. Other API requests still have the original
  limit; health requests do not reset their counters either.
- `render.yaml` uses `/health` for Render's continuous HTTP health checks.
- The existing GitHub keep-alive workflow is deliberately unchanged in this
  commit: the Arena GitHub connection cannot update Actions workflows. That
  scheduled ping is separate from Render's HTTP health-check configuration.
  An owner with workflow-write permission can optionally change its target
  from `/api/test` to `/health` later; that edit is not required for this fix.

This is **process liveness**, not database/AI-provider readiness. The existing
application still initializes JPA and its database normally during startup.
The endpoint itself performs no database query once the application is running.

## What is preserved

- `server.port=${PORT:8080}` is unchanged. Render's `PORT=10000` continues to work;
  neither the port nor Docker startup settings are changed by this fix.
- PostgreSQL connection configuration, schema policy, stored users, password
  hashing, JWT signing/validation, and the existing session policy are unchanged.
- Comparison/chat APIs still require authentication and retain rate limiting.
- Existing login/signup routes and CORS rules for `/api/**` are unchanged.
- `/api/test` retains its existing JSON response for compatibility, **and is
  still rate limited**. It must no longer be Render's continuous liveness probe.
- Vercel's `/api/*` rewrite, both frontend implementations, and their request
  URLs are unchanged. `/health` is a Render endpoint; no Vercel `/health` rewrite
  is required. If another external monitor uses `/api/test`, configure that
  monitor to use the backend's `/health` instead.

## Verify before deploying

Use a **full JDK 21** and **Maven 3.9.x** with Maven Central access.
Run verification in a development/test shell without production `DATABASE_URL`
or `SPRING_DATASOURCE_*` variables: the existing test profile uses H2 and a
`create-drop` schema policy, and must never be pointed at a production database.

```bash
java -version
mvn -version
mvn -B clean verify
```

The existing Unix `mvnw` requires a wrapper JAR that is not tracked in this
repository, so the commands above use installed Maven, as `Dockerfile.render`
already does. No wrapper, build dependency, or compiler setting is changed.

New regression coverage includes:

- Unauthenticated `/health` returns `200` and `OK`.
- Authorization headers do not cause JWT parsing or user/database access there.
- Repeated health probes do not consume the 50-request API quota.
- `/health` remains successful after `/api/test` has exhausted that same IP's
  quota and returned 429; other API requests remain limited.
- JWT handling remains enabled for non-health paths and methods.
- Comparison/chat routes remain protected, valid JWT access still works, and
  allowed/disallowed frontend origins keep their existing CORS behavior.

Static parsing/configuration checks are not a substitute for `mvn clean verify`.
If dependencies cannot be downloaded, the Java build/tests are not verified;
do not interpret that infrastructure failure as a passing build.

## Roll out without deleting anything

1. Apply the health-fix files to the existing local repository. They do not
   require a new Vercel project, Render service, database, or signing secret.
2. Run the build/tests and inspect the changes on your Mac. Push to `main`
   **yourself** only after verification succeeds. If you fast-forward your local
   `main` from the transfer branch, the fix commit already exists and no extra
   commit is needed. Keep the transfer branch until the fix is safely on remote
   `main`; the local build and branch transfer do not themselves deploy to Render.
3. Let Render deploy the new code and sync its Blueprint. If Blueprint Auto Sync
   is disabled (or the service is manually configured), set **Settings -> Health
   Check Path** to **`/health`** when the new endpoint is available. Verify this
   dashboard setting even when `render.yaml` has been updated.
4. Once the new deployment is ready, check the backend directly:

   ```bash
   curl --fail-with-body --show-error --include --max-time 120 \
     https://cloudcompare-ai-api.onrender.com/health
   ```

   Expect HTTP 200 and `OK`, with no Authorization header. A 403/404 usually
   means the deployed code/settings are not the expected version/path; a 502
   still needs Render runtime/events inspection. Do not change ports blindly.
5. Verify an existing account can log in from
   `https://cloud-compareai.vercel.app` and use comparison/chat APIs. Monitor
   Render Events across repeated probe intervals for recurrence of health-check
   429s. Ordinary API 429s can still occur legitimately after the existing limit.

**Do not delete deployments or reset the database to apply this fix.**
