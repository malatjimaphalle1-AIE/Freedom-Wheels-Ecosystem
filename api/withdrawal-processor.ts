import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import { query, collection, where, getDocs, doc, serverTimestamp, runTransaction, orderBy, limit } from 'firebase/firestore';
import { db } from '../src/lib/firebase';

// Simple secret header to protect the endpoint. Set WITHDRAWAL_SECRET in Vercel env.
const AUTH_HEADER = 'x-withdrawal-secret';

async function simulateExternalTransfer(withdrawal: any) {
  // If SIMULATE_WITHDRAWAL=true, randomly succeed/fail to emulate external provider
  if (process.env.SIMULATE_WITHDRAWAL === 'true') {
    await new Promise((r) => setTimeout(r, 800));
    const ok = Math.random() > 0.25; // 75% success
    if (ok) return { success: true, providerId: `SIM-${Math.floor(Math.random() * 1e6)}` };
    return { success: false, reason: 'Simulated gateway rejection' };
  }

  // TODO: implement real Wise / Crypto bridge here using provider API keys
  return { success: false, reason: 'No external bridge configured' };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const secret = req.headers[AUTH_HEADER] as string | undefined;
    if (!secret || secret !== process.env.WITHDRAWAL_SECRET) {
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
        const result = await simulateExternalTransfer(w);

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
