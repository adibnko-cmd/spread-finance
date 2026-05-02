-- ═══════════════════════════════════════════════════════════════════
-- 006_cash_game.sql — Monnaie virtuelle + Compétition hebdomadaire
-- ═══════════════════════════════════════════════════════════════════

-- Table cash_log (like xp_log but for virtual currency)
CREATE TABLE IF NOT EXISTS cash_log (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_type text        NOT NULL,
  source_id   text,
  cash_earned int         NOT NULL DEFAULT 0 CHECK (cash_earned >= 0),
  earned_at   timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE cash_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own cash_log"
  ON cash_log FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cash_log"
  ON cash_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Table competition_results (leaderboard hebdomadaire — lecture publique)
CREATE TABLE IF NOT EXISTS competition_results (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_id         text        NOT NULL,  -- ex: '2026-W18'
  score           int         NOT NULL DEFAULT 0,
  total_questions int         NOT NULL,
  correct_answers int         NOT NULL,
  time_seconds    int,
  attempted_at    timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, week_id)
);

ALTER TABLE competition_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read competition_results"
  ON competition_results FOR SELECT USING (true);

CREATE POLICY "Users can insert own competition_results"
  ON competition_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- View: total cash par utilisateur
CREATE OR REPLACE VIEW user_cash AS
  SELECT user_id, COALESCE(SUM(cash_earned), 0)::int AS total_cash
  FROM cash_log
  GROUP BY user_id;
