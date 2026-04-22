/**
 * SPREAD FINANCE — Seed : Chapitre "Options Financières"
 * Usage : node scripts/seed-chapter-options.mjs
 *
 * Prérequis : SANITY_API_TOKEN doit être un token avec droits "Editor"
 * Obtenir le token → https://www.sanity.io/manage/personal/project/aov6i15k/api
 */

import { createClient } from '@sanity/client'
import 'dotenv/config'

const client = createClient({
  projectId: 'aov6i15k',
  dataset:   'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_API_TOKEN,
  useCdn:    false,
})

// ── Helpers ──────────────────────────────────────────────────────────
let keyCounter = 0
const key  = () => `k${++keyCounter}`
const span = (text, marks = []) => ({ _type: 'span', _key: key(), text, marks })
const bold = (text) => span(text, ['strong'])

const para = (children) => ({
  _type: 'block', _key: key(), style: 'normal',
  markDefs: [], children: Array.isArray(children) ? children : [span(children)],
})
const h2 = (text) => ({
  _type: 'block', _key: key(), style: 'h2', markDefs: [], children: [span(text)],
})
const h3 = (text) => ({
  _type: 'block', _key: key(), style: 'h3', markDefs: [], children: [span(text)],
})
const quote = (text) => ({
  _type: 'block', _key: key(), style: 'blockquote', markDefs: [], children: [span(text)],
})
const bullet = (items) => items.map(text => ({
  _type: 'block', _key: key(), style: 'normal', listItem: 'bullet', level: 1,
  markDefs: [], children: Array.isArray(text) ? text : [span(text)],
}))
const numbered = (items) => items.map(text => ({
  _type: 'block', _key: key(), style: 'normal', listItem: 'number', level: 1,
  markDefs: [], children: Array.isArray(text) ? text : [span(text)],
}))
const code = (codeStr, language = 'text') => ({
  _type: 'code', _key: key(), language, code: codeStr,
})
const callout = (emoji, title, body) => ({
  _type: 'callout', _key: key(), emoji, title, body,
})

// ── Contenu du chapitre ──────────────────────────────────────────────
const content = [

  // ─── INTRODUCTION ────────────────────────────────────────────────
  para([
    bold('Une option financière'),
    span(' est un contrat qui donne à son détenteur le '),
    bold('droit, mais non l\'obligation'),
    span(', d\'acheter ou de vendre un actif sous-jacent (action, indice, matière première, devise) à un prix fixé à l\'avance, appelé '),
    bold('prix d\'exercice'),
    span(' ou '),
    bold('strike'),
    span(', avant ou à une date d\'échéance précise.'),
  ]),

  para([
    span('Les options sont des '),
    bold('instruments dérivés'),
    span(' : leur valeur dépend d\'un actif sous-jacent. Elles sont utilisées à la fois pour se couvrir contre un risque (hedging) et pour prendre des positions spéculatives avec un effet de levier important.'),
  ]),

  callout('📌', 'Vocabulaire clé', 'Actif sous-jacent : l\'actif sur lequel porte l\'option (ex. : action Total, indice CAC 40). Strike (K) : le prix d\'exercice convenu. Prime : le prix payé pour acquérir l\'option. Échéance (T) : la date limite pour exercer l\'option.'),

  // ─── CALL ────────────────────────────────────────────────────────
  h2('L\'option Call — le droit d\'acheter'),

  para([
    span('Un '),
    bold('call'),
    span(' donne à l\'acheteur le droit d\'acheter l\'actif sous-jacent au prix strike K. L\'acheteur du call parie que le prix du sous-jacent va '),
    bold('monter au-dessus du strike'),
    span(' avant l\'échéance.'),
  ]),

  h3('Fonctionnement'),

  para('Prenons une action qui vaut actuellement 100 €. Vous achetez un call avec un strike de 105 € et une échéance dans 3 mois, pour une prime de 4 €.'),

  bullet([
    [bold('Si l\'action monte à 120 € :'), span(' vous exercez le call, achetez à 105 €, revendez à 120 €. Gain brut = 15 €, gain net = 15 − 4 = '), bold('+ 11 €')],
    [bold('Si l\'action reste à 100 € :'), span(' vous n\'exercez pas (inutile d\'acheter à 105 € ce qui vaut 100 €). Vous perdez la prime : '), bold('− 4 €')],
    [bold('Si l\'action chute à 85 € :'), span(' vous n\'exercez pas. Perte limitée à la prime : '), bold('− 4 €')],
  ]),

  callout('💡', 'Profil de gain du Call', 'Perte maximale : limitée à la prime payée. Gain potentiel : illimité (croît avec la hausse du sous-jacent). Point mort (break-even) : Strike + Prime = 105 + 4 = 109 €'),

  code(
    `Payoff acheteur Call = max(S_T − K, 0) − Prime

S_T = prix du sous-jacent à l'échéance
K   = strike = 105 €
Prime = 4 €

Si S_T = 120 €  →  max(120 − 105, 0) − 4 = 15 − 4 = +11 €
Si S_T = 100 €  →  max(100 − 105, 0) − 4 = 0  − 4 = −4 €`,
    'text'
  ),

  h3('Position vendeur (Call court)'),

  para([
    span('Le vendeur du call encaisse la prime mais prend le risque inverse. Si le sous-jacent monte fortement, sa '),
    bold('perte est théoriquement illimitée'),
    span('. C\'est pourquoi les vendeurs de calls à nu sont soumis à des appels de marge importants.'),
  ]),

  // ─── PUT ─────────────────────────────────────────────────────────
  h2('L\'option Put — le droit de vendre'),

  para([
    span('Un '),
    bold('put'),
    span(' donne à l\'acheteur le droit de vendre l\'actif sous-jacent au prix strike K. L\'acheteur du put parie que le prix va '),
    bold('baisser en dessous du strike'),
    span('. Le put est souvent utilisé comme une '),
    bold('assurance'),
    span(' contre une baisse.'),
  ]),

  h3('Fonctionnement'),

  para('Une action vaut 100 €. Vous achetez un put avec un strike de 95 €, prime de 3 €.'),

  bullet([
    [bold('Si l\'action chute à 75 € :'), span(' vous exercez le put, vendez à 95 €. Gain brut = 20 €, gain net = 20 − 3 = '), bold('+ 17 €')],
    [bold('Si l\'action reste à 100 € :'), span(' vous n\'exercez pas. Perte limitée à la prime : '), bold('− 3 €')],
    [bold('Si l\'action monte à 115 € :'), span(' vous n\'exercez pas. Perte = prime : '), bold('− 3 €')],
  ]),

  code(
    `Payoff acheteur Put = max(K − S_T, 0) − Prime

K     = strike = 95 €
Prime = 3 €

Si S_T = 75 €  →  max(95 − 75, 0) − 3 = 20 − 3 = +17 €
Si S_T = 100 € →  max(95 − 100, 0) − 3 = 0 − 3  = −3 €`,
    'text'
  ),

  callout('🛡️', 'Put = assurance de portefeuille', 'Un investisseur détenant 1 000 actions Total à 50 € peut acheter des puts strike 45 € pour se protéger d\'une baisse. Si Total tombe à 35 €, les puts compensent la perte. Le coût des puts est l\'équivalent d\'une prime d\'assurance.'),

  // ─── CALL vs PUT ─────────────────────────────────────────────────
  h2('Synthèse : Call vs Put'),

  code(
    `┌─────────────┬──────────────────────────┬──────────────────────────┐
│             │       CALL (achat)        │       PUT (vente)         │
├─────────────┼──────────────────────────┼──────────────────────────┤
│ Droit       │ Acheter au strike         │ Vendre au strike          │
│ Pari        │ Hausse du sous-jacent     │ Baisse du sous-jacent     │
│ Gain max    │ Illimité                  │ Strike − Prime (si S→0)   │
│ Perte max   │ Prime payée               │ Prime payée               │
│ Break-even  │ Strike + Prime            │ Strike − Prime            │
└─────────────┴──────────────────────────┴──────────────────────────┘`,
    'text'
  ),

  // ─── BLACK-SCHOLES ───────────────────────────────────────────────
  h2('Le modèle Black-Scholes'),

  para([
    span('Développé en 1973 par Fischer Black, Myron Scholes et Robert Merton (Prix Nobel 1997), le modèle Black-Scholes fournit une '),
    bold('formule fermée pour valoriser les options européennes'),
    span(' (exerçables uniquement à l\'échéance).'),
  ]),

  h3('Les hypothèses du modèle'),

  bullet([
    'Le sous-jacent suit un mouvement brownien géométrique (rendements log-normaux)',
    'Pas de dividendes versés pendant la vie de l\'option',
    'Taux d\'intérêt sans risque (r) constant',
    'Volatilité (σ) constante sur la durée de vie de l\'option',
    'Marchés efficients — pas de coûts de transaction, pas d\'arbitrage',
    'Options européennes uniquement (pas d\'exercice anticipé)',
  ]),

  h3('La formule'),

  code(
    `Prix Call  C = S₀ · N(d₁) − K · e^(−rT) · N(d₂)
Prix Put   P = K · e^(−rT) · N(−d₂) − S₀ · N(−d₁)

Avec :
  d₁ = [ ln(S₀/K) + (r + σ²/2) · T ] / (σ · √T)
  d₂ = d₁ − σ · √T

  S₀  = prix actuel du sous-jacent
  K   = strike (prix d'exercice)
  r   = taux sans risque (annualisé, continu)
  σ   = volatilité annualisée du sous-jacent
  T   = durée jusqu'à l'échéance (en années)
  N() = fonction de répartition de la loi normale centrée réduite`,
    'text'
  ),

  callout('🧮', 'Exemple numérique', 'S₀ = 100 €, K = 105 €, r = 3%, σ = 20%, T = 0,25 an (3 mois)\n\nd₁ = [ln(100/105) + (0,03 + 0,02) × 0,25] / (0,20 × 0,5)\n   = [−0,0488 + 0,0125] / 0,10 = −0,363\n\nd₂ = −0,363 − 0,10 = −0,463\n\nN(d₁) = 0,358  |  N(d₂) = 0,322\n\nC = 100 × 0,358 − 105 × e^(−0,03×0,25) × 0,322\n  = 35,8 − 105 × 0,9925 × 0,322 ≈ 35,8 − 33,6 ≈ 2,2 €'),

  // ─── PARAMÈTRES ──────────────────────────────────────────────────
  h2('Les paramètres et leur influence sur le prix'),

  para('Cinq paramètres déterminent le prix d\'une option. Comprendre leur influence est essentiel pour gérer un portefeuille d\'options.'),

  h3('1. Le prix du sous-jacent (S₀)'),

  bullet([
    [bold('Call :'), span(' ↑ S₀  →  ↑ prix du call. Plus le sous-jacent est haut par rapport au strike, plus le call est dans la monnaie (in-the-money).')],
    [bold('Put :'), span(' ↑ S₀  →  ↓ prix du put. La probabilité de terminer dans la monnaie diminue.')],
  ]),

  h3('2. Le strike (K)'),

  bullet([
    [bold('Call :'), span(' ↑ K  →  ↓ prix du call (plus difficile à atteindre)')],
    [bold('Put :'), span(' ↑ K  →  ↑ prix du put (droit de vendre à un prix plus élevé)')],
  ]),

  h3('3. La volatilité implicite (σ)'),

  para([
    span('La volatilité est le paramètre '),
    bold('le plus important en pratique'),
    span('. Elle mesure l\'amplitude attendue des variations du sous-jacent.'),
  ]),

  bullet([
    '↑ σ  →  ↑ prix du call ET du put — les deux bénéficient d\'une plus grande incertitude',
    'Une forte volatilité augmente la probabilité d\'une grande variation dans n\'importe quelle direction',
    'Les options sont parfois appelées "des paris sur la volatilité"',
  ]),

  callout('⚠️', 'Volatilité historique vs implicite', 'La volatilité historique (réalisée) est calculée sur les données passées. La volatilité implicite est extraite du prix de marché de l\'option via Black-Scholes. Le VIX ("indice de la peur") mesure la volatilité implicite des options sur le S&P 500.'),

  h3('4. Le taux sans risque (r)'),

  bullet([
    [bold('Call :'), span(' ↑ r  →  ↑ prix du call (valeur actualisée du strike diminue, donc le call vaut plus)')],
    [bold('Put :'), span(' ↑ r  →  ↓ prix du put')],
    span('En pratique, l\'impact du taux est souvent secondaire comparé à celui de la volatilité et du sous-jacent'),
  ]),

  h3('5. La durée à l\'échéance (T)'),

  bullet([
    '↑ T  →  ↑ prix du call et du put — plus de temps = plus de chances de variation favorable',
    'Un call à 1 an vaut plus qu\'un call à 1 mois, toutes choses égales',
    'La valeur temps diminue de façon accélérée en approchant de l\'échéance (effet thêta)',
  ]),

  code(
    `Résumé de l'impact des paramètres sur le prix des options :

Paramètre       ↑       | Effet Call | Effet Put
──────────────────────────────────────────────────
Prix S₀         ↑       |    + ↑     |    − ↓
Strike K        ↑       |    − ↓     |    + ↑
Volatilité σ    ↑       |    + ↑     |    + ↑
Taux r          ↑       |    + ↑     |    − ↓
Durée T         ↑       |    + ↑     |    + ↑`,
    'text'
  ),

  // ─── LES GRECS ───────────────────────────────────────────────────
  h2('Les Grecs — mesurer la sensibilité'),

  para([
    span('Les '),
    bold('Grecs'),
    span(' sont des indicateurs de sensibilité qui mesurent comment le prix d\'une option réagit à la variation de chaque paramètre. Ils sont indispensables pour gérer un portefeuille d\'options.'),
  ]),

  h3('Delta (Δ)'),

  para([
    span('Le delta mesure la variation du prix de l\'option pour une variation de 1 € du sous-jacent. Il est aussi interprété comme la '),
    bold('probabilité approximative'),
    span(' que l\'option expire dans la monnaie.'),
  ]),

  code(
    `Delta Call  ∈ [0, 1]   |  Delta Put  ∈ [−1, 0]

Exemples :
  Call ATM (S = K) :  Δ ≈ 0,50  →  si S monte de 1 €, le call gagne ~0,50 €
  Call ITM (S >> K) : Δ ≈ 0,85  →  se comporte presque comme le sous-jacent
  Call OTM (S << K) : Δ ≈ 0,10  →  peu sensible aux variations

ATM  = At the Money  (S ≈ K)
ITM  = In the Money  (Call : S > K  |  Put : S < K)
OTM  = Out the Money (Call : S < K  |  Put : S > K)`,
    'text'
  ),

  h3('Gamma (Γ)'),

  para([
    span('Le gamma mesure la variation du delta quand le sous-jacent bouge de 1 €. Un gamma élevé signifie que le delta change rapidement — l\'option est '),
    bold('sensible aux grands mouvements'),
    span('. Maximum pour les options ATM proches de l\'échéance.'),
  ]),

  h3('Thêta (Θ)'),

  para([
    span('Le thêta mesure la perte de valeur de l\'option avec le temps ('),
    bold('time decay'),
    span('). Généralement négatif pour l\'acheteur — l\'option perd de sa valeur chaque jour qui passe, même si le sous-jacent ne bouge pas.'),
  ]),

  callout('⏱️', 'Effet thêta acceleré', 'La dégradation temporelle n\'est pas linéaire. Elle s\'accélère fortement dans les 30 derniers jours avant l\'échéance. Un acheteur d\'option ATM peut perdre 50 % de sa valeur temps dans les 2 dernières semaines.'),

  h3('Véga (ν)'),

  para([
    span('Le véga mesure la sensibilité du prix de l\'option à une variation de 1 % de la volatilité implicite. Toujours positif pour l\'acheteur — '),
    bold('une hausse de volatilité profite aux acheteurs d\'options'),
    span(' (call et put).'),
  ]),

  h3('Rho (ρ)'),

  para('Le rho mesure la sensibilité au taux d\'intérêt. Positif pour les calls, négatif pour les puts. Paramètre le moins surveillé en pratique.'),

  code(
    `Récapitulatif des Grecs :

Grec    | Mesure                          | Signe Call | Signe Put
──────────────────────────────────────────────────────────────────
Delta Δ | Sensibilité au sous-jacent       |   0 à +1   |  −1 à 0
Gamma Γ | Variation du delta               |   Positif  |  Positif
Thêta Θ | Perte de valeur temps / jour     |   Négatif  |  Négatif
Véga  ν | Sensibilité à la volatilité (1%) |   Positif  |  Positif
Rho   ρ | Sensibilité au taux d'intérêt   |   Positif  |  Négatif`,
    'text'
  ),

  // ─── EXEMPLES PRATIQUES ──────────────────────────────────────────
  h2('Exemples pratiques'),

  h3('Exemple 1 — Spéculation haussière à levier'),

  para([
    bold('Contexte :'),
    span(' TotalEnergies est à 60 €. Vous pensez qu\'elle va monter à 70 € dans 2 mois après la publication des résultats.'),
  ]),

  numbered([
    'Vous achetez 10 calls strike 62 €, échéance 2 mois, prime = 1,80 € par action',
    'Chaque contrat porte sur 100 actions → Investissement total = 10 × 100 × 1,80 = 1 800 €',
    'Si TotalEnergies monte à 70 € : Payoff = (70 − 62) × 1 000 = 8 000 €, profit net = 8 000 − 1 800 = +6 200 €',
    'Rendement = +344 % sur 1 800 € investis (vs +16,7 % en achetant l\'action directement)',
    'Si TotalEnergies reste sous 62 € : perte totale de la prime = −1 800 €',
  ]),

  h3('Exemple 2 — Couverture (hedging) avec un Put'),

  para([
    bold('Contexte :'),
    span(' Vous détenez 500 actions LVMH à 800 €. Vous craignez une correction avant les résultats semestriels.'),
  ]),

  numbered([
    'Vous achetez 5 puts strike 760 €, échéance 1 mois, prime = 12 € par action',
    'Coût total de la couverture = 5 × 100 × 12 = 6 000 €',
    'Si LVMH tombe à 700 € : Payoff puts = (760 − 700) × 500 = 30 000 €, perte sur actions = (800 − 700) × 500 = 50 000 €, perte nette = −26 000 € au lieu de −50 000 €',
    'Le put agit comme une assurance — la prime de 6 000 € est le "coût" de la protection',
  ]),

  h3('Exemple 3 — Stratégie vendeuse (vente de call couvert)'),

  para([
    bold('Contexte :'),
    span(' Vous détenez 100 actions Airbus à 150 €. Vous pensez que le titre va rester stable.'),
  ]),

  numbered([
    'Vous vendez 1 call strike 160 €, échéance 1 mois, prime encaissée = 3,50 €',
    'Vous encaissez immédiatement 350 € (revenus supplémentaires = 2,3 % mensuel)',
    'Si Airbus reste sous 160 € : vous gardez la prime → stratégie gagnante',
    'Si Airbus dépasse 160 € : vos actions sont "appelées" à 160 €, mais vous avez vendu votre upside au-delà de 160 €',
    'Gain maximum = (160 − 150) × 100 + 350 = 1 350 €',
  ]),

  callout('🎯', 'Stratégies combinées', 'En combinant calls et puts, il est possible de construire des stratégies complexes adaptées à chaque anticipation de marché : Straddle (achat call + put même strike) : profite d\'une forte volatilité dans les deux sens. Spread haussier : achat call ITM + vente call OTM → coût réduit, gain limité. Collar : achat put protecteur + vente call pour financer la prime.'),

  // ─── CONCLUSION ──────────────────────────────────────────────────
  h2('Points clés à retenir'),

  bullet([
    'Un call = droit d\'acheter → parie sur la hausse. Un put = droit de vendre → parie sur la baisse',
    'L\'acheteur d\'option paie une prime et a une perte limitée à cette prime',
    'Black-Scholes valorise les options européennes à partir de 5 paramètres : S, K, σ, r, T',
    'La volatilité implicite est le paramètre le plus surveille par les traders d\'options',
    'Les Grecs (Δ, Γ, Θ, ν, ρ) quantifient les sensibilités et permettent de gérer le risque',
    'Un portefeuille delta-neutre est couvert contre les petits mouvements du sous-jacent',
  ]),

  quote('Les options ne sont pas des instruments spéculatifs dangereux par nature — elles le deviennent seulement quand on ne comprend pas leurs sensibilités.'),
]

// ── Document Sanity ──────────────────────────────────────────────────
const chapter = {
  _type: 'chapter',
  title: 'Les Options Financières : Call, Put & Modèle Black-Scholes',
  slug:  { _type: 'slug', current: 'options-call-put-black-scholes' },
  domain: 'finance',
  part:   2,
  partTitle: 'Instruments Dérivés',
  order:  1,
  accessLevel: 'free',
  difficulty: 'intermediate',
  estimatedReadingTime: 15,
  quizAvailable: false,
  excerpt: 'Maîtrisez les fondamentaux des options financières : la mécanique des calls et puts, la valorisation par Black-Scholes et les Grecs pour mesurer et gérer les risques.',
  content,
}

// ── Insertion ────────────────────────────────────────────────────────
try {
  const existing = await client.fetch(
    `*[_type == "chapter" && slug.current == $slug][0]._id`,
    { slug: chapter.slug.current }
  )

  let result
  if (existing) {
    result = await client.createOrReplace({ _id: existing, ...chapter })
    console.log(`✅ Chapitre mis à jour : ${result._id}`)
  } else {
    result = await client.create(chapter)
    console.log(`✅ Chapitre créé : ${result._id}`)
  }

  console.log(`🔗 Slug : ${chapter.slug.current}`)
  console.log(`📖 URL  : http://localhost:3000/documentation/${chapter.slug.current}`)
} catch (err) {
  if (err.message?.includes('401') || err.message?.includes('Unauthorized') || err.message?.includes('your-read-token')) {
    console.error(`
❌ Token Sanity manquant ou invalide.

1. Va sur https://www.sanity.io/manage/personal/project/aov6i15k/api
2. Clique "Add API token"
3. Nom : "Seed script", permissions : "Editor"
4. Copie le token et mets-le dans .env.local :
   SANITY_API_TOKEN=ton-vrai-token-ici
5. Relance : node scripts/seed-chapter-options.mjs
`)
  } else {
    console.error('❌ Erreur :', err.message)
  }
  process.exit(1)
}
