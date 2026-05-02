import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Outils — Spread Finance' }

const TOOLS = [
  {
    title: 'Calculateur Black-Scholes',
    desc: 'Pricer une option européenne (call/put) — valeur, Greeks, sensibilités.',
    domain: 'Finance', color: '#3183F7', bg: '#EBF2FF', icon: '📈', soon: true,
  },
  {
    title: 'Duration & Convexité',
    desc: 'Calcul de la duration de Macaulay, duration modifiée et convexité d\'une obligation.',
    domain: 'Finance', color: '#3183F7', bg: '#EBF2FF', icon: '📊', soon: true,
  },
  {
    title: 'Convertisseur de taux',
    desc: 'Conversion entre taux actuariel, taux proportionnel, taux continu et taux nominal.',
    domain: 'Maths', color: '#A855F7', bg: '#F3EFFF', icon: '🔄', soon: true,
  },
  {
    title: 'Simulateur de portefeuille',
    desc: 'Composition d\'un portefeuille multi-actifs — rendement espéré, volatilité, ratio de Sharpe.',
    domain: 'Finance', color: '#3183F7', bg: '#EBF2FF', icon: '💼', soon: true,
  },
  {
    title: 'Greeks Calculator',
    desc: 'Delta, Gamma, Vega, Theta, Rho — visualisation des sensibilités d\'une option.',
    domain: 'Finance', color: '#3183F7', bg: '#EBF2FF', icon: '🧮', soon: true,
  },
  {
    title: 'Arbre Binomial',
    desc: 'Pricing d\'option par arbre binomial (CRR) avec affichage pas à pas.',
    domain: 'Maths', color: '#A855F7', bg: '#F3EFFF', icon: '🌲', soon: true,
  },
  {
    title: 'Monte-Carlo Simulator',
    desc: 'Simulation de trajectoires de prix d\'actifs par méthode Monte-Carlo.',
    domain: 'ML', color: '#F56751', bg: '#FEF0EE', icon: '🎲', soon: true,
  },
  {
    title: 'Backtester de stratégie',
    desc: 'Teste une stratégie simple (SMA, RSI) sur données historiques simulées.',
    domain: 'Dev', color: '#1a5fc8', bg: '#E8F0FE', icon: '⚙️', soon: true,
  },
]

const DOMAIN_COLORS: Record<string, string> = {
  Finance: '#3183F7', Maths: '#A855F7', Dev: '#1a5fc8', ML: '#F56751', PM: '#FFC13D',
}

export default function OutilsPage() {
  return (
    <div className="p-5 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="text-sm font-black text-gray-800 mb-1">Mini-applications</div>
        <div className="text-xs text-gray-400">
          Des outils de calcul finance & quant directement dans le navigateur. Aucune installation requise.
        </div>
      </div>

      {/* Coming soon banner */}
      <div className="rounded-xl px-5 py-4 mb-6 flex items-center gap-3" style={{ background: '#FFF8E6', border: '1.5px solid #FFE0A3' }}>
        <span className="text-xl">🔨</span>
        <div>
          <div className="text-xs font-bold" style={{ color: '#b37700' }}>En cours de développement</div>
          <div className="text-[11px]" style={{ color: '#c4900a' }}>
            Ces outils seront disponibles progressivement. Créez un compte Premium pour y accéder en avant-première.
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4">
        {TOOLS.map(({ title, desc, domain, color, bg, icon, soon }) => (
          <div
            key={title}
            className="bg-white rounded-xl p-5 relative"
            style={{ border: '1.5px solid #E8E8E8', opacity: soon ? 0.85 : 1 }}
          >
            {soon && (
              <span
                className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#FFF8E6', color: '#b37700' }}
              >
                Bientôt
              </span>
            )}

            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: bg }}>
                {icon}
              </div>
              <div>
                <div className="text-xs font-bold text-gray-800 mb-0.5">{title}</div>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: `${DOMAIN_COLORS[domain]}15`, color: DOMAIN_COLORS[domain] }}
                >
                  {domain}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed mb-4">{desc}</p>

            <button
              disabled
              className="w-full py-2 rounded-lg text-[11px] font-bold cursor-not-allowed"
              style={{ background: '#F5F5F5', color: '#aaa' }}
            >
              Prochainement
            </button>
          </div>
        ))}
      </div>

      {/* Suggest */}
      <div className="mt-6 rounded-xl p-5 flex items-center justify-between" style={{ background: '#F7F8FA', border: '1.5px solid #E8E8E8' }}>
        <div>
          <div className="text-xs font-bold text-gray-800 mb-0.5">Un outil vous manque ?</div>
          <div className="text-[11px] text-gray-500">Suggérez un calculateur ou un simulateur que vous aimeriez voir ici.</div>
        </div>
        <a
          href="mailto:contact@spread-finance.fr?subject=Suggestion d'outil"
          className="flex-shrink-0 text-xs font-bold text-white px-4 py-2 rounded-lg ml-4"
          style={{ background: '#292929' }}
        >
          Suggérer →
        </a>
      </div>
    </div>
  )
}
