import axios, { AxiosInstance } from 'axios';

/**
 * Wise API Integration Module
 * Handles all communication with Wise API for international transfers
 * 
 * Prerequisites:
 * - Wise API Token (from https://wise.com/api/)
 * - Wise Profile ID
 * Environment variables required:
 * - WISE_API_KEY
 * - WISE_PROFILE_ID
 */

interface WiseQuoteRequest {
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount?: number;
  targetAmount?: number;
}

interface WiseQuote {
  id: string;
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: number;
  targetAmount: number;
  rate: number;
  rateType: string;
  createdTime: string;
  expiresAt: string;
  paymentOptions: Array<{
    formattedEstimatedDelivery: string;
    estimatedDeliveryDays: number;
  }>;
}

interface WiseTransferRequest {
  targetAccount: string;
  quoteUuid: string;
  customerTransactionId: string;
  details: {
    reference: string;
    transferPurpose?: string;
    transferPurposeSubTransferPurpose?: string;
  };
}

interface WiseTransfer {
  id: string;
  user: number;
  targetAccount: number;
  sourceAccount: number;
  quote: string;
  status: string;
  reference: string;
  rate: number;
  created: string;
  modified: string;
  firstAmount: number;
  sourceValue: number;
  targetValue: number;
}

interface WiseAccount {
  id: number;
  profileId: number;
  accountHolderName: string;
  currency: string;
  type: string;
  details?: Record<string, any>;
}

class WiseAPIClient {
  private apiClient: AxiosInstance;
  private apiKey: string;
  private profileId: string;
  private readonly baseURL = 'https://api.wise.com/v1';

  constructor(apiKey?: string, profileId?: string) {
    this.apiKey = apiKey || process.env.WISE_API_KEY || '';
    this.profileId = profileId || process.env.WISE_PROFILE_ID || '';

    if (!this.apiKey || !this.profileId) {
      throw new Error(
        'Wise API credentials not configured. Set WISE_API_KEY and WISE_PROFILE_ID environment variables.'
      );
    }

    this.apiClient = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Add request/response interceptors for logging
    this.apiClient.interceptors.request.use((config) => {
      console.log(`[WISE_API] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    this.apiClient.interceptors.response.use(
      (response) => {
        console.log(`[WISE_API] Success: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        console.error(`[WISE_API] Error: ${error.response?.status} ${error.response?.data?.errorCode}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get profile information
   * @returns Profile details including ID and name
   */
  async getProfile(): Promise<any> {
    try {
      const response = await this.apiClient.get('/profiles');
      const profile = response.data.find((p: any) => p.type === 'personal');
      console.log(`[WISE_API] Profile retrieved: ${profile?.id}`);
      return profile;
    } catch (error) {
      console.error('[WISE_API] Failed to get profile:', error);
      throw error;
    }
  }

  /**
   * Get account balances for the authenticated user
   * @returns List of accounts with their balances
   */
  async getBalances(): Promise<WiseAccount[]> {
    try {
      const response = await this.apiClient.get(`/accounts?profileId=${this.profileId}`);
      console.log(`[WISE_API] Retrieved ${response.data.length} accounts`);
      return response.data;
    } catch (error) {
      console.error('[WISE_API] Failed to get balances:', error);
      throw error;
    }
  }

  /**
   * Get balance for a specific currency
   * @param currency - ISO 4217 currency code (e.g., 'USD', 'EUR', 'GBP')
   * @returns Account balance
   */
  async getBalance(currency: string): Promise<WiseAccount | null> {
    try {
      const accounts = await this.getBalances();
      const account = accounts.find((a) => a.currency === currency);
      console.log(`[WISE_API] ${currency} balance: ${account?.details?.currentBalance || 0}`);
      return account || null;
    } catch (error) {
      console.error(`[WISE_API] Failed to get ${currency} balance:`, error);
      throw error;
    }
  }

  /**
   * Create a quote for a currency pair
   * @param request - Quote parameters
   * @returns Quote object with rate and details
   */
  async createQuote(request: WiseQuoteRequest): Promise<WiseQuote> {
    try {
      const payload = {
        profileId: this.profileId,
        ...request,
      };

      const response = await this.apiClient.post('/quotes', payload);
      console.log(
        `[WISE_API] Quote created: ${request.sourceCurrency} → ${request.targetCurrency} @ ${response.data.rate}`
      );
      return response.data;
    } catch (error) {
      console.error('[WISE_API] Failed to create quote:', error);
      throw error;
    }
  }

  /**
   * Create a transfer
   * @param request - Transfer details
   * @returns Transfer object with status
   */
  async createTransfer(request: WiseTransferRequest): Promise<WiseTransfer> {
    try {
      const payload = {
        targetAccount: request.targetAccount,
        quoteUuid: request.quoteUuid,
        customerTransactionId: request.customerTransactionId,
        details: request.details,
      };

      const response = await this.apiClient.post('/transfers', payload);
      console.log(`[WISE_API] Transfer created: ${response.data.id} (${response.data.status})`);
      return response.data;
    } catch (error) {
      console.error('[WISE_API] Failed to create transfer:', error);
      throw error;
    }
  }

  /**
   * Get transfer status
   * @param transferId - Wise transfer ID
   * @returns Transfer object with current status
   */
  async getTransferStatus(transferId: string): Promise<WiseTransfer> {
    try {
      const response = await this.apiClient.get(`/transfers/${transferId}`);
      console.log(`[WISE_API] Transfer ${transferId}: ${response.data.status}`);
      return response.data;
    } catch (error) {
      console.error(`[WISE_API] Failed to get transfer status:`, error);
      throw error;
    }
  }

  /**
   * Fund a transfer (initiate payment)
   * @param transferId - Wise transfer ID
   * @returns Confirmation of funding
   */
  async fundTransfer(transferId: string): Promise<any> {
    try {
      const payload = {
        type: 'BALANCE',
      };

      const response = await this.apiClient.post(`/transfers/${transferId}/payments`, payload);
      console.log(`[WISE_API] Transfer ${transferId} funded: ${response.data.status}`);
      return response.data;
    } catch (error) {
      console.error(`[WISE_API] Failed to fund transfer:`, error);
      throw error;
    }
  }

  /**
   * Get recipient accounts (for bank transfers)
   * @returns List of recipient accounts
   */
  async getRecipientAccounts(): Promise<any[]> {
    try {
      const response = await this.apiClient.get(`/accounts?profileId=${this.profileId}`);
      console.log(`[WISE_API] Retrieved ${response.data.length} recipient accounts`);
      return response.data;
    } catch (error) {
      console.error('[WISE_API] Failed to get recipient accounts:', error);
      throw error;
    }
  }

  /**
   * Create a recipient account
   * @param accountDetails - Recipient account details (varies by country)
   * @returns Created account object
   */
  async createRecipientAccount(accountDetails: Record<string, any>): Promise<any> {
    try {
      const payload = {
        currency: accountDetails.currency,
        type: accountDetails.type,
        profile: this.profileId,
        accountHolderName: accountDetails.accountHolderName,
        details: accountDetails.details,
      };

      const response = await this.apiClient.post('/accounts', payload);
      console.log(`[WISE_API] Recipient account created: ${response.data.id}`);
      return response.data;
    } catch (error) {
      console.error('[WISE_API] Failed to create recipient account:', error);
      throw error;
    }
  }

  /**
   * Get exchange rate
   * @param sourceCurrency - Source currency code
   * @param targetCurrency - Target currency code
   * @returns Exchange rate
   */
  async getExchangeRate(sourceCurrency: string, targetCurrency: string): Promise<number> {
    try {
      const response = await this.apiClient.get(
        `/rates?source=${sourceCurrency}&target=${targetCurrency}`
      );
      const rate = response.data[0]?.rate || 0;
      console.log(`[WISE_API] Exchange rate ${sourceCurrency}/${targetCurrency}: ${rate}`);
      return rate;
    } catch (error) {
      console.error('[WISE_API] Failed to get exchange rate:', error);
      throw error;
    }
  }
}

export default WiseAPIClient;
