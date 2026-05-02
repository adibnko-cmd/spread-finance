-- ─── 009 : Ajouter 'enterprise' comme valeur de plan ─────────────────────────
-- Le plan entreprise n'est pas un abonnement individuel (free/premium/platinum)
-- mais un contrat B2B géré par l'équipe Spread Finance.

-- Supprimer l'ancienne contrainte CHECK (le nom auto-généré par PostgreSQL)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;

-- Recréer la contrainte en incluant 'enterprise'
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'premium', 'platinum', 'enterprise'));

-- Mettre à jour le compte demo-entreprise (s'il existe déjà)
UPDATE public.profiles
  SET plan = 'enterprise'
  WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'demo-entreprise@spread-finance.com'
  );
