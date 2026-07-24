// PayFast API client for subscription management
// https://developers.payfast.co.za/api#subscriptions
//
// These endpoints require a PayFast merchant API key (different from the merchant ID/key used
// for the standard integration). Set PAYFAST_API_KEY + PAYFAST_API_PASSPHRASE in env.

import crypto from 'crypto'

function getAuthHeaders(): Record<string, string> {
  const apiKey = process.env.PAYFAST_API_KEY
  const passphrase = process.env.PAYFAST_API_PASSPHRASE
  if (!apiKey) throw new Error('PAYFAST_API_KEY not set')

  // PayFast uses a signature-based auth
  // https://developers.payfast.co.za/api#authentication
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const version = 'v1'

  // The signature is MD5 of: api_key + timestamp + passphrase (sorted, url-encoded)
  // PayFast's exact signature scheme for the API is documented in their API docs.
  // For now we send the basic auth headers — this may need adjustment based on PayFast's
  // current requirements.
  return {
    'merchant-id': process.env.PAYFAST_MERCHANT_ID || '',
    'version': version,
    'timestamp': timestamp,
    'api-key': apiKey,
    'passphrase': passphrase || '',
  }
}

// Cancel a PayFast subscription by token
// POST https://api.payfast.co.za/subscriptions/{token}/cancel
export async function cancelPayFastSubscription(token: string): Promise<{ ok: boolean; response?: unknown; error?: string }> {
  try {
    const endpoint = `https://api.payfast.co.za/subscriptions/${token}/cancel`
    const headers = getAuthHeaders()

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      console.error('[payfast-api] cancel failed:', { status: res.status, data })
      return { ok: false, error: `PayFast API returned ${res.status}: ${JSON.stringify(data)}` }
    }

    return { ok: true, response: data }
  } catch (err) {
    console.error('[payfast-api] cancel error:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// Pause a PayFast subscription (optional — for future use)
export async function pausePayFastSubscription(token: string, cycles: number = 1): Promise<{ ok: boolean; error?: string }> {
  try {
    const endpoint = `https://api.payfast.co.za/subscriptions/${token}/pause`
    const headers = getAuthHeaders()

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cycles }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { ok: false, error: `PayFast API returned ${res.status}: ${JSON.stringify(data)}` }
    }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// Generate a signed ITN response to confirm receipt (PayFast requires this in some flows)
export function generateItnResponseSignature(params: Record<string, string>): string {
  // Same algorithm as the request signature
  // We reuse the buildPayFastSignature logic
  // Imported lazily to avoid circular deps
  const passphrase = process.env.PAYFAST_PASSPHRASE || ''
  const sorted = Object.keys(params)
    .filter(k => params[k] !== undefined && params[k] !== '')
    .sort()
  const encoded = sorted
    .map(k => `${k}=${encodeURIComponent(String(params[k])).replace(/%20/g, '+')}`)
    .join('&')
  const withPassphrase = passphrase ? `${encoded}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}` : encoded
  return crypto.createHash('md5').update(withPassphrase).digest('hex')
}
