import { useState } from "react";
import { 
  Radar, 
  Phone, 
  Truck, 
  CheckCircle2, 
  Play, 
  Pause, 
  ShieldCheck, 
  ArrowUpRight, 
  Sparkles,
  Zap
} from "lucide-react";
import { StatusTag } from "./ui";

export const HeroInteractiveShowcase = () => {
  const [activeTab, setActiveTab] = useState("control-tower");
  const [approvedException, setApprovedException] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [capacityFilled, setCapacityFilled] = useState(false);

  return (
    <div className="relative mx-auto w-full max-w-xl" data-testid="control-tower-mockup">
      {/* Floating Accent Capsule - Top Right */}
      <div className="glass-capsule absolute -right-3 -top-5 z-20 hidden items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-heading shadow-lg sm:flex animate-fade-in">
        <span className="sonar-ping h-2 w-2 rounded-full bg-status-ai" />
        <span className="font-mono text-[11px] tracking-tight">NH-48 Live · 64 km/h</span>
      </div>

      {/* Floating Accent Capsule - Bottom Left */}
      <div className="glass-capsule absolute -bottom-4 -left-3 z-20 hidden items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-heading shadow-lg sm:flex animate-fade-in">
        <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
        <span className="font-mono text-[11px] tracking-tight">340ms Voice Latency (Hindi/Gujarati)</span>
      </div>

      {/* Main Craft Window Frame */}
      <div className="card-craft overflow-hidden shadow-2xl border-border/80 bg-card/95 backdrop-blur-md">
        {/* Window Chrome Header with Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-border/70 bg-surface/75 px-3 py-2.5 sm:px-4">
          {/* Traffic Lights */}
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 transition-opacity hover:opacity-100" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 transition-opacity hover:opacity-100" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 transition-opacity hover:opacity-100" />
            <span className="ml-2 hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline-block">
              haulage-ai · mission-deck
            </span>
          </div>

          {/* Interactive Switcher Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-card/80 p-0.5">
            <button
              onClick={() => setActiveTab("control-tower")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                activeTab === "control-tower"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-heading"
              }`}
            >
              <Radar className="h-3 w-3" />
              <span>Control Tower</span>
            </button>
            <button
              onClick={() => setActiveTab("voice-ai")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                activeTab === "voice-ai"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-heading"
              }`}
            >
              <Phone className="h-3 w-3" />
              <span>Voice AI</span>
            </button>
            <button
              onClick={() => setActiveTab("capacity")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                activeTab === "capacity"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-heading"
              }`}
            >
              <Truck className="h-3 w-3" />
              <span>3D Deck</span>
            </button>
          </div>
        </div>

        {/* Tab 1 Content: Control Tower */}
        {activeTab === "control-tower" && (
          <div className="p-4 sm:p-5 animate-fade-in space-y-4">
            {/* Live KPI Grid */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-border/70 bg-surface/80 p-2.5 shadow-xs">
                <span className="label-caps text-muted-foreground text-[9px]">On-time SLA</span>
                <p className="font-heading text-lg font-bold text-heading tabular">98.4%</p>
                <span className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">+2.1% YoY</span>
              </div>
              <div className="rounded-xl border border-border/70 bg-surface/80 p-2.5 shadow-xs">
                <span className="label-caps text-muted-foreground text-[9px]">Active Fleet</span>
                <p className="font-heading text-lg font-bold text-heading tabular">42 / 42</p>
                <span className="font-mono text-[9px] text-muted-foreground">NH-48 Corridor</span>
              </div>
              <div className="rounded-xl border border-border/70 bg-surface/80 p-2.5 shadow-xs">
                <span className="label-caps text-muted-foreground text-[9px]">Exceptions</span>
                <p className="font-heading text-lg font-bold text-heading tabular">
                  {approvedException ? "2" : "3"}
                </p>
                <span className="font-mono text-[9px] text-amber-600 dark:text-amber-400 font-semibold">
                  {approvedException ? "Resolved" : "1 Critical"}
                </span>
              </div>
              <div className="rounded-xl border border-border/70 bg-surface/80 p-2.5 shadow-xs">
                <span className="label-caps text-muted-foreground text-[9px]">AI Autonomy</span>
                <p className="font-heading text-lg font-bold text-heading tabular">89.2%</p>
                <span className="font-mono text-[9px] text-status-ai font-semibold">100% Logged</span>
              </div>
            </div>

            {/* NH-48 Telematics SVG Mini Map */}
            <div className="rounded-xl border border-border/80 bg-surface/60 p-3 shadow-xs">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="sonar-ping h-2 w-2 rounded-full bg-status-ai" />
                  <span className="text-xs font-semibold text-heading">NH-48 Golden Quadrilateral · Bhiwandi ⇄ Narela</span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground font-semibold">1,420 KM</span>
              </div>

              <div className="relative">
                <svg viewBox="0 0 460 90" className="w-full text-muted-foreground" role="img" aria-label="Route map from Mumbai to Delhi">
                  <rect width="460" height="90" rx="8" className="fill-surface/80" />
                  {/* Highway route curve */}
                  <path d="M40 70 C 140 75, 260 45, 420 22" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-border" />
                  
                  {/* Origin */}
                  <circle cx="40" cy="70" r="4.5" className="fill-heading" />
                  <text x="24" y="86" fontSize="9" fontWeight="600" fill="currentColor">Bhiwandi Hub</text>

                  {/* Destination */}
                  <circle cx="420" cy="22" r="4.5" className="fill-heading" />
                  <text x="395" y="14" fontSize="9" fontWeight="600" fill="currentColor">Narela DC</text>

                  {/* Live moving truck pin with sonar wave */}
                  <g transform="translate(230, 48)">
                    <circle cx="0" cy="0" r="10" fill="none" className="stroke-status-ai" strokeWidth="1.5" opacity="0.4">
                      <animate attributeName="r" values="5;14;5" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="0" cy="0" r="4.5" className="fill-status-ai" />
                    <text x="-40" y="-8" fontSize="8.5" fontWeight="700" className="fill-heading font-mono">
                      LR-8839 (64 km/h)
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Interactive Exception Resolution Row */}
            <div className="rounded-xl border border-border/80 bg-card p-3 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="label-caps text-muted-foreground text-[9px]">Live Exception Queue</span>
                <StatusTag variant={approvedException ? "ai" : "approval"} />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg border border-border/60 bg-surface/70 p-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-heading">LR-8836</span>
                    <span className="text-[11px] font-medium text-foreground">Detention claim ₹4,500 at Bhiwandi Dock 3</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    FASTag GPS wait-time verified: 4h 12m. Standard threshold: 2h.
                  </p>
                </div>

                <div>
                  {approvedException ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approved
                    </span>
                  ) : (
                    <button
                      onClick={() => setApprovedException(true)}
                      className="btn-tactile inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      <Sparkles className="h-3 w-3" />
                      Approve ₹4,500
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2 Content: Voice AI Acoustic Lab */}
        {activeTab === "voice-ai" && (
          <div className="p-4 sm:p-5 animate-fade-in space-y-4">
            {/* Active Voice Channel Bar */}
            <div className="flex items-center justify-between rounded-xl border border-border/80 bg-surface/80 p-3 shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  className="btn-tactile flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
                  aria-label={isPlayingAudio ? "Pause Voice Simulation" : "Play Voice Simulation"}
                >
                  {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </button>
                <div>
                  <p className="text-xs font-bold text-heading">+91 98201 44210 · Driver Ramesh</p>
                  <p className="font-mono text-[10px] text-muted-foreground flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Gujarati Voice Agent · 00:42
                  </p>
                </div>
              </div>

              {/* Dynamic Sound Wave Bars */}
              <div className="flex items-end gap-1 h-7 px-2">
                <span className="w-1 rounded-full bg-status-ai eq-bar-1" />
                <span className="w-1 rounded-full bg-status-ai eq-bar-2" />
                <span className="w-1 rounded-full bg-status-ai eq-bar-3" />
                <span className="w-1 rounded-full bg-status-ai eq-bar-4" />
                <span className="w-1 rounded-full bg-status-ai eq-bar-5" />
                <span className="w-1 rounded-full bg-status-ai eq-bar-6" />
              </div>
            </div>

            {/* Live Bilingual Dialogue Bubbles */}
            <div className="space-y-3">
              <div className="max-w-[88%] rounded-xl border border-border/80 bg-surface/90 p-3 shadow-xs">
                <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground mb-1">
                  <span>DRIVER RAMESH (GUJARATI)</span>
                  <span className="font-mono">T+0.00s</span>
                </div>
                <p className="text-xs font-semibold text-heading">
                  "સર, ટ્રક નરેલા ક્યારે પહોંચશે? લોડિંગ ટીમ રાહ જોઈ રહી છે."
                </p>
                <p className="text-[11px] text-muted-foreground italic mt-0.5">
                  "Sir, when will the truck reach Narela? The loading crew is on site."
                </p>
              </div>

              <div className="ml-auto max-w-[88%] rounded-xl border border-status-ai/40 bg-status-ai/10 p-3 shadow-xs">
                <div className="flex items-center justify-between text-[10px] font-semibold text-status-ai mb-1">
                  <span>HAULAGE VOICE AGENT</span>
                  <span className="font-mono">T+340ms (Inference)</span>
                </div>
                <p className="text-xs font-semibold text-heading">
                  "ટ્રક સાંજે 6 વાગ્યા સુધીમાં પહોંચી જશે. મેં ડ્રાઈવર સાથે વાત કરી લીધી છે."
                </p>
                <p className="text-[11px] text-muted-foreground italic mt-0.5">
                  "The truck will arrive by 6 PM. GPS tracking confirms 64 km/h avg."
                </p>
              </div>
            </div>

            {/* Voice Engine Latency HUD */}
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-status-ai" />
                Whisper Large-v3 + DeepSeek R1
              </span>
              <span className="font-mono font-semibold text-status-ai">Latency: 340ms · 99.4% Intent Match</span>
            </div>
          </div>
        )}

        {/* Tab 3 Content: 3D Capacity & Load Optimization */}
        {activeTab === "capacity" && (
          <div className="p-4 sm:p-5 animate-fade-in space-y-4">
            <div className="rounded-xl border border-border/80 bg-surface/80 p-3 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-bold text-heading">32-ft Multi-Axle Container (MH-04-GP-9122)</span>
                  <p className="text-[11px] text-muted-foreground">Bhiwandi Hub → Gurgaon Warehouse</p>
                </div>
                <span className={`font-mono text-xs font-bold ${capacityFilled ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                  {capacityFilled ? "100% UTILIZED" : "82% LOADED (4 Pallets Open)"}
                </span>
              </div>

              {/* Visual 3D Deck Pallet Grid */}
              <div className="h-8 w-full rounded-lg bg-surface border border-border/80 overflow-hidden flex p-1 gap-1">
                <div className="h-full rounded bg-primary/80 w-[82%] flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                  18 Pallets Committed
                </div>
                <div className={`h-full rounded transition-all flex items-center justify-center text-[9px] font-bold ${
                  capacityFilled ? "bg-emerald-500 text-white w-[18%]" : "border border-dashed border-muted-foreground/50 text-muted-foreground w-[18%]"
                }`}>
                  {capacityFilled ? "+4 Return" : "Empty"}
                </div>
              </div>

              {/* Metric Yield comparison */}
              <div className="mt-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground text-[10px] block">RETURN LEG MARGIN</span>
                  <span className="font-mono font-bold text-heading">
                    {capacityFilled ? "₹52,400 (Maximized)" : "₹34,000"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[10px] block">AXLE COMPLIANCE</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {capacityFilled ? "18.8T / 19.0T MoRTH Legal" : "15.4T / 19.0T"}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Add Pallets Action */}
            <div className="flex items-center justify-between rounded-xl border border-status-ai/30 bg-status-ai/10 p-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-heading">Instant Spot Match Available</p>
                <p className="text-[11px] text-muted-foreground">Surat textile shipper needs 4 pallets to Gurgaon.</p>
              </div>
              <button
                onClick={() => setCapacityFilled(!capacityFilled)}
                className="btn-tactile shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {capacityFilled ? "Reset Load" : "Auto-Fill (+₹18.4k)"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
