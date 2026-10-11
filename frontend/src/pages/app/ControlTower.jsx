import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Seo } from "../../components/Seo";
import { StatusTag } from "../../components/site/ui";
import { Panel, Kpi, ActionBtn, ResolvedNote } from "../../components/app/bits";
import { useMock } from "../../mock/store";
import { useAuth } from "../../auth";
import { apiRequest, LIVE_API_ENABLED } from "../../lib/api";

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
    <path d="M30 122 C 90 115, 130 85, 165 60 S 220 30, 232 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
    <circle cx="30" cy="122" r="5" className="fill-heading" stroke="none" />
    <text x="14" y="140" fontSize="9" fill="currentColor">Bhiwandi (Mumbai)</text>
    <circle cx="232" cy="24" r="5" className="fill-heading" stroke="none" />
    <text x="196" y="16" fontSize="9" fill="currentColor">Narela (Delhi)</text>
    <circle cx="100" cy="104" r="4.5" className="fill-status-ai" stroke="none" />
    <text x="70" y="98" fontSize="8" fill="currentColor">LR-8836</text>
    <circle cx="185" cy="46" r="4.5" className="fill-status-ai" stroke="none" />
    <text x="160" y="58" fontSize="8" fill="currentColor">LR-8842</text>
    <g>
      <circle cx="143" cy="76" r="7" fill="none" className="stroke-status-human" strokeWidth="1.5" strokeDasharray="2 2" />
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

  return (
    <article data-testid={`exception-${ex.id}`} className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-heading">{ex.title}</h3>
        <StatusTag variant={ex.tag} />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ex.problem}</p>
      <p className="mt-1.5 text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">AI already tried:</span> {ex.tried}</p>
      {ex.kind === "options" && (
        <div className="mt-3 space-y-2">
          {ex.options.map((o) => (
            <button
              key={o.id}
              type="button"
              data-testid={`exception-breakdown-option-${o.id}`}
              onClick={() => selectOption(ex.id, o.id)}
              aria-pressed={ex.selected === o.id}
              className={`block w-full rounded-lg border p-2.5 text-left transition-colors ${
                ex.selected === o.id ? "border-status-ai/50 bg-status-ai/10" : "bg-surface hover:bg-accent"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-heading">{o.id}. {o.label}</span>
                {o.recommended && (
                  <span className="rounded-full border border-status-ai/40 bg-status-ai/10 px-2 py-0.5 text-[9px] font-semibold text-status-ai">Recommended</span>
                )}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Cost: {o.cost} · SLA: {o.sla}{o.note ? ` · ${o.note}` : ""}</p>
            </button>
          ))}
        </div>
      )}
      {ex.resolved ? (
        <ResolvedNote>{ex.resolved}</ResolvedNote>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
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
  const open = exceptions.filter((e) => !e.resolved);

  return (
    <div data-testid="control-tower-page">
      <Seo title="Control Tower - Haulage AI" description="Live operations control tower demo: exceptions first, everything else handled." />
      <h1 className="font-heading text-xl font-bold sm:text-2xl">Control Tower</h1>
      <p className="mt-1 text-sm text-muted-foreground">Exceptions first. Everything else handled. Signed in as {session?.role}.</p>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5" data-testid="ct-kpis">
        {KPIS.map((k) => (
          <Kpi key={k.label} {...k} testId={`kpi-${k.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} />
        ))}
      </div>

      {session?.role === "Owner" && (
        <Panel title="Margin and utilisation summary" testId="owner-summary" className="mt-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {OWNER_KPIS.map((k) => (
              <Kpi key={k.label} {...k} />
            ))}
          </div>
        </Panel>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_320px]">
        <div>
          <h2 className="mb-3 font-heading text-base font-bold text-heading">Exceptions and approvals ({open.length} open)</h2>
          <div className="space-y-3" data-testid="exceptions-list">
            {exceptions.map((ex) => (
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
            <ul className="mt-2 space-y-1.5 rounded-xl border bg-card p-4" data-testid="handled-list">
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
        <Panel title="Live map" testId="live-map">
          <MapSvg />
          <ul className="mt-3 space-y-1.5 text-[11px] text-muted-foreground">
            <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-status-ai" /> On track</li>
            <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-status-human" /> Breakdown · LR-8839 near Beawar</li>
          </ul>
          <p className="mt-2 text-[10px] text-muted-foreground">Map placeholder, no live GPS. Demo data.</p>
        </Panel>
      </div>
    </div>
  );
};

export default ControlTower;
