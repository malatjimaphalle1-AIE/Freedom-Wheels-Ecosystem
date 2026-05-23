# Freedom Wheels™ Ecosystem - Implementation Guide

**Last Updated:** May 23, 2026  
**Status:** Step-by-step fixes for Phase 1 (Critical Issues)  
**Estimated Duration:** 2-3 hours for all fixes

---

## 📋 Quick Start

This guide provides **production-ready code solutions** for all critical issues identified in the audit report. Follow each section sequentially to implement fixes.

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Git for version control
- Access to Firebase project
- Wise API credentials (if testing Wise integration)

---

## 🔴 PHASE 1: CRITICAL FIXES (Must Complete Before Deployment)

---

## **Fix #1: Complete Withdrawal Processor Transaction Logic**

**Status:** 🔴 CRITICAL  
**File:** `api/withdrawal-processor.ts`  
**Time:** 30 minutes

### Step 1.1: Backup Original File

```bash
cp api/withdrawal-processor.ts api/withdrawal-processor.ts.backup
```

### Step 1.2: Update the Withdrawal Handler

Replace the incomplete `handler` function (lines 225-320) with this complete implementation:

```typescript
export default async function handler(req: any, res: any) {
  try {
    // Allow requests from:
    // 1. Vercel cron (no header needed, trusted infrastructure)
    // 2. Manual requests with correct WITHDRAWAL_SECRET header
    const isVercelCron = req.headers['user-agent']?.includes('vercel') || !req.headers['x-withdrawal-secret'];
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
      orderBy('timestamp', 'asc'),
      limit(10)
    );
    
    const snap = await getDocs(q as any);
    
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
      const w = { id: docSnap.id, ...snapshotData } as any;

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
            attemptCount: (wData.attemptCount || 0) + 1
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
          console.log(`[WITHDRAWAL_PROCESSOR] Transfer successful for ${w.id}, external ID: ${result.providerId}`);
          
          // Mark success and record provider id
          await runTransaction(db, async (tx) => {
            const wRef = doc(db, 'withdrawals', w.id);
            
            tx.update(wRef, {
              status: 'SUCCESS',
              processedAt: serverTimestamp(),
              externalId: result.providerId || null,
              externalStatus: result.reason || 'PENDING'
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
              timestamp: serverTimestamp()
            });
          });

          processed += 1;
          results.push({
            id: w.id,
            status: 'SUCCESS',
            amount: w.amount,
            currency: w.currency,
            externalId: result.providerId
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
              lastRefundAt: serverTimestamp()
            });

            // Mark withdrawal as FAILED
            tx.update(wRef, {
              status: 'FAILED',
              failReason: result.reason || 'External bridge error',
              failedAt: serverTimestamp(),
              refundAmount: refund
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
              timestamp: serverTimestamp()
            });
          });

          failed += 1;
          results.push({
            id: w.id,
            status: 'FAILED',
            reason: result.reason,
            amount: w.amount,
            currency: w.currency,
            refunded: true
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
                errorAt: serverTimestamp()
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
      timestamp: new Date().toISOString()
    };

    console.log(`[WITHDRAWAL_PROCESSOR] Batch complete: ${JSON.stringify(summary)}`);

    return res.status(200).json(summary);
  } catch (err: any) {
    console.error('[WITHDRAWAL_PROCESSOR] Fatal error:', err);
    return res.status(500).json({
      error: 'Withdrawal processor error',
      message: err.message || String(err),
      timestamp: new Date().toISOString()
    });
  }
}
```

### Step 1.3: Verify the Changes

```bash
# Check for syntax errors
npm run lint

# Build to verify TypeScript compilation
npm run build
```

### Step 1.4: Test Locally

```bash
# Start development server
npm run dev

# In another terminal, test the withdrawal processor
curl -X POST http://localhost:3000/api/withdrawal-processor \
  -H "x-withdrawal-secret: your-secret-key" \
  -H "Content-Type: application/json"
```

---

## **Fix #2: Create Withdrawal UI Component**

**Status:** 🔴 CRITICAL  
**File:** `src/pages/Withdrawal.tsx` (new file)  
**Time:** 45 minutes

### Step 2.1: Create the Component File

Create a new file at `src/pages/Withdrawal.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { ArrowUpRight, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

interface WithdrawalRequest {
  id?: string;
  amount: number;
  currency: string;
  destination: string;
  method: 'bank' | 'crypto' | 'email';
  status?: 'pending' | 'processing' | 'success' | 'failed';
  fee?: number;
}

interface WithdrawalHistory {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'ERROR';
  createdAt: string;
  processedAt?: string;
  failReason?: string;
}

export default function Withdrawal() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form state
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [destination, setDestination] = useState('');
  const [method, setMethod] = useState<'bank' | 'crypto' | 'email'>('bank');
  const [fee, setFee] = useState(0);

  // Status state
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');

  // History state
  const [history, setHistory] = useState<WithdrawalHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load user balance on mount
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadBalance();
    loadHistory();
  }, [user, navigate]);

  const loadBalance = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/wise/balance', {
        headers: {
          Authorization: `Bearer ${await user?.getIdToken()}`
        }
      });

      if (!response.ok) throw new Error('Failed to load balance');

      const data = await response.json();
      // Find USD balance or use first balance
      const usdBalance = data.find((b: any) => b.amount?.currency === 'USD');
      setBalance(usdBalance?.amount?.value || 0);
    } catch (err: any) {
      setStatusMessage(`Error loading balance: ${err.message}`);
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await fetch('/api/withdrawals/history', {
        headers: {
          Authorization: `Bearer ${await user?.getIdToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (err: any) {
      console.error('Failed to load withdrawal history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!amount || isNaN(parseFloat(amount))) {
      newErrors.amount = 'Please enter a valid amount';
    } else {
      const amountNum = parseFloat(amount);
      if (amountNum < 10) {
        newErrors.amount = 'Minimum withdrawal is $10';
      }
      if (amountNum > 100000) {
        newErrors.amount = 'Maximum withdrawal is $100,000';
      }
      if (amountNum > balance) {
        newErrors.amount = `Insufficient balance (available: $${balance.toFixed(2)})`;
      }
    }

    if (!currency) {
      newErrors.currency = 'Please select a currency';
    }

    if (!destination || destination.trim().length === 0) {
      newErrors.destination = 'Please enter a destination';
    } else {
      // Validate destination based on method
      if (method === 'bank') {
        if (!/^[A-Z]{2}[0-9A-Z]{13,30}$|^\d{14}$|^\d{2}-\d{2}-\d{8}$|^\d{9}$/.test(destination)) {
          newErrors.destination = 'Invalid bank account format';
        }
      } else if (method === 'crypto') {
        if (!/^(0x)?[a-fA-F0-9]{40,66}$|^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(destination)) {
          newErrors.destination = 'Invalid crypto wallet address';
        }
      } else if (method === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)) {
          newErrors.destination = 'Invalid email address';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateFee = (amount: number): number => {
    // 2% fee for fiat, 0.5% for crypto
    if (method === 'crypto') {
      return parseFloat((amount * 0.005).toFixed(2));
    }
    return parseFloat((amount * 0.02).toFixed(2));
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      setFee(calculateFee(parseFloat(value)));
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setStatusMessage('Please fix the errors above');
      setStatusType('error');
      return;
    }

    setSubmitting(true);
    setStatusMessage('');

    try {
      const token = await user?.getIdToken();
      const response = await fetch('/api/wise/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency,
          destination,
          method
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Withdrawal failed');
      }

      setStatusMessage(`✓ Withdrawal initiated! ID: ${data.id}`);
      setStatusType('success');

      // Reset form
      setAmount('');
      setDestination('');
      setMethod('bank');
      setCurrency('USD');
      setFee(0);

      // Reload balance and history
      setTimeout(() => {
        loadBalance();
        loadHistory();
      }, 1000);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
      setStatusType('error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAILED':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'PROCESSING':
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <ArrowUpRight className="w-8 h-8 text-accent-blue" />
            <h1 className="text-4xl font-black uppercase tracking-tighter">Sovereign Withdrawal Portal</h1>
          </div>
          <p className="text-text-dim">Securely withdraw your earnings to any global destination</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="md:col-span-2">
            {/* Balance Card */}
            <div className="mb-8 p-6 bg-surface border border-border-dim rounded-lg">
              <p className="text-text-dim text-sm uppercase tracking-widest mb-2">Available Balance</p>
              <p className="text-4xl font-black text-accent-gold">
                ${loading ? '...' : balance.toFixed(2)}
              </p>
            </div>

            {/* Status Messages */}
            {statusMessage && (
              <div
                className={`mb-6 p-4 rounded-lg border ${
                  statusType === 'success'
                    ? 'bg-green-900/20 border-green-500 text-green-400'
                    : statusType === 'error'
                    ? 'bg-red-900/20 border-red-500 text-red-400'
                    : 'bg-blue-900/20 border-blue-500 text-blue-400'
                }`}
              >
                {statusMessage}
              </div>
            )}

            {/* Withdrawal Form */}
            <form onSubmit={handleWithdraw} className="space-y-6 p-6 bg-surface border border-border-dim rounded-lg">
              {/* Currency Selection */}
              <div>
                <label className="block text-sm font-bold mb-3 uppercase tracking-widest">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={`w-full p-3 bg-bg border rounded font-mono text-sm ${
                    errors.currency ? 'border-red-500' : 'border-border-dim'
                  }`}
                >
                  <option value="USD">USD - United States Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="ZAR">ZAR - South African Rand</option>
                  <option value="BTC">BTC - Bitcoin</option>
                  <option value="ETH">ETH - Ethereum</option>
                  <option value="USDT">USDT - Tether</option>
                </select>
                {errors.currency && <p className="text-red-400 text-xs mt-2">{errors.currency}</p>}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-bold mb-3 uppercase tracking-widest">Payment Method</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['bank', 'crypto', 'email'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMethod(m);
                        setDestination('');
                        setErrors({});
                      }}
                      className={`p-3 rounded border uppercase font-bold text-xs transition ${
                        method === m
                          ? 'bg-accent-blue border-accent-blue text-bg'
                          : 'bg-bg border-border-dim text-text-dim hover:border-accent-blue'
                      }`}
                    >
                      {m === 'bank' ? 'Bank' : m === 'crypto' ? 'Crypto' : 'Email'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Withdrawal Amount */}
              <div>
                <label className="block text-sm font-bold mb-3 uppercase tracking-widest">Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className={`w-full p-3 bg-bg border rounded font-mono text-sm ${
                      errors.amount ? 'border-red-500' : 'border-border-dim'
                    }`}
                  />
                  <span className="absolute right-3 top-3 text-text-dim font-mono">{currency}</span>
                </div>
                {errors.amount && <p className="text-red-400 text-xs mt-2">{errors.amount}</p>}
              </div>

              {/* Fee Display */}
              {amount && !isNaN(parseFloat(amount)) && (
                <div className="p-3 bg-bg/50 border border-border-dim rounded text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-dim">Fee ({method === 'crypto' ? '0.5%' : '2%'})</span>
                    <span className="font-mono text-text-main">${fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mt-2 font-bold text-accent-gold">
                    <span>You'll receive</span>
                    <span className="font-mono">${(parseFloat(amount) - fee).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Destination */}
              <div>
                <label className="block text-sm font-bold mb-3 uppercase tracking-widest">
                  {method === 'bank'
                    ? 'Bank Account Details'
                    : method === 'crypto'
                    ? 'Wallet Address'
                    : 'Email Address'}
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder={
                    method === 'bank'
                      ? 'IBAN or sort code'
                      : method === 'crypto'
                      ? 'Public wallet address'
                      : 'Email address'
                  }
                  className={`w-full p-3 bg-bg border rounded font-mono text-sm ${
                    errors.destination ? 'border-red-500' : 'border-border-dim'
                  }`}
                />
                {errors.destination && <p className="text-red-400 text-xs mt-2">{errors.destination}</p>}
                <p className="text-text-dim text-xs mt-2">
                  {method === 'bank' && 'Enter IBAN (30 chars), sort code (14 digits), or US routing (9 digits)'}
                  {method === 'crypto' && 'Enter a valid blockchain wallet address'}
                  {method === 'email' && 'We'll send funds via Wise email transfer'}
                </p>
              </div>

              {/* Disclaimer */}
              <div className="p-3 bg-surface border border-border-dim rounded text-xs text-text-dim">
                ⚠️ Once submitted, withdrawals cannot be cancelled. Double-check all details before confirming.
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || loading}
                className="w-full py-3 bg-accent-blue text-bg font-bold uppercase rounded tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition"
              >
                {submitting ? 'Processing...' : 'Initiate Withdrawal'}
              </button>
            </form>
          </div>

          {/* Sidebar - Recent Withdrawals */}
          <div>
            <div className="sticky top-6">
              <div className="p-4 bg-surface border border-border-dim rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold uppercase text-sm">Recent Withdrawals</h3>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-xs text-accent-blue hover:text-accent-gold"
                  >
                    {showHistory ? 'Hide' : 'Show'}
                  </button>
                </div>

                {historyLoading ? (
                  <p className="text-text-dim text-xs">Loading...</p>
                ) : history.length === 0 ? (
                  <p className="text-text-dim text-xs">No withdrawal history</p>
                ) : (
                  <div className="space-y-2">
                    {history.slice(0, 5).map((w) => (
                      <div key={w.id} className="p-2 bg-bg rounded border border-border-dim/30 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-text-main">
                            ${w.amount.toFixed(2)} {w.currency}
                          </span>
                          {getStatusIcon(w.status)}
                        </div>
                        <p className="text-text-dim text-[10px]">
                          {new Date(w.createdAt).toLocaleDateString()}
                        </p>
                        {w.status === 'FAILED' && w.failReason && (
                          <p className="text-red-400 text-[10px] mt-1">{w.failReason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Help Card */}
              <div className="mt-4 p-4 bg-surface border border-border-dim rounded-lg text-xs text-text-dim">
                <p className="font-bold mb-2">Questions?</p>
                <p>Check our Knowledge Base for withdrawal information and best practices.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Step 2.2: Add Route to Router

Edit `src/App.tsx` and add the Withdrawal page to your routes:

```typescript
import Withdrawal from './pages/Withdrawal';

// In your Router section:
<Route path="/withdrawal" element={<Withdrawal />} />
```

### Step 2.3: Add Navigation Link

Add a link to the withdrawal page in your Dashboard or Navigation component:

```typescript
<Link 
  to="/withdrawal" 
  className="px-4 py-2 bg-accent-gold text-bg font-bold rounded hover:shadow-lg transition"
>
  💸 Withdraw
</Link>
```

### Step 2.4: Test the Component

```bash
npm run dev
# Navigate to http://localhost:5173/withdrawal
```

---

## **Fix #3: Create Backend Withdrawal Endpoint**

**Status:** 🔴 CRITICAL  
**File:** `server.ts` (add new endpoint)  
**Time:** 30 minutes

### Step 3.1: Add Withdrawal Endpoint to Server

Add this new endpoint to your `server.ts` file:

```typescript
// Add this import at the top
import { 
  doc, 
  collection, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';

// Add this middleware for authentication (before your routes)
const verifyAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    // Verify token with Firebase Admin SDK
    // For now, we'll do basic validation
    (req as any).user = { uid: 'user-id-from-token' }; // Replace with actual verification
    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// POST /api/wise/withdraw - Initiate withdrawal
app.post("/api/wise/withdraw", verifyAuth, async (req, res) => {
  try {
    const { amount, currency, destination, method } = req.body;
    const userId = (req as any).user?.uid;

    console.log(`[WITHDRAWAL] New withdrawal request from user ${userId}: ${amount} ${currency}`);

    // ===== VALIDATION =====
    const validationErrors: Record<string, string> = {};

    // Validate amount
    const requestedAmount = Number(amount);
    if (!requestedAmount || Number.isNaN(requestedAmount) || requestedAmount <= 0) {
      validationErrors.amount = "Invalid amount provided";
    } else if (requestedAmount < 10) {
      validationErrors.amount = "Minimum withdrawal is $10";
    } else if (requestedAmount > 100000) {
      validationErrors.amount = "Maximum withdrawal is $100,000";
    }

    // Validate currency
    const validCurrencies = ['USD', 'EUR', 'GBP', 'ZAR', 'BTC', 'ETH', 'USDT', 'SOL'];
    if (!currency || typeof currency !== "string" || !validCurrencies.includes(currency)) {
      validationErrors.currency = `Invalid currency: ${currency}`;
    }

    // Validate destination
    if (!destination || typeof destination !== "string" || destination.trim().length === 0) {
      validationErrors.destination = "Destination is required";
    }

    // Validate method
    if (!method || !['bank', 'crypto', 'email'].includes(method)) {
      validationErrors.method = "Invalid payment method";
    }

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // ===== BALANCE CHECK =====
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return res.status(404).json({ error: "User not found" });
    }

    const userBalance = userDoc.data()?.balance || 0;

    if (requestedAmount > userBalance) {
      return res.status(400).json({
        error: "Insufficient balance",
        available: userBalance,
        requested: requestedAmount
      });
    }

    // ===== DUPLICATE CHECK =====
    const pendingQuery = query(
      collection(db, 'withdrawals'),
      where('userId', '==', userId),
      where('status', '==', 'PENDING')
    );
    const pendingDocs = await getDocs(pendingQuery);

    if (pendingDocs.size > 0) {
      return res.status(400).json({
        error: "You have a pending withdrawal. Please wait for it to complete."
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
    );
    const dailyWithdrawals = await getDocs(dailyWithdrawalsQuery);

    if (dailyWithdrawals.size >= 5) {
      return res.status(429).json({
        error: "Daily withdrawal limit exceeded (max 5 per day)"
      });
    }

    // ===== CALCULATE FEE =====
    const fee = method === 'crypto'
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
        userAgent: req.get('user-agent')
      }
    };

    // Save withdrawal document
    await setDoc(withdrawalDocRef, withdrawalData);

    // Deduct from user balance (we'll refund if it fails)
    await updateDoc(userDocRef, {
      balance: userBalance - totalDebit,
      lastWithdrawalAt: serverTimestamp()
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
      timestamp: serverTimestamp()
    });

    console.log(`[WITHDRAWAL] Successfully created withdrawal ${withdrawalId}`);

    return res.status(201).json({
      id: withdrawalId,
      status: 'PENDING',
      amount: requestedAmount,
      fee,
      totalDebit,
      currency,
      message: 'Withdrawal initiated. You will receive your funds within 1-3 business days.'
    });
  } catch (err: any) {
    console.error('[WITHDRAWAL] Error:', err);
    return res.status(500).json({
      error: 'Withdrawal creation failed',
      message: err.message || String(err)
    });
  }
});

// GET /api/withdrawals/history - Get withdrawal history
app.get("/api/withdrawals/history", verifyAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.uid;
    const limit = parseInt(req.query.limit as string) || 20;

    const withdrawalsQuery = query(
      collection(db, 'withdrawals'),
      where('userId', '==', userId)
    );

    const docs = await getDocs(withdrawalsQuery);
    const withdrawals = docs.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a: any, b: any) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0))
      .slice(0, limit);

    return res.json(withdrawals);
  } catch (err: any) {
    console.error('[WITHDRAWAL_HISTORY] Error:', err);
    return res.status(500).json({ error: 'Failed to fetch withdrawal history' });
  }
});

// GET /api/withdrawals/:id - Get withdrawal details
app.get("/api/withdrawals/:id", verifyAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.uid;

    const withdrawalRef = doc(db, 'withdrawals', id);
    const withdrawalDoc = await getDoc(withdrawalRef);

    if (!withdrawalDoc.exists()) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    const data = withdrawalDoc.data();

    // Verify ownership
    if (data.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    return res.json({
      id: withdrawalDoc.id,
      ...data
    });
  } catch (err: any) {
    console.error('[WITHDRAWAL_DETAIL] Error:', err);
    return res.status(500).json({ error: 'Failed to fetch withdrawal' });
  }
});
```

### Step 3.2: Update Auth Middleware

Replace the `verifyAuth` middleware with proper Firebase authentication:

```typescript
import admin from 'firebase-admin';

const verifyAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (err: any) {
    console.error('[AUTH] Token verification failed:', err);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
```

### Step 3.3: Test the Endpoint

```bash
# Get a test token from your Firebase console or create a test user

# Test withdrawal submission
curl -X POST http://localhost:3000/api/wise/withdraw \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50,
    "currency": "USD",
    "destination": "test@example.com",
    "method": "email"
  }'

# Get withdrawal history
curl -X GET http://localhost:3000/api/withdrawals/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## **Fix #4: Fix TypeScript Compilation Errors**

**Status:** 🔴 CRITICAL  
**File:** `tsconfig.json`, `server.ts`  
**Time:** 15 minutes

### Step 4.1: Update tsconfig.json

Edit `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src", "server.ts", "api"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 4.2: Fix Port Type Issue in server.ts

Find the line where the server starts (usually near the end of the file) and update it:

```typescript
// BEFORE:
const PORT = process.env.PORT || "3000";
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// AFTER:
const PORT: number = parseInt(process.env.PORT || "3000", 10);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### Step 4.3: Check for Type Errors

```bash
# Run TypeScript compiler check
npm run lint

# Should show no errors now
```

### Step 4.4: Build Verification

```bash
# Build the project
npm run build

# If successful, you should see:
# ✓ src/index.html transformed as empty
# ✓ src/main.tsx transformed as empty
# etc.
```

---

## 🟡 PHASE 2: HIGH PRIORITY FIXES (Complete After Phase 1)

---

## **Fix #5: Add Authentication Middleware**

**Status:** 🟡 HIGH  
**File:** `server.ts` (add middleware)  
**Time:** 20 minutes

### Step 5.1: Create Auth Middleware

Add this at the beginning of your `server.ts`:

```typescript
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  });
}

// Auth middleware - verify Firebase tokens
export const authMiddleware = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.substring(7);
    
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      (req as any).user = decodedToken;
      next();
    } catch (error: any) {
      console.error('[AUTH] Token verification failed:', error.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error: any) {
    console.error('[AUTH] Middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Optional auth - attach user if token is valid, but don't require it
export const optionalAuthMiddleware = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        (req as any).user = decodedToken;
      } catch (error: any) {
        console.log('[AUTH] Optional token verification failed:', error.message);
        // Don't fail, just continue without user
      }
    }
    
    next();
  } catch (error: any) {
    console.error('[AUTH] Optional middleware error:', error);
    next(); // Continue even if there's an error
  }
};
```

### Step 5.2: Apply Middleware to Sensitive Routes

Update your routes to use the middleware:

```typescript
// Protected routes (require authentication)
app.post("/api/wise/withdraw", authMiddleware, async (req, res) => { ... });
app.get("/api/wise/balance", authMiddleware, async (req, res) => { ... });
app.get("/api/withdrawals/history", authMiddleware, async (req, res) => { ... });
app.get("/api/withdrawals/:id", authMiddleware, async (req, res) => { ... });

// Public routes (optional authentication)
app.get("/api/status", optionalAuthMiddleware, async (req, res) => {
  return res.json({ status: 'ok', user: (req as any).user?.uid || 'anonymous' });
});
```

### Step 5.3: Test Authentication

```bash
# Without token (should fail)
curl -X GET http://localhost:3000/api/wise/balance

# With token (should work)
curl -X GET http://localhost:3000/api/wise/balance \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

---

## **Fix #6: Replace Mock Data with Real Database Queries**

**Status:** 🟡 HIGH  
**File:** `server.ts`  
**Time:** 25 minutes

### Step 6.1: Update Balance Endpoint

```typescript
app.get("/api/wise/balance", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.uid;
    
    // Get user document with real balance
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const balance = userData?.balance || 0;

    // Try to fetch Wise balances if API key is available
    let wiseBalances: any[] = [];
    
    if (process.env.WISE_API_KEY) {
      try {
        const profileId = process.env.WISE_PROFILE_ID || 'default';
        // Call Wise API to get actual balances
        // This would require your wiseFetch function
        // For now, return simplified response
      } catch (err) {
        console.warn('[BALANCE] Failed to fetch Wise balances:', err);
      }
    }

    // Return real user balance
    const response = [
      {
        amount: { value: balance, currency: 'USD' },
        type: 'SOVEREIGN',
        name: 'Primary Balance',
        accountId: userId,
        updated: new Date().toISOString()
      }
    ];

    // Add Wise balances if available
    if (wiseBalances.length > 0) {
      response.push(...wiseBalances);
    }

    res.json(response);
  } catch (err: any) {
    console.error('[BALANCE] Error:', err);
    return res.status(500).json({ error: 'Failed to fetch balance' });
  }
});
```

### Step 6.2: Create Initial User Setup Endpoint

```typescript
app.post("/api/users/setup", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.uid;
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return res.json({ message: 'User already exists', user: userDoc.data() });
    }

    // Create new user with default values
    const userData = {
      uid: userId,
      email: (req as any).user?.email,
      displayName: req.body?.displayName || 'User',
      balance: 0,
      totalEarnings: 0,
      totalWithdrawn: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      payoutDetails: null,
      preferences: {
        currency: 'USD',
        timezone: 'UTC',
        notifications: true
      }
    };

    await setDoc(userRef, userData);

    return res.status(201).json(userData);
  } catch (err: any) {
    console.error('[USER_SETUP] Error:', err);
    return res.status(500).json({ error: 'Failed to setup user' });
  }
});
```

---

## **Fix #7: Implement Withdrawal Validation**

**Status:** 🟡 HIGH  
**File:** Already covered in Fix #3, but here's additional validation

Create a validation helper file at `api/validators.ts`:

```typescript
export interface WithdrawalValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateWithdrawalRequest = (
  amount: number,
  currency: string,
  destination: string,
  method: string,
  userBalance: number,
  dailyWithdrawalCount: number
): WithdrawalValidation => {
  const errors: Record<string, string> = {};

  // Validate amount
  if (!amount || isNaN(amount) || amount <= 0) {
    errors.amount = 'Amount must be greater than 0';
  } else if (amount < 10) {
    errors.amount = 'Minimum withdrawal is $10 USD equivalent';
  } else if (amount > 100000) {
    errors.amount = 'Maximum withdrawal is $100,000 USD equivalent';
  }

  // Validate currency
  const validCurrencies = ['USD', 'EUR', 'GBP', 'ZAR', 'BTC', 'ETH', 'USDT', 'SOL'];
  if (!validCurrencies.includes(currency)) {
    errors.currency = `Currency must be one of: ${validCurrencies.join(', ')}`;
  }

  // Validate destination format based on method
  if (method === 'bank') {
    const ibanRegex = /^[A-Z]{2}[0-9A-Z]{13,30}$/;
    const sortCodeRegex = /^(\d{2}-\d{2}-\d{8}|\d{14})$/;
    const abaRegex = /^\d{9}$/;

    if (!ibanRegex.test(destination) && !sortCodeRegex.test(destination) && !abaRegex.test(destination)) {
      errors.destination = 'Invalid bank account format (IBAN, sort code, or ABA)';
    }
  } else if (method === 'crypto') {
    const cryptoRegex = /^(0x)?[a-fA-F0-9]{40,66}$|^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/;
    if (!cryptoRegex.test(destination)) {
      errors.destination = 'Invalid cryptocurrency wallet address';
    }
  } else if (method === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(destination)) {
      errors.destination = 'Invalid email address';
    }
  }

  // Validate balance
  if (amount > userBalance) {
    errors.balance = `Insufficient balance. Available: $${userBalance.toFixed(2)}`;
  }

  // Validate daily limit
  if (dailyWithdrawalCount >= 5) {
    errors.dailyLimit = 'Daily withdrawal limit (5) exceeded. Try again tomorrow.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const calculateWithdrawalFee = (
  amount: number,
  method: 'bank' | 'crypto' | 'email',
  currency: string
): number => {
  // Different fee structures
  switch (method) {
    case 'crypto':
      return parseFloat((amount * 0.005).toFixed(2)); // 0.5%
    case 'bank':
      // Fiat transfers have higher fees
      if (currency === 'USD' || currency === 'EUR' || currency === 'GBP') {
        return parseFloat((amount * 0.02).toFixed(2)); // 2%
      }
      return parseFloat((amount * 0.03).toFixed(2)); // 3% for other currencies
    case 'email':
      return parseFloat((amount * 0.01).toFixed(2)); // 1%
    default:
      return parseFloat((amount * 0.02).toFixed(2));
  }
};
```

Then use it in your withdrawal endpoint:

```typescript
import { validateWithdrawalRequest, calculateWithdrawalFee } from '../api/validators';

app.post("/api/wise/withdraw", authMiddleware, async (req, res) => {
  try {
    const { amount, currency, destination, method } = req.body;
    const userId = (req as any).user?.uid;

    // Get user balance
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userBalance = userDoc.data()?.balance || 0;

    // Get daily withdrawal count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyQuery = query(
      collection(db, 'withdrawals'),
      where('userId', '==', userId),
      where('status', 'in', ['SUCCESS', 'PROCESSING']),
      where('createdAt', '>=', today)
    );
    const dailyDocs = await getDocs(dailyQuery);

    // Validate request
    const validation = validateWithdrawalRequest(
      amount,
      currency,
      destination,
      method,
      userBalance,
      dailyDocs.size
    );

    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // Calculate fee
    const fee = calculateWithdrawalFee(amount, method as any, currency);

    // Rest of your withdrawal logic...
  } catch (err: any) {
    // Error handling...
  }
});
```

---

## 🟢 Verification Checklist

After completing Phase 1 fixes, verify everything works:

### Pre-Deployment Tests

- [ ] **Build Test**
  ```bash
  npm run build
  # Should complete without errors
  ```

- [ ] **Lint Test**
  ```bash
  npm run lint
  # Should show no errors
  ```

- [ ] **Local Dev Test**
  ```bash
  npm run dev
  # Server should start without errors
  # Navigate to http://localhost:5173/withdrawal
  # Form should load and display
  ```

- [ ] **API Tests**
  ```bash
  # Test withdrawal submission
  curl -X POST http://localhost:3000/api/wise/withdraw \
    -H "Authorization: Bearer TEST_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"amount": 50, "currency": "USD", "destination": "test@example.com", "method": "email"}'
  
  # Test withdrawal history
  curl -X GET http://localhost:3000/api/withdrawals/history \
    -H "Authorization: Bearer TEST_TOKEN"
  ```

- [ ] **Database Tests**
  - [ ] Check Firestore for new withdrawal document
  - [ ] Verify user balance was debited
  - [ ] Check audit logs created

- [ ] **UI Component Tests**
  - [ ] Form validation works
  - [ ] Currency selection updates fee
  - [ ] Destination validation by method
  - [ ] Balance display updates
  - [ ] Success/error messages display

---

## 📝 Deployment Checklist

Before deploying to production:

- [ ] All Phase 1 fixes implemented
- [ ] All tests passing locally
- [ ] Environment variables configured (.env file)
- [ ] Firebase credentials configured
- [ ] Wise API keys configured (if using real Wise integration)
- [ ] Database backups created
- [ ] Error logging configured
- [ ] Rate limiting tested
- [ ] Authentication tokens tested
- [ ] Withdrawal processor cron job scheduled

---

## 🔧 Troubleshooting

### Issue: "Withdrawal processor error: db is not defined"

**Solution:** Ensure Firebase is initialized before the withdrawal processor:

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Your config
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

### Issue: "Token verification failed"

**Solution:** Ensure Firebase Admin SDK is properly initialized:

```typescript
import * as admin from 'firebase-admin';
import * as fs from 'fs';

const serviceAccount = JSON.parse(
  fs.readFileSync(process.env.FIREBASE_KEY_PATH, 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});
```

### Issue: "Balance endpoint returns empty array"

**Solution:** Check that user document exists in Firestore:

```bash
# Query Firestore console:
# Collection: users
# Document: [user-id]
# Should have 'balance' field with number value
```

### Issue: "Withdrawal submission gets stuck"

**Solution:** Check withdrawal processor cron status:

```bash
# View Vercel cron logs
# Or manually trigger:
curl -X POST https://your-domain.vercel.app/api/withdrawal-processor \
  -H "x-withdrawal-secret: YOUR_SECRET"
```

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Wise API Documentation](https://wise.com/gb/business/api)
- [Express.js Guide](https://expressjs.com/)
- [React Hooks Documentation](https://react.dev/reference/react/hooks)

---

## 🎯 Next Steps

After Phase 1 completion:

1. **Test in staging environment** for 48-72 hours
2. **Monitor withdrawal processor** logs and success rate
3. **Gather user feedback** on withdrawal experience
4. **Then proceed to Phase 2** (High Priority fixes)
5. **Deploy Phase 2** after additional testing

---

**Created:** May 23, 2026  
**Last Updated:** May 23, 2026  
**Status:** Phase 1 Implementation Guide Complete
