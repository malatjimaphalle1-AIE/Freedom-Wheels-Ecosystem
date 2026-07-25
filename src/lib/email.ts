// Email notification service
//
// Provider: Resend (https://resend.com) — modern email API, free tier 3,000 emails/month
// Falls back to console.log in dev mode (when RESEND_API_KEY is not set).
//
// ENV VARS:
//   RESEND_API_KEY           — Resend API key (re_xxxxx) — optional in dev
//   EMAIL_FROM                — sender email (e.g. "Freedom Wheels <noreply@freedomwheels.online>")
//   EMAIL_ENABLED             — "true" to enable real sending (otherwise always dev mode)
//   NEXT_PUBLIC_BASE_URL      — used for links in emails

import { db } from '@/lib/db'

const EMAIL_FROM = process.env.EMAIL_FROM || 'Freedom Wheels <noreply@freedomwheels.online>'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

function isEmailEnabled(): boolean {
  return process.env.EMAIL_ENABLED === 'true' && !!process.env.RESEND_API_KEY
}

interface EmailPayload {
  to: string
  subject: string
  html: string
  text: string
}

async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; devMode: boolean; error?: string }> {
  if (!isEmailEnabled()) {
    // Dev mode: log to console
    console.log('\n========== EMAIL (dev mode) ==========')
    console.log('To:', payload.to)
    console.log('Subject:', payload.subject)
    console.log('---')
    console.log(payload.text)
    console.log('========== END EMAIL ==========\n')
    return { ok: true, devMode: true }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[email] Resend API error:', res.status, errText)
      return { ok: false, devMode: false, error: `Resend ${res.status}: ${errText}` }
    }

    return { ok: true, devMode: false }
  } catch (err) {
    console.error('[email] send error:', err)
    return { ok: false, devMode: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ============================================================================
// TEMPLATES
// ============================================================================

export async function sendMagicLinkEmail(email: string, token: string): Promise<{ ok: boolean; devMode: boolean }> {
  const link = `${BASE_URL}/member?token=${token}`

  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Freedom Wheels login link</title>
</head>
<body style="font-family: -apple-system, system-ui, sans-serif; max-width: 500px; margin: 2rem auto; padding: 1rem; color: #1f2937;">
  <div style="text-align: center; margin-bottom: 2rem;">
    <div style="display: inline-block; width: 40px; height: 40px; background: #059669; color: white; font-weight: bold; border-radius: 6px; line-height: 40px;">FW</div>
    <h1 style="font-size: 1.5rem; margin: 1rem 0 0;">Freedom Wheels</h1>
  </div>
  <h2 style="font-size: 1.25rem;">Your magic login link</h2>
  <p>Click the button below to log in to your Freedom Wheels member dashboard. This link expires in 15 minutes and can only be used once.</p>
  <p style="text-align: center; margin: 2rem 0;">
    <a href="${link}" style="display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Log in to Freedom Wheels</a>
  </p>
  <p style="color: #6b7280; font-size: 0.875rem;">If you didn't request this link, you can safely ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;">
  <p style="color: #9ca3af; font-size: 0.75rem;">Freedom Wheels · South Africa<br>This is an automated email — please do not reply.</p>
</body>
</html>`

  const text = `Freedom Wheels — Your magic login link

Click the link below to log in to your member dashboard. This link expires in 15 minutes and can only be used once.

${link}

If you didn't request this link, you can safely ignore this email.

Freedom Wheels · South Africa`

  const result = await sendEmail({
    to: email,
    subject: 'Your Freedom Wheels login link',
    html,
    text,
  })

  return { ok: result.ok, devMode: result.devMode }
}

export async function sendSubscriptionConfirmationEmail(email: string, name: string | null, tier: string, amountCents: number): Promise<{ ok: boolean }> {
  const amount = (amountCents / 100).toFixed(2)
  const greeting = name ? `Hi ${name}` : 'Hi there'

  const html = `
<!doctype html>
<html>
<head><meta charset="utf-8"><title>Welcome to Freedom Wheels</title></head>
<body style="font-family: -apple-system, system-ui, sans-serif; max-width: 500px; margin: 2rem auto; padding: 1rem; color: #1f2937;">
  <div style="text-align: center; margin-bottom: 2rem;">
    <div style="display: inline-block; width: 40px; height: 40px; background: #059669; color: white; font-weight: bold; border-radius: 6px; line-height: 40px;">FW</div>
    <h1 style="font-size: 1.5rem; margin: 1rem 0 0;">Welcome to Freedom Wheels</h1>
  </div>
  <p>${greeting},</p>
  <p>Your <strong>${tier}</strong> membership is now active. Thanks for joining — we're excited to have you.</p>
  <p><strong>What you paid:</strong> R${amount} (monthly recurring)<br>
  <strong>Next billing date:</strong> One month from today</p>
  <p><strong>What happens next:</strong></p>
  <ul>
    <li>Log in to your dashboard at any time: <a href="${BASE_URL}/member">${BASE_URL}/member</a></li>
    <li>Click through our affiliate partners when you buy tools or equipment — that's what funds your revenue share</li>
    <li>At the end of each month, we total up affiliate commissions and distribute the share to active members</li>
    <li>You'll get an email when your monthly distribution is ready</li>
  </ul>
  <p style="text-align: center; margin: 2rem 0;">
    <a href="${BASE_URL}/member" style="display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Go to your dashboard</a>
  </p>
  <p style="color: #6b7280; font-size: 0.875rem;">If you didn't sign up for Freedom Wheels, please reply to this email immediately.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;">
  <p style="color: #9ca3af; font-size: 0.75rem;">Freedom Wheels · South Africa<br>This is an automated email — please do not reply.</p>
</body>
</html>`

  const text = `Welcome to Freedom Wheels

${greeting},

Your ${tier} membership is now active. Thanks for joining!

What you paid: R${amount} (monthly recurring)
Next billing date: One month from today

What happens next:
- Log in to your dashboard at ${BASE_URL}/member
- Click through our affiliate partners when you buy tools or equipment
- At the end of each month, we distribute the affiliate revenue share to active members
- You'll get an email when your monthly distribution is ready

If you didn't sign up for Freedom Wheels, please reply to this email immediately.

Freedom Wheels · South Africa`

  const result = await sendEmail({
    to: email,
    subject: `Welcome to Freedom Wheels — your ${tier} membership is active`,
    html,
    text,
  })

  return { ok: result.ok }
}

export async function sendDistributionNotificationEmail(email: string, name: string | null, month: string, amountCents: number, poolTotalCents: number): Promise<{ ok: boolean }> {
  const amount = (amountCents / 100).toFixed(2)
  const poolTotal = (poolTotalCents / 100).toFixed(2)
  const greeting = name ? `Hi ${name}` : 'Hi there'
  const monthFormatted = formatMonth(month)

  const html = `
<!doctype html>
<html>
<head><meta charset="utf-8"><title>Your ${monthFormatted} revenue share is ready</title></head>
<body style="font-family: -apple-system, system-ui, sans-serif; max-width: 500px; margin: 2rem auto; padding: 1rem; color: #1f2937;">
  <div style="text-align: center; margin-bottom: 2rem;">
    <div style="display: inline-block; width: 40px; height: 40px; background: #059669; color: white; font-weight: bold; border-radius: 6px; line-height: 40px;">FW</div>
    <h1 style="font-size: 1.5rem; margin: 1rem 0 0;">Your ${monthFormatted} revenue share</h1>
  </div>
  <p>${greeting},</p>
  <p>Your revenue share for <strong>${monthFormatted}</strong> has been distributed to your account.</p>
  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 1.5rem; text-align: center; margin: 1.5rem 0;">
    <div style="font-size: 0.875rem; color: #047857;">Your distribution</div>
    <div style="font-size: 2rem; font-weight: bold; color: #059669; margin: 0.5rem 0;">R${amount}</div>
    <div style="font-size: 0.75rem; color: #6b7280;">From a total pool of R${poolTotal}</div>
  </div>
  <p>You can view your full distribution history and request a payout from your dashboard.</p>
  <p style="text-align: center; margin: 2rem 0;">
    <a href="${BASE_URL}/member" style="display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">View your dashboard</a>
  </p>
  <p style="color: #6b7280; font-size: 0.875rem;">The full monthly transparency report is available at <a href="${BASE_URL}/transparency">${BASE_URL}/transparency</a>.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;">
  <p style="color: #9ca3af; font-size: 0.75rem;">Freedom Wheels · South Africa<br>This is an automated email — please do not reply.</p>
</body>
</html>`

  const text = `Your ${monthFormatted} revenue share is ready

${greeting},

Your revenue share for ${monthFormatted} has been distributed to your account.

Your distribution: R${amount}
From a total pool of: R${poolTotal}

View your dashboard: ${BASE_URL}/member
View the full transparency report: ${BASE_URL}/transparency

Freedom Wheels · South Africa`

  const result = await sendEmail({
    to: email,
    subject: `Your ${monthFormatted} revenue share: R${amount}`,
    html,
    text,
  })

  return { ok: result.ok }
}

export async function sendPayoutStatusEmail(email: string, name: string | null, amountCents: number, status: string, reference: string | null): Promise<{ ok: boolean }> {
  const amount = (amountCents / 100).toFixed(2)
  const greeting = name ? `Hi ${name}` : 'Hi there'

  const statusMessages: Record<string, { subject: string; body: string }> = {
    APPROVED: {
      subject: `Payout approved: R${amount}`,
      body: `Your payout request for R${amount} has been approved and is being processed. You should receive the funds within 7–14 business days.`,
    },
    PAID: {
      subject: `Payout sent: R${amount}`,
      body: `Your payout of R${amount} has been sent${reference ? ` (reference: ${reference})` : ''}. Please allow 1–3 business days for the funds to appear in your account.`,
    },
    REJECTED: {
      subject: `Payout request update: R${amount}`,
      body: `Your payout request for R${amount} could not be processed at this time. Please contact maphalle@freedomwheels.online for assistance.`,
    },
  }

  const msg = statusMessages[status] || {
    subject: `Payout update: R${amount}`,
    body: `Your payout request status is now: ${status}.`,
  }

  const html = `
<!doctype html>
<html>
<head><meta charset="utf-8"><title>${msg.subject}</title></head>
<body style="font-family: -apple-system, system-ui, sans-serif; max-width: 500px; margin: 2rem auto; padding: 1rem; color: #1f2937;">
  <div style="text-align: center; margin-bottom: 2rem;">
    <div style="display: inline-block; width: 40px; height: 40px; background: #059669; color: white; font-weight: bold; border-radius: 6px; line-height: 40px;">FW</div>
    <h1 style="font-size: 1.25rem; margin: 1rem 0 0;">${msg.subject}</h1>
  </div>
  <p>${greeting},</p>
  <p>${msg.body}</p>
  <p>Amount: <strong>R${amount}</strong></p>
  <p style="text-align: center; margin: 2rem 0;">
    <a href="${BASE_URL}/member" style="display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px;">View your dashboard</a>
  </p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0;">
  <p style="color: #9ca3af; font-size: 0.75rem;">Freedom Wheels · South Africa</p>
</body>
</html>`

  const text = `${msg.subject}

${greeting},

${msg.body}

Amount: R${amount}

View your dashboard: ${BASE_URL}/member

Freedom Wheels · South Africa`

  const result = await sendEmail({
    to: email,
    subject: msg.subject,
    html,
    text,
  })

  return { ok: result.ok }
}

// ============================================================================
// BATCH SENDERS — used by admin operations
// ============================================================================

// Send distribution notifications to all members who received a distribution this month
export async function sendDistributionNotifications(month: string): Promise<{ sent: number; failed: number; devMode: boolean }> {
  const distributions = await db.revenueShareDistribution.findMany({
    where: {
      pool: { month },
    },
    include: {
      user: { select: { email: true, name: true } },
      pool: { select: { totalRevenueCents: true } },
    },
  })

  let sent = 0
  let failed = 0
  let devMode = false

  for (const d of distributions) {
    const result = await sendDistributionNotificationEmail(
      d.user.email,
      d.user.name,
      month,
      d.amountCents,
      d.pool.totalRevenueCents
    )
    if (result.ok) {
      sent++
      devMode = devMode || (await import('@/lib/email')).isDevMode()
    } else {
      failed++
    }
  }

  return { sent, failed, devMode }
}

// Re-exported for testing
export function isDevMode(): boolean {
  return !isEmailEnabled()
}

function formatMonth(month: string): string {
  const [year, monthNum] = month.split('-')
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
  return date.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
}
