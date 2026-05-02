import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CompetitionClient } from './CompetitionClient'
import { getWeeklyQuiz } from '@/lib/sanity/client'

export const dynamic = 'force-dynamic'

function getWeekId(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

// Questions de fallback si aucune entrée Sanity pour la semaine courante
const FALLBACK_QUESTIONS = [
  {
    _key: 'wq1', text: 'Qu\'est-ce que le delta d\'une option call européenne ?',
    explanation: 'Le delta mesure la variation du prix de l\'option par rapport à la variation du sous-jacent. Pour un call, il est compris entre 0 et 1.',
    answers: [
      { text: 'La sensibilité du prix de l\'option à la volatilité', isCorrect: false },
      { text: 'La variation du prix de l\'option pour +1€ sur le sous-jacent', isCorrect: true },
      { text: 'La probabilité d\'exercice à l\'échéance', isCorrect: false },
      { text: 'Le taux de dépréciation temporelle de l\'option', isCorrect: false },
    ],
  },
  {
    _key: 'wq2', text: 'Un investisseur achète un contrat future sur indice à 4 500 pts avec un levier de 10. Quelle est la perte si l\'indice passe à 4 350 pts ?',
    explanation: 'La perte = (4 500 - 4 350) × 10 = 1 500. Le levier amplifie les gains ET les pertes.',
    answers: [
      { text: '150 pts', isCorrect: false },
      { text: '1 500 pts', isCorrect: true },
      { text: '750 pts', isCorrect: false },
      { text: '15 pts', isCorrect: false },
    ],
  },
  {
    _key: 'wq3', text: 'Dans la formule Black-Scholes, quel paramètre représente la volatilité implicite ?',
    explanation: 'σ (sigma) représente la volatilité annualisée du sous-jacent. C\'est le seul paramètre non observable directement.',
    answers: [
      { text: 'r — taux sans risque', isCorrect: false },
      { text: 'T — maturité', isCorrect: false },
      { text: 'σ — écart-type des rendements', isCorrect: true },
      { text: 'K — prix d\'exercice', isCorrect: false },
    ],
  },
  {
    _key: 'wq4', text: 'Qu\'est-ce qu\'un swap de taux d\'intérêt (IRS) ?',
    explanation: 'Un IRS est un contrat d\'échange de flux financiers : une contrepartie paye un taux fixe et reçoit un taux variable (ou inversement) sur un notionnel de référence.',
    answers: [
      { text: 'Un échange de devises entre deux banques centrales', isCorrect: false },
      { text: 'Un échange de flux fixes contre variables sur un notionnel', isCorrect: true },
      { text: 'Un contrat d\'achat à terme de taux directeurs', isCorrect: false },
      { text: 'Une obligation à taux variable émise par l\'État', isCorrect: false },
    ],
  },
  {
    _key: 'wq5', text: 'Quelle méthode est utilisée pour le pricing Monte-Carlo en finance quantitative ?',
    explanation: 'La méthode Monte-Carlo génère des milliers de trajectoires aléatoires du sous-jacent, calcule le payoff sur chaque trajectoire et en fait la moyenne actualisée.',
    answers: [
      { text: 'Résolution analytique d\'une EDP', isCorrect: false },
      { text: 'Simulation de nombreuses trajectoires aléatoires', isCorrect: true },
      { text: 'Arbre binomial recombinant', isCorrect: false },
      { text: 'Interpolation par splines cubiques', isCorrect: false },
    ],
  },
  {
    _key: 'wq6', text: 'En Python, que retourne numpy.corrcoef(X, Y)[0,1] ?',
    explanation: 'numpy.corrcoef retourne la matrice de corrélation. L\'élément [0,1] est le coefficient de corrélation de Pearson entre X et Y.',
    answers: [
      { text: 'La covariance entre X et Y', isCorrect: false },
      { text: 'Le coefficient de corrélation de Pearson', isCorrect: true },
      { text: 'La variance de X', isCorrect: false },
      { text: 'La régression linéaire de Y sur X', isCorrect: false },
    ],
  },
  {
    _key: 'wq7', text: 'Qu\'est-ce que le Sharpe Ratio ?',
    explanation: 'Sharpe = (Rp - Rf) / σp. Il mesure la rentabilité excédentaire par unité de risque total du portefeuille.',
    answers: [
      { text: 'Le rendement annualisé d\'un portefeuille', isCorrect: false },
      { text: 'La rentabilité excédentaire par unité de risque total', isCorrect: true },
      { text: 'La corrélation entre deux actifs', isCorrect: false },
      { text: 'La perte maximale historique d\'un portefeuille', isCorrect: false },
    ],
  },
  {
    _key: 'wq8', text: 'Que mesure la VaR (Value at Risk) à 95% sur 1 jour ?',
    explanation: 'La VaR 95% 1J représente la perte maximale que le portefeuille ne devrait pas dépasser sur 1 jour, avec 95% de probabilité.',
    answers: [
      { text: 'La perte moyenne sur 5% des pires jours', isCorrect: false },
      { text: 'La perte maximale sur 1 jour avec 95% de probabilité', isCorrect: true },
      { text: 'Le rendement minimum garanti sur 1 jour', isCorrect: false },
      { text: 'La volatilité journalière du portefeuille', isCorrect: false },
    ],
  },
  {
    _key: 'wq9', text: 'Quelle est la différence entre une option américaine et européenne ?',
    explanation: 'Une option européenne ne peut être exercée qu\'à maturité. Une option américaine peut être exercée à tout moment avant l\'échéance.',
    answers: [
      { text: 'L\'option européenne est toujours moins chère', isCorrect: false },
      { text: 'L\'option américaine peut être exercée à tout moment jusqu\'à maturité', isCorrect: true },
      { text: 'L\'option américaine porte sur des actifs américains', isCorrect: false },
      { text: 'L\'option européenne offre un rendement garanti', isCorrect: false },
    ],
  },
  {
    _key: 'wq10', text: 'Dans Scrum, quelle cérémonie sert à planifier le sprint suivant ?',
    explanation: 'Le Sprint Planning est la cérémonie où l\'équipe sélectionne les user stories du backlog produit et planifie le travail du sprint à venir.',
    answers: [
      { text: 'Daily Scrum', isCorrect: false },
      { text: 'Sprint Review', isCorrect: false },
      { text: 'Sprint Planning', isCorrect: true },
      { text: 'Sprint Retrospective', isCorrect: false },
    ],
  },
]

export default async function CompetitionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/quiz/competition')

  const weekId = getWeekId()

  // Charger les questions depuis Sanity, fallback sur questions statiques
  let weeklyQuestions = FALLBACK_QUESTIONS
  try {
    const sanityQuiz = await getWeeklyQuiz(weekId)
    if (sanityQuiz?.questions?.length > 0) weeklyQuestions = sanityQuiz.questions
  } catch { /* Sanity non configuré ou pas de quiz pour cette semaine */ }

  // Résultat de l'utilisateur pour cette semaine
  const { data: myResult } = await supabase
    .from('competition_results')
    .select('score, correct_answers, total_questions, time_seconds, attempted_at')
    .eq('user_id', user.id)
    .eq('week_id', weekId)
    .maybeSingle()

  // Leaderboard de la semaine (top 10)
  const { data: leaderboard } = await supabase
    .from('competition_results')
    .select('user_id, score, correct_answers, total_questions, time_seconds')
    .eq('week_id', weekId)
    .order('score', { ascending: false })
    .order('time_seconds', { ascending: true })
    .limit(10)

  // Noms des utilisateurs du leaderboard
  const userIds = (leaderboard ?? []).map(r => r.user_id)
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, first_name, last_name').in('id', userIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map(p => [p.id, `${p.first_name ?? ''} ${p.last_name?.[0] ?? ''}.`.trim()]))

  return (
    <CompetitionClient
      weekId={weekId}
      questions={weeklyQuestions}
      myResult={myResult ?? null}
      leaderboard={(leaderboard ?? []).map((r, i) => ({
        rank: i + 1,
        name: profileMap.get(r.user_id) ?? 'Anonyme',
        isMe: r.user_id === user.id,
        score: r.score,
        correct: r.correct_answers,
        total: r.total_questions,
        time: r.time_seconds,
      }))}
    />
  )
}
