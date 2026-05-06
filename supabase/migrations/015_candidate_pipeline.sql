-- ═══════════════════════════════════════════════════════════════
-- 015 — Pipeline candidat : statuts + seuil de validation
-- ═══════════════════════════════════════════════════════════════

-- Statut de décision RH sur chaque résultat de candidat
ALTER TABLE candidate_results
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'
  CHECK (status IN ('pending', 'retained', 'rejected'));

-- Note interne RH (optionnel)
ALTER TABLE candidate_results
  ADD COLUMN IF NOT EXISTS hr_note text;

-- Score minimum requis sur le test (seuil de validation automatique)
ALTER TABLE candidate_tests
  ADD COLUMN IF NOT EXISTS pass_score integer
  CHECK (pass_score IS NULL OR (pass_score >= 0 AND pass_score <= 100));
