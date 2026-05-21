export interface Tenant {
  _id: string;
  name: string;
  category: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [Longitude, Latitude] or relative [X, Y]
  };
  floor: number;
  unit: string;
  rating: number;
  hours: string;
}

export interface InventoryItem {
  _id: string;
  store_id: string;
  store_name?: string; // Hydrated for UI convenience
  product_name: string;
  description: string;
  price: number;
  category: string;
  variants: {
    size: string;
    stock_level: number;
  }[];
  image?: string;
  floor?: number;
  unit?: string;
  location?: [number, number];
}

export interface Reservation {
  _id: string;
  shopper_id: string;
  store_id: string;
  store_name: string;
  sku: string;
  product_name: string;
  selected_size: string;
  status: "PENDING" | "CONFIRMED" | "EXPIRED";
  created_at: string;
  expires_at: string;
}

export interface AgentStep {
  id: string;
  timestamp: string;
  agent: "Supervisor" | "Shopper Intel" | "Inventory Locator" | "Fulfillment Coord";
  action: string;
  details: string;
  status: "success" | "pending" | "error";
  duration_ms?: number;
}

export interface SystemMetrics {
  search_latency_ms: number;
  sync_latency_ms: number;
  transaction_duration_ms: number;
  warm_up_time_sec: number;
}
