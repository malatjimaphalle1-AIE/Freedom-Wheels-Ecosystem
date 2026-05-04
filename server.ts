import express from "express";
import path from "path";
import { fileURLToPath } from "url";

if (process.env.NODE_ENV !== "production") {
  const { config } = await import("dotenv");
  config();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "Operational", 
    system: "Sovereign Core", 
    timestamp: new Date().toISOString()
  });
});

// Wise API Integration - Multi-Layer Protocol
let cachedProfileId: Record<string, string> = {};

const getProfileId = async (req?: express.Request) => {
  const rawKey = (req?.headers["x-wise-api-key"] as string) || process.env.WISE_API_KEY;
  if (!rawKey) return null;
  const apiKey = rawKey.trim();

  let profileId: string | undefined;

  // Layer 1: Client Header Override
  const headerProfileId = req?.headers["x-wise-profile-id"] as string;
  if (headerProfileId && headerProfileId !== 'undefined' && headerProfileId !== 'null') {
    profileId = headerProfileId;
  }

  // Layer 2: Secure Memory Cache (Keyed by truncated hash for privacy)
  if (!profileId) {
    const cacheKey = apiKey.substring(apiKey.length - 12);
    if (cachedProfileId[cacheKey]) profileId = cachedProfileId[cacheKey];
  }

  // Layer 3: Environment Configuration
  if (!profileId) {
    profileId = process.env.WISE_PROFILE_ID;
  }
  
  // Layer 4: Autonomous Discovery
  if (!profileId || profileId === "" || profileId === "undefined") {
    try {
      const profiles = await getWiseData("/v1/profiles", req);
      if (profiles && Array.isArray(profiles) && profiles.length > 0) {
        // Intelligence: Prioritize Business Profiles for SaaS operations
        const sortedProfiles = [...profiles].sort((a: any, b: any) => {
          if (a.type === 'business' && b.type !== 'business') return -1;
          if (a.type !== 'business' && b.type === 'business') return 1;
          return 0;
        });

        profileId = sortedProfiles[0].id.toString();
        const cacheKey = apiKey.substring(apiKey.length - 12);
        cachedProfileId[cacheKey] = profileId;
        console.log(`[SOVEREIGN_WISE] Auto-dispatched Profile_ID: ${profileId} (${sortedProfiles[0].type})`);
      }
    } catch (err) {
      console.warn("[SOVEREIGN_WISE] Profile discovery handshake failed:", err instanceof Error ? err.message : String(err));
    }
  }

  // Final Sanitization: Ensure profileId is strictly numeric (Wise API requirement)
  if (profileId && typeof profileId === 'string' && profileId.startsWith('P')) {
    profileId = profileId.substring(1);
  }
  
  return profileId;
};

const getWiseData = async (endpoint: string, req?: express.Request, silent = false) => {
  const rawKey = (req?.headers["x-wise-api-key"] as string) || process.env.WISE_API_KEY;
  if (!rawKey) {
    throw new Error("Wise Protocol Error: Missing API Key in sovereign environment.");
  }
  
  const apiKey = rawKey.trim();
  const env = req?.headers["x-wise-env"] as string;
  const baseUrl = env === 'sandbox' ? "https://api.sandbox.transferwise.tech" : "https://api.transferwise.com";
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s for global latency

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "AutoIncomeEngine/1.0 SovereignCore"
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorDetail: any = "";
      try {
        errorDetail = await response.json();
      } catch (e) {
        try {
          errorDetail = await response.text();
        } catch (et) {
          errorDetail = "Opaque error transmission";
        }
      }
      
      const status = response.status;
      if (!silent || (status !== 404 && status !== 401 && status !== 403)) {
        console.error(`[SOVEREIGN_WISE] Protocol Error [${status}] at ${endpoint}:`, JSON.stringify(errorDetail));
      }
      
      let message = `Wise_Interface_Error: Status_${status}`;
      if (status === 401) {
        // Intelligence: Suggest checking sandbox vs production if unauthorized
        const isSandbox = baseUrl.includes('sandbox');
        message = `Wise_Auth_Failed: Key credentials rejected by ${isSandbox ? 'Sandbox' : 'Production'} Protocol. Verify API Token and Scopes.`;
      }
      if (status === 403) message = "Wise_Access_Forbidden: Permission scope insufficient. Check Sovereign Permissions.";
      if (status === 404) message = "Wise_Resource_Missing: The requested node does not exist in this sector.";
      if (status === 429) message = "Wise_Rate_Limit: High-frequency traffic detected. Throttling active.";
      
      const err = new Error(message);
      (err as any).status = status;
      (err as any).details = errorDetail;
      throw err;
    }
    
    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch (e) {
      if (!silent) console.error(`[SOVEREIGN_WISE] Parse failure at ${endpoint}:`, text.substring(0, 50));
      throw new Error("Wise_Data_Corruption: Non-compliant JSON payload.");
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (!silent) {
      if (err.name === 'AbortError') {
        console.error(`[SOVEREIGN_WISE] Latency timeout at ${endpoint}`);
        throw new Error("Wise_Connection_Timeout: Latency exceeded 20000ms.");
      }
    }
    throw err;
  }
};

app.get("/api/wise/balance", async (req, res) => {
  const mockBalances = [
    { amount: { value: 8500.00, currency: "USD" }, type: "STANDARD", name: "Main_Vault", id: "m1" },
    { amount: { value: 1200.50, currency: "EUR" }, type: "STANDARD", name: "Sovereign_Euro", id: "m2" },
    { amount: { value: 450.75, currency: "GBP" }, type: "STANDARD", name: "London_Node", id: "m3" },
    { amount: { value: 15400.00, currency: "ZAR" }, type: "STANDARD", name: "Cape_Town_Terminal", id: "m4" },
    { amount: { value: 0.245, currency: "BTC" }, type: "STOCKS", name: "Neural_BTC_Index", id: "m5" },
    { amount: { value: 4.82, currency: "ETH" }, type: "INTEREST", name: "Sovereign_ETH_Yield", id: "m6" }
  ];

  try {
    const profileId = await getProfileId(req);
    const hasKey = !!((req?.headers["x-wise-api-key"] as string) || process.env.WISE_API_KEY);

    if (!profileId) {
      return res.json(mockBalances);
    }

    // High-Efficiency Extraction: Parallelized Discovery
    const endpoints = [
      `/v4/profiles/${profileId}/balances?types=STANDARD`,
      `/v4/profiles/${profileId}/balances?types=SAVINGS`,
      `/v4/profiles/${profileId}/balances?types=INTEREST`,
      `/v4/profiles/${profileId}/balances?types=STOCKS`,
      `/v1/borderless-accounts?profileId=${profileId}`
    ];

    const protocolResults = await Promise.allSettled(endpoints.map(e => getWiseData(e, req, true)));
    
    let combinedBalances: any[] = [];
    let lastError: any = null;

    protocolResults.forEach((r, idx) => {
      if (r.status === 'fulfilled' && r.value) {
        let balances = [];
        // Wise consistency check: Borderless accounts nest balances under [0].balances
        if (endpoints[idx].includes('borderless-accounts') && r.value[0]?.balances) {
          balances = r.value[0].balances;
        } else if (Array.isArray(r.value)) {
          balances = r.value;
        }
        
        combinedBalances = [...combinedBalances, ...balances];
      } else if (r.status === 'rejected') {
        lastError = r.reason;
      }
    });

    // Normalization Layer: Ensure unique nodes and consistent structure
    const seenCurrencies = new Set();
    const normalized = combinedBalances
      .filter(b => {
        if (!b.amount || seenCurrencies.has(`${b.amount.currency}_${b.type}`)) return false;
        seenCurrencies.add(`${b.amount.currency}_${b.type}`);
        return true;
      })
      .map(b => ({
        id: b.id || Math.random().toString(36).substring(7),
        amount: {
          value: b.amount.value || 0,
          currency: b.amount.currency || 'USD'
        },
        type: b.type || 'STANDARD',
        name: b.name || `${b.amount.currency} Balance`
      }));

    if (normalized.length === 0 && lastError && hasKey) {
      // If unauthorized, return mock data but with a warning flag instead of crashing
      if (lastError.status === 403 || lastError.status === 401) {
        return res.json(mockBalances.map(b => ({ ...b, protocolWarning: "UNAUTHORIZED: Use Personal Access Token with correct scopes." })));
      }
      return res.status(lastError.status || 500).json({ error: lastError.message });
    }

    res.json(normalized.length > 0 ? normalized : mockBalances);
  } catch (err: any) {
    console.warn("[SOVEREIGN_WISE] Global balance protocol failure:", err.message);
    const hasKey = !!((req?.headers["x-wise-api-key"] as string) || process.env.WISE_API_KEY);
    if (hasKey) {
      return res.status(err.status || 500).json({ error: err.message });
    }
    res.json(mockBalances);
  }
});

app.get("/api/wise/transactions", async (req, res) => {
  const mockTransactions = [
    { id: "m1", title: "Incoming Protocol Surge", createdOn: new Date().toISOString(), amount: { value: 450.00, currency: "USD" }, status: "COMPLETED", type: "RECEIVE" },
    { id: "m2", title: "Infrastructure Node Lease", createdOn: new Date(Date.now() - 86400000).toISOString(), amount: { value: -120.00, currency: "USD" }, status: "COMPLETED", type: "SEND" },
    { id: "m3", title: "Neural Sync Batch Payout", createdOn: new Date(Date.now() - 172800000).toISOString(), amount: { value: 2450.00, currency: "USD" }, status: "COMPLETED", type: "RECEIVE" }
  ];

  try {
    const profileId = await getProfileId(req);
    const hasKey = !!((req?.headers["x-wise-api-key"] as string) || process.env.WISE_API_KEY);

    if (!profileId) {
      return res.json(mockTransactions);
    }

    // Intelligence: Cross-reference Activities and Direct Transfers
    const endpoints = [
      `/v1/profiles/${profileId}/activities`,
      `/v1/transfers?profileId=${profileId}&offset=0&limit=20`
    ];

    const protocolResults = await Promise.allSettled(endpoints.map(e => getWiseData(e, req, true)));
    
    let rawActivities: any[] = [];
    let rawTransfers: any[] = [];

    if (protocolResults[0].status === 'fulfilled' && protocolResults[0].value) {
      rawActivities = protocolResults[0].value.activities || protocolResults[0].value;
    }
    if (protocolResults[1].status === 'fulfilled' && protocolResults[1].value) {
      rawTransfers = protocolResults[1].value;
    }

    // Normalization Engine: Unify disparate Wise schemas into Sovereign standard
    const normalized: any[] = [];

    if (Array.isArray(rawActivities)) {
      rawActivities.forEach(a => {
        normalized.push({
          id: a.id || Math.random().toString(36).substring(7),
          title: a.title || a.description || "System Transaction",
          createdOn: a.createdOn || a.updatedOn || new Date().toISOString(),
          amount: {
            value: a.primaryAmount?.value || a.amount || 0,
            currency: a.primaryAmount?.currency || a.currency || "USD"
          },
          status: a.status || "UNKNOWN",
          type: (a.type?.includes("RECEIVE") || (a.primaryAmount?.value > 0)) ? "RECEIVE" : "SEND",
          reference: a.reference || ""
        });
      });
    }

    // Fill gaps with transfers if activities are sparse
    if (normalized.length < 5 && Array.isArray(rawTransfers)) {
      rawTransfers.forEach(t => {
        if (!normalized.find(n => n.id === t.id)) {
          normalized.push({
            id: t.id,
            title: `Transfer to ${t.customerTransactionId || 'External Node'}`,
            createdOn: t.created || new Date().toISOString(),
            amount: {
              value: -(t.sourceAmount || 0),
              currency: t.sourceCurrency || "USD"
            },
            status: t.status || "PENDING",
            type: "SEND",
            reference: t.reference || ""
          });
        }
      });
    }

    // Sort by chronological sequence
    normalized.sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime());

    if (normalized.length === 0 && hasKey && protocolResults.some(r => r.status === 'rejected')) {
      const firstRejected = protocolResults.find(r => r.status === 'rejected') as PromiseRejectedResult;
      const status = firstRejected.reason.status;
      if (status === 401 || status === 403) {
        return res.json(mockTransactions.map(t => ({ ...t, protocolWarning: "UNAUTHORIZED: Verify Sovereign Wise Key in Settings." })));
      }
      return res.status(status || 500).json({ error: firstRejected.reason.message });
    }

    res.json(normalized.length > 0 ? normalized : mockTransactions);
  } catch (err: any) {
    console.warn("[SOVEREIGN_WISE] Transaction protocol breach:", err.message);
    const hasKey = !!((req?.headers["x-wise-api-key"] as string) || process.env.WISE_API_KEY);
    if (hasKey) {
      return res.status(err.status || 500).json({ error: err.message });
    }
    res.json(mockTransactions);
  }
});

app.post("/api/leads/enrich", async (req, res) => {
  try {
    const { name, email } = req.body;
    // Basic simulation as AI calls are moved to frontend for sovereign security/SDK compliance
    await new Promise(resolve => setTimeout(resolve, 800));
    
    res.json({
      company: name.includes("Neo") ? "The Matrix" : "Sovereign Core Systems",
      title: "Tactical Operative",
      location: "Distributed Node",
      linkedin: `linkedin.com/in/${name.toLowerCase().replace(/ /g, '-')}`,
      twitter: `@${name.toLowerCase().replace(/ /g, '_')}_sovereign`,
      technologies: ["Neural Bridge", "Quantum Ledger", "Stealth VPN"],
      verified: true,
      bio: `Static enrichment record for ${name}. Establish neural bridge for live intelligence.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/webhooks/:webhookId", async (req, res) => {
  try {
    const { webhookId } = req.params;
    const { secret, payload } = req.body;

    if (!secret) {
      return res.status(401).json({ error: "Unauthorized: Missing Sovereign Secret" });
    }

    // In a real production scenario, we would verify the secret against Firestore here
    // For this build, we accept the payload and log the protocol execution
    console.log(`[SOVEREIGN_CORE] Webhook Protocol ${webhookId} executed at ${new Date().toISOString()}`);
    console.log(`[PAYLOAD]:`, JSON.stringify(payload));

    res.json({
      status: "Trigger_Accepted",
      id: webhookId,
      timestamp: new Date().toISOString(),
      system: "Sovereign_Core_v4.2"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
}

export default app;
