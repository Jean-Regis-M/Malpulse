import React from "react";
import { Store, ShoppingCart, Star, MapPin } from "lucide-react";
import { InventoryItem } from "../types";

interface InventoryViewProps {
  items: InventoryItem[];
  activeStoreId?: string;
  onSelectStore: (storeId: string) => void;
  onReserve: (item: InventoryItem, size: string) => void;
}

export default function InventoryView({ items, activeStoreId, onSelectStore, onReserve }: InventoryViewProps) {
  return (
    <div className="space-y-4" id="inventory-catalog">
      <div className="flex items-center justify-between">
        <h3 className="text-white text-base font-bold font-sans flex items-center gap-1.5">
          <ShoppingCart className="w-5 h-5 text-indigo-400" />
          Multi-Tenant Catalog Items
        </h3>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
          {items.length} matched records
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.length === 0 ? (
          <div className="col-span-2 py-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-slate-500">
            No matching stock found. Try searching e.g., "Find a navy blue blazer under $200"
          </div>
        ) : (
          items.map(item => {
            const isStoreSelected = item.store_id === activeStoreId;

            return (
              <div
                key={item._id}
                className={`bg-slate-900 border ${
                  isStoreSelected ? "border-sky-500/80 ring-2 ring-sky-500/10" : "border-slate-800 hover:border-slate-700"
                } rounded-xl overflow-hidden transition-all duration-250 flex flex-col p-4 space-y-3 relative`}
              >
                {/* Store banner details */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => onSelectStore(item.store_id)}
                    className="flex items-center gap-2 group text-left"
                  >
                    <div className="bg-slate-800 p-1.5 rounded-lg group-hover:bg-slate-700 transition" id={`store-icon-${item._id}`}>
                      <Store className="w-4 h-4 text-sky-400" />
                    </div>
                    <div>
                      <h4 className="text-white text-xs font-bold leading-tight group-hover:text-sky-300 transition-colors uppercase tracking-wide">
                        {item.store_name}
                      </h4>
                      <p className="text-[9px] text-slate-500 font-mono">
                        Floor {item.floor} • Unit {item.unit}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded text-[10px] text-yellow-400 font-bold border border-slate-700/50">
                    <Star className="w-3 h-3 fill-yellow-400 stroke-yellow-400" />
                    <span>4.7</span>
                  </div>
                </div>

                {/* Product Layout */}
                <div className="flex gap-4 items-start pt-1">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.product_name}
                      className="w-20 h-20 rounded-lg object-cover border border-slate-800 flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="space-y-1">
                    <h5 className="text-white text-sm font-bold font-sans tracking-tight">{item.product_name}</h5>
                    <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">{item.description}</p>
                    <div className="text-sky-400 text-sm font-black pt-1">${item.price.toFixed(2)}</div>
                  </div>
                </div>

                {/* Variant Stock sizes */}
                <div className="pt-2 border-t border-slate-800/60">
                  <div className="text-[10px] text-slate-500 font-semibold mb-2 tracking-wider">AVAILABLE SIZES & STOCK</div>
                  <div className="flex flex-wrap gap-2">
                    {item.variants.map((v, idx) => {
                      const outOfStock = v.stock_level <= 0;
                      return (
                        <button
                          key={idx}
                          disabled={outOfStock}
                          onClick={() => onReserve(item, v.size)}
                          className={`px-2.5 py-1.5 text-xs font-mono rounded-lg border flex items-center gap-1.5 transition-all ${
                            outOfStock
                              ? "bg-slate-950 border-slate-850 text-slate-500 cursor-not-allowed line-through"
                              : "bg-slate-850 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white border-slate-750 text-slate-200 hover:shadow-lg hover:scale-[1.02]"
                          }`}
                          id={`size-btn-${item._id}-${v.size}`}
                        >
                          <span className="font-bold">{v.size}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${outOfStock ? "bg-slate-700" : "bg-emerald-400"}`} />
                          <span className="opacity-70 text-[10px]">{v.stock_level}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
