import express from "express";
import { createServer as createViteServer } from "vite";
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

// Wise API Integration
let cachedProfileId: Record<string, string> = {};

const getProfileId = async (req?: express.Request) => {
  const apiKey = (req?.headers["x-wise-api-key"] as string) || process.env.WISE_API_KEY;
  if (!apiKey) return null;

  const headerProfileId = req?.headers["x-wise-profile-id"] as string;
  if (headerProfileId) return headerProfileId;

  // Use API key as cache key to avoid collisions if multiple users use different keys
  const cacheKey = apiKey.substring(0, 10);
  if (cachedProfileId[cacheKey]) return cachedProfileId[cacheKey];

  let profileId = process.env.WISE_PROFILE_ID;
  
  if (!profileId || profileId === "" || profileId.startsWith('P')) {
    try {
      const profiles = await getWiseData("/v1/profiles", req);
      if (profiles && Array.isArray(profiles) && profiles.length > 0) {
        // Prefer business if available, then personal
        const profile = profiles.find((p: any) => p.type === 'business') || profiles.find((p: any) => p.type === 'personal') || profiles[0];
        profileId = profile.id.toString();
        cachedProfileId[cacheKey] = profileId;
        return profileId;
      }
    } catch (err) {
      console.warn("Failed to reach Wise profile resolution:", err instanceof Error ? err.message : String(err));
      // fallback logic if needed
    }
  }
  
  return profileId;
};

const getWiseData = async (endpoint: string, req?: express.Request, silent = false) => {
  const apiKey = (req?.headers["x-wise-api-key"] as string) || process.env.WISE_API_KEY;
  if (!apiKey) {
    throw new Error("WISE_API_KEY is not configured.");
  }
  
  const baseUrl = "https://api.transferwise.com";
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); 

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorDetail = "";
      try {
        errorDetail = await response.text();
      } catch (e) {
        errorDetail = "Could not read error body";
      }
      
      if (!silent || response.status !== 404) {
        console.error(`Wise API Error [${response.status}] for ${endpoint}:`, errorDetail);
      }
      
      let clientMessage = `Wise API Error: ${response.status}`;
      if (response.status === 401) clientMessage = "Wise Authentication Failed: Please check your API Key in Settings.";
      if (response.status === 403) clientMessage = "Wise Access Denied: Ensure your API Key has correct permissions and IP whitelising is disabled (or includes this server).";
      if (response.status === 404) clientMessage = "Wise Profile/Resource Not Found: Please verify your Profile ID.";
      
      const err = new Error(clientMessage);
      (err as any).status = response.status;
      throw err;
    }
    
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      if (!silent) console.error(`Failed to parse Wise JSON response from ${endpoint}:`, text.substring(0, 100));
      throw new Error("Invalid JSON response from Wise");
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (!silent) {
      if (err.name === 'AbortError') {
        console.error(`Wise fetch timed out for ${endpoint}`);
      } else {
        console.error(`Wise fetch failed for ${endpoint}:`, err.message);
      }
    }
    throw err;
  }
};

app.get("/api/wise/balance", async (req, res) => {
  const mockBalances = [
    { amount: { value: 8500.00, currency: "USD" }, type: "STANDARD", name: "Main_Vault" },
    { amount: { value: 1200.50, currency: "EUR" }, type: "STANDARD", name: "Sovereign_Euro" },
    { amount: { value: 0.00, currency: "GBP" }, type: "STANDARD", name: "London_Node" },
    { amount: { value: 0.00, currency: "ZAR" }, type: "STANDARD", name: "Cape_Town_Terminal" }
  ];

  try {
    const profileId = await getProfileId(req);
    if (!profileId) {
      return res.json(mockBalances);
    }

    // Try multiple endpoints to find where the balances are
    const endpoints = [
      `/v4/profiles/${profileId}/balances?types=STANDARD`,
      `/v4/profiles/${profileId}/balances?types=SAVINGS`,
      `/v4/balances?profileId=${profileId}`
    ];

    const results = await Promise.allSettled(endpoints.map(e => getWiseData(e, req, true)));
    
    let combinedBalances: any[] = [];
    let lastError: any = null;

    results.forEach((r, idx) => {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        combinedBalances = [...combinedBalances, ...r.value];
      } else if (r.status === 'rejected') {
        lastError = r.reason;
      }
    });

    if (combinedBalances.length === 0) {
      // One last try for multi-currency accounts
      try {
        const borderless = await getWiseData(`/v1/borderless-accounts?profileId=${profileId}`, req, true);
        if (borderless && borderless.length > 0 && borderless[0].balances) {
          combinedBalances = borderless[0].balances;
        }
      } catch (e) {
        if (!lastError) lastError = e;
      }
    }

    if (combinedBalances.length === 0 && lastError && (req?.headers["x-wise-api-key"] || process.env.WISE_API_KEY)) {
      return res.status(lastError.status || 500).json({ error: lastError.message });
    }

    res.json(combinedBalances.length > 0 ? combinedBalances : mockBalances);
  } catch (err: any) {
    console.warn("Wise Balance API protocol failure:", err.message);
    if (req?.headers["x-wise-api-key"] || process.env.WISE_API_KEY) {
      return res.status(err.status || 500).json({ error: err.message });
    }
    res.json(mockBalances);
  }
});

app.get("/api/wise/transactions", async (req, res) => {
  const mockTransactions = [
    { id: "m1", title: "Incoming Transfer", createdOn: new Date().toISOString(), amount: { value: 450.00, currency: "USD" }, status: "COMPLETED", type: "RECEIVE" },
    { id: "m2", title: "Payment to Vendor", createdOn: new Date(Date.now() - 86400000).toISOString(), amount: { value: -120.00, currency: "USD" }, status: "COMPLETED", type: "SEND" }
  ];

  try {
    const profileId = await getProfileId(req);
    if (!profileId) {
      return res.json(mockTransactions);
    }

    let activities;
    try {
      activities = await getWiseData(`/v1/profiles/${profileId}/activities`, req, true);
    } catch (e) {
      activities = await getWiseData(`/v1/activities?profileId=${profileId}`, req, true);
    }
    
    // Normalize response if it's wrapped in 'activities' field
    const results = activities?.activities || activities;
    res.json(Array.isArray(results) ? results : mockTransactions);
  } catch (err: any) {
    console.warn("Wise Transactions API failure:", err.message);
    if (req?.headers["x-wise-api-key"] || process.env.WISE_API_KEY) {
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
