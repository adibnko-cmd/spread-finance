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
  'futures-forwards': [
    { front: 'Quelle est la différence entre un Forward et un Future ?',     back: 'Forward : contrat OTC sur mesure, pas de chambre de compensation, risque de contrepartie. Future : standardisé, négocié en bourse, compensé avec appels de marge quotidiens.' },
    { front: 'Qu\'est-ce qu\'un appel de marge (margin call) ?',             back: 'Quand la valeur du compte passe sous le maintenance margin, la chambre de compensation exige un dépôt supplémentaire pour reconstituer la marge initiale.' },
    { front: 'Quelle est la formule du coût de portage (cost of carry) ?',   back: 'F = S₀ × e^{(r + u − q) × T}\nF = prix future, S₀ = spot, r = taux sans risque, u = stockage, q = dividendes/revenus, T = durée.' },
    { front: 'Qu\'est-ce que le Contango ?',                                 back: 'Le prix des futures lointains est supérieur au spot. Situation normale pour les actifs stockables. Reflète le coût de portage.' },
    { front: 'Qu\'est-ce que le Backwardation ?',                            back: 'Le prix spot est supérieur aux futures lointains. Signale une tension physique immédiate : offre insuffisante, stocks bas.' },
    { front: 'Comment calculer le prix d\'un forward de change ?',           back: 'F = S₀ × e^{(r_domestique − r_étranger) × T}\nSi r_USD > r_EUR → dollar en déport (discount).' },
    { front: 'Qu\'est-ce que le roll yield pour un ETF futures ?',           back: 'Gain ou perte lors du renouvellement mensuel des contrats. En contango : perte. En backwardation : gain.' },
    { front: 'Comment couvrir un portefeuille actions avec des futures ?',   back: 'N contrats = (β × Valeur portefeuille) / Valeur notionnelle future. On vend les futures pour réduire le beta.' },
    { front: 'Qu\'est-ce qu\'un FRA (Forward Rate Agreement) ?',             back: 'Contrat forward sur taux d\'intérêt. Fixe aujourd\'hui le taux applicable à un emprunt futur. Réglé en cash à l\'échéance.' },
    { front: 'Qu\'est-ce que l\'arbitrage cash-and-carry ?',                 back: 'Si le future est surévalué : emprunter, acheter le spot, vendre le future → profit sans risque. Maintient F = S₀ × e^{rT}.' },
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
