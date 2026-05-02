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
  is_active: boolean
  posted_at: string
}

const JOB_TYPES: Record<string, string> = {
  cdi: 'CDI', cdd: 'CDD', stage: 'Stage', alternance: 'Alternance', freelance: 'Freelance',
}
const DOMAIN_LABELS: Record<string, string> = {
  finance: 'Finance', maths: 'Maths', dev: 'Dev IT', pm: 'Gestion de projet', ml: 'Machine Learning',
}

const EMPTY = {
  title: '', location: 'Paris, France', type: 'cdi', domain_slug: '',
  salary_min: '', salary_max: '', description: '', apply_url: '',
}

export function EnterpriseJobsClient({ jobs: initial }: { jobs: Job[] }) {
  const [jobs, setJobs]       = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/enterprise/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          salary_min: form.salary_min ? parseInt(form.salary_min) : null,
          salary_max: form.salary_max ? parseInt(form.salary_max) : null,
          domain_slug: form.domain_slug || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Erreur')
      }
      const newJob = await res.json()
      setJobs(prev => [newJob, ...prev])
      setForm(EMPTY)
      setShowForm(false)
      setSuccess('Offre déposée avec succès — en attente de validation par l\'équipe Spread Finance.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-lg font-black text-gray-900">Offres d&apos;emploi</div>
          <div className="text-sm text-gray-400 mt-0.5">
            Les offres sont vérifiées par l&apos;équipe Spread Finance avant publication.
          </div>
        </div>
        <button onClick={() => { setShowForm(v => !v); setError(null) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all"
          style={{ background: showForm ? '#aaa' : '#1C1C2E' }}>
          {showForm ? '× Fermer' : '+ Déposer une offre'}
        </button>
      </div>

      {success && (
        <div className="mb-5 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2"
          style={{ background: '#E6FAF3', color: '#0d7a56' }}>
          ✅ {success}
          <button onClick={() => setSuccess(null)} className="ml-auto">×</button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 mb-6" style={{ border: '1.5px solid #3183F740' }}>
          <div className="text-sm font-bold text-gray-900 mb-1">Nouvelle offre d&apos;emploi</div>
          <div className="text-[11px] text-gray-400 mb-5">
            Après dépôt, votre offre sera examinée par l&apos;équipe Spread Finance (24–48h) avant d&apos;apparaître sur la plateforme.
          </div>
          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: '#FEF0EE', color: '#c0392b' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Titre du poste *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs border outline-none focus:border-blue-300"
                  style={{ borderColor: '#E8E8E8' }} placeholder="ex. Analyste Quantitatif Junior" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Localisation</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs border outline-none focus:border-blue-300"
                  style={{ borderColor: '#E8E8E8' }} placeholder="Paris, France" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Type de contrat</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs border outline-none"
                  style={{ borderColor: '#E8E8E8' }}>
                  {Object.entries(JOB_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Domaine</label>
                <select value={form.domain_slug} onChange={e => setForm(f => ({ ...f, domain_slug: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs border outline-none"
                  style={{ borderColor: '#E8E8E8' }}>
                  <option value="">— Tous domaines —</option>
                  {Object.entries(DOMAIN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Salaire min (€/an)</label>
                <input type="number" value={form.salary_min} onChange={e => setForm(f => ({ ...f, salary_min: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs border outline-none"
                  style={{ borderColor: '#E8E8E8' }} placeholder="40000" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Salaire max (€/an)</label>
                <input type="number" value={form.salary_max} onChange={e => setForm(f => ({ ...f, salary_max: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs border outline-none"
                  style={{ borderColor: '#E8E8E8' }} placeholder="55000" />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Lien de candidature</label>
                <input type="url" value={form.apply_url} onChange={e => setForm(f => ({ ...f, apply_url: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs border outline-none"
                  style={{ borderColor: '#E8E8E8' }} placeholder="https://..." />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Description du poste</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs border outline-none resize-none"
                  style={{ borderColor: '#E8E8E8' }} rows={4} placeholder="Décrivez le poste, les missions, le profil recherché…" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid #F0F0F0' }}>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500"
                style={{ background: '#F5F5F5' }}>
                Annuler
              </button>
              <button type="submit" disabled={saving}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: saving ? '#999' : '#1C1C2E' }}>
                {saving ? 'Envoi…' : 'Soumettre pour validation →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {jobs.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl py-16 text-center" style={{ border: '1.5px solid #E8E8E8' }}>
          <div className="text-4xl mb-3">💼</div>
          <div className="text-sm text-gray-400 mb-4">Aucune offre déposée.</div>
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: '#1C1C2E' }}>
            Déposer ma première offre
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-2xl p-5 flex items-center gap-5"
              style={{ border: '1.5px solid #E8E8E8' }}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-sm font-bold text-gray-900">{job.title}</div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: job.is_active ? '#E6FAF3' : '#FFF8E6', color: job.is_active ? '#0d7a56' : '#b37700' }}>
                    {job.is_active ? '✅ Active' : '⏳ En attente de validation'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span>{job.location}</span>
                  <span>·</span>
                  <span>{JOB_TYPES[job.type] ?? job.type}</span>
                  {job.domain_slug && <><span>·</span><span>{DOMAIN_LABELS[job.domain_slug] ?? job.domain_slug}</span></>}
                  {job.salary_min && job.salary_max && (
                    <><span>·</span><span>{(job.salary_min / 1000).toFixed(0)}–{(job.salary_max / 1000).toFixed(0)}k €</span></>
                  )}
                  <span>·</span>
                  <span>Déposée le {new Date(job.posted_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
