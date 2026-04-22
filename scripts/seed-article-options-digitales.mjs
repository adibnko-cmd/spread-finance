// node scripts/seed-article-options-digitales.mjs
import { createClient } from '@sanity/client'
import { config } from 'dotenv'
config({ path: '.env.local' })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_API_TOKEN,
  useCdn:    false,
})

const ARTICLE_SLUG  = 'options-digitales'
const CHAPTER_SLUG  = 'options-call-put-black-scholes'

// ── 1. ARTICLE ────────────────────────────────────────────────────
const article = {
  _type: 'article',
  title: 'Les Options Digitales — Tout ou Rien',
  slug: { _type: 'slug', current: ARTICLE_SLUG },
  domain: 'finance',
  accessLevel: 'free',
  publishedAt: new Date().toISOString(),
  estimatedReadingTime: 8,
  excerpt: "Les options digitales, ou binaires, versent un montant fixe si une condition est remplie à l'échéance — sinon rien. Un outil de couverture puissant, mais à manier avec précision.",
  content: [
    { _type: 'block', _key: 'intro1', style: 'normal', children: [{ _type: 'span', _key: 's1', text: "Une option digitale (aussi appelée option binaire ou option tout-ou-rien) est un contrat dérivé qui verse un montant fixe prédéfini si le sous-jacent satisfait une condition à l'échéance — et strictement rien dans le cas contraire. C'est le principe du \"tout ou rien\" : pas de payoff intermédiaire, pas de valeur proportionnelle au dépassement du strike.", marks: [] }] },

    { _type: 'block', _key: 'h1', style: 'h2', children: [{ _type: 'span', _key: 's1', text: 'Les deux grandes familles', marks: [] }] },

    { _type: 'block', _key: 'p2', style: 'normal', children: [{ _type: 'span', _key: 's1', text: "On distingue deux types principaux d'options digitales :", marks: [] }] },

    { _type: 'block', _key: 'h2a', style: 'h3', children: [{ _type: 'span', _key: 's1', text: 'Cash-or-Nothing', marks: [] }] },
    { _type: 'block', _key: 'p3', style: 'normal', children: [{ _type: 'span', _key: 's1', text: "L'option Cash-or-Nothing verse un montant fixe Q (souvent 1 € ou 100 €) si le sous-jacent S_T est supérieur au strike K à l'échéance (pour un call), ou inférieur (pour un put). Si la condition n'est pas remplie, le payoff est nul.", marks: [] }] },

    {
      _type: 'code', _key: 'code1',
      language: 'text',
      code: `Payoff Call Cash-or-Nothing :
  Si S_T > K  →  Q (montant fixe, ex : 1 €)
  Si S_T ≤ K  →  0

Payoff Put Cash-or-Nothing :
  Si S_T < K  →  Q
  Si S_T ≥ K  →  0`,
    },

    { _type: 'block', _key: 'h2b', style: 'h3', children: [{ _type: 'span', _key: 's1', text: 'Asset-or-Nothing', marks: [] }] },
    { _type: 'block', _key: 'p4', style: 'normal', children: [{ _type: 'span', _key: 's1', text: "L'option Asset-or-Nothing verse la valeur du sous-jacent S_T lui-même (et non un montant fixe) si la condition est remplie. Un standard call vanilla peut d'ailleurs être décomposé : Call Vanilla = Asset-or-Nothing Call − K × Cash-or-Nothing Call.", marks: [] }] },

    { _type: 'block', _key: 'h3', style: 'h2', children: [{ _type: 'span', _key: 's1', text: 'Pricing Black-Scholes des digitales', marks: [] }] },

    { _type: 'block', _key: 'p5', style: 'normal', children: [{ _type: 'span', _key: 's1', text: 'Dans le cadre Black-Scholes, le prix d\'un Call Cash-or-Nothing (versant 1 € si S_T > K) est simplement la probabilité risk-neutral que le sous-jacent termine au-dessus du strike, actualisée au taux sans risque :', marks: [] }] },

    {
      _type: 'code', _key: 'code2',
      language: 'text',
      code: `Prix Call Digital = e^(-rT) × N(d₂)

où :
  d₂ = [ln(S/K) + (r - σ²/2) × T] / (σ × √T)
  N(d₂) = probabilité risk-neutral que S_T > K
  r = taux sans risque
  σ = volatilité
  T = maturité`,
    },

    { _type: 'block', _key: 'p6', style: 'normal', children: [{ _type: 'span', _key: 's1', text: "Remarque : c'est exactement le deuxième terme de la formule Black-Scholes du call vanilla. La valeur du call vanilla = S × N(d₁) − K × e^(-rT) × N(d₂), donc K × e^(-rT) × N(d₂) est le prix du digital multiplié par K.", marks: [] }] },

    { _type: 'block', _key: 'h4', style: 'h2', children: [{ _type: 'span', _key: 's1', text: 'Les Grecs des options digitales', marks: [] }] },

    { _type: 'block', _key: 'p7', style: 'normal', children: [{ _type: 'span', _key: 's1', text: "Les Grecs des options digitales ont des propriétés particulières qui les rendent délicates à couvrir :", marks: [] }] },

    { _type: 'block', _key: 'list1', style: 'normal', _rawList: true,
      listItem: 'bullet',
      children: [{ _type: 'span', _key: 's1', text: 'Delta : le delta d\'un call digital est toujours positif mais devient extrêmement élevé (spike) au voisinage du strike proche de l\'échéance — ce qui rend la couverture très instable.', marks: [] }]
    },
    { _type: 'block', _key: 'list2', style: 'normal', _rawList: true,
      listItem: 'bullet',
      children: [{ _type: 'span', _key: 's1', text: 'Gamma : le gamma est négatif au-dessus du strike et positif en-dessous (inverse du vanilla). Il peut être extrêmement élevé près du strike à l\'échéance.', marks: [] }]
    },
    { _type: 'block', _key: 'list3', style: 'normal', _rawList: true,
      listItem: 'bullet',
      children: [{ _type: 'span', _key: 's1', text: 'Vega : le vega est négatif pour un call digital in-the-money (une hausse de vol réduit la probabilité de finir dans la monnaie).', marks: [] }]
    },

    {
      _type: 'callout', _key: 'callout1',
      emoji: '⚠️',
      title: 'Attention au pin risk',
      body: "Le risque majeur des options digitales est le 'pin risk' : si le sous-jacent termine exactement au strike à l'échéance, une légère variation de prix peut faire basculer le payoff de 0 à 100%. Les teneurs de marché qui vendent des digitales doivent gérer ce risque avec une extrême précision.",
    },

    { _type: 'block', _key: 'h5', style: 'h2', children: [{ _type: 'span', _key: 's1', text: 'Exemple pratique', marks: [] }] },

    { _type: 'block', _key: 'p8', style: 'normal', children: [{ _type: 'span', _key: 's1', text: "Un trader pense que le CAC 40 finira au-dessus de 7 500 points dans 1 mois. Il achète un Call Digital Cash-or-Nothing : strike = 7 500, montant = 100 €, prime = 35 €.", marks: [] }] },

    {
      _type: 'code', _key: 'code3',
      language: 'text',
      code: `Scénario 1 — CAC 40 à 7 600 à l'échéance :
  S_T = 7 600 > K = 7 500  →  Payoff = 100 €
  Profit net = 100 − 35 = +65 € (gain de 185%)

Scénario 2 — CAC 40 à 7 450 à l'échéance :
  S_T = 7 450 < K = 7 500  →  Payoff = 0 €
  Perte nette = −35 € (perte totale de la prime)`,
    },

    { _type: 'block', _key: 'h6', style: 'h2', children: [{ _type: 'span', _key: 's1', text: 'Cas d\'usage professionnels', marks: [] }] },

    { _type: 'block', _key: 'p9', style: 'normal', children: [{ _type: 'span', _key: 's1', text: "Les options digitales sont utilisées pour :", marks: [] }] },

    { _type: 'block', _key: 'ul1', style: 'normal', listItem: 'bullet', children: [{ _type: 'span', _key: 's1', text: "Couverture de seuils précis : un exportateur qui veut se couvrir si l'EUR/USD passe sous 1,05", marks: [] }] },
    { _type: 'block', _key: 'ul2', style: 'normal', listItem: 'bullet', children: [{ _type: 'span', _key: 's1', text: "Produits structurés : briques de base pour construire des payoffs complexes à capital garanti", marks: [] }] },
    { _type: 'block', _key: 'ul3', style: 'normal', listItem: 'bullet', children: [{ _type: 'span', _key: 's1', text: "Trading directionnel : exposition binaire à un scénario (résultat d'élection, annonce BCE...)", marks: [] }] },
  ],
}

// ── 2. QUIZ de l'article ──────────────────────────────────────────
const quiz = {
  _type: 'quiz',
  chapterSlug: ARTICLE_SLUG,
  level: 1,
  questions: [
    {
      _key: 'q1',
      text: "Quel est le payoff d'un Call Digital Cash-or-Nothing si le sous-jacent termine en-dessous du strike ?",
      explanation: "Par définition, une option digitale verse un montant fixe Q si la condition est remplie, et ZÉRO sinon. Il n'y a aucun payoff intermédiaire.",
      answers: [
        { _key: 'a1', text: "0 — aucun versement", isCorrect: true },
        { _key: 'a2', text: "La différence entre le sous-jacent et le strike", isCorrect: false },
        { _key: 'a3', text: "La prime payée", isCorrect: false },
        { _key: 'a4', text: "Le montant Q divisé par 2", isCorrect: false },
      ],
    },
    {
      _key: 'q2',
      text: "Dans Black-Scholes, le prix d'un Call Digital Cash-or-Nothing est égal à :",
      explanation: "Le prix est e^(-rT) × N(d₂), c'est-à-dire la probabilité risk-neutral que S_T > K, actualisée. C'est exactement le deuxième terme de la formule vanilla.",
      answers: [
        { _key: 'a1', text: "S × N(d₁)", isCorrect: false },
        { _key: 'a2', text: "e^(-rT) × N(d₂)", isCorrect: true },
        { _key: 'a3', text: "S × N(d₁) − K × e^(-rT) × N(d₂)", isCorrect: false },
        { _key: 'a4', text: "N(d₁) − N(d₂)", isCorrect: false },
      ],
    },
    {
      _key: 'q3',
      text: "Qu'est-ce que le 'pin risk' dans le contexte des options digitales ?",
      explanation: "Le pin risk est le risque que le sous-jacent finisse exactement au niveau du strike. Dans ce cas, une variation infime peut faire basculer le payoff de 0 à Q, rendant la couverture impossible.",
      answers: [
        { _key: 'a1', text: "Le risque de ne pas trouver de contrepartie", isCorrect: false },
        { _key: 'a2', text: "Le risque que le sous-jacent termine exactement au strike, rendant le payoff instable", isCorrect: true },
        { _key: 'a3', text: "Le risque de perdre la prime en cas de forte volatilité", isCorrect: false },
        { _key: 'a4', text: "Le risque de liquidité sur les options exotiques", isCorrect: false },
      ],
    },
    {
      _key: 'q4',
      text: "Quelle est la différence entre un Call Digital Cash-or-Nothing et un Call Digital Asset-or-Nothing ?",
      explanation: "Cash-or-Nothing verse un montant fixe Q. Asset-or-Nothing verse la valeur du sous-jacent S_T lui-même si la condition est remplie. Le vanilla = Asset-or-Nothing − K × Cash-or-Nothing.",
      answers: [
        { _key: 'a1', text: "Il n'y a aucune différence, ce sont deux noms pour le même produit", isCorrect: false },
        { _key: 'a2', text: "Cash-or-Nothing verse un montant fixe, Asset-or-Nothing verse la valeur du sous-jacent", isCorrect: true },
        { _key: 'a3', text: "Cash-or-Nothing est européen, Asset-or-Nothing est américain", isCorrect: false },
        { _key: 'a4', text: "Asset-or-Nothing a un strike, Cash-or-Nothing n'en a pas", isCorrect: false },
      ],
    },
    {
      _key: 'q5',
      text: "Le vega d'un Call Digital in-the-money est :",
      explanation: "Le vega est négatif : une hausse de volatilité augmente la dispersion des prix futurs, donc la probabilité que le sous-jacent termine SOUS le strike augmente, ce qui réduit la valeur du call digital.",
      answers: [
        { _key: 'a1', text: "Positif, comme pour un call vanilla", isCorrect: false },
        { _key: 'a2', text: "Nul, la volatilité n'affecte pas les digitales", isCorrect: false },
        { _key: 'a3', text: "Négatif — une hausse de vol réduit la valeur", isCorrect: true },
        { _key: 'a4', text: "Identique au gamma", isCorrect: false },
      ],
    },
  ],
}

async function seed() {
  // ── Supprimer anciens si existants ──
  const oldArticle = await client.fetch(`*[_type=="article" && slug.current=="${ARTICLE_SLUG}"][0]._id`)
  if (oldArticle) { await client.delete(oldArticle); console.log('🗑  Ancien article supprimé') }

  const oldQuiz = await client.fetch(`*[_type=="quiz" && chapterSlug=="${ARTICLE_SLUG}" && level==1][0]._id`)
  if (oldQuiz) { await client.delete(oldQuiz); console.log('🗑  Ancien quiz supprimé') }

  // ── Créer article ──
  const createdArticle = await client.create(article)
  console.log('✅ Article créé :', createdArticle._id)

  // ── Créer quiz ──
  const createdQuiz = await client.create(quiz)
  console.log('✅ Quiz créé :', createdQuiz._id)

  // ── Mettre à jour le chapitre : ajouter section types d'options + lien ──
  const chapterId = await client.fetch(`*[_type=="chapter" && slug.current=="${CHAPTER_SLUG}"][0]._id`)
  if (!chapterId) { console.log('❌ Chapitre introuvable'); return }

  // Récupérer le contenu actuel
  const chapter = await client.fetch(`*[_type=="chapter" && _id=="${chapterId}"][0]{ content }`)
  const existing = chapter.content ?? []

  // Nouveaux blocs à insérer au début du contenu (après le premier bloc intro)
  const newBlocks = [
    {
      _type: 'block', _key: 'types_h2', style: 'h2',
      children: [{ _type: 'span', _key: 's1', text: "Les grandes familles d'options", marks: [] }]
    },
    {
      _type: 'block', _key: 'types_intro', style: 'normal',
      children: [{ _type: 'span', _key: 's1', text: "Au-delà du Call et du Put classiques (options dites « vanilles »), il existe une large famille d'options dites exotiques, chacune adaptée à des besoins de couverture ou de spéculation spécifiques :", marks: [] }]
    },
    {
      _type: 'block', _key: 'types_l1', style: 'normal', listItem: 'bullet',
      children: [
        { _type: 'span', _key: 's1', text: 'Call / Put (vanilles) : ', marks: ['strong'] },
        { _type: 'span', _key: 's2', text: "les options standards vues dans ce chapitre — droit d'acheter ou de vendre à un prix fixé.", marks: [] },
      ]
    },
    {
      _type: 'block', _key: 'types_l2', style: 'normal', listItem: 'bullet',
      children: [
        { _type: 'span', _key: 's1', text: 'Options digitales (binaires) : ', marks: ['strong'] },
        { _type: 'span', _key: 's2', text: 'versent un montant fixe si une condition est remplie, sinon rien. Voir notre article dédié : ', marks: [] },
        {
          _type: 'span', _key: 's3',
          text: 'Les Options Digitales — Tout ou Rien',
          marks: ['articleLink'],
        },
        { _type: 'span', _key: 's4', text: '.', marks: [] },
      ],
      markDefs: [
        {
          _key: 'articleLink',
          _type: 'link',
          href: `/articles/${ARTICLE_SLUG}`,
        }
      ]
    },
    {
      _type: 'block', _key: 'types_l3', style: 'normal', listItem: 'bullet',
      children: [
        { _type: 'span', _key: 's1', text: 'Options asiatiques : ', marks: ['strong'] },
        { _type: 'span', _key: 's2', text: "le payoff dépend de la moyenne du sous-jacent sur une période, et non de son prix à l'échéance. Utiles pour couvrir des flux réguliers (ex : exportateur qui reçoit des USD chaque mois).", marks: [] },
      ]
    },
    {
      _type: 'block', _key: 'types_l4', style: 'normal', listItem: 'bullet',
      children: [
        { _type: 'span', _key: 's1', text: 'Options à barrière : ', marks: ['strong'] },
        { _type: 'span', _key: 's2', text: "s'activent (knock-in) ou se désactivent (knock-out) si le sous-jacent franchit un seuil prédéfini. Moins chères que les vanilles car soumises à une condition supplémentaire.", marks: [] },
      ]
    },
    {
      _type: 'block', _key: 'types_l5', style: 'normal', listItem: 'bullet',
      children: [
        { _type: 'span', _key: 's1', text: 'Options lookback : ', marks: ['strong'] },
        { _type: 'span', _key: 's2', text: "le payoff est basé sur le maximum (call) ou le minimum (put) atteint par le sous-jacent pendant la durée de vie de l'option — idéales pour « acheter au plus bas / vendre au plus haut ».", marks: [] },
      ]
    },
    {
      _type: 'callout', _key: 'types_callout',
      emoji: '💡',
      title: 'Vanille vs Exotique',
      body: "Les options vanilles (Call/Put européens ou américains) sont standardisées et cotées sur les marchés organisés. Les options exotiques sont généralement traitées de gré à gré (OTC) et nécessitent des modèles de pricing plus sophistiqués que Black-Scholes standard.",
    },
  ]

  // Insérer après le premier bloc du contenu existant
  const insertAt = 1
  const updatedContent = [
    ...existing.slice(0, insertAt),
    ...newBlocks,
    ...existing.slice(insertAt),
  ]

  await client.patch(chapterId).set({ content: updatedContent }).commit()
  console.log('✅ Chapitre mis à jour avec les types d\'options + lien article')
}

seed().catch(err => { console.error('❌', err); process.exit(1) })
