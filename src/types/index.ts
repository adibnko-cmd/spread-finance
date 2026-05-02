// ═══════════════════════════════════════════════════════════════════
// SPREAD FINANCE — Types TypeScript (alignés sur le schéma Supabase)
// Génération manuelle — à synchroniser avec : npm run db:generate-types
// ═══════════════════════════════════════════════════════════════════

// ── PLANS ──────────────────────────────────────────────────────────
export type Plan = 'free' | 'premium' | 'platinum' | 'enterprise'
export type Language = 'fr' | 'en' | 'es' | 'de' | 'pt'
export type AccountType = 'individual' | 'enterprise'

// ── DOMAINES (alignés sur l'architecture documentation) ────────────
export type DomainSlug = 'finance' | 'maths' | 'dev' | 'pm' | 'ml'

export const DOMAINS: Record<DomainSlug, { name: string; color: string }> = {
  finance: { name: 'Finance de marché',        color: '#3183F7' },
  maths:   { name: 'Mathématiques financières', color: '#A855F7' },
  dev:     { name: 'Développement IT',          color: '#1a5fc8' },
  pm:      { name: 'Gestion de projet',         color: '#FFC13D' },
  ml:      { name: 'Machine Learning',          color: '#F56751' },
}

// ── PROFIL ─────────────────────────────────────────────────────────
export interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  current_position: string | null
  company: string | null
  years_experience: number | null
  linkedin_url: string | null
  preferred_language: Language
  notifications_email: boolean
  onboarding_goal: string | null
  onboarding_domain: DomainSlug | null
  onboarding_level: 'beginner' | 'intermediate' | 'advanced' | null
  onboarding_done: boolean
  plan: Plan
  account_type: AccountType
  plan_started_at: string | null
  plan_ends_at: string | null
  stripe_customer_id: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

// ── PROGRESSION ────────────────────────────────────────────────────
export type ChapterStatus = 'not_started' | 'in_progress' | 'completed' | 'validated'

export interface ChapterProgress {
  id: string
  user_id: string
  chapter_slug: string
  domain_slug: DomainSlug
  status: ChapterStatus
  read_at: string | null
  completed_at: string | null
  validated_at: string | null
  time_spent_seconds: number
  scroll_percent: number
  created_at: string
  updated_at: string
}

// ── QUIZ ───────────────────────────────────────────────────────────
export type QuizLevel = 1 | 2 | 3

export interface QuizResult {
  id: string
  user_id: string
  chapter_slug: string
  domain_slug: DomainSlug
  quiz_level: QuizLevel
  score: number
  total_questions: number
  correct_answers: number
  time_seconds: number | null
  passed: boolean
  attempted_at: string
}

// ── FLAGS ──────────────────────────────────────────────────────────
export type ContentType = 'chapter' | 'article' | 'quiz' | 'flashcard'
export type FlagType = 'favorite' | 'to_review' | 'validated' | 'to_read'

export interface ContentFlag {
  id: string
  user_id: string
  content_type: ContentType
  content_slug: string
  domain_slug: DomainSlug | null
  flag_type: FlagType
  flagged_at: string
}

// ── GAMIFICATION ───────────────────────────────────────────────────
export type XpSourceType =
  | 'chapter_read'
  | 'chapter_validated'
  | 'quiz_level1'
  | 'quiz_level2'
  | 'quiz_level3'
  | 'daily_streak'
  | 'domain_completed'

export const XP_VALUES: Record<XpSourceType, number> = {
  chapter_read: 10,
  chapter_validated: 30,
  quiz_level1: 15,
  quiz_level2: 25,
  quiz_level3: 50,
  daily_streak: 20,
  domain_completed: 100,
}

export interface XpLog {
  id: string
  user_id: string
  source_type: XpSourceType
  source_id: string | null
  xp_earned: number
  earned_at: string
}

// Calcul du niveau à partir des XP
export function getLevel(totalXp: number): { level: number; title: string; nextLevelXp: number; currentLevelXp: number } {
  const levels = [
    { level: 1, title: 'Étudiant',          xpRequired: 0 },
    { level: 2, title: 'Apprenti analyste', xpRequired: 200 },
    { level: 3, title: 'Analyste junior',   xpRequired: 600 },
    { level: 4, title: 'Analyste',          xpRequired: 1400 },
    { level: 5, title: 'Analyste senior',   xpRequired: 2800 },
    { level: 6, title: 'Expert',            xpRequired: 5000 },
    { level: 7, title: 'Référent',          xpRequired: 8500 },
    { level: 8, title: 'Master',            xpRequired: 13000 },
  ]

  let current = levels[0]
  for (const l of levels) {
    if (totalXp >= l.xpRequired) current = l
    else break
  }

  const nextLevel = levels.find(l => l.xpRequired > totalXp)
  return {
    level: current.level,
    title: current.title,
    nextLevelXp: nextLevel?.xpRequired ?? current.xpRequired,
    currentLevelXp: current.xpRequired,
  }
}

// ── ABONNEMENTS ────────────────────────────────────────────────────
export type SubscriptionStatus = 'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing'

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  stripe_price_id: string | null
  status: SubscriptionStatus
  plan: Plan
  current_period_start: string | null
  current_period_end: string | null
  cancel_at: string | null
  canceled_at: string | null
  created_at: string
  updated_at: string
}

// ── ACCÈS PAR PLAN ─────────────────────────────────────────────────
export const PLAN_FEATURES = {
  free: {
    canAccessPremiumChapters: false,
    canAccessQuizLevel3: false,
    canCreateFlashcards: false,
    canAccessJobs: false,
    canAccessElearning: false,
    canAccessCertifications: false,
    canDownloadPdf: false, // compte requis mais pas premium
    maxDomainsInProgress: 2, // limitation Free sur la progression
  },
  premium: {
    canAccessPremiumChapters: true,
    canAccessQuizLevel3: true,
    canCreateFlashcards: true,
    canAccessJobs: true,
    canAccessElearning: false, // Prochainement
    canAccessCertifications: false, // Prochainement
    canDownloadPdf: true,
    maxDomainsInProgress: null, // illimité
  },
  platinum: {
    canAccessPremiumChapters: true,
    canAccessQuizLevel3: true,
    canCreateFlashcards: true,
    canAccessJobs: true,
    canAccessElearning: true,
    canAccessCertifications: true,
    canDownloadPdf: true,
    maxDomainsInProgress: null,
  },
  enterprise: {
    canAccessPremiumChapters: true,
    canAccessQuizLevel3: true,
    canCreateFlashcards: true,
    canAccessJobs: true,
    canAccessElearning: true,
    canAccessCertifications: true,
    canDownloadPdf: true,
    maxDomainsInProgress: null,
  },
} satisfies Record<Plan, Record<string, boolean | number | null>>

export function hasAccess(plan: Plan, feature: keyof typeof PLAN_FEATURES.free): boolean {
  return Boolean(PLAN_FEATURES[plan][feature])
}

// ── STATS UTILISATEUR (vue user_stats) ────────────────────────────
export interface UserStats {
  user_id: string
  plan: Plan
  chapters_validated: number
  chapters_seen: number
  domains_started: number
  avg_quiz_score: number
  quizzes_passed: number
  total_xp: number
  total_time_seconds: number
  last_activity_at: string | null
}

// ── ACTIVITÉ ───────────────────────────────────────────────────────
export type ActionType =
  | 'chapter_opened' | 'chapter_completed' | 'quiz_started' | 'quiz_completed'
  | 'flashcard_created' | 'flag_added' | 'flag_removed' | 'search_performed'
  | 'profile_updated' | 'subscription_changed'

export interface ActivityLog {
  id: string
  user_id: string
  action_type: ActionType
  target_type: ContentType | null
  target_slug: string | null
  target_title: string | null
  metadata: Record<string, unknown>
  session_id: string | null
  created_at: string
}

// ── FLASHCARDS ─────────────────────────────────────────────────────
export interface UserFlashcard {
  id: string
  user_id: string
  title: string
  content: {
    sections?: Array<{ label: string; value: string }>
    definition?: string
    formula?: string
    example?: string
    notes?: string
  }
  domain_slug: DomainSlug | null
  tags: string[]
  is_shared: boolean
  source_chapter_slug: string | null
  created_at: string
  updated_at: string
}

// ── SANITY CONTENT TYPES (depuis le CMS) ──────────────────────────
// Ces types représentent les données venant de Sanity

export interface SanityChapter {
  _id: string
  _type: 'chapter'
  title: string
  slug: { current: string }
  domain: DomainSlug
  part: number
  partTitle?: string
  order: number
  accessLevel: 'free' | 'premium'
  estimatedReadingTime: number // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  content: unknown[] // Portable Text
  quizAvailable: boolean
  flashcardAvailable: boolean
  relatedArticles?: Array<{ slug: { current: string }; title: string }>
  relatedChapters?: Array<{ slug: { current: string }; title: string }>
}

export interface SanityArticle {
  _id: string
  _type: 'article'
  title: string
  slug: { current: string }
  domain: DomainSlug
  accessLevel: 'free' | 'premium'
  publishedAt: string
  estimatedReadingTime: number
  content: unknown[] // Portable Text
  relatedChapters?: Array<{ slug: { current: string }; title: string }>
}
