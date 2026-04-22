// node scripts/manage-users.mjs
// 1. Passe adib.koriche.pro@gmail.com en plan "premium"
// 2. Crée un compte test freemium : test.user@spread-finance.dev
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const YOUR_EMAIL      = 'adib.koriche.pro@gmail.com'
const TEST_EMAIL      = 'test.freemium@spread-finance.dev'
const TEST_PASSWORD   = 'SpreadTest2024!'
const TEST_FIRST_NAME = 'Test'
const TEST_LAST_NAME  = 'Freemium'

// ── 1. Upgrade votre compte en premium ───────────────────────────────
console.log(`\n🔧 Passage en Premium : ${YOUR_EMAIL}`)

const { data: yourUser } = await supabase.auth.admin.listUsers()
const you = yourUser?.users?.find(u => u.email === YOUR_EMAIL)

if (!you) {
  console.error(`❌ Utilisateur ${YOUR_EMAIL} introuvable`)
} else {
  const { error } = await supabase
    .from('profiles')
    .update({ plan: 'premium' })
    .eq('id', you.id)

  if (error) {
    console.error('❌ Erreur mise à jour plan :', error.message)
  } else {
    console.log(`✅ ${YOUR_EMAIL} → plan = premium`)
  }
}

// ── 2. Créer le compte test freemium ─────────────────────────────────
console.log(`\n👤 Création du compte test : ${TEST_EMAIL}`)

const existing = yourUser?.users?.find(u => u.email === TEST_EMAIL)

let testUserId

if (existing) {
  console.log(`ℹ️  Compte déjà existant (id: ${existing.id})`)
  testUserId = existing.id
} else {
  const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
    email:          TEST_EMAIL,
    password:       TEST_PASSWORD,
    email_confirm:  true,
    user_metadata:  { first_name: TEST_FIRST_NAME, last_name: TEST_LAST_NAME },
  })

  if (createErr) {
    console.error('❌ Erreur création utilisateur :', createErr.message)
    process.exit(1)
  }

  testUserId = newUser.user.id
  console.log(`✅ Compte créé : ${TEST_EMAIL} (id: ${testUserId})`)
}

// S'assurer que le profil existe avec plan "free"
const { data: existingProfile } = await supabase
  .from('profiles')
  .select('id')
  .eq('id', testUserId)
  .maybeSingle()

if (!existingProfile) {
  const { error: profileErr } = await supabase.from('profiles').insert({
    id:         testUserId,
    first_name: TEST_FIRST_NAME,
    last_name:  TEST_LAST_NAME,
    plan:       'free',
  })

  if (profileErr) {
    console.error('❌ Erreur création profil :', profileErr.message)
  } else {
    console.log(`✅ Profil créé pour ${TEST_EMAIL} — plan = free`)
  }
} else {
  // S'assurer que le plan est bien "free"
  await supabase.from('profiles').update({ plan: 'free' }).eq('id', testUserId)
  console.log(`✅ Profil existant — plan confirmé = free`)
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Résumé
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Votre compte (Premium)
  Email    : ${YOUR_EMAIL}
  Plan     : premium

Compte test (Freemium)
  Email    : ${TEST_EMAIL}
  Mot de passe : ${TEST_PASSWORD}
  Plan     : free
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
