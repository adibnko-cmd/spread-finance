import { notFound, redirect } from 'next/navigation'
import { getChapterBySlug, getArticleBySlug } from '@/lib/sanity/client'
import { createClient } from '@/lib/supabase/server'
import FlashcardsPageClient from './FlashcardsPageClient'

export const dynamic = 'force-dynamic'

// Flashcards intégrées par slug (même référence que le hub)
const BUILT_IN_CARDS: Record<string, Array<{ front: string; back: string }>> = {
  'options-call-put-black-scholes': [
    { front: 'Qu\'est-ce qu\'un Call ?',                       back: 'Droit d\'acheter un actif à un prix fixé (strike K) à l\'échéance. Payoff = max(S_T − K, 0).' },
    { front: 'Qu\'est-ce qu\'un Put ?',                        back: 'Droit de vendre un actif au strike K à l\'échéance. Payoff = max(K − S_T, 0).' },
    { front: 'Que représente la prime d\'une option ?',         back: 'Le prix payé par l\'acheteur pour obtenir le droit. C\'est la perte maximale de l\'acheteur.' },
    { front: 'Quelle est la formule Black-Scholes pour un Call ?', back: 'C = S₀·N(d₁) − K·e^{−rT}·N(d₂)\noù d₁ = [ln(S₀/K) + (r+σ²/2)T] / (σ√T)' },
    { front: 'Qu\'est-ce que le Delta (Δ) ?',                  back: 'Sensibilité du prix de l\'option à une variation du sous-jacent. ΔCall ∈ [0,1], ΔPut ∈ [−1,0].' },
    { front: 'Qu\'est-ce que le Gamma (Γ) ?',                  back: 'Variation du Delta quand le sous-jacent bouge. Mesure la convexité de l\'option.' },
    { front: 'Qu\'est-ce que le Theta (Θ) ?',                  back: 'Érosion de la valeur temps par jour. Toujours négatif pour l\'acheteur d\'option.' },
    { front: 'Qu\'est-ce que la volatilité implicite ?',       back: 'La volatilité σ telle que Black-Scholes reproduit exactement le prix de marché de l\'option.' },
    { front: 'Option In-the-Money (ITM) vs Out-of-the-Money (OTM) ?', back: 'Call ITM : S > K. Put ITM : S < K. OTM : l\'inverse. ATM : S ≈ K.' },
    { front: 'Qu\'est-ce que la parité Call-Put ?',            back: 'C − P = S₀ − K·e^{−rT}. Relation fondamentale entre call et put de même strike/échéance.' },
  ],
  'options-digitales': [
    { front: 'Qu\'est-ce qu\'une option digitale (binaire) ?', back: 'Option dont le payoff est fixe (montant Q) si la condition est remplie, 0 sinon. Pas de zone de gradation.' },
    { front: 'Payoff d\'un Call Digital',                      back: 'Payoff = Q si S_T > K, sinon 0. Gain discret, contrairement aux options vanille.' },
    { front: 'Payoff d\'un Put Digital',                       back: 'Payoff = Q si S_T < K, sinon 0.' },
    { front: 'Qu\'est-ce que le Pin Risk ?',                   back: 'Risque pour le vendeur quand le sous-jacent termine exactement au strike à l\'échéance : le payoff bascule brutalement.' },
    { front: 'Pourquoi les options digitales sont-elles risquées à couvrir ?', back: 'Le Delta devient infini au voisinage du strike à l\'échéance : la couverture nécessite des positions énormes.' },
  ],
}

export default async function FlashcardsSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?redirectTo=/flashcards/${slug}`)

  const [chapter, article] = await Promise.all([
    getChapterBySlug(slug).catch(() => null),
    getArticleBySlug(slug).catch(() => null),
  ])

  const content = chapter ?? article
  if (!content) notFound()

  const cards = BUILT_IN_CARDS[slug] ?? []

  // Récupérer le PDF si disponible (depuis le chapitre)
  const pdfUrl = (chapter as { flashcardUrl?: string } | null)?.flashcardUrl ?? null

  if (cards.length === 0 && !pdfUrl) notFound()

  return (
    <FlashcardsPageClient
      slug={slug}
      title={content.title}
      domain={(content as { domain?: string }).domain ?? 'finance'}
      cards={cards}
      pdfUrl={pdfUrl}
    />
  )
}
