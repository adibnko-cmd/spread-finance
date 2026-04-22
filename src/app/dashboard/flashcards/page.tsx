import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { sanityClient } from '@/lib/sanity/client'
import FlashcardsClient, { type FlashcardDeck } from './FlashcardsClient'

export const dynamic = 'force-dynamic'

// Flashcards intégrées par chapitre (slug → cartes)
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

export default async function FlashcardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/dashboard/flashcards')

  // Récupérer tous les chapitres avec flashcard PDF ou built-in cards
  const chapters = await sanityClient.fetch(`
    *[_type == "chapter"] | order(domain asc, part asc, order asc) {
      _id,
      title,
      "slug": slug.current,
      domain,
      "flashcardUrl": flashcard.asset->url
    }
  `)

  // Construire les decks
  const decks: FlashcardDeck[] = (chapters as Array<{
    _id: string; title: string; slug: string; domain: string; flashcardUrl?: string
  }>)
    .filter(ch => BUILT_IN_CARDS[ch.slug] || ch.flashcardUrl)
    .map(ch => {
      const builtIn = BUILT_IN_CARDS[ch.slug] ?? []
      return {
        slug:      ch.slug,
        title:     ch.title,
        domain:    ch.domain,
        cardCount: builtIn.length || (ch.flashcardUrl ? 1 : 0),
        cards:     builtIn.map(c => ({ ...c, domain: ch.domain })),
        isPdf:     !!ch.flashcardUrl && builtIn.length === 0,
        pdfUrl:    ch.flashcardUrl,
      }
    })

  // Ajouter les decks built-in pour chapitres sans entrée Sanity
  for (const [slug, cards] of Object.entries(BUILT_IN_CARDS)) {
    if (!decks.find(d => d.slug === slug)) {
      decks.push({
        slug,
        title:     slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        domain:    'finance',
        cardCount: cards.length,
        cards:     cards.map(c => ({ ...c, domain: 'finance' })),
        isPdf:     false,
      })
    }
  }

  return (
    <div className="p-5 max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm font-black text-gray-800">Flashcards</div>
          <div className="text-xs text-gray-400 mt-0.5">Révisez les concepts clés par domaine</div>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{ background: '#EBF2FF', color: '#1a5fc8' }}
        >
          <span>🃏</span>
          {decks.reduce((s, d) => s + d.cardCount, 0)} cartes
        </div>
      </div>

      {/* Tip */}
      <div
        className="mb-5 p-3 rounded-xl flex items-start gap-2.5"
        style={{ background: '#1C1C2E', border: '1px solid rgba(255,255,255,.07)' }}
      >
        <div className="text-base flex-shrink-0 mt-0.5">💡</div>
        <div>
          <div className="text-[11px] font-bold text-white mb-0.5">Comment utiliser les flashcards ?</div>
          <div className="text-[10px] text-white/40 leading-relaxed">
            Lisez la question, essayez de répondre mentalement, puis retournez la carte.
            Marquez &quot;Je sais&quot; ou &quot;À revoir&quot; pour suivre votre progression.
          </div>
        </div>
      </div>

      <FlashcardsClient decks={decks} />
    </div>
  )
}
