# Free, no-custom-domain password-reset email

This feature uses a Gmail account you own through the **Gmail HTTPS API**. It
requires no paid email domain, no SMTP connection, and no replacement of the
existing CloudCompare account/JWT system. Recipients can use Gmail or other
email providers; only the sending mailbox needs to be Gmail.

**The feature is disabled by default.** Existing login, comparison APIs and
`GET /health` keep working before Gmail is configured. Do not delete/recreate
Render, Vercel, or the database to enable it.

## Cost and limitations

- Google currently provides standard Gmail API use at no additional cost.
  Its published daily billing threshold is 80,000,000 quota units per project;
  `messages.send` costs 100 units. Google also describes possible changes to
  above-threshold billing later in 2026. Check the current policy rather than
  assuming unlimited or permanently unchanged pricing. [3](https://developers.google.com/workspace/gmail/api/reference/quota)
- A personal Gmail account normally limits sending to 500 messages/day, and
  Google may impose anti-abuse/delivery restrictions. This includes your other
  Gmail activity; the application does not reserve a separate allowance. [1](https://support.google.com/mail/answer/22839?hl=en)
- The application allows at most 100 reset-link issuances in a rolling 24-hour
  window, with a 10-minute cooldown per account and a single bounded mail worker
  for the existing single-instance Render setup. A completed reset also sends a
  password-change notification. At most 200 application messages are expected
  per 100 resets. Provider quotas are authoritative; do not treat this as a
  multi-instance quota coordinator or a high-volume email platform.
- The existing per-IP API limiter remains enabled. `/health` remains excluded.
- Free Render blocks outbound SMTP ports 25/465/587; this integration uses HTTPS
  on 443 instead. Do not configure Gmail SMTP/app passwords for this feature.
- Gmail can revoke/expire OAuth refresh tokens. Delivery is not guaranteed:
  monitor the sending account and backend logs, and reauthorize if necessary.
- Your existing Render free PostgreSQL plan remains time-limited independently
  of email sending. Protect your account data and plan its storage separately.

Official references:

- https://developers.google.com/workspace/gmail/api/reference/quota
- https://support.google.com/mail/answer/22839
- https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports

## How recovery works

1. On `login.html`, the user chooses **Forgot password** and enters the same
   email address used to register. Existing exact email matching is preserved.
2. `POST /api/auth/forgot-password` validates the email and accepts a bounded
   background job. Valid addresses receive the same **202** message whether or
   not they are registered/eligible. No account existence or token is exposed.
3. For an eligible account, the worker saves only a SHA-256 digest of a random
   256-bit token in PostgreSQL. The raw bearer token exists only in memory and
   in the email; it expires after **15 minutes**.
4. The email links to the configured website's
   `/reset-password.html#token=...`. The fragment isn't sent in HTTP requests or
   Referer headers. The page removes it from the address bar and never stores it
   in local/session storage. Opening/scanning the link does not consume it.
5. The user enters and confirms a new password. Only the explicit JSON
   `POST /api/auth/reset-password` can change it.
6. A database transaction locks the account row, validates the unused token,
   stores the BCrypt password hash, consumes all outstanding reset links, and
   increments the account's credential version. Replays fail.
7. Previously issued JWTs stop authenticating that account; the user signs in
   again. JWTs from older application versions continue to work for accounts
   whose password has not been reset. A notification is sent after the change;
   email failure cannot undo the committed password change.

The reset-password endpoint does not require an old login JWT, but it **does
require the unguessable, unexpired, unused reset token**. No ordinary password
is sent by email or returned by the API. Comparison/chat authentication and
existing CORS rules remain enabled.

The mail queue is bounded and in memory. A restart can lose queued requests;
202 means **accepted**, not guaranteed delivery. A user can request another link
after the cooldown. A missing configuration or full queue returns 503 for every
address, rather than pretending an unavailable backend sent an email. Network
failures are logged without tokens, passwords, provider response bodies, or
OAuth credentials.

## One-time Google setup (owner only)

Application users do **not** authorize Google or use Google login. Only the owner
connects the sending Gmail account.

1. Choose a Gmail sending account you own (a separate free account is useful).
   Do not use someone else's mailbox or pretend to own a domain.
2. In https://console.cloud.google.com/, create a dedicated project and enable
   **Gmail API**. No paid Workspace subscription, paid domain, or paid compute
   service is required for this low-volume setup. Do not enable unrelated paid
   APIs or request billing/quota increases for this feature.
3. Configure **Google Auth Platform / OAuth consent screen** with truthful app
   details and your support/developer email. Request only this scope:

   ```text
   https://www.googleapis.com/auth/gmail.send
   ```

4. Google has a personal-use verification exception for a limited number of
   OAuth users; this setup uses only your sending account. Comply with Google's
   policies and verification requirements for your actual use. Do not open this
   OAuth client to arbitrary senders, claim verification you do not have, or
   grant broad mailbox-reading/Cloud Platform scopes. If Google requires review
   for your setup, complete it rather than bypassing its restrictions.
5. For unattended use, the OAuth project's publishing status must be **In
   production**, not **Testing**. Testing grants using Gmail scopes normally
   expire after **7 days**. Publishing is distinct from OAuth verification;
   review Google's personal-use exception where applicable. Refresh tokens can
   still be revoked, expire from inactivity, or stop working after changing the
   **sending Gmail account's** password.
6. Create an OAuth client of type **Web application**. To use Google's official
   OAuth Playground for this private, one-time authorization, register this exact
   authorized redirect URI:

   ```text
   https://developers.google.com/oauthplayground
   ```

7. Open that Google-owned Playground page. In its settings, select **Use your
   own OAuth credentials** and enter your client ID and client secret there.
   Do not use the Playground's default client for a persistent production grant.
8. Authorize only `https://www.googleapis.com/auth/gmail.send` using the intended
   sending Gmail account, with offline access. Exchange the authorization code
   for tokens. Save the **refresh token**, not the short-lived access token,
   privately. If no refresh token is returned, check offline-access/consent
   settings and reauthorize. If the project was in Testing, switch it to the
   appropriate Production status and obtain a fresh grant before relying on it.
9. Keep all client secrets and tokens out of chat, Git, screenshots, frontend
   code, browser storage and Vercel. Only authorize an app/client you created
   and recognize. Never share your Gmail password with this application.

Google setup references:

- https://developers.google.com/workspace/gmail/api/guides/sending
- https://developers.google.com/identity/protocols/oauth2
- https://support.google.com/cloud/answer/13464323
- https://developers.google.com/oauthplayground/

## Render environment variables

Configure these on the **existing Render backend service** only:

| Variable | Value |
| --- | --- |
| `PASSWORD_RESET_ENABLED` | `true` after completing Google setup |
| `PASSWORD_RESET_FRONTEND_ORIGIN` | `https://cloud-compareai.vercel.app` (your real HTTPS website origin) |
| `GMAIL_SENDER_EMAIL` | The Gmail account authorized above, or a Gmail-approved send-as alias |
| `GMAIL_CLIENT_ID` | Your Google OAuth client ID |
| `GMAIL_CLIENT_SECRET` | Your Google OAuth client secret |
| `GMAIL_REFRESH_TOKEN` | Your private, long-lived refresh token |

The link origin must be an HTTPS origin with no credentials, query, fragment, or
page path. A trailing slash is accepted/removed. Requests' Host/Origin headers
never determine the emailed link. The mail transport always calls Google's
fixed HTTPS endpoints; it never forwards credentials to a configured third-party
URL.

The existing Blueprint is not given new required secrets, so this optional
feature does not block ordinary deployment. Add the values manually in Render's
Environment settings, save and redeploy. **Do not change PORT, JWT_SECRET,
DATABASE_URL, CORS_ALLOWED_ORIGINS, or the `/health` probe path for this feature.**

No email credentials are needed on Vercel. Its existing repository-root static
output includes the new HTML/CSS/JS page; the existing `/api/*` rewrite handles
both recovery endpoints. Reset-page security headers are included for both
Vercel and Spring Boot.

## Database update

Keep the production schema policy at **`update`**, not `create` or `create-drop`.
Hibernate adds:

- `users.credential_version`, non-null with default `0` (existing users retain
  version zero and their current password hashes).
- `password_reset_tokens`, with token digests, account FK, creation/expiry/use
  timestamps, and indexes for digest lookup, cooldown, retention and quota checks.

No database reset or data replacement is part of this feature. If schema changes
are managed manually, review/apply the equivalent additive migration before
serving reset requests. Monitor deployment logs for schema-permission errors.
Do not roll back to code that ignores credential versions without considering
JWT-secret rotation, because older code would not enforce reset-session revocation.

## Verify before turning email on

Use your existing Java 21/Maven installation in a development shell with no
production database connection variables. The test profile uses H2; never point
it at the live database.

```bash
mvn -B --no-transfer-progress -DskipTests=false -Dmaven.test.skip=false clean verify
node --test scripts/password-reset-ui.test.mjs
```

Java tests include token hashing/expiry/consumption, account cooldown, quota
checks, credential-version JWT revocation, generic recovery responses, login
compatibility, reset CORS/security, and a Gmail HTTP transport test using a local
server. No test needs Google credentials or sends real mail. Java syntax parsing
and JavaScript checks alone do not prove the Java build/test suite passed.

For the real end-to-end check after deployment:

1. Confirm `/health` still responds with `OK`.
2. Request a reset for an account you control. The Gmail sender's **Sent** folder
   and the recipient's inbox/spam should show the email. Do not paste the link
   or token in chat/logs/screenshots.
3. Follow the link, set a strong new password, and sign in. Confirm the old
   password and old JWT no longer work, and that the link cannot be reused.
4. Requesting an unknown email gets the same generic message but sends no mail.
5. Check comparison/chat still work after signing in with the new credentials.

Troubleshooting: 503 means configuration/queue availability; check the Render
values privately. A queued request without delivery requires checking the Gmail
account, authorization and quotas. OAuth `invalid_grant` needs reauthorization.
401/403 provider responses need account/scope/API configuration review; 429s
need time/quota management, not more retries. Use the same registered email
spelling; all send attempts share the Gmail account's other usage and limits.
