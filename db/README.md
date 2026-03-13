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

## Supabase Stage-1

- Supabase Postgres 初始化脚本：
  - [`db/supabase/0000_core.sql`](/Users/dk/scene-pilot/db/supabase/0000_core.sql)
  - [`db/supabase/0001_public_rpc_bridge.sql`](/Users/dk/scene-pilot/db/supabase/0001_public_rpc_bridge.sql)
  - [`db/supabase/0002_legal_consents.sql`](/Users/dk/scene-pilot/db/supabase/0002_legal_consents.sql)
- 执行方式：
  - 在 Supabase SQL Editor 按顺序执行两份 SQL。
- 发布与配置说明：
  - [`docs/supabase-cloudflare-stage1-runbook.md`](/Users/dk/scene-pilot/docs/supabase-cloudflare-stage1-runbook.md)
  - [`docs/supabase-env-matrix.md`](/Users/dk/scene-pilot/docs/supabase-env-matrix.md)
