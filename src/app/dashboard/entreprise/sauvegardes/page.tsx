import Link from 'next/link'

export const dynamic = 'force-dynamic'

const TEMPLATES = [
  {
    title:  'Analyste Quantitatif Junior',
    desc:   'Finance + Maths — 15 questions, 30 min. Idéal pour un premier entretien technique quant.',
    domains: ['finance', 'maths'],
    question_count: 15,
    time_limit: 30,
    icon: '📈',
  },
  {
    title:  'Développeur Finance',
    desc:   'Dev + Finance — 12 questions, 25 min. Pour un profil FinTech ou développeur dans la finance.',
    domains: ['dev', 'finance'],
    question_count: 12,
    time_limit: 25,
    icon: '💻',
  },
  {
    title:  'Data Scientist Finance',
    desc:   'ML + Maths + Finance — 20 questions, 40 min. Profil orienté machine learning appliqué aux marchés.',
    domains: ['ml', 'maths', 'finance'],
    question_count: 20,
    time_limit: 40,
    icon: '🤖',
  },
  {
    title:  'Chef de Projet IT Finance',
    desc:   'PM + Dev — 10 questions, 20 min. Gestion de projet agile en contexte financier.',
    domains: ['pm', 'dev'],
    question_count: 10,
    time_limit: 20,
    icon: '📋',
  },
  {
    title:  'Profil Complet — Généraliste',
    desc:   'Tous domaines — 25 questions, 45 min. Test de culture générale finance & tech.',
    domains: ['finance', 'maths', 'dev', 'pm', 'ml'],
    question_count: 25,
    time_limit: 45,
    icon: '🎯',
  },
  {
    title:  'Screening Rapide',
    desc:   'Finance — 5 questions, 10 min. Pré-sélection express avant entretien.',
    domains: ['finance'],
    question_count: 5,
    time_limit: 10,
    icon: '⚡',
  },
]

const DOMAIN_COLORS: Record<string, { color: string; bg: string; label: string }> = {
  finance: { color: '#3183F7', bg: '#EBF2FF', label: 'Finance' },
  maths:   { color: '#A855F7', bg: '#F5F0FF', label: 'Maths' },
  dev:     { color: '#1a5fc8', bg: '#E8EEFB', label: 'Dev' },
  pm:      { color: '#b37700', bg: '#FFF8E6', label: 'PM' },
  ml:      { color: '#F56751', bg: '#FEF2F0', label: 'ML' },
}

export default function SauvegardesPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="text-lg font-black text-gray-900">Modèles de tests</div>
        <div className="text-sm text-gray-400 mt-0.5">
          Utilisez un modèle pré-configuré comme point de départ, puis personnalisez dans l&apos;éditeur.
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center gap-3 px-5 py-3 rounded-xl mb-6" style={{ background: '#EBF2FF', border: '1.5px solid #3183F730' }}>
        <span>💡</span>
        <div className="text-xs text-blue-800">
          Cliquez sur <strong>Utiliser ce modèle</strong> pour créer un test à partir d&apos;une configuration pré-définie.
          Vous pourrez modifier le titre, les domaines et les questions avant de valider.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {TEMPLATES.map(t => {
          const params = new URLSearchParams({
            title:          t.title,
            domains:        t.domains.join(','),
            question_count: String(t.question_count),
            time_limit:     String(t.time_limit),
          })
          return (
            <div key={t.title} className="bg-white rounded-2xl p-5 flex flex-col" style={{ border: '1.5px solid #E8E8E8' }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: '#F5F6F8' }}>
                  {t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-gray-800 mb-0.5">{t.title}</div>
                  <div className="flex flex-wrap gap-1">
                    {t.domains.map(d => {
                      const meta = DOMAIN_COLORS[d]
                      return (
                        <span key={d} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: meta?.bg, color: meta?.color }}>
                          {meta?.label ?? d}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed mb-3 flex-1">{t.desc}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span>{t.question_count} questions</span>
                  <span>·</span>
                  <span>{t.time_limit} min</span>
                </div>
                <Link
                  href={`/dashboard/entreprise/quiz?template=${encodeURIComponent(params.toString())}`}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-xl text-white transition-opacity hover:opacity-90"
                  style={{ background: '#1C1C2E' }}
                >
                  Utiliser →
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
