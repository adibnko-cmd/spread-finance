'use client'

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'

interface XpPoint    { date: string; xp: number }
interface QuizPoint  { name: string; score: number; passed: boolean; level: number }
interface DomainStat { name: string; color: string; validated: number; seen: number; total: number; timeHours: number }

interface Props {
  xpChartData:     XpPoint[]
  quizChartData:   QuizPoint[]
  domainChartData: DomainStat[]
  avgScore:        number
}

function CustomTooltip({ active, payload, label, suffix = '' }: {
  active?: boolean; payload?: Array<{ value: number }>; label?: string; suffix?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl px-3 py-2 shadow-lg text-xs font-bold text-gray-700"
      style={{ border: '1.5px solid #E8E8E8' }}>
      <div className="text-gray-400 text-[10px] mb-0.5">{label}</div>
      {payload[0].value}{suffix}
    </div>
  )
}

export function AnalyticsCharts({ xpChartData, quizChartData, domainChartData, avgScore }: Props) {
  const hasXpData  = xpChartData.some(d => d.xp > 0)
  const hasQuizData = quizChartData.length > 0

  return (
    <div className="flex flex-col gap-4">
      {/* XP over time */}
      <div className="bg-white rounded-xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-bold text-gray-800">XP gagnés — 30 derniers jours</div>
          <div className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#F5F0FF', color: '#A855F7' }}>
            {xpChartData.reduce((s, d) => s + d.xp, 0)} XP
          </div>
        </div>
        {hasXpData ? (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={xpChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} axisLine={false}
                interval={4} />
              <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip suffix=" XP" />} />
              <Line type="monotone" dataKey="xp" stroke="#A855F7" strokeWidth={2}
                dot={false} activeDot={{ r: 4, fill: '#A855F7' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-xs text-gray-400">
            Aucun XP gagné ces 30 derniers jours
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Quiz scores */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-bold text-gray-800">Scores des 10 derniers quiz</div>
            <div className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#EBF2FF', color: '#3183F7' }}>
              Moy. {avgScore}%
            </div>
          </div>
          {hasQuizData ? (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={quizChartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip suffix="%" />} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {quizChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.passed ? '#36D399' : entry.score >= 50 ? '#FFC13D' : '#F56751'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-36 flex items-center justify-center text-xs text-gray-400">
              Aucun quiz passé pour l&apos;instant
            </div>
          )}
          {/* Légende */}
          <div className="flex items-center gap-3 mt-2">
            {[{ color: '#36D399', label: 'Réussi (≥70%)' }, { color: '#FFC13D', label: '50-69%' }, { color: '#F56751', label: '<50%' }].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-[9px] text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progression domaines */}
        <div className="bg-white rounded-xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-xs font-bold text-gray-800 mb-4">Progression par domaine</div>
          <div className="flex flex-col gap-3">
            {domainChartData.map(d => {
              const pct = d.total > 0 ? Math.round((d.validated / d.total) * 100) : 0
              return (
                <div key={d.name}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="font-semibold text-gray-700">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {d.timeHours > 0 && (
                        <span className="text-gray-400">{d.timeHours}h</span>
                      )}
                      <span className="font-bold" style={{ color: d.color }}>{d.validated}/{d.total}</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: '#F0F0F0', overflow: 'hidden' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: d.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Source XP breakdown */}
      <div className="bg-white rounded-xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
        <div className="text-xs font-bold text-gray-800 mb-1">Conseil</div>
        <div className="text-[11px] text-gray-500 leading-relaxed">
          Validez des chapitres avec des quiz pour maximiser vos XP. Un chapitre validé rapporte +30 XP, et le quiz associé jusqu&apos;à +50 XP supplémentaires.
          Connectez-vous chaque jour pour maintenir votre streak et gagner des bonus quotidiens.
        </div>
      </div>
    </div>
  )
}
