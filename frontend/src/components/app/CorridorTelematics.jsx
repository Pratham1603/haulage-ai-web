import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Truck, Radio, AlertTriangle, ShieldCheck, Thermometer, Gauge, Zap,
  PhoneCall, ExternalLink, RefreshCw, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { ActionBtn } from "./bits";

const VEHICLES = [
  {
    id: "LR-8839",
    truck: "MH-04-XX-1234",
    driver: "Ramesh Yadav",
    status: "breakdown",
    locationName: "Beawar, Rajasthan (NH-48 km 412)",
    speed: "0 km/h (Stopped)",
    rpm: "0 RPM",
    reeferTemp: null,
    fuel: "68%",
    cargo: "18 pallets FMCG (Aarav)",
    eta: "Delayed (Window 08:00-10:00 at risk)",
    tollEvent: "Beawar South Plaza passed at 01:45",
    cx: 143,
    cy: 76,
    alert: "Engine coolant pressure loss detected by OBD-II telematics at 02:10 AM",
  },
  {
    id: "LR-8836",
    truck: "MH-04-XX-4471",
    driver: "Suresh Patel",
    status: "on_track",
    locationName: "Crossing Surat bypass (NH-48 km 280)",
    speed: "64 km/h",
    rpm: "1,420 RPM",
    reeferTemp: null,
    fuel: "82%",
    cargo: "22 pallets (Consolidated FMCG + Pharma)",
    eta: "On-time · Delivery Fri 06:00",
    tollEvent: "Boriach FASTag auto-debited ₹280 at 08:32",
    cx: 100,
    cy: 104,
    alert: null,
  },
  {
    id: "LR-8842",
    truck: "MH-12-XX-7788",
    driver: "Devendra Singh",
    status: "cold_chain",
    locationName: "Approaching Gurgaon Kherki Daula (km 1,320)",
    speed: "52 km/h",
    rpm: "1,310 RPM",
    reeferTemp: "+3.8°C (Set 4.0°C - Stable)",
    fuel: "44%",
    cargo: "9 pallets sensitive electronics & pharma",
    eta: "On-time · Arriving Narela in 1h 15m",
    tollEvent: "Manesar FASTag auto-debited ₹145 at 09:18",
    cx: 185,
    cy: 46,
    alert: null,
  },
];

export const CorridorTelematics = () => {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState("LR-8839");
  const [simulatingDeviation, setSimulatingDeviation] = useState(false);

  const activeVeh = VEHICLES.find((v) => v.id === selectedId) || VEHICLES[0];

  const handleSimulateAlert = () => {
    setSimulatingDeviation(true);
    toast.warning(`Geofence Alert: ${activeVeh.id} detour detected near Ajmer bypass. Voice AI dispatched.`);
    setTimeout(() => setSimulatingDeviation(false), 5000);
  };

  return (
    <div className="space-y-3" data-testid="corridor-telematics">
      {/* Interactive SVG Corridor Map */}
      <div className="card-craft relative overflow-hidden">
        <div className="absolute top-2.5 left-3 z-10 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground font-mono">
          <span className="sonar-ping h-2 w-2 rounded-full bg-status-ai" />
          <span>NH-48 Corridor · Mumbai ⇄ Delhi (1,420 km)</span>
        </div>

        <svg viewBox="0 0 260 150" className="w-full text-muted-foreground pt-5" role="img" aria-label="Interactive Mumbai to Delhi corridor map">
          <rect x="0" y="0" width="260" height="150" className="fill-surface/70" rx="8" />

          {/* Golden Quadrilateral NH-48 Corridor Highway Path */}
          <path
            d="M30 122 C 90 115, 130 85, 165 60 S 220 30, 232 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="text-muted-foreground/30 path-draw"
          />

          {/* Major Milestones */}
          <circle cx="30" cy="122" r="4.5" className="fill-heading" />
          <text x="12" y="140" fontSize="8" fontWeight="600" fill="currentColor">Bhiwandi (0 km)</text>

          <circle cx="232" cy="24" r="4.5" className="fill-heading" />
          <text x="180" y="15" fontSize="8" fontWeight="600" fill="currentColor">Narela Delhi (1,420 km)</text>

          {/* Interactive Vehicles */}
          {VEHICLES.map((v) => {
            const isSelected = v.id === selectedId;
            const isAlert = v.status === "breakdown";

            return (
              <g
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                className="cursor-pointer transition-transform hover:scale-125"
              >
                {/* Pulsing ring for alerts */}
                {isAlert && (
                  <circle
                    cx={v.cx}
                    cy={v.cy}
                    r={isSelected ? "11" : "8"}
                    fill="none"
                    className="stroke-status-human animate-ping origin-center"
                    strokeWidth="1.5"
                  />
                )}
                {isSelected && !isAlert && (
                  <circle
                    cx={v.cx}
                    cy={v.cy}
                    r="8"
                    fill="none"
                    className="stroke-status-ai animate-pulse"
                    strokeWidth="1"
                  />
                )}
                <circle
                  cx={v.cx}
                  cy={v.cy}
                  r={isSelected ? "6" : "4.5"}
                  className={isAlert ? "fill-status-human" : "fill-status-ai"}
                  stroke={isSelected ? "#ffffff" : "none"}
                  strokeWidth={isSelected ? "2" : "0"}
                />
                <text
                  x={v.cx - 16}
                  y={v.cy - (isSelected ? 9 : 7)}
                  fontSize="7.5"
                  fontWeight={isSelected ? "700" : "600"}
                  className={isSelected ? "fill-heading font-mono" : "fill-muted-foreground font-mono"}
                >
                  {v.id} {isAlert ? "⚠" : ""}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between border-t border-border/50 bg-surface/80 px-3 py-1.5 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-status-ai" /> Live Transit</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-status-human" /> Telematics Alert</span>
          </div>
          <span className="font-mono text-[9px] text-muted-foreground/80">Click pin for telemetry</span>
        </div>
      </div>

      {/* Selected Vehicle Telemetry HUD */}
      <div className="card-craft p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-heading">{activeVeh.id}</span>
              <span className="font-mono text-xs text-muted-foreground">{activeVeh.truck}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                activeVeh.status === "breakdown"
                  ? "bg-status-human/15 text-status-human border border-status-human/40"
                  : "bg-status-ai/15 text-status-ai border border-status-ai/40"
              }`}>
                {activeVeh.status === "breakdown" ? "OBD Fault" : "Telemetry Active"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{activeVeh.locationName}</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedId(selectedId === "LR-8839" ? "LR-8836" : selectedId === "LR-8836" ? "LR-8842" : "LR-8839")}
            className="rounded-lg border border-border/80 bg-surface p-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
            title="Cycle next vehicle"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Diagnostic Alert Box */}
        {activeVeh.alert && (
          <div className="flex items-start gap-2 rounded-lg border border-status-human/50 bg-status-human/10 p-2.5 text-xs">
            <AlertTriangle className="h-4 w-4 text-status-human shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-status-human">Active Diagnostic Trouble Code (DTC)</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{activeVeh.alert}</p>
            </div>
          </div>
        )}

        {simulatingDeviation && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-2.5 text-xs animate-in fade-in">
            <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-amber-600 dark:text-amber-400">Geofence Corridor Breach Simulated</p>
              <p className="text-[11px] text-muted-foreground">Vehicle deviated 4.2 km from NH-48. Multilingual Voice AI dialer initialized.</p>
            </div>
          </div>
        )}

        {/* Telemetry Sensor Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-border/70 bg-surface/70 p-2.5 space-y-0.5">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-mono">
              <Gauge className="h-3 w-3 text-primary" /> Speed & RPM
            </div>
            <p className="font-bold text-heading font-mono text-sm">{activeVeh.speed}</p>
            <p className="font-mono text-[10px] text-muted-foreground">{activeVeh.rpm}</p>
          </div>

          <div className="rounded-lg border border-border/70 bg-surface/70 p-2.5 space-y-0.5">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-mono">
              <ShieldCheck className="h-3 w-3 text-status-ai" /> Driver & Fuel
            </div>
            <p className="font-semibold text-heading">{activeVeh.driver}</p>
            <p className="font-mono text-[10px] text-muted-foreground">Fuel Tank: {activeVeh.fuel}</p>
          </div>

          {activeVeh.reeferTemp && (
            <div className="col-span-2 rounded-lg border border-border/70 bg-surface/70 p-2.5 space-y-0.5">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-mono">
                <Thermometer className="h-3 w-3 text-status-ai" /> Cold-Chain Temperature Sensor
              </div>
              <p className="font-bold text-status-ai font-mono">{activeVeh.reeferTemp}</p>
              <p className="text-[10px] text-muted-foreground font-mono">Certified IoT datalogger · Pharma-compliant</p>
            </div>
          )}
        </div>

        {/* FASTag Electronic Toll Audit */}
        <div className="rounded-lg border border-border/60 bg-surface/60 px-3 py-2 text-[11px] flex items-center justify-between text-muted-foreground">
          <span className="font-mono text-[10px]">FASTag: {activeVeh.tollEvent}</span>
          <span className="text-status-ai font-mono text-[10px] font-bold bg-status-ai/10 px-1.5 py-0.5 rounded border border-status-ai/30">VERIFIED</span>
        </div>

        {/* 1-Click Operational Actions */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-border/50">
          <ActionBtn
            primary
            onClick={() => navigate("/app/calls")}
            className="flex-1 text-center justify-center"
          >
            <PhoneCall className="h-3 w-3 mr-1.5 inline" /> Call Driver (Voice AI)
          </ActionBtn>
          <button
            type="button"
            onClick={handleSimulateAlert}
            className="btn-tactile-secondary rounded-lg border border-border/80 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-heading"
          >
            Simulate Detour
          </button>
        </div>
      </div>
    </div>
  );
};
