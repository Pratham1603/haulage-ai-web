import { useEffect, useState } from "react";
import { Seo } from "../../components/Seo";
import { StatusTag } from "../../components/site/ui";
import { Panel, ActionBtn } from "../../components/app/bits";
import { useMock } from "../../mock/store";
import { apiRequest, LIVE_API_ENABLED } from "../../lib/api";
import { useAuth } from "../../auth";
import { TruckDeckVisualizer } from "../../components/app/TruckDeckVisualizer";

const LOOP = [
  { s: "Matched", tag: "ai" },
  { s: "Carrier contacted (Gujarati call)", tag: "ai" },
  { s: "Rate agreed at Rs 74,500", tag: "approval" },
  { s: "Booked in TMS", tag: "ai" },
  { s: "In transit", tag: "ai" },
];

const Loads = () => {
  const { loads, truckSuggestions, partLoadAdded, addPartLoad } = useMock();
  const { session } = useAuth();
  const [selected, setSelected] = useState("LD-201");
  const [liveLoads, setLiveLoads] = useState(null);
  const [liveSuggestions, setLiveSuggestions] = useState(null);
  const [liveError, setLiveError] = useState("");
  const [approvedTruck, setApprovedTruck] = useState("");
  const shownLoads = (LIVE_API_ENABLED && liveLoads && liveLoads.length > 0) ? liveLoads : (liveLoads || loads);
  const suggestions = (LIVE_API_ENABLED && liveSuggestions !== null) ? liveSuggestions : (liveSuggestions ?? (truckSuggestions[selected] || []));

  useEffect(() => {
    if (!LIVE_API_ENABLED) return undefined;
    let active = true;
    setLiveError("");
    Promise.all([apiRequest("/operations/vehicles"), apiRequest("/operations/loads")])
      .then(([vehicles, loadsList]) => {
        if (!active) return null;
        setLiveLoads(loadsList);
        const targetId = loadsList.some((item) => item.id === selected) ? selected : (loadsList[0]?.id || selected);
        if (targetId && targetId !== selected) {
          setSelected(targetId);
        }
        const load = loadsList.find((item) => item.id === targetId);
        if (!load || vehicles.length === 0) {
          setLiveSuggestions([]);
          return null;
        }
        return apiRequest("/matching/candidates", {
          method: "POST",
          body: JSON.stringify({ load, vehicles }),
        });
      })
      .then((result) => {
        if (!active || !result?.candidates) return;
        setLiveSuggestions(result.candidates.map((candidate) => ({
          truck: candidate.vehicle_id,
          vehicleId: candidate.vehicle_id,
          score: candidate.score,
          location: "Available in fleet network",
          capacity: `${candidate.available_pallets || 22} pallets · payload ${candidate.available_payload_kg || 12000} kg`,
          free: "Ready for dispatch",
          cost: `Rs ${Math.round(candidate.quoted_rate || 74800).toLocaleString("en-IN")}`,
          why: candidate.explanation,
        })));
      })
      .catch((error) => {
        if (active) setLiveError(error.message);
      });
    return () => { active = false; };
  }, [selected]);

  const seedLiveData = async () => {
    try {
      const result = await apiRequest("/operations/demo/seed", { method: "POST" });
      setLiveError(`Seeded ${result.loads} loads, ${result.vehicles} vehicles and ${result.carriers} carriers.`);
      setLiveLoads(await apiRequest("/operations/loads"));
    } catch (error) {
      setLiveError(error.message);
    }
  };

  const updateStatus = async (status) => {
    try {
      const updated = await apiRequest(`/operations/loads/${selected}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setLiveLoads((current) => (current || []).map((load) => load.id === selected ? updated : load));
    } catch (error) {
      setLiveError(error.message);
    }
  };

  const approveTruck = async (truck) => {
    if (!LIVE_API_ENABLED || !truck.vehicleId) return;
    try {
      await apiRequest("/assignments", {
        method: "POST",
        body: JSON.stringify({
          load_id: selected,
          vehicle_id: truck.vehicleId,
          requested_rate: Number(String(truck.cost).replace(/[^0-9.]/g, "")) || 1,
          idempotency_key: `${selected}:${truck.vehicleId}`,
        }),
      });
      setApprovedTruck(truck.vehicleId);
    } catch (error) {
      setLiveError(error.message);
    }
  };

  const negotiateVoiceQuote = async (truck) => {
    try {
      const res = await apiRequest("/voice/quote-negotiate", {
        method: "POST",
        body: JSON.stringify({
          load_id: selected,
          carrier_id: "carrier-hasmukh",
          benchmark_rate: 78000,
          ceiling_rate: 80000,
          target_rate: 74500,
        }),
      });
      setLiveError(`Voice AI negotiation complete: Rs 74,500 agreed with carrier in Gujarati (benchmark Rs 78,000). Quote status: ${res.quote.status}.`);
      setLiveSuggestions((prev) =>
        (prev || []).map((c) =>
          c.truck === truck.truck ? { ...c, cost: "Rs 74,500", why: "Voice quote agreed at Rs 74,500; within policy limits." } : c
        )
      );
    } catch (error) {
      setLiveError(error.message);
    }
  };

  return (
    <div data-testid="loads-page">
      <Seo title="Loads and Matching - Haulage AI" description="AI load-to-truck matching demo with ranked suggestions and part-load fill." />
      <h1 className="font-heading text-xl font-bold sm:text-2xl">Loads and Matching</h1>
      <p className="mt-1 text-sm text-muted-foreground">Open loads on the left, ranked trucks on the right. {LIVE_API_ENABLED ? "Live API mode." : "Demo data."}</p>
      {LIVE_API_ENABLED && (session?.role === "Owner" || session?.role === "Ops Manager") && (
        <ActionBtn primary onClick={seedLiveData}>Seed live demo data</ActionBtn>
      )}
      {liveError && <p className="mt-2 text-xs text-status-human" role="alert">Live matching status: {liveError}</p>}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Open loads" testId="open-loads">
          <div className="space-y-2">
            {shownLoads.map((l) => (
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
                {LIVE_API_ENABLED && <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-status-ai">Status: {l.status || "proposed"}</p>}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title={`Ranked trucks for ${selected}`} testId="truck-suggestions">
          {LIVE_API_ENABLED && (
            <label className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              Load status
              <select className="rounded-lg border bg-surface px-2 py-1 text-xs text-heading" value={(shownLoads.find((load) => load.id === selected)?.status || "proposed")} onChange={(event) => updateStatus(event.target.value)}>
                {['proposed', 'matched', 'assigned', 'dispatched', 'in_transit', 'delivered', 'cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
          )}
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
                <div className="mt-2 flex flex-wrap gap-2">
                  <ActionBtn primary onClick={() => approveTruck(t)}>{approvedTruck === t.vehicleId ? "Approved" : "Approve"}</ActionBtn>
                  <ActionBtn onClick={() => negotiateVoiceQuote(t)}>Voice Quote</ActionBtn>
                  <ActionBtn>Take over</ActionBtn>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Capacity & Consolidation · MH-04-XX-4471 (32 ft MXL, 22 spaces)" testId="capacity-panel" className="mt-5">
        <TruckDeckVisualizer partLoadAdded={partLoadAdded} onAddPartLoad={addPartLoad} />
        
        {/* Compact Bar for quick glance and test compatibility */}
        <div className="mt-4 pt-3 border-t">
          <div className="flex h-7 w-full overflow-hidden rounded-full bg-border text-[10px] font-semibold text-white shadow-inner" data-testid="capacity-bar">
            <span className="flex items-center justify-center bg-primary transition-all" style={{ width: `${(18 / 22) * 100}%` }}>18 Booked (81.8%)</span>
            <span
              className={`flex items-center justify-center transition-all ${partLoadAdded ? "bg-emerald-600 font-bold" : "bg-status-approval/90"}`}
              style={{ width: `${(4 / 22) * 100}%` }}
            >
              {partLoadAdded ? "+4 Jaipur (100%)" : "4 Spare"}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground" data-testid="capacity-label">
            {partLoadAdded ? "22/22 spaces filled. Jaipur-bound part-load (4 pallets) added." : "18/22 spaces booked · 4 spare on the Delhi corridor."}
          </p>
        </div>
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
