// node scripts/seed-articles-futures.mjs
// Crée deux articles liés au chapitre futures-forwards :
//   1. "Le contango et le backwardation" (structure des courbes à terme)
//   2. "La couverture de change en entreprise" (application concrète des forwards)
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

// ── Helpers ──────────────────────────────────────────────────────────
let kc = 0
const k    = () => `k${++kc}`
const span = (text, marks = []) => ({ _type: 'span', _key: k(), text, marks })
const bold = (text) => span(text, ['strong'])
const para = (children) => ({
  _type: 'block', _key: k(), style: 'normal', markDefs: [],
  children: Array.isArray(children) ? children : [span(children)],
})
const h2 = (text) => ({ _type: 'block', _key: k(), style: 'h2', markDefs: [], children: [span(text)] })
const h3 = (text) => ({ _type: 'block', _key: k(), style: 'h3', markDefs: [], children: [span(text)] })
const quote = (text) => ({ _type: 'block', _key: k(), style: 'blockquote', markDefs: [], children: [span(text)] })
const bullet = (items) => items.map(text => ({
  _type: 'block', _key: k(), style: 'normal', listItem: 'bullet', level: 1,
  markDefs: [], children: Array.isArray(text) ? text : [span(text)],
}))
const numbered = (items) => items.map(text => ({
  _type: 'block', _key: k(), style: 'normal', listItem: 'number', level: 1,
  markDefs: [], children: Array.isArray(text) ? text : [span(text)],
}))
const code = (codeStr, language = 'text') => ({ _type: 'code', _key: k(), language, code: codeStr })
const callout = (emoji, title, body) => ({ _type: 'callout', _key: k(), emoji, title, body })

// ── ARTICLE 1 : Contango et Backwardation ───────────────────────────
const article1Content = [
  para([
    span('La '),
    bold('courbe des futures'),
    span(' (ou structure des termes) représente les prix des contrats à terme d\'une même matière première pour différentes échéances. Sa forme — inclinée vers le haut ou vers le bas — révèle les anticipations du marché et les tensions physiques sur l\'offre et la demande.'),
  ]),

  h2('Contango — le marché "normal"'),

  para([
    span('Un marché est en '),
    bold('contango'),
    span(' lorsque le prix des futures à longue échéance est '),
    bold('supérieur'),
    span(' au prix spot. C\'est la configuration la plus courante pour les actifs stockables (pétrole, gaz, métaux).'),
  ]),

  para([
    span('Le contango reflète simplement le '),
    bold('coût de portage'),
    span(' : pour livrer du pétrole dans 12 mois, il faut l\'acheter aujourd\'hui, le stocker et le financer. Le prix du future intègre ces coûts.'),
  ]),

  code(
    `Exemple — Courbe Brent en contango (typique) :

Échéance    | Prix $/baril
────────────────────────────
Spot (M0)   |   80,00
M+1         |   80,80
M+3         |   81,50
M+6         |   82,40
M+12        |   83,80

Structure croissante = contango
Pente ≈ coûts de stockage + financement − convenience yield`,
    'text'
  ),

  callout('📦', 'Convenience yield', 'Le "convenience yield" est la valeur implicite de détenir physiquement la matière première plutôt que le contrat à terme. Un raffineur qui stocke du pétrole bénéficie d\'une flexibilité de production que le simple contrat ne procure pas. Quand le convenience yield est élevé, il réduit le prix forward et peut provoquer le backwardation.'),

  h2('Backwardation — le marché "tendu"'),

  para([
    span('Un marché est en '),
    bold('backwardation'),
    span(' lorsque le prix spot est '),
    bold('supérieur'),
    span(' au prix des futures lointains. Cette configuration signale une tension physique immédiate sur le marché : les acteurs sont prêts à payer plus cher pour obtenir l\'actif maintenant plutôt que plus tard.'),
  ]),

  para([
    span('Le backwardation est fréquent lors des chocs géopolitiques (embargo pétrolier, sanctions), des sécheresses agricoles, ou quand les stocks physiques sont très bas.'),
  ]),

  code(
    `Exemple — Brent en backwardation (choc d'offre) :

Échéance    | Prix $/baril
────────────────────────────
Spot (M0)   |   90,00
M+1         |   89,20
M+3         |   87,50
M+6         |   85,00
M+12        |   82,40

Structure décroissante = backwardation
Signal : offre physique insuffisante maintenant`,
    'text'
  ),

  h2('Impact sur les investisseurs en ETF futures'),

  para([
    span('Un investisseur exposé via des ETF sur futures (ex. un ETF pétrole) est soumis au '),
    bold('roll yield'),
    span(' : chaque mois, le fonds vend les contrats arrivant à échéance et achète les contrats du mois suivant.'),
  ]),

  bullet([
    [bold('En contango :'), span(' le fonds vend bas (le contrat proche) et rachète haut (le contrat lointain). Effet négatif sur la performance — le "roll cost" érode la valeur même si le spot ne bouge pas.')],
    [bold('En backwardation :'), span(' le fonds vend haut et rachète bas. Effet positif — un "roll yield" positif vient s\'ajouter à la performance.')],
  ]),

  code(
    `Exemple chiffré — Impact du contango sur un ETF pétrole :

Prix spot constant à 80 $/baril pendant 12 mois.
Contango de 5 % sur la courbe (M12 = 84 $)

→ Chaque mois, le fonds "roule" ses contrats en payant le contango
→ Perte annuelle ≈ −5 % liée au roll cost
→ Malgré un spot stable, la NAV de l'ETF baisse de ~5 %

C'est pourquoi les ETF pétrole sous-performent systématiquement
le prix spot du baril en période de contango prolongé.`,
    'text'
  ),

  h2('Mesurer la structure : la courbe forward'),

  para([
    span('Les traders suivent en permanence la '),
    bold('forward curve'),
    span(' pour détecter des anomalies et des opportunités d\'arbitrage. Un aplatissement brutal de la courbe, ou un passage soudain en backwardation, sont des signaux d\'alerte sur l\'état physique du marché.'),
  ]),

  bullet([
    'Contango raide → stockage rentable, marché bien approvisionné',
    'Backwardation → marché en tension, primes de livraison immédiates élevées',
    'Courbe plate → équilibre offre/demande, faible prime de risque',
  ]),

  quote('Le contango est une taxe silencieuse pour l\'investisseur passif sur matières premières. Le backwardation est un cadeau — mais il traduit toujours une tension quelque part dans la chaîne physique.'),
]

// ── ARTICLE 2 : Couverture de change en entreprise ───────────────────
const article2Content = [
  para([
    span('La gestion du risque de change est une priorité absolue pour toute entreprise opérant à l\'international. Une variation de 5 % des taux de change peut anéantir la marge d\'un contrat export ou transformer une acquisition à l\'étranger en désastre financier. Les '),
    bold('forwards de change'),
    span(' sont l\'outil le plus utilisé par les trésoriers d\'entreprise pour éliminer ce risque.'),
  ]),

  h2('Identifier et quantifier l\'exposition'),

  para([
    span('Avant de couvrir, il faut mesurer. L\'exposition de change prend trois formes :'),
  ]),

  bullet([
    [bold('Exposition transactionnelle :'), span(' flux futurs en devises étrangères (factures clients ou fournisseurs, dividendes reçus d\'une filiale). C\'est l\'exposition la plus facile à identifier et à couvrir.')],
    [bold('Exposition de bilan (traduction) :'), span(' une filiale étrangère est consolidée en euros. Si l\'EUR/USD monte, la valeur en euros des actifs de la filiale américaine diminue.')],
    [bold('Exposition économique :'), span(' impact à long terme de la compétitivité — un euro fort renchérit les exportations françaises face aux concurrents américains.')],
  ]),

  h2('La couverture par forward — mécanisme pas à pas'),

  h3('Cas 1 : Exportateur européen payé en dollars'),

  para([
    bold('Situation :'),
    span(' Une PME française signe un contrat de 500 000 USD livrable dans 3 mois. EUR/USD spot = 1,10.'),
  ]),

  numbered([
    [bold('Risque :'), span(' si l\'EUR/USD monte à 1,15 dans 3 mois, les 500 000 USD ne vaudront que 434 782 € au lieu de 454 545 € → perte de 19 763 €.')],
    [bold('Couverture :'), span(' vente d\'un forward EUR/USD à 3 mois au taux de 1,101 (taux forward calculé sur les taux différentiels).')],
    [bold('Dans 3 mois :'), span(' quelle que soit l\'évolution du marché, l\'entreprise vend ses 500 000 USD à 1,101 → reçoit 454 132 €.')],
    [bold('Résultat :'), span(' le taux de change est fixé dès aujourd\'hui, les flux sont certains, la marge commerciale est sécurisée.')],
  ]),

  code(
    `Taux forward EUR/USD 3 mois :
F = 1,10 × e^((r_EUR − r_USD) × 0,25)
  = 1,10 × e^((0,02 − 0,04) × 0,25)
  = 1,10 × e^(−0,005)
  ≈ 1,10 × 0,9950
  ≈ 1,0945

→ Dollar en déport (discount) car taux USD > taux EUR
   L'exportateur vend USD "moins cher" au forward
   mais c'est le prix juste du marché — pas de magie`,
    'text'
  ),

  h3('Cas 2 : Importateur européen payant en dollars'),

  para([
    bold('Situation :'),
    span(' Un distributeur français importe pour 2 000 000 USD de marchandises, paiement dans 6 mois.'),
  ]),

  numbered([
    [bold('Risque :'), span(' si l\'EUR/USD chute à 1,05 dans 6 mois, la facture coûtera 1 904 762 € au lieu de 1 818 182 € → surcoût de 86 580 €.')],
    [bold('Couverture :'), span(' achat d\'un forward EUR/USD à 6 mois — l\'importateur fixe le taux auquel il achètera des dollars.')],
    [bold('Résultat :'), span(' la facture en euros est connue dès la signature du contrat d\'achat. Pas de surprise.')],
  ]),

  h2('Options de change vs Forwards'),

  para([
    span('Le forward fixe le taux de façon rigide — c\'est une '),
    bold('couverture symétrique'),
    span('. Si la devise évolue en votre faveur, vous ne profitez pas de la hausse (vous êtes engagé sur le forward). Une '),
    bold('option de change'),
    span(' offre plus de flexibilité : vous fixez un taux plancher tout en conservant le bénéfice d\'un mouvement favorable.'),
  ]),

  code(
    `Comparaison Forward vs Option sur l'exemple exportateur :

Taux spot dans 3 mois = 1,05 (USD affaibli → favorable à l'exportateur)

Forward     : obligé de vendre à 1,0945 → reçoit 456 770 $
Option put  : n'exerce pas l'option, vend au spot 1,05 → reçoit 476 190 $
             Gain vs forward : +19 420 €
             Coût de l'option (prime) : ~ 8 000 €
             Gain net : +11 420 €

→ L'option est plus coûteuse mais préserve l'upside`,
    'text'
  ),

  h2('Politique de couverture : les bonnes pratiques'),

  bullet([
    [bold('Définir un horizon de couverture :'), span(' couvrir 100 % des flux certains, 50 à 70 % des flux probables (backlog de commandes), rien sur les flux hypothétiques.')],
    [bold('Étaler les échéances :'), span(' éviter de tout concentrer sur une seule date — répartir les forwards sur plusieurs maturités.')],
    [bold('Documenter en comptabilité de couverture (IFRS 9) :'), span(' permet de reconnaître les gains/pertes sur dérivés en même temps que l\'élément couvert, évitant la volatilité du résultat.')],
    [bold('Surveillance régulière :'), span(' si une commande est annulée, le forward devient spéculatif — il faut le dénouer ou le reconduire.')],
  ]),

  callout('📋', 'IFRS 9 — Comptabilité de couverture', 'La norme IFRS 9 permet aux entreprises de désigner formellement un dérivé comme instrument de couverture. Les variations de valeur du dérivé sont alors comptabilisées dans les "autres éléments du résultat global" (OCI) et non en P&L, réduisant la volatilité apparente des résultats trimestriels.'),

  h2('Le marché du change en chiffres'),

  code(
    `Volumes quotidiens sur le marché des changes (BIS Triennial Survey) :

Marché global FX     : ~7 500 milliards USD/jour (le plus grand marché au monde)
Dont :
  Transactions spot  : ~2 100 Mrd$
  Forwards outright  : ~1 100 Mrd$
  Swaps de change    : ~3 800 Mrd$
  Options de change  :   ~300 Mrd$

Principales paires (% des volumes) :
  EUR/USD : 22%
  USD/JPY : 17%
  GBP/USD :  9%
  USD/CNY :  7%`,
    'text'
  ),

  quote('Un trésorier qui ne couvre pas son exposition de change ne fait pas de l\'économie — il fait du pari. La couverture ne génère pas de profit, mais elle préserve la lisibilité du business.'),
]

// ── Récupération du chapitre parent ──────────────────────────────────
const chapterId = await client.fetch(
  `*[_type == "chapter" && slug.current == "futures-forwards"][0]._id`
)

if (!chapterId) {
  console.error('❌ Chapitre "futures-forwards" introuvable — lancez d\'abord seed-chapter-futures-forwards.mjs')
  process.exit(1)
}

// ── Article 1 ─────────────────────────────────────────────────────────
const art1 = {
  _type: 'article',
  title: 'Contango et Backwardation — Décrypter la Courbe des Futures',
  slug:  { _type: 'slug', current: 'contango-backwardation' },
  domain: 'finance',
  accessLevel: 'free',
  publishedAt: new Date().toISOString(),
  estimatedReadingTime: 8,
  excerpt: 'La forme de la courbe des futures révèle les tensions sur les marchés physiques. Contango, backwardation, roll yield : comprendre ces concepts change la façon d\'investir sur les matières premières.',
  relatedChapters: [{ _type: 'reference', _ref: chapterId }],
  content: article1Content,
}

// ── Article 2 ─────────────────────────────────────────────────────────
const art2 = {
  _type: 'article',
  title: 'La Couverture de Change en Entreprise — Guide Pratique',
  slug:  { _type: 'slug', current: 'couverture-change-entreprise' },
  domain: 'finance',
  accessLevel: 'free',
  publishedAt: new Date().toISOString(),
  estimatedReadingTime: 10,
  excerpt: 'Taux de change, forwards et options : comment les trésoriers d\'entreprise protègent leurs marges contre la volatilité des devises. Cas pratiques import/export et bonnes pratiques IFRS 9.',
  relatedChapters: [{ _type: 'reference', _ref: chapterId }],
  content: article2Content,
}

// ── Insertion ─────────────────────────────────────────────────────────
for (const art of [art1, art2]) {
  const existing = await client.fetch(
    `*[_type == "article" && slug.current == $slug][0]._id`,
    { slug: art.slug.current }
  )

  let result
  if (existing) {
    result = await client.createOrReplace({ _id: existing, ...art })
    console.log(`✅ Article mis à jour : "${art.title}"`)
  } else {
    result = await client.create(art)
    console.log(`✅ Article créé : "${art.title}"`)
  }
  console.log(`   🔗 /articles/${art.slug.current}`)
}

console.log('\n📖 Chapitre parent : http://localhost:3000/documentation/futures-forwards')
