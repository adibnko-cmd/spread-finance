-- ═══════════════════════════════════════════════════════════════════
-- SPREAD FINANCE — Migration 004 : Évaluations (QCM Long Format)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS evaluation_results (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain_slug      TEXT        NOT NULL,
  part             INTEGER     NOT NULL,
  part_title       TEXT,
  difficulty_level INTEGER     NOT NULL CHECK (difficulty_level IN (1, 2, 3)),
  score            INTEGER     NOT NULL CHECK (score >= 0 AND score <= 100),
  total_questions  INTEGER     NOT NULL,
  correct_answers  INTEGER     NOT NULL,
  passed           BOOLEAN     NOT NULL DEFAULT false,
  time_seconds     INTEGER,
  answers          JSONB,
  attempted_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE evaluation_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own evaluation results"
  ON evaluation_results FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own evaluation results"
  ON evaluation_results FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_eval_results_user      ON evaluation_results(user_id);
CREATE INDEX idx_eval_results_domain    ON evaluation_results(domain_slug, part, difficulty_level);
CREATE INDEX idx_eval_results_attempted ON evaluation_results(attempted_at DESC);
