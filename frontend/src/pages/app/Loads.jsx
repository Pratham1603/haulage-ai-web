import { useState } from "react";
import { Seo } from "../../components/Seo";
import { StatusTag } from "../../components/site/ui";
import { Panel, ActionBtn } from "../../components/app/bits";
import { useMock } from "../../mock/store";

const LOOP = [
  { s: "Matched", tag: "ai" },
  { s: "Carrier contacted (Gujarati call)", tag: "ai" },
  { s: "Rate agreed at Rs 74,500", tag: "approval" },
  { s: "Booked in TMS", tag: "ai" },
  { s: "In transit", tag: "ai" },
];

const Loads = () => {
  const { loads, truckSuggestions, partLoadAdded, addPartLoad } = useMock();
  const [selected, setSelected] = useState("LD-201");
  const suggestions = truckSuggestions[selected] || [];
  const booked = partLoadAdded ? 22 : 18;

  return (
    <div data-testid="loads-page">
      <Seo title="Loads and Matching - Haulage AI" description="AI load-to-truck matching demo with ranked suggestions and part-load fill." />
      <h1 className="font-heading text-xl font-bold sm:text-2xl">Loads and Matching</h1>
      <p className="mt-1 text-sm text-muted-foreground">Open loads on the left, ranked trucks on the right. Demo data.</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Open loads" testId="open-loads">
          <div className="space-y-2">
            {loads.map((l) => (
              <button
                key={l.id}
                type="button"
                data-testid={`load-${l.id}`}
                onClick={() => setSelected(l.id)}
                aria-pressed={selected === l.id}
                className={`block w-full rounded-xl border p-3.5 text-left transition-colors ${
                  selected === l.id ? "border-status-ai/50 bg-status-ai/10" : "bg-surface hover:bg-accent"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-heading">{l.id} · {l.lane}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{l.cargo} · pickup {l.window}</p>
                <p className="mt-0.5 text-xs font-medium text-heading">{l.rate}</p>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title={`Ranked trucks for ${selected}`} testId="truck-suggestions">
          <div className="space-y-2.5">
            {suggestions.map((t, i) => (
              <div key={t.truck} className={`rounded-xl border p-3.5 ${i === 0 ? "border-status-ai/50 bg-status-ai/10" : "bg-surface"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-heading">{t.truck}</span>
                  <span className="rounded-full border border-status-ai/40 bg-status-ai/10 px-2 py-0.5 text-[10px] font-semibold text-status-ai">
                    Score {t.score}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t.location} · {t.capacity} · free {t.free}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Est. cost <span className="font-medium text-heading">{t.cost}</span></p>
                <p className="mt-1 text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">Why this truck:</span> {t.why}</p>
                <div className="mt-2 flex gap-2"><ActionBtn primary>Approve</ActionBtn><ActionBtn>Take over</ActionBtn></div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Capacity · MH-04-XX-4471 (32 ft MXL, 22 spaces)" testId="capacity-panel" className="mt-5">
        <div className="flex h-8 w-full overflow-hidden rounded-full bg-border text-[10px] font-semibold text-white" data-testid="capacity-bar">
          <span className="flex items-center justify-center bg-status-ai transition-all" style={{ width: `${(18 / 22) * 100}%` }}>18 booked</span>
          <span
            className={`flex items-center justify-center transition-all ${partLoadAdded ? "bg-status-ai/70" : "bg-status-approval/80"}`}
            style={{ width: `${(4 / 22) * 100}%` }}
          >
            {partLoadAdded ? "+4 Jaipur" : "4 spare"}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground" data-testid="capacity-label">
          {partLoadAdded ? "22/22 spaces filled. Jaipur-bound part-load (4 pallets) added." : "18/22 spaces booked · 4 spare on the Delhi corridor."}
        </p>
        {!partLoadAdded && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-status-approval/40 bg-status-approval/10 p-3">
            <p className="text-xs font-medium text-heading">Matched part-load: 4 pallets, pharma, Jaipur-side drop. Weight, pallet type and timing all compatible.</p>
            <ActionBtn primary testId="add-part-load-btn" onClick={addPartLoad}>Add part-load</ActionBtn>
          </div>
        )}
      </Panel>

      <Panel title="Coordination loop" testId="coordination-loop" className="mt-5">
        <ol className="flex flex-wrap gap-2">
          {LOOP.map((x, i) => (
            <li key={x.s} className="flex items-center gap-2 rounded-xl border bg-surface px-3 py-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-bold text-muted-foreground">{i + 1}</span>
              <span className="text-xs font-medium text-heading">{x.s}</span>
              <StatusTag variant={x.tag} />
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
};

export default Loads;
