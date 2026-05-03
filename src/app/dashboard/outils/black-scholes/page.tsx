'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

// Normal CDF via Abramowitz & Stegun approximation (error < 1.5e-7)
function normCDF(x: number): number {
  const a1 =  0.254829592, a2 = -0.284496736, a3 = 1.421413741
  const a4 = -1.453152027, a5 =  1.061405429, p  = 0.3275911
  const sign = x < 0 ? -1 : 1
  const ax = Math.abs(x)
  const t  = 1 / (1 + p * ax)
  const y  = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax / 2)
  return 0.5 * (1 + sign * y)
}
function normPDF(x: number): number {
  return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)
}

interface BSResult {
  price:  number
  delta:  number
  gamma:  number
  vega:   number
  theta:  number
  rho:    number
  d1:     number
  d2:     number
}

function blackScholes(S: number, K: number, r: number, sigma: number, T: number, type: 'call' | 'put'): BSResult | null {
  if (S <= 0 || K <= 0 || sigma <= 0 || T <= 0) return null
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T))
  const d2 = d1 - sigma * Math.sqrt(T)
  const Nd1 = normCDF(d1), Nd2 = normCDF(d2)
  const discount = Math.exp(-r * T)

  if (type === 'call') {
    const price = S * Nd1 - K * discount * Nd2
    const delta = Nd1
    const gamma = normPDF(d1) / (S * sigma * Math.sqrt(T))
    const vega  = S * normPDF(d1) * Math.sqrt(T) / 100
    const theta = (-S * normPDF(d1) * sigma / (2 * Math.sqrt(T)) - r * K * discount * Nd2) / 365
    const rho   = K * T * discount * Nd2 / 100
    return { price, delta, gamma, vega, theta, rho, d1, d2 }
  } else {
    const price = K * discount * normCDF(-d2) - S * normCDF(-d1)
    const delta = Nd1 - 1
    const gamma = normPDF(d1) / (S * sigma * Math.sqrt(T))
    const vega  = S * normPDF(d1) * Math.sqrt(T) / 100
    const theta = (-S * normPDF(d1) * sigma / (2 * Math.sqrt(T)) + r * K * discount * normCDF(-d2)) / 365
    const rho   = -K * T * discount * normCDF(-d2) / 100
    return { price, delta, gamma, vega, theta, rho, d1, d2 }
  }
}

function fmt(n: number, dec = 4): string {
  return n.toFixed(dec)
}

export default function BlackScholesPage() {
  const [S,     setS]     = useState('100')
  const [K,     setK]     = useState('100')
  const [r,     setR]     = useState('5')
  const [sigma, setSigma] = useState('20')
  const [T,     setT]     = useState('1')
  const [type,  setType]  = useState<'call' | 'put'>('call')

  const result = useMemo(() => {
    const s   = parseFloat(S)
    const k   = parseFloat(K)
    const rn  = parseFloat(r) / 100
    const sig = parseFloat(sigma) / 100
    const t   = parseFloat(T)
    return blackScholes(s, k, rn, sig, t, type)
  }, [S, K, r, sigma, T, type])

  const GREEKS = result ? [
    { key: 'Delta', value: fmt(result.delta, 4), desc: `Variation du prix pour +1€ sur le sous-jacent`, color: '#3183F7' },
    { key: 'Gamma', value: fmt(result.gamma, 6), desc: `Variation du delta pour +1€ sur le sous-jacent`, color: '#A855F7' },
    { key: 'Vega',  value: fmt(result.vega, 4),  desc: `Variation du prix pour +1% de volatilité`, color: '#36D399' },
    { key: 'Theta', value: fmt(result.theta, 4), desc: `Variation du prix par jour écoulé`, color: '#F56751' },
    { key: 'Rho',   value: fmt(result.rho, 4),   desc: `Variation du prix pour +1% du taux sans risque`, color: '#FFC13D' },
  ] : []

  return (
    <div className="p-5 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-5">
        <Link href="/dashboard/outils" className="hover:text-gray-600 transition-colors">Mini-applications</Link>
        <span>›</span>
        <span className="text-gray-700 font-semibold">Black-Scholes</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#EBF2FF' }}>
          📈
        </div>
        <div>
          <div className="text-sm font-black text-gray-800">Calculateur Black-Scholes</div>
          <div className="text-xs text-gray-400">Pricer une option européenne — valeur et Greeks</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Inputs */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-xs font-bold text-gray-700 mb-4">Paramètres</div>

            {/* Option type */}
            <div className="mb-4">
              <div className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Type d&apos;option</div>
              <div className="flex gap-2">
                {(['call', 'put'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: type === t ? '#1C1C2E' : '#F5F6F8',
                      color:      type === t ? '#fff'     : '#6B7280',
                    }}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Parameters */}
            {[
              { label: 'S — Prix spot du sous-jacent (€)',   value: S,     set: setS,     unit: '€',  min: '0.01' },
              { label: 'K — Prix d\'exercice / Strike (€)',  value: K,     set: setK,     unit: '€',  min: '0.01' },
              { label: 'r — Taux sans risque annuel (%)',    value: r,     set: setR,     unit: '%',  min: '0' },
              { label: 'σ — Volatilité annuelle (%)',        value: sigma, set: setSigma, unit: '%',  min: '0.01' },
              { label: 'T — Maturité (années)',              value: T,     set: setT,     unit: 'ans', min: '0.01' },
            ].map(({ label, value, set, unit, min }) => (
              <div key={label} className="mb-3">
                <div className="text-[10px] font-bold text-gray-500 mb-1">{label}</div>
                <div className="flex items-center gap-2">
                  <input
                    type="number" step="any" min={min}
                    value={value}
                    onChange={e => set(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl text-sm font-semibold text-gray-800 outline-none"
                    style={{ border: '1.5px solid #E8E8E8', background: '#FAFAFA' }}
                  />
                  <span className="text-[10px] text-gray-400 font-semibold w-8 text-right flex-shrink-0">{unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Formula reminder */}
          <div className="rounded-xl px-4 py-3 text-[10px] text-gray-500 leading-relaxed" style={{ background: '#F7F8FA', border: '1.5px solid #E8E8E8' }}>
            <div className="font-bold text-gray-700 mb-1">Rappel formule</div>
            d₁ = [ln(S/K) + (r + σ²/2)T] / σ√T<br/>
            d₂ = d₁ − σ√T<br/>
            Call = S·N(d₁) − Ke⁻ʳᵀ·N(d₂)<br/>
            Put &nbsp;= Ke⁻ʳᵀ·N(−d₂) − S·N(−d₁)
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-col gap-4">
          {/* Price */}
          <div
            className="bg-white rounded-2xl p-6 text-center"
            style={{ border: '1.5px solid #E8E8E8' }}
          >
            <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">
              Prix théorique — {type.toUpperCase()}
            </div>
            {result ? (
              <>
                <div className="text-4xl font-black text-gray-900 mb-1">
                  {fmt(result.price, 4)} <span className="text-lg font-normal text-gray-400">€</span>
                </div>
                <div className="text-[10px] text-gray-400">
                  d₁ = {fmt(result.d1, 4)} &nbsp;·&nbsp; d₂ = {fmt(result.d2, 4)}
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-300 my-4">Paramètres invalides</div>
            )}
          </div>

          {/* Greeks */}
          <div className="bg-white rounded-2xl p-5" style={{ border: '1.5px solid #E8E8E8' }}>
            <div className="text-xs font-bold text-gray-700 mb-3">Greeks</div>
            {result ? (
              <div className="flex flex-col gap-2">
                {GREEKS.map(g => (
                  <div key={g.key} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid #F5F6F8' }}>
                    <div>
                      <span className="text-xs font-black" style={{ color: g.color }}>{g.key}</span>
                      <div className="text-[9px] text-gray-400 mt-0.5 max-w-[160px] leading-snug">{g.desc}</div>
                    </div>
                    <span className="text-sm font-black text-gray-800">{g.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-300 text-center py-4">—</div>
            )}
          </div>

          {/* Interpretation */}
          {result && (
            <div className="rounded-xl px-4 py-3 text-[10px] text-gray-500 leading-relaxed" style={{ background: '#F7F8FA', border: '1.5px solid #E8E8E8' }}>
              <div className="font-bold text-gray-700 mb-1">Interprétation</div>
              {type === 'call'
                ? `Pour +1€ sur le sous-jacent, le prix du call varie de ${fmt(result.delta, 2)}€. `
                : `Pour +1€ sur le sous-jacent, le prix du put varie de ${fmt(result.delta, 2)}€. `}
              {`Le passage d'une journée fait varier le prix de ${fmt(result.theta, 4)}€ (Theta decay). `}
              {`Une hausse de volatilité de 1% augmente le prix de ${fmt(result.vega, 4)}€.`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
