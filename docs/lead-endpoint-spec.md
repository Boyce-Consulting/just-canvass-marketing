# Lead Capture Endpoint — Backend Spec

Outbound contract the marketing-site quote form (`src/js/main.js`, quote-form module)
expects. Build a route that satisfies this exactly.

## Endpoint

```
POST https://api.justcanvass.ca/api/public/lead
Content-Type: application/json
```

Public (unauthenticated) — anyone on the marketing site can POST. No secrets in the
browser; all keys/DB creds stay server-side.

## Request body (JSON)

The frontend sends exactly these fields:

| Field        | Type   | Required | Notes |
|--------------|--------|----------|-------|
| `name`       | string | yes      | 1–120 chars |
| `email`      | string | yes      | valid email, ≤254 chars |
| `postcode`   | string | yes      | Canadian postal code, normalized `A1A 1A1` (uppercase, single space) |
| `position`   | string | yes      | enum: `Mayor` \| `Council` \| `Trustee` \| `Other` |
| `district`   | string | yes      | 1–120 chars, free text (e.g. `Ward 3, Milton`) |
| `gclid`      | string | no       | Google Ads click id — may be empty. May instead be a `wbraid`/`gbraid` value. Store verbatim. |
| `source_url` | string | no       | full page URL the form was submitted from |
| `event_id`   | string | yes      | dedup key (`lead_<uuid>`). Store it; reuse as the Meta CAPI `event_id` / Google `transaction_id` when you upload server-side, so the browser event and the server event collapse into one. |

Example:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "postcode": "L9T 1A1",
  "position": "Council",
  "district": "Ward 3, Milton",
  "gclid": "EAIaIQobChMI...",
  "source_url": "https://www.justcanvass.ca/?gclid=EAIaIQobChMI...#quote"
}
```

> The form also has a honeypot field (`company`) but the frontend **deletes it before
> sending**, so the backend will not receive it. Keep your own bot defenses anyway.

## Validation (server-side — never trust the client)

- `name`, `district`: trim; reject empty; cap length (e.g. 120).
- `email`: RFC-ish validation; lowercase + trim.
- `postcode`: validate against Canadian pattern, then normalize to `A1A 1A1`:
  `^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?\d[ABCEGHJ-NPRSTV-Z]\d$` (case-insensitive).
- `position`: must be one of the four enum values; reject anything else.
- Ignore/strip any unexpected fields. Cap total body size (e.g. 8 KB).
- Use parameterized queries / an ORM — never string-interpolate into SQL or email headers.

## Responses

The frontend only checks `res.ok` (HTTP 2xx). Return:

| Status | When | Body |
|--------|------|------|
| `200`  | Lead stored | `{ "success": true, "id": "<lead id>" }` |
| `400`  | Validation failed | `{ "success": false, "errors": { "email": "invalid", ... } }` |
| `429`  | Rate limited | `{ "success": false, "error": "rate_limited" }` |
| `5xx`  | Server error | `{ "success": false, "error": "server_error" }` |

On any non-2xx the form shows: "Something went wrong — please email
hello@justcanvass.ca". So only return 200 once the lead is durably saved.

## CORS

Browser will send a preflight `OPTIONS` for the JSON POST. Respond to both:

```
Access-Control-Allow-Origin: https://www.justcanvass.ca
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

Allow both apex and www if the site is served on both:
`https://justcanvass.ca` and `https://www.justcanvass.ca`. Echo the matching origin
(don't use `*` once you add any credentials).

> ⚠️ **Send exactly ONE `Access-Control-Allow-Origin` header** — on BOTH the `OPTIONS`
> preflight and the `POST` response. Observed bug (2026-06-21): the route added
> `Access-Control-Allow-Origin: https://www.justcanvass.ca` while a **global nginx/middleware
> CORS layer also added `Access-Control-Allow-Origin: *` + `Access-Control-Allow-Credentials: true`**.
> Two values → the browser blocks the request with
> *"The 'Access-Control-Allow-Origin' header contains multiple values '…, *', but only one
> is allowed"*, the preflight fails, and the lead never reaches the route (curl still shows
> 200 because curl ignores CORS). Fix: don't set CORS in two places — disable the global
> `add_header` for this path, or drop the route-level header and rely on the global one.
> The form sends NO cookies/Authorization, so a single plain `Access-Control-Allow-Origin: *`
> would also work for it.

## Abuse protection

- **Rate limit** per IP (e.g. 5/min, 20/hour) → 429.
- **Size cap** on the request body.
- **Cloudflare Turnstile (recommended, not yet wired on frontend):** when added, the form
  will send a `cf-turnstile-response` token; verify it server-side via
  `https://challenges.cloudflare.com/turnstile/v0/siteverify` before storing. Reject on
  failure. (Say the word and I'll add the widget to the form.)

## Suggested storage (leads table)

| Column        | Notes |
|---------------|-------|
| `id`          | PK |
| `created_at`  | server timestamp (UTC) |
| `name`        | |
| `email`       | normalized lowercase |
| `email_sha256`| hex SHA-256 of normalized email — for Enhanced Conversions / Meta CAPI upload |
| `postcode`    | normalized `A1A 1A1` |
| `position`    | enum |
| `district`    | |
| `gclid`       | nullable — for Google Ads Offline Conversion Import |
| `source_url`  | nullable |
| `ip`          | for rate limiting / abuse audit |
| `user_agent`  | optional |
| `uploaded_google` | bool/timestamp — has this lead been uploaded to Google Ads yet |
| `uploaded_meta`   | bool/timestamp — uploaded to Meta CAPI yet |

Storing `gclid` **and** `email_sha256` keeps both conversion-upload paths open (click-id
import or Enhanced Conversions for Leads) without re-plumbing later.

## Conversion association (downstream, not part of this route)

Because the form lives on the same origin (not an iframe), the "sale" event already fires
client-side on submit. For accuracy under ad-blockers/iOS, also upload server-side:
- **Google:** Enhanced Conversions for Leads (hashed email) and/or Offline Conversion
  Import (gclid) → conversion action `AW-8285196019/<LABEL>`.
- **Meta:** Conversions API `Lead` event with hashed email, pixel `1879916476013854`.

These run as a periodic job over rows where `uploaded_* IS NULL` — out of scope for the
POST route itself, but the schema above supports them.
