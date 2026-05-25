/**
 * Lightweight Wise client without axios dependency.
 * This file exists to satisfy imports that previously expected an axios-based client.
 */

export interface WiseClientConfig {
  apiKey: string;
  baseUrl?: string;
}

const DEFAULT_BASE_URL = "https://api.wise.com";

export class WiseClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: WiseClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  }

  async get<T = unknown>(endpoint: string): Promise<T> {
    return this.request<T>("GET", endpoint);
  }

  async post<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", endpoint, body);
  }

  private async request<T>(method: "GET" | "POST", endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error((data as any)?.message || `Wise API error: ${response.status}`);
    }

    return data as T;
  }
}

export default WiseClient;
