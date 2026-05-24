import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  runTransaction,
  serverTimestamp,
  Query,
} from 'firebase/firestore';

// Initialize Firebase (replace with your config)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface WithdrawalData {
  id: string;
  userId: string;
  amount: number;
  fee: number;
  currency: string;
  destination: string;
  method: 'bank' | 'crypto' | 'email';
  status: string;
  attemptCount?: number;
  externalId?: string;
}

interface TransferResult {
  success: boolean;
  providerId?: string;
  reason?: string;
}

// Mock implementation of external transfer - replace with actual Wise/payment provider integration
async function processExternalTransfer(withdrawal: WithdrawalData): Promise<TransferResult> {
  try {
    // TODO: Replace with actual Wise API or payment provider integration
    console.log(`[EXTERNAL_TRANSFER] Processing ${withdrawal.method} transfer for ${withdrawal.id}`);

    // Simulate API call - replace with actual provider
    return {
      success: true,
      providerId: `ext_${Date.now()}`,
      reason: 'PENDING',
    };
  } catch (err: any) {
    console.error('[EXTERNAL_TRANSFER] Error:', err);
    return {
      success: false,
      reason: err.message || 'External transfer failed',
    };
  }
}

export default async function handler(req: any, res: any) {
  try {
    // Allow requests from:
    // 1. Vercel cron (no header needed, trusted infrastructure)
    // 2. Manual requests with correct WITHDRAWAL_SECRET header
    const isVercelCron =
      req.headers['user-agent']?.includes('vercel') || !req.headers['x-withdrawal-secret'];
    const secret = req.headers['x-withdrawal-secret'] as string | undefined;

    if (!isVercelCron && (!secret || secret !== process.env.WITHDRAWAL_SECRET)) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing withdrawal secret' });
    }

    // Log the cron job execution
    console.log(`[WITHDRAWAL_PROCESSOR] Starting batch processing at ${new Date().toISOString()}`);

    // Process only a small batch to avoid long-running execution
    const q = query(
      collection(db, 'withdrawals'),
      where('status', '==', 'PENDING'),
      orderBy('createdAt', 'asc'),
      limit(10)
    ) as Query;

    let snap = await getDocs(q);

    // Backward compatibility: older records may not have createdAt and used timestamp.
    // If the primary query returns no rows, attempt the legacy field.
    if (snap.empty) {
      const legacyQuery = query(
        collection(db, 'withdrawals'),
        where('status', '==', 'PENDING'),
        orderBy('timestamp', 'asc'),
        limit(10)
      ) as Query;
      snap = await getDocs(legacyQuery);
    }

    if (snap.empty) {
      console.log('[WITHDRAWAL_PROCESSOR] No pending withdrawals to process');
      return res.status(200).json({ processed: 0, message: 'No pending withdrawals' });
    }

    console.log(`[WITHDRAWAL_PROCESSOR] Found ${snap.docs.length} pending withdrawals to process`);

    let processed = 0;
    let failed = 0;
    const results: any[] = [];

    for (const docSnap of snap.docs) {
      const snapshotData = docSnap.data() as any;
      const w = { id: docSnap.id, ...snapshotData } as WithdrawalData;

      // Attempt to claim and process the withdrawal in a transaction
      try {
        console.log(`[WITHDRAWAL_PROCESSOR] Processing withdrawal ${w.id} for user ${w.userId}`);

        // Step 1: Mark withdrawal as PROCESSING (atomic transaction)
        let processingSuccess = false;

        await runTransaction(db, async (tx) => {
          const wRef = doc(db, 'withdrawals', w.id);
          const current = await tx.get(wRef);

          if (!current.exists()) {
            throw new Error('Withdrawal document not found');
          }

          const wData = current.data() as any;

          // Skip if status has changed (another process claimed it)
          if (wData.status !== 'PENDING') {
            console.log(`[WITHDRAWAL_PROCESSOR] Skipping ${w.id} - status changed to ${wData.status}`);
            return;
          }

          // Mark as PROCESSING to avoid double-processing
          tx.update(wRef, {
            status: 'PROCESSING',
            processingAt: serverTimestamp(),
            attemptCount: (wData.attemptCount || 0) + 1,
          });

          processingSuccess = true;
        });

        if (!processingSuccess) {
          console.log(`[WITHDRAWAL_PROCESSOR] Skipped ${w.id} - already being processed`);
          continue;
        }

        // Step 2: Execute external transfer (outside transaction to avoid timeouts)
        console.log(`[WITHDRAWAL_PROCESSOR] Executing external transfer for ${w.id}`);
        const result = await processExternalTransfer(w);

        // Step 3: Update withdrawal status based on result
        if (result.success) {
          console.log(
            `[WITHDRAWAL_PROCESSOR] Transfer successful for ${w.id}, external ID: ${result.providerId}`
          );

          // Mark success and record provider id
          await runTransaction(db, async (tx) => {
            const wRef = doc(db, 'withdrawals', w.id);

            tx.update(wRef, {
              status: 'SUCCESS',
              processedAt: serverTimestamp(),
              externalId: result.providerId || null,
              externalStatus: result.reason || 'PENDING',
            });

            // Create audit log entry
            const logRef = doc(collection(db, 'logs'));
            tx.set(logRef, {
              userId: w.userId,
              title: 'Withdrawal Processed Successfully',
              desc: `Withdrawal ${w.id} successfully processed via external bridge. Amount: ${w.amount} ${w.currency}. External ID: ${result.providerId || 'N/A'}. External Status: ${result.reason || 'PENDING'}`,
              type: 'withdrawal',
              withdrawalId: w.id,
              status: 'SUCCESS',
              timestamp: serverTimestamp(),
            });
          });

          processed += 1;
          results.push({
            id: w.id,
            status: 'SUCCESS',
            amount: w.amount,
            currency: w.currency,
            externalId: result.providerId,
          });
        } else {
          console.error(`[WITHDRAWAL_PROCESSOR] Transfer failed for ${w.id}: ${result.reason}`);

          // Failure: mark FAILED and refund the user (amount + fee)
          await runTransaction(db, async (tx) => {
            const wRef = doc(db, 'withdrawals', w.id);
            const wSnap = await tx.get(wRef);

            if (!wSnap.exists()) {
              throw new Error('Withdrawal not found for refund');
            }

            const wData = wSnap.data() as any;

            // Get user reference
            const userRef = doc(db, 'users', wData.userId);
            const userSnap = await tx.get(userRef);

            if (!userSnap.exists()) {
              throw new Error('User not found to refund');
            }

            const currentBal = (userSnap.data() as any).balance || 0;

            // Calculate refund (amount + fee)
            const refund = (wData.amount || 0) + (wData.fee || 0);

            // Update user balance
            tx.update(userRef, {
              balance: currentBal + refund,
              lastRefundAt: serverTimestamp(),
            });

            // Mark withdrawal as FAILED
            tx.update(wRef, {
              status: 'FAILED',
              failReason: result.reason || 'External bridge error',
              failedAt: serverTimestamp(),
              refundAmount: refund,
            });

            // Create audit log entries
            const logRef = doc(collection(db, 'logs'));
            tx.set(logRef, {
              userId: wData.userId,
              title: 'Withdrawal Failed',
              desc: `Withdrawal ${w.id} failed: ${result.reason || 'unknown'}. Amount: ${wData.amount} ${wData.currency}. Refunded: ${refund}`,
              type: 'withdrawal',
              withdrawalId: w.id,
              status: 'FAILED',
              failReason: result.reason,
              timestamp: serverTimestamp(),
            });
          });

          failed += 1;
          results.push({
            id: w.id,
            status: 'FAILED',
            reason: result.reason,
            amount: w.amount,
            currency: w.currency,
            refunded: true,
          });
        }
      } catch (err: any) {
        console.error(`[WITHDRAWAL_PROCESSOR] Error processing withdrawal ${w.id}:`, err?.message || err);

        // Try to mark as ERROR state for manual review
        try {
          await runTransaction(db, async (tx) => {
            const wRef = doc(db, 'withdrawals', w.id);
            const wSnap = await tx.get(wRef);

            if (wSnap.exists() && wSnap.data().status === 'PROCESSING') {
              tx.update(wRef, {
                status: 'ERROR',
                errorReason: err.message || String(err),
                errorAt: serverTimestamp(),
              });
            }
          });
        } catch (updateErr) {
          console.error(`[WITHDRAWAL_PROCESSOR] Failed to mark ${w.id} as ERROR:`, updateErr);
        }

        failed += 1;
      }
    }

    const summary = {
      processed,
      failed,
      total: snap.docs.length,
      results,
      timestamp: new Date().toISOString(),
    };

    console.log(`[WITHDRAWAL_PROCESSOR] Batch complete: ${JSON.stringify(summary)}`);

    return res.status(200).json(summary);
  } catch (err: any) {
    console.error('[WITHDRAWAL_PROCESSOR] Fatal error:', err);
    return res.status(500).json({
      error: 'Withdrawal processor error',
      message: err.message || String(err),
      timestamp: new Date().toISOString(),
    });
  }
}
