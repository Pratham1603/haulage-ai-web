import React, { useState } from "react";
import {
  MapPin,
  TrendingUp,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Zap,
  ArrowRight,
  Filter,
  CheckCircle2,
} from "lucide-react";

// Geographic coordinates projected onto a 600x650 SVG canvas for Indian freight corridors
const HUBS = {
  DELHI: { id: "DELHI", name: "Delhi NCR (Narela)", x: 260, y: 155, state: "Delhi", activeTrucks: 14, weather: "Clear · 28°C" },
  JAIPUR: { id: "JAIPUR", name: "Jaipur Hub", x: 220, y: 195, state: "Rajasthan", activeTrucks: 6, weather: "Clear · 31°C" },
  AHMEDABAD: { id: "AHMEDABAD", name: "Ahmedabad Hub", x: 165, y: 285, state: "Gujarat", activeTrucks: 18, weather: "Hazy · 34°C" },
  MUMBAI: { id: "MUMBAI", name: "Mumbai (Bhiwandi / JNPT)", x: 185, y: 375, state: "Maharashtra", activeTrucks: 28, weather: "Monsoon Mist · 29°C" },
  PUNE: { id: "PUNE", name: "Pune Auto Cluster", x: 205, y: 410, state: "Maharashtra", activeTrucks: 11, weather: "Partly Cloudy · 27°C" },
  HYDERABAD: { id: "HYDERABAD", name: "Hyderabad Logistics Park", x: 295, y: 425, state: "Telangana", activeTrucks: 9, weather: "Clear · 30°C" },
  BENGALURU: { id: "BENGALURU", name: "Bengaluru Tech Corridor", x: 260, y: 515, state: "Karnataka", activeTrucks: 22, weather: "Overcast · 24°C" },
  CHENNAI: { id: "CHENNAI", name: "Chennai Port Terminal", x: 340, y: 520, state: "Tamil Nadu", activeTrucks: 15, weather: "Humid · 32°C" },
  KOLKATA: { id: "KOLKATA", name: "Kolkata Freight Terminal", x: 475, y: 290, state: "West Bengal", activeTrucks: 8, weather: "Thunderstorm · 27°C" },
};

const CORRIDORS = [
  {
    id: "MUMBAI-DELHI",
    name: "Western Corridor (NH-48)",
    from: "MUMBAI",
    to: "DELHI",
    waypoints: [[185, 375], [165, 285], [220, 195], [260, 155]],
    distanceKm: 1420,
    transitHours: "28-32 hrs",
    avgDelayRate: 18.4,
    riskTier: "low",
    activeShipments: 12,
    avgCostPerKm: 24.8,
    congestion: "Moderate (Surat Bypass)",
    recommendation: "High reliability corridor. Tier-1 carriers operating on scheduled ETA.",
  },
  {
    id: "MUMBAI-PUNE",
    name: "Mumbai-Pune Expressway",
    from: "MUMBAI",
    to: "PUNE",
    waypoints: [[185, 375], [205, 410]],
    distanceKm: 150,
    transitHours: "3.5-5 hrs",
    avgDelayRate: 9.2,
    riskTier: "low",
    activeShipments: 8,
    avgCostPerKm: 29.5,
    congestion: "Bhor Ghat bottleneck cleared",
    recommendation: "Rapid turnaround lane. High potential for same-day backhaul loads.",
  },
  {
    id: "MUMBAI-BENGALURU",
    name: "NH-48 South Freight Artery",
    from: "MUMBAI",
    to: "BENGALURU",
    waypoints: [[185, 375], [205, 410], [240, 470], [260, 515]],
    distanceKm: 980,
    transitHours: "20-24 hrs",
    avgDelayRate: 24.5,
    riskTier: "medium",
    activeShipments: 9,
    avgCostPerKm: 26.2,
    congestion: "Kolhapur checkpost delays",
    recommendation: "Schedule departure before 08:00 to bypass Hubballi ring road bottlenecks.",
  },
  {
    id: "CHENNAI-BENGALURU",
    name: "Bengaluru-Chennai Industrial Expressway",
    from: "CHENNAI",
    to: "BENGALURU",
    waypoints: [[340, 520], [260, 515]],
    distanceKm: 350,
    transitHours: "7-9 hrs",
    avgDelayRate: 11.5,
    riskTier: "low",
    activeShipments: 7,
    avgCostPerKm: 28.0,
    congestion: "Smooth flowing",
    recommendation: "Ideal for electric or high-cube multi-axle freight consolidation.",
  },
  {
    id: "DELHI-KOLKATA",
    name: "Eastern Dedicated Freight Corridor (NH-19)",
    from: "DELHI",
    to: "KOLKATA",
    waypoints: [[260, 155], [330, 210], [400, 250], [475, 290]],
    distanceKm: 1470,
    transitHours: "34-40 hrs",
    avgDelayRate: 46.2,
    riskTier: "high",
    activeShipments: 6,
    avgCostPerKm: 23.4,
    congestion: "Heavy fog warning & toll congestion near Kanpur/Varanasi",
    recommendation: "Apply +4.5 hr buffer window. Require telematics check-in every 6 hours.",
  },
  {
    id: "HYDERABAD-BENGALURU",
    name: "NH-44 Hyderabad-Bengaluru Artery",
    from: "HYDERABAD",
    to: "BENGALURU",
    waypoints: [[295, 425], [275, 470], [260, 515]],
    distanceKm: 570,
    transitHours: "10-12 hrs",
    avgDelayRate: 15.0,
    riskTier: "low",
    activeShipments: 5,
    avgCostPerKm: 25.0,
    congestion: "Clear highway conditions",
    recommendation: "Optimal corridor performance with consistent on-time carrier adherence.",
  },
  {
    id: "KOLKATA-CHENNAI",
    name: "East Coast Corridor (NH-16)",
    from: "KOLKATA",
    to: "CHENNAI",
    waypoints: [[475, 290], [430, 370], [375, 460], [340, 520]],
    distanceKm: 1680,
    transitHours: "38-44 hrs",
    avgDelayRate: 38.0,
    riskTier: "medium",
    activeShipments: 4,
    avgCostPerKm: 22.8,
    congestion: "Cyclonic rain alert along Odisha coastline",
    recommendation: "Pre-screen for waterproof sealed containerized trailers.",
  },
];

export const CorridorRiskMap = ({ onSelectCorridor, activeCorridorId }) => {
  const [selectedId, setSelectedId] = useState(activeCorridorId || "MUMBAI-DELHI");
  const [hoveredHub, setHoveredHub] = useState(null);

  const activeCorridor = CORRIDORS.find((c) => c.id === selectedId) || CORRIDORS[0];

  const handleCorridorClick = (corridor) => {
    setSelectedId(corridor.id);
    if (onSelectCorridor) {
      onSelectCorridor(corridor);
    }
  };

  const getStrokeColor = (tier, isSelected) => {
    if (isSelected) return "#3b82f6"; // Vibrant blue when active
    if (tier === "high") return "#ef4444"; // Red for high risk
    if (tier === "medium") return "#f59e0b"; // Amber for medium risk
    return "#10b981"; // Emerald green for low risk
  };

  const getTierBadge = (tier) => {
    if (tier === "high") return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
    if (tier === "medium") return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  };

  return (
    <div className="bg-card dark:bg-card/90 border border-border rounded-xl p-5 shadow-sm dark:shadow-2xl backdrop-blur-md transition-colors">
      {/* Header with KPI and filter summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-border/80 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-base font-bold text-heading tracking-wide flex items-center gap-2">
              National Freight Corridor Telematics & GIS Risk Heatmap
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time transit delay probabilities, corridor congestion factor, and hub fleet readiness
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Low Risk (&lt;35%)
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Med Risk (35-65%)
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Bottleneck (&gt;65%)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Interactive SVG Geographic Map Canvas */}
        <div className="lg:col-span-7 bg-surface/70 dark:bg-slate-950/70 border border-border/80 dark:border-slate-800/80 rounded-xl p-3 relative flex items-center justify-center overflow-hidden">
          {/* Subtle Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />


          <svg
            viewBox="100 80 430 490"
            className="w-full h-[380px] md:h-[460px] select-none"
            style={{ filter: "drop-shadow(0px 8px 16px rgba(0,0,0,0.4))" }}
          >
            <defs>
              {/* Linear gradient glow for selected corridor */}
              <linearGradient id="activeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <filter id="glow" x1="-20%" y1="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Corridor Tracks */}
            {CORRIDORS.map((c) => {
              const pathData = c.waypoints
                .map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt[0]} ${pt[1]}`)
                .join(" ");
              const isSelected = c.id === selectedId;

              return (
                <g key={`track-${c.id}`} className="cursor-pointer" onClick={() => handleCorridorClick(c)}>
                  {/* Invisible thicker hit area for easy clicking */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="24"
                    className="transition-all"
                  />
                  {/* Outer glow stroke when selected */}
                  {isSelected && (
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="8"
                      strokeOpacity="0.4"
                      filter="url(#glow)"
                    />
                  )}
                  {/* Actual Corridor Line */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={getStrokeColor(c.riskTier, isSelected)}
                    strokeWidth={isSelected ? "4.5" : "2.5"}
                    strokeDasharray={c.riskTier === "high" ? "6,4" : undefined}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300 hover:stroke-sky-400"
                  />
                </g>
              );
            })}

            {/* Hub Nodes & Markers */}
            {Object.values(HUBS).map((hub) => {
              const isHovered = hoveredHub === hub.id;
              const isCorridorTerminal =
                activeCorridor.from === hub.id || activeCorridor.to === hub.id;

              return (
                <g
                  key={hub.id}
                  transform={`translate(${hub.x}, ${hub.y})`}
                  onMouseEnter={() => setHoveredHub(hub.id)}
                  onMouseLeave={() => setHoveredHub(null)}
                  className="cursor-pointer transition-transform duration-200"
                >
                  {/* Pulse ring on terminal hubs */}
                  {isCorridorTerminal && (
                    <circle
                      r="14"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      opacity="0.6"
                      className="animate-ping"
                    />
                  )}

                  {/* Node Outer Circle */}
                  <circle
                    r={isCorridorTerminal ? "8" : "6"}
                    fill={isCorridorTerminal ? "#0284c7" : "#0f172a"}
                    stroke={isCorridorTerminal ? "#38bdf8" : "#64748b"}
                    strokeWidth={isCorridorTerminal ? "2.5" : "1.5"}
                    className="transition-colors"
                  />

                  {/* Inner Core */}
                  <circle
                    r={isCorridorTerminal ? "4" : "2.5"}
                    fill={isCorridorTerminal ? "#ffffff" : "#38bdf8"}
                  />

                  {/* Hub Label */}
                  <text
                    x="12"
                    y="4"
                    fill={isCorridorTerminal ? "#f8fafc" : "#94a3b8"}
                    fontSize={isCorridorTerminal ? "11" : "9.5"}
                    fontWeight={isCorridorTerminal ? "700" : "500"}
                    className="pointer-events-none select-none drop-shadow"
                  >
                    {hub.name.split(" ")[0]}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Quick Hub Tooltip if hovered */}
          {hoveredHub && HUBS[hoveredHub] && (
            <div className="absolute bottom-3 left-3 bg-card/95 dark:bg-slate-900/95 border border-border dark:border-slate-700 p-2.5 rounded-lg shadow-xl text-xs pointer-events-none z-10 transition-colors">
              <div className="font-semibold text-heading dark:text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-500" />
                {HUBS[hoveredHub].name}
              </div>
              <div className="text-muted-foreground mt-1 flex items-center gap-3">
                <span>Fleet Available: <strong className="text-emerald-600 dark:text-emerald-400">{HUBS[hoveredHub].activeTrucks} trucks</strong></span>
                <span>Weather: <strong className="text-heading dark:text-slate-300">{HUBS[hoveredHub].weather}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Corridor Details & Dispatch Intelligence Card */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="bg-surface/50 dark:bg-slate-950/60 border border-border dark:border-slate-800 rounded-xl p-4 space-y-4 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  Active Corridor Selected
                </span>
                <h4 className="text-lg font-bold text-heading dark:text-white mt-1 flex items-center gap-2">
                  {activeCorridor.name}
                </h4>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <span>{HUBS[activeCorridor.from]?.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <span>{HUBS[activeCorridor.to]?.name}</span>
                </p>
              </div>

              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase border ${getTierBadge(activeCorridor.riskTier)}`}>
                {activeCorridor.riskTier} Risk
              </span>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <div className="bg-card dark:bg-slate-900/90 border border-border/80 dark:border-slate-800/80 rounded-lg p-2.5 shadow-xs">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-sky-500" />
                  Transit Distance
                </div>
                <div className="text-base font-bold text-heading dark:text-white mt-0.5">
                  {activeCorridor.distanceKm.toLocaleString("en-IN")} km
                </div>
                <div className="text-[10px] text-muted-foreground">Est. {activeCorridor.transitHours}</div>
              </div>

              <div className="bg-card dark:bg-slate-900/90 border border-border/80 dark:border-slate-800/80 rounded-lg p-2.5 shadow-xs">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Avg Delay Probability
                </div>
                <div className="text-base font-bold text-amber-600 dark:text-amber-300 mt-0.5">
                  {activeCorridor.avgDelayRate}%
                </div>
                <div className="text-[10px] text-muted-foreground">Historical corridor rate</div>
              </div>

              <div className="bg-card dark:bg-slate-900/90 border border-border/80 dark:border-slate-800/80 rounded-lg p-2.5 shadow-xs">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-500" />
                  Fair Cost Rate
                </div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ₹{activeCorridor.avgCostPerKm} / km
                </div>
                <div className="text-[10px] text-muted-foreground">ML benchmark rate</div>
              </div>

              <div className="bg-card dark:bg-slate-900/90 border border-border/80 dark:border-slate-800/80 rounded-lg p-2.5 shadow-xs">
                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  Active In-Transit
                </div>
                <div className="text-base font-bold text-heading dark:text-white mt-0.5">
                  {activeCorridor.activeShipments} Loads
                </div>
                <div className="text-[10px] text-muted-foreground">Tracked in Control Tower</div>
              </div>
            </div>

            {/* Congestion & Road Condition */}
            <div className="bg-card/80 dark:bg-slate-900/70 border border-border dark:border-slate-800/70 rounded-lg p-3">
              <div className="text-xs font-semibold text-heading dark:text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Corridor Environmental Telematics:
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {activeCorridor.congestion}
              </p>
            </div>

            {/* Operational Recommendation */}
            <div className="bg-blue-500/10 dark:bg-blue-950/30 border border-blue-500/20 dark:border-blue-900/40 rounded-lg p-3">
              <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                AI Dispatcher Playbook Recommendation:
              </div>
              <p className="text-xs text-blue-900/80 dark:text-blue-200/80 mt-1 leading-relaxed">
                {activeCorridor.recommendation}
              </p>
            </div>
          </div>

          {/* Quick Corridor Selection Bar */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">Jump to Corridor:</span>
            <div className="flex flex-wrap gap-1.5">
              {CORRIDORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCorridorClick(c)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                    c.id === selectedId
                      ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                      : "bg-surface text-muted-foreground border-border hover:bg-accent hover:text-heading"
                  }`}
                >
                  {c.id.replace("-", " → ")}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};
