// ══════════════════════════════════════════════════════
// SPREAD FINANCE — Utilitaire emails transactionnels
// Utilise Resend + react-email
// ══════════════════════════════════════════════════════
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'Spread Finance <noreply@spread-finance.fr>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://spread-finance.fr'

// ── Helpers ────────────────────────────────────────────
function baseHtml(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;border:1.5px solid #E8E8E8;">
  <!-- Header -->
  <tr><td style="background:#1C1C2E;padding:24px 32px;">
    <span style="color:#3183F7;font-size:18px;font-weight:900;letter-spacing:-0.5px;">Spread</span>
    <span style="color:#fff;font-size:18px;font-weight:900;letter-spacing:-0.5px;">Finance</span>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:32px;">
    ${body}
  </td></tr>
  <!-- Footer -->
  <tr><td style="padding:16px 32px 24px;border-top:1px solid #F0F0F0;">
    <p style="margin:0;font-size:11px;color:#9CA3AF;text-align:center;">
      Spread Finance · Plateforme éducative Finance &amp; IT<br/>
      <a href="${APP_URL}" style="color:#3183F7;text-decoration:none;">spread-finance.fr</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

function btn(text: string, href: string) {
  return `<a href="${href}" style="display:inline-block;background:#3183F7;color:#fff;font-weight:700;font-size:13px;padding:12px 24px;border-radius:10px;text-decoration:none;margin-top:16px;">${text}</a>`
}

function h1(text: string) {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#1C1C2E;">${text}</h1>`
}

function p(text: string, small = false) {
  return `<p style="margin:0 0 12px;font-size:${small ? 12 : 14}px;color:${small ? '#9CA3AF' : '#374151'};line-height:1.6;">${text}</p>`
}

function highlight(label: string, value: string, color = '#3183F7') {
  return `<div style="display:inline-block;background:${color}15;border:1.5px solid ${color}40;border-radius:10px;padding:12px 20px;margin:12px 0;">
    <div style="font-size:11px;color:${color};font-weight:600;margin-bottom:4px;">${label}</div>
    <div style="font-size:20px;font-weight:900;color:${color};">${value}</div>
  </div>`
}

// ── Emails ─────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, firstName: string) {
  const body = `
    ${h1(`Bienvenue sur Spread Finance, ${firstName} ! 🎉`)}
    ${p('Tu as rejoint la plateforme d\'apprentissage dédiée à la finance de marché et à l\'informatique. Tout commence maintenant.')}
    ${p('Voici ce que tu peux faire dès aujourd\'hui :')}
    <ul style="margin:0 0 16px;padding-left:20px;color:#374151;font-size:14px;line-height:2;">
      <li>📖 Accéder aux <strong>32 chapitres</strong> sur 5 domaines</li>
      <li>🧠 Passer des <strong>quiz</strong> pour valider tes acquis</li>
      <li>⭐ Gagner des <strong>XP</strong> et monter dans le classement</li>
    </ul>
    ${btn('Commencer mon parcours →', `${APP_URL}/documentation`)}
  `
  return resend.emails.send({ from: FROM, to, subject: 'Bienvenue sur Spread Finance 🎉', html: baseHtml('Bienvenue', body) })
}

export async function sendChapterValidatedEmail(to: string, firstName: string, chapterTitle: string, xpEarned: number) {
  const body = `
    ${h1(`Chapitre validé, ${firstName} ! ✅`)}
    ${p(`Tu viens de valider le chapitre <strong>${chapterTitle}</strong> avec un quiz réussi. Excellent travail !`)}
    ${highlight('XP gagné', `+${xpEarned} XP`, '#36D399')}
    ${p('Continue sur ta lancée — chaque chapitre validé te rapproche du niveau suivant.', false)}
    ${btn('Voir ma progression →', `${APP_URL}/dashboard/progression`)}
  `
  return resend.emails.send({ from: FROM, to, subject: `✅ Chapitre "${chapterTitle}" validé !`, html: baseHtml('Chapitre validé', body) })
}

export async function sendQuizPassedEmail(to: string, firstName: string, chapterTitle: string, score: number, level: number, xpEarned: number) {
  const body = `
    ${h1(`Quiz réussi, ${firstName} ! 🏆`)}
    ${p(`Tu as réussi le quiz niveau ${level} sur <strong>${chapterTitle}</strong>.`)}
    <div style="display:flex;gap:12px;margin:12px 0;">
      ${highlight('Score', `${score}%`, '#3183F7')}
      ${highlight('XP gagné', `+${xpEarned} XP`, '#A855F7')}
    </div>
    ${score >= 90 ? p('🌟 Score exceptionnel ! Tu maîtrises parfaitement ce sujet.') : ''}
    ${btn('Voir tous mes quiz →', `${APP_URL}/dashboard/quiz`)}
  `
  return resend.emails.send({ from: FROM, to, subject: `🏆 Quiz niveau ${level} réussi — ${score}%`, html: baseHtml('Quiz réussi', body) })
}

export async function sendStreakReminderEmail(to: string, firstName: string, streakDays: number) {
  const body = `
    ${h1(`${firstName}, ton streak est en danger ! 🔥`)}
    ${p(`Tu as un streak de <strong>${streakDays} jour${streakDays > 1 ? 's' : ''}</strong> consécutifs. Ne le laisse pas s'éteindre !`)}
    ${highlight('Streak actuel', `${streakDays} jour${streakDays > 1 ? 's' : ''}`, '#FFC13D')}
    ${p('Connecte-toi aujourd\'hui et fais au moins un quiz ou lis un chapitre pour maintenir ton streak et gagner tes bonus XP quotidiens.')}
    ${btn('Maintenir mon streak →', `${APP_URL}/dashboard`)}
  `
  return resend.emails.send({ from: FROM, to, subject: `🔥 ${streakDays} jours de streak — ne t'arrête pas !`, html: baseHtml('Streak en danger', body) })
}

export async function sendSubscriptionChangedEmail(to: string, firstName: string, newPlan: string) {
  const planLabels: Record<string, string> = { premium: 'Premium', platinum: 'Platinum', free: 'Free' }
  const planLabel = planLabels[newPlan] ?? newPlan
  const isPaid = newPlan !== 'free'
  const body = `
    ${h1(isPaid ? `Bienvenue sur le plan ${planLabel} ! 🚀` : `Retour au plan Free, ${firstName}`)}
    ${isPaid
      ? `${p(`Ton abonnement <strong>${planLabel}</strong> est maintenant actif. Tu as accès à toutes les fonctionnalités incluses.`)}
         <ul style="margin:0 0 16px;padding-left:20px;color:#374151;font-size:14px;line-height:2;">
           <li>✅ Quiz niveau 3 (avancé)</li>
           <li>✅ Flashcards illimitées</li>
           <li>✅ Offres d'emploi Finance &amp; IT</li>
           ${newPlan === 'platinum' ? '<li>✅ E-Learning &amp; Certifications</li>' : ''}
         </ul>`
      : p('Ton abonnement a été annulé. Tu conserves l\'accès aux fonctionnalités gratuites.')
    }
    ${btn('Accéder à mon espace →', `${APP_URL}/dashboard`)}
  `
  return resend.emails.send({
    from: FROM,
    to,
    subject: isPaid ? `🚀 Bienvenue sur le plan ${planLabel} !` : 'Ton abonnement a été annulé',
    html: baseHtml('Abonnement', body),
  })
}
