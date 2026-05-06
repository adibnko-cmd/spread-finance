'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

const DOMAIN_COLOR: Record<string, string> = {
  finance: '#3183F7', maths: '#A855F7', dev: '#1a5fc8', pm: '#FFC13D', ml: '#F56751',
}
const DOMAIN_LABEL: Record<string, string> = {
  finance: 'Finance', maths: 'Maths', dev: 'Dev IT', pm: 'Gestion de projet', ml: 'ML',
}

type Status = 'pending' | 'retained' | 'rejected'

interface TestData {
  id: string; title: string; description: string | null
  domains: string[]; question_count: number; time_limit: number | null
  is_active: boolean; created_at: string; token: string; pass_score: number | null
}
interface Result {
  id: string; candidate_name: string; candidate_email: string
  score: number; correct_answers: number; total_questions: number
  time_seconds: number; completed_at: string; status: Status; hr_note: string | null
}
interface Stats { avg: number | null; passRate: number | null; total: number }

// ── helpers ────────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m${s > 0 ? ` ${s}s` : ''}` : `${s}s`
}
function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function scoreColor(s: number, passScore?: number | null): string {
  const threshold = passScore ?? 70
  if (s >= threshold) return '#36D399'
  if (s >= threshold * 0.8) return '#FFC13D'
  return '#F56751'
}

const STATUS_META: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  pending:  { label: 'À décider',  color: '#6B7280', bg: '#F9FAFB',  border: '#E5E7EB' },
  retained: { label: 'Retenu',     color: '#0d7a56', bg: '#E6FAF3',  border: '#86EFAC' },
  rejected: { label: 'Refusé',     color: '#dc2626', bg: '#FEF2F0',  border: '#FCA5A5' },
}

// ── CSV export ─────────────────────────────────────────────────────
function buildCSV(results: Result[], title: string, passScore: number | null) {
  const rows = [
    ['Candidat', 'Email', 'Score (%)', 'Bonnes réponses', 'Total questions', 'Temps', 'Date', 'Statut', 'Note RH'],
    ...results.map(r => [
      r.candidate_name,
      r.candidate_email,
      r.score,
      r.correct_answers,
      r.total_questions,
      formatTime(r.time_seconds),
      formatDate(r.completed_at),
      STATUS_META[r.status].label,
      r.hr_note ?? '',
    ]),
  ]
  if (passScore != null) {
    rows.splice(1, 0, [`Seuil de validation : ${passScore}%`, '', '', '', '', '', '', '', ''])
  }
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv, { type: 'text/csv;charset=utf-8;' }] as BlobPart[])
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `pipeline-${title.replace(/\s+/g, '_')}.csv`
  a.click()
}

// ── CandidateCard ──────────────────────────────────────────────────
function CandidateCard({
  result, passScore, onStatusChange, compareMode, isCompared, onToggleCompare,
}: {
  result: Result
  passScore: number | null
  onStatusChange: (id: string, status: Status) => void
  compareMode: boolean
  isCompared: boolean
  onToggleCompare: (id: string) => void
}) {
  const [showNote, setShowNote]   = useState(false)
  const [note, setNote]           = useState(result.hr_note ?? '')
  const [savingNote, setSavingNote] = useState(false)
  const meta = STATUS_META[result.status]

  async function saveNote() {
    setSavingNote(true)
    await fetch('/api/enterprise/results', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result_id: result.id, status: result.status, hr_note: note }),
    })
    setSavingNote(false)
    setShowNote(false)
  }

  return (
    <div
      className="bg-white rounded-2xl p-4 transition-all"
      style={{
        border: `1.5px solid ${isCompared ? '#3183F7' : meta.border}`,
        boxShadow: isCompared ? '0 0 0 2px #3183F720' : undefined,
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {compareMode && (
            <button
              onClick={() => onToggleCompare(result.id)}
              className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all"
              style={{
                background: isCompared ? '#3183F7' : '#fff',
                border: `1.5px solid ${isCompared ? '#3183F7' : '#D1D5DB'}`,
              }}
            >
              {isCompared && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2.5 2.5L7 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
          )}
          <div className="min-w-0">
            <div className="text-xs font-bold text-gray-900 truncate">{result.candidate_name}</div>
            <div className="text-[10px] text-gray-400 truncate">{result.candidate_email}</div>
          </div>
        </div>
        <div className="text-2xl font-black flex-shrink-0" style={{ color: scoreColor(result.score, passScore) }}>
          {result.score}%
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all" style={{ width: `${result.score}%`, background: scoreColor(result.score, passScore) }} />
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-3">
        <span>{result.correct_answers}/{result.total_questions} bonnes</span>
        <span>·</span>
        <span>{formatTime(result.time_seconds)}</span>
        <span>·</span>
        <span>{new Date(result.completed_at).toLocaleDateString('fr-FR')}</span>
      </div>

      {/* Note RH */}
      {result.hr_note && !showNote && (
        <div className="text-[10px] text-gray-500 italic mb-2 px-2 py-1.5 rounded-lg bg-gray-50">
          {result.hr_note}
        </div>
      )}
      {showNote && (
        <div className="mb-2">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="Note interne RH…"
            className="w-full px-2 py-1.5 rounded-lg text-[10px] text-gray-700 bg-gray-50 resize-none outline-none"
            style={{ border: '1.5px solid #E8E8E8' }}
          />
          <div className="flex justify-end gap-1 mt-1">
            <button onClick={() => setShowNote(false)} className="text-[10px] text-gray-400 px-2 py-1 rounded">Annuler</button>
            <button onClick={saveNote} disabled={savingNote}
              className="text-[10px] font-bold px-2 py-1 rounded text-white disabled:opacity-50"
              style={{ background: '#1C1C2E' }}>
              {savingNote ? '…' : 'Sauver'}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {!compareMode && (
        <div className="flex items-center gap-1 flex-wrap">
          {result.status !== 'retained' && (
            <button
              onClick={() => onStatusChange(result.id, 'retained')}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
              style={{ background: '#E6FAF3', color: '#0d7a56' }}
            >
              ✓ Retenir
            </button>
          )}
          {result.status !== 'rejected' && (
            <button
              onClick={() => onStatusChange(result.id, 'rejected')}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
              style={{ background: '#FEF2F0', color: '#dc2626' }}
            >
              ✕ Refuser
            </button>
          )}
          {result.status !== 'pending' && (
            <button
              onClick={() => onStatusChange(result.id, 'pending')}
              className="py-1.5 px-2 rounded-lg text-[10px] text-gray-400 hover:bg-gray-100 transition-colors"
            >
              ↩
            </button>
          )}
          <button
            onClick={() => setShowNote(v => !v)}
            className="py-1.5 px-2 rounded-lg text-[10px] text-gray-400 hover:bg-gray-100 transition-colors"
          >
            ✎
          </button>
          <a href={`/rapport/candidat/${result.id}`} target="_blank" rel="noopener noreferrer"
            className="py-1.5 px-2 rounded-lg text-[10px] text-gray-400 hover:bg-gray-100 transition-colors"
            title="Rapport PDF candidat">
            🖨
          </a>
        </div>
      )}
    </div>
  )
}

// ── Comparison view ────────────────────────────────────────────────
function ComparisonView({ results, passScore }: { results: Result[]; passScore: number | null }) {
  if (results.length < 2) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="text-3xl mb-3">⚖️</div>
        <div className="text-sm font-bold text-gray-700 mb-1">Sélectionnez 2 à 5 candidats</div>
        <div className="text-xs text-gray-400">Cochez les candidats dans la vue Pipeline pour les comparer côte à côte.</div>
      </div>
    )
  }

  const maxScore = 100
  const threshold = passScore ?? 70

  return (
    <div className="flex flex-col gap-6">
      {/* Score bars */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1.5px solid #E8E8E8' }}>
        <div className="text-sm font-bold text-gray-800 mb-5">Comparaison des scores</div>

        {/* Threshold line indicator */}
        {passScore != null && (
          <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
            <div className="w-6 border-t-2 border-dashed" style={{ borderColor: '#F56751' }} />
            <span>Seuil de validation : {passScore}%</span>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {results.map((r, i) => {
            const colors = ['#3183F7', '#A855F7', '#36D399', '#FFC13D', '#F56751']
            const barColor = colors[i % colors.length]
            const passed = r.score >= threshold
            return (
              <div key={r.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: barColor }} />
                    <span className="text-xs font-semibold text-gray-800">{r.candidate_name}</span>
                    <span className="text-[10px] text-gray-400">{r.candidate_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black" style={{ color: scoreColor(r.score, passScore) }}>{r.score}%</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={passed ? { background: '#E6FAF3', color: '#0d7a56' } : { background: '#FEF2F0', color: '#dc2626' }}>
                      {passed ? 'Admis' : 'Refusé'}
                    </span>
                  </div>
                </div>
                {/* Bar with threshold marker */}
                <div className="relative w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${(r.score / maxScore) * 100}%`, background: barColor, opacity: 0.85 }} />
                  {passScore != null && (
                    <div className="absolute top-0 bottom-0 w-0.5"
                      style={{ left: `${(passScore / maxScore) * 100}%`, background: '#F56751', opacity: 0.7 }} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail table */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #E8E8E8' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #F0F1F3' }}>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Candidat</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Score</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Réponses</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Temps</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Statut RH</th>
            </tr>
          </thead>
          <tbody>
            {results.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #F5F6F8' }}>
                <td className="px-5 py-3 text-xs font-semibold text-gray-800">
                  <div>{r.candidate_name}</div>
                  <div className="text-[10px] text-gray-400 font-normal">{r.candidate_email}</div>
                </td>
                <td className="px-5 py-3">
                  <span className="text-sm font-black" style={{ color: scoreColor(r.score, passScore) }}>{r.score}%</span>
                </td>
                <td className="px-5 py-3 text-xs text-gray-500">{r.correct_answers}/{r.total_questions}</td>
                <td className="px-5 py-3 text-xs text-gray-400">{formatTime(r.time_seconds)}</td>
                <td className="px-5 py-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: STATUS_META[r.status].bg, color: STATUS_META[r.status].color }}>
                    {STATUS_META[r.status].label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────
export function TestResultsClient({ test, results: initial, stats }: {
  test: TestData; results: Result[]; stats: Stats
}) {
  const [results, setResults]         = useState<Result[]>(initial)
  const [view, setView]               = useState<'pipeline' | 'list' | 'compare'>('pipeline')
  const [compareMode, setCompareMode] = useState(false)
  const [compared, setCompared]       = useState<Set<string>>(new Set())
  const [copied, setCopied]           = useState(false)
  const [search, setSearch]           = useState('')

  const testUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/candidat/${test.token}`
    : `/candidat/${test.token}`

  async function copyLink() {
    await navigator.clipboard.writeText(testUrl).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleStatusChange(resultId: string, status: Status) {
    const res = await fetch('/api/enterprise/results', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result_id: resultId, status }),
    })
    if (res.ok) {
      setResults(prev => prev.map(r => r.id === resultId ? { ...r, status } : r))
    }
  }

  function toggleCompare(id: string) {
    setCompared(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else if (next.size < 5) { next.add(id) }
      return next
    })
  }

  const comparedResults = useMemo(
    () => results.filter(r => compared.has(r.id)),
    [results, compared]
  )

  const filtered = results.filter(r =>
    r.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
    r.candidate_email.toLowerCase().includes(search.toLowerCase())
  )

  const columns: { key: Status; label: string; icon: string }[] = [
    { key: 'pending',  label: 'À décider',  icon: '⏳' },
    { key: 'retained', label: 'Retenus',     icon: '✅' },
    { key: 'rejected', label: 'Refusés',     icon: '❌' },
  ]

  const retained = results.filter(r => r.status === 'retained').length
  const rejected = results.filter(r => r.status === 'rejected').length
  const pending  = results.filter(r => r.status === 'pending').length

  return (
    <div className="p-8">
      {/* Back */}
      <Link href="/dashboard/entreprise/quiz"
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-5 transition-colors">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M8 6H4M4 6l3-3M4 6l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Mes tests
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-black text-gray-900 mb-1">{test.title}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            {test.domains.map(d => (
              <span key={d} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${DOMAIN_COLOR[d] ?? '#6B7280'}18`, color: DOMAIN_COLOR[d] ?? '#6B7280' }}>
                {DOMAIN_LABEL[d] ?? d}
              </span>
            ))}
            <span className="text-[10px] text-gray-400">{test.question_count} questions</span>
            {test.time_limit && <span className="text-[10px] text-gray-400">· {test.time_limit} min</span>}
            {test.pass_score != null && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEF2F0', color: '#dc2626' }}>
                Seuil : {test.pass_score}%
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={copyLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
            style={{ background: copied ? '#E6FAF3' : '#EBF2FF', color: copied ? '#0d7a56' : '#3183F7' }}>
            {copied ? '✓ Copié' : '🔗 Copier le lien'}
          </button>
          {results.length > 0 && (
            <>
              <button onClick={() => buildCSV(results, test.title, test.pass_score)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                style={{ background: '#F5F6F8', color: '#374151' }}>
                ↓ CSV
              </button>
              <a href={`/rapport/pipeline/${test.id}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                style={{ background: '#F5F6F8', color: '#374151' }}>
                🖨 Rapport PDF
              </a>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total candidats', value: stats.total,    color: '#1C1C2E', suffix: '' },
          { label: 'À décider',       value: pending,        color: '#6B7280', suffix: '' },
          { label: 'Retenus',         value: retained,       color: '#0d7a56', suffix: '' },
          { label: 'Refusés',         value: rejected,       color: '#dc2626', suffix: '' },
          { label: 'Score moyen',     value: stats.avg ?? '—', color: stats.avg != null ? scoreColor(stats.avg, test.pass_score) : '#9CA3AF', suffix: stats.avg != null ? '%' : '' },
        ].map(({ label, value, color, suffix }) => (
          <div key={label} className="bg-white rounded-2xl p-4" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-[10px] text-gray-400 mb-1">{label}</div>
            <div className="text-2xl font-black" style={{ color }}>{value}{suffix}</div>
          </div>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-3xl mb-3">📭</div>
          <div className="text-sm font-bold text-gray-700 mb-1">Aucun résultat</div>
          <div className="text-xs text-gray-400 mb-4">Partagez le lien aux candidats pour recevoir leurs résultats.</div>
          <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl px-4 py-3 max-w-md mx-auto" style={{ border: '1px solid #E8E8E8' }}>
            <code className="text-xs text-gray-500 truncate flex-1">{testUrl}</code>
            <button onClick={copyLink} className="text-[10px] font-bold text-blue-500 hover:text-blue-700 flex-shrink-0">
              {copied ? '✓' : 'Copier'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* View tabs + compare toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100">
              {([
                { key: 'pipeline', label: 'Pipeline' },
                { key: 'list',     label: 'Liste' },
                { key: 'compare',  label: `Comparer${compared.size > 0 ? ` (${compared.size})` : ''}` },
              ] as const).map(({ key, label }) => (
                <button key={key}
                  onClick={() => {
                    setView(key)
                    setCompareMode(key === 'pipeline' && compareMode)
                    if (key === 'compare') setCompareMode(true)
                    else if (key !== 'pipeline') setCompareMode(false)
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={view === key
                    ? { background: '#fff', color: '#1C1C2E', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }
                    : { color: '#6B7280' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {view === 'pipeline' && (
                <button
                  onClick={() => { setCompareMode(v => !v); if (compareMode) setCompared(new Set()) }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                  style={compareMode
                    ? { background: '#3183F7', color: '#fff' }
                    : { background: '#F5F6F8', color: '#374151' }}
                >
                  {compareMode ? `⚖ Comparer (${compared.size}/5)` : '⚖ Sélectionner pour comparer'}
                </button>
              )}
              {compareMode && compared.size >= 2 && (
                <button
                  onClick={() => setView('compare')}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                  style={{ background: '#1C1C2E' }}
                >
                  Voir la comparaison →
                </button>
              )}
              {(view === 'list') && (
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  className="px-3 py-1.5 rounded-xl text-xs text-gray-800 bg-white outline-none"
                  style={{ border: '1.5px solid #E8E8E8', minWidth: 180 }}
                />
              )}
            </div>
          </div>

          {/* Pipeline kanban */}
          {view === 'pipeline' && (
            <div className="grid grid-cols-3 gap-4">
              {columns.map(col => {
                const colResults = results.filter(r => r.status === col.key)
                const meta = STATUS_META[col.key]
                return (
                  <div key={col.key}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm">{col.icon}</span>
                      <span className="text-xs font-bold" style={{ color: meta.color }}>{col.label}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: meta.bg, color: meta.color }}>
                        {colResults.length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {colResults.length === 0 ? (
                        <div className="rounded-2xl py-8 text-center text-[10px] text-gray-400 dashed-border"
                          style={{ border: `1.5px dashed ${meta.border}` }}>
                          Aucun candidat
                        </div>
                      ) : colResults.map(r => (
                        <CandidateCard
                          key={r.id}
                          result={r}
                          passScore={test.pass_score}
                          onStatusChange={handleStatusChange}
                          compareMode={compareMode}
                          isCompared={compared.has(r.id)}
                          onToggleCompare={toggleCompare}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* List view */}
          {view === 'list' && (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #E8E8E8' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #F0F1F3' }}>
                    {['Candidat', 'Score', 'Réponses', 'Temps', 'Date', 'Statut', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid #F5F6F8' }}>
                      <td className="px-5 py-3.5">
                        <div className="text-xs font-semibold text-gray-800">{r.candidate_name}</div>
                        <div className="text-[10px] text-gray-400">{r.candidate_email}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-black" style={{ color: scoreColor(r.score, test.pass_score) }}>{r.score}%</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400">{r.correct_answers}/{r.total_questions}</span>
                          <div className="w-14 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${r.score}%`, background: scoreColor(r.score, test.pass_score) }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">{formatTime(r.time_seconds)}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">{formatDate(r.completed_at)}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: STATUS_META[r.status].bg, color: STATUS_META[r.status].color }}>
                          {STATUS_META[r.status].label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          {r.status !== 'retained' && (
                            <button onClick={() => handleStatusChange(r.id, 'retained')}
                              className="text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
                              style={{ background: '#E6FAF3', color: '#0d7a56' }}>✓</button>
                          )}
                          {r.status !== 'rejected' && (
                            <button onClick={() => handleStatusChange(r.id, 'rejected')}
                              className="text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
                              style={{ background: '#FEF2F0', color: '#dc2626' }}>✕</button>
                          )}
                          {r.status !== 'pending' && (
                            <button onClick={() => handleStatusChange(r.id, 'pending')}
                              className="text-[10px] px-2 py-1 rounded-lg text-gray-400 hover:bg-gray-100">↩</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Compare view */}
          {view === 'compare' && (
            <ComparisonView results={comparedResults} passScore={test.pass_score} />
          )}
        </>
      )}
    </div>
  )
}
