/**
 * SPREAD FINANCE — Seed Sanity
 * Crée les chapitres Finance de marché (Partie 1 + Partie 2)
 * et les évaluations Partie 2 (niveaux 1, 2, 3)
 *
 * Usage : node scripts/seed-sanity.mjs
 */

import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

// Charger .env.local
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath   = join(__dirname, '..', '.env.local')
try {
  const raw = readFileSync(envPath, 'utf-8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^([^#=\s]+)=(.*)$/)
    if (m) process.env[m[1]] = m[2].trim()
  }
} catch {}

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const DATASET    = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const TOKEN      = process.env.SANITY_API_TOKEN

if (!PROJECT_ID || !TOKEN) {
  console.error('❌  NEXT_PUBLIC_SANITY_PROJECT_ID ou SANITY_API_TOKEN manquant dans .env.local')
  process.exit(1)
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset:   DATASET,
  apiVersion: '2024-01-01',
  token:     TOKEN,
  useCdn:    false,
})

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────
function block(text) {
  return {
    _type: 'block', _key: key(),
    style: 'normal',
    children: [{ _type: 'span', _key: key(), text, marks: [] }],
    markDefs: [],
  }
}
function h2(text) {
  return {
    _type: 'block', _key: key(),
    style: 'h2',
    children: [{ _type: 'span', _key: key(), text, marks: [] }],
    markDefs: [],
  }
}
function h3(text) {
  return {
    _type: 'block', _key: key(),
    style: 'h3',
    children: [{ _type: 'span', _key: key(), text, marks: [] }],
    markDefs: [],
  }
}
function bullet(...items) {
  return items.map(text => ({
    _type: 'block', _key: key(),
    style: 'normal', listItem: 'bullet',
    children: [{ _type: 'span', _key: key(), text, marks: [] }],
    markDefs: [],
  }))
}
let _k = 0
function key() { return `k${(++_k).toString(36)}` }

function question(text, competency, explanation, answers) {
  return {
    _key:        key(),
    text,
    competency,
    explanation,
    answers: answers.map(([t, c]) => ({ _key: key(), text: t, isCorrect: c })),
  }
}

// ─────────────────────────────────────────────────────────────────
// CONTENU
// ─────────────────────────────────────────────────────────────────

// ── Chapitre 1 — Classes d'actifs (Partie 1) ─────────────────────
const chapterClassesActifs = {
  _type: 'chapter',
  title: "Classes d'actifs",
  slug: { _type: 'slug', current: 'classes-actifs' },
  domain: 'finance',
  part: 1,
  partTitle: "Fondamentaux des marchés",
  order: 1,
  accessLevel: 'free',
  difficulty: 'beginner',
  estimatedReadingTime: 12,
  excerpt: "Tour d'horizon des grandes classes d'actifs : actions, obligations, matières premières, devises et actifs alternatifs.",
  quizAvailable: true,
  content: [
    h2("Qu'est-ce qu'une classe d'actifs ?"),
    block("Une classe d'actifs est un groupe d'instruments financiers qui partagent des caractéristiques communes : comportement économique similaire, réglementation comparable, et corrélations proches entre eux."),
    block("Les gestionnaires de portefeuille utilisent la diversification entre classes d'actifs pour optimiser le couple rendement/risque."),

    h2("Les actions (Equity)"),
    block("Les actions représentent une part de propriété dans une entreprise. L'actionnaire bénéficie des dividendes et de la plus-value potentielle, mais supporte aussi le risque de perte en capital."),
    h3("Caractéristiques clés"),
    ...bullet(
      "Droit de vote aux assemblées générales",
      "Dividendes non garantis (discrétionnaires)",
      "Risque élevé mais potentiel de rendement supérieur long terme",
      "Liquidité variable selon la capitalisation boursière"
    ),

    h2("Les obligations (Fixed Income)"),
    block("Une obligation est un titre de créance émis par un État, une collectivité ou une entreprise. L'émetteur s'engage à rembourser le capital (principal) à l'échéance et à verser des intérêts (coupons) périodiques."),
    h3("Types d'obligations"),
    ...bullet(
      "Obligations d'État (OAT, Bunds, Treasuries) — risque faible, taux bas",
      "Obligations corporate Investment Grade — risque modéré",
      "High Yield (Junk Bonds) — risque élevé, rendement supérieur",
      "Obligations indexées sur l'inflation (OATi, TIPS)"
    ),

    h2("Les matières premières (Commodities)"),
    block("Les matières premières incluent l'énergie (pétrole, gaz), les métaux précieux (or, argent), les métaux industriels (cuivre, aluminium) et les matières agricoles (blé, maïs, café)."),
    block("L'or joue un rôle de valeur refuge en période d'incertitude. Les matières premières sont souvent négociées via des contrats futures sur des marchés dédiés (CME, ICE)."),

    h2("Les devises (Forex)"),
    block("Le marché des changes (Foreign Exchange) est le plus liquide au monde avec un volume quotidien de plus de 7 000 milliards de dollars. Les taux de change reflètent les différentiels d'inflation, de taux d'intérêt et de balance commerciale entre pays."),
    ...bullet(
      "Paires majeures : EUR/USD, GBP/USD, USD/JPY",
      "Paires émergentes : USD/BRL, USD/CNY, EUR/TRY",
      "Rôle du dollar américain comme monnaie de réserve mondiale"
    ),

    h2("Les actifs alternatifs"),
    block("Les actifs alternatifs regroupent tout ce qui ne rentre pas dans les catégories classiques :"),
    ...bullet(
      "Private Equity — investissement dans des sociétés non cotées",
      "Immobilier (SCPI, REITs) — revenus locatifs et valorisation",
      "Hedge Funds — stratégies décorrélées des marchés",
      "Infrastructure — autoroutes, aéroports, réseaux d'énergie",
      "Cryptoactifs — Bitcoin, Ethereum et actifs numériques"
    ),

    h2("Allocation d'actifs et corrélation"),
    block("La théorie moderne du portefeuille (Markowitz, 1952) montre qu'en combinant des actifs peu corrélés, on réduit le risque sans sacrifier le rendement espéré. La frontière efficiente représente l'ensemble des portefeuilles optimaux."),
    block("Un portefeuille classique 60/40 (60% actions, 40% obligations) a historiquement offert un bon équilibre. Les institutions modernes intègrent des actifs alternatifs pour diversifier davantage."),
  ],
}

// ── Évaluation Partie 2 — Niveau 1 (Facile) ──────────────────────
const eval_part2_lvl1 = {
  _type: 'evaluation',
  domain: 'finance',
  part: 2,
  partTitle: 'Instruments Dérivés',
  level: 1,
  questions: [
    question(
      "Qu'est-ce qu'une option d'achat (call) ?",
      "Définitions fondamentales",
      "Un call donne le DROIT (et non l'obligation) d'acheter l'actif sous-jacent à un prix fixé (strike) avant ou à l'échéance. L'acheteur paie une prime pour ce droit.",
      [
        ["Le droit d'acheter un actif à un prix fixé", true],
        ["L'obligation d'acheter un actif à un prix fixé", false],
        ["Le droit de vendre un actif à un prix fixé", false],
        ["Un contrat d'échange de taux d'intérêt", false],
      ]
    ),
    question(
      "Qu'est-ce qu'une option de vente (put) ?",
      "Définitions fondamentales",
      "Un put donne le DROIT de VENDRE l'actif sous-jacent au prix d'exercice (strike). C'est une protection contre la baisse du prix de l'actif.",
      [
        ["Le droit de vendre un actif à un prix fixé", true],
        ["L'obligation de vendre un actif à un prix fixé", false],
        ["Le droit d'acheter un actif à un prix fixé", false],
        ["Un contrat à terme standardisé", false],
      ]
    ),
    question(
      "Quelle est la différence principale entre un future et un forward ?",
      "Futures vs Forwards",
      "Les futures sont standardisés et négociés sur des marchés organisés (CME, Euronext). Les forwards sont des contrats de gré à gré (OTC), personnalisables mais avec risque de contrepartie.",
      [
        ["Les futures sont standardisés et cotés en bourse, les forwards sont OTC", true],
        ["Les futures sont OTC, les forwards sont cotés en bourse", false],
        ["Il n'y a aucune différence", false],
        ["Les futures n'ont pas de date d'échéance, les forwards si", false],
      ]
    ),
    question(
      "Quel est le payoff à l'échéance d'un call acheté de strike K, si le prix spot est S ?",
      "Payoff des options",
      "Le payoff d'un call acheté est max(S-K, 0). Si S > K, l'option est exercée et le gain est S-K. Si S ≤ K, l'option expire sans valeur (payoff = 0). La prime payée n'est pas incluse dans le payoff mais dans le profit.",
      [
        ["max(S - K, 0)", true],
        ["max(K - S, 0)", false],
        ["S - K", false],
        ["min(S - K, 0)", false],
      ]
    ),
    question(
      "Une option est dite 'in the money' (ITM) quand :",
      "Moneyness",
      "Un call est ITM quand S > K (exercer est rentable). Un put est ITM quand S < K. 'At the money' : S = K. 'Out of the money' : exercer n'est pas rentable.",
      [
        ["Son exercice immédiat génèrerait un gain positif", true],
        ["Son prix de marché est supérieur au strike", false],
        ["Elle est proche de son échéance", false],
        ["Le sous-jacent est très volatil", false],
      ]
    ),
    question(
      "Quel Greek mesure la sensibilité du prix d'une option au prix du sous-jacent ?",
      "Les Greeks",
      "Le Delta mesure la variation du prix de l'option pour une variation unitaire du sous-jacent. Pour un call, Delta ∈ [0,1]. Pour un put, Delta ∈ [-1,0]. Delta = 0.5 signifie que si S monte de 1€, le call monte d'environ 0.50€.",
      [
        ["Le Delta", true],
        ["Le Gamma", false],
        ["Le Vega", false],
        ["Le Theta", false],
      ]
    ),
    question(
      "Un contrat future est coté 4 200 points. La valeur d'un point est 10€. Quelle est la valeur notionnelle d'un contrat ?",
      "Mécanisme des Futures",
      "Valeur notionnelle = cotation × valeur du point = 4 200 × 10 = 42 000€. C'est l'exposition réelle contrôlée par le contrat, bien supérieure au dépôt de garantie (margin).",
      [
        ["42 000 €", true],
        ["4 200 €", false],
        ["420 €", false],
        ["420 000 €", false],
      ]
    ),
    question(
      "Qu'est-ce que la prime d'une option ?",
      "Définitions fondamentales",
      "La prime est le prix payé par l'acheteur au vendeur pour acquérir le droit conféré par l'option. Elle se décompose en valeur intrinsèque (max(S-K,0) pour un call) et valeur temps.",
      [
        ["Le prix payé pour acquérir l'option", true],
        ["Le profit réalisé à l'échéance", false],
        ["La différence entre le strike et le spot", false],
        ["Le dépôt de garantie requis", false],
      ]
    ),
    question(
      "Quel est le risque maximum de l'acheteur d'un put ?",
      "Profils de risque",
      "L'acheteur d'un put perd au maximum la prime payée (si S > K à l'échéance). Son gain maximum est K - Prime (si le sous-jacent tombe à zéro). C'est un profil risque limité / gain potentiellement élevé.",
      [
        ["La prime payée", true],
        ["Illimité à la hausse", false],
        ["La valeur du sous-jacent", false],
        ["Le strike moins la prime", false],
      ]
    ),
    question(
      "La valeur temps d'une option est maximale quand :",
      "Valeur temps",
      "La valeur temps est maximale quand l'option est at the money (S = K) et décroît à mesure que l'option devient ITM ou OTM. Elle s'érode aussi avec le temps (Theta négatif pour l'acheteur).",
      [
        ["L'option est at the money (S ≈ K)", true],
        ["L'option est profondément in the money", false],
        ["L'option est à son échéance", false],
        ["La volatilité implicite est nulle", false],
      ]
    ),
    question(
      "Qu'est-ce que la parité call-put ?",
      "Relations fondamentales",
      "La parité call-put stipule : C - P = S - K·e^(-rT) pour des options européennes de même strike et même échéance. Elle permet d'exprimer la valeur d'un put à partir d'un call (et vice-versa) pour éviter l'arbitrage.",
      [
        ["Une relation d'arbitrage entre calls et puts de mêmes caractéristiques", true],
        ["Le fait que call et put ont toujours le même prix", false],
        ["La symétrie des payoffs entre acheteur et vendeur", false],
        ["L'obligation d'exercer call et put simultanément", false],
      ]
    ),
    question(
      "Le vendeur (writer) d'un call non couvert (naked call) a un risque :",
      "Profils de risque",
      "Le vendeur d'un call encaisse la prime mais s'expose à un risque illimité si le sous-jacent monte fortement. Son gain est plafonné à la prime reçue, ses pertes sont théoriquement illimitées.",
      [
        ["Illimité à la hausse du sous-jacent", true],
        ["Limité à la prime reçue", false],
        ["Nul car il encaisse la prime", false],
        ["Limité au strike", false],
      ]
    ),
    question(
      "Un forward de change EUR/USD à 3 mois est coté 1.0950. Cela signifie :",
      "Futures vs Forwards",
      "Le taux forward est le taux de change convenu aujourd'hui pour une livraison dans 3 mois. Si vous achetez ce forward, vous vous engagez à acheter des euros contre dollars à 1.0950 dans 3 mois, quel que soit le taux spot alors.",
      [
        ["Le taux EUR/USD convenu pour livraison dans 3 mois", true],
        ["Le taux spot actuel de l'EUR/USD", false],
        ["Le taux EUR/USD d'il y a 3 mois", false],
        ["La différence entre le taux spot et forward", false],
      ]
    ),
    question(
      "Qu'est-ce que la marge (margin) dans un contrat future ?",
      "Mécanisme des Futures",
      "La marge initiale (initial margin) est un dépôt de garantie requis pour ouvrir une position. La variation margin (mark-to-market quotidien) crédite ou débite le compte selon l'évolution des prix. C'est ce qui différencie les futures des forwards.",
      [
        ["Un dépôt de garantie pour couvrir les pertes potentielles", true],
        ["La commission payée au broker", false],
        ["La prime de l'option intégrée dans le future", false],
        ["La différence entre prix spot et prix future", false],
      ]
    ),
    question(
      "Le modèle Black-Scholes permet de :",
      "Pricing",
      "Black-Scholes (1973) est le modèle de référence pour pricer des options européennes sur actions sans dividende. Il suppose un mouvement brownien géométrique du sous-jacent, une volatilité constante et un taux sans risque constant.",
      [
        ["Calculer le prix théorique d'une option européenne", true],
        ["Calculer le prix de n'importe quelle option", false],
        ["Prédire la direction future du marché", false],
        ["Évaluer le risque de crédit d'une obligation", false],
      ]
    ),
    question(
      "Qu'est-ce que la volatilité implicite (IV) ?",
      "Pricing",
      "La volatilité implicite est la volatilité qu'il faudrait intégrer dans Black-Scholes pour retrouver le prix de marché de l'option. C'est le seul paramètre non observable directement — elle reflète les anticipations du marché sur la volatilité future.",
      [
        ["La volatilité déduite du prix de marché de l'option", true],
        ["La volatilité historique du sous-jacent", false],
        ["La volatilité maximale possible du sous-jacent", false],
        ["L'écart-type des rendements passés", false],
      ]
    ),
    question(
      "Qu'est-ce que le basis risk dans une stratégie de couverture avec futures ?",
      "Couverture",
      "Le basis est la différence entre le prix spot et le prix future. Le basis risk est le risque que cette différence évolue de manière imprévue, rendant la couverture imparfaite. Il existe quand l'actif à couvrir et le future ne sont pas identiques.",
      [
        ["Le risque d'imparfaite corrélation entre l'actif couvert et le future", true],
        ["Le risque de défaut de la chambre de compensation", false],
        ["Le risque de variation du taux sans risque", false],
        ["Le risque lié à l'exercice anticipé", false],
      ]
    ),
    question(
      "Le delta d'un call ATM est approximativement :",
      "Les Greeks",
      "Un call at the money a un delta d'environ 0.5 (50%). Cela signifie que pour une variation de 1€ du sous-jacent, le call varie d'environ 0.50€. Plus le call est ITM, plus le delta tend vers 1. Plus il est OTM, plus le delta tend vers 0.",
      [
        ["0.5", true],
        ["1.0", false],
        ["0.0", false],
        ["-0.5", false],
      ]
    ),
    question(
      "Quel est le payoff à l'échéance d'un put acheté de strike K, si le prix spot est S ?",
      "Payoff des options",
      "Le payoff d'un put acheté est max(K-S, 0). Si S < K, l'option est exercée et le gain est K-S. Si S ≥ K, l'option expire sans valeur. C'est symétrique du call mais dans le sens de la baisse.",
      [
        ["max(K - S, 0)", true],
        ["max(S - K, 0)", false],
        ["K - S", false],
        ["S - K", false],
      ]
    ),
    question(
      "Qu'est-ce qu'un straddle ?",
      "Stratégies optionnelles",
      "Un straddle consiste à acheter un call ET un put de même strike et même échéance. Le trader parie sur une forte variation du sous-jacent sans connaître la direction. Il gagne si S monte ou baisse suffisamment pour couvrir les deux primes payées.",
      [
        ["L'achat simultané d'un call et d'un put de même strike et échéance", true],
        ["La vente simultanée d'un call et d'un put", false],
        ["L'achat d'un call et la vente d'un put de strikes différents", false],
        ["Un contrat future sur indice de volatilité", false],
      ]
    ),
  ],
}

// ── Évaluation Partie 2 — Niveau 2 (Moyen) ───────────────────────
const eval_part2_lvl2 = {
  _type: 'evaluation',
  domain: 'finance',
  part: 2,
  partTitle: 'Instruments Dérivés',
  level: 2,
  questions: [
    question(
      "Dans le modèle Black-Scholes, le prix d'un call européen dépend de :",
      "Modèle Black-Scholes",
      "Black-Scholes dépend de 5 paramètres : S (prix du sous-jacent), K (strike), T (temps à l'échéance), r (taux sans risque) et σ (volatilité). Le dividende est absent dans la formule de base mais peut être intégré via le modèle de Merton.",
      [
        ["S, K, T, r et σ uniquement", true],
        ["S, K, T et r — la volatilité n'a pas d'impact", false],
        ["S, K et la volatilité historique seulement", false],
        ["Uniquement le prix spot et le strike", false],
      ]
    ),
    question(
      "Le Gamma mesure :",
      "Les Greeks",
      "Le Gamma est la dérivée seconde du prix de l'option par rapport au prix du sous-jacent, ou la dérivée du Delta. Il est maximum ATM et positif pour les acheteurs d'options. Un fort Gamma signifie que le Delta change rapidement.",
      [
        ["La variation du Delta par rapport au prix du sous-jacent", true],
        ["La variation du prix de l'option par rapport au temps", false],
        ["La variation du prix de l'option par rapport au taux sans risque", false],
        ["La sensibilité à la volatilité", false],
      ]
    ),
    question(
      "Le coût de portage (cost of carry) dans le pricing des forwards est :",
      "Pricing des Forwards",
      "Le prix théorique d'un forward est F = S · e^(rT) (sans dividende). Le coût de portage r·T représente le coût de financement de la position spot pendant la durée du contrat. Des dividendes ou revenus rendent ce coût négatif.",
      [
        ["Le coût de financement de la position sous-jacente jusqu'à l'échéance", true],
        ["La commission de la chambre de compensation", false],
        ["La différence entre call et put", false],
        ["Le risque de marché résiduel après couverture", false],
      ]
    ),
    question(
      "Le smile de volatilité indique que :",
      "Volatilité",
      "Le smile de volatilité montre que la volatilité implicite n'est pas constante selon le strike (contrairement à l'hypothèse Black-Scholes). Les options OTM ont souvent une IV plus élevée que les ATM — signe que les marchés anticipent des queues de distribution épaisses (fat tails).",
      [
        ["La volatilité implicite varie selon le strike de l'option", true],
        ["Toutes les options ont la même volatilité implicite", false],
        ["La volatilité implicite est toujours supérieure à la volatilité historique", false],
        ["Les options ATM ont la volatilité la plus élevée", false],
      ]
    ),
    question(
      "Un investisseur achète un futures sur indice à 4 500 avec un effet de levier 10x. Si l'indice baisse de 5%, sa perte en pourcentage du capital investi est :",
      "Levier et Futures",
      "Avec un levier de 10x, une baisse de 5% du sous-jacent entraîne une perte de 5% × 10 = 50% du capital engagé. C'est le danger du levier : les pertes (et les gains) sont amplifiés proportionnellement.",
      [
        ["50%", true],
        ["5%", false],
        ["10%", false],
        ["500%", false],
      ]
    ),
    question(
      "Qu'est-ce que le Vega d'une option ?",
      "Les Greeks",
      "Le Vega mesure la sensibilité du prix de l'option à une variation de la volatilité implicite. Une option avec un Vega de 0.20 voit son prix augmenter de 0.20€ si la volatilité implicite augmente de 1 point de pourcentage.",
      [
        ["La sensibilité du prix de l'option à la volatilité implicite", true],
        ["La sensibilité aux taux d'intérêt", false],
        ["La vitesse à laquelle l'option perd de la valeur temps", false],
        ["La corrélation entre le sous-jacent et l'option", false],
      ]
    ),
    question(
      "Une stratégie bull spread avec calls consiste à :",
      "Stratégies optionnelles",
      "Un bull spread call : achat d'un call à faible strike K1 + vente d'un call à strike plus élevé K2. On encaisse partiellement la prime (coût réduit), mais le gain est plafonné. C'est adapté si on anticipe une hausse modérée.",
      [
        ["Acheter un call K1 et vendre un call K2 > K1", true],
        ["Acheter deux calls de même strike", false],
        ["Vendre un call et acheter un put de même strike", false],
        ["Acheter un call et vendre un put de strike différent", false],
      ]
    ),
    question(
      "Qu'est-ce que le Theta d'une option ?",
      "Les Greeks",
      "Le Theta mesure la perte de valeur de l'option par jour calendaire. Il est négatif pour l'acheteur (l'option perd de sa valeur avec le temps) et positif pour le vendeur. Il s'accélère à l'approche de l'échéance.",
      [
        ["La variation du prix par unité de temps (décroissance temporelle)", true],
        ["La variation du prix par unité de volatilité", false],
        ["La variation du Delta dans le temps", false],
        ["La sensibilité au taux sans risque", false],
      ]
    ),
    question(
      "Qu'est-ce qu'un swap de taux (IRS) ?",
      "Produits dérivés OTC",
      "Un Interest Rate Swap est un contrat où deux contreparties échangent des flux : l'une paie un taux fixe, l'autre un taux variable (souvent EURIBOR ou SOFR). Utilisé pour gérer le risque de taux ou modifier le profil de dette.",
      [
        ["Un contrat d'échange de flux à taux fixe contre taux variable", true],
        ["L'achat et la vente simultanée de futures sur taux", false],
        ["Un contrat optionnel sur obligations", false],
        ["Un dépôt à terme rémunéré à taux fixe", false],
      ]
    ),
    question(
      "La relation de non-arbitrage entre futures et spot est F = S·e^(rT) car :",
      "Pricing des Forwards",
      "Si F ≠ S·e^(rT), un arbitragiste peut réaliser un profit sans risque : acheter le moins cher et vendre le plus cher entre la position spot financée et le future. Cette opportunité disparaît instantanément sur les marchés efficients.",
      [
        ["Tout écart serait immédiatement exploité par les arbitragistes", true],
        ["C'est une convention réglementaire imposée par les chambres de compensation", false],
        ["Le taux r est le rendement espéré du sous-jacent", false],
        ["Black-Scholes le démontre mathématiquement", false],
      ]
    ),
    question(
      "Quel est l'effet d'une hausse de la volatilité implicite sur le prix d'un call ?",
      "Volatilité",
      "Une hausse de la volatilité augmente la probabilité que l'option finisse ITM, ce qui augmente son prix. Le Vega est positif pour les acheteurs d'options (calls ET puts). Plus de volatilité = plus de valeur pour l'acheteur.",
      [
        ["Le prix du call augmente (Vega positif)", true],
        ["Le prix du call diminue", false],
        ["Cela n'a aucun effet sur le call", false],
        ["L'effet dépend si le call est ITM ou OTM", false],
      ]
    ),
    question(
      "La delta-couverture (delta hedging) consiste à :",
      "Couverture",
      "Le delta hedging neutralise le risque directionnel d'une option en prenant une position inverse dans le sous-jacent. Si un call a un Delta de 0.6, le vendeur achète 0.6 unité du sous-jacent pour être delta-neutre. La couverture doit être ajustée continuellement (Gamma).",
      [
        ["Acheter/vendre du sous-jacent pour neutraliser le risque directionnel", true],
        ["Acheter une option inverse pour se couvrir parfaitement", false],
        ["Fixer le prix d'une option en anticipant sa direction", false],
        ["Couvrir le risque de volatilité avec des options", false],
      ]
    ),
    question(
      "Une option américaine peut-elle être exercée avant l'échéance ?",
      "Types d'options",
      "Oui, par définition. L'option américaine peut être exercée à tout moment avant l'échéance (par opposition à l'option européenne, exercée uniquement à l'échéance). Cette flexibilité supplémentaire la rend en général plus chère ou égale à l'européenne correspondante.",
      [
        ["Oui, à n'importe quel moment avant l'échéance", true],
        ["Non, elle ne peut être exercée qu'à l'échéance", false],
        ["Seulement si elle est in the money de plus de 10%", false],
        ["Seulement avec l'accord de la contrepartie", false],
      ]
    ),
    question(
      "Qu'est-ce que la convexi­té dans le contexte des obligations ?",
      "Obligations et dérivés de taux",
      "La convexité mesure la courbure de la relation prix/taux d'une obligation. Elle corrige la duration (linéaire) pour les grands mouvements de taux. Une obligation à forte convexité profite davantage de la baisse des taux et souffre moins de la hausse.",
      [
        ["La courbure de la relation prix-taux d'une obligation", true],
        ["La sensibilité au risque de crédit", false],
        ["Le risque de liquidité des obligations", false],
        ["Le taux de coupon rapporté au prix de marché", false],
      ]
    ),
    question(
      "Quel est le rôle de la chambre de compensation (CCP) dans les futures ?",
      "Mécanisme des Futures",
      "La CCP (ex: LCH, CME Clearing) s'interpose entre acheteur et vendeur de chaque contrat future. Elle élimine le risque de contrepartie grâce aux appels de marge quotidiens. C'est pourquoi les futures ont un risque de contrepartie quasi nul.",
      [
        ["Garantir les obligations de chaque contrepartie et éliminer le risque de défaut", true],
        ["Fixer les prix des contrats futures", false],
        ["Calculer le prix théorique des options", false],
        ["Percevoir les commissions de transaction", false],
      ]
    ),
  ],
}

// ── Évaluation Partie 2 — Niveau 3 (Difficile / Premium) ─────────
const eval_part2_lvl3 = {
  _type: 'evaluation',
  domain: 'finance',
  part: 2,
  partTitle: 'Instruments Dérivés',
  level: 3,
  questions: [
    question(
      "Dans la formule Black-Scholes, d1 est exprimé comme :",
      "Formule Black-Scholes",
      "d1 = [ln(S/K) + (r + σ²/2)·T] / (σ·√T). Il intègre le log du ratio prix/strike, le taux sans risque ajusté de la variance, et la durée résiduelle. N(d1) représente le Delta du call sous Black-Scholes.",
      [
        ["[ln(S/K) + (r + σ²/2)·T] / (σ·√T)", true],
        ["[ln(S/K) + (r - σ²/2)·T] / (σ·√T)", false],
        ["(S - K) / (σ·√T)", false],
        ["ln(S/K) / σ", false],
      ]
    ),
    question(
      "Qu'est-ce que la mesure risk-neutral (Q) dans le pricing des dérivés ?",
      "Finance mathématique",
      "Sous la mesure risk-neutral Q, tous les actifs ont pour rendement espéré le taux sans risque r. On peut alors pricer un dérivé comme l'espérance de son payoff actualisé au taux r, sans avoir besoin du rendement espéré réel du sous-jacent.",
      [
        ["Une mesure de probabilité où tous les actifs ont un rendement espéré égal au taux sans risque", true],
        ["La probabilité empirique que le sous-jacent monte", false],
        ["La mesure dans laquelle les investisseurs sont neutres au risque", false],
        ["L'espérance de gain sous la probabilité historique", false],
      ]
    ),
    question(
      "Le théorème de Girsanov permet de :",
      "Finance mathématique",
      "Le théorème de Girsanov permet de changer de mesure de probabilité (de P vers Q) en ajustant la dérive d'un processus stochastique. C'est le fondement mathématique du passage à la mesure risk-neutral en finance.",
      [
        ["Changer de mesure de probabilité en ajustant la dérive brownienne", true],
        ["Calculer le Delta d'une option par différentiation", false],
        ["Décomposer un processus en composantes indépendantes", false],
        ["Démontrer la parité call-put pour options américaines", false],
      ]
    ),
    question(
      "Une option barrière 'knock-out' se distingue d'une option vanilla par :",
      "Options exotiques",
      "Une option knock-out (ou down-and-out, up-and-out) s'annule automatiquement si le sous-jacent atteint un niveau barrière. Elle est moins chère qu'une vanilla car il existe un risque d'extinction. La barrière génère un profil de payoff discontinu.",
      [
        ["Elle s'annule si le sous-jacent atteint un niveau barrière prédéfini", true],
        ["Elle ne peut être exercée qu'à l'échéance", false],
        ["Son payoff dépend de la moyenne du sous-jacent", false],
        ["Elle nécessite le dépôt d'une marge comme les futures", false],
      ]
    ),
    question(
      "Dans un modèle à volatilité stochastique (ex: Heston), la volatilité :",
      "Modèles avancés",
      "Dans Heston, la variance v(t) suit un processus CIR (Ornstein-Uhlenbeck avec réversion à la moyenne). Cela permet de modéliser le smile de volatilité et les queues épaisses, contrairement à Black-Scholes qui suppose σ constant.",
      [
        ["Suit elle-même un processus stochastique corrélé au sous-jacent", true],
        ["Est constante comme dans Black-Scholes", false],
        ["Est déterministe mais dépend du temps", false],
        ["Est remplacée par la volatilité réalisée historique", false],
      ]
    ),
    question(
      "Le prix d'un CDS (Credit Default Swap) reflète principalement :",
      "Dérivés de crédit",
      "Le spread du CDS reflète la prime annuelle payée par l'acheteur de protection contre le défaut de l'entité de référence. Il est directement lié à la probabilité de défaut implicite × le Loss Given Default (LGD). Un CDS à 200bps sur 5 ans coûte 2% par an.",
      [
        ["La probabilité de défaut implicite de l'entité de référence × LGD", true],
        ["Le taux de coupon de l'obligation de référence", false],
        ["Le spread de taux entre l'entité et l'État", false],
        ["La duration de l'obligation sous-jacente", false],
      ]
    ),
    question(
      "La méthode de Monte Carlo appliquée au pricing d'options consiste à :",
      "Méthodes numériques",
      "Monte Carlo simule un grand nombre de trajectoires du sous-jacent (ex: mouvement brownien géométrique), calcule le payoff de l'option sur chaque trajectoire, puis prend la moyenne actualisée. Utile pour les options path-dependent (asiatiques, lookback).",
      [
        ["Simuler de nombreuses trajectoires du sous-jacent et moyenner les payoffs actualisés", true],
        ["Résoudre l'EDP de Black-Scholes par différences finies", false],
        ["Calculer le prix exact par la formule fermée de Black-Scholes", false],
        ["Interpoler le prix à partir des données de marché observées", false],
      ]
    ),
    question(
      "Qu'est-ce que le vanna d'une option ?",
      "Greeks de second ordre",
      "Le Vanna est le Greek de deuxième ordre ∂²V/∂S∂σ = ∂Delta/∂σ = ∂Vega/∂S. Il mesure comment le Delta varie avec la volatilité implicite, ou comment le Vega varie avec le prix du sous-jacent. Crucial pour le hedging en volatilité stochastique.",
      [
        ["La dérivée croisée du prix par rapport au spot ET à la volatilité", true],
        ["La dérivée du Gamma par rapport au temps", false],
        ["La sensibilité du Theta à la volatilité", false],
        ["La sensibilité du Rho au prix du sous-jacent", false],
      ]
    ),
    question(
      "Dans la méthode des différences finies pour résoudre l'EDP de Black-Scholes, on :",
      "Méthodes numériques",
      "Les méthodes par différences finies (explicite, implicite, Crank-Nicolson) discrétisent l'espace S et le temps t pour résoudre l'EDP de Black-Scholes. Elles sont efficaces pour les options américaines et les barrières, là où Monte Carlo est moins performant.",
      [
        ["Discrétise l'espace S et le temps pour résoudre l'EDP numériquement", true],
        ["Simule des trajectoires stochastiques du sous-jacent", false],
        ["Utilise la transformée de Fourier pour inverser la caractéristique", false],
        ["Calcule le prix par réplication du portefeuille", false],
      ]
    ),
    question(
      "Le processus de Vasicek pour les taux d'intérêt est caractérisé par :",
      "Modèles de taux",
      "Le modèle de Vasicek est : dr = a(b-r)dt + σdW. Il présente une réversion à la moyenne (mean-reversion) vers b, avec une vitesse a. Limitation : il peut générer des taux négatifs. HJM et LMM sont des extensions plus complexes.",
      [
        ["Une réversion à la moyenne du taux vers un niveau long terme", true],
        ["Un mouvement brownien géométrique comme les actions", false],
        ["L'absence de dérive (martingale pure)", false],
        ["Une volatilité déterministe du taux court", false],
      ]
    ),
    question(
      "La mesure forward-neutre (T-forward measure) est utile pour :",
      "Finance mathématique",
      "Sous la mesure T-forward, le prix zéro-coupon P(t,T) joue le rôle de numéraire. Les prix forward deviennent des martingales, ce qui simplifie le pricing des produits dérivés de taux à payoff à la date T.",
      [
        ["Pricer des produits dérivés de taux en simplifiant le calcul d'espérance", true],
        ["Simuler les trajectoires de taux sous la probabilité historique", false],
        ["Calculer le Delta des obligations", false],
        ["Estimer la volatilité implicite des swaptions", false],
      ]
    ),
    question(
      "Le jump-diffusion (modèle de Merton 1976) améliore Black-Scholes en :",
      "Modèles avancés",
      "Merton (1976) ajoute un processus de Poisson (sauts de prix) au mouvement brownien de Black-Scholes. Cela permet de modéliser les queues épaisses et les crashs soudains. L'option n'est plus parfaitement réplicable, créant un risque de saut non couvrable.",
      [
        ["Ajoutant des sauts de prix discontinus au mouvement brownien", true],
        ["Rendant la volatilité stochastique", false],
        ["Introduisant la réversion à la moyenne du sous-jacent", false],
        ["Remplaçant le taux sans risque par un taux variable", false],
      ]
    ),
    question(
      "Qu'est-ce que le Rho d'une option et quel est son signe pour un call long ?",
      "Les Greeks",
      "Le Rho mesure la sensibilité du prix de l'option aux variations du taux sans risque. Pour un call long, Rho > 0 : une hausse des taux augmente le coût de portage de la position short de sous-jacent utilisée dans le hedging, ce qui bénéficie au call.",
      [
        ["La sensibilité au taux sans risque, positive pour un call long", true],
        ["La sensibilité au dividende du sous-jacent, négative pour un call", false],
        ["La sensibilité au taux sans risque, négative pour un call long", false],
        ["La sensibilité à la duration du sous-jacent", false],
      ]
    ),
    question(
      "La volatilité locale (modèle de Dupire) se distingue de la volatilité stochastique par :",
      "Modèles avancés",
      "Dans le modèle de Dupire (1994), la volatilité est une fonction déterministe de S et t : σ = σ(S,t). Elle est calibrée pour reproduire exactement le smile de volatilité observé. Contrairement à Heston, il n'y a pas de source additionnelle de risque.",
      [
        ["La volatilité est une fonction déterministe de S et t, pas un processus stochastique", true],
        ["La volatilité est constante dans Dupire", false],
        ["Dupire permet de modéliser les queues épaisses mieux qu'Heston", false],
        ["La volatilité locale n'est pas calibrée sur le marché", false],
      ]
    ),
    question(
      "Dans le lemme d'Itô, si X est un processus stochastique et f(X,t) différentiable, alors df vaut :",
      "Finance mathématique",
      "Lemme d'Itô : df = (∂f/∂t + μ∂f/∂X + ½σ²∂²f/∂X²)dt + σ∂f/∂X·dW. Le terme ½σ²∂²f/∂X² est la correction stochastique absente du calcul classique. C'est la base de la dérivation de l'EDP de Black-Scholes.",
      [
        ["∂f/∂t·dt + ∂f/∂X·dX + ½·∂²f/∂X²·(dX)²", true],
        ["∂f/∂t·dt + ∂f/∂X·dX uniquement", false],
        ["∂f/∂X·dX car f est une martingale", false],
        ["½·∂²f/∂X²·dt + ∂f/∂X·dW", false],
      ]
    ),
  ],
}

// ─────────────────────────────────────────────────────────────────
// INSERTION
// ─────────────────────────────────────────────────────────────────
async function upsertDoc(doc, description) {
  // Vérifier si le document existe déjà (même slug ou même clé métier)
  let existing = null
  try {
    if (doc._type === 'chapter') {
      const res = await client.fetch(
        `*[_type == "chapter" && slug.current == $slug][0]._id`,
        { slug: doc.slug.current }
      )
      existing = res
    } else if (doc._type === 'evaluation') {
      const res = await client.fetch(
        `*[_type == "evaluation" && domain == $d && part == $p && level == $l][0]._id`,
        { d: doc.domain, p: doc.part, l: doc.level }
      )
      existing = res
    }
  } catch {}

  if (existing) {
    console.log(`⏭  ${description} existe déjà — ignoré`)
    return
  }

  await client.create(doc)
  console.log(`✅  Créé : ${description}`)
}

async function main() {
  console.log(`\n🚀  Seed Sanity → projet ${PROJECT_ID} / dataset ${DATASET}\n`)

  await upsertDoc(chapterClassesActifs,  "Chapitre : Classes d'actifs (Partie 1)")
  await upsertDoc(eval_part2_lvl1,       'Évaluation Partie 2 — Niveau 1 Facile (20 questions)')
  await upsertDoc(eval_part2_lvl2,       'Évaluation Partie 2 — Niveau 2 Moyen (15 questions)')
  await upsertDoc(eval_part2_lvl3,       'Évaluation Partie 2 — Niveau 3 Difficile (15 questions)')

  console.log('\n✨  Seed terminé ! Lance npm run dev et teste :')
  console.log('   http://localhost:3000/documentation/classes-actifs')
  console.log('   http://localhost:3000/evaluation/finance/2/1\n')
}

main().catch(err => { console.error('❌', err.message); process.exit(1) })
