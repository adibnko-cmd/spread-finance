import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PublicNav } from '@/components/layout/PublicNav'
import GlossaireClient from './GlossaireClient'

export const metadata: Metadata = {
  title: 'Glossaire — Spread Finance',
  description: 'Définitions des termes clés en Finance de marché, Mathématiques financières, Développement IT et Machine Learning.',
}

export const TERMS = [
  // Finance de marché
  { term: 'Alpha', domain: 'finance', def: 'Mesure de la surperformance d\'un portefeuille par rapport à son benchmark, ajustée du risque.' },
  { term: 'Ask', domain: 'finance', def: 'Prix auquel un vendeur est prêt à céder un actif. Opposé au Bid.' },
  { term: 'Backwardation', domain: 'finance', def: 'Situation de marché où le prix spot est supérieur aux prix des contrats futures lointains.' },
  { term: 'Beta', domain: 'finance', def: 'Mesure de la sensibilité d\'un actif aux variations du marché. β=1 : même volatilité que le marché.' },
  { term: 'Bid', domain: 'finance', def: 'Prix auquel un acheteur est prêt à acquérir un actif. Opposé au Ask.' },
  { term: 'Bid-Ask Spread', domain: 'finance', def: 'Écart entre le prix d\'achat (ask) et le prix de vente (bid). Indicateur de liquidité du marché.' },
  { term: 'Black-Scholes', domain: 'finance', def: 'Modèle mathématique de valorisation des options européennes basé sur 5 paramètres : S, K, r, σ, T.' },
  { term: 'Call', domain: 'finance', def: 'Option donnant le droit (sans obligation) d\'acheter un actif à un prix fixé (strike) à l\'échéance.' },
  { term: 'Contango', domain: 'finance', def: 'Situation où les prix des futures lointains sont supérieurs au prix spot. Reflète le coût de portage.' },
  { term: 'Convexité', domain: 'finance', def: 'Mesure la courbure de la relation prix/taux d\'une obligation. Complète la duration pour les grandes variations.' },
  { term: 'Couverture (Hedge)', domain: 'finance', def: 'Stratégie visant à réduire le risque d\'un portefeuille via des positions compensatrices (futures, options…).' },
  { term: 'CVaR', domain: 'finance', def: 'Conditional Value at Risk. Perte moyenne attendue au-delà du seuil VaR. Mesure plus conservative que la VaR.' },
  { term: 'Delta (Δ)', domain: 'finance', def: 'Sensibilité du prix d\'une option à une variation unitaire du sous-jacent. Δ ∈ [0,1] pour un call.' },
  { term: 'Dérivé', domain: 'finance', def: 'Instrument financier dont la valeur dépend d\'un actif sous-jacent (action, taux, indice, matière première).' },
  { term: 'Duration', domain: 'finance', def: 'Durée de vie moyenne actualisée des flux d\'une obligation. Mesure la sensibilité au taux d\'intérêt.' },
  { term: 'Forward', domain: 'finance', def: 'Contrat OTC à terme fixant aujourd\'hui le prix d\'un actif pour une livraison future. Non standardisé.' },
  { term: 'Future', domain: 'finance', def: 'Contrat à terme standardisé négocié en bourse, avec chambre de compensation et appels de marge quotidiens.' },
  { term: 'Gamma (Γ)', domain: 'finance', def: 'Variation du Delta quand le sous-jacent bouge d\'une unité. Mesure la convexité d\'une option.' },
  { term: 'Greeks', domain: 'finance', def: 'Ensemble des sensibilités d\'une option : Delta, Gamma, Theta, Vega, Rho.' },
  { term: 'ITM (In The Money)', domain: 'finance', def: 'Option ayant une valeur intrinsèque positive : Call ITM si S > K, Put ITM si S < K.' },
  { term: 'Levier (Leverage)', domain: 'finance', def: 'Utilisation de la dette ou de produits dérivés pour amplifier l\'exposition à un actif.' },
  { term: 'Liquidité', domain: 'finance', def: 'Facilité avec laquelle un actif peut être acheté ou vendu sans impact significatif sur son prix.' },
  { term: 'Margin Call', domain: 'finance', def: 'Appel de marge : demande de dépôt supplémentaire quand la valeur d\'un compte passe sous le seuil minimum.' },
  { term: 'Mark-to-Market', domain: 'finance', def: 'Valorisation d\'une position au prix de marché actuel (vs prix d\'acquisition). Utilisé pour les futures.' },
  { term: 'OTM (Out of The Money)', domain: 'finance', def: 'Option sans valeur intrinsèque : Call OTM si S < K, Put OTM si S > K.' },
  { term: 'Parité Call-Put', domain: 'finance', def: 'Relation C − P = S₀ − K·e^{−rT} liant call et put de même strike et maturité.' },
  { term: 'Put', domain: 'finance', def: 'Option donnant le droit (sans obligation) de vendre un actif au prix strike à l\'échéance.' },
  { term: 'Rho (ρ)', domain: 'finance', def: 'Sensibilité du prix d\'une option aux variations du taux d\'intérêt sans risque.' },
  { term: 'Theta (Θ)', domain: 'finance', def: 'Érosion de la valeur temps d\'une option par unité de temps. Toujours négatif pour l\'acheteur.' },
  { term: 'VaR', domain: 'finance', def: 'Value at Risk. Perte maximale d\'un portefeuille sur un horizon et à un niveau de confiance donnés (ex : 99%).' },
  { term: 'Vega (ν)', domain: 'finance', def: 'Sensibilité du prix d\'une option à une variation de la volatilité implicite.' },
  { term: 'Volatilité implicite', domain: 'finance', def: 'Volatilité σ telle que Black-Scholes reproduit exactement le prix de marché de l\'option.' },
  { term: 'Volatilité historique', domain: 'finance', def: 'Écart-type des rendements passés d\'un actif sur une période donnée. Mesure le risque réalisé.' },
  // Maths financières
  { term: 'Loi normale', domain: 'maths', def: 'Distribution en cloche symétrique entièrement définie par sa moyenne μ et son écart-type σ.' },
  { term: 'Martingale', domain: 'maths', def: 'Processus stochastique dont l\'espérance de la valeur future est égale à la valeur présente.' },
  { term: 'Mouvement brownien', domain: 'maths', def: 'Processus stochastique à temps continu, base des modèles de prix d\'actifs financiers.' },
  { term: 'Monte-Carlo', domain: 'maths', def: 'Méthode de simulation numérique basée sur des tirages aléatoires pour approximer des quantités complexes.' },
  { term: 'Processus d\'Itô', domain: 'maths', def: 'Processus stochastique de la forme dX = μ dt + σ dW, base des EDS en finance.' },
  { term: 'Lemme d\'Itô', domain: 'maths', def: 'Règle de calcul stochastique pour les fonctions de processus d\'Itô. df = ∂f/∂t dt + ∂f/∂x dX + ½ σ² ∂²f/∂x² dt.' },
  // Dev IT
  { term: 'API REST', domain: 'dev', def: 'Interface de communication entre systèmes basée sur HTTP, utilisant les verbes GET, POST, PUT, DELETE.' },
  { term: 'CI/CD', domain: 'dev', def: 'Intégration Continue / Déploiement Continu. Automatisation du test et du déploiement du code.' },
  { term: 'Docker', domain: 'dev', def: 'Plateforme de conteneurisation permettant d\'empaqueter une application et ses dépendances.' },
  { term: 'Low Latency', domain: 'dev', def: 'Architecture optimisée pour minimiser le temps de traitement des ordres. Critique en trading algorithmique.' },
  { term: 'Microservices', domain: 'dev', def: 'Architecture découpant une application en services indépendants communicant via des APIs.' },
  { term: 'WebSocket', domain: 'dev', def: 'Protocole de communication full-duplex en temps réel sur une connexion TCP persistante.' },
  // Machine Learning
  { term: 'Backpropagation', domain: 'ml', def: 'Algorithme calculant le gradient de la fonction de perte par rapport aux poids d\'un réseau de neurones.' },
  { term: 'Cross-validation', domain: 'ml', def: 'Technique d\'évaluation d\'un modèle en divisant les données en k sous-ensembles pour éviter le surapprentissage.' },
  { term: 'Overfitting', domain: 'ml', def: 'Surapprentissage : le modèle apprend par cœur les données d\'entraînement mais généralise mal.' },
  { term: 'Régression logistique', domain: 'ml', def: 'Modèle de classification binaire basé sur la fonction sigmoïde. Produit des probabilités.' },
  { term: 'Série temporelle', domain: 'ml', def: 'Séquence de données indexée dans le temps. Utilisée pour la prédiction de prix, volumes, risques.' },
  // Gestion de projet
  { term: 'AMOA', domain: 'pm', def: 'Assistance à Maîtrise d\'Ouvrage. Rôle d\'interface entre le métier et les équipes IT.' },
  { term: 'Kanban', domain: 'pm', def: 'Méthode agile de gestion visuelle des flux de travail via des colonnes (To Do / In Progress / Done).' },
  { term: 'Scrum', domain: 'pm', def: 'Framework agile organisé en sprints courts (1-4 sem.) avec des rôles définis : PO, Scrum Master, équipe.' },
  { term: 'Sprint', domain: 'pm', def: 'Itération courte et fixe (1-4 semaines) durant laquelle une équipe Scrum livre un incrément fonctionnel.' },
  { term: 'User Story', domain: 'pm', def: 'Description d\'une fonctionnalité du point de vue de l\'utilisateur : "En tant que X, je veux Y afin de Z".' },
]

export default async function GlossairePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAuthenticated = !!user

  return (
    <main className="min-h-screen bg-white">
      {/* NAVBAR */}
      <nav style={{ background: '#292929' }} className="h-14 flex items-center justify-between px-8">
        <Link href="/" className="flex items-center gap-3">
          <div style={{ background: '#3183F7', borderRadius: 8, width: 34, height: 34 }} className="flex items-center justify-center text-white text-xs font-black">SF</div>
          <div>
            <div className="text-white font-black text-sm tracking-wider">SPREAD</div>
            <div style={{ fontFamily: 'Permanent Marker', color: '#3183F7', fontSize: 9 }}>Finance</div>
          </div>
        </Link>
        <PublicNav />
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link href="/dashboard" className="text-white text-xs font-bold px-4 py-1.5 rounded-md" style={{ background: '#3183F7' }}>Mon dashboard →</Link>
          ) : (
            <>
              <Link href="/auth/login" className="text-white/60 border border-white/20 rounded-md text-xs font-semibold px-3 py-1.5 hover:text-white">Connexion</Link>
              <Link href="/auth/register" className="text-white text-xs font-bold px-4 py-1.5 rounded-md" style={{ background: '#3183F7' }}>Commencer gratuitement</Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: '#292929' }} className="px-8 pt-14 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4" style={{ background: 'rgba(49,131,247,.18)', border: '1px solid rgba(49,131,247,.3)', color: '#3183F7' }}>
            Référence
          </div>
          <h1 className="text-3xl font-black text-white leading-tight mb-3" style={{ letterSpacing: '-0.02em' }}>
            Glossaire Finance & IT
          </h1>
          <p className="text-white/50 text-sm leading-relaxed max-w-lg">
            {TERMS.length} définitions couvrant la Finance de marché, les Mathématiques financières, le Développement IT, le Machine Learning et la Gestion de projet.
          </p>
        </div>
      </section>

      {/* GLOSSAIRE — client pour recherche et filtres */}
      <GlossaireClient terms={TERMS} />

      {/* FOOTER */}
      <footer style={{ background: '#292929' }} className="px-8 py-8 mt-12">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="text-white/30 text-xs leading-relaxed">© 2026 Spread Finance.<br />Tous droits réservés.</div>
          <div className="flex flex-nowrap gap-3">
            {([['/documentation', 'Documentation'], ['/articles', 'Articles'], ['/pricing', 'Pricing'], ['/about', 'À propos']] as [string, string][]).map(([href, l]) => (
              <Link key={href} href={href} className="text-white/30 hover:text-white/60 text-[11px] whitespace-nowrap transition-colors">{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}
