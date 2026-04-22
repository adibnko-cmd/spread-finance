// node scripts/seed-example-tabs.mjs
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

// ── Bloc exampleTabs pour le chapitre options (Call/Put) ──────────
const chapterExampleTabs = {
  _type: 'exampleTabs',
  _key:  'ex_tabs_options',
  tabs: [
    {
      label:    'Exemple 1 — Call acheteur',
      language: 'text',
      code:
`Action : Total SA
S = 100 €   |   K (strike) = 105 €   |   Prime = 4 €

→ Si S_T = 120 € à l'échéance :
  Payoff = max(120 − 105, 0) − 4 = 15 − 4 = +11 €  ✓ gain

→ Si S_T = 100 € à l'échéance :
  Payoff = max(100 − 105, 0) − 4 = 0 − 4 = −4 €  ✗ perte limitée à la prime`,
    },
    {
      label:    'Exemple 2 — Put acheteur',
      language: 'text',
      code:
`Action : LVMH
S = 100 €   |   K (strike) = 95 €   |   Prime = 3 €

→ Si S_T = 80 € à l'échéance :
  Payoff = max(95 − 80, 0) − 3 = 15 − 3 = +12 €  ✓ couverture efficace

→ Si S_T = 100 € à l'échéance :
  Payoff = max(95 − 100, 0) − 3 = 0 − 3 = −3 €  ✗ perte limitée à la prime`,
    },
    {
      label:    'Exemple 3 — Call vendeur',
      language: 'text',
      code:
`Call court (vente de call) sur Airbus
S = 130 €   |   K (strike) = 135 €   |   Prime encaissée = 5 €

→ Si S_T = 140 € à l'échéance :
  Payoff = −max(140 − 135, 0) + 5 = −5 + 5 = 0 €  point mort

→ Si S_T = 150 € à l'échéance :
  Payoff = −max(150 − 135, 0) + 5 = −15 + 5 = −10 €  ✗ perte illimitée

→ Si S_T = 130 € à l'échéance :
  Payoff = 0 + 5 = +5 €  ✓ prime conservée intégralement`,
    },
  ],
}

// ── Bloc exampleTabs pour l'article options digitales ─────────────
const articleExampleTabs = {
  _type: 'exampleTabs',
  _key:  'ex_tabs_digital',
  tabs: [
    {
      label:    'Exemple 1 — Call Digital EUR/USD',
      language: 'text',
      code:
`Pari directionnel sur le taux de change
Sous-jacent : EUR/USD = 1,08   |   Strike = 1,10   |   Prime = 0,02 $

→ Si EUR/USD = 1,12 à l'échéance (> 1,10) :
  Payoff = 1 $  →  Gain net = 1 − 0,02 = +0,98 $ (+4 900%)

→ Si EUR/USD = 1,09 à l'échéance (< 1,10) :
  Payoff = 0 $  →  Perte = −0,02 $ (prime perdue)`,
    },
    {
      label:    'Exemple 2 — Put Digital CAC 40',
      language: 'text',
      code:
`Couverture de seuil sur indice
CAC 40 = 7 200   |   Strike = 7 000   |   Montant Q = 100 €   |   Prime = 30 €

→ Si CAC 40 = 6 800 à l'échéance (< 7 000) :
  Payoff = 100 €  →  Gain net = 100 − 30 = +70 €  ✓ couverture activée

→ Si CAC 40 = 7 100 à l'échéance (> 7 000) :
  Payoff = 0 €  →  Perte = −30 € (coût de la protection)`,
    },
    {
      label:    'Exemple 3 — Pin Risk',
      language: 'text',
      code:
`Scénario critique : sous-jacent exactement au strike à l'échéance
Action XYZ   |   Strike = 50 €   |   Clôture = 50,00 €

Position du teneur de marché (vendeur de digital) :
  Delta couverture = élevé → achats/ventes massifs autour de 50 €
  Moindre variation : +0,01 €  →  Payoff = 0 €  (pas de versement)
                     −0,01 €  →  Payoff = Q   (versement total)

⚠ Le pin risk force des ajustements de couverture frénétiques
  en fin de vie : c'est le risque le plus redouté des teneurs de marché`,
    },
  ],
}

async function run() {
  // ── Chapitre options : remplacer les vieux blocs exemples ──
  const chapId = await client.fetch(
    '*[_type=="chapter" && slug.current=="options-call-put-black-scholes"][0]._id'
  )
  const chap = await client.fetch(`*[_id=="${chapId}"][0]{ content }`)
  const content = chap.content ?? []

  // Supprimer les anciens blocs code d'exemples (ils contiennent "max(")
  const filtered = content.filter((b) =>
    !(b._type === 'code' && b.code?.includes('max('))
  )

  // Insérer le bloc tabulé à la place du premier bloc code supprimé
  // On cherche un callout ou un titre "Fonctionnement" pour se repérer
  const insertIdx = filtered.findIndex(
    (b) => b._type === 'block' && b.children?.[0]?.text?.includes('Fonctionnement')
  )
  const idx = insertIdx >= 0 ? insertIdx + 2 : filtered.length

  const newContent = [
    ...filtered.slice(0, idx),
    chapterExampleTabs,
    ...filtered.slice(idx),
  ]

  await client.patch(chapId).set({ content: newContent }).commit()
  console.log('✅ Chapitre options mis à jour avec ExampleTabs')

  // ── Article options-digitales : remplacer les vieux blocs code ──
  const artId = await client.fetch(
    '*[_type=="article" && slug.current=="options-digitales"][0]._id'
  )
  const art = await client.fetch(`*[_id=="${artId}"][0]{ content }`)
  const artContent = art.content ?? []

  // Supprimer les blocs code de type "code" existants (ceux avec "Payoff")
  const artFiltered = artContent.filter((b) =>
    !(b._type === 'code' && b.code?.includes('Payoff'))
  )

  // Insérer après le titre "Exemple pratique"
  const artInsertIdx = artFiltered.findIndex(
    (b) => b._type === 'block' && b.children?.[0]?.text?.includes('Exemple pratique')
  )
  const artIdx = artInsertIdx >= 0 ? artInsertIdx + 2 : artFiltered.length

  const newArtContent = [
    ...artFiltered.slice(0, artIdx),
    articleExampleTabs,
    ...artFiltered.slice(artIdx),
  ]

  await client.patch(artId).set({ content: newArtContent }).commit()
  console.log("✅ Article options-digitales mis à jour avec ExampleTabs")
}

run().catch(err => { console.error('❌', err); process.exit(1) })
