'use client'

interface Props {
  userName: string
  domains:  string[]
}

export function CertificateDownloadButton({ userName, domains }: Props) {
  function handleDownload() {
    const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    const params = new URLSearchParams({
      name:    userName,
      date,
      domains: domains.join(','),
    })
    window.open(`/dashboard/certificates/print?${params}`, '_blank', 'width=1200,height=900')
  }

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-80"
      style={{ background: '#3183F7' }}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M6.5 1v8M3.5 7l3 3 3-3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M1.5 11h10" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
      Télécharger le certificat
    </button>
  )
}
