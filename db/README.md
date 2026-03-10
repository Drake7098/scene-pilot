# Local Billing DB (D1)

This project uses Cloudflare D1 via `wrangler.toml` binding `DB`.

## Init local DB

```bash
npm run db:init:local
```

## Run migrations only

```bash
npm run db:migrate:local
```

## Seed products only

```bash
npm run db:seed:local
```

## Ad-hoc query

```bash
npm run db:query:local -- "SELECT code, kind, price_amount FROM products;"
```

## Notes

- If `npx wrangler` is not available in your environment, install it:

```bash
npm i -D wrangler
```

- Local D1 is used for development only. Production should run the same schema with non-local D1.
