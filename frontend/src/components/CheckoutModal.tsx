import React, { useEffect, useState } from "react";
import { X, Calendar, Clock, Sparkles, MapPin, Receipt, CheckCircle } from "lucide-react";

interface Reservation {
  _id: string;
  sku: string;
  product_name: string;
  price: number;
  selected_size: string;
  store_name: string;
  floor: number;
  unit: string;
  created_at: string;
  expires_at: string;
}

interface CheckoutModalProps {
  reservation: Reservation;
  onClose: () => void;
}

export default function CheckoutModal({ reservation, onClose }: CheckoutModalProps) {
  const [timeLeft, setTimeLeft] = useState<string>("14:59");

  useEffect(() => {
    const expiry = new Date(reservation.expires_at).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("00:00 - EXPIRED");
        clearInterval(interval);
      } else {
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reservation]);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="checkout-modal">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col relative">
        
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-cyan-600 to-indigo-600 px-6 py-5 flex items-center justify-between text-white relative">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-cyan-200" />
            <h3 className="text-white text-base font-bold font-sans">Verification Pass Lock Confirmed</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white bg-slate-900/20 hover:bg-slate-900/30 p-1.5 rounded-lg transition"
            id="close-modal-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body layout */}
        <div className="p-6 space-y-5 flex-grow">
          {/* Reservation Ticket summary */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-950/50 border border-indigo-900 rounded-lg flex items-center justify-center flex-shrink-0 text-indigo-400 font-mono text-xs font-black">
              {reservation.selected_size}
            </div>
            <div className="space-y-1">
              <h4 className="text-white text-sm font-bold leading-tight">{reservation.product_name}</h4>
              <p className="text-[11px] text-slate-400 font-semibold">{reservation.store_name} • Unit {reservation.unit}</p>
              <div className="text-sky-400 text-sm font-bold tracking-tight">${reservation.price.toFixed(2)}</div>
            </div>
          </div>

          {/* Secure Pickup QR Representation */}
          <div className="flex flex-col items-center justify-center space-y-2 py-2">
            <div className="bg-white border-4 border-slate-950 p-4 rounded-xl shadow-lg relative glow-cyan-500/20">
              {/* QR Render mockup in SVG blocks */}
              <svg width="150" height="150" viewBox="0 0 100 100" className="text-slate-950">
                {/* 3 Corner anchor squares */}
                <rect x="0" y="0" width="30" height="30" fill="currentColor" />
                <rect x="5" y="5" width="20" height="20" fill="white" />
                <rect x="10" y="10" width="10" height="10" fill="currentColor" />

                <rect x="70" y="0" width="30" height="30" fill="currentColor" />
                <rect x="75" y="5" width="20" height="20" fill="white" />
                <rect x="80" y="10" width="10" height="10" fill="currentColor" />

                <rect x="0" y="70" width="30" height="30" fill="currentColor" />
                <rect x="5" y="75" width="20" height="20" fill="white" />
                <rect x="10" y="80" width="10" height="10" fill="currentColor" />

                {/* Simulated random code dots patterns */}
                <rect x="40" y="10" width="10" height="15" fill="currentColor" />
                <rect x="55" y="5" width="10" height="10" fill="currentColor" />
                <rect x="45" y="25" width="15" height="10" fill="currentColor" />
                
                <rect x="40" y="45" width="20" height="15" fill="currentColor" />
                <rect x="15" y="45" width="15" height="10" fill="currentColor" />
                <rect x="70" y="40" width="10" height="25" fill="currentColor" />

                <rect x="45" y="70" width="15" height="15" fill="currentColor" />
                <rect x="75" y="70" width="20" height="15" fill="currentColor" />
                <rect x="70" y="90" width="10" height="10" fill="currentColor" />
                <rect x="25" y="90" width="15" height="10" fill="currentColor" />
              </svg>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
              SECURE TRADING-ID: {reservation._id}
            </span>
          </div>

          {/* Time parameters & TTL countdown ticker */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="bg-slate-950/80 border border-slate-850 p-3 rounded-xl flex items-center gap-3">
              <Clock className="w-4 h-4 text-rose-400 flex-shrink-0 animate-pulse" />
              <div>
                <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">TTL ACTIVE HOLD</div>
                <div className="text-white text-xs font-mono font-black">{timeLeft}</div>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-850 p-3 rounded-xl flex items-center gap-3">
              <MapPin className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <div>
                <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Location</div>
                <div className="text-white text-xs font-black">Floor {reservation.floor} ({reservation.unit})</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-900/65 text-[11px] text-indigo-300 leading-relaxed">
            <Sparkles className="w-3.5 h-3.5 inline mr-1 text-cyan-400" />
            Show this reservation pickup ticket pass to the store associate within 15 minutes to lock in your purchase at the guaranteed price.
          </div>
        </div>

        {/* Footer print checkout details */}
        <div className="border-t border-slate-800 p-4 bg-slate-950 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-slate-500" />
            <span>COMMISSION ESCROW CAPTURED</span>
          </div>
          <span className="text-emerald-400 font-bold">$1.50</span>
        </div>
      </div>
    </div>
  );
}
