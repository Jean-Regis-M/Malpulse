import React, { useEffect, useRef, useState } from "react";
import { Compass, MapPin, Navigation } from "lucide-react";

interface Tenant {
  _id: string;
  name: string;
  category: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  floor: number;
  unit: string;
}

interface MapLayoutProps {
  tenants: Tenant[];
  activeStoreId?: string;
  routeDestination?: [number, number]; // [X, Y]
}

export default function MapLayout({ tenants, activeStoreId, routeDestination }: MapLayoutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeFloor, setActiveFloor] = useState<number>(1);
  
  // Custom Mall Blueprint Coordinates
  // We mock standard walkways and paths for indoor blueprint navigation
  const shopperStart: [number, number] = [400, 480]; // long, lat relative points

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high density displays context scaling safely
    const width = 800;
    const height = 500;
    canvas.width = width;
    canvas.height = height;

    // Draw background grid slate theme canvas
    ctx.fillStyle = "#0f172a"; // deep charcoal
    ctx.fillRect(0, 0, width, height);

    // Subtle background guidelines grid
    ctx.strokeStyle = "rgba(51, 65, 85, 0.3)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw structured mall walls, halls & escalators for Level 1, 2, 3
    ctx.strokeStyle = "rgba(100, 116, 139, 0.4)";
    ctx.lineWidth = 3;
    
    // Main circular central atrium walkway
    ctx.beginPath();
    ctx.arc(400, 250, 120, 0, Math.PI * 2);
    ctx.stroke();

    // Galleria hallways
    ctx.beginPath();
    // West Atrium corridor
    ctx.moveTo(100, 250);
    ctx.lineTo(280, 250);
    // East Wing corridor
    ctx.moveTo(520, 250);
    ctx.lineTo(700, 250);
    // South main entrance corridor
    ctx.moveTo(400, 370);
    ctx.lineTo(400, 480);
    ctx.stroke();

    // Escalator/Lift indicators
    ctx.fillStyle = "rgba(99, 102, 241, 0.2)";
    ctx.strokeStyle = "rgba(99, 102, 241, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.fillRect(380, 110, 40, 25);
    ctx.strokeRect(380, 110, 40, 25);
    ctx.fillStyle = "#818cf8";
    ctx.font = "9px monospace";
    ctx.fillText("ESC/LIFT", 384, 126);

    // Draw active tenant stores filtered by target Floor
    tenants.forEach(item => {
      if (item.floor !== activeFloor) return;

      const [x, y] = item.location.coordinates;
      const isSelected = item._id === activeStoreId;

      // Draw Store Outlines
      ctx.fillStyle = isSelected ? "rgba(224, 242, 254, 0.08)" : "rgba(30, 41, 59, 0.7)";
      ctx.strokeStyle = isSelected ? "#38bdf8" : "rgba(148, 163, 184, 0.4)";
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      
      const storeWidth = 110;
      const storeHeight = 60;
      const rx = x - storeWidth / 2;
      const ry = y - storeHeight / 2;

      ctx.fillRect(rx, ry, storeWidth, storeHeight);
      ctx.strokeRect(rx, ry, storeWidth, storeHeight);

      // Store Title text
      ctx.fillStyle = isSelected ? "#38bdf8" : "#f8fafc";
      ctx.font = isSelected ? "bold 11px system-ui" : "10px system-ui";
      ctx.fillText(item.name.split(" ")[0], rx + 10, ry + 25);
      
      ctx.fillStyle = isSelected ? "#7dd3fc" : "#94a3b8";
      ctx.font = "9px monospace";
      ctx.fillText(`Unit ${item.unit}`, rx + 10, ry + 42);

      // Glow pin location
      ctx.fillStyle = isSelected ? "#06b6d4" : "#cbd5e1";
      ctx.beginPath();
      ctx.arc(x, y + 15, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Shopper current position indicator
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#10b981";
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(shopperStart[0], shopperStart[1], 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0; // reset
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px system-ui";
    ctx.fillText("YOU", shopperStart[0] - 8, shopperStart[1] - 13);

    // DRAW ROUTE / PATHFINDING
    if (routeDestination) {
      const [destX, destY] = routeDestination;

      // Draw beautiful dynamic path
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#38bdf8";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 4.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Dash path animation
      ctx.setLineDash([8, 6]);
      // Draw path with simple path points from start walkway to main atrium then dest
      ctx.beginPath();
      ctx.moveTo(shopperStart[0], shopperStart[1]); // 南 entrance
      
      // Atrium central point
      ctx.lineTo(400, 250);
      
      // To target store coordinates
      ctx.lineTo(destX, destY);
      ctx.stroke();

      ctx.setLineDash([]); // Reset
      ctx.shadowBlur = 0;

      // Target store marker pin
      ctx.fillStyle = "#fb7185";
      ctx.beginPath();
      ctx.arc(destX, destY, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [tenants, activeFloor, activeStoreId, routeDestination]);

  // Adjust active floor when store selected changes
  useEffect(() => {
    if (activeStoreId) {
      const matched = tenants.find(t => t._id === activeStoreId);
      if (matched) {
        setActiveFloor(matched.floor);
      }
    }
  }, [activeStoreId, tenants]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative flex flex-col h-full" id="map-widget">
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-indigo-400 animate-pulse" />
          <span className="text-white text-sm font-medium font-sans">Mall Pulse Floor Layout Engine</span>
        </div>
        <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
          {[1, 2, 3].map(floor => (
            <button
              key={floor}
              onClick={() => setActiveFloor(floor)}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                activeFloor === floor
                  ? "bg-indigo-600 text-white shadow-md font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              id={`floor-btn-${floor}`}
            >
              F{floor}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex-grow bg-slate-950 flex items-center justify-center p-2 overflow-auto min-h-[380px]">
        <canvas
          ref={canvasRef}
          className="rounded-lg shadow-inner max-w-full max-h-full"
          style={{ width: "800px", height: "500px" }}
        />
        <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur border border-slate-800 p-3 rounded-lg text-[10px] font-mono text-slate-400 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block ring-2 ring-emerald-500/20" />
            <span>Shopper (Walkway Level 1 Entrance)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] inline-block ring-2 ring-[#38bdf8]/20" />
            <span>Target Tenant Store Location</span>
          </div>
          {routeDestination && (
            <div className="flex items-center gap-2 text-sky-400 animate-pulse">
              <Navigation className="w-3 h-3 text-sky-400" />
              <span>Dashed Route Pathfinding Active</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
