// node scripts/seed-chapter-futures-forwards.mjs
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

// ── Contenu ──────────────────────────────────────────────────────────
const content = [

  // ── INTRODUCTION ─────────────────────────────────────────────────
  para([
    span('Les '),
    bold('contrats à terme'),
    span(' — futures et forwards — sont des accords par lesquels deux parties s\'engagent à acheter ou vendre un actif à une '),
    bold('date future fixée'),
    span(' et à un '),
    bold('prix convenu aujourd\'hui'),
    span('. Contrairement aux options, il s\'agit d\'une '),
    bold('obligation bilatérale'),
    span(' : les deux parties sont contraintes d\'exécuter l\'opération à l\'échéance.'),
  ]),

  para([
    span('Ces instruments sont au cœur de la gestion des risques de marché. Ils permettent aux entreprises de se couvrir contre la volatilité des taux de change, des taux d\'intérêt ou des prix des matières premières, et aux traders de prendre des positions directionnelles avec un fort '),
    bold('effet de levier'),
    span('.'),
  ]),

  callout('📌', 'Forward vs Future — en un mot', 'Forward : contrat de gré à gré (OTC) entre deux parties, personnalisé, pas de chambre de compensation. Future : contrat standardisé, négocié sur un marché organisé (ex. CME, Euronext), avec appels de marge quotidiens.'),

  // ── FORWARD ──────────────────────────────────────────────────────
  h2('Le contrat Forward'),

  para([
    span('Un '),
    bold('forward'),
    span(' est un accord privé entre deux contreparties (souvent une banque et son client) pour livrer un actif à une date future à un prix déterminé maintenant. Il n\'existe pas de marché secondaire liquide pour les forwards — ils sont sur mesure et non standardisés.'),
  ]),

  h3('Fonctionnement d\'un forward de change'),

  para([
    span('Exemple typique : une entreprise française exportatrice va recevoir '),
    bold('1 000 000 USD dans 6 mois'),
    span('. Elle craint une baisse du dollar. Elle négocie un forward avec sa banque.'),
  ]),

  numbered([
    'Taux de change spot actuel : EUR/USD = 1,10 (1 € = 1,10 $)',
    'Taux forward 6 mois négocié : EUR/USD = 1,08 (basé sur les taux d\'intérêt différentiels)',
    'Dans 6 mois, l\'entreprise vend ses 1 000 000 USD au taux 1,08, quoi qu\'il arrive',
    'Elle reçoit 1 000 000 / 1,08 = 925 926 €',
    'Si le dollar a chuté à 1,15 (EUR/USD) à l\'échéance, sans couverture elle aurait reçu seulement 869 565 € → le forward lui a épargné une perte de 56 361 €',
  ]),

  code(
    `Prix du forward de change (parité des taux d'intérêt) :

F = S₀ × (1 + r_EUR)^T / (1 + r_USD)^T

Ou en taux continus :
F = S₀ × e^((r_EUR − r_USD) × T)

S₀ = taux spot EUR/USD = 1,10
r_EUR = taux €  = 2% par an
r_USD = taux $  = 4% par an
T = 0,5 an

F = 1,10 × e^((0,02 − 0,04) × 0,5)
  = 1,10 × e^(−0,01)
  = 1,10 × 0,9900
  ≈ 1,089

→ Le dollar est en déport (discount) car les taux USD > taux EUR`,
    'text'
  ),

  h3('Les risques du Forward'),

  bullet([
    [bold('Risque de contrepartie :'), span(' si votre contrepartie fait défaut à l\'échéance, vous n\'avez aucune garantie. C\'est le principal risque des contrats OTC.')],
    [bold('Risque d\'illiquidité :'), span(' impossible de sortir facilement — le forward est verrouillé jusqu\'à échéance, sauf à négocier une annulation.')],
    [bold('Pas de mark-to-market :'), span(' les gains/pertes latents ne sont pas réalisés quotidiennement, contrairement aux futures.')],
  ]),

  // ── FUTURE ───────────────────────────────────────────────────────
  h2('Le contrat Future'),

  para([
    span('Un '),
    bold('future'),
    span(' est un contrat standardisé négocié sur une bourse organisée (CME Group, ICE, Euronext...). Une '),
    bold('chambre de compensation (clearing house)'),
    span(' s\'interpose entre acheteur et vendeur, éliminant le risque de contrepartie par un système d\'appels de marge quotidiens.'),
  ]),

  h3('La mécanique des appels de marge'),

  para([
    span('À l\'ouverture d\'une position, le trader dépose un '),
    bold('dépôt de garantie initial (initial margin)'),
    span('. Chaque soir, la chambre de compensation calcule les gains et pertes de la journée ('),
    bold('mark-to-market'),
    span(') et ajuste les comptes. Si votre compte tombe sous le '),
    bold('maintenance margin'),
    span(', vous recevez un appel de marge et devez reconstituer le dépôt.'),
  ]),

  code(
    `Exemple : Future sur le Brent (ICE)

Taille du contrat : 1 000 barils
Marge initiale   : 5 000 $ par contrat
Maintenance margin: 4 000 $ par contrat

Situation : vous achetez 1 contrat à 80 $/baril (valeur notionnelle = 80 000 $)

Jour 1 : prix monte à 81 $ → gain = 1 000 × (81 − 80) = +1 000 $ → crédité sur votre compte
Jour 2 : prix chute à 77 $ → perte = 1 000 × (81 − 77) = −4 000 $ → débité

Votre compte passe de 5 000 + 1 000 − 4 000 = 2 000 $
  < maintenance margin (4 000 $)
→ Appel de marge : vous devez déposer 5 000 − 2 000 = 3 000 $ supplémentaires`,
    'text'
  ),

  callout('⚠️', 'Levier et risque de ruine', 'Sur un contrat Brent à 80 $/baril de taille 1 000 barils, la valeur notionnelle est 80 000 $. Avec une marge initiale de 5 000 $, le levier est de 16x. Une baisse de 3 $/baril efface entièrement votre marge initiale. Le levier amplifie les gains ET les pertes.'),

  h3('Principaux marchés de futures'),

  code(
    `Classe d'actif        | Contrat               | Bourse
──────────────────────────────────────────────────────────
Indices actions       | S&P 500 E-mini        | CME
                      | Euro Stoxx 50          | Eurex
                      | CAC 40 Futures         | Euronext
Taux d'intérêt        | Euribor               | Euronext
                      | T-Bond 10 ans          | CME
Matières premières    | Brent Crude           | ICE
                      | Gold                   | COMEX (CME)
                      | Blé, Maïs, Soja       | CBOT (CME)
Devises               | EUR/USD               | CME
Crypto                | Bitcoin Futures        | CME`,
    'text'
  ),

  // ── PRICING ──────────────────────────────────────────────────────
  h2('Pricing des Futures : le coût de portage'),

  para([
    span('Le prix théorique d\'un future est déterminé par la '),
    bold('relation de coût de portage (cost of carry)'),
    span('. L\'idée est simple : le prix forward doit refléter le coût de détenir l\'actif spot jusqu\'à l\'échéance.'),
  ]),

  h3('Formule générale'),

  code(
    `F = S₀ × e^(rT)

Avec coûts de stockage (u) et revenus (q) :
F = S₀ × e^((r + u − q) × T)

F = prix du future
S₀= prix spot de l'actif aujourd'hui
r = taux sans risque (continu)
T = durée jusqu'à l'échéance (en années)
u = coût de stockage (% annuel) — s'applique aux matières premières
q = rendement de l'actif (dividendes, taux étranger) — réduit le prix forward`,
    'text'
  ),

  h3('Applications par classe d\'actif'),

  code(
    `1. ACTION SANS DIVIDENDE
   F = S₀ × e^(rT)

2. ACTION AVEC DIVIDENDE (taux continu q)
   F = S₀ × e^((r − q) × T)
   Ex : S₀ = 100 €, r = 3%, q = 2%, T = 1 an
   F = 100 × e^(0,01) ≈ 101,01 €

3. MATIÈRE PREMIÈRE (avec coût de stockage u)
   F = S₀ × e^((r + u) × T)
   Ex : Brent S₀ = 80 $, r = 4%, u = 1%, T = 0,5 an
   F = 80 × e^(0,025) ≈ 82,02 $

4. PAIRE DE DEVISES (taux domestique r_d, étranger r_f)
   F = S₀ × e^((r_d − r_f) × T)
   Ex : EUR/USD, r_EUR = 2%, r_USD = 4%, T = 1
   F = 1,10 × e^(−0,02) ≈ 1,0782`,
    'text'
  ),

  h3('Convergence spot-future à l\'échéance'),

  para([
    span('À l\'approche de l\'échéance T → 0, le prix du future converge nécessairement vers le prix spot. Si une divergence persistait, un arbitrage sans risque serait possible — les arbitragistes l\'élimineraient instantanément.'),
  ]),

  callout('🔁', 'Base = Spot − Future', 'La base est la différence entre le prix spot et le prix du future. À l\'échéance, la base tend vers zéro. En cours de vie, une base négative (spot < future) signifie un marché en contango (situation normale). Une base positive (spot > future) correspond au backwardation (marché tendu, rare sur les actifs financiers).'),

  // ── ARBITRAGE ────────────────────────────────────────────────────
  h2('Arbitrage cash-and-carry'),

  para([
    span('Si le future est mal valorisé par rapport au spot, un '),
    bold('arbitrage cash-and-carry'),
    span(' est possible : on achète l\'actif au comptant et on vend le future simultanément (ou inversement), verrouillant un profit sans risque.'),
  ]),

  h3('Future surévalué (F > S₀ × e^{rT})'),

  numbered([
    [bold('Emprunter'), span(' S₀ au taux r sur T années')],
    [bold('Acheter'), span(' l\'actif spot à S₀')],
    [bold('Vendre'), span(' le future à F')],
    [bold('À l\'échéance :'), span(' livrer l\'actif et recevoir F. Rembourser le prêt S₀ × e^{rT}. Profit = F − S₀ × e^{rT} > 0')],
  ]),

  h3('Future sous-évalué (F < S₀ × e^{rT})'),

  numbered([
    [bold('Vendre'), span(' l\'actif spot à S₀ (vente à découvert)')],
    [bold('Investir'), span(' S₀ au taux r')],
    [bold('Acheter'), span(' le future à F')],
    [bold('À l\'échéance :'), span(' recevoir S₀ × e^{rT} du placement. Payer F pour racheter. Profit = S₀ × e^{rT} − F > 0')],
  ]),

  callout('⚡', 'Efficience des marchés', 'En pratique, les arbitrages sur les futures des grandes indices (S&P 500, Euro Stoxx) sont quasi-instantanément corrigés par des algorithmes de trading haute fréquence. Les écarts tolérés sont infimes — de l\'ordre de quelques centimes sur un contrat de plusieurs milliers d\'euros.'),

  // ── COUVERTURE ───────────────────────────────────────────────────
  h2('Stratégies de couverture (hedging) avec les futures'),

  h3('Ratio de couverture optimal'),

  para([
    span('Pour couvrir un portefeuille d\'actions, il faut déterminer combien de contrats futures vendre. Le '),
    bold('ratio de couverture optimal'),
    span(' dépend du bêta du portefeuille par rapport à l\'indice sous-jacent du future.'),
  ]),

  code(
    `Nombre de contrats = (β_portefeuille × Valeur portefeuille) / Valeur notionnelle future

Exemple :
Portefeuille actions = 5 000 000 €, β = 1,2 (plus volatile que l'indice)
Future CAC 40 : prix = 7 500 points, multiplicateur = 10 €
Valeur notionnelle = 7 500 × 10 = 75 000 €

N = (1,2 × 5 000 000) / 75 000 = 80 contrats CAC 40 à vendre

→ Pour baisser le β à 0,5 :
N = ((1,2 − 0,5) × 5 000 000) / 75 000 = 47 contrats à vendre`,
    'text'
  ),

  h3('Exemples de couverture pratiques'),

  bullet([
    [bold('Trésorier d\'entreprise :'), span(' anticipe d\'emprunter 10 M€ dans 3 mois. Vend des futures Euribor pour se couvrir contre une hausse des taux.')],
    [bold('Agriculteur :'), span(' récolte de blé prévue en juillet. Vend des futures blé (CBOT) en mars pour sécuriser son prix de vente.')],
    [bold('Compagnie aérienne :'), span(' achat de futures pétrole pour se couvrir contre la hausse du kérosène.')],
    [bold('Fonds d\'investissement :'), span(' vend des futures S&P 500 pour réduire temporairement l\'exposition actions sans liquider les positions.')],
  ]),

  // ── FORWARD RATE AGREEMENT ───────────────────────────────────────
  h2('Forward Rate Agreement (FRA)'),

  para([
    span('Un '),
    bold('FRA'),
    span(' est un contrat forward sur taux d\'intérêt. Il permet de fixer dès aujourd\'hui le taux d\'intérêt applicable à un emprunt ou placement futur. Très utilisé par les banques et trésoriers d\'entreprise.'),
  ]),

  code(
    `Notation : FRA "3×6"
→ Contrat sur 3 mois (90 jours), démarrant dans 3 mois

Acheteur du FRA = emprunteur qui craint une hausse des taux
Vendeur du FRA  = prêteur qui craint une baisse des taux

Règlement à l'échéance :
  Si taux de marché > taux FRA : le vendeur paie la différence à l'acheteur
  Si taux de marché < taux FRA : l'acheteur paie la différence au vendeur

Montant du règlement :
  R = Notionnel × (taux marché − taux FRA) × (jours/360) / (1 + taux marché × jours/360)`,
    'text'
  ),

  // ── FORWARD VS FUTURE ────────────────────────────────────────────
  h2('Forward vs Future — Tableau comparatif'),

  code(
    `Critère               | Forward                   | Future
─────────────────────────────────────────────────────────────────────
Marché                | OTC (gré à gré)            | Bourse organisée
Standardisation       | Sur mesure                 | Standardisé
Chambre de compensation| Non                       | Oui
Risque contrepartie   | Élevé                      | Quasi nul
Mark-to-market        | Non (règlement à échéance) | Quotidien
Marge                 | Non requise (en général)   | Dépôt + appels de marge
Liquidité             | Faible (fermeture difficile)| Élevée (revente possible)
Utilisateurs typiques | Entreprises, banques       | Spéculateurs, hedgers
Livraison physique    | Souvent oui                | Rarement (< 2 % des cas)`,
    'text'
  ),

  // ── POINTS CLÉS ──────────────────────────────────────────────────
  h2('Points clés à retenir'),

  bullet([
    'Forward et future sont des obligations bilatérales — contrairement aux options qui donnent un droit',
    'Le forward est OTC, personnalisé, avec risque de contrepartie',
    'Le future est standardisé, compensé, avec appels de marge quotidiens (mark-to-market)',
    'Prix du future = S₀ × e^{(r+u−q)T} — formule du coût de portage',
    'Contango : future > spot (situation normale). Backwardation : future < spot (marché tendu)',
    'Le ratio de couverture avec les futures dépend du bêta du portefeuille',
    'À l\'échéance, le prix du future converge vers le prix spot (base → 0)',
  ]),

  quote('Le marché des futures permet aux producteurs de pétrole saoudiens, aux agriculteurs américains et aux trésoriers européens de dormir la nuit — en transférant leur risque prix à des spéculateurs qui acceptent de le porter.'),
]

// ── Document Sanity ──────────────────────────────────────────────────
const chapter = {
  _type: 'chapter',
  title: 'Futures et Forwards — Contrats à Terme et Couverture',
  slug:  { _type: 'slug', current: 'futures-forwards' },
  domain: 'finance',
  part:   2,
  partTitle: 'Instruments Dérivés',
  order:  2,
  accessLevel: 'free',
  difficulty: 'intermediate',
  estimatedReadingTime: 18,
  quizAvailable: false,
  excerpt: 'Maîtrisez les contrats à terme : mécanisme des forwards OTC, appels de marge sur les futures, pricing par le coût de portage, contango/backwardation et stratégies de couverture.',
  content,
}

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
  console.error('❌ Erreur :', err.message)
  process.exit(1)
}
