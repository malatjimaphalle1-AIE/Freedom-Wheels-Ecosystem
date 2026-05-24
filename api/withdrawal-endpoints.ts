import express, { Request, Response, NextFunction } from 'express';
import {
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Query,
} from 'firebase/firestore';

interface WithdrawalRequest {
  amount: number;
  currency: string;
  destination: string;
  method: 'bank' | 'crypto' | 'email';
}

// Authentication middleware
export const verifyAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    // TODO: Replace with actual Firebase Admin SDK verification
    // const decodedToken = await admin.auth().verifyIdToken(token);
    // (req as any).user = { uid: decodedToken.uid };

    // For now, basic validation
    (req as any).user = { uid: 'user-id-from-token' };
    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// POST /api/wise/withdraw - Initiate withdrawal
export const withdrawalEndpoint = async (req: express.Request, res: express.Response, db: any) => {
  try {
    const { amount, currency, destination, method } = req.body as WithdrawalRequest;
    const userId = (req as any).user?.uid;

    console.log(`[WITHDRAWAL] New withdrawal request from user ${userId}: ${amount} ${currency}`);

    // ===== VALIDATION =====
    const validationErrors: Record<string, string> = {};

    // Validate amount
    const requestedAmount = Number(amount);
    if (!requestedAmount || Number.isNaN(requestedAmount) || requestedAmount <= 0) {
      validationErrors.amount = 'Invalid amount provided';
    } else if (requestedAmount < 10) {
      validationErrors.amount = 'Minimum withdrawal is $10';
    } else if (requestedAmount > 100000) {
      validationErrors.amount = 'Maximum withdrawal is $100,000';
    }

    // Validate currency
    const validCurrencies = ['USD', 'EUR', 'GBP', 'ZAR', 'BTC', 'ETH', 'USDT', 'SOL'];
    if (!currency || typeof currency !== 'string' || !validCurrencies.includes(currency)) {
      validationErrors.currency = `Invalid currency: ${currency}`;
    }

    // Validate destination
    if (!destination || typeof destination !== 'string' || destination.trim().length === 0) {
      validationErrors.destination = 'Destination is required';
    }

    // Validate method
    if (!method || !['bank', 'crypto', 'email'].includes(method)) {
      validationErrors.method = 'Invalid payment method';
    }

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // ===== BALANCE CHECK =====
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userBalance = userDoc.data()?.balance || 0;

    if (requestedAmount > userBalance) {
      return res.status(400).json({
        error: 'Insufficient balance',
        available: userBalance,
        requested: requestedAmount,
      });
    }

    // ===== DUPLICATE CHECK =====
    const pendingQuery = query(
      collection(db, 'withdrawals'),
      where('userId', '==', userId),
      where('status', '==', 'PENDING')
    ) as Query;
    const pendingDocs = await getDocs(pendingQuery);

    if (pendingDocs.size > 0) {
      return res.status(400).json({
        error: 'You have a pending withdrawal. Please wait for it to complete.',
      });
    }

    // ===== RATE LIMITING =====
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyWithdrawalsQuery = query(
      collection(db, 'withdrawals'),
      where('userId', '==', userId),
      where('status', 'in', ['SUCCESS', 'PROCESSING']),
      where('createdAt', '>=', today)
    ) as Query;
    const dailyWithdrawals = await getDocs(dailyWithdrawalsQuery);

    if (dailyWithdrawals.size >= 5) {
      return res.status(429).json({
        error: 'Daily withdrawal limit exceeded (max 5 per day)',
      });
    }

    // ===== CALCULATE FEE =====
    const fee =
      method === 'crypto'
        ? parseFloat((requestedAmount * 0.005).toFixed(2))
        : parseFloat((requestedAmount * 0.02).toFixed(2));

    const totalDebit = requestedAmount + fee;

    // ===== CREATE WITHDRAWAL REQUEST =====
    const withdrawalId = `wd_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const withdrawalDocRef = doc(db, 'withdrawals', withdrawalId);

    const withdrawalData = {
      id: withdrawalId,
      userId,
      amount: requestedAmount,
      fee,
      totalDebit,
      currency,
      destination: destination.trim(),
      method,
      status: 'PENDING',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      attemptCount: 0,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    };

    // Save withdrawal document
    await setDoc(withdrawalDocRef, withdrawalData);

    // Deduct from user balance (we'll refund if it fails)
    await updateDoc(userDocRef, {
      balance: userBalance - totalDebit,
      lastWithdrawalAt: serverTimestamp(),
    });

    // Create audit log
    const logRef = doc(collection(db, 'logs'));
    await setDoc(logRef, {
      userId,
      title: 'Withdrawal Initiated',
      desc: `Withdrawal initiated: ${requestedAmount} ${currency} to ${destination}. Fee: ${fee}`,
      type: 'withdrawal',
      withdrawalId,
      status: 'INITIATED',
      timestamp: serverTimestamp(),
    });

    console.log(`[WITHDRAWAL] Successfully created withdrawal ${withdrawalId}`);

    return res.status(201).json({
      id: withdrawalId,
      status: 'PENDING',
      amount: requestedAmount,
      fee,
      totalDebit,
      currency,
      message: 'Withdrawal initiated. You will receive your funds within 1-3 business days.',
    });
  } catch (err: any) {
    console.error('[WITHDRAWAL] Error:', err);
    return res.status(500).json({
      error: 'Failed to initiate withdrawal',
      message: err.message || String(err),
    });
  }
};

// GET /api/withdrawals/history - Get user's withdrawal history
export const withdrawalHistoryEndpoint = async (req: express.Request, res: express.Response, db: any) => {
  try {
    const userId = (req as any).user?.uid;

    console.log(`[WITHDRAWAL_HISTORY] Fetching history for user ${userId}`);

    const withdrawalsQuery = query(
      collection(db, 'withdrawals'),
      where('userId', '==', userId)
    ) as Query;

    const snapshot = await getDocs(withdrawalsQuery);
    const withdrawals = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(withdrawals);
  } catch (err: any) {
    console.error('[WITHDRAWAL_HISTORY] Error:', err);
    return res.status(500).json({
      error: 'Failed to fetch withdrawal history',
      message: err.message || String(err),
    });
  }
};
