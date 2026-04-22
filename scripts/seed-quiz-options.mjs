// node scripts/seed-quiz-options.mjs
import { createClient } from '@sanity/client'
import { config } from 'dotenv'
config({ path: '.env.local' })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_API_TOKEN,
  useCdn:    false,
})

const CHAPTER_SLUG = 'options-call-put-black-scholes'

const quizLevel1 = {
  _type: 'quiz',
  chapterSlug: CHAPTER_SLUG,
  level: 1,
  questions: [
    {
      _key: 'q1',
      text: "Qu'est-ce qu'une option Call ?",
      explanation: "Un Call donne à l'acheteur le DROIT (pas l'obligation) d'acheter un actif à un prix fixé à l'avance (le strike).",
      answers: [
        { _key: 'a1', text: "Le droit d'acheter un actif au prix strike", isCorrect: true },
        { _key: 'a2', text: "Le droit de vendre un actif au prix strike", isCorrect: false },
        { _key: 'a3', text: "L'obligation d'acheter un actif à n'importe quel prix", isCorrect: false },
        { _key: 'a4', text: "Un contrat de prêt sur un actif financier", isCorrect: false },
      ],
    },
    {
      _key: 'q2',
      text: "Si une action cote 110 € et que le strike de votre Call est à 100 €, l'option est :",
      explanation: "Une option Call est 'dans la monnaie' (in-the-money) quand le prix du sous-jacent est SUPÉRIEUR au strike, car on pourrait acheter moins cher que le marché.",
      answers: [
        { _key: 'a1', text: "Dans la monnaie (in-the-money)", isCorrect: true },
        { _key: 'a2', text: "En dehors de la monnaie (out-of-the-money)", isCorrect: false },
        { _key: 'a3', text: "À la monnaie (at-the-money)", isCorrect: false },
        { _key: 'a4', text: "Expirée sans valeur", isCorrect: false },
      ],
    },
    {
      _key: 'q3',
      text: "Quel est le gain maximal possible pour l'acheteur d'un Put ?",
      explanation: "L'acheteur d'un Put gagne quand le sous-jacent baisse. Le gain maximum est atteint si le sous-jacent tombe à 0 : il vaut alors strike - prime.",
      answers: [
        { _key: 'a1', text: "Illimité, le sous-jacent peut monter indéfiniment", isCorrect: false },
        { _key: 'a2', text: "Limité au prix strike moins la prime payée", isCorrect: true },
        { _key: 'a3', text: "Exactement égal à la prime payée", isCorrect: false },
        { _key: 'a4', text: "Nul, on ne peut pas gagner avec un Put", isCorrect: false },
      ],
    },
    {
      _key: 'q4',
      text: "Quel paramètre mesure la sensibilité du prix d'une option aux variations du sous-jacent ?",
      explanation: "Le Delta mesure de combien varie le prix de l'option quand le sous-jacent bouge d'1 euro. Un delta de 0,6 signifie que si l'action monte de 1 €, l'option monte d'environ 0,60 €.",
      answers: [
        { _key: 'a1', text: "Le Gamma", isCorrect: false },
        { _key: 'a2', text: "Le Theta", isCorrect: false },
        { _key: 'a3', text: "Le Delta", isCorrect: true },
        { _key: 'a4', text: "La Vega", isCorrect: false },
      ],
    },
    {
      _key: 'q5',
      text: "Qu'est-ce que la prime d'une option représente pour l'acheteur ?",
      explanation: "La prime est le prix payé pour acquérir le droit que confère l'option. C'est la perte maximale de l'acheteur : si l'option expire sans valeur, il a perdu uniquement sa prime.",
      answers: [
        { _key: 'a1', text: "Le profit garanti à l'échéance", isCorrect: false },
        { _key: 'a2', text: "Le prix payé pour obtenir le droit de l'option — perte maximale", isCorrect: true },
        { _key: 'a3', text: "La valeur de l'actif sous-jacent", isCorrect: false },
        { _key: 'a4', text: "Les dividendes versés pendant la durée de l'option", isCorrect: false },
      ],
    },
  ],
}

async function seed() {
  console.log('🎯 Seeding quiz niveau 1 pour :', CHAPTER_SLUG)

  // Supprimer l'ancien quiz si existant
  const existing = await client.fetch(
    `*[_type == "quiz" && chapterSlug == $slug && level == 1][0]._id`,
    { slug: CHAPTER_SLUG }
  )
  if (existing) {
    await client.delete(existing)
    console.log('🗑  Ancien quiz supprimé')
  }

  const result = await client.create(quizLevel1)
  console.log('✅ Quiz créé :', result._id)
}

seed().catch(err => { console.error('❌', err); process.exit(1) })
