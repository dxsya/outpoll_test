# Security Rules

## Threat Model

This is a public read-only dashboard. It consumes untrusted public API responses and exposes no private user credentials. Treat every remote response, URL parameter, category label, and market title as untrusted input.

## Secrets and Environment

- Never commit API keys, private credentials, tokens, or secret headers.
- Public API base URLs may use `NEXT_PUBLIC_*` only when they are genuinely safe to expose. Prefer constants for public endpoints when no configuration is needed.
- Never put server-only secrets in `NEXT_PUBLIC_*` variables.
- Do not log authorization headers, raw tokens, full request URLs containing secrets, or complete external payloads.
- Keep `.env*` files out of version control except a sanitized `.env.example`.

## External Data

- Validate external responses with Zod or equivalent type guards before accessing fields.
- Bound pagination, array sizes, numeric values, and timestamps to prevent accidental resource exhaustion.
- Reject `NaN`, infinities, negative volumes, malformed dates, and unexpected platform values.
- Normalize strings before using them as labels, IDs, query parameters, or filenames.
- Render market/category text as text. Do not use `dangerouslySetInnerHTML` for API content.

## Requests and Cancellation

- Keep external requests in `src/lib/api/`.
- Use HTTPS endpoints in production.
- Forward React Query's `AbortSignal` and cancel obsolete requests when filters change.
- Do not construct request URLs by concatenating unchecked user input. Use `URL` and `URLSearchParams` with validated values.
- Handle CORS and rate limits explicitly; do not bypass browser security with unsafe proxies.

## URL and Client State

- Validate every URL parameter and fall back to safe defaults.
- Do not put secrets, access tokens, or sensitive personal data in the URL.
- Zustand state must not contain credentials or server response caches.
- Exported CSV data must contain only the intended public dashboard fields.

## Rendering and Dependencies

- Avoid `dangerouslySetInnerHTML`, dynamic script injection, and unreviewed third-party scripts.
- Keep dependency additions minimal and inspect packages that process external data.
- Do not disable TypeScript, ESLint, CSP-related protections, or browser security checks to make a feature work.
- Never treat a market title, category, or API field as executable content.
