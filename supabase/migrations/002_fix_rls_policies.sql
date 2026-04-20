-- ═══════════════════════════════════════════════════════════════════
-- SPREAD FINANCE — Correctif RLS Policies
-- Fix : profiles utilise "id" et non "user_id"
-- À coller dans Supabase SQL Editor APRÈS le schéma initial
-- ═══════════════════════════════════════════════════════════════════

-- 1. Supprimer les policies incorrectes sur profiles (si créées)
DROP POLICY IF EXISTS "Users can view own profiles"   ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- 2. Recréer les policies correctes pour profiles (clé = "id")
CREATE POLICY "Users can view own profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profiles"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can delete own profiles"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- 3. Policies pour toutes les autres tables (user_id)
-- chapter_progress
DROP POLICY IF EXISTS "Users can view own chapter_progress"   ON public.chapter_progress;
DROP POLICY IF EXISTS "Users can insert own chapter_progress" ON public.chapter_progress;
DROP POLICY IF EXISTS "Users can update own chapter_progress" ON public.chapter_progress;
DROP POLICY IF EXISTS "Users can delete own chapter_progress" ON public.chapter_progress;

CREATE POLICY "Users can view own chapter_progress"   ON public.chapter_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chapter_progress" ON public.chapter_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chapter_progress" ON public.chapter_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chapter_progress" ON public.chapter_progress FOR DELETE USING (auth.uid() = user_id);

-- quiz_results
DROP POLICY IF EXISTS "Users can view own quiz_results"   ON public.quiz_results;
DROP POLICY IF EXISTS "Users can insert own quiz_results" ON public.quiz_results;
DROP POLICY IF EXISTS "Users can update own quiz_results" ON public.quiz_results;
DROP POLICY IF EXISTS "Users can delete own quiz_results" ON public.quiz_results;

CREATE POLICY "Users can view own quiz_results"   ON public.quiz_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiz_results" ON public.quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quiz_results" ON public.quiz_results FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quiz_results" ON public.quiz_results FOR DELETE USING (auth.uid() = user_id);

-- content_flags
DROP POLICY IF EXISTS "Users can view own content_flags"   ON public.content_flags;
DROP POLICY IF EXISTS "Users can insert own content_flags" ON public.content_flags;
DROP POLICY IF EXISTS "Users can update own content_flags" ON public.content_flags;
DROP POLICY IF EXISTS "Users can delete own content_flags" ON public.content_flags;

CREATE POLICY "Users can view own content_flags"   ON public.content_flags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own content_flags" ON public.content_flags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own content_flags" ON public.content_flags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own content_flags" ON public.content_flags FOR DELETE USING (auth.uid() = user_id);

-- xp_log
DROP POLICY IF EXISTS "Users can view own xp_log"   ON public.xp_log;
DROP POLICY IF EXISTS "Users can insert own xp_log" ON public.xp_log;
DROP POLICY IF EXISTS "Users can update own xp_log" ON public.xp_log;
DROP POLICY IF EXISTS "Users can delete own xp_log" ON public.xp_log;

CREATE POLICY "Users can view own xp_log"   ON public.xp_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own xp_log" ON public.xp_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own xp_log" ON public.xp_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own xp_log" ON public.xp_log FOR DELETE USING (auth.uid() = user_id);

-- user_badges
DROP POLICY IF EXISTS "Users can view own user_badges"   ON public.user_badges;
DROP POLICY IF EXISTS "Users can insert own user_badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can update own user_badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can delete own user_badges" ON public.user_badges;

CREATE POLICY "Users can view own user_badges"   ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_badges" ON public.user_badges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_badges" ON public.user_badges FOR DELETE USING (auth.uid() = user_id);

-- user_flashcards
DROP POLICY IF EXISTS "Users can view own user_flashcards"   ON public.user_flashcards;
DROP POLICY IF EXISTS "Users can insert own user_flashcards" ON public.user_flashcards;
DROP POLICY IF EXISTS "Users can update own user_flashcards" ON public.user_flashcards;
DROP POLICY IF EXISTS "Users can delete own user_flashcards" ON public.user_flashcards;

CREATE POLICY "Users can view own user_flashcards"   ON public.user_flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_flashcards" ON public.user_flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_flashcards" ON public.user_flashcards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_flashcards" ON public.user_flashcards FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Shared flashcards viewable by authenticated users"
  ON public.user_flashcards FOR SELECT
  USING (is_shared = true OR auth.uid() = user_id);

-- activity_log
DROP POLICY IF EXISTS "Users can view own activity_log"   ON public.activity_log;
DROP POLICY IF EXISTS "Users can insert own activity_log" ON public.activity_log;
DROP POLICY IF EXISTS "Users can update own activity_log" ON public.activity_log;
DROP POLICY IF EXISTS "Users can delete own activity_log" ON public.activity_log;

CREATE POLICY "Users can view own activity_log"   ON public.activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity_log" ON public.activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activity_log" ON public.activity_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own activity_log" ON public.activity_log FOR DELETE USING (auth.uid() = user_id);

-- subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions"   ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view own subscriptions"   ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subscriptions" ON public.subscriptions FOR DELETE USING (auth.uid() = user_id);

-- work_sessions
DROP POLICY IF EXISTS "Users can view own work_sessions"   ON public.work_sessions;
DROP POLICY IF EXISTS "Users can insert own work_sessions" ON public.work_sessions;
DROP POLICY IF EXISTS "Users can update own work_sessions" ON public.work_sessions;
DROP POLICY IF EXISTS "Users can delete own work_sessions" ON public.work_sessions;

CREATE POLICY "Users can view own work_sessions"   ON public.work_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own work_sessions" ON public.work_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own work_sessions" ON public.work_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own work_sessions" ON public.work_sessions FOR DELETE USING (auth.uid() = user_id);

-- Confirmation
SELECT 'RLS policies créées avec succès ✓' AS status;
