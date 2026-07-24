// PayFast integration helpers
// Docs: https://developers.payfast.co.za/api#process
//
// ENV VARS REQUIRED (set in .env.local or production env):
//   PAYFAST_MERCHANT_ID     — live merchant ID from dashboard
//   PAYFAST_MERCHANT_KEY    — live merchant key
//   PAYFAST_PASSPHRASE      — must match the passphrase set in dashboard
//   PAYFAST_SANDBOX         — "false" for production
//   NEXT_PUBLIC_BASE_URL    — e.g. https://www.freedomwheels.online

export const PAYFAST_ENDPOINT = process.env.PAYFAST_SANDBOX === 'true'
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process'

// PayFast subscription tokenisation endpoint (for cancelling recurring billing)
// https://developers.payfast.co.za/api#cancel-subscription
export const PAYFAST_CANCEL_ENDPOINT = 'https://api.payfast.co.za/subscriptions/{token}/cancel'

// PayFast ad-hoc payment endpoint (for charging a tokenised subscription outside the regular cycle)
export const PAYFAST_ADHOC_ENDPOINT = 'https://api.payfast.co.za/subscriptions/{token}/adhoc'

export const PF_TIER_PRICES = {
  STARTER: 9900,   // R99.00 — in cents
  PRO: 29900,      // R299.00
  ELITE: 49900,    // R499.00
} as const

export const PF_TIER_NAMES = {
  STARTER: 'Starter',
  PRO: 'Pro',
  ELITE: 'Elite',
} as const

export type Tier = keyof typeof PF_TIER_PRICES

// Build the parameter string PayFast expects, in the correct order, with signature
// Reference: https://developers.payfast.co.za/api#process-payment
export function buildPayFastSignature(params: Record<string, string | number | undefined>): string {
  const passphrase = process.env.PAYFAST_PASSPHRASE || ''

  // 1. Sort keys alphabetically, skip empty values
  const sorted = Object.keys(params)
    .filter(k => params[k] !== undefined && params[k] !== '' && params[k] !== null)
    .sort()

  // 2. URL-encode values per PayFast rules
  const encoded = sorted
    .map(k => `${k}=${encodeURIComponent(String(params[k])).replace(/%20/g, '+')}`)
    .join('&')

  // 3. Append passphrase
  const withPassphrase = passphrase ? `${encoded}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}` : encoded

  // 4. MD5 hash
  // We use a runtime md5 implementation to avoid Node crypto in edge
  return md5(withPassphrase)
}

// Minimal MD5 implementation (RFC 1321) — required for PayFast signature
// This is a well-known, dependency-free implementation.
function md5(input: string): string {
  function toWords(s: string): number[] {
    const n = s.length
    const words: number[] = []
    for (let i = 0; i < n * 8; i += 8) {
      words[i >> 5] = (words[i >> 5] || 0) | (s.charCodeAt(i / 8) & 0xff) << (i % 32)
    }
    return words
  }

  function fromWords(words: number[]): string {
    let out = ''
    for (let i = 0; i < words.length * 32; i += 8) {
      out += String.fromCharCode((words[i >> 5] >>> (i % 32)) & 0xff)
    }
    return out
  }

  function add32(a: number, b: number): number {
    return (a + b) & 0xffffffff
  }

  function cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    a = add32(add32(a, q), add32(x, t))
    return add32((a << s) | (a >>> (32 - s)), b)
  }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & c) | (~b & d), a, b, x, s, t)
  }

  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & d) | (c & ~d), a, b, x, s, t)
  }

  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn(b ^ c ^ d, a, b, x, s, t)
  }

  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn(c ^ (b | ~d), a, b, x, s, t)
  }

  function md5cycle(x: number[], k: number[]): void {
    let [a, b, c, d] = [1732584193, -271733879, -1732584194, 271733878]

    a = ff(a, b, c, d, k[0]! | 0, 7, -680876936); d = ff(d, a, b, c, k[1]! | 0, 12, -389564586); c = ff(c, d, a, b, k[2]! | 0, 17, 606105819); b = ff(b, c, d, a, k[3]! | 0, 22, -1044525330)
    a = ff(a, b, c, d, k[4]! | 0, 7, -176418897); d = ff(d, a, b, c, k[5]! | 0, 12, 1200080426); c = ff(c, d, a, b, k[6]! | 0, 17, -1473231341); b = ff(b, c, d, a, k[7]! | 0, 22, -45705983)
    a = ff(a, b, c, d, k[8]! | 0, 7, 1770035416); d = ff(d, a, b, c, k[9]! | 0, 12, -1958414417); c = ff(c, d, a, b, k[10]! | 0, 17, -42063); b = ff(b, c, d, a, k[11]! | 0, 22, -1990404162)
    a = ff(a, b, c, d, k[12]! | 0, 7, 1804603682); d = ff(d, a, b, c, k[13]! | 0, 12, -40341101); c = ff(c, d, a, b, k[14]! | 0, 17, -1502002290); b = ff(b, c, d, a, k[15]! | 0, 22, 1236535329)

    a = gg(a, b, c, d, k[1]! | 0, 5, -165796510); d = gg(d, a, b, c, k[6]! | 0, 9, -1069501632); c = gg(c, d, a, b, k[11]! | 0, 14, 643717713); b = gg(b, c, d, a, k[0]! | 0, 20, -373897302)
    a = gg(a, b, c, d, k[5]! | 0, 5, -701558691); d = gg(d, a, b, c, k[10]! | 0, 9, 38016083); c = gg(c, d, a, b, k[15]! | 0, 14, -660478335); b = gg(b, c, d, a, k[4]! | 0, 20, -405537848)
    a = gg(a, b, c, d, k[9]! | 0, 5, 568446438); d = gg(d, a, b, c, k[14]! | 0, 9, -1019803690); c = gg(c, d, a, b, k[3]! | 0, 14, -187363961); b = gg(b, c, d, a, k[8]! | 0, 20, 1163531501)
    a = gg(a, b, c, d, k[13]! | 0, 5, -1444681467); d = gg(d, a, b, c, k[2]! | 0, 9, -51403784); c = gg(c, d, a, b, k[7]! | 0, 14, 1735328473); b = gg(b, c, d, a, k[12]! | 0, 20, -1926607734)

    a = hh(a, b, c, d, k[5]! | 0, 4, -378558); d = hh(d, a, b, c, k[8]! | 0, 11, -2022574463); c = hh(c, d, a, b, k[11]! | 0, 16, 1839030562); b = hh(b, c, d, a, k[14]! | 0, 23, -35309556)
    a = hh(a, b, c, d, k[1]! | 0, 4, -1530992060); d = hh(d, a, b, c, k[4]! | 0, 11, 1272893353); c = hh(c, d, a, b, k[7]! | 0, 16, -155497632); b = hh(b, c, d, a, k[10]! | 0, 23, -1094730640)
    a = hh(a, b, c, d, k[13]! | 0, 4, 681279174); d = hh(d, a, b, c, k[0]! | 0, 11, -358537222); c = hh(c, d, a, b, k[3]! | 0, 16, -722521979); b = hh(b, c, d, a, k[6]! | 0, 23, 76029189)
    a = hh(a, b, c, d, k[9]! | 0, 4, -640364487); d = hh(d, a, b, c, k[12]! | 0, 11, -421815835); c = hh(c, d, a, b, k[15]! | 0, 16, 530742520); b = hh(b, c, d, a, k[2]! | 0, 23, -995338651)

    a = ii(a, b, c, d, k[0]! | 0, 6, -198630844); d = ii(d, a, b, c, k[7]! | 0, 10, 1126891415); c = ii(c, d, a, b, k[14]! | 0, 15, -1416354905); b = ii(b, c, d, a, k[5]! | 0, 21, -57434055)
    a = ii(a, b, c, d, k[12]! | 0, 6, 1700485571); d = ii(d, a, b, c, k[3]! | 0, 10, -1894986606); c = ii(c, d, a, b, k[10]! | 0, 15, -1051523); b = ii(b, c, d, a, k[1]! | 0, 21, -2054922799)
    a = ii(a, b, c, d, k[8]! | 0, 6, 1873313359); d = ii(d, a, b, c, k[15]! | 0, 10, -30611744); c = ii(c, d, a, b, k[6]! | 0, 15, -1560198380); b = ii(b, c, d, a, k[13]! | 0, 21, 1309151649)
    a = ii(a, b, c, d, k[4]! | 0, 6, -145523070); d = ii(d, a, b, c, k[11]! | 0, 10, -1120210379); c = ii(c, d, a, b, k[2]! | 0, 15, 718787259); b = ii(b, c, d, a, k[9]! | 0, 21, -343485551)

    x[0] = add32(a, x[0]!)
    x[1] = add32(b, x[1]!)
    x[2] = add32(c, x[2]!)
    x[3] = add32(d, x[3]!)
  }

  function md5blk(s: string): number[] {
    const md5blks: number[] = []
    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24)
    }
    return md5blks
  }

  let n = input.length
  let state = [1732584193, -271733879, -1732584194, 271733878]
  let i: number
  for (i = 0; i < n - 64; i += 64) {
    md5cycle(state, md5blk(input.substring(i, i + 64)))
  }
  input = input.substring(i)
  const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  for (i = 0; i < input.length; i++) {
    tail[i >> 2] |= input.charCodeAt(i) << ((i % 4) << 3)
  }
  tail[i >> 2] |= 0x80 << ((i % 4) << 3)
  if (i > 55) {
    md5cycle(state, tail)
    for (i = 0; i < 16; i++) tail[i] = 0
  }
  tail[14] = n * 8
  md5cycle(state, tail)
  return fromWords(state)
    .split('')
    .map(c => (c.charCodeAt(0) + 0x100).toString(16).slice(-2))
    .join('')
}

// Verify PayFast ITN (Instant Transaction Notification) signature
export function verifyPayFastItn(params: Record<string, string>): { valid: boolean; reason?: string } {
  const receivedSignature = params['signature']
  if (!receivedSignature) return { valid: false, reason: 'No signature in ITN payload' }

  // Strip signature from the params before recomputing
  const { signature: _omit, ...rest } = params
  const computed = buildPayFastSignature(rest)

  if (computed.toLowerCase() !== receivedSignature.toLowerCase()) {
    return { valid: false, reason: `Signature mismatch (computed=${computed}, received=${receivedSignature})` }
  }

  return { valid: true }
}
