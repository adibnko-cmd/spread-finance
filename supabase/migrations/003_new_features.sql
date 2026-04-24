-- ══════════════════════════════════════════════════════════════════════
-- SPREAD FINANCE — Migration 003 : Nouvelles fonctionnalités
-- Jobs, Admin, Streak tracking, Email logs
-- ══════════════════════════════════════════════════════════════════════

-- 1. Colonne is_admin sur profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Table des offres d'emploi
CREATE TABLE IF NOT EXISTS jobs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  company        TEXT NOT NULL,
  location       TEXT DEFAULT 'Paris, France',
  type           TEXT CHECK (type IN ('cdi', 'cdd', 'stage', 'alternance', 'freelance')) DEFAULT 'cdi',
  domain_slug    TEXT,
  salary_min     INTEGER,
  salary_max     INTEGER,
  description    TEXT,
  requirements   TEXT[],
  tags           TEXT[],
  apply_url      TEXT,
  is_active      BOOLEAN DEFAULT true,
  posted_at      TIMESTAMPTZ DEFAULT now(),
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Lecture pour tous les utilisateurs authentifiés (offres actives)
DROP POLICY IF EXISTS "jobs_read_authenticated" ON jobs;
CREATE POLICY "jobs_read_authenticated" ON jobs
  FOR SELECT TO authenticated
  USING (is_active = true);

-- CRUD complet pour les admins
DROP POLICY IF EXISTS "jobs_admin_all" ON jobs;
CREATE POLICY "jobs_admin_all" ON jobs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 3. Table des logs d'emails (évite les doublons d'envoi)
CREATE TABLE IF NOT EXISTS email_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email_type     TEXT NOT NULL,  -- 'welcome', 'chapter_validated', 'quiz_passed', 'streak_reminder', 'subscription_changed'
  sent_at        TIMESTAMPTZ DEFAULT now(),
  metadata       JSONB
);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_logs_user_read" ON email_logs;
CREATE POLICY "email_logs_user_read" ON email_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "email_logs_service_insert" ON email_logs;
CREATE POLICY "email_logs_service_insert" ON email_logs
  FOR INSERT WITH CHECK (true);

-- 4. Index pour performances streak
CREATE INDEX IF NOT EXISTS idx_activity_log_user_date
  ON activity_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_xp_log_user_source
  ON xp_log (user_id, source_type, earned_at DESC);

-- 5. Index pour content_flags
CREATE INDEX IF NOT EXISTS idx_content_flags_user_type
  ON content_flags (user_id, flag_type);

-- 6. Permettre aux utilisateurs FREE d'utiliser les favoris
-- (on modifie la logique dans l'API, pas la BDD)
-- La table content_flags est déjà accessible en RLS pour user_id = auth.uid()
