import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query, collection, where, getDocs, doc, serverTimestamp, runTransaction, orderBy, limit } from 'firebase/firestore';
import { db } from '../src/lib/firebase';

const AUTH_HEADER = 'x-withdrawal-secret';
const WISE_API_BASE = 'https://api.wise.com';
const CRYPT_API_BASE = 'https://api.cryptocompare.com';

// Wise bridge: create a transfer to the destination bank account
async function wiseTransfer(withdrawal: any): Promise<{ success: boolean; providerId?: string; reason?: string }> {
  const apiKey = process.env.WISE_API_KEY;
  const profileId = process.env.WISE_PROFILE_ID;
  if (!apiKey || !profileId) return { success: false, reason: 'Wise credentials not configured' };

  try {
    // For now, simulate Wise transfer (in production, call actual Wise API)
    // Real implementation would:
    // 1. POST /v1/quotes to get exchange rate
    // 2. POST /v1/transfers with quote ID
    // 3. GET /v1/transfers/{id} to check status
    // Using Wise SDK or direct REST API with proper auth headers
    console.log(`[Wise] Processing ${withdrawal.amount} ${withdrawal.currency} to ${withdrawal.destination}`);
    await new Promise((r) => setTimeout(r, 500));

    // Simulate 80% success rate for Wise
    if (Math.random() > 0.2) {
      const transferId = `TXN-WISE-${Math.floor(Math.random() * 1e6)}`;
      return { success: true, providerId: transferId };
    } else {
      return { success: false, reason: 'Wise gateway rate limit or insufficient funds' };
    }
  } catch (err: any) {
    return { success: false, reason: `Wise error: ${err.message}` };
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      const w = { id: docSnap.id, ...docSnap.data() } as any;

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
