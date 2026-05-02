-- ─── 007 : Comptes entreprise ────────────────────────────────────────────────

-- 1. Ajout de account_type sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'individual'
    CHECK (account_type IN ('individual', 'enterprise'));

-- 2. Index pour filtrer rapidement les comptes entreprise (admin)
CREATE INDEX IF NOT EXISTS idx_profiles_account_type
  ON public.profiles (account_type)
  WHERE account_type = 'enterprise';

-- 3. RLS : les entreprises peuvent lire leur propre profil (déjà couvert par la policy existante)
--    Aucune policy supplémentaire nécessaire — la policy "Users can read their own profile"
--    s'applique à tous les types de comptes.

-- 4. Table entreprise_profiles : données spécifiques aux comptes entreprise
CREATE TABLE IF NOT EXISTS public.enterprise_profiles (
  id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name   text NOT NULL,
  siret          text,
  sector         text,
  contact_email  text,
  contact_phone  text,
  seats          int NOT NULL DEFAULT 5,  -- nombre de licences
  notes          text,                    -- notes internes Spread Finance
  created_at     timestamptz DEFAULT now() NOT NULL,
  updated_at     timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.enterprise_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enterprise users can read their own enterprise profile" ON public.enterprise_profiles;
CREATE POLICY "Enterprise users can read their own enterprise profile"
  ON public.enterprise_profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can manage all enterprise profiles
DROP POLICY IF EXISTS "Admins can manage enterprise profiles" ON public.enterprise_profiles;
CREATE POLICY "Admins can manage enterprise profiles"
  ON public.enterprise_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTE : Pour créer un compte entreprise de test, exécuter le bloc SQL séparé
-- dans la section "Créer un utilisateur entreprise" plus bas (à lancer dans
-- l'éditeur SQL Supabase, PAS dans une migration automatique).
-- ─────────────────────────────────────────────────────────────────────────────
