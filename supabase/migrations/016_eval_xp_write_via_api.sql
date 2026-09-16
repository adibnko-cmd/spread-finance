-- ═══════════════════════════════════════════════════════════════
-- 016 — SF-EVAL-03 : résultats d'évaluation et XP écrits par l'API seule
-- ═══════════════════════════════════════════════════════════════
-- Avant : avec la clé anon et sa propre session, un utilisateur pouvait
-- INSERT dans evaluation_results et INSERT/UPDATE/DELETE dans xp_log
-- (004_evaluations.sql, 002_fix_rls_policies.sql l.76-78) : score et XP
-- forgeables sans passer par /api/evaluation.
-- Après : l'utilisateur garde la LECTURE de ses lignes ; toute écriture
-- passe par les routes API serveur avec la clé service (adminClient(),
-- SUPABASE_SERVICE_ROLE_KEY — variable serveur, jamais NEXT_PUBLIC_).
-- Routes concernées : /api/evaluation, /api/progress, /api/quiz,
-- /api/quiz/free, /api/quiz/competition (+ /api/cron/streak, déjà en clé service).
-- Idempotente : DROP POLICY IF EXISTS.

-- evaluation_results : lecture conservée, insertion utilisateur retirée
DROP POLICY IF EXISTS "Users insert own evaluation results" ON public.evaluation_results;

-- xp_log : lecture conservée, insertion / modification / suppression retirées
DROP POLICY IF EXISTS "Users can insert own xp_log" ON public.xp_log;
DROP POLICY IF EXISTS "Users can update own xp_log" ON public.xp_log;
DROP POLICY IF EXISTS "Users can delete own xp_log" ON public.xp_log;

-- Vérification après application (doit ne lister que des SELECT) :
-- SELECT tablename, policyname, cmd FROM pg_policies
--  WHERE schemaname = 'public' AND tablename IN ('evaluation_results', 'xp_log');
