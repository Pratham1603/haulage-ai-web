import { useState } from "react";
import { CheckCircle2, AlertCircle, PlusCircle, Sparkles, Scale, Leaf, TrendingUp } from "lucide-react";
import { ActionBtn } from "./bits";

export const TruckDeckVisualizer = ({ partLoadAdded, onAddPartLoad }) => {
  const [hoveredSlot, setHoveredSlot] = useState(null);

  // 22 pallet layout: 11 rows of 2 pallets each
  const totalSlots = 22;
  const bookedCount = 18;
  const partLoadSlots = [19, 20, 21, 22];

  const slots = Array.from({ length: totalSlots }, (_, i) => {
    const slotNum = i + 1;
    const isBooked = slotNum <= bookedCount;
    const isPartLoad = partLoadSlots.includes(slotNum);
    return {
      slotNum,
      isBooked,
      isPartLoad,
      filled: isBooked || (isPartLoad && partLoadAdded),
      customer: isBooked
        ? "Aarav Consumer Products"
        : isPartLoad && partLoadAdded
        ? "Kedia Polymers (Part-Load)"
        : "Unassigned Space",
      cargo: isBooked
        ? "SKU-A31 Packaged FMCG"
        : isPartLoad && partLoadAdded
        ? "SKU-K10 Industrial Resins"
        : "Available for consolidation",
      weightKg: isBooked ? 788 : isPartLoad && partLoadAdded ? 900 : 0,
    };
  });

  const totalPayloadTons = partLoadAdded ? "17.8 t" : "14.2 t";
  const utilizationPct = partLoadAdded ? 100 : Math.round((18 / 22) * 100);

  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-sm" data-testid="truck-deck-visualizer">
      {/* Header with Title and Live Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-base font-bold text-heading">
              3D Cargo Deck & Axle Load Visualizer
            </h3>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
              32 ft Multi-Axle Container (MXL)
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Truck MH-04-XX-4471 · 22 Standard Pallet Deck (1200×1000mm ISO) · Corridor: Mumbai → Delhi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-lg border bg-surface px-3 py-1.5 font-medium">
            <Scale className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Payload: <strong className="text-heading">{totalPayloadTons}</strong> / 18.5 t Legal Cap</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border bg-surface px-3 py-1.5 font-medium">
            <TrendingUp className="h-3.5 w-3.5 text-status-ai" />
            <span>Volumetric Deck: <strong className="text-heading">{utilizationPct}%</strong></span>
          </div>
        </div>
      </div>

      {/* Value Arbitrage Banner */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="rounded-xl border bg-surface/80 p-3 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-status-ai/10 flex items-center justify-center shrink-0 text-status-ai">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-muted-foreground">Additional Revenue</p>
            <p className="font-bold text-heading text-sm">{partLoadAdded ? "+₹9,200 Added" : "₹9,200 Potential"}</p>
          </div>
        </div>

        <div className="rounded-xl border bg-surface/80 p-3 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
            <Leaf className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-muted-foreground">Corridor Carbon Saved</p>
            <p className="font-bold text-heading text-sm">{partLoadAdded ? "340 kg CO₂ Prevented" : "Zero Extra Fuel"}</p>
          </div>
        </div>

        <div className="rounded-xl border bg-surface/80 p-3 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-muted-foreground">Axle Balance (MoRTH Safe)</p>
            <p className="font-bold text-heading text-sm">{partLoadAdded ? "Front: 48% | Rear: 52%" : "Front: 51% | Rear: 49%"}</p>
          </div>
        </div>
      </div>

      {/* Realistic Truck Bed Render */}
      <div className="mt-5 rounded-xl border-2 border-border/70 bg-gradient-to-r from-muted/20 via-surface/60 to-muted/20 p-4">
        {/* Truck Cabin & Direction Indicator */}
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-16 items-center justify-center rounded border border-muted-foreground/30 bg-muted/40 font-mono text-[10px] font-bold text-heading">
              CABIN ⮜
            </span>
            <span className="text-[11px]">Front Steer Axle (Max 6.5 t)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px]">Rear Tandem Drive Axles (Max 12.0 t)</span>
            <span className="flex h-6 w-16 items-center justify-center rounded border border-muted-foreground/30 bg-muted/40 font-mono text-[10px] font-bold text-heading">
              TAILGATE
            </span>
          </div>
        </div>

        {/* 22 Pallet Isometric Bed Grid */}
        <div className="grid grid-cols-11 gap-1.5 sm:gap-2 overflow-x-auto py-2">
          {slots.map((slot) => {
            const isFilledBooked = slot.isBooked;
            const isFilledPartLoad = slot.isPartLoad && partLoadAdded;
            const isEmptySpare = slot.isPartLoad && !partLoadAdded;

            return (
              <div
                key={slot.slotNum}
                onMouseEnter={() => setHoveredSlot(slot)}
                onMouseLeave={() => setHoveredSlot(null)}
                className={`relative flex flex-col items-center justify-center h-20 sm:h-24 rounded-lg border-2 text-center transition-all cursor-pointer ${
                  isFilledBooked
                    ? "border-primary/50 bg-primary/10 shadow-sm hover:border-primary"
                    : isFilledPartLoad
                    ? "border-emerald-500/60 bg-emerald-500/15 shadow-sm hover:border-emerald-500 animate-in fade-in"
                    : "border-dashed border-status-approval/70 bg-status-approval/10 hover:border-status-approval animate-pulse"
                }`}
                title={`Pallet #${slot.slotNum}: ${slot.customer}`}
              >
                {/* Pallet Wooden Base Graphic */}
                <div className="absolute bottom-1 inset-x-1.5 h-1.5 rounded-sm bg-amber-700/30 flex justify-between px-1">
                  <span className="w-1 bg-amber-800/40 h-full rounded-sm" />
                  <span className="w-1 bg-amber-800/40 h-full rounded-sm" />
                  <span className="w-1 bg-amber-800/40 h-full rounded-sm" />
                </div>

                {/* Slot Tag */}
                <span className="font-mono text-[9px] font-bold text-muted-foreground">
                  #{slot.slotNum}
                </span>

                {/* Pallet Icon & State */}
                {isFilledBooked ? (
                  <div className="mt-0.5 flex flex-col items-center">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="mt-0.5 text-[8px] font-semibold text-primary leading-tight">FMCG</span>
                    <span className="text-[7px] text-muted-foreground">788 kg</span>
                  </div>
                ) : isFilledPartLoad ? (
                  <div className="mt-0.5 flex flex-col items-center">
                    <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="mt-0.5 text-[8px] font-bold text-emerald-600 dark:text-emerald-400 leading-tight">PART</span>
                    <span className="text-[7px] text-muted-foreground">900 kg</span>
                  </div>
                ) : (
                  <div className="mt-0.5 flex flex-col items-center">
                    <PlusCircle className="h-4 w-4 text-status-approval" />
                    <span className="mt-0.5 text-[8px] font-bold text-status-approval leading-tight">SPARE</span>
                    <span className="text-[7px] text-muted-foreground">Empty</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Hovered Slot Inspector Tooltip */}
        <div className="mt-3 flex items-center justify-between rounded-lg border bg-surface/90 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-heading">
              {hoveredSlot ? `Slot #${hoveredSlot.slotNum}:` : "Hover any slot to inspect pallet weight & SKU origin"}
            </span>
            {hoveredSlot && (
              <span className="text-muted-foreground">
                {hoveredSlot.customer} · {hoveredSlot.cargo} {hoveredSlot.weightKg ? `(${hoveredSlot.weightKg} kg)` : ""}
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">
            Standard ISO 1200×1000mm Pallet
          </span>
        </div>
      </div>

      {/* Part Load Action Callout */}
      {!partLoadAdded ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-status-approval/40 bg-status-approval/10 p-3.5">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-heading flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-status-approval" /> AI Match Found: 4 Pallets from Kedia Polymers
            </p>
            <p className="text-xs text-muted-foreground">
              Bhiwandi → Jaipur side drop fits exactly into tail slots #19–#22. Net margin increase: <strong>+₹9,200</strong> with 0 km route detour.
            </p>
          </div>
          <ActionBtn primary testId="add-part-load-btn" onClick={onAddPartLoad}>
            Consolidate 4 Spare Pallets
          </ActionBtn>
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-medium">
              Consolidated 100% capacity! All 22 pallet slots filled. Net revenue boosted to ₹84,000 for truck MH-04-XX-4471.
            </span>
          </div>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            100% FULL
          </span>
        </div>
      )}
    </div>
  );
};
