import { useState, useEffect } from 'react';
import { ArrowUpRight, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

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
          Authorization: `Bearer ${await user?.getIdToken()}`,
        },
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
          Authorization: `Bearer ${await user?.getIdToken()}`,
        },
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency,
          destination,
          method,
        }),
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
                  {method === 'email' && "We'll send funds via Wise email transfer"}
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
