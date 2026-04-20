-- ═══════════════════════════════════════════════════════════════════
-- SPREAD FINANCE — Schéma Base de Données Supabase
-- Version : 1.0 — MVP (Free + Premium)
-- Date : 2026-04-19
-- Stack : PostgreSQL via Supabase
-- ═══════════════════════════════════════════════════════════════════

-- Active les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Pour la recherche full-text

-- ═══════════════════════════════════════════════════════════════════
-- 1. PROFILS UTILISATEURS
-- Étend la table auth.users de Supabase
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE public.profiles (
  id                UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  -- Informations personnelles
  first_name        TEXT,
  last_name         TEXT,
  username          TEXT UNIQUE,
  avatar_url        TEXT,
  bio               TEXT,
  -- Informations professionnelles (optionnel)
  current_position  TEXT,
  company           TEXT,
  years_experience  SMALLINT CHECK (years_experience >= 0 AND years_experience <= 60),
  linkedin_url      TEXT,
  -- Préférences
  preferred_language TEXT NOT NULL DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'en', 'es', 'de', 'pt')),
  notifications_email BOOLEAN NOT NULL DEFAULT true,
  -- Onboarding
  onboarding_goal   TEXT CHECK (onboarding_goal IN ('learn', 'certify', 'career', 'project', 'team', 'curiosity')),
  onboarding_domain TEXT CHECK (onboarding_domain IN ('finance', 'maths', 'dev', 'pm', 'ml')),
  onboarding_level  TEXT CHECK (onboarding_level IN ('beginner', 'intermediate', 'advanced')),
  onboarding_done   BOOLEAN NOT NULL DEFAULT false,
  -- Abonnement
  plan              TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'platinum')),
  plan_started_at   TIMESTAMPTZ,
  plan_ends_at      TIMESTAMPTZ,
  stripe_customer_id TEXT UNIQUE,
  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_profiles_plan ON public.profiles(plan);
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- ═══════════════════════════════════════════════════════════════════
-- 2. PROGRESSION UTILISATEUR
-- Suivi par chapitre (venant de Sanity CMS via sanity_chapter_id)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE public.chapter_progress (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Référence vers Sanity CMS (slug du chapitre)
  chapter_slug      TEXT NOT NULL,
  domain_slug       TEXT NOT NULL, -- 'finance', 'maths', 'dev', 'pm', 'ml'
  -- Statuts
  status            TEXT NOT NULL DEFAULT 'not_started'
                    CHECK (status IN ('not_started', 'in_progress', 'completed', 'validated')),
  -- validated = quiz passé avec succès (score > 70%)
  read_at           TIMESTAMPTZ, -- première lecture
  completed_at      TIMESTAMPTZ, -- lecture complète
  validated_at      TIMESTAMPTZ, -- quiz réussi
  -- Métriques
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  scroll_percent    SMALLINT NOT NULL DEFAULT 0 CHECK (scroll_percent >= 0 AND scroll_percent <= 100),
  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, chapter_slug)
);

CREATE INDEX idx_chapter_progress_user ON public.chapter_progress(user_id);
CREATE INDEX idx_chapter_progress_domain ON public.chapter_progress(domain_slug);
CREATE INDEX idx_chapter_progress_status ON public.chapter_progress(user_id, status);

-- ═══════════════════════════════════════════════════════════════════
-- 3. RÉSULTATS DE QUIZ
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE public.quiz_results (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Références
  chapter_slug      TEXT NOT NULL,
  domain_slug       TEXT NOT NULL,
  -- Quiz info
  quiz_level        SMALLINT NOT NULL CHECK (quiz_level IN (1, 2, 3)), -- 1=facile, 2=moyen, 3=avancé
  -- Résultats
  score             SMALLINT NOT NULL CHECK (score >= 0 AND score <= 100), -- pourcentage
  total_questions   SMALLINT NOT NULL,
  correct_answers   SMALLINT NOT NULL,
  time_seconds      INTEGER, -- durée du quiz
  passed            BOOLEAN NOT NULL DEFAULT false, -- score >= 70
  -- Timestamps
  attempted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_results_user ON public.quiz_results(user_id);
CREATE INDEX idx_quiz_results_chapter ON public.quiz_results(user_id, chapter_slug);
CREATE INDEX idx_quiz_results_domain ON public.quiz_results(user_id, domain_slug);

-- ═══════════════════════════════════════════════════════════════════
-- 4. FLAGS DE CONTENU (Favoris, À revoir, Acquis...)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE public.content_flags (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Contenu ciblé
  content_type      TEXT NOT NULL CHECK (content_type IN ('chapter', 'article', 'quiz', 'flashcard')),
  content_slug      TEXT NOT NULL,
  domain_slug       TEXT,
  -- Type de flag
  flag_type         TEXT NOT NULL CHECK (flag_type IN ('favorite', 'to_review', 'validated', 'to_read')),
  -- Timestamps
  flagged_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_slug, flag_type)
);

CREATE INDEX idx_flags_user ON public.content_flags(user_id);
CREATE INDEX idx_flags_type ON public.content_flags(user_id, flag_type);
CREATE INDEX idx_flags_content ON public.content_flags(user_id, content_type);

-- ═══════════════════════════════════════════════════════════════════
-- 5. GAMIFICATION — XP & NIVEAUX
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE public.xp_log (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Source de l'XP
  source_type       TEXT NOT NULL CHECK (source_type IN (
    'chapter_read',    -- +10 XP
    'chapter_validated', -- +30 XP
    'quiz_level1',     -- +15 XP
    'quiz_level2',     -- +25 XP
    'quiz_level3',     -- +50 XP
    'daily_streak',    -- +20 XP
    'domain_completed' -- +100 XP
  )),
  source_id         TEXT, -- slug du chapitre/quiz
  xp_earned         SMALLINT NOT NULL,
  -- Timestamps
  earned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_xp_log_user ON public.xp_log(user_id);
CREATE INDEX idx_xp_log_earned ON public.xp_log(user_id, earned_at);

-- Vue calculée : XP total par utilisateur
CREATE VIEW public.user_xp AS
SELECT
  user_id,
  SUM(xp_earned) AS total_xp,
  COUNT(*) AS total_actions,
  MAX(earned_at) AS last_activity
FROM public.xp_log
GROUP BY user_id;

-- ═══════════════════════════════════════════════════════════════════
-- 6. BADGES & ACHIEVEMENTS
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE public.user_badges (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_key         TEXT NOT NULL, -- 'first_quiz', 'streak_7', 'domain_finance', etc.
  badge_name        TEXT NOT NULL,
  earned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_key)
);

CREATE INDEX idx_badges_user ON public.user_badges(user_id);

-- ═══════════════════════════════════════════════════════════════════
-- 7. FLASHCARDS PERSONNALISÉES (Premium)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE public.user_flashcards (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Contenu
  title             TEXT NOT NULL,
  content           JSONB NOT NULL DEFAULT '{}', -- structure flexible
  domain_slug       TEXT,
  tags              TEXT[] DEFAULT '{}',
  -- Partage
  is_shared         BOOLEAN NOT NULL DEFAULT false,
  -- Référence source (si issue d'un chapitre Sanity)
  source_chapter_slug TEXT,
  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flashcards_user ON public.user_flashcards(user_id);

-- ═══════════════════════════════════════════════════════════════════
-- 8. HISTORIQUE D'ACTIVITÉ
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE public.activity_log (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Action
  action_type       TEXT NOT NULL CHECK (action_type IN (
    'chapter_opened', 'chapter_completed', 'quiz_started', 'quiz_completed',
    'flashcard_created', 'flag_added', 'flag_removed', 'search_performed',
    'profile_updated', 'subscription_changed'
  )),
  -- Cible
  target_type       TEXT, -- 'chapter', 'article', 'quiz', etc.
  target_slug       TEXT,
  target_title      TEXT,
  -- Métadonnées
  metadata          JSONB DEFAULT '{}',
  -- Session
  session_id        UUID,
  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_user ON public.activity_log(user_id);
CREATE INDEX idx_activity_date ON public.activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_type ON public.activity_log(user_id, action_type);

-- ═══════════════════════════════════════════════════════════════════
-- 9. ABONNEMENTS STRIPE
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE public.subscriptions (
  id                        UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id                   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  -- Stripe IDs
  stripe_subscription_id    TEXT UNIQUE,
  stripe_customer_id        TEXT,
  stripe_price_id           TEXT,
  -- Statut
  status                    TEXT NOT NULL DEFAULT 'inactive'
                            CHECK (status IN ('active', 'inactive', 'past_due', 'canceled', 'trialing')),
  plan                      TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'platinum')),
  -- Dates
  current_period_start      TIMESTAMPTZ,
  current_period_end        TIMESTAMPTZ,
  cancel_at                 TIMESTAMPTZ,
  canceled_at               TIMESTAMPTZ,
  -- Timestamps
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON public.subscriptions(stripe_subscription_id);

-- ═══════════════════════════════════════════════════════════════════
-- 10. SESSIONS DE TRAVAIL
-- Pour tracker le temps passé
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE public.work_sessions (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at          TIMESTAMPTZ,
  duration_seconds  INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER
  ) STORED,
  pages_visited     INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_sessions_user ON public.work_sessions(user_id);
CREATE INDEX idx_sessions_date ON public.work_sessions(user_id, started_at DESC);

-- ═══════════════════════════════════════════════════════════════════
-- TRIGGERS — updated_at automatique
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER flashcards_updated_at
  BEFORE UPDATE ON public.user_flashcards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- TRIGGER — créer un profil automatiquement à l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  -- Créer aussi un enregistrement subscription vide
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- Chaque utilisateur ne voit que ses propres données
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;

-- Policies : profiles (clé primaire = "id", pas "user_id")
CREATE POLICY "Users can view own profiles"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profiles" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete own profiles" ON public.profiles FOR DELETE USING (auth.uid() = id);
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

-- Policies : toutes les autres tables (clé = "user_id")
CREATE POLICY "Users can view own chapter_progress"   ON public.chapter_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chapter_progress" ON public.chapter_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chapter_progress" ON public.chapter_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chapter_progress" ON public.chapter_progress FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own quiz_results"   ON public.quiz_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiz_results" ON public.quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quiz_results" ON public.quiz_results FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quiz_results" ON public.quiz_results FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own content_flags"   ON public.content_flags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own content_flags" ON public.content_flags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own content_flags" ON public.content_flags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own content_flags" ON public.content_flags FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own xp_log"   ON public.xp_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own xp_log" ON public.xp_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own xp_log" ON public.xp_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own xp_log" ON public.xp_log FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own user_badges"   ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_badges" ON public.user_badges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_badges" ON public.user_badges FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own user_flashcards"   ON public.user_flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_flashcards" ON public.user_flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_flashcards" ON public.user_flashcards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_flashcards" ON public.user_flashcards FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Shared flashcards viewable by authenticated users" ON public.user_flashcards FOR SELECT USING (is_shared = true OR auth.uid() = user_id);

CREATE POLICY "Users can view own activity_log"   ON public.activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity_log" ON public.activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activity_log" ON public.activity_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own activity_log" ON public.activity_log FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscriptions"   ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subscriptions" ON public.subscriptions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own work_sessions"   ON public.work_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own work_sessions" ON public.work_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own work_sessions" ON public.work_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own work_sessions" ON public.work_sessions FOR DELETE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════
-- VUES UTILES pour le dashboard
-- ═══════════════════════════════════════════════════════════════════

-- Vue : statistiques complètes d'un utilisateur
CREATE VIEW public.user_stats AS
SELECT
  p.id AS user_id,
  p.plan,
  -- Progression
  COUNT(DISTINCT cp.chapter_slug) FILTER (WHERE cp.status = 'validated') AS chapters_validated,
  COUNT(DISTINCT cp.chapter_slug) FILTER (WHERE cp.status IN ('in_progress', 'completed', 'validated')) AS chapters_seen,
  COUNT(DISTINCT cp.domain_slug) FILTER (WHERE cp.status = 'validated') AS domains_started,
  -- Quiz
  COALESCE(ROUND(AVG(qr.score))::INTEGER, 0) AS avg_quiz_score,
  COUNT(DISTINCT qr.id) FILTER (WHERE qr.passed = true) AS quizzes_passed,
  -- XP
  COALESCE(SUM(x.xp_earned), 0) AS total_xp,
  -- Temps
  COALESCE(SUM(ws.duration_seconds), 0) AS total_time_seconds,
  -- Dernière activité
  MAX(al.created_at) AS last_activity_at
FROM public.profiles p
LEFT JOIN public.chapter_progress cp ON p.id = cp.user_id
LEFT JOIN public.quiz_results qr ON p.id = qr.user_id
LEFT JOIN public.xp_log x ON p.id = x.user_id
LEFT JOIN public.work_sessions ws ON p.id = ws.user_id
LEFT JOIN public.activity_log al ON p.id = al.user_id
GROUP BY p.id, p.plan;

-- ═══════════════════════════════════════════════════════════════════
-- DONNÉES DE TEST (dev uniquement — supprimer en production)
-- ═══════════════════════════════════════════════════════════════════
-- Les données de test sont injectées via seed.sql séparé
-- voir /supabase/seed.sql
