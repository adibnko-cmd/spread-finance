-- ═══════════════════════════════════════════════════════════════════
-- SPREAD FINANCE — Migration 011 : Enterprise Members
-- Liaison utilisateurs individuels ↔ comptes entreprise
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.enterprise_members (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  enterprise_id  uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_id        uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role           text        NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_at     timestamptz DEFAULT now() NOT NULL,
  joined_at      timestamptz DEFAULT now(),
  UNIQUE(enterprise_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_enterprise_members_enterprise ON public.enterprise_members(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_members_user       ON public.enterprise_members(user_id);

ALTER TABLE public.enterprise_members ENABLE ROW LEVEL SECURITY;

-- L'entreprise peut voir ses propres membres
CREATE POLICY "Enterprise can view own members"
  ON public.enterprise_members FOR SELECT
  USING (auth.uid() = enterprise_id);

-- Un membre peut voir sa propre appartenance
CREATE POLICY "Member can view own membership"
  ON public.enterprise_members FOR SELECT
  USING (auth.uid() = user_id);

-- Les admins peuvent tout gérer (via service role, RLS bypassé)
-- Les insertions/suppressions se font uniquement via l'API admin
