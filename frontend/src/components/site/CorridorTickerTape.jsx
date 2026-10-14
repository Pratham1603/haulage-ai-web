import { Activity, ShieldCheck, Phone, Truck, FileCheck, CheckCircle2 } from "lucide-react";

const TICKER_ITEMS = [
  {
    icon: Truck,
    color: "text-emerald-500",
    label: "LR-8844 (32-ft MXL)",
    detail: "Passed Ghodbunder Toll @ 68 km/h · 42m ahead of schedule",
  },
  {
    icon: Phone,
    color: "text-sky-500",
    label: "Gujarati Voice Agent",
    detail: "Confirmed driver for Surat → Gurgaon return leg · ₹34,500 settled",
  },
  {
    icon: ShieldCheck,
    color: "text-amber-500",
    label: "Vision AI Gate 3",
    detail: "Bhiwandi Hub 30FPS dock check: 18 pallets verified undamaged",
  },
  {
    icon: FileCheck,
    color: "text-indigo-500",
    label: "Invoice Auditor",
    detail: "GSTN e-Way Bill #88204 reconciled with FASTag gate timestamp",
  },
  {
    icon: Activity,
    color: "text-teal-500",
    label: "Cold-Chain Telematics",
    detail: "Reefer container LR-8812 maintained at -18.4°C (Pharma grade)",
  },
  {
    icon: CheckCircle2,
    color: "text-emerald-500",
    label: "Capacity Matcher",
    detail: "Filled 4 spare pallets on Vadodara leg · +₹18,400 profit gained",
  },
];

export const CorridorTickerTape = () => {
  return (
    <div className="relative w-full border-y border-border/80 bg-surface/50 py-3 overflow-hidden backdrop-blur-xs select-none">
      {/* Left and right fade gradient mask */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />

      {/* Marquee Track (Repeated twice for seamless loop) */}
      <div className="animate-marquee-scroll flex items-center gap-8">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="inline-flex items-center gap-2.5 rounded-full border border-border/60 bg-card/80 px-3.5 py-1 text-xs shadow-2xs backdrop-blur-xs"
            >
              <Icon className={`h-3.5 w-3.5 shrink-0 ${item.color}`} />
              <span className="font-semibold text-heading font-mono text-[11px]">{item.label}:</span>
              <span className="text-muted-foreground whitespace-nowrap text-[11px]">{item.detail}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
