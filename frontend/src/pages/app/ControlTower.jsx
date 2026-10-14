import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Seo } from "../../components/Seo";
import { StatusTag } from "../../components/site/ui";
import { Panel, Kpi, ActionBtn, ResolvedNote } from "../../components/app/bits";
import { useMock } from "../../mock/store";
import { useAuth } from "../../auth";
import { apiRequest, LIVE_API_ENABLED } from "../../lib/api";
import { CorridorTelematics } from "../../components/app/CorridorTelematics";

const KPIS = [
  { label: "Live shipments", value: "47" },
  { label: "On-time", value: "93%" },
  { label: "Needs you", value: "6" },
  { label: "Empty-run", value: "8%" },
  { label: "Cost saved this month", value: "Rs 1.9L", sub: "Placeholder" },
];

const OWNER_KPIS = [
  { label: "Margin this month", value: "18.4%", sub: "Placeholder" },
  { label: "Fleet utilisation", value: "87%", sub: "Placeholder" },
  { label: "Revenue per truck", value: "Rs 4.1L", sub: "Placeholder" },
  { label: "Cost per km", value: "Rs 38", sub: "Placeholder" },
];

const MapSvg = () => (
  <svg viewBox="0 0 260 150" className="w-full text-muted-foreground" role="img" aria-label="Mumbai to Delhi corridor map with shipment pins">
    <rect x="0" y="0" width="260" height="150" className="fill-surface" rx="8" />
    {/* Route draws itself on mount */}
    <path
      d="M30 122 C 90 115, 130 85, 165 60 S 220 30, 232 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="4 4"
      className="path-draw"
    />
    {/* Endpoints */}
    <circle cx="30" cy="122" r="5" className="fill-heading" stroke="none" />
    <text x="14" y="140" fontSize="9" fill="currentColor">Bhiwandi (Mumbai)</text>
    <circle cx="232" cy="24" r="5" className="fill-heading" stroke="none" />
    <text x="196" y="16" fontSize="9" fill="currentColor">Narela (Delhi)</text>
    {/* Active trucks — fade in after route draws */}
    <g style={{ animation: 'fade-in 0.5s ease-out 1.2s both' }}>
      <circle cx="100" cy="104" r="4.5" className="fill-status-ai" stroke="none" />
      <text x="70" y="98" fontSize="8" fill="currentColor">LR-8836</text>
      <circle cx="185" cy="46" r="4.5" className="fill-status-ai" stroke="none" />
      <text x="160" y="58" fontSize="8" fill="currentColor">LR-8842</text>
    </g>
    {/* Breakdown pin with ring pulse */}
    <g style={{ animation: 'fade-in 0.5s ease-out 1.5s both' }}>
      <circle cx="143" cy="76" r="11" fill="none" className="stroke-status-human" strokeWidth="1" opacity="0.3">
        <animate attributeName="r" values="7;13;7" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="143" cy="76" r="4.5" className="fill-status-human" stroke="none" />
      <text x="112" y="68" fontSize="8" fill="currentColor">LR-8839 breakdown</text>
    </g>
  </svg>
);

const ExceptionCard = ({ ex }) => {
  const { resolveException, selectOption } = useMock();

  const handleResolve = (action, label) => {
    resolveException(ex.id, action, label);
    if (LIVE_API_ENABLED) {
      apiRequest(`/operations/exceptions/${ex.id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ action, resolution_note: label, selected_option: ex.selected }),
      }).catch(() => {});
    }
  };

  const borderTone =
    ex.resolved ? "border-l-status-ai"
    : ex.tag === "human" ? "border-l-status-human"
    : ex.tag === "approval" ? "border-l-status-approval"
    : "border-l-status-ai";

  return (
    <article
      data-testid={`exception-${ex.id}`}
      className={`card-craft p-4.5 border-l-4 ${borderTone}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-heading">{ex.title}</h3>
            <span className="font-mono text-[10px] text-muted-foreground/80">{ex.id}</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ex.problem}</p>
        </div>
        <StatusTag variant={ex.tag} />
      </div>

      <div className="mt-2.5 rounded-lg border border-border/60 bg-surface/60 px-3 py-2 text-[11px] text-muted-foreground">
        <span className="font-semibold text-heading">Autonomous Action Attempted:</span> {ex.tried}
      </div>

      {ex.kind === "options" && (
        <div className="mt-3.5 space-y-2">
          {ex.options.map((o) => (
            <button
              key={o.id}
              type="button"
              data-testid={`exception-breakdown-option-${o.id}`}
              onClick={() => selectOption(ex.id, o.id)}
              aria-pressed={ex.selected === o.id}
              className={`block w-full rounded-xl border p-3 text-left transition-all ${
                ex.selected === o.id
                  ? "border-primary/60 bg-primary/5 shadow-xs translate-x-1"
                  : "border-border/70 bg-surface/70 hover:bg-surface hover:border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-heading flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full border-2 flex items-center justify-center ${ex.selected === o.id ? "border-primary bg-primary text-white" : "border-muted-foreground/40"}`}>
                    {ex.selected === o.id && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  {o.id}. {o.label}
                </span>
                {o.recommended && (
                  <span className="rounded-full border border-status-ai/40 bg-status-ai/10 px-2 py-0.5 text-[9px] font-semibold text-status-ai">Recommended</span>
                )}
              </div>
              <p className="mt-1 ml-5 text-[10px] text-muted-foreground font-mono">Cost: {o.cost} · SLA: {o.sla}{o.note ? ` · ${o.note}` : ""}</p>
            </button>
          ))}
        </div>
      )}
      {ex.resolved ? (
        <ResolvedNote>{ex.resolved}</ResolvedNote>
      ) : (
        <div className="mt-3.5 flex flex-wrap gap-2 pt-2 border-t border-border/50">
          {ex.kind === "link" ? (
            <>
              <ActionBtn primary testId={`exception-${ex.id}-open`} onClick={() => { window.location.hash = ""; handleResolve("viewed", "Opened in detail view"); }}>
                {ex.linkLabel}
              </ActionBtn>
              <ActionBtn testId={`exception-${ex.id}-takeover`} onClick={() => handleResolve("takeover", "Taken over by you")}>Take over</ActionBtn>
            </>
          ) : (
            <>
              <ActionBtn primary testId={`exception-${ex.id}-approve`}
                onClick={() => handleResolve("approve", ex.kind === "options" ? `Approved option ${ex.selected}` : "Approved")}>
                Approve{ex.kind === "options" ? ` option ${ex.selected}` : ""}
              </ActionBtn>
              <ActionBtn testId={`exception-${ex.id}-counter`} onClick={() => handleResolve("counter", "Counter sent for review")}>
                Counter / Edit
              </ActionBtn>
              <ActionBtn testId={`exception-${ex.id}-takeover`} onClick={() => handleResolve("takeover", "Taken over by you")}>Take over</ActionBtn>
            </>
          )}
        </div>
      )}
    </article>
  );
};

const ControlTower = () => {
  const { exceptions, handled } = useMock();
  const { session } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [filterTab, setFilterTab] = useState("all");
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    let active = true;
    if (!LIVE_API_ENABLED) return undefined;
    apiRequest("/intelligence/analytics")
      .then((data) => {
        if (active) setAnalytics(data);
      })
      .catch(() => {
        if (active) setAnalytics(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const open = exceptions.filter((e) => !e.resolved);
  const displayedExceptions = exceptions.filter((e) => {
    if (filterTab === "open") return !e.resolved;
    if (filterTab === "human") return e.tag === "human" && !e.resolved;
    if (filterTab === "approval") return e.tag === "approval" && !e.resolved;
    if (filterTab === "resolved") return e.resolved;
    return true;
  });

  return (
    <div data-testid="control-tower-page">
      <Seo title="Control Tower - Haulage AI" description="Live operations control tower demo: exceptions first, everything else handled." />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-bold sm:text-2xl text-heading">Control Tower</h1>
          <p className="mt-1 text-sm text-muted-foreground">Exceptions first. Everything else handled autonomously. Signed in as {session?.role}.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="sonar-ping h-2 w-2 rounded-full bg-emerald-500" />
            Corridor Stream Active
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5 stagger-list" data-testid="ct-kpis">
        {KPIS.map((k) => (
          <Kpi key={k.label} {...k} testId={`kpi-${k.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} />
        ))}
      </div>

      {analytics && (
        <Panel
          title="Predictive intelligence"
          right={<Link to="/app/analytics" className="text-xs font-bold text-primary hover:underline">View Analytics & ML Governance →</Link>}
          testId="predictive-intelligence"
          className="mt-5"
        >
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi label="Shipments" value={String(analytics.total_shipments || 0)} />
            <Kpi label="On-time rate" value={`${Math.round((analytics.kpis?.on_time_rate || 0) * 100)}%`} />
            <Kpi label="Late rate" value={`${Math.round((analytics.kpis?.late_rate || 0) * 100)}%`} />
            <Kpi label="Risk alerts" value={String((analytics.high_risk_shipments || []).length)} />
          </div>
          <div className="mt-3 rounded-xl border border-border/60 bg-surface/70 p-3 text-xs text-muted-foreground">
            {(analytics.insights || []).map((insight) => (
              <div key={insight} className="py-1">• {insight}</div>
            ))}
          </div>
        </Panel>
      )}

      {session?.role === "Owner" && (
        <Panel title="Margin and utilisation summary" testId="owner-summary" className="mt-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 stagger-list">
            {OWNER_KPIS.map((k) => (
              <Kpi key={k.label} {...k} />
            ))}
          </div>
        </Panel>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-base font-bold text-heading">
              Exceptions and approvals ({open.length} open)
            </h2>
            {/* Filter Tabs */}
            <div className="inline-flex rounded-lg border border-border/80 bg-surface/70 p-0.5 text-xs">
              {[
                { id: "all", label: `All (${exceptions.length})` },
                { id: "open", label: `Open (${open.length})` },
                { id: "human", label: "Breakdowns" },
                { id: "approval", label: "Approvals" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                    filterTab === tab.id
                      ? "bg-card text-heading shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 stagger-list" data-testid="exceptions-list">
            {displayedExceptions.map((ex) => (
              <ExceptionCard key={ex.id} ex={ex} />
            ))}
          </div>
          <button
            type="button"
            data-testid="handled-toggle"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-heading"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            41 handled by AI
          </button>
          {expanded && (
            <ul className="animate-scale-in mt-2 space-y-1.5 rounded-xl border border-border/70 bg-card p-4 shadow-xs" data-testid="handled-list">
              {handled.map((h) => (
                <li key={h} className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  {h}
                  <StatusTag variant="ai" />
                </li>
              ))}
              <li className="pt-1 text-[10px] text-muted-foreground">…and 32 more. Demo data.</li>
            </ul>
          )}
        </div>
        <Panel title="Live Corridor Telematics" testId="live-map">
          <CorridorTelematics />
        </Panel>
      </div>
    </div>
  );
};

export default ControlTower;
