# 🚀 Spread Finance — Guide de Setup Dev

> **Objectif** : Avoir l'application qui tourne en local en moins de 30 minutes.

---

## ⚡ Installation rapide

### 1. Prérequis

```bash
node --version    # v18+ requis
npm --version     # v9+ requis
git --version
```

### 2. Créer le projet Next.js

```bash
npx create-next-app@14 spread-finance \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd spread-finance
```

### 3. Copier les fichiers de ce setup

Copier **tous les fichiers** de ce dossier `spread-finance-setup/` dans ton projet.

```bash
# Depuis le dossier parent
cp -r spread-finance-setup/src/* spread-finance/src/
cp spread-finance-setup/tailwind.config.ts spread-finance/
cp spread-finance-setup/next.config.js spread-finance/
cp spread-finance-setup/.env.example spread-finance/.env.local
```

### 4. Installer les dépendances

```bash
cd spread-finance
npm install \
  @supabase/supabase-js @supabase/ssr \
  next-sanity @sanity/image-url \
  stripe @stripe/stripe-js \
  resend \
  lucide-react \
  clsx tailwind-merge \
  zod react-hook-form @hookform/resolvers
```

---

## 🗄️ Configuration Supabase

### Créer le projet

1. Aller sur [supabase.com](https://supabase.com) → **New Project**
2. Nom : `spread-finance`
3. Région : `West EU (Ireland)` — proche de la France
4. Mot de passe DB : générer un mot de passe fort, **le sauvegarder**

### Appliquer le schéma

Le fichier SQL est inclus dans ce zip :
`spread-finance-setup/supabase/migrations/001_initial_schema.sql`

1. Ouvrir ce fichier dans VS Code ou un éditeur texte
2. Sélectionner tout (`Cmd+A` sur Mac, `Ctrl+A` sur Windows)
3. Copier (`Cmd+C` / `Ctrl+C`)
4. Aller sur **Supabase Dashboard → SQL Editor**
5. Coller dans l'éditeur → cliquer **Run**

Toutes les tables sont créées automatiquement.

### Configurer l'Auth OAuth

Dans **Supabase Dashboard → Authentication → Providers** :

**Google :**
1. Activer Google
2. Créer des credentials sur [console.cloud.google.com](https://console.cloud.google.com)
3. Authorized redirect URI : `https://[project-ref].supabase.co/auth/v1/callback`

**LinkedIn :**
1. Activer LinkedIn
2. App sur [developer.linkedin.com](https://developer.linkedin.com)

### Récupérer les clés

`Supabase Dashboard → Settings → API` → copier dans `.env.local` :
```
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 📝 Configuration Sanity CMS

### Créer le workspace

```bash
npm create sanity@latest -- \
  --project spread-finance-docs \
  --dataset production \
  --template clean \
  --typescript
```

### Appliquer le schéma

Copier `src/lib/sanity/schema.ts` dans ton projet Sanity Studio.

### Ajouter les variables

```
NEXT_PUBLIC_SANITY_PROJECT_ID=abc123
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
SANITY_API_TOKEN=[token avec droits editor]
```

### Créer le premier chapitre de test

Dans Sanity Studio → **Chapitre** → Nouveau :
- Titre : "Organisation et acteurs des marchés financiers"
- Slug : `organisation-acteurs-marches`
- Domaine : `finance`
- Partie : `1`
- Ordre : `1`
- Accès : `free`
- Contenu : quelques paragraphes de test

---

## 💳 Configuration Stripe (optionnel pour Sprint 1)

> Peut être ignoré pour le premier test UX — les pages s'affichent sans Stripe.

```bash
# Installer la CLI Stripe
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Créer les produits
stripe products create --name="Spread Finance Premium"
stripe prices create \
  --product=[product_id] \
  --unit-amount=1200 \
  --currency=eur \
  --recurring[interval]=month
```

---

## 🚀 Lancer le projet

```bash
npm run dev
# → http://localhost:3000
```

### Vérifications

- [ ] `http://localhost:3000` → Page Home s'affiche
- [ ] `http://localhost:3000/auth/login` → Page de connexion
- [ ] `http://localhost:3000/auth/register` → Formulaire d'inscription
- [ ] Créer un compte test → redirection vers `/dashboard`
- [ ] `http://localhost:3000/dashboard` → Dashboard accessible (connecté)
- [ ] `http://localhost:3000/dashboard` → Redirige vers login (non connecté)
- [ ] `http://localhost:3000/documentation` → Liste domaines

---

## 📁 Structure des fichiers

```
spread-finance/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx               # Root layout (fonts, meta)
│   │   ├── page.tsx                 # Home page
│   │   ├── auth/
│   │   │   ├── login/page.tsx       # Connexion
│   │   │   ├── register/page.tsx    # Inscription
│   │   │   └── onboarding/page.tsx  # Onboarding post-inscription
│   │   ├── dashboard/
│   │   │   ├── layout.tsx           # Dashboard layout (sidebar)
│   │   │   ├── page.tsx             # Dashboard accueil
│   │   │   ├── profile/page.tsx     # Profil utilisateur
│   │   │   ├── progression/page.tsx # Module Progression
│   │   │   ├── quiz/page.tsx        # Module Quiz
│   │   │   ├── favorites/page.tsx   # Module Favoris (Premium)
│   │   │   └── history/page.tsx     # Module Historique
│   │   ├── documentation/
│   │   │   └── [chapter]/page.tsx   # Lecteur de chapitre
│   │   ├── articles/
│   │   │   └── [slug]/page.tsx      # Article
│   │   └── api/
│   │       ├── auth/callback/route.ts  # OAuth callback Supabase
│   │       ├── progress/route.ts    # MAJ progression chapitre
│   │       ├── quiz/route.ts        # Soumission quiz
│   │       ├── flags/route.ts       # Toggle flags
│   │       └── webhooks/
│   │           └── stripe/route.ts  # Webhooks Stripe
│   ├── components/
│   │   ├── ui/                      # Composants atomiques DS v1
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx           # Navbar publique (dark)
│   │   │   ├── Footer.tsx
│   │   │   └── Logo.tsx             # SVG logo ours + SPREAD Finance
│   │   ├── doc/
│   │   │   ├── DocSidebar.tsx       # Sidebar documentation
│   │   │   ├── ChapterReader.tsx    # Lecteur de chapitre
│   │   │   ├── FlagStrip.tsx        # Boutons flags
│   │   │   └── QuizBlock.tsx        # Bloc quiz
│   │   ├── dashboard/
│   │   │   ├── DashboardSidebar.tsx
│   │   │   ├── StatsStrip.tsx       # 4 métriques haut dashboard
│   │   │   ├── ResumeWidget.tsx     # Reprendre
│   │   │   ├── ProgressWidget.tsx   # Progression par domaine
│   │   │   └── XpBar.tsx            # Barre XP gamification
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       ├── RegisterForm.tsx
│   │       └── OAuthButtons.tsx     # Google, LinkedIn, Facebook
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Client-side Supabase
│   │   │   └── server.ts            # Server-side Supabase
│   │   ├── sanity/
│   │   │   ├── client.ts            # Client Sanity
│   │   │   ├── schema.ts            # Schéma CMS
│   │   │   └── queries.ts           # GROQ queries
│   │   └── utils/
│   │       ├── cn.ts                # clsx + tailwind-merge
│   │       └── access.ts            # Vérification plan utilisateur
│   ├── types/
│   │   └── index.ts                 # Types TypeScript (DB + Sanity)
│   ├── hooks/
│   │   ├── useUser.ts               # Hook utilisateur courant
│   │   ├── useProgress.ts           # Hook progression
│   │   └── useFlags.ts              # Hook flags contenu
│   ├── middleware.ts                 # Auth guard (routes protégées)
│   └── styles/
│       └── globals.css              # DS v1 variables + reset
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql   # Schéma BDD complet
├── .env.example                     # Template variables d'env
├── .env.local                       # Variables locales (non commitées)
├── next.config.js
├── tailwind.config.ts               # DS v1 tokens
├── tsconfig.json
└── package.json
```

---

## ✅ Tous les fichiers sont inclus dans ce zip

Aucun fichier supplémentaire à créer. L'application est prête à tourner après les étapes de configuration ci-dessus (Supabase, Sanity, variables d'env).

| Fichier | Statut |
|---------|--------|
| `src/components/layout/Logo.tsx` | ✅ Inclus |
| `src/components/layout/Navbar.tsx` | ✅ Inclus |
| `src/app/page.tsx` (Home) | ✅ Inclus |
| `src/app/documentation/page.tsx` | ✅ Inclus |
| `src/app/auth/login/page.tsx` | ✅ Inclus |
| `src/app/auth/register/page.tsx` | ✅ Inclus |
| `src/app/auth/onboarding/page.tsx` | ✅ Inclus |
| `src/app/dashboard/layout.tsx` | ✅ Inclus |
| `src/app/dashboard/page.tsx` | ✅ Inclus |
| `src/app/api/auth/callback/route.ts` | ✅ Inclus |
| `src/components/ui/index.tsx` | ✅ Inclus |
| `src/components/dashboard/DashboardSidebar.tsx` | ✅ Inclus |
| `src/hooks/useUser.ts` | ✅ Inclus |
| `src/lib/sanity/{client,queries}.ts` | ✅ Inclus |

---

## ✅ Checklist Sprint 1 terminé

- [ ] npm run dev sans erreurs
- [ ] Home s'affiche avec le bon design
- [ ] Inscription fonctionne (email créé dans Supabase)
- [ ] Connexion fonctionne
- [ ] /dashboard accessible après connexion
- [ ] /dashboard redirige vers /auth/login si non connecté
- [ ] Documentation s'affiche (au moins la structure)
- [ ] Déploiement Vercel fonctionnel (URL publique)

---

*Spread Finance Setup v1.0 — Phase 3 allégée + Sprint 1 Phase 4*
