import React from "react";
import { Terminal, Shield, Cpu, Database, Activity } from "lucide-react";
import { AgentStep } from "../types";

interface AgentTerminalProps {
  steps: AgentStep[];
  latencyMs?: number;
}

export default function AgentTerminal({ steps, latencyMs }: AgentTerminalProps) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col font-mono h-full" id="agent-terminal">
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400 animate-pulse" />
          <span className="text-white text-xs font-bold leading-none">AGENT COGNITIVE LOGS & TRACING</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-emerald-950/80 border border-emerald-900 px-2 py-0.5 rounded text-[10px]">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-300">OIDC SECURE</span>
          </div>
          {latencyMs && (
            <div className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded flex items-center gap-1 border border-slate-700">
              <Activity className="w-3 h-3 text-yellow-400" />
              <span>{latencyMs}ms</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 flex-grow overflow-y-auto max-h-[350px] space-y-3 scrollbar-thin scrollbar-thumb-slate-800 text-[11px] leading-relaxed">
        {steps.length === 0 ? (
          <div className="text-slate-500 h-full flex flex-col items-center justify-center py-10">
            <Cpu className="w-8 h-8 opacity-20 mb-2 animate-spin text-indigo-400" />
            <p>System Idle. Waiting for User Shopping Request...</p>
          </div>
        ) : (
          steps.map((st, idx) => {
            const isPending = st.status === "pending";
            const isError = st.status === "error";

            return (
              <div key={st.id || idx} className="border-l-2 border-indigo-500 pl-4 py-1 relative hover:bg-slate-900/40 transition-all rounded-r">
                <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-indigo-500 border border-slate-950" />
                <div className="flex items-start justify-between text-slate-400 mb-0.5">
                  <span className="font-bold text-indigo-300 text-[11px] uppercase tracking-wider">{st.agent}</span>
                  <span className="text-[9px] text-slate-500">{st.timestamp}</span>
                </div>
                <div className="text-white text-[12px] font-bold mb-1">{st.action}</div>
                <p className="text-slate-300 text-[11px] font-mono leading-relaxed">{st.details}</p>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-slate-850 px-4 py-2 flex items-center justify-between text-[9px] bg-slate-900/40 text-slate-500 selection:bg-slate-800">
        <div className="flex items-center gap-1">
          <Database className="w-3 h-3 text-blue-400" />
          <span>MongoDB Track: Atlas Hybrid Vector/Geospatial Pipeline</span>
        </div>
        <span>MallPulse v1.0.0</span>
      </div>
    </div>
  );
}
