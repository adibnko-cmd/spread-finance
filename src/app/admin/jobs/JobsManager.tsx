'use client'

import { useState } from 'react'

interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  domain_slug: string | null
  salary_min: number | null
  salary_max: number | null
  description: string | null
  apply_url: string | null
  requirements: string[]
  tags: string[]
  is_active: boolean
  posted_at: string
}

const DOMAIN_LABELS: Record<string, string> = {
  finance: 'Finance', maths: 'Maths', dev: 'Dev IT', pm: 'Gestion de projet', ml: 'Machine Learning',
}
const DOMAIN_COLORS: Record<string, string> = {
  finance: '#3183F7', maths: '#A855F7', dev: '#1a5fc8', pm: '#FFC13D', ml: '#F56751',
}
const JOB_TYPES: Record<string, string> = {
  cdi: 'CDI', cdd: 'CDD', stage: 'Stage', alternance: 'Alternance', freelance: 'Freelance',
}

const EMPTY_FORM = {
  title: '', company: '', location: 'Paris, France', type: 'cdi',
  domain_slug: '', salary_min: '', salary_max: '',
  description: '', apply_url: '', requirements: '', tags: '',
}

export function JobsManager({ jobs: initial }: { jobs: Job[] }) {
  const [jobs, setJobs]         = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
    setError(null)
  }

  function openEdit(job: Job) {
    setForm({
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
      domain_slug: job.domain_slug ?? '',
      salary_min: job.salary_min?.toString() ?? '',
      salary_max: job.salary_max?.toString() ?? '',
      description: job.description ?? '',
      apply_url: job.apply_url ?? '',
      requirements: job.requirements.join('\n'),
      tags: job.tags.join(', '),
    })
    setEditingId(job.id)
    setShowForm(true)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      ...form,
      salary_min:   form.salary_min ? parseInt(form.salary_min) : null,
      salary_max:   form.salary_max ? parseInt(form.salary_max) : null,
      domain_slug:  form.domain_slug || null,
      requirements: form.requirements,
      tags:         form.tags,
    }

    try {
      if (editingId) {
        const res = await fetch(`/api/admin/jobs/${editingId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            requirements: form.requirements.split('\n').map(s => s.trim()).filter(Boolean),
            tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
          }),
        })
        if (!res.ok) throw new Error()
        setJobs(prev => prev.map(j => j.id === editingId ? {
          ...j, ...payload,
          requirements: form.requirements.split('\n').map(s => s.trim()).filter(Boolean),
          tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
        } : j))
      } else {
        const res = await fetch('/api/admin/jobs', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        const newJob = await res.json()
        setJobs(prev => [newJob, ...prev])
      }
      setShowForm(false)
    } catch {
      setError('Erreur lors de l\'enregistrement.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(job: Job) {
    setLoadingId(job.id)
    try {
      await fetch(`/api/admin/jobs/${job.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !job.is_active }),
      })
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, is_active: !j.is_active } : j))
    } finally {
      setLoadingId(null)
    }
  }

  async function deleteJob(job: Job) {
    if (!confirm(`Supprimer "${job.title}" chez ${job.company} ?`)) return
    setLoadingId(job.id)
    try {
      await fetch(`/api/admin/jobs/${job.id}`, { method: 'DELETE' })
      setJobs(prev => prev.filter(j => j.id !== job.id))
    } finally {
      setLoadingId(null)
    }
  }

  const active   = jobs.filter(j => j.is_active).length
  const inactive = jobs.filter(j => !j.is_active).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-lg font-black text-gray-900">Offres d&apos;emploi</div>
          <div className="text-sm text-gray-500 mt-0.5">
            <span className="font-semibold text-gray-700">{active}</span> actives · <span className="text-gray-400">{inactive} inactives</span>
          </div>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white"
          style={{ background: '#1C1C2E' }}>
          <span>+</span> Créer une offre
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 mb-6" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="text-sm font-bold text-gray-900">{editingId ? 'Modifier l\'offre' : 'Nouvelle offre'}</div>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700 text-lg leading-none">×</button>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: '#FEF0EE', color: '#c0392b' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Titre *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs border outline-none focus:border-gray-400"
                  style={{ borderColor: '#E8E8E8' }} placeholder="ex. Analyste Quantitatif" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Entreprise *</label>
                <input required value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs border outline-none focus:border-gray-400"
                  style={{ borderColor: '#E8E8E8' }} placeholder="ex. Goldman Sachs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Localisation</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs border outline-none focus:border-gray-400"
                  style={{ borderColor: '#E8E8E8' }} placeholder="Paris, France" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs border outline-none focus:border-gray-400"
                  style={{ borderColor: '#E8E8E8' }}>
                  {Object.entries(JOB_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Domaine</label>
                <select value={form.domain_slug} onChange={e => setForm(f => ({ ...f, domain_slug: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs border outline-none focus:border-gray-400"
                  style={{ borderColor: '#E8E8E8' }}>
                  <option value="">— Tous domaines —</option>
                  {Object.entries(DOMAIN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Lien candidature</label>
                <input value={form.apply_url} onChange={e => setForm(f => ({ ...f, apply_url: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs border outline-none focus:border-gray-400"
                  style={{ borderColor: '#E8E8E8' }} placeholder="https://..." type="url" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Salaire min (€/an)</label>
                <input value={form.salary_min} onChange={e => setForm(f => ({ ...f, salary_min: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs border outline-none focus:border-gray-400"
                  style={{ borderColor: '#E8E8E8' }} type="number" placeholder="40000" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Salaire max (€/an)</label>
                <input value={form.salary_max} onChange={e => setForm(f => ({ ...f, salary_max: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs border outline-none focus:border-gray-400"
                  style={{ borderColor: '#E8E8E8' }} type="number" placeholder="60000" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs border outline-none focus:border-gray-400 resize-none"
                  style={{ borderColor: '#E8E8E8' }} rows={4} placeholder="Description du poste…" />
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Prérequis <span className="normal-case font-normal text-gray-400">(1 par ligne)</span></label>
                  <textarea value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-xs border outline-none focus:border-gray-400 resize-none"
                    style={{ borderColor: '#E8E8E8' }} rows={2} placeholder="Master Finance Quantitative&#10;Python, C++" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tags <span className="normal-case font-normal text-gray-400">(séparés par virgule)</span></label>
                  <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-xs border outline-none focus:border-gray-400"
                    style={{ borderColor: '#E8E8E8' }} placeholder="Python, Quant, Options" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600"
                style={{ background: '#F5F5F5' }}>
                Annuler
              </button>
              <button type="submit" disabled={saving}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: saving ? '#999' : '#1C1C2E' }}>
                {saving ? 'Enregistrement…' : editingId ? 'Enregistrer' : 'Publier l\'offre'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Jobs list */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1.5px solid #E8E8E8' }}>
        {jobs.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">💼</div>
            <div className="text-sm text-gray-400">Aucune offre d&apos;emploi. Créez la première.</div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
                {['Offre', 'Type', 'Domaine', 'Salaire', 'Statut', 'Publié le', ''].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, i) => {
                const isLoading = loadingId === job.id
                const domainColor = DOMAIN_COLORS[job.domain_slug ?? ''] ?? '#888'
                return (
                  <tr key={job.id} style={{ borderTop: i > 0 ? '1px solid #F5F5F5' : 'none', opacity: isLoading ? 0.5 : 1 }}>
                    <td className="px-4 py-3">
                      <div className="text-xs font-semibold text-gray-900">{job.title}</div>
                      <div className="text-[11px] text-gray-400">{job.company} · {job.location}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: '#F5F5F5', color: '#666' }}>
                        {JOB_TYPES[job.type] ?? job.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {job.domain_slug ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${domainColor}18`, color: domainColor }}>
                          {DOMAIN_LABELS[job.domain_slug] ?? job.domain_slug}
                        </span>
                      ) : <span className="text-[10px] text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-gray-500">
                      {job.salary_min && job.salary_max
                        ? `${(job.salary_min / 1000).toFixed(0)}–${(job.salary_max / 1000).toFixed(0)}k €`
                        : job.salary_min ? `${(job.salary_min / 1000).toFixed(0)}k+ €`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: job.is_active ? '#E6FAF3' : '#FEF0EE', color: job.is_active ? '#0d7a56' : '#c0392b' }}>
                        {job.is_active ? '✅ Active' : '⏸ Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-gray-400">
                      {new Date(job.posted_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(job)} disabled={isLoading}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors hover:bg-gray-100 text-gray-600">
                          Modifier
                        </button>
                        <button onClick={() => toggleActive(job)} disabled={isLoading}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors"
                          style={{ background: job.is_active ? '#FEF0EE' : '#E6FAF3', color: job.is_active ? '#c0392b' : '#0d7a56' }}>
                          {job.is_active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button onClick={() => deleteJob(job)} disabled={isLoading}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors hover:bg-red-50 text-red-400">
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
