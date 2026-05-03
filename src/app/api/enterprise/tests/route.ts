import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { getAllQuizQuestions } from '@/lib/sanity/client'
import { z } from 'zod'

const questionSchema = z.object({
  text:        z.string(),
  explanation: z.string(),
  domain:      z.string(),
  answers:     z.array(z.object({ text: z.string(), isCorrect: z.boolean() })),
})

const schema = z.object({
  title:              z.string().min(3).max(200),
  description:        z.string().max(1000).optional(),
  domains:            z.array(z.enum(['finance','maths','dev','pm','ml'])).min(1),
  question_count:     z.number().int().min(3).max(30),
  time_limit:         z.number().int().min(1).max(120).nullable().optional(),
  manual_questions:   z.array(questionSchema).min(3).max(30).optional(),
})

// Questions de secours multi-domaines
const FALLBACK: Record<string, Array<{ text: string; explanation: string; answers: { text: string; isCorrect: boolean }[] }>> = {
  finance: [
    {
      text: 'Qu\'est-ce que le delta d\'une option call européenne ?',
      explanation: 'Le delta mesure la variation du prix de l\'option pour +1€ sur le sous-jacent. Pour un call, il est entre 0 et 1.',
      answers: [
        { text: 'La sensibilité à la volatilité', isCorrect: false },
        { text: 'La variation du prix pour +1€ sur le sous-jacent', isCorrect: true },
        { text: 'La probabilité d\'exercice', isCorrect: false },
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
        { text: 'K — prix d\'exercice', isCorrect: false },
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
      explanation: 'Le Sprint Planning est la cérémonie où l\'équipe sélectionne les user stories et planifie le sprint.',
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
        { text: 'Résolution analytique d\'une EDP', isCorrect: false },
        { text: 'Simulation de nombreuses trajectoires aléatoires', isCorrect: true },
        { text: 'Arbre binomial recombinant', isCorrect: false },
        { text: 'Interpolation par splines cubiques', isCorrect: false },
      ],
    },
  ],
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('account_type').eq('id', user.id).single()
  if (profile?.account_type !== 'enterprise') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: tests } = await supabase
    .from('candidate_tests')
    .select('id, title, description, token, domains, question_count, time_limit, is_active, created_at')
    .eq('enterprise_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json(tests ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('account_type').eq('id', user.id).single()
  if (profile?.account_type !== 'enterprise') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

  const { title, description, domains, question_count, time_limit, manual_questions } = parsed.data

  let selected: Array<{ text: string; explanation: string; domain: string; answers: { text: string; isCorrect: boolean }[] }> = []

  if (manual_questions && manual_questions.length >= 3) {
    selected = manual_questions
  } else {
    // Collecter les questions automatiquement
    let pool: typeof selected = []

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
        if (pool.length < question_count * 3) {
          pool.push({ ...q, domain })
        }
      }
    }

    pool = shuffle(pool.filter(q => (domains as string[]).includes(q.domain)))
    selected = pool.slice(0, question_count)
  }

  if (selected.length === 0) {
    return NextResponse.json({ error: 'Aucune question disponible pour les domaines sélectionnés' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('candidate_tests')
    .insert({
      enterprise_id:  user.id,
      title,
      description:    description ?? null,
      domains,
      question_count: selected.length,
      time_limit:     time_limit ?? null,
      questions:      selected,
    })
    .select('id, title, description, token, domains, question_count, time_limit, is_active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, is_active } = await req.json()
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const { error } = await supabase
    .from('candidate_tests').update({ is_active }).eq('id', id).eq('enterprise_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
