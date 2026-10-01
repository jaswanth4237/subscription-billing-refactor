CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  stripe_customer_id VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  base_price NUMERIC(10, 2) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

INSERT INTO users (id, stripe_customer_id) VALUES
  ('user-expired-123', 'cus-expired-123'),
  ('user-active-123', 'cus-active-123')
ON CONFLICT (id) DO NOTHING;

INSERT INTO subscriptions (id, user_id, base_price, expires_at) VALUES
  ('sub-expired-123', 'user-expired-123', 100.00, '2020-01-01T00:00:00Z'),
  ('sub-active-123', 'user-active-123', 100.00, '2099-01-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
