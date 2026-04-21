// ═══════════════════════════════════════════════════════════════════
// SPREAD FINANCE — Auth Callback (OAuth + Magic Link)
// Route : /api/auth/callback
// ═══════════════════════════════════════════════════════════════════
import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code        = searchParams.get('code')
  const redirectTo  = searchParams.get('redirectTo') ?? '/dashboard'
  const error       = searchParams.get('error')
  const errorDesc   = searchParams.get('error_description')

  // Gestion des erreurs OAuth
  if (error) {
    console.error('OAuth error:', error, errorDesc)
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorDesc ?? error)}`
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // Redirect vers le dashboard ou la page d'origine
      const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/dashboard'
      return NextResponse.redirect(`${origin}${safeRedirect}`)
    }

    console.error('Code exchange error:', exchangeError)
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`
    )
  }

  // Pas de code → retour à la page de connexion
  return NextResponse.redirect(`${origin}/auth/login`)
}
