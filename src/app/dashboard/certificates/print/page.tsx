'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

function CertificatePrint() {
  const params = useSearchParams()
  const name   = params.get('name') ?? 'Candidat'
  const date   = params.get('date') ?? new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const domains = (params.get('domains') ?? 'Finance, Maths, Dev, PM, ML').split(',').map(d => d.trim())

  useEffect(() => {
    const t = setTimeout(() => window.print(), 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        body { background: #fff; }
      `}</style>

      {/* Print hint */}
      <div className="no-print fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-800 text-white text-xs px-4 py-3 rounded-xl shadow-lg">
        <span>Utilisez &quot;Enregistrer en PDF&quot; dans la boîte d&apos;impression</span>
        <button onClick={() => window.print()} className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-lg">
          Imprimer
        </button>
        <button onClick={() => window.close()} className="text-gray-400 hover:text-white">×</button>
      </div>

      {/* Certificate — A4 landscape 297 × 210 mm */}
      <div
        style={{
          width: '297mm',
          height: '210mm',
          background: 'linear-gradient(135deg, #0d1225 0%, #1C1C2E 50%, #0d1225 100%)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Corner decorations */}
        {[
          { top: 0, left: 0, borderRadius: '0 0 40% 0' },
          { top: 0, right: 0, borderRadius: '0 0 0 40%' },
          { bottom: 0, left: 0, borderRadius: '0 40% 0 0' },
          { bottom: 0, right: 0, borderRadius: '40% 0 0 0' },
        ].map((style, i) => (
          <div key={i} style={{
            position: 'absolute', ...style,
            width: 60, height: 60,
            background: 'rgba(49,131,247,.12)',
            border: '1px solid rgba(49,131,247,.2)',
          }} />
        ))}

        {/* Outer border */}
        <div style={{
          position: 'absolute', inset: 10,
          border: '1px solid rgba(49,131,247,.25)',
          borderRadius: 4,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: 14,
          border: '1px solid rgba(255,255,255,.06)',
          borderRadius: 4,
          pointerEvents: 'none',
        }} />

        {/* Glow circle */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(49,131,247,.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 60px' }}>
          {/* Logo */}
          <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span style={{ color: '#3183F7', fontWeight: 900, fontSize: 17, letterSpacing: -0.5 }}>Spread</span>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 17, letterSpacing: -0.5 }}>Finance</span>
          </div>

          {/* Subtitle */}
          <div style={{
            display: 'inline-block',
            background: 'rgba(49,131,247,.15)',
            border: '1px solid rgba(49,131,247,.3)',
            borderRadius: 20,
            padding: '4px 14px',
            color: '#7BB3F7',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: 'uppercase',
            marginBottom: 22,
          }}>
            Certificat de formation
          </div>

          {/* Main text */}
          <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, marginBottom: 10 }}>
            Ce certificat est décerné à
          </div>
          <div style={{
            color: '#fff',
            fontSize: 32,
            fontWeight: 900,
            letterSpacing: -0.5,
            marginBottom: 14,
            textShadow: '0 0 30px rgba(49,131,247,.3)',
          }}>
            {name}
          </div>

          {/* Description */}
          <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 10.5, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 20px' }}>
            Pour avoir validé avec succès les parcours de formation sur la plateforme Spread Finance,
            démontrant une maîtrise approfondie des domaines financiers et quantitatifs.
          </div>

          {/* Domains */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
            {domains.map(d => (
              <span key={d} style={{
                background: 'rgba(49,131,247,.15)',
                border: '1px solid rgba(49,131,247,.25)',
                color: '#7BB3F7',
                fontSize: 9,
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 12,
              }}>
                {d}
              </span>
            ))}
          </div>

          {/* Divider */}
          <div style={{
            width: 80, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(49,131,247,.5), transparent)',
            margin: '0 auto 16px',
          }} />

          {/* Date + seal */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,.25)', fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Date d&apos;émission</div>
              <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 10, fontWeight: 600 }}>{date}</div>
            </div>

            <div style={{
              width: 44, height: 44,
              borderRadius: '50%',
              background: 'rgba(49,131,247,.15)',
              border: '2px solid rgba(49,131,247,.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>
              🏆
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,.25)', fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Plateforme</div>
              <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 10, fontWeight: 600 }}>spread-finance.fr</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function CertificatePrintPage() {
  return (
    <Suspense>
      <CertificatePrint />
    </Suspense>
  )
}
