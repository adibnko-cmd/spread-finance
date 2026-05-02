-- ═══════════════════════════════════════════════════════════════════
-- 012 — Forum, Notifications, Actualités plateforme
-- ═══════════════════════════════════════════════════════════════════

-- ─── FORUM THREADS ───────────────────────────────────────────────────

CREATE TABLE forum_threads (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain           text        NOT NULL DEFAULT 'general'
                               CHECK (domain IN ('finance','maths','dev','pm','ml','general')),
  title            text        NOT NULL CHECK (char_length(title) BETWEEN 5 AND 200),
  content          text        NOT NULL CHECK (char_length(content) BETWEEN 10 AND 5000),
  is_pinned        boolean     DEFAULT false,
  is_locked        boolean     DEFAULT false,
  is_deleted       boolean     DEFAULT false,
  vote_count       integer     DEFAULT 0,
  post_count       integer     DEFAULT 0,
  view_count       integer     DEFAULT 0,
  last_activity_at timestamptz DEFAULT now(),
  created_at       timestamptz DEFAULT now()
);

-- ─── FORUM POSTS (replies) ───────────────────────────────────────────

CREATE TABLE forum_posts (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id   uuid        REFERENCES forum_threads(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content     text        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 3000),
  is_deleted  boolean     DEFAULT false,
  is_solution boolean     DEFAULT false,
  vote_count  integer     DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ─── FORUM VOTES ─────────────────────────────────────────────────────

CREATE TABLE forum_votes (
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('thread','post')),
  target_id   uuid NOT NULL,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, target_type, target_id)
);

-- Trigger: maintain vote_count on threads / posts
CREATE OR REPLACE FUNCTION update_forum_vote_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'thread' THEN
      UPDATE forum_threads SET vote_count = vote_count + 1 WHERE id = NEW.target_id;
    ELSE
      UPDATE forum_posts SET vote_count = vote_count + 1 WHERE id = NEW.target_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'thread' THEN
      UPDATE forum_threads SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.target_id;
    ELSE
      UPDATE forum_posts SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.target_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_forum_vote_count
AFTER INSERT OR DELETE ON forum_votes
FOR EACH ROW EXECUTE FUNCTION update_forum_vote_count();

-- Trigger: maintain post_count + last_activity_at on thread
CREATE OR REPLACE FUNCTION update_thread_stats()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_threads
    SET post_count = post_count + 1, last_activity_at = now()
    WHERE id = NEW.thread_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_threads
    SET post_count = GREATEST(post_count - 1, 0)
    WHERE id = OLD.thread_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_thread_stats
AFTER INSERT OR DELETE ON forum_posts
FOR EACH ROW EXECUTE FUNCTION update_thread_stats();

-- RLS — forum_threads
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "threads_read" ON forum_threads
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "threads_insert" ON forum_threads
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "threads_update_own" ON forum_threads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "threads_update_admin" ON forum_threads
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- RLS — forum_posts
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_read" ON forum_posts
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "posts_insert" ON forum_posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "posts_update_own" ON forum_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "posts_update_thread_author" ON forum_posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM forum_threads t
      WHERE t.id = forum_posts.thread_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "posts_update_admin" ON forum_posts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- RLS — forum_votes
ALTER TABLE forum_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "votes_read"   ON forum_votes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "votes_insert" ON forum_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "votes_delete" ON forum_votes FOR DELETE USING (auth.uid() = user_id);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────

CREATE TABLE notifications (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type       text        NOT NULL CHECK (type IN (
    'forum_reply','forum_vote','badge_unlocked','new_content','streak_reminder','competition','other'
  )),
  actor_id   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  title      text        NOT NULL,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_read"   ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notif_insert" ON notifications FOR INSERT WITH CHECK (true);

-- ─── PLATFORM NEWS ────────────────────────────────────────────────────

CREATE TABLE platform_news (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title        text        NOT NULL,
  content      text        NOT NULL,
  type         text        NOT NULL DEFAULT 'general'
                           CHECK (type IN ('feature','content','event','maintenance','general')),
  link         text,
  emoji        text        DEFAULT '📢',
  is_published boolean     DEFAULT false,
  published_at timestamptz,
  created_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE platform_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_read_published" ON platform_news
  FOR SELECT USING (is_published = true);

CREATE POLICY "news_admin_all" ON platform_news
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
