// SF-EVAL-01 (2026-09-16) — logique d'évaluation exécutée côté serveur uniquement.
// Le navigateur ne reçoit jamais `isCorrect` ni `explanation` : il envoie les index
// choisis, le serveur relit le document Sanity et calcule.
import { getEvaluation } from '@/lib/sanity/client'

export const EVAL_DOMAINS = ['finance', 'maths', 'dev', 'pm', 'ml'] as const
export const PREMIUM_PLANS = ['premium', 'platinum']

interface RawAnswer   { text: string; isCorrect?: boolean }
interface RawQuestion { _key?: string; text: string; competency?: string; explanation?: string; answers: RawAnswer[] }
export interface RawEvaluation {
  _id: string; domain: string; part: number; partTitle: string; level: number
  questions: RawQuestion[] | null
}

export interface PublicQuestion   { _key?: string; text: string; competency?: string; answers: { text: string }[] }
export interface PublicEvaluation {
  _id: string; domain: string; part: number; partTitle: string; level: number
  questions: PublicQuestion[]
}

export interface QuestionCorrection { correctIndex: number; explanation?: string }

export async function loadEvaluation(domain: string, part: number, level: number): Promise<RawEvaluation | null> {
  return (await getEvaluation(domain, part, level).catch(() => null)) as RawEvaluation | null
}

export function toPublicEvaluation(ev: RawEvaluation | null): PublicEvaluation | null {
  if (!ev) return null
  return {
    _id: ev._id, domain: ev.domain, part: ev.part, partTitle: ev.partTitle, level: ev.level,
    questions: (ev.questions ?? []).map(q => ({
      _key: q._key, text: q.text, competency: q.competency,
      answers: (q.answers ?? []).map(a => ({ text: a.text })),
    })),
  }
}

export function correctIndexOf(q: RawQuestion): number {
  return (q.answers ?? []).findIndex(a => a.isCorrect === true)
}

export function isPremiumPlan(plan: string | null | undefined): boolean {
  return !!plan && PREMIUM_PLANS.includes(plan)
}
