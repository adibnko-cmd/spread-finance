-- ─── Créer le compte administrateur Spread Finance ────────────────────────────
-- À lancer dans l'éditeur SQL Supabase (pas une migration automatique)
-- Email    : admin@spread-finance.com
-- Password : azerty123  (à changer après la première connexion)

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN

  -- 1. Créer l'utilisateur dans auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'admin@spread-finance.com',
    crypt('azerty123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Admin", "last_name": "Spread"}',
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- 2. Le trigger handle_new_user crée automatiquement le profil
  --    On surcharge ensuite les champs nécessaires
  UPDATE public.profiles SET
    first_name      = 'Admin',
    last_name       = 'Spread',
    plan            = 'platinum',
    is_admin        = true,
    onboarding_done = true
  WHERE id = new_user_id;

  RAISE NOTICE 'Compte admin créé : admin@spread-finance.com (id: %)', new_user_id;
END $$;
