-- ═══════════════════════════════════════════════════════════════════
-- SPREAD FINANCE — Migration 005 : Likes publics
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE public.content_likes (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('chapter', 'article')),
  content_slug TEXT NOT NULL,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_slug)
);

CREATE INDEX idx_likes_content ON public.content_likes(content_type, content_slug);
CREATE INDEX idx_likes_user    ON public.content_likes(user_id);

ALTER TABLE public.content_likes ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire (pour afficher les compteurs)
CREATE POLICY "Anyone can read likes"
  ON public.content_likes FOR SELECT USING (true);

-- Seul l'utilisateur peut insérer/supprimer ses propres likes
CREATE POLICY "Users can insert own likes"
  ON public.content_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.content_likes FOR DELETE USING (auth.uid() = user_id);
