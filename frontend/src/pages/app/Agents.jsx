import { useState } from "react";
import { Search } from "lucide-react";
import { Seo } from "../../components/Seo";
import { Panel } from "../../components/app/bits";
import { useMock } from "../../mock/store";

const AUTONOMY = ["Suggest only", "Approve each action", "Act within limits"];

const Dial = ({ value, onChange, testId }) => (
  <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Autonomy level">
    {AUTONOMY.map((a) => (
      <button
        key={a}
        type="button"
        role="radio"
        aria-checked={value === a}
        data-testid={`${testId}-${a.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
        onClick={() => onChange(a)}
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
          value === a ? "border-primary bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:bg-accent"
        }`}
      >
        {a}
      </button>
    ))}
  </div>
);

const NumField = ({ label, value, onCommit, testId }) => (
  <label className="block">
    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
    <input
      type="number"
      defaultValue={value}
      data-testid={testId}
      onBlur={(e) => onCommit(Number(e.target.value))}
      onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
      className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-sm text-foreground"
    />
  </label>
);

const Agents = () => {
  const { agents, lanes, spendLimit, autoApproveUnder, allowed, auditLog, updateGuardrail } = useMock();
  const [filter, setFilter] = useState("");
  const rows = auditLog.filter((l) =>
    !filter || `${l.agent} ${l.action} ${l.inputs} ${l.result}`.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div data-testid="agents-page">
      <Seo title="Agents and Guardrails - Haulage AI" description="Autonomy levels, rate ceilings, spend limits and the audit log for every AI agent." />
      <h1 className="font-heading text-xl font-bold sm:text-2xl">Agents and Guardrails</h1>
      <p className="mt-1 text-sm text-muted-foreground">You set the limits. Every action is logged. Changes here update demo state and the audit log.</p>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="Autonomy per agent" testId="autonomy-panel">
          <div className="space-y-4">
            {agents.map((a) => (
              <div key={a.id} className="rounded-xl border bg-surface p-3.5">
                <p className="text-sm font-semibold text-heading">{a.name}</p>
                <div className="mt-2">
                  <Dial
                    value={a.autonomy}
                    testId={`dial-${a.id}`}
                    onChange={(v) => updateGuardrail("autonomy", a.id, v, `${a.name} autonomy → ${v}`)}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Rate benchmark and ceiling per lane" testId="lanes-panel">
            <div className="space-y-3">
              {lanes.map((l) => (
                <div key={l.lane} className="rounded-xl border bg-surface p-3.5">
                  <p className="text-sm font-semibold text-heading">{l.lane}</p>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <NumField label="Benchmark (Rs)" value={l.benchmark} testId={`lane-benchmark-${l.lane.replace(/[^a-z0-9]+/gi, "-")}`}
                      onCommit={(v) => updateGuardrail("lane", { lane: l.lane, field: "benchmark" }, v, `${l.lane} benchmark → Rs ${v}`)} />
                    <NumField label="Ceiling (Rs)" value={l.ceiling} testId={`lane-ceiling-${l.lane.replace(/[^a-z0-9]+/gi, "-")}`}
                      onCommit={(v) => updateGuardrail("lane", { lane: l.lane, field: "ceiling" }, v, `${l.lane} ceiling → Rs ${v}`)} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Thresholds and spend limits" testId="thresholds-panel">
            <div className="grid grid-cols-2 gap-3">
              <NumField label="Auto-approve under (Rs)" value={autoApproveUnder} testId="auto-approve-under"
                onCommit={(v) => updateGuardrail("threshold", null, v, `Auto-approve under → Rs ${v}`)} />
              <NumField label="Spend limit per action (Rs)" value={spendLimit} testId="spend-limit"
                onCommit={(v) => updateGuardrail("spend", null, v, `Spend limit per action → Rs ${v}`)} />
            </div>
          </Panel>

          <Panel title="Allowed actions" testId="allowed-panel">
            <div className="space-y-2">
              {Object.entries(allowed).map(([action, on]) => (
                <label key={action} className="flex cursor-pointer items-center gap-3 rounded-xl border bg-surface px-3.5 py-2.5">
                  <input
                    type="checkbox"
                    checked={on}
                    data-testid={`allowed-${action.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    onChange={(e) => updateGuardrail("allowed", action, e.target.checked, `${action} → ${e.target.checked ? "allowed" : "blocked"}`)}
                    className="h-4 w-4 accent-current"
                  />
                  <span className="text-sm font-medium text-heading">{action}</span>
                </label>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Panel title="Audit log" testId="audit-panel" className="mt-5"
        right={
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              data-testid="audit-search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search the log"
              aria-label="Search audit log"
              className="h-8 w-48 rounded-xl border bg-surface pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm" data-testid="audit-log">
            <thead>
              <tr className="border-b bg-surface">
                {["Time", "Agent", "Action", "Inputs", "Result", "Approver"].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold text-heading">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-muted-foreground">{l.time}</td>
                  <td className="px-4 py-3 font-medium text-heading">{l.agent}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.action}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{l.inputs}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.result}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.approver}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">No entries match "{filter}".</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};

export default Agents;
