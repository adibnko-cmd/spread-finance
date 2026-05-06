'use client'

import { useState } from 'react'
import Link from 'next/link'

const DOMAIN_OPTS = [
  { value: 'finance', label: 'Finance de marché',         color: '#3183F7' },
  { value: 'maths',   label: 'Mathématiques financières', color: '#A855F7' },
  { value: 'dev',     label: 'Développement IT',           color: '#1a5fc8' },
  { value: 'pm',      label: 'Gestion de projet',          color: '#FFC13D' },
  { value: 'ml',      label: 'Machine Learning',            color: '#F56751' },
]

const DOMAIN_COLORS: Record<string, { color: string; bg: string }> = {
  finance: { color: '#3183F7', bg: '#EBF2FF' },
  maths:   { color: '#A855F7', bg: '#F5F0FF' },
  dev:     { color: '#1a5fc8', bg: '#E8EEFB' },
  pm:      { color: '#b37700', bg: '#FFF8E6' },
  ml:      { color: '#F56751', bg: '#FEF2F0' },
}

const TEMPLATES = [
  { title: 'Analyste Quantitatif Junior', domains: ['finance', 'maths'] as string[], question_count: 15, time_limit: '30', pass_score: '70', icon: '📈' },
  { title: 'Développeur Finance',         domains: ['dev', 'finance'] as string[],   question_count: 12, time_limit: '25', pass_score: '65', icon: '💻' },
  { title: 'Data Scientist Finance',      domains: ['ml', 'maths', 'finance'] as string[], question_count: 20, time_limit: '40', pass_score: '70', icon: '🤖' },
  { title: 'Chef de Projet IT Finance',   domains: ['pm', 'dev'] as string[],        question_count: 10, time_limit: '20', pass_score: '60', icon: '📋' },
  { title: 'Profil Généraliste',          domains: ['finance', 'maths', 'dev', 'pm', 'ml'] as string[], question_count: 25, time_limit: '45', pass_score: '65', icon: '🎯' },
  { title: 'Screening Rapide',            domains: ['finance'] as string[],           question_count: 5,  time_limit: '10', pass_score: '60', icon: '⚡' },
]

const LEVEL_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Débutant',       color: '#0d7a56', bg: '#E6FAF3' },
  2: { label: 'Intermédiaire',  color: '#b37700', bg: '#FFF8E6' },
  3: { label: 'Avancé',         color: '#dc2626', bg: '#FEF2F0' },
}

interface Question {
  text:        string
  explanation: string
  domain:      string
  level:       number
  answers:     { text: string; isCorrect: boolean }[]
}

interface Test {
  id:             string
  title:          string
  description:    string | null
  token:          string
  domains:        string[]
  question_count: number
  time_limit:     number | null
  is_active:      boolean
  created_at:     string
  result_count:   number
}

const EMPTY = { title: '', description: '', domains: [] as string[], question_count: 10, time_limit: '', pass_score: '' }

function domainColor(d: string) { return DOMAIN_OPTS.find(o => o.value === d)?.color ?? '#6B7280' }
function domainLabel(d: string) { return DOMAIN_OPTS.find(o => o.value === d)?.label ?? d }

function testUrl(token: string): string {
  if (typeof window !== 'undefined') return `${window.location.origin}/candidat/${token}`
  return `/candidat/${token}`
}

export function QuizManager({ tests: initial }: { tests: Test[] }) {
  const [tests, setTests]           = useState<Test[]>(initial)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(EMPTY)
  const [saving, setSaving]         = useState(false)
  const [formError, setFormError]   = useState('')
  const [copied, setCopied]         = useState<string | null>(null)

  // Manuel question selection
  const [mode, setMode]                   = useState<'auto' | 'manual'>('auto')
  const [questionBank, setQuestionBank]   = useState<Record<string, Question[]>>({})
  const [loadingBank, setLoadingBank]     = useState(false)
  const [selectedQs, setSelectedQs]       = useState<Question[]>([])
  const [filterDomain, setFilterDomain]   = useState<string>('all')
  const [filterLevel, setFilterLevel]     = useState<number | 'all'>('all')

  function toggleDomain(d: string) {
    setForm(f => ({
      ...f,
      domains: f.domains.includes(d) ? f.domains.filter(x => x !== d) : [...f.domains, d],
    }))
    setSelectedQs([])
    setQuestionBank({})
  }

  async function loadQuestionBank() {
    if (form.domains.length === 0) { setFormError('Sélectionnez au moins un domaine'); return }
    setLoadingBank(true)
    setFormError('')
    try {
      const res  = await fetch(`/api/enterprise/questions?domains=${form.domains.join(',')}`)
      const data = await res.json()
      setQuestionBank(data)
      setFilterDomain('all')
      setFilterLevel('all')
    } catch {
      setFormError('Impossible de charger les questions')
    } finally {
      setLoadingBank(false)
    }
  }

  function toggleQuestion(q: Question) {
    setSelectedQs(prev => {
      const idx = prev.findIndex(x => x.text === q.text)
      if (idx >= 0) return prev.filter((_, i) => i !== idx)
      if (prev.length >= 30) return prev
      return [...prev, q]
    })
  }

  function isSelected(q: Question) {
    return selectedQs.some(x => x.text === q.text)
  }

  const bankFlat = Object.values(questionBank).flat()

  const visibleQuestions = bankFlat
    .filter(q => filterDomain === 'all' || q.domain === filterDomain)
    .filter(q => filterLevel === 'all' || q.level === filterLevel)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (form.domains.length === 0) { setFormError('Sélectionnez au moins un domaine'); return }
    if (mode === 'manual' && selectedQs.length < 3) { setFormError('Sélectionnez au moins 3 questions'); return }

    setSaving(true)
    setFormError('')
    try {
      const body: Record<string, unknown> = {
        title:          form.title,
        description:    form.description || undefined,
        domains:        form.domains,
        question_count: mode === 'manual' ? selectedQs.length : form.question_count,
        time_limit:     form.time_limit ? parseInt(form.time_limit) : null,
        pass_score:     form.pass_score ? parseInt(form.pass_score) : null,
      }
      if (mode === 'manual') body.manual_questions = selectedQs

      const res  = await fetch('/api/enterprise/tests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur')
      setTests(prev => [{ ...data, result_count: 0 }, ...prev])
      setForm(EMPTY)
      setMode('auto')
      setSelectedQs([])
      setQuestionBank({})
      setShowForm(false)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch('/api/enterprise/tests', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    })
    if (res.ok) setTests(prev => prev.map(t => t.id === id ? { ...t, is_active: !current } : t))
  }

  async function copyLink(token: string) {
    const url = testUrl(token)
    await navigator.clipboard.writeText(url).catch(() => {})
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  const bankLoaded = Object.keys(questionBank).length > 0

  // Counts for difficulty filter badges
  const levelCounts = bankFlat.reduce((acc, q) => {
    const domain = filterDomain === 'all' || q.domain === filterDomain
    if (domain) acc[q.level] = (acc[q.level] ?? 0) + 1
    return acc
  }, {} as Record<number, number>)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-lg font-black text-gray-900">Tests & Quiz candidats</div>
          <div className="text-sm text-gray-400 mt-0.5">
            Créez des tests et partagez un lien — aucun compte requis pour le candidat.
          </div>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setFormError(''); setMode('auto'); setSelectedQs([]); setQuestionBank({}) }}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: '#1C1C2E' }}
        >
          {showForm ? '× Fermer' : '+ Créer un test'}
        </button>
      </div>

      {/* Modèles de tests */}
      {!showForm && (
        <div className="mb-6">
          <div className="text-xs font-bold text-gray-500 uppercase mb-3">Modèles pré-configurés</div>
          <div className="grid grid-cols-3 gap-3">
            {TEMPLATES.map(t => (
              <button
                key={t.title}
                type="button"
                onClick={() => {
                  setForm({ title: t.title, description: '', domains: t.domains, question_count: t.question_count, time_limit: t.time_limit, pass_score: t.pass_score })
                  setMode('auto')
                  setSelectedQs([])
                  setQuestionBank({})
                  setShowForm(true)
                  setFormError('')
                }}
                className="bg-white rounded-xl p-4 text-left hover:bg-blue-50 transition-colors group"
                style={{ border: '1.5px solid #E8E8E8' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{t.icon}</span>
                  <span className="text-xs font-bold text-gray-800 leading-snug">{t.title}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {t.domains.map(d => (
                    <span key={d} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: DOMAIN_COLORS[d]?.bg, color: DOMAIN_COLORS[d]?.color }}>
                      {domainLabel(d)}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span>{t.question_count}q</span>
                  <span>·</span>
                  <span>{t.time_limit} min</span>
                  <span>·</span>
                  <span>Seuil {t.pass_score}%</span>
                  <span className="ml-auto text-[10px] font-bold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Utiliser →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Formulaire création */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 mb-6" style={{ border: '1.5px solid #3183F740' }}>
          <div className="text-sm font-bold text-gray-800 mb-4">Nouveau test candidat</div>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">

            {/* Titre + description */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Titre du test *</label>
                <input
                  type="text" required value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Test Analyste Quantitatif Junior"
                  className="w-full px-3 py-2 rounded-xl text-sm text-gray-800 outline-none bg-gray-50"
                  style={{ border: '1.5px solid #E8E8E8' }}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Description (optionnel)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Instructions pour le candidat…"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl text-sm text-gray-800 outline-none bg-gray-50 resize-none"
                  style={{ border: '1.5px solid #E8E8E8' }}
                />
              </div>
            </div>

            {/* Domaines */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Domaines *</label>
              <div className="flex flex-wrap gap-2">
                {DOMAIN_OPTS.map(d => (
                  <button
                    key={d.value} type="button"
                    onClick={() => toggleDomain(d.value)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={form.domains.includes(d.value)
                      ? { background: d.color, color: '#fff' }
                      : { background: '#F5F6F8', color: '#6B7280' }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode sélection */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Mode de sélection des questions</label>
              <div className="flex gap-2">
                {(['auto', 'manual'] as const).map(m => (
                  <button
                    key={m} type="button"
                    onClick={() => { setMode(m); setSelectedQs([]); setQuestionBank({}) }}
                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: mode === m ? '#1C1C2E' : '#F5F6F8',
                      color:      mode === m ? '#fff'     : '#6B7280',
                    }}
                  >
                    {m === 'auto' ? 'Automatique' : 'Manuel (choisir les questions)'}
                  </button>
                ))}
              </div>
            </div>

            {/* AUTO mode */}
            {mode === 'auto' && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nombre de questions</label>
                  <select
                    value={form.question_count}
                    onChange={e => setForm(f => ({ ...f, question_count: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl text-sm text-gray-800 bg-gray-50 outline-none"
                    style={{ border: '1.5px solid #E8E8E8' }}
                  >
                    {[5, 8, 10, 15, 20, 25, 30].map(n => <option key={n} value={n}>{n} questions</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Durée limite (optionnel)</label>
                  <select
                    value={form.time_limit}
                    onChange={e => setForm(f => ({ ...f, time_limit: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm text-gray-800 bg-gray-50 outline-none"
                    style={{ border: '1.5px solid #E8E8E8' }}
                  >
                    <option value="">Sans limite</option>
                    {[10, 15, 20, 30, 45, 60].map(n => <option key={n} value={n}>{n} minutes</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Seuil de validation (optionnel)</label>
                  <div className="relative">
                    <input
                      type="number" min="0" max="100"
                      value={form.pass_score}
                      onChange={e => setForm(f => ({ ...f, pass_score: e.target.value }))}
                      placeholder="Ex: 70"
                      className="w-full px-3 py-2 pr-7 rounded-xl text-sm text-gray-800 bg-gray-50 outline-none"
                      style={{ border: '1.5px solid #E8E8E8' }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                  </div>
                  <div className="text-[9px] text-gray-400 mt-0.5">Score min. affiché au candidat</div>
                </div>
              </div>
            )}

            {/* MANUAL mode */}
            {mode === 'manual' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Durée limite (optionnel)</label>
                    <select
                      value={form.time_limit}
                      onChange={e => setForm(f => ({ ...f, time_limit: e.target.value }))}
                      className="px-3 py-2 rounded-xl text-sm text-gray-800 bg-gray-50 outline-none"
                      style={{ border: '1.5px solid #E8E8E8', minWidth: 160 }}
                    >
                      <option value="">Sans limite</option>
                      {[10, 15, 20, 30, 45, 60].map(n => <option key={n} value={n}>{n} minutes</option>)}
                    </select>
                  </div>
                  <div className="flex-1" />
                  {!bankLoaded ? (
                    <button
                      type="button"
                      onClick={loadQuestionBank}
                      disabled={loadingBank || form.domains.length === 0}
                      className="self-end px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-opacity"
                      style={{ background: '#3183F7' }}
                    >
                      {loadingBank ? 'Chargement…' : 'Charger la bibliothèque →'}
                    </button>
                  ) : (
                    <div className="self-end text-xs font-bold px-3 py-2 rounded-xl" style={{ background: '#E6FAF3', color: '#0d7a56' }}>
                      {selectedQs.length} / {Math.min(bankFlat.length, 30)} sélectionnées
                    </div>
                  )}
                </div>

                {bankLoaded && (
                  <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #E8E8E8' }}>
                    {/* Domain filter tabs */}
                    <div className="flex gap-0 overflow-x-auto bg-gray-50" style={{ borderBottom: '1px solid #F0F1F3' }}>
                      {['all', ...form.domains].map(d => (
                        <button
                          key={d} type="button"
                          onClick={() => setFilterDomain(d)}
                          className="px-4 py-2 text-[10px] font-bold whitespace-nowrap transition-colors flex-shrink-0"
                          style={{
                            background: filterDomain === d ? '#fff' : 'transparent',
                            color: filterDomain === d ? '#1C1C2E' : '#9CA3AF',
                            borderBottom: filterDomain === d ? '2px solid #1C1C2E' : '2px solid transparent',
                          }}
                        >
                          {d === 'all' ? `Tous (${bankFlat.length})` : `${domainLabel(d)} (${(questionBank[d] ?? []).length})`}
                        </button>
                      ))}
                    </div>

                    {/* Difficulty filter */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-white" style={{ borderBottom: '1px solid #F5F6F8' }}>
                      <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Niveau</span>
                      <button
                        type="button"
                        onClick={() => setFilterLevel('all')}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold transition-all"
                        style={filterLevel === 'all'
                          ? { background: '#1C1C2E', color: '#fff' }
                          : { background: '#F5F6F8', color: '#6B7280' }}
                      >
                        Tous
                      </button>
                      {([1, 2, 3] as const).map(lvl => {
                        const meta = LEVEL_LABELS[lvl]
                        const count = levelCounts[lvl] ?? 0
                        return (
                          <button
                            key={lvl} type="button"
                            onClick={() => setFilterLevel(lvl)}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold transition-all"
                            style={filterLevel === lvl
                              ? { background: meta.color, color: '#fff' }
                              : { background: meta.bg, color: meta.color }}
                          >
                            {meta.label} ({count})
                          </button>
                        )
                      })}
                    </div>

                    {/* Questions list */}
                    <div className="max-h-72 overflow-y-auto bg-white">
                      {visibleQuestions.length === 0 ? (
                        <div className="py-6 text-center text-xs text-gray-400">Aucune question pour ce filtre</div>
                      ) : (
                        visibleQuestions.map((q, i) => {
                          const sel      = isSelected(q)
                          const disabled = !sel && selectedQs.length >= 30
                          const lvlMeta  = LEVEL_LABELS[q.level] ?? LEVEL_LABELS[1]
                          return (
                            <div
                              key={i}
                              onClick={() => !disabled && toggleQuestion(q)}
                              className="flex items-start gap-3 px-4 py-3 transition-colors"
                              style={{
                                borderBottom: '1px solid #F5F6F8',
                                background: sel ? '#F7F9FF' : '#fff',
                                cursor: disabled ? 'not-allowed' : 'pointer',
                                opacity: disabled ? 0.4 : 1,
                              }}
                            >
                              <div
                                className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{
                                  background: sel ? '#3183F7' : '#fff',
                                  border: `1.5px solid ${sel ? '#3183F7' : '#D1D5DB'}`,
                                }}
                              >
                                {sel && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2.5 2.5L7 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-800 leading-snug line-clamp-2">{q.text}</div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span
                                    className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                    style={{ background: `${domainColor(q.domain)}18`, color: domainColor(q.domain) }}
                                  >
                                    {domainLabel(q.domain)}
                                  </span>
                                  <span
                                    className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                    style={{ background: lvlMeta.bg, color: lvlMeta.color }}
                                  >
                                    {lvlMeta.label}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {formError && <p className="text-xs text-red-500">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid #F0F0F0' }}>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-500 hover:bg-gray-100">
                Annuler
              </button>
              <button type="submit" disabled={saving || (mode === 'manual' && selectedQs.length < 3)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                style={{ background: '#1C1C2E' }}>
                {saving
                  ? 'Génération…'
                  : mode === 'manual'
                    ? `Créer avec ${selectedQs.length} question${selectedQs.length !== 1 ? 's' : ''} →`
                    : 'Créer le test →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des tests */}
      {tests.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-3xl mb-3">📝</div>
          <div className="text-sm font-bold text-gray-700 mb-1">Aucun test créé</div>
          <div className="text-xs text-gray-400 mb-4">
            Créez un test, partagez un lien — le candidat répond sans créer de compte.
          </div>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: '#1C1C2E' }}>
            Créer mon premier test
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tests.map(test => (
            <div key={test.id} className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className="text-sm font-bold text-gray-900">{test.title}</div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={test.is_active ? { background: '#E6FAF3', color: '#0d7a56' } : { background: '#F5F6F8', color: '#9CA3AF' }}
                    >
                      {test.is_active ? '● Actif' : '○ Désactivé'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {test.domains.map(d => (
                      <span key={d} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: `${domainColor(d)}18`, color: domainColor(d) }}>
                        {domainLabel(d)}
                      </span>
                    ))}
                    <span className="text-[10px] text-gray-400">·</span>
                    <span className="text-[10px] text-gray-400">{test.question_count} questions</span>
                    {test.time_limit && <>
                      <span className="text-[10px] text-gray-400">·</span>
                      <span className="text-[10px] text-gray-400">{test.time_limit} min</span>
                    </>}
                  </div>

                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2" style={{ border: '1px solid #E8E8E8' }}>
                    <code className="text-[10px] text-gray-500 flex-1 truncate">
                      {typeof window !== 'undefined' ? window.location.origin : ''}/candidat/{test.token}
                    </code>
                    <button
                      onClick={() => copyLink(test.token)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded transition-colors flex-shrink-0"
                      style={{ color: copied === test.token ? '#36D399' : '#3183F7' }}
                    >
                      {copied === test.token ? '✓ Copié' : 'Copier'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <Link
                    href={`/dashboard/entreprise/quiz/${test.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors"
                    style={{ background: '#EBF2FF', color: '#3183F7' }}
                  >
                    {test.result_count} résultat{test.result_count !== 1 ? 's' : ''} →
                  </Link>
                  <button
                    onClick={() => toggleActive(test.id, test.is_active)}
                    className="text-[10px] font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {test.is_active ? 'Désactiver' : 'Réactiver'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
