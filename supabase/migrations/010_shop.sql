-- ═══════════════════════════════════════════════════════════════════
-- 010_shop.sql — Boutique Cash Game
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS shop_purchases (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id     text        NOT NULL,
  cash_spent  int         NOT NULL CHECK (cash_spent > 0),
  purchased_at timestamptz DEFAULT now() NOT NULL,
  expires_at  timestamptz,
  metadata    jsonb       DEFAULT '{}'::jsonb
);

ALTER TABLE shop_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own shop_purchases"
  ON shop_purchases FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shop_purchases"
  ON shop_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Vue : solde disponible (gagné - dépensé)
CREATE OR REPLACE VIEW user_cash_balance AS
  SELECT
    u.id AS user_id,
    COALESCE(earned.total, 0) - COALESCE(spent.total, 0) AS balance
  FROM auth.users u
  LEFT JOIN (
    SELECT user_id, SUM(cash_earned)::int AS total FROM cash_log GROUP BY user_id
  ) earned ON earned.user_id = u.id
  LEFT JOIN (
    SELECT user_id, SUM(cash_spent)::int AS total FROM shop_purchases GROUP BY user_id
  ) spent ON spent.user_id = u.id;
