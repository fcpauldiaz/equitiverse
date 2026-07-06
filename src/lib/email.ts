import { Resend } from 'resend'

import type { CalloutWithPerformance, PortfolioSummary } from '#/lib/types'
import { formatPrice, formatReturnPct } from '#/lib/performance'

function getResend() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    return null
  }

  return new Resend(apiKey)
}

function getAppUrl() {
  return process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
}

export async function sendInviteEmail(input: {
  email: string
  token: string
}): Promise<boolean> {
  const resend = getResend()

  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping invite email')
    return false
  }

  const inviteUrl = `${getAppUrl()}/invite/${input.token}`

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'EquitiVerse <onboarding@resend.dev>',
    to: input.email,
    subject: 'You are invited to EquitiVerse',
    html: `
      <div style="font-family: Montserrat, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #131517; padding: 24px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">EquitiVerse</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0;">Your equity position universe</p>
        </div>
        <div style="padding: 32px 24px; background: #f0f1f4;">
          <p style="color: #4e4e4e;">You have been invited to access EquitiVerse — the EdgebyRS equity position tracker.</p>
          <a href="${inviteUrl}" style="display: inline-block; margin-top: 24px; padding: 14px 28px; background: linear-gradient(135deg, #0080ff 0%, #8f00ff 50%, #ffbe00 100%); color: #fff; text-decoration: none; border-radius: 50px; font-weight: 600;">Accept Invitation</a>
          <p style="color: #7c858a; font-size: 12px; margin-top: 24px;">This link expires in 7 days.</p>
        </div>
      </div>
    `,
  })

  return true
}

export async function sendDigestEmail(input: {
  email: string
  userId: string
  summary: PortfolioSummary
  callouts: CalloutWithPerformance[]
  frequency: 'daily' | 'weekly' | 'manual'
}): Promise<boolean> {
  const resend = getResend()

  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping digest email')
    return false
  }

  const dashboardUrl = `${getAppUrl()}/dashboard`
  const unsubscribeUrl = `${getAppUrl()}/settings?unsubscribe=1`

  const rows = input.callouts
    .map(
      (c) => `
      <tr>
        <td style="padding: 8px; color: #0080ff; font-weight: 600;">${c.ticker}</td>
        <td style="padding: 8px;">${formatPrice(c.entryPrice)}</td>
        <td style="padding: 8px;">${c.status === 'open' ? formatPrice(c.currentPrice) : formatPrice(c.exitPrice)}</td>
        <td style="padding: 8px; color: ${(c.returnPct ?? 0) >= 0 ? '#48ac66' : '#dd0000'};">${formatReturnPct(c.returnPct)}</td>
        <td style="padding: 8px;">${c.status}</td>
      </tr>
    `,
    )
    .join('')

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'EquitiVerse <onboarding@resend.dev>',
    to: input.email,
    subject: `EquitiVerse — ${input.frequency === 'daily' ? 'Daily' : 'Weekly'} Digest`,
    html: `
      <div style="font-family: Montserrat, Arial, sans-serif; max-width: 640px; margin: 0 auto;">
        <div style="background: #131517; padding: 24px;">
          <h1 style="color: #fff; margin: 0;">EquitiVerse Digest</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0;">Your equity position universe</p>
        </div>
        <div style="padding: 24px; background: #f0f1f4;">
          <p style="color: #4e4e4e;">
            Open: ${input.summary.openCount} · Closed: ${input.summary.closedCount} ·
            Avg return: ${formatReturnPct(input.summary.avgReturnPct)}
          </p>
          <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; margin-top: 16px;">
            <thead>
              <tr style="background: #131517; color: #fff;">
                <th style="padding: 10px; text-align: left;">Ticker</th>
                <th style="padding: 10px; text-align: left;">Entry</th>
                <th style="padding: 10px; text-align: left;">Current/Exit</th>
                <th style="padding: 10px; text-align: left;">Return</th>
                <th style="padding: 10px; text-align: left;">Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="color: #7c858a; font-size: 11px; margin-top: 20px;">
            Prices are delayed (~15 min) and for informational purposes only. Not financial advice.
          </p>
          <a href="${dashboardUrl}" style="display: inline-block; margin-top: 16px; color: #0080ff;">Open EquitiVerse →</a>
          <p style="margin-top: 24px; font-size: 11px;">
            <a href="${unsubscribeUrl}" style="color: #7c858a;">Unsubscribe from digests</a>
          </p>
        </div>
      </div>
    `,
  })

  return true
}

export async function sendDigestBatch(input: {
  recipients: Array<{ email: string; userId: string }>
  summary: PortfolioSummary
  callouts: CalloutWithPerformance[]
  frequency: 'daily' | 'weekly' | 'manual'
}): Promise<number> {
  let sent = 0

  for (const recipient of input.recipients) {
    const ok = await sendDigestEmail({
      email: recipient.email,
      userId: recipient.userId,
      summary: input.summary,
      callouts: input.callouts,
      frequency: input.frequency,
    })

    if (ok) sent += 1
  }

  return sent
}
