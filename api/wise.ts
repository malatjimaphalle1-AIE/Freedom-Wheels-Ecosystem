/**
 * Wise API Integration Module
 * Handles all communication with Wise payment platform
 * API Docs: https://docs.wise.com/
 */

export interface WiseQuoteRequest {
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount?: number;
  targetAmount?: number;
}

export interface WiseQuote {
  id: string;
  source: string;
  target: string;
  sourceAmount: number;
  targetAmount: number;
  rate: number;
  rateType: string;
  expiresAt: string;
}

export interface WiseTransferStatus {
  id: number;
  status: string;
  statusReason?: string;
  created?: string;
  updated?: string;
  targetValue?: { deliveryEstimate?: string };
  [key: string]: any;
}

interface WiseRequestContext {
  apiKey?: string;
  wiseEnv?: string;
}

const getWiseBase = (wiseEnv?: string) =>
  wiseEnv === "sandbox" ? "https://api.sandbox.transferwise.tech" : "https://api.transferwise.com";

async function makeWiseRequest<T = any>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" = "GET",
  body?: unknown,
  context: WiseRequestContext = {}
): Promise<T> {
  const apiKey = context.apiKey || process.env.WISE_API_KEY;
  if (!apiKey) throw new Error("WISE_API_KEY not configured");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${getWiseBase(context.wiseEnv)}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      const err = new Error((data as any)?.message || `Wise API error: ${response.status}`);
      (err as any).status = response.status;
      throw err;
    }

    return data as T;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function getWiseQuote(request: WiseQuoteRequest, context: WiseRequestContext = {}) {
  const params = new URLSearchParams();
  params.append("sourceCurrency", request.sourceCurrency);
  params.append("targetCurrency", request.targetCurrency);

  if (request.sourceAmount) params.append("sourceAmount", request.sourceAmount.toString());
  else if (request.targetAmount) params.append("targetAmount", request.targetAmount.toString());
  else throw new Error("Either sourceAmount or targetAmount must be provided");

  return makeWiseRequest<WiseQuote>(`/v3/profiles/${process.env.WISE_PROFILE_ID}/quotes?${params}`, "GET", undefined, context);
}

export async function getWiseTransferStatus(
  transferId: string | number,
  context: WiseRequestContext = {}
) {
  return makeWiseRequest<WiseTransferStatus>(`/v1/transfers/${transferId}`, "GET", undefined, context);
}

