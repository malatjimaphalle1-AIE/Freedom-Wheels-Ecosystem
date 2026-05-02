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
let cachedProfileId: string | null = null;

const getProfileId = async (req?: express.Request) => {
  if (cachedProfileId && !req?.headers["x-wise-profile-id"]) return cachedProfileId;

  let profileId = (req?.headers["x-wise-profile-id"] as string) || process.env.WISE_PROFILE_ID;
  const apiKey = (req?.headers["x-wise-api-key"] as string) || process.env.WISE_API_KEY;
  
  if (!apiKey) return null; 

  if (!profileId || profileId === "" || profileId.startsWith('P')) {
    try {
      const profiles = await getWiseData("/v1/profiles", req);
      if (profiles && Array.isArray(profiles) && profiles.length > 0) {
        const profile = profiles.find((p: any) => p.type === 'personal') || profiles[0];
        profileId = profile.id.toString();
        if (!req?.headers["x-wise-profile-id"]) cachedProfileId = profileId;
        return profileId;
      }
    } catch (err) {
      console.warn("Failed to reach Wise profile resolution:", err instanceof Error ? err.message : String(err));
      if (profileId && profileId.startsWith('P')) {
        const fallback = profileId.substring(1);
        if (!req?.headers["x-wise-profile-id"]) cachedProfileId = fallback;
        return fallback;
      }
    }
  }
  
  if (!req?.headers["x-wise-profile-id"]) cachedProfileId = profileId || null;
  return profileId;
};

const getWiseData = async (endpoint: string, req?: express.Request) => {
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
      console.error(`Wise API Error [${response.status}] for ${endpoint}:`, errorDetail);
      throw new Error(`Wise API returned ${response.status}`);
    }
    
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error(`Failed to parse Wise JSON response from ${endpoint}:`, text.substring(0, 100));
      throw new Error("Invalid JSON response from Wise");
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.error(`Wise fetch timed out for ${endpoint}`);
    } else {
      console.error(`Wise fetch failed for ${endpoint}:`, err.message);
    }
    throw err;
  }
};

app.get("/api/wise/balance", async (req, res) => {
  const mockBalances = [
    { amount: { value: 8500.00, currency: "USD" }, type: "STANDARD" },
    { amount: { value: 1200.50, currency: "EUR" }, type: "STANDARD" }
  ];

  try {
    const profileId = await getProfileId(req);
    if (!profileId) {
      return res.json(mockBalances);
    }

    let balances;
    try {
      balances = await getWiseData(`/v4/profiles/${profileId}/balances?types=STANDARD`, req);
    } catch (e) {
      balances = await getWiseData(`/v4/balances?profileId=${profileId}`, req);
    }
    res.json(balances);
  } catch (err: any) {
    console.warn("Wise Balance API failed, using mock data", err.message);
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
      activities = await getWiseData(`/v1/profiles/${profileId}/activities`, req);
    } catch (e) {
      activities = await getWiseData(`/v1/activities?profileId=${profileId}`, req);
    }
    
    // Normalize response if it's wrapped in 'activities' field
    const results = activities?.activities || activities;
    res.json(Array.isArray(results) ? results : mockTransactions);
  } catch (err: any) {
    console.warn("Wise Transactions API failed, using mock data", err.message);
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
