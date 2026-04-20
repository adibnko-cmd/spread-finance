// ═══════════════════════════════════════════════════════════════════
// SPREAD FINANCE — Clients Supabase
// @supabase/ssr — compatibilité Next.js App Router (Server + Client)
// ═══════════════════════════════════════════════════════════════════

// ── CLIENT-SIDE (Composants React côté client) ────────────────────
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
