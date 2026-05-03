-- ═══════════════════════════════════════════════════════════════════
-- 013 — Tests candidats B2B
-- ═══════════════════════════════════════════════════════════════════

-- Tests créés par l'entreprise
CREATE TABLE candidate_tests (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  enterprise_id uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title         text        NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  description   text,
  token         text        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  questions     jsonb       NOT NULL DEFAULT '[]',
  domains       text[]      DEFAULT '{}',
  time_limit    integer,    -- minutes, null = illimité
  question_count integer    NOT NULL DEFAULT 10,
  is_active     boolean     DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

-- Résultats par candidat (insertions publiques via API + service role)
CREATE TABLE candidate_results (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id         uuid        REFERENCES candidate_tests(id) ON DELETE CASCADE NOT NULL,
  candidate_name  text        NOT NULL,
  candidate_email text        NOT NULL,
  score           integer     NOT NULL CHECK (score BETWEEN 0 AND 100),
  correct_answers integer     NOT NULL,
  total_questions integer     NOT NULL,
  time_seconds    integer     NOT NULL DEFAULT 0,
  completed_at    timestamptz DEFAULT now()
);

-- Index
CREATE INDEX idx_candidate_tests_enterprise ON candidate_tests(enterprise_id);
CREATE INDEX idx_candidate_tests_token      ON candidate_tests(token);
CREATE INDEX idx_candidate_results_test     ON candidate_results(test_id);

-- RLS — candidate_tests
ALTER TABLE candidate_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tests_enterprise_select" ON candidate_tests
  FOR SELECT USING (auth.uid() = enterprise_id);

CREATE POLICY "tests_enterprise_insert" ON candidate_tests
  FOR INSERT WITH CHECK (auth.uid() = enterprise_id);

CREATE POLICY "tests_enterprise_update" ON candidate_tests
  FOR UPDATE USING (auth.uid() = enterprise_id);

CREATE POLICY "tests_enterprise_delete" ON candidate_tests
  FOR DELETE USING (auth.uid() = enterprise_id);

-- RLS — candidate_results
ALTER TABLE candidate_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "results_enterprise_select" ON candidate_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM candidate_tests ct
      WHERE ct.id = candidate_results.test_id
        AND ct.enterprise_id = auth.uid()
    )
  );

-- Les résultats sont insérés via service role (page publique sans auth)
CREATE POLICY "results_service_insert" ON candidate_results
  FOR INSERT WITH CHECK (true);
