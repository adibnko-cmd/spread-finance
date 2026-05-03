import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { getAllQuizQuestions } from '@/lib/sanity/client'

const FALLBACK: Record<string, Array<{ text: string; explanation: string; answers: { text: string; isCorrect: boolean }[] }>> = {
  finance: [
    {
      text: "Qu'est-ce que le delta d'une option call européenne ?",
      explanation: "Le delta mesure la variation du prix de l'option pour +1€ sur le sous-jacent. Pour un call, il est entre 0 et 1.",
      answers: [
        { text: 'La sensibilité à la volatilité', isCorrect: false },
        { text: 'La variation du prix pour +1€ sur le sous-jacent', isCorrect: true },
        { text: "La probabilité d'exercice", isCorrect: false },
        { text: 'Le taux de dépréciation temporelle', isCorrect: false },
      ],
    },
    {
      text: 'Que mesure la VaR 95% sur 1 jour ?',
      explanation: 'La VaR 95% 1J est la perte maximale que le portefeuille ne devrait pas dépasser sur 1 jour avec 95% de probabilité.',
      answers: [
        { text: 'La perte moyenne sur 5% des pires jours', isCorrect: false },
        { text: 'La perte maximale sur 1 jour avec 95% de probabilité', isCorrect: true },
        { text: 'Le rendement minimum garanti', isCorrect: false },
        { text: 'La volatilité journalière', isCorrect: false },
      ],
    },
    {
      text: 'Qu\'est-ce que le Sharpe Ratio ?',
      explanation: 'Sharpe = (Rp - Rf) / σp. Rentabilité excédentaire par unité de risque total.',
      answers: [
        { text: 'Le rendement annualisé', isCorrect: false },
        { text: 'La rentabilité excédentaire par unité de risque total', isCorrect: true },
        { text: 'La corrélation entre deux actifs', isCorrect: false },
        { text: 'La perte maximale historique', isCorrect: false },
      ],
    },
  ],
  maths: [
    {
      text: 'Dans Black-Scholes, quel paramètre représente la volatilité implicite ?',
      explanation: 'σ (sigma) représente la volatilité annualisée du sous-jacent.',
      answers: [
        { text: 'r — taux sans risque', isCorrect: false },
        { text: 'T — maturité', isCorrect: false },
        { text: 'σ — écart-type des rendements', isCorrect: true },
        { text: "K — prix d'exercice", isCorrect: false },
      ],
    },
  ],
  dev: [
    {
      text: 'En Python, que retourne numpy.corrcoef(X, Y)[0,1] ?',
      explanation: 'numpy.corrcoef retourne la matrice de corrélation. [0,1] est le coefficient de Pearson.',
      answers: [
        { text: 'La covariance entre X et Y', isCorrect: false },
        { text: 'Le coefficient de corrélation de Pearson', isCorrect: true },
        { text: 'La variance de X', isCorrect: false },
        { text: 'La régression linéaire de Y sur X', isCorrect: false },
      ],
    },
  ],
  pm: [
    {
      text: 'Dans Scrum, quelle cérémonie sert à planifier le sprint suivant ?',
      explanation: "Le Sprint Planning est la cérémonie où l'équipe sélectionne les user stories et planifie le sprint.",
      answers: [
        { text: 'Daily Scrum', isCorrect: false },
        { text: 'Sprint Review', isCorrect: false },
        { text: 'Sprint Planning', isCorrect: true },
        { text: 'Sprint Retrospective', isCorrect: false },
      ],
    },
  ],
  ml: [
    {
      text: 'Quelle méthode est utilisée pour le pricing Monte-Carlo ?',
      explanation: 'Monte-Carlo génère des milliers de trajectoires aléatoires, calcule le payoff et en fait la moyenne actualisée.',
      answers: [
        { text: "Résolution analytique d'une EDP", isCorrect: false },
        { text: 'Simulation de nombreuses trajectoires aléatoires', isCorrect: true },
        { text: 'Arbre binomial recombinant', isCorrect: false },
        { text: 'Interpolation par splines cubiques', isCorrect: false },
      ],
    },
  ],
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('account_type').eq('id', user.id).single()
  if (profile?.account_type !== 'enterprise') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const domainsParam = req.nextUrl.searchParams.get('domains') ?? ''
  const domains = domainsParam.split(',').map(d => d.trim()).filter(Boolean)
  if (domains.length === 0) return NextResponse.json([])

  const pool: Array<{ text: string; explanation: string; domain: string; answers: { text: string; isCorrect: boolean }[] }> = []

  try {
    const sanityData = await getAllQuizQuestions()
    if (sanityData?.length) {
      for (const quiz of sanityData) {
        if (!quiz.domain || !domains.includes(quiz.domain)) continue
        for (const q of quiz.questions ?? []) {
          pool.push({ text: q.text, explanation: q.explanation ?? '', domain: quiz.domain, answers: q.answers })
        }
      }
    }
  } catch { /* Sanity non disponible */ }

  for (const domain of domains) {
    const fb = FALLBACK[domain] ?? []
    for (const q of fb) {
      if (!pool.some(p => p.text === q.text)) {
        pool.push({ ...q, domain })
      }
    }
  }

  const byDomain: Record<string, typeof pool> = {}
  for (const q of pool) {
    if (!byDomain[q.domain]) byDomain[q.domain] = []
    byDomain[q.domain].push(q)
  }

  return NextResponse.json(byDomain)
}
