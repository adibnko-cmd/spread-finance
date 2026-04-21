// ═══════════════════════════════════════════════════════════════════
// SPREAD FINANCE — Webhook Stripe
// Gère les événements subscription (création, MAJ, annulation)
// Route : /api/webhooks/stripe
// ═══════════════════════════════════════════════════════════════════
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

function planFromPriceId(priceId: string): 'premium' | 'platinum' | 'free' {
  if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) return 'premium'
  if (priceId === process.env.STRIPE_PLATINUM_PRICE_ID) return 'platinum'
  return 'free'
}

export async function POST(request: NextRequest) {
  const body      = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  switch (event.type) {
    // ── Abonnement créé / activé ───────────────────────────────
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId   = subscription.customer as string
      const priceId      = subscription.items.data[0]?.price.id
      const plan         = planFromPriceId(priceId)

      // Trouver l'utilisateur via stripe_customer_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (profile) {
        // Mettre à jour le profil
        await supabase.from('profiles').update({
          plan,
          plan_started_at: new Date(subscription.current_period_start * 1000).toISOString(),
          plan_ends_at:    new Date(subscription.current_period_end * 1000).toISOString(),
        }).eq('id', profile.id)

        // Mettre à jour la table subscriptions
        await supabase.from('subscriptions').upsert({
          user_id:                  profile.id,
          stripe_subscription_id:   subscription.id,
          stripe_customer_id:       customerId,
          stripe_price_id:          priceId,
          status:                   subscription.status as 'active' | 'past_due' | 'canceled' | 'trialing',
          plan,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end:   new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at:    subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : null,
        }, { onConflict: 'user_id' })
      }
      break
    }

    // ── Abonnement annulé / expiré ─────────────────────────────
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId   = subscription.customer as string

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (profile) {
        await supabase.from('profiles').update({
          plan: 'free',
          plan_ends_at: null,
        }).eq('id', profile.id)

        await supabase.from('subscriptions').update({
          status:      'canceled',
          plan:        'free',
          canceled_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', subscription.id)
      }
      break
    }

    // ── Paiement réussi ────────────────────────────────────────
    case 'invoice.payment_succeeded': {
      console.log('Payment succeeded:', event.data.object)
      break
    }

    // ── Paiement échoué ────────────────────────────────────────
    case 'invoice.payment_failed': {
      console.warn('Payment failed:', event.data.object)
      // Envoyer un email de relance via Resend (Phase 4 Sprint 3)
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
