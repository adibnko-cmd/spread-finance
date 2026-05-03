-- ═══════════════════════════════════════════════════════════════════
-- SPREAD FINANCE — Migration 014 : Formation Groupe (B2B)
-- Assignation de parcours de formation aux collaborateurs
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.formation_assignments (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  enterprise_id  uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_id        uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domains        text[]      NOT NULL DEFAULT '{}',
  deadline       date,
  notes          text,
  assigned_at    timestamptz DEFAULT now() NOT NULL,
  updated_at     timestamptz DEFAULT now() NOT NULL,
  UNIQUE(enterprise_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_formation_enterprise ON public.formation_assignments(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_formation_user       ON public.formation_assignments(user_id);

ALTER TABLE public.formation_assignments ENABLE ROW LEVEL SECURITY;

-- L'entreprise peut voir ses propres assignations
CREATE POLICY "Enterprise can view own assignments"
  ON public.formation_assignments FOR SELECT
  USING (auth.uid() = enterprise_id);

-- Un membre peut voir sa propre assignation
CREATE POLICY "Member can view own assignment"
  ON public.formation_assignments FOR SELECT
  USING (auth.uid() = user_id);

-- Insertions/modifications uniquement via service role (API admin)
