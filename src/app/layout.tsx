// ═══════════════════════════════════════════════════════════════════
// SPREAD FINANCE — Root Layout
// Work Sans (principale) + Permanent Marker (logo/accroches)
// ═══════════════════════════════════════════════════════════════════
import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Spread Finance — IT & Finance de marché',
    template: '%s | Spread Finance',
  },
  description: 'La référence francophone pour les professionnels IT & Finance de marché.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,600&family=Permanent+Marker&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Work Sans', sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
