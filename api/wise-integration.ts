/**
 * Wise API Integration Module
 * Handles all communication with Wise payment platform
 * API Docs: https://docs.wise.com/
 */

interface WiseQuoteRequest {
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount?: number;
  targetAmount?: number;
}

interface WiseQuote {
  id: string;
  source: string;
  target: string;
  sourceAmount: number;
  targetAmount: number;
  rate: number;
  rateType: string;
  expiresAt: string;
}

interface WiseTransferRequest {
  targetAccount: number;
  quoteUuid: string;
  customerTransactionId: string;
  details?: {
    reference?: string;
    transferPurpose?: string;
    sourceOfFunds?: string;
  };
}

interface WiseTransferResponse {
  id: number;
  user: number;
  targetAccount: number;
  sourceAccount: number;
  quote: number;
  status: string;
  reference: string;
  rate: number;
  created: string;
  updated: string;
  firstPaymentDate: string;
  lastPaymentDate: string;
  details: any;
  hasActiveIssues: boolean;
  sourceCurrency: string;
  sourceValue: number;
  targetCurrency: string;
  targetValue: number;
}

interface WiseBankAccountRequest {
  currency: string;
  country: string;
  accountHolderName: string;
  type: string; // 'iban' | 'aba' | 'sortCode' etc
  details: Record<string, any>;
}

interface WiseBankAccount {
  id: number;
  profileId: number;
  accountHolderName: string;
  currency: string;
  type: string;
  country: string;
  active: boolean;
  details: Record<string, any>;
}

const WISE_API_BASE = 'https://api.wise.com/v1';
const WISE_API_KEY = process.env.WISE_API_KEY;
const WISE_PROFILE_ID = process.env.WISE_PROFILE_ID;

/**
 * Make authenticated request to Wise API
 */
async function makeWiseRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' = 'GET',
  body?: any
): Promise<any> {
  if (!WISE_API_KEY) {
    throw new Error('WISE_API_KEY not configured');
  }

  const url = `${WISE_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${WISE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[WISE_API_ERROR]', {
      status: response.status,
      endpoint,
      error: data,
    });
    throw new Error(data.message || `Wise API error: ${response.status}`);
  }

  return data;
}

/**
 * Get exchange rate quote from Wise
 * Required before creating a transfer
 */
export async function getWiseQuote(request: WiseQuoteRequest): Promise<WiseQuote> {
  console.log('[WISE_QUOTE] Requesting quote for', request);

  const params = new URLSearchParams();
  params.append('sourceCurrency', request.sourceCurrency);
  params.append('targetCurrency', request.targetCurrency);

  if (request.sourceAmount) {
    params.append('sourceAmount', request.sourceAmount.toString());
  } else if (request.targetAmount) {
    params.append('targetAmount', request.targetAmount.toString());
  } else {
    throw new Error('Either sourceAmount or targetAmount must be provided');
  }

  const quote = await makeWiseRequest(`/quotes?${params.toString()}`, 'GET');

  console.log('[WISE_QUOTE] Received quote:', {
    id: quote.id,
    rate: quote.rate,
    expiresAt: quote.expiresAt,
  });

  return quote;
}

/**
 * Create recipient bank account for transfer
 */
export async function createWiseRecipient(
  accountRequest: WiseBankAccountRequest
): Promise<WiseBankAccount> {
  console.log('[WISE_RECIPIENT] Creating recipient account for', accountRequest.country);

  const recipient = await makeWiseRequest('/accounts', 'POST', {
    profileId: WISE_PROFILE_ID,
    accountHolderName: accountRequest.accountHolderName,
    type: accountRequest.type,
    currency: accountRequest.currency,
    country: accountRequest.country,
    details: accountRequest.details,
  });

  console.log('[WISE_RECIPIENT] Account created:', recipient.id);
  return recipient;
}

/**
 * List all recipient accounts for profile
 */
export async function listWiseRecipients(): Promise<WiseBankAccount[]> {
  console.log('[WISE_RECIPIENTS] Fetching recipient accounts');

  const accounts = await makeWiseRequest(
    `/accounts?profileId=${WISE_PROFILE_ID}`,
    'GET'
  );

  console.log('[WISE_RECIPIENTS] Found', accounts.length, 'accounts');
  return accounts;
}

/**
 * Create transfer (2-step process: quote + transfer)
 */
export async function createWiseTransfer(
  request: WiseTransferRequest
): Promise<WiseTransferResponse> {
  console.log('[WISE_TRANSFER] Creating transfer', {
    targetAccount: request.targetAccount,
    customerId: request.customerTransactionId,
  });

  if (!WISE_PROFILE_ID) {
    throw new Error('WISE_PROFILE_ID not configured');
  }

  const transfer = await makeWiseRequest('/transfers', 'POST', {
    targetAccount: request.targetAccount,
    quoteUuid: request.quoteUuid,
    customerTransactionId: request.customerTransactionId,
    details: request.details || {
      reference: request.customerTransactionId,
    },
  });

  console.log('[WISE_TRANSFER] Transfer created:', {
    id: transfer.id,
    status: transfer.status,
    targetCurrency: transfer.targetCurrency,
    targetValue: transfer.targetValue,
  });

  return transfer;
}

/**
 * Fund transfer (complete the payment)
 * Required step after creating transfer
 */
export async function fundWiseTransfer(transferId: number): Promise<any> {
  console.log('[WISE_FUND] Funding transfer', transferId);

  const result = await makeWiseRequest(
    `/transfers/${transferId}/payments`,
    'POST',
    {
      type: 'BALANCE', // or 'BANK_TRANSFER'
    }
  );

  console.log('[WISE_FUND] Transfer funded:', result);
  return result;
}

/**
 * Get transfer status
 */
export async function getWiseTransferStatus(transferId: number): Promise<any> {
  console.log('[WISE_STATUS] Checking transfer status', transferId);

  const transfer = await makeWiseRequest(`/transfers/${transferId}`, 'GET');

  console.log('[WISE_STATUS] Transfer status:', {
    id: transfer.id,
    status: transfer.status,
    created: transfer.created,
  });

  return transfer;
}

/**
 * Cancel transfer (only if not yet processed)
 */
export async function cancelWiseTransfer(transferId: number): Promise<any> {
  console.log('[WISE_CANCEL] Cancelling transfer', transferId);

  const result = await makeWiseRequest(
    `/transfers/${transferId}/cancel`,
    'PUT'
  );

  console.log('[WISE_CANCEL] Transfer cancelled');
  return result;
}

/**
 * Get exchange rate for currency pair
 */
export async function getWiseExchangeRate(
  source: string,
  target: string
): Promise<number> {
  console.log('[WISE_RATE] Getting rate for', source, '->', target);

  const rates = await makeWiseRequest(
    `/rates?source=${source}&target=${target}`,
    'GET'
  );

  if (rates.length === 0) {
    throw new Error(`No rate available for ${source} to ${target}`);
  }

  const rate = rates[0].rate;
  console.log('[WISE_RATE] Rate:', rate);
  return rate;
}

/**
 * Verify recipient account (validate before transfer)
 */
export async function verifyWiseRecipient(accountId: number): Promise<boolean> {
  console.log('[WISE_VERIFY] Verifying recipient', accountId);

  try {
    const account = await makeWiseRequest(`/accounts/${accountId}`, 'GET');
    console.log('[WISE_VERIFY] Account verified:', account.id);
    return account.active === true;
  } catch (err) {
    console.error('[WISE_VERIFY] Verification failed:', err);
    return false;
  }
}

/**
 * Get account balance
 */
export async function getWiseBalance(currency?: string): Promise<any> {
  console.log('[WISE_BALANCE] Getting balance');

  const balances = await makeWiseRequest(
    `/balance-account?profileId=${WISE_PROFILE_ID}${
      currency ? `&currency=${currency}` : ''
    }`,
    'GET'
  );

  console.log('[WISE_BALANCE] Balances:', balances);
  return balances;
}

/**
 * Complete Wise transfer workflow
 * This is the main function used by withdrawal processor
 */
export async function processWiseWithdrawal(params: {
  withdrawalId: string;
  sourceAmount: number;
  sourceCurrency: string;
  targetCurrency: string;
  targetAccountId: number;
  accountHolderName: string;
}): Promise<{
  success: boolean;
  transferId?: number;
  status?: string;
  error?: string;
}> {
  try {
    console.log('[WISE_PROCESS] Starting withdrawal', params.withdrawalId);

    // Step 1: Get quote
    const quote = await getWiseQuote({
      sourceCurrency: params.sourceCurrency,
      targetCurrency: params.targetCurrency,
      sourceAmount: params.sourceAmount,
    });

    // Step 2: Create transfer
    const transfer = await createWiseTransfer({
      targetAccount: params.targetAccountId,
      quoteUuid: quote.id,
      customerTransactionId: params.withdrawalId,
      details: {
        reference: params.withdrawalId,
        transferPurpose: 'PERSONAL',
      },
    });

    // Step 3: Fund transfer (use balance)
    const funded = await fundWiseTransfer(transfer.id);

    console.log('[WISE_PROCESS] Withdrawal completed:', {
      withdrawalId: params.withdrawalId,
      transferId: transfer.id,
      status: funded.status,
    });

    return {
      success: true,
      transferId: transfer.id,
      status: funded.status,
    };
  } catch (err: any) {
    console.error('[WISE_PROCESS] Withdrawal failed:', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

export default {
  getWiseQuote,
  createWiseRecipient,
  listWiseRecipients,
  createWiseTransfer,
  fundWiseTransfer,
  getWiseTransferStatus,
  cancelWiseTransfer,
  getWiseExchangeRate,
  verifyWiseRecipient,
  getWiseBalance,
  processWiseWithdrawal,
};
