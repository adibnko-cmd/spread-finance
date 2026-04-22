import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getLevel } from '@/types'
import { computeAchievements } from '@/lib/achievements'

export const dynamic = 'force-dynamic'

const PLAN_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  free:     { label: 'Free',     color: '#888',    bg: '#f0f0f0' },
  premium:  { label: 'Premium',  color: '#1a5fc8', bg: '#EBF2FF' },
  platinum: { label: 'Platinum', color: '#7c3aed', bg: '#F3EEFF' },
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirectTo=/dashboard')

  const [profileRes, xpRes, progressRes, quizRes, activityRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('xp_log').select('xp_earned').eq('user_id', user.id),
    supabase.from('chapter_progress').select('status, domain_slug').eq('user_id', user.id),
    supabase.from('quiz_results').select('score, level').eq('user_id', user.id),
    supabase.from('activity_log').select('created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const profile  = profileRes.data
  const totalXp  = (xpRes.data ?? []).reduce((s, x) => s + x.xp_earned, 0)
  const progress = progressRes.data ?? []
  const quizzes  = quizRes.data ?? []
  const { level, title: levelTitle } = getLevel(totalXp)

  const plan     = (profile?.plan ?? 'free') as string
  const planMeta = PLAN_LABELS[plan] ?? PLAN_LABELS.free
  const initials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase()
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '—'

  const seen      = progress.filter(p => p.status !== 'not_started').length
  const validated = progress.filter(p => p.status === 'validated').length
  const domainsActive = new Set(progress.filter(p => p.status !== 'not_started').map(p => p.domain_slug)).size

  // Streak
  const streakDays = (() => {
    const days = Array.from(new Set(
      (activityRes.data ?? []).map(a => new Date(a.created_at).toLocaleDateString('fr-FR'))
    ))
    if (days.length === 0) return 0
    const today = new Date().toLocaleDateString('fr-FR')
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('fr-FR')
    if (days[0] !== today && days[0] !== yesterday) return 0
    let count = 1
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(new Date().setDate(new Date().getDate() - i))
      if (days[i] === prev.toLocaleDateString('fr-FR')) count++
      else break
    }
    return count
  })()

  const achievements = computeAchievements({
    totalXp,
    chaptersValidated: validated,
    chaptersSeen:      seen,
    quizCompleted:     quizzes.length,
    perfectScores:     quizzes.filter(q => q.score === 100).length,
    level3Quizzes:     quizzes.filter(q => q.level === 3 && q.score >= 70).length,
    streakDays,
    domainsActive,
  })

  const unlocked = achievements.filter(a => a.unlocked)
  const locked   = achievements.filter(a => !a.unlocked)

  return (
    <div className="p-5 max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <div className="text-sm font-black text-gray-800">Mon profil</div>
        <Link
          href="/dashboard/settings"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-100"
          style={{ border: '1.5px solid #E8E8E8', color: '#6B7280' }}
        >
          Modifier ⚙️
        </Link>
      </div>

      {/* Carte identité */}
      <div className="bg-white rounded-xl p-6 mb-4 flex items-center gap-5" style={{ border: '1.5px solid #E8E8E8' }}>
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white flex-shrink-0"
          style={{ background: '#3183F7' }}
        >
          {initials || '?'}
        </div>
        <div className="flex-1">
          <div className="text-base font-black text-gray-900">
            {profile?.first_name} {profile?.last_name}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{user.email}</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: planMeta.bg, color: planMeta.color }}>
              {planMeta.label}
            </span>
            <span className="text-[10px] text-gray-400">Membre depuis {memberSince}</span>
            {streakDays > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#FFF3E0', color: '#b37700' }}>
                🔥 {streakDays}j
              </span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-black" style={{ color: '#FFC13D' }}>Niv. {level}</div>
          <div className="text-[10px] text-gray-400">{levelTitle}</div>
          <div className="text-[10px] font-bold text-gray-500 mt-1">{totalXp.toLocaleString()} XP</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Chapitres vus', value: seen,      color: '#292929' },
          { label: 'Validés',       value: validated,  color: '#36D399' },
          { label: 'Quiz faits',    value: quizzes.length, color: '#A855F7' },
          { label: 'XP total',      value: totalXp.toLocaleString(), color: '#FFC13D' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-4" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-[10px] font-semibold text-gray-500 mb-1">{label}</div>
            <div className="text-xl font-black" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Achievements débloqués */}
      <div className="bg-white rounded-xl p-5 mb-4" style={{ border: '1.5px solid #E8E8E8' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-bold text-gray-800">Achievements</div>
          <div className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: '#E6FAF3', color: '#0d7a56' }}>
            {unlocked.length} / {achievements.length}
          </div>
        </div>

        {unlocked.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {unlocked.map(a => (
              <div key={a.id} className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center"
                style={{ background: `${a.color}10`, border: `1.5px solid ${a.color}30` }}>
                <div className="text-xl">{a.icon}</div>
                <div className="text-[9px] font-bold leading-tight" style={{ color: a.color }}>{a.title}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 mb-4">
            <div className="text-2xl mb-2">🏁</div>
            <div className="text-xs text-gray-400">Commencez votre apprentissage pour débloquer des achievements</div>
          </div>
        )}

        {/* Prochains à débloquer */}
        {locked.length > 0 && (
          <>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Prochains</div>
            <div className="flex flex-col gap-1.5">
              {locked.slice(0, 4).map(a => (
                <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ background: '#F9FAFB' }}>
                  <div className="text-base opacity-30">{a.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-gray-400">{a.title}</div>
                    <div className="text-[10px] text-gray-300">{a.description}</div>
                  </div>
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: '#E8E8E8' }} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Plan */}
      <div className="bg-white rounded-xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Abonnement</div>
            <div className="text-sm font-black text-gray-900">{planMeta.label}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              {plan === 'free' ? 'Accès limité aux chapitres gratuits'
                : plan === 'premium' ? 'Accès complet à tous les chapitres'
                : 'Accès total — LMS, certifications'}
            </div>
          </div>
          {plan === 'free' && (
            <a href="/#pricing" className="text-xs font-bold text-white px-4 py-2 rounded-xl"
              style={{ background: '#3183F7' }}>
              Passer Premium →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
