-- Default billing products
INSERT INTO products (code, kind, name, provider, provider_price_id, credits_amount, monthly_credit_grant, price_amount, currency, active)
VALUES
  ('credit_100', 'credit_pack', '100 credits / $3', 'paddle', COALESCE(NULL, ''), 100, NULL, 3, 'USD', 1),
  ('credit_500', 'credit_pack', '500 credits / $12', 'paddle', COALESCE(NULL, ''), 500, NULL, 12, 'USD', 1),
  ('credit_2000', 'credit_pack', '2000 credits / $40', 'paddle', COALESCE(NULL, ''), 2000, NULL, 40, 'USD', 1),
  ('pro_monthly', 'subscription', 'Pro Monthly', 'paddle', COALESCE(NULL, ''), NULL, 500, 12, 'USD', 1)
ON CONFLICT(code) DO UPDATE SET
  kind = excluded.kind,
  name = excluded.name,
  provider = excluded.provider,
  credits_amount = excluded.credits_amount,
  monthly_credit_grant = excluded.monthly_credit_grant,
  price_amount = excluded.price_amount,
  currency = excluded.currency,
  active = 1;

