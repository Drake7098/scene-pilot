# API Hardening Rules

Protected endpoint classes:

1. Generation endpoints (`/api/generation/*`)
2. Billing endpoints (`/api/billing/*`)
3. Checkout and billing operations (`/api/paddle/checkout`, `/api/paddle/customer-portal`)

Required checks:

- `auth`: protected endpoints enforce explicit auth middleware
- `schema`: request payload has explicit invalid/missing guard
- `cors_guard`: request origin checked against allowlist
- `cors_preflight`: OPTIONS handler uses central CORS helper

Risk checks (warning by default):

- `rate_limit`: endpoint has throttling guard, anti-replay strategy, or external WAF rule reference

False-positive handling:

- Webhook endpoints may skip auth but must keep signature verification + idempotency.
