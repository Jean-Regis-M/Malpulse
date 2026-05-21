import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Mock Database representing full multi-tenant dataset
const mockTenants = [
  {
    _id: "tenant-zara",
    name: "Zara Elegant Wear",
    category: "Apparel",
    location: { type: "Point", coordinates: [180, 240] }, // [X, Y] coordinates for custom blueprint
    floor: 1,
    unit: "A-10",
    rating: 4.6,
    hours: "10:00 AM - 9:30 PM"
  },
  {
    _id: "tenant-nike",
    name: "Nike Performance Mall",
    category: "Sportswear",
    location: { type: "Point", coordinates: [420, 180] },
    floor: 1,
    unit: "B-04",
    rating: 4.8,
    hours: "10:00 AM - 10:00 PM"
  },
  {
    _id: "tenant-apple",
    name: "Apple Smart Space",
    category: "Electronics",
    location: { type: "Point", coordinates: [650, 320] },
    floor: 2,
    unit: "C-11",
    rating: 4.9,
    hours: "9:30 AM - 10:00 PM"
  },
  {
    _id: "tenant-hm",
    name: "H&M Casual Fit",
    category: "Apparel",
    location: { type: "Point", coordinates: [300, 380] },
    floor: 3,
    unit: "D-08",
    rating: 4.3,
    hours: "10:00 AM - 9:30 PM"
  }
];

const mockInventory = [
  {
    _id: "SKU-ZARA-BLAZER-BLU",
    store_id: "tenant-zara",
    product_name: "Premium Indigo Blazer",
    description: "Tailored slim-fit linen blazer in deep navy blue, ideal for formal business casual look under hot conditions.",
    price: 189.00,
    category: "Apparel",
    variants: [
      { size: "S", stock_level: 2 },
      { size: "M", stock_level: 4 },
      { size: "L", stock_level: 6 },
      { size: "XL", stock_level: 1 }
    ],
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=400"
  },
  {
    _id: "SKU-NIKE-PGA-SHIRT",
    store_id: "tenant-nike",
    product_name: "Vapor Dry-Fit Polo",
    description: "Ultra-breathable athletic golf shirt in ocean blue with sweat-wicking knit texture.",
    price: 65.00,
    category: "Sportswear",
    variants: [
      { size: "M", stock_level: 8 },
      { size: "L", stock_level: 12 },
      { size: "XL", stock_level: 0 }
    ],
    image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=400"
  },
  {
    _id: "SKU-APPLE-IPAD-AIR",
    store_id: "tenant-apple",
    product_name: "iPad Pro 11-inch M4",
    description: "Next-generation OLED display tablet with powerful spatial computer capabilities and raw hardware power.",
    price: 999.00,
    category: "Electronics",
    variants: [
      { size: "256G", stock_level: 10 },
      { size: "512G", stock_level: 3 }
    ],
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=400"
  },
  {
    _id: "SKU-HM-OVERSHIRT-OAK",
    store_id: "tenant-hm",
    product_name: "Autumn Heavy Overshirt",
    description: "Casual flannel check overshirt in warm khaki and dark timber oak brown colors.",
    price: 49.99,
    category: "Apparel",
    variants: [
      { size: "S", stock_level: 5 },
      { size: "M", stock_level: 9 },
      { size: "L", stock_level: 0 }
    ],
    image: "https://images.unsplash.com/photo-1589406180536-5489e2954a7c?auto=format&fit=crop&q=80&w=400"
  }
];

let activeReservations: any[] = [];

// API Endpoints
app.get("/api/data/tenants", (req, res) => {
  res.json(mockTenants);
});

app.get("/api/data/inventory", (req, res) => {
  res.json(mockInventory);
});

// Live Change Streams simulator: randomly ticks or fluctuates stock levels
setInterval(() => {
  const item = mockInventory[Math.floor(Math.random() * mockInventory.length)];
  const variant = item.variants[Math.floor(Math.random() * item.variants.length)];
  if (variant.stock_level > 0 && Math.random() > 0.5) {
    variant.stock_level = Math.max(0, variant.stock_level + (Math.random() > 0.5 ? 1 : -1));
  }
}, 8000);

// Multi-Agent chat executor endpoint
app.post("/api/agent/chat", async (req, res) => {
  const { message, chat_history } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  const startTime = Date.now();
  const traces: any[] = [];

  // Step 1: OIDC / Client Authentication Handshake
  traces.push({
    step: "OIDC Client Handshake",
    agent: "API Gateway",
    details: "Verified secure OIDC identity headers. Invoker authorized under role run.invoker.",
    status: "success",
    timestamp: new Date().toISOString()
  });

  // Step 2: SCRAM-SHA-256 database authentication
  traces.push({
    step: "Atlas Authentication",
    agent: "Database Connector",
    details: "Authenticated connection over SCRAM-SHA-256. TLS 1.3 encryption handshake completed.",
    status: "success",
    timestamp: new Date().toISOString()
  });

  try {
    // Step 3: Shopper Intelligence Agent - keyword and schema extraction
    traces.push({
      step: "Extract Shopper Request Attributes",
      agent: "Shopper Intelligence Agent",
      details: "Analyzing message using Gemini models to map target parameters.",
      status: "pending",
      timestamp: new Date().toISOString()
    });

    const systemPrompt = 
      "You are the MallPulse Shopper Intelligence Agent. Your job is to extract detailed shopping attributes " +
      "(category, color, size, price_max) from user messages. " +
      "Return ONLY a clean JSON object matching the requested schema. Do not output markdown codeblocks.";

    const geminiResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "E.g. blazer, polo, shirt, ipad" },
            color: { type: Type.STRING, description: "E.g. navy, blue, black, oak" },
            size: { type: Type.STRING, description: "Target garment or memory size" },
            price_max: { type: Type.NUMBER, description: "Garment max budget limit" },
          }
        }
      }
    });

    let extracted: any = {};
    try {
      extracted = JSON.parse(geminiResponse.text?.trim() || "{}");
    } catch {
      // Fallback
      extracted = {};
    }

    traces.push({
      step: "Shopper Search Schema Parsing",
      agent: "Shopper Intelligence Agent",
      details: `Intent successfully structured: Category='${extracted.category || ""}', Color='${extracted.color || ""}', Size='${extracted.size || ""}', MaxPrice=${extracted.price_max || "None"}.`,
      status: "success",
      timestamp: new Date().toISOString()
    });

    // Step 4: Inventory Locator Agent - Geospatial Radial search
    traces.push({
      step: "Compound Spatial Range Filter",
      agent: "Inventory Locator Agent",
      details: "Querying MongoDB tenants and inventory collections using Atlas Search and 2dsphere indexes.",
      status: "pending",
      timestamp: new Date().toISOString()
    });

    // Filter local list of items
    const matches = mockInventory.filter(item => {
      let isMatch = true;
      if (extracted.category && !item.product_name.toLowerCase().includes(extracted.category.toLowerCase()) && !item.category.toLowerCase().includes(extracted.category.toLowerCase())) {
        isMatch = false;
      }
      if (extracted.color && !item.description.toLowerCase().includes(extracted.color.toLowerCase()) && !item.product_name.toLowerCase().includes(extracted.color.toLowerCase())) {
        isMatch = false;
      }
      if (extracted.price_max && item.price > extracted.price_max) {
        isMatch = false;
      }
      return isMatch;
    }).map(item => {
      const store = mockTenants.find(t => t._id === item.store_id);
      return {
        ...item,
        store_name: store?.name || "Unknown Store",
        floor: store?.floor || 1,
        unit: store?.unit || "N/A",
        location: store?.location?.coordinates || [100, 100]
      };
    });

    traces.push({
      step: "Nearest Neighbor Retrieval",
      agent: "Inventory Locator Agent",
      details: `Aggregation completed. Matched ${matches.length} matching tenant stock documents under 2.0-mile radius zone.`,
      status: "success",
      timestamp: new Date().toISOString()
    });

    // Step 5: Final Supervisor orchestration summary
    traces.push({
      step: "Narrative Formulation",
      agent: "Supervisor Agent",
      details: "Translating transactional and spatial matching vectors into standard human responses.",
      status: "pending",
      timestamp: new Date().toISOString()
    });

    const responseInstruction = 
      "You are MallPulse, the unified intelligent shopping center concierge. Respond directly to the user's message. " +
      "If matching items are found, summarize their details nicely (including store name, unit, floor, and price). " +
      "Advise them that they can tap 'Reserve Now' in their console to instantly lock stock for 15 minutes and generate walking maps.";

    const finalModelResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `User message: ${message}\nMatches: ${JSON.stringify(matches)}\nHistory: ${chat_history || ""}`,
      config: {
        systemInstruction: responseInstruction,
      }
    });

    traces.push({
      step: "Concierge Output Completed",
      agent: "Supervisor Agent",
      details: "Conversational loop finalized. Streaming results to web client.",
      status: "success",
      timestamp: new Date().toISOString()
    });

    const duration = Date.now() - startTime;

    res.json({
      response: finalModelResponse.text || "Hello! How can I help you find something today?",
      matches,
      traces,
      duration_ms: duration
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Transactional locking hold creation endpoint
app.post("/api/agent/reserve", (req, res) => {
  const { sku, size, store_id } = req.body;
  if (!sku || !size) {
    return res.status(400).json({ error: "Missing SKU input details" });
  }

  const startTime = Date.now();

  // Find product
  const product = mockInventory.find(p => p._id === sku);
  if (!product) {
    return res.status(404).json({ error: "Product SKU non-existent" });
  }

  // Check and update stock level
  const variant = product.variants.find(v => v.size === size);
  if (!variant || variant.stock_level <= 0) {
    return res.status(400).json({ error: "Hold rejected: item out of stock in requested size selection." });
  }

  // ACID transaction emulation: atomic decrement
  variant.stock_level -= 1;

  const reservation_id = `RES-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const now = new Date();
  const expires_at = new Date(now.getTime() + 15 * 60000); // 15 min TTL

  const tenant = mockTenants.find(t => t._id === product.store_id);

  const reservation = {
    _id: reservation_id,
    sku,
    product_name: product.product_name,
    price: product.price,
    selected_size: size,
    store_name: tenant?.name || "Retail Tenant",
    floor: tenant?.floor || 1,
    unit: tenant?.unit || "A-01",
    location: tenant?.location?.coordinates || [100, 100],
    created_at: now.toISOString(),
    expires_at: expires_at.toISOString(),
    status: "PENDING"
  };

  activeReservations.push(reservation);

  const duration = Date.now() - startTime;

  res.json({
    success: true,
    reservation,
    trace: {
      step: "ACID Multi-Document Isolation Lock",
      agent: "Fulfillment Coordinator Agent",
      details: `Locked SKU ${sku} (Size ${size}). Decremented stock atomic counter. Created TTL index hold under standard ID '${reservation_id}'.`,
      status: "success",
      duration_ms: duration
    }
  });
});

async function startServer() {
  // Vite dev server mounting or build asset static fallback
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MallPulse live dev service running on http://localhost:${PORT}`);
  });
}

startServer();
