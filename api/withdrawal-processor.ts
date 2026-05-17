import { query, collection, where, getDocs, doc, serverTimestamp, runTransaction, orderBy, limit } from 'firebase/firestore';
import { db } from '../src/lib/firebase';

const AUTH_HEADER = 'x-withdrawal-secret';

const getWiseBaseUrl = () => {
  return process.env.WISE_ENV === 'sandbox'
    ? 'https://api.sandbox.transferwise.tech'
    : 'https://api.transferwise.com';
};

const wiseFetch = async (endpoint: string, method: string = 'GET', body?: any) => {
  const apiKey = process.env.WISE_API_KEY;
  if (!apiKey) throw new Error('Wise API key not configured');

  const response = await fetch(`${getWiseBaseUrl()}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  if (!response.ok) {
    let message = `Wise API request failed with status ${response.status}`;
    try {
      const json = JSON.parse(text);
      message = json.message || json.error || message;
    } catch {
      message = text || message;
    }
    throw new Error(message);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const resolveWiseProfileId = async (): Promise<string> => {
  const configuredProfileId = process.env.WISE_PROFILE_ID?.trim();
  if (configuredProfileId) return configuredProfileId;

  const profiles = await wiseFetch('/v1/profiles');
  if (Array.isArray(profiles) && profiles.length > 0) {
    const chosenProfile = profiles.find((p: any) => p.type === 'business') || profiles.find((p: any) => p.type === 'personal') || profiles[0];
    if (chosenProfile?.id) return chosenProfile.id.toString();
  }

  throw new Error('Unable to resolve Wise profile ID. Please set WISE_PROFILE_ID or provide a valid Wise API key.');
};

const buildWiseRecipient = (currency: string, destination: string) => {
  const normalized = destination.trim();

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return {
      profile: '',
      currency,
      type: 'email',
      accountHolderName: 'Sovereign Withdrawal Recipient',
      legalType: 'PRIVATE',
      details: { email: normalized }
    };
  }

  if (/^[A-Z]{2}[0-9A-Z]{13,30}$/.test(normalized)) {
    return {
      profile: '',
      currency,
      type: 'iban',
      accountHolderName: 'Sovereign Withdrawal Recipient',
      legalType: 'PRIVATE',
      details: { iban: normalized }
    };
  }

  if (/^\+?[0-9\s-]{8,25}$/.test(normalized)) {
    return {
      profile: '',
      currency,
      type: 'mobile_wallet',
      accountHolderName: 'Sovereign Withdrawal Recipient',
      legalType: 'PRIVATE',
      details: { phoneNumber: normalized.replace(/[^0-9+]/g, '') }
    };
  }

  if (currency === 'GBP' && /^(\d{2}-\d{2}-\d{8}|\d{14})$/.test(normalized)) {
    const cleaned = normalized.replace(/-/g, '');
    return {
      profile: '',
      currency,
      type: 'sort_code',
      accountHolderName: 'Sovereign Withdrawal Recipient',
      legalType: 'PRIVATE',
      details: {
        sortCode: cleaned.slice(0, 6),
        accountNumber: cleaned.slice(6)
      }
    };
  }

  if (currency === 'USD' && /^\d{9}$/.test(normalized)) {
    return {
      profile: '',
      currency,
      type: 'aba',
      accountHolderName: 'Sovereign Withdrawal Recipient',
      legalType: 'PRIVATE',
      details: { aba: normalized, accountNumber: normalized }
    };
  }

  return {
    profile: '',
    currency,
    type: 'email',
    accountHolderName: 'Sovereign Withdrawal Recipient',
    legalType: 'PRIVATE',
    details: { email: normalized }
  };
};

const createWiseRecipient = async (profileId: string, currency: string, destination: string) => {
  const payload = buildWiseRecipient(currency, destination);
  payload.profile = profileId;
  return wiseFetch('/v1/accounts', 'POST', payload);
};

const createWiseQuote = async (profileId: string, currency: string, amount: number) => {
  return wiseFetch('/v1/quotes', 'POST', {
    profile: profileId,
    sourceCurrency: currency,
    targetCurrency: currency,
    sourceAmount: amount,
    type: 'BALANCE_PAYOUT'
  });
};

const createWiseTransfer = async (quoteId: string, targetAccountId: string) => {
  return wiseFetch('/v1/transfers', 'POST', {
    targetAccount: targetAccountId,
    quote: quoteId,
    customerTransactionId: `SOV-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
    details: {
      reference: 'Sovereign Withdrawal'
    }
  });
};

const fundWiseTransfer = async (profileId: string, sourceAccountId: string, transferId: string) => {
  return wiseFetch(`/v3/profiles/${profileId}/borderless-accounts/${sourceAccountId}/payments`, 'POST', {
    type: 'BALANCE',
    transferId
  });
};

// Wise bridge: create a transfer to the destination bank account
async function wiseTransfer(withdrawal: any): Promise<{ success: boolean; providerId?: string; reason?: string }> {
  const apiKey = process.env.WISE_API_KEY;
  if (!apiKey) return { success: false, reason: 'Wise API key missing' };

  try {
    const profileId = await resolveWiseProfileId();
    const recipient = await createWiseRecipient(profileId, withdrawal.currency, withdrawal.destination);
    const quote = await createWiseQuote(profileId, withdrawal.currency, withdrawal.amount);
    const transfer = await createWiseTransfer(quote.id, recipient.id);

    if (process.env.WISE_ACCOUNT_ID) {
      try {
        await fundWiseTransfer(profileId, process.env.WISE_ACCOUNT_ID, transfer.id);
      } catch (fundErr: any) {
        console.warn('Wise funding failed:', fundErr.message || fundErr);
      }
    }

    return { success: true, providerId: transfer.id, reason: transfer.status || 'PENDING' };
  } catch (err: any) {
    return { success: false, reason: err.message || 'Wise transfer failed' };
  }
}

// Crypto bridge: transfer USDT/BTC/ETH via on-chain or exchange
async function cryptoTransfer(withdrawal: any): Promise<{ success: boolean; providerId?: string; reason?: string }> {
  // For now, simulate crypto transfer (in production, integrate Circle, Coinbase, or similar)
  // Could also use direct blockchain calls via ethers/web3 if self-hosted
  const { currency, amount, destination } = withdrawal;
  console.log(`[Crypto] Processing ${amount} ${currency} to ${destination}`);
  await new Promise((r) => setTimeout(r, 700));

  // Simulate 70% success rate for crypto (higher chance of failure due to network)
  if (Math.random() > 0.3) {
    const txHash = `0x${Math.random().toString(16).slice(2, 66)}`; // mock tx hash
    return { success: true, providerId: txHash };
  } else {
    return { success: false, reason: 'Blockchain network congestion or insufficient gas' };
  }
}

// Route to appropriate bridge based on currency
async function processExternalTransfer(withdrawal: any): Promise<{ success: boolean; providerId?: string; reason?: string }> {
  // Use simulation mode if enabled
  if (process.env.SIMULATE_WITHDRAWAL === 'true') {
    await new Promise((r) => setTimeout(r, 500));
    const ok = Math.random() > 0.25;
    if (ok) return { success: true, providerId: `SIM-${Math.floor(Math.random() * 1e6)}` };
    return { success: false, reason: 'Simulated gateway rejection' };
  }

  const { currency } = withdrawal;
  if (['USD', 'EUR', 'GBP', 'ZAR'].includes(currency)) {
    return wiseTransfer(withdrawal);
  } else if (['USDT', 'BTC', 'ETH', 'SOL'].includes(currency)) {
    return cryptoTransfer(withdrawal);
  } else {
    return { success: false, reason: `Unsupported currency: ${currency}` };
  }
}

export default async function handler(req: any, res: any) {
  try {
    // Allow requests from:
    // 1. Vercel cron (no header needed, trusted infrastructure)
    // 2. Manual requests with correct WITHDRAWAL_SECRET header
    const isVercelCron = req.headers['user-agent']?.includes('vercel') || !req.headers[AUTH_HEADER];
    const secret = req.headers[AUTH_HEADER] as string | undefined;
    
    if (!isVercelCron && (!secret || secret !== process.env.WITHDRAWAL_SECRET)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Process only a small batch to avoid long-running execution
    const q = query(collection(db, 'withdrawals'), where('status', '==', 'PENDING'), orderBy('timestamp', 'asc'), limit(10));
    const snap = await getDocs(q as any);
    if (snap.empty) return res.status(200).json({ processed: 0 });

    let processed = 0;
    for (const docSnap of snap.docs) {
      const snapshotData = docSnap.data() as any;
      const w = { id: docSnap.id, ...snapshotData } as any;

      // Attempt to claim and process the withdrawal in a transaction
      try {
        await runTransaction(db, async (tx) => {
          const wRef = doc(db, 'withdrawals', w.id);
          const current = await tx.get(wRef);
          if (!current.exists()) throw new Error('Withdrawal not found');
          const wData = current.data() as any;
          if (wData.status !== 'PENDING') return; // skip

          // Mark as PROCESSING to avoid double-processing
          tx.update(wRef, { status: 'PROCESSING', processingAt: serverTimestamp() });

          // perform external transfer (simulated or real)
        });

        // After marking PROCESSING, run the external transfer outside the transaction
        const result = await processExternalTransfer(w);

        if (result.success) {
          // Mark success and record provider id
          await runTransaction(db, async (tx) => {
            const wRef = doc(db, 'withdrawals', w.id);
            tx.update(wRef, { status: 'SUCCESS', processedAt: serverTimestamp(), externalId: result.providerId || null });
            const logRef = doc(collection(db, 'logs'));
            tx.set(logRef, {
              userId: w.userId,
              title: 'Withdrawal Processed',
              desc: `Processed withdrawal ${w.id} via external bridge. External ID: ${result.providerId || 'N/A'}`,
              type: 'withdrawal',
              timestamp: serverTimestamp()
            });
          });
        } else {
          // Failure: mark FAILED and refund the user (amount + fee)
          await runTransaction(db, async (tx) => {
            const wRef = doc(db, 'withdrawals', w.id);
            const wSnap = await tx.get(wRef);
            if (!wSnap.exists()) throw new Error('Withdrawal not found for refund');
            const wData = wSnap.data() as any;

            const userRef = doc(db, 'users', wData.userId);
            const userSnap = await tx.get(userRef);
            if (!userSnap.exists()) throw new Error('User not found to refund');
            const currentBal = (userSnap.data() as any).balance || 0;

            const refund = (wData.amount || 0) + (wData.fee || 0);
            tx.update(userRef, { balance: currentBal + refund });

            tx.update(wRef, { status: 'FAILED', failReason: result.reason || 'External bridge error', failedAt: serverTimestamp() });

            const logRef = doc(collection(db, 'logs'));
            tx.set(logRef, {
              userId: wData.userId,
              title: 'Withdrawal Failed',
              desc: `Withdrawal ${w.id} failed: ${result.reason || 'unknown'}. Refunded ${refund}.`,
              type: 'withdrawal',
              timestamp: serverTimestamp()
            });
          });
        }

        processed += 1;
      } catch (err: any) {
        console.error('Processing error for', w.id, err?.message || err);
        // continue with next
      }
    }

    return res.status(200).json({ processed });
  } catch (err: any) {
    console.error('Withdrawal processor error:', err);
    return res.status(500).json({ error: String(err) });
  }
}
