import React, { useEffect, useState } from "react";
import { Search, Compass, Cpu, Settings, Sparkles, MessageSquare, ListFilter, PlayCircle, Loader2, Shield, Activity, Database, Server, CpuIcon } from "lucide-react";
import { Tenant, InventoryItem, Reservation, AgentStep } from "./types";
import MapLayout from "./components/MapLayout";
import AgentTerminal from "./components/AgentTerminal";
import InventoryView from "./components/InventoryView";
import CheckoutModal from "./components/CheckoutModal";

export default function App() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [catalogs, setCatalogs] = useState<InventoryItem[]>([]);
  const [filteredCatalogs, setFilteredCatalogs] = useState<InventoryItem[]>([]);
  
  // Active states
  const [userInput, setUserInput] = useState<string>("");
  const [activeStoreId, setActiveStoreId] = useState<string | undefined>(undefined);
  const [routeDestination, setRouteDestination] = useState<[number, number] | undefined>(undefined);
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  
  const [chatLogs, setChatLogs] = useState<{ sender: "user" | "concierge"; text: string }[]>([
    { sender: "concierge", text: "Hello! Welcome to the MallPulse Intelligence Concierge. Type a natural language request, e.g., 'Find a navy blue blazer under $200' to query mall-wide inventory." }
  ]);
  const [traces, setTraces] = useState<AgentStep[]>([]);
  const [latency, setLatency] = useState<number | undefined>(undefined);
  
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isReserving, setIsReserving] = useState<boolean>(false);

  // Initialize data from server APIS
  useEffect(() => {
    async function loadData() {
      try {
        const tenantsRes = await fetch("/api/data/tenants");
        const tenantsData = await tenantsRes.json();
        setTenants(tenantsData);

        const inventoryRes = await fetch("/api/data/inventory");
        const inventoryData = await inventoryRes.json();
        setCatalogs(inventoryData);
        setFilteredCatalogs(inventoryData);
      } catch (err) {
        console.error("Failed loading initial full-track database parameters: ", err);
      }
    }
    loadData();
  }, []);

  // Periodic simulated CHANGE STREAMS tracker to update visual count
  useEffect(() => {
    const handleInterval = setInterval(async () => {
      try {
        const inventoryRes = await fetch("/api/data/inventory");
        const inventoryData = await inventoryRes.json();
        setCatalogs(inventoryData);
        // Retain active filters
        if (activeStoreId) {
          setFilteredCatalogs(inventoryData.filter((col: any) => col.store_id === activeStoreId));
        } else {
          setFilteredCatalogs(inventoryData);
        }
      } catch (err) {
        console.warn("Change streams interval warning: ", err);
      }
    }, 10000);

    return () => clearInterval(handleInterval);
  }, [activeStoreId]);

  // Handle Search submit
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isSearching) return;

    const currentMsg = userInput;
    setUserInput("");
    setIsSearching(true);
    setChatLogs(prev => [...prev, { sender: "user", text: currentMsg }]);

    // Trigger Supervisor logic
    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentMsg, chat_history: "" })
      });
      const data = await response.json();

      setChatLogs(prev => [...prev, { sender: "concierge", text: data.response }]);
      
      // Update catalog matches
      if (data.matches && data.matches.length > 0) {
        setFilteredCatalogs(data.matches);
        // auto-highlight first match's store layout and enable route dest point
        const match = data.matches[0];
        setActiveStoreId(match.store_id);
        setRouteDestination(match.location);
      } else {
        // Fallback or clear
        setFilteredCatalogs(catalogs);
      }

      // Update tracing steps
      if (data.traces) {
        setTraces(data.traces);
      }
      if (data.duration_ms) {
        setLatency(data.duration_ms);
      }
    } catch (err) {
      console.error(err);
      setChatLogs(prev => [...prev, { sender: "concierge", text: "I encountered a communication error with our multi-agent core. Please retry." }]);
    } finally {
      setIsSearching(false);
    }
  };

  // Perform ACID hold reservation
  const handleReserve = async (item: InventoryItem, size: string) => {
    if (isReserving) return;
    setIsReserving(true);

    try {
      const response = await fetch("/api/agent/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: item._id,
          size,
          store_id: item.store_id
        })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setActiveReservation(data.reservation);
        // append reservation trace to terminal
        if (data.trace) {
          setTraces(prev => [data.trace, ...prev]);
        }
      } else {
        alert(data.error || "Reservation failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Hold transaction failed during ACID handshake.");
    } finally {
      setIsReserving(false);
    }
  };

  const handleSelectStoreFromMap = (storeId: string) => {
    setActiveStoreId(storeId);
    const store = tenants.find(t => t._id === storeId);
    if (store) {
      setRouteDestination(store.location.coordinates);
      setFilteredCatalogs(catalogs.filter(p => p.store_id === storeId));
    }
  };

  const handleClearFilters = () => {
    setActiveStoreId(undefined);
    setRouteDestination(undefined);
    setFilteredCatalogs(catalogs);
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#E2E8F0] flex flex-col font-sans overflow-x-hidden selection:bg-blue-600/30 selection:text-blue-200" id="mallpulse-app">
      
      {/* Top Header Navigation bar */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[#0F172A] sticky top-0 z-40 select-none">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]">
            M
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              MallPulse 
              <span className="text-blue-500 text-xs font-mono font-bold uppercase tracking-wider bg-blue-950 px-1.5 py-0.5 rounded border border-blue-900">
                v1.0.4-prod
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-800">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
            <span className="text-[10px] font-bold text-slate-350 tracking-widest uppercase">System Healthy</span>
          </div>
          <div className="hidden md:flex items-center space-x-4 text-xs font-mono">
            <span className="text-slate-400">GCP: <span className="text-white font-bold">us-central1</span></span>
            <span className="text-slate-400">DB: <span className="text-blue-400 italic font-bold">MongoDB Atlas</span></span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-mono text-slate-400">
            AI
          </div>
        </div>
      </header>

      {/* Main Inner Wrapper Split layout with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Control Column Design Aside */}
        <aside className="w-64 border-r border-slate-800 bg-[#0F172A] p-4 hidden lg:flex flex-col space-y-4 select-none flex-shrink-0">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold px-3 mb-2">COGNITIVE ARCHITECTURE</div>
            <div className="space-y-1.5">
              <button className="flex items-center space-x-3 w-full px-3 py-2 bg-blue-600/15 text-blue-400 border border-blue-600/20 rounded-lg text-xs font-semibold hover:bg-blue-600/20 transition-all text-left">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                <span>Agent Supervisor</span>
              </button>
              <button className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${isSearching ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 hover:bg-slate-800/60"}`}>
                <span className={`w-2 h-2 rounded-full ${isSearching ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`}></span>
                <span>Shopper Intell Unit</span>
              </button>
              <button className="flex items-center space-x-3 w-full px-3 py-2 text-slate-400 hover:bg-slate-800/60 rounded-lg text-xs font-medium text-left transition-all">
                <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                <span>Inventory Matrix</span>
              </button>
              <button className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${isReserving ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-slate-400 hover:bg-slate-800/60"}`}>
                <span className={`w-2 h-2 rounded-full ${isReserving ? "bg-amber-400 animate-bounce" : "bg-slate-600"}`}></span>
                <span>Fulfillment Engine</span>
              </button>
            </div>
          </div>
          
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold px-3 mb-2">SYSTEM METRICS</div>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span>CPU Throughput</span>
                  <span className="text-blue-400">14%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 w-[14%] h-full transition-all duration-500"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>RAM Allocator</span>
                  <span className="text-emerald-400">2.4GB / 4GB</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 w-[60%] h-full transition-all duration-500"></div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[8px] text-slate-500">
                <div>HOST: Cloud Run</div>
                <div>SCALE: Auto</div>
              </div>
            </div>
          </div>

          <div className="flex-1"></div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold px-3 mb-2">VARIABLES</div>
            <div className="space-y-1.5">
              <div className="bg-black/30 p-2 rounded-lg border border-slate-800/80">
                <div className="text-[9px] text-slate-500 mb-0.5">MONGODB_URI</div>
                <div className="text-[10px] font-mono text-emerald-400 truncate">srv://mallpulse.mongo.net/...</div>
              </div>
              <div className="bg-black/30 p-2 rounded-lg border border-slate-800/80">
                <div className="text-[9px] text-slate-500 mb-0.5">GCP_PROJECT</div>
                <div className="text-[10px] font-mono text-emerald-400 truncate">mallpulse-prod-3829</div>
              </div>
              <div className="bg-black/30 p-2 rounded-lg border border-slate-800/80">
                <div className="text-[9px] text-slate-500 mb-0.5">AGENT_SDK</div>
                <div className="text-[10px] font-mono text-emerald-400 truncate">@google/genai (1.5pro)</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <div className="flex-1 overflow-y-auto bg-[#020617] p-6">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6 pb-12">
            
            {/* Left side column logic: Map Layout Floor Plan & Chat Engine */}
            <section className="xl:col-span-8 flex flex-col space-y-6">
              
              {/* Floor Plan Card */}
              <div className="bg-[#0F172A]/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <MapLayout
                  tenants={tenants}
                  activeStoreId={activeStoreId}
                  routeDestination={routeDestination}
                />
              </div>

              {/* Chat Panel Box component */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden flex flex-col relative h-[360px] shadow-xl">
                <div className="px-5 py-3 border-b border-slate-850 bg-[#0F172A] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-400 animate-pulse" />
                    <span className="text-slate-200 text-xs font-bold uppercase tracking-wider">
                      Concierge Chat Terminal
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    OIDC SECURED HANDSHAKE PASS
                  </span>
                </div>

                {/* Messages feed */}
                <div className="flex-grow overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
                  {chatLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`flex ${log.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed transition-all ${
                          log.sender === "user"
                            ? "bg-blue-600 text-white font-medium shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
                            : "bg-[#0F172A]/80 border border-slate-800 text-slate-250 font-mono"
                        }`}
                      >
                        {log.text}
                      </div>
                    </div>
                  ))}
                  {isSearching && (
                    <div className="flex justify-start">
                      <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-400 font-mono flex items-center gap-2.5">
                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                        <span>GenAI Supervisor sequencing 2dsphere proximity toolchains...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Keyboard Text Area input bar */}
                <form onSubmit={handleSearch} className="border-t border-slate-800 bg-[#0F172A] p-4 flex gap-3">
                  <input
                    type="text"
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    placeholder="Ask Concierge, e.g., 'Do you have an iPad Pro on F2 under $1000?'"
                    className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono transition-all"
                    id="shopper-input"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-40 text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
                    id="search-submit-btn"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>COMMAND QUERY</span>
                  </button>
                </form>
              </div>

            </section>

            {/* Right side column: Terminal logs tracking & inventory matching */}
            <section className="xl:col-span-4 flex flex-col space-y-6">
              
              {/* Agent terminal step logs */}
              <div>
                <AgentTerminal steps={traces} latencyMs={latency} />
              </div>

              {/* Clear search filters flag banner */}
              {activeStoreId && (
                <div className="bg-blue-950/40 border border-blue-900/60 text-blue-300 p-3.5 rounded-xl flex items-center justify-between text-xs font-semibold shadow-inner">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                    <span>Evaluating store proximity matches layout...</span>
                  </div>
                  <button
                    onClick={handleClearFilters}
                    className="text-white hover:text-blue-200 hover:underline font-mono text-[10px] bg-blue-900/50 px-2 py-0.5 rounded border border-blue-800"
                    id="clear-filter-btn"
                  >
                    Reset Map
                  </button>
                </div>
              )}

              {/* Grid lists Catalog views */}
              <div className="bg-slate-900/30 p-1 border border-slate-850 rounded-2xl">
                <InventoryView
                  items={filteredCatalogs}
                  activeStoreId={activeStoreId}
                  onSelectStore={handleSelectStoreFromMap}
                  onReserve={handleReserve}
                />
              </div>

            </section>

          </div>
        </div>

      </div>

      {/* Checkout Transaction Modal overlay */}
      {activeReservation && (
        <CheckoutModal
          reservation={activeReservation}
          onClose={() => setActiveReservation(null)}
        />
      )}

      {/* Bottom Status Bar design elements */}
      <footer className="h-8 border-t border-slate-800 bg-[#0F172A] flex items-center justify-between px-6 text-[10px] text-slate-500 select-none">
        <div className="flex items-center space-x-4">
          <span>TERMINAL: <span className="text-white">Ready</span></span>
          <span className="hidden sm:inline">LOCK: <span className="text-white font-mono">OIDC-SECURE</span></span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-blue-500 font-black tracking-widest uppercase">Hackathon Mode Enabled</span>
          <span className="font-mono text-[9px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850">BUILD: 771ea92</span>
        </div>
      </footer>

    </div>
  );
}
