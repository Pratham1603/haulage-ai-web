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
      <div className="relative rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="absolute top-2 left-3 z-10 flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase text-muted-foreground">
          <Radio className="h-3 w-3 text-status-ai animate-pulse" /> NH-48 Mumbai → Delhi Corridor (1,420 km)
        </div>

        <svg viewBox="0 0 260 150" className="w-full text-muted-foreground pt-4" role="img" aria-label="Interactive Mumbai to Delhi corridor map">
          <rect x="0" y="0" width="260" height="150" className="fill-surface" rx="8" />

          {/* Golden Quadrilateral NH-48 Corridor Highway Path */}
          <path
            d="M30 122 C 90 115, 130 85, 165 60 S 220 30, 232 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="text-muted-foreground/40"
          />

          {/* Major Milestones */}
          <circle cx="30" cy="122" r="5" className="fill-heading" />
          <text x="14" y="140" fontSize="8" fontWeight="600" fill="currentColor">Bhiwandi (0 km)</text>

          <circle cx="232" cy="24" r="5" className="fill-heading" />
          <text x="194" y="16" fontSize="8" fontWeight="600" fill="currentColor">Narela Delhi (1,420 km)</text>

          {/* Interactive Vehicles */}
          {VEHICLES.map((v) => {
            const isSelected = v.id === selectedId;
            const isAlert = v.status === "breakdown";

            return (
              <g
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                className="cursor-pointer transition-transform hover:scale-110"
              >
                {/* Pulsing ring for alerts */}
                {isAlert && (
                  <circle
                    cx={v.cx}
                    cy={v.cy}
                    r={isSelected ? "9" : "7"}
                    fill="none"
                    className="stroke-status-human animate-ping origin-center"
                    strokeWidth="1.5"
                  />
                )}
                <circle
                  cx={v.cx}
                  cy={v.cy}
                  r={isSelected ? "6" : "4.5"}
                  className={isAlert ? "fill-status-human" : "fill-status-ai"}
                  stroke={isSelected ? "#ffffff" : "none"}
                  strokeWidth={isSelected ? "1.5" : "0"}
                />
                <text
                  x={v.cx - 16}
                  y={v.cy - (isSelected ? 9 : 7)}
                  fontSize="8"
                  fontWeight={isSelected ? "700" : "500"}
                  fill={isSelected ? "currentColor" : "currentColor"}
                  className={isSelected ? "font-bold underline" : ""}
                >
                  {v.id} {isAlert ? "⚠" : ""}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between border-t bg-surface/80 px-3 py-1.5 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-status-ai" /> On Track</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-status-human" /> Telematics Alert</span>
          </div>
          <span className="text-[9px]">Click pins for OBD-II telemetry</span>
        </div>
      </div>

      {/* Selected Vehicle Telemetry HUD */}
      <div className="rounded-xl border bg-card p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 border-b pb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-sm font-bold text-heading">{activeVeh.id}</span>
              <span className="font-mono text-xs text-muted-foreground">{activeVeh.truck}</span>
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
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
            className="rounded border bg-surface p-1.5 text-xs text-muted-foreground hover:bg-accent"
            title="Cycle next vehicle"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Diagnostic Alert Box */}
        {activeVeh.alert && (
          <div className="flex items-start gap-2 rounded-lg border border-status-human/50 bg-status-human/10 p-2 text-xs">
            <AlertTriangle className="h-4 w-4 text-status-human shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-status-human">Active Diagnostic Trouble Code (DTC)</p>
              <p className="text-[11px] text-muted-foreground">{activeVeh.alert}</p>
            </div>
          </div>
        )}

        {simulatingDeviation && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-2 text-xs animate-in fade-in">
            <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-amber-600 dark:text-amber-400">Geofence Corridor Breach Simulated</p>
              <p className="text-[11px] text-muted-foreground">Vehicle deviated 4.2 km from NH-48. Multilingual Voice AI dialer initialized.</p>
            </div>
          </div>
        )}

        {/* Telemetry Sensor Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border bg-surface p-2 space-y-0.5">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
              <Gauge className="h-3 w-3" /> Speed & RPM
            </div>
            <p className="font-medium text-heading font-mono">{activeVeh.speed}</p>
            <p className="text-[10px] text-muted-foreground">{activeVeh.rpm}</p>
          </div>

          <div className="rounded-lg border bg-surface p-2 space-y-0.5">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
              <ShieldCheck className="h-3 w-3" /> Driver & Fuel
            </div>
            <p className="font-medium text-heading">{activeVeh.driver}</p>
            <p className="text-[10px] text-muted-foreground">Fuel Tank: {activeVeh.fuel}</p>
          </div>

          {activeVeh.reeferTemp && (
            <div className="col-span-2 rounded-lg border bg-surface p-2 space-y-0.5">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
                <Thermometer className="h-3 w-3 text-status-ai" /> Cold-Chain Temperature Sensor
              </div>
              <p className="font-medium text-status-ai font-mono">{activeVeh.reeferTemp}</p>
              <p className="text-[10px] text-muted-foreground">Certified IoT datalogger · Pharma-compliant</p>
            </div>
          )}
        </div>

        {/* FASTag Electronic Toll Audit */}
        <div className="rounded-lg border bg-surface/60 px-2.5 py-1.5 text-[11px] flex items-center justify-between text-muted-foreground">
          <span>FASTag: {activeVeh.tollEvent}</span>
          <span className="text-status-ai font-mono text-[10px] font-semibold">VERIFIED</span>
        </div>

        {/* 1-Click Operational Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
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
            className="rounded-lg border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-surface hover:text-heading transition-colors"
          >
            Simulate Detour
          </button>
        </div>
      </div>
    </div>
  );
};
