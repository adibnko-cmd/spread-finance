-- ─── Créer un utilisateur entreprise de test ─────────────────────────────────
-- À lancer dans l'éditeur SQL Supabase (pas une migration automatique)
-- Mot de passe : azerty123

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
    'demo-entreprise@spread-finance.com',
    crypt('azerty123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Admin", "last_name": "Demo"}',
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
    first_name   = 'Admin',
    last_name    = 'Demo',
    account_type = 'enterprise',
    plan         = 'enterprise',
    onboarding_done = true
  WHERE id = new_user_id;

  -- 3. Créer le profil entreprise
  INSERT INTO public.enterprise_profiles (
    id,
    company_name,
    sector,
    contact_email,
    seats
  ) VALUES (
    new_user_id,
    'Spread Finance Demo Corp',
    'Finance',
    'contact@spread-finance.com',
    10
  );

  RAISE NOTICE 'Utilisateur entreprise créé : % (id: %)', 'demo-entreprise@spread-finance.com', new_user_id;
END $$;
