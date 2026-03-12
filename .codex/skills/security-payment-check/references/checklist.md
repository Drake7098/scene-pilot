# Payment Security Checklist

Required:

1. Webhook signature verification
2. Event-level dedupe for webhook replay
3. Transaction-level idempotent upsert
4. Credit ledger idempotency key validation
5. Subscription status sync and downgrade safety

Recommended:

- replay window validation by timestamp
- audit trail with provider event ID, transaction ID, and user ID
- monthly grant idempotency tied to billing period key
