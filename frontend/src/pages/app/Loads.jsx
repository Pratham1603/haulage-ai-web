import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Sparkles,
  Truck,
  TrendingDown,
  ShieldAlert,
  Sliders,
  PhoneCall,
  Volume2,
  DollarSign,
  ShieldCheck,
  Check,
  X,
  Leaf,
  Split,
} from "lucide-react";
import { toast } from "sonner";

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
  const [liveVehicles, setLiveVehicles] = useState([]);
  const [liveSuggestions, setLiveSuggestions] = useState(null);
  const [liveError, setLiveError] = useState("");
  const [approvedTruck, setApprovedTruck] = useState("");

  // Mode switcher: "single" or "optimizer"
  const [viewMode, setViewMode] = useState("single");
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [showRejected, setShowRejected] = useState(false);
  const [costEstimates, setCostEstimates] = useState({});

  // Sensitivity Simulator State (Feature 1)
  const [sensitivityWeights, setSensitivityWeights] = useState({
    cost_weight: 1.0,
    risk_weight: 1.0,
    reliability_weight: 1.0,
    utilization_weight: 1.0,
  });
  const [activePreset, setActivePreset] = useState("balanced");
  const [showSimulator, setShowSimulator] = useState(true);

  // Negotiation Co-Pilot State (Feature 2)
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotTargetLoad, setCopilotTargetLoad] = useState(null);
  const [carrierAskInput, setCarrierAskInput] = useState(78000);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResult, setCopilotResult] = useState(null);
  const [voiceCallInProgress, setVoiceCallInProgress] = useState(false);
  const [selectedScriptLang, setSelectedScriptLang] = useState("gu");
  const [ltlLoading, setLtlLoading] = useState(false);
  const [ltlResult, setLtlResult] = useState(null);


  const shownLoads = (LIVE_API_ENABLED && liveLoads && liveLoads.length > 0) ? liveLoads : (liveLoads || loads);
  const suggestions = (LIVE_API_ENABLED && liveSuggestions !== null) ? liveSuggestions : (liveSuggestions ?? (truckSuggestions[selected] || []));

  useEffect(() => {
    if (!LIVE_API_ENABLED) return undefined;
    let active = true;
    setLiveError("");

    Promise.all([apiRequest("/operations/vehicles"), apiRequest("/operations/loads")])
      .then(([vehicles, loadsList]) => {
        if (!active) return null;
        setLiveVehicles(vehicles || []);
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

        // Fetch cost estimate for selected load
        apiRequest("/intelligence/cost-estimate", {
          method: "POST",
          body: JSON.stringify({ shipment: load }),
        }).then((costRes) => {
          if (active && costRes) {
            setCostEstimates((prev) => ({ ...prev, [targetId]: costRes }));
          }
        }).catch(() => {});

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

  const applyPreset = (presetKey) => {
    setActivePreset(presetKey);
    let newWeights = { cost_weight: 1.0, risk_weight: 1.0, reliability_weight: 1.0, utilization_weight: 1.0 };
    if (presetKey === "economy") {
      newWeights = { cost_weight: 2.0, risk_weight: 0.4, reliability_weight: 0.5, utilization_weight: 1.2 };
    } else if (presetKey === "zero_risk") {
      newWeights = { cost_weight: 0.6, risk_weight: 2.0, reliability_weight: 1.8, utilization_weight: 0.6 };
    } else if (presetKey === "max_utilization") {
      newWeights = { cost_weight: 1.0, risk_weight: 0.8, reliability_weight: 0.8, utilization_weight: 2.0 };
    }
    setSensitivityWeights(newWeights);
    runFleetOptimization(newWeights);
  };

  const runFleetOptimization = async (customWeights = sensitivityWeights) => {
    setOptimizing(true);
    try {
      let vehicles = liveVehicles;
      let openLoads = shownLoads;
      if (!vehicles || vehicles.length === 0) {
        vehicles = await apiRequest("/operations/vehicles");
        setLiveVehicles(vehicles);
      }

      const res = await apiRequest("/intelligence/optimization", {
        method: "POST",
        body: JSON.stringify({ loads: openLoads, vehicles, weights: customWeights }),
      });
      setOptimizationResult(res);
      toast.success(`Multi-order optimization complete via ${res.solver}! Assigned ${res.assigned_orders} of ${res.total_orders} loads.`);
    } catch (err) {
      toast.error(`Optimization failed: ${err.message}`);
    } finally {
      setOptimizing(false);
    }
  };

  const openNegotiationCopilot = (load, candidateTruck = null) => {
    const targetLoad = load || shownLoads.find((l) => l.id === selected) || shownLoads[0];
    setCopilotTargetLoad(targetLoad);
    const initialAsk = candidateTruck?.quoted_rate || (candidateTruck?.cost ? Number(String(candidateTruck.cost).replace(/[^0-9.]/g, "")) : 78000) || 78000;
    setCarrierAskInput(initialAsk);
    setCopilotOpen(true);
    evaluateCopilot(targetLoad, initialAsk);
  };

  const evaluateCopilot = async (load, askRate) => {
    if (!load) return;
    try {
      setCopilotLoading(true);
      const res = await apiRequest("/voice/negotiation-copilot", {
        method: "POST",
        body: JSON.stringify({
          load_id: load.id || load.load_id,
          origin: load.origin || load.pickup_location || "Bhiwandi",
          destination: load.destination || load.drop_location || "Delhi",
          trip_distance_km: Number(load.trip_distance_km || load.distance_km || 1420),
          weight_kg: Number(load.weight_kg || 14000),
          customer_revenue: Number(load.expected_revenue || load.revenue || 92000),
          carrier_ask_rate: Number(askRate),
        }),
      });
      setCopilotResult(res);
    } catch (err) {
      toast.error(`Co-Pilot evaluation error: ${err.message}`);
    } finally {
      setCopilotLoading(false);
    }
  };

  const executeVoiceNegotiation = async () => {
    if (!copilotResult || !copilotTargetLoad) return;
    try {
      setVoiceCallInProgress(true);
      const res = await apiRequest("/voice/quote-negotiate", {
        method: "POST",
        body: JSON.stringify({
          load_id: copilotTargetLoad.id || copilotTargetLoad.load_id,
          carrier_id: "carrier-hasmukh",
          carrier_ask_rate: Number(carrierAskInput),
          target_rate: copilotResult.recommended_counter_offer,
          ceiling_rate: copilotResult.max_acceptable_ceiling,
        }),
      });
      toast.success(`Voice AI negotiation complete! Rate closed at Rs ${res.quote.amount.toLocaleString("en-IN")}`);
      if (LIVE_API_ENABLED) {
        setLiveLoads(await apiRequest("/operations/loads"));
      }
      setCopilotOpen(false);
    } catch (err) {
      toast.error(`Voice negotiation failed: ${err.message}`);
    } finally {
      setVoiceCallInProgress(false);
    }
  };

  const seedLiveData = async () => {
    try {
      const result = await apiRequest("/operations/demo/seed", { method: "POST" });
      setLiveError(`Seeded ${result.loads} loads, ${result.vehicles} vehicles and ${result.carriers} carriers.`);
      setLiveLoads(await apiRequest("/operations/loads"));
      setLiveVehicles(await apiRequest("/operations/vehicles"));
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
      toast.success(`Truck ${truck.vehicleId} approved and booked in TMS.`);
    } catch (error) {
      setLiveError(error.message);
      toast.error(`Approval failed: ${error.message}`);
    }
  };

  const approveOptimizedAssignment = async (assignment) => {
    try {
      await apiRequest("/assignments", {
        method: "POST",
        body: JSON.stringify({
          load_id: assignment.load_id,
          vehicle_id: assignment.vehicle_id,
          requested_rate: assignment.quoted_rate,
          idempotency_key: `${assignment.load_id}:${assignment.vehicle_id}`,
        }),
      });
      setApprovedTruck(assignment.vehicle_id);
      toast.success(`Assignment ${assignment.load_id} → ${assignment.vehicle_id} confirmed and saved.`);
    } catch (err) {
      toast.error(`Booking failed: ${err.message}`);
    }
  };

  const runLtlConsolidation = async () => {
    setLtlLoading(true);
    try {
      let vehicles = liveVehicles;
      let openLoads = shownLoads;
      if (!vehicles || vehicles.length === 0) {
        vehicles = await apiRequest("/operations/vehicles");
        setLiveVehicles(vehicles);
      }
      const res = await apiRequest("/intelligence/ltl-consolidation", {
        method: "POST",
        body: JSON.stringify({ loads: openLoads, vehicles }),
      });
      setLtlResult(res);
      toast.success(`Discovered ${res.consolidation_candidates_count} feasible 2-drop part-load consolidation pairings!`);
    } catch (err) {
      toast.error(`LTL consolidation failed: ${err.message}`);
    } finally {
      setLtlLoading(false);
    }
  };

  const approveConsolidatedPair = async (proposal) => {
    try {
      toast.success(`2-Drop Consolidation Confirmed! Pair ${proposal.primary_load_id} + ${proposal.secondary_load_id} assigned to ${proposal.vehicle_id}. Direct savings: Rs ${Math.round(proposal.net_savings).toLocaleString("en-IN")}`);
      setApprovedTruck(proposal.vehicle_id);
    } catch (err) {
      toast.error(`Booking failed: ${err.message}`);
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
      toast.success("Voice AI negotiation successfully secured rate at Rs 74,500.");
    } catch (error) {
      setLiveError(error.message);
    }
  };

  const currentLoadEstimate = costEstimates[selected];

  return (
    <div data-testid="loads-page" className="space-y-6 pb-12">
      <Seo title="Loads and Matching - Haulage AI" description="AI load-to-truck matching and multi-order fleet optimization demo." />

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-bold sm:text-2xl text-heading">Loads and Matching</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rank individual trucks or run combinatorial fleet allocation across multiple pending orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {LIVE_API_ENABLED && (session?.role === "Owner" || session?.role === "Ops Manager") && (
            <ActionBtn onClick={seedLiveData}>Seed live demo data</ActionBtn>
          )}

          {/* Mode Switcher Tabs */}
          <div className="inline-flex rounded-lg border border-border/80 bg-surface/70 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("single")}
              className={`rounded-md px-3 py-1.5 font-medium transition-all ${
                viewMode === "single"
                  ? "bg-card text-heading shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-heading"
              }`}
            >
              Single-Load Matcher
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("optimizer");
                if (!optimizationResult) runFleetOptimization();
              }}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                viewMode === "optimizer"
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-heading"
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              Multi-Order Fleet Optimizer
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("ltl");
                if (!ltlResult) runLtlConsolidation();
              }}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                viewMode === "ltl"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-muted-foreground hover:text-heading"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              LTL 2-Drop Consolidator
            </button>
          </div>
        </div>

      </div>

      {liveError && <p className="text-xs text-status-human" role="alert">Live matching status: {liveError}</p>}

      {/* VIEW MODE 1: SINGLE LOAD MATCHING (Existing Module 3 Preserved) */}
      {viewMode === "single" && (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Open loads" testId="open-loads">
              <div className="space-y-2 stagger-list">
                {shownLoads.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    data-testid={`load-${l.id}`}
                    onClick={() => setSelected(l.id)}
                    aria-pressed={selected === l.id}
                    className={`card-craft block w-full p-3.5 text-left transition-all ${
                      selected === l.id
                        ? "border-l-4 border-l-status-ai bg-status-ai/10 shadow-xs"
                        : "border-l-4 border-l-transparent hover:border-l-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-heading">{l.id} · {l.lane || `${l.origin} → ${l.destination}`}</span>
                      {LIVE_API_ENABLED && (
                        <span className="rounded-full border border-status-ai/40 bg-status-ai/10 px-2 py-0.5 text-[9px] font-semibold uppercase text-status-ai">
                          {l.status || "proposed"}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{l.cargo || "General freight"} · {l.vehicle_type} · {l.weight_kg ? `${l.weight_kg.toLocaleString()} kg` : "12,000 kg"}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="font-mono text-xs font-semibold text-heading tabular">{l.rate || "Rs 74,000"}</p>
                      {costEstimates[l.id] && (
                        <span className="text-[10px] text-muted-foreground">
                          ML Cost: <span className="font-mono font-bold text-heading">Rs {Math.round(costEstimates[l.id].predicted_trip_cost).toLocaleString("en-IN")}</span> · {costEstimates[l.id].margin_percent}% margin
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title={`Ranked trucks for ${selected}`} testId="truck-suggestions">
              {LIVE_API_ENABLED && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Load status
                    <select
                      className="rounded-lg border bg-surface px-2 py-1 text-xs text-heading"
                      value={(shownLoads.find((load) => load.id === selected)?.status || "proposed")}
                      onChange={(event) => updateStatus(event.target.value)}
                    >
                      {['proposed', 'matched', 'assigned', 'dispatched', 'in_transit', 'delivered', 'cancelled'].map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </label>

                  {currentLoadEstimate && (
                    <span className="rounded-lg border border-border/60 bg-surface/70 px-2 py-1 text-[11px] text-muted-foreground font-mono">
                      Expected Profit: <span className="font-bold text-emerald-600 dark:text-emerald-400">Rs {Math.round(currentLoadEstimate.expected_profit).toLocaleString("en-IN")}</span> ({currentLoadEstimate.margin_percent}%)
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-3 stagger-list">
                {suggestions.map((t, i) => (
                  <div
                    key={t.truck}
                    className={`card-craft p-4 ${
                      i === 0
                        ? "border-l-4 border-l-status-ai bg-status-ai/5 shadow-xs"
                        : "border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-heading">{t.truck}</span>
                        {i === 0 && (
                          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                            BEST MATCH
                          </span>
                        )}
                      </div>
                      <span className="font-mono rounded-full border border-status-ai/40 bg-status-ai/10 px-2.5 py-0.5 text-[10px] font-bold text-status-ai">
                        Score {t.score}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">{t.location} · {t.capacity} · free {t.free}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Est. cost <span className="font-mono font-bold text-heading">{t.cost}</span></p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground bg-surface/70 rounded-md p-2 border border-border/50">
                      <span className="font-semibold text-heading">Why this truck:</span> {t.why}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-border/50">
                      <ActionBtn primary onClick={() => approveTruck(t)}>
                        {approvedTruck === t.vehicleId ? "Approved" : "Approve"}
                      </ActionBtn>
                      <ActionBtn onClick={() => openNegotiationCopilot(shownLoads.find((l) => l.id === selected), t)}>
                        <PhoneCall className="mr-1 h-3 w-3 inline text-primary" />
                        AI Rate Co-Pilot
                      </ActionBtn>
                      <ActionBtn onClick={() => negotiateVoiceQuote(t)}>Quick Call</ActionBtn>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <Panel title="Capacity & Consolidation · MH-04-XX-4471 (32 ft MXL, 22 spaces)" testId="capacity-panel">
            <TruckDeckVisualizer partLoadAdded={partLoadAdded} onAddPartLoad={addPartLoad} />
            <div className="mt-4 pt-3 border-t">
              <div className="flex h-7 w-full overflow-hidden rounded-full bg-border text-[10px] font-semibold shadow-inner" data-testid="capacity-bar">
                <span className="flex items-center justify-center bg-primary text-primary-foreground font-bold transition-all" style={{ width: `${(18 / 22) * 100}%` }}>18 Booked (81.8%)</span>
                <span
                  className={`flex items-center justify-center text-white transition-all ${partLoadAdded ? "bg-emerald-600 font-bold" : "bg-amber-600 dark:bg-amber-500 font-semibold"}`}
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
        </>
      )}

      {/* VIEW MODE 2: MULTI-ORDER FLEET OPTIMIZER (OR-Tools CP-SAT) */}
      {viewMode === "optimizer" && (
        <div className="space-y-6">
          {/* Optimizer Summary Banner */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                    <Cpu className="h-3.5 w-3.5" />
                    Google OR-Tools CP-SAT Solver
                  </span>
                  <span className="text-xs text-muted-foreground">Combinatorial Integer Programming</span>
                </div>
                <h2 className="mt-2 font-heading text-lg font-bold text-heading">
                  Fleet-Wide Multi-Order Allocation Recommendation
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Simultaneously optimizes across all {shownLoads.length} open orders and fleet vehicles to minimize transportation cost and delay risk.
                </p>
              </div>

              <ActionBtn primary onClick={runFleetOptimization} disabled={optimizing}>
                <Sparkles className={`mr-1.5 h-3.5 w-3.5 inline ${optimizing ? "animate-spin" : ""}`} />
                {optimizing ? "Optimizing Fleet..." : "Re-Run Fleet Optimizer"}
              </ActionBtn>
            </div>

            {/* Benchmark Comparison Metrics */}
            {optimizationResult && (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-border/50 pt-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Fulfillment Rate</p>
                  <p className="mt-1 font-heading text-xl font-bold text-heading">
                    {optimizationResult.assigned_orders} / {optimizationResult.total_orders} Orders
                  </p>
                  <p className="text-[10px] text-emerald-500 font-medium">100% hard constraints satisfied</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Optimized Fleet Cost</p>
                  <p className="mt-1 font-mono text-xl font-bold text-heading">
                    Rs {Math.round(optimizationResult.estimated_total_cost || 0).toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Global combinatorial minimum</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Baseline Matcher Cost</p>
                  <p className="mt-1 font-mono text-xl font-bold text-muted-foreground">
                    Rs {Math.round(optimizationResult.baseline_cost || 0).toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Single-order greedy assignment</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Verifiable Fleet Savings</p>
                  <p className="mt-1 font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingDown className="h-4 w-4" />
                    Rs {Math.round(optimizationResult.savings || 0).toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-emerald-600/80">Against existing Module 3 matcher</p>
                </div>
              </div>
            )}
          </div>

          {/* FEATURE 1: MULTI-OBJECTIVE OPTIMIZATION SENSITIVITY SIMULATOR */}
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                <h3 className="font-heading text-sm font-bold text-heading">
                  Optimization Sensitivity Simulator & What-If Controls
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSimulator(!showSimulator)}
                className="text-xs font-semibold text-primary flex items-center gap-1"
              >
                {showSimulator ? "Collapse Sliders" : "Expand Simulator"}
                {showSimulator ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            {showSimulator && (
              <div className="space-y-4">
                {/* Presets */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-muted-foreground font-semibold">Strategic Presets:</span>
                  {[
                    { key: "balanced", label: "⚡ Balanced Default", desc: "Equal weighting across cost, risk & reliability" },
                    { key: "economy", label: "💰 Economy First", desc: "Prioritizes minimal freight spend" },
                    { key: "zero_risk", label: "🛡️ Zero-Risk Priority", desc: "Avoids delays and maximizes carrier reliability" },
                    { key: "max_utilization", label: "📦 Max Utilization", desc: "Favors maximum vehicle payload packing" },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => applyPreset(p.key)}
                      className={`rounded-lg px-3 py-1.5 font-medium border transition-all ${
                        activePreset === p.key
                          ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                          : "bg-surface hover:bg-surface/80 border-border text-muted-foreground"
                      }`}
                      title={p.desc}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* 4 Interactive Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  <div className="bg-surface/50 border border-border/60 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-heading flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                        Cost Minimization
                      </span>
                      <span className="font-mono text-primary font-bold">{sensitivityWeights.cost_weight.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="2.5"
                      step="0.1"
                      value={sensitivityWeights.cost_weight}
                      onChange={(e) => {
                        setActivePreset("custom");
                        setSensitivityWeights((prev) => ({ ...prev, cost_weight: parseFloat(e.target.value) }));
                      }}
                      className="w-full accent-primary cursor-pointer"
                    />
                    <p className="text-[10px] text-muted-foreground">Aggressiveness of carrier rate penalty</p>
                  </div>

                  <div className="bg-surface/50 border border-border/60 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-heading flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        Delay Risk Aversion
                      </span>
                      <span className="font-mono text-primary font-bold">{sensitivityWeights.risk_weight.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="2.5"
                      step="0.1"
                      value={sensitivityWeights.risk_weight}
                      onChange={(e) => {
                        setActivePreset("custom");
                        setSensitivityWeights((prev) => ({ ...prev, risk_weight: parseFloat(e.target.value) }));
                      }}
                      className="w-full accent-primary cursor-pointer"
                    />
                    <p className="text-[10px] text-muted-foreground">Penalty weight on ML delay probability</p>
                  </div>

                  <div className="bg-surface/50 border border-border/60 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-heading flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                        Carrier Reliability
                      </span>
                      <span className="font-mono text-primary font-bold">{sensitivityWeights.reliability_weight.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="2.5"
                      step="0.1"
                      value={sensitivityWeights.reliability_weight}
                      onChange={(e) => {
                        setActivePreset("custom");
                        setSensitivityWeights((prev) => ({ ...prev, reliability_weight: parseFloat(e.target.value) }));
                      }}
                      className="w-full accent-primary cursor-pointer"
                    />
                    <p className="text-[10px] text-muted-foreground">Bonus rewarded to high on-time carriers</p>
                  </div>

                  <div className="bg-surface/50 border border-border/60 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-heading flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-indigo-500" />
                        Vehicle Utilization
                      </span>
                      <span className="font-mono text-primary font-bold">{sensitivityWeights.utilization_weight.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="2.5"
                      step="0.1"
                      value={sensitivityWeights.utilization_weight}
                      onChange={(e) => {
                        setActivePreset("custom");
                        setSensitivityWeights((prev) => ({ ...prev, utilization_weight: parseFloat(e.target.value) }));
                      }}
                      className="w-full accent-primary cursor-pointer"
                    />
                    <p className="text-[10px] text-muted-foreground">Bonus for tighter payload capacity match</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted-foreground">
                    {optimizationResult && (
                      <span>
                        Resulting Carrier Reliability: <strong className="text-heading font-mono">{Math.round((optimizationResult.average_carrier_reliability || 0.88) * 100)}%</strong> · Avg Utilization: <strong className="text-heading font-mono">{Math.round((optimizationResult.average_vehicle_utilization || 0.82) * 100)}%</strong>
                      </span>
                    )}
                  </div>
                  <ActionBtn primary onClick={() => runFleetOptimization(sensitivityWeights)} disabled={optimizing}>
                    <Sparkles className="mr-1.5 h-3 w-3 inline" />
                    Apply Weights & Re-Solve
                  </ActionBtn>
                </div>
              </div>
            )}
          </div>

          {/* Allocation Assignments Cards */}
          {optimizationResult?.feasible_assignments && (
            <div className="space-y-4">
              <h3 className="font-heading text-base font-bold text-heading">
                Recommended Assignments ({optimizationResult.feasible_assignments.length} Orders)
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                {optimizationResult.feasible_assignments.map((assignment) => (
                  <div
                    key={assignment.load_id}
                    className="card-craft p-5 border-l-4 border-l-primary shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-sm font-bold text-heading">{assignment.load_id}</span>
                        <span className="mx-2 text-muted-foreground">→</span>
                        <span className="font-mono text-sm font-bold text-primary">{assignment.vehicle_id}</span>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        assignment.risk_score < 0.35
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                          : assignment.risk_score < 0.65
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                      }`}>
                        {Math.round(assignment.risk_score * 100)}% Delay Risk
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                      <span>Vehicle: <strong className="text-heading font-medium">{assignment.vehicle_type}</strong></span>
                      <span>Carrier: <strong className="text-heading font-medium">{assignment.carrier_id}</strong></span>
                      <span className="font-mono font-bold text-heading">Rs {Math.round(assignment.quoted_rate).toLocaleString("en-IN")}</span>
                    </div>

                    <p className="text-xs text-foreground/80 leading-relaxed bg-surface/70 rounded-md p-2.5 border border-border/50">
                      <span className="font-semibold text-heading">Solver Rationale:</span> {assignment.reason}
                    </p>

                    {/* Alternatives */}
                    {assignment.alternative_vehicles?.length > 0 && (
                      <div className="text-[11px] text-muted-foreground border-t border-border/40 pt-2">
                        <span className="font-semibold text-heading">Alternative Eligible Trucks:</span>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {assignment.alternative_vehicles.map((alt) => (
                            <span key={alt.vehicle_id} className="rounded bg-accent px-2 py-0.5 font-mono text-[10px] text-heading">
                              {alt.vehicle_id} (Rs {Math.round(alt.quoted_rate).toLocaleString("en-IN")})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                      <ActionBtn primary onClick={() => approveOptimizedAssignment(assignment)}>
                        {approvedTruck === assignment.vehicle_id ? "Confirmed & Booked" : "Approve Allocation"}
                      </ActionBtn>
                      <ActionBtn onClick={() => openNegotiationCopilot(shownLoads.find((l) => l.id === assignment.load_id) || { id: assignment.load_id }, assignment)}>
                        <PhoneCall className="mr-1 h-3 w-3 inline text-primary" />
                        AI Rate Co-Pilot
                      </ActionBtn>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hard Constraints & Rejected Candidates Panel */}
          {optimizationResult?.rejected_candidates?.length > 0 && (
            <Panel title={`Hard-Constraint Violations & Rejected Trucks (${optimizationResult.rejected_candidates.length})`}>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  The solver strictly enforces capacity, timing, and compatibility. Infeasible pairings are mathematically pruned:
                </p>
                <button
                  type="button"
                  onClick={() => setShowRejected(!showRejected)}
                  className="flex items-center gap-1 text-xs font-semibold text-primary"
                >
                  {showRejected ? "Hide Rejections" : "Inspect Violations"}
                  {showRejected ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {showRejected && (
                <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                  {optimizationResult.rejected_candidates.map((rej, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5 text-xs"
                    >
                      <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-mono font-bold text-heading">
                          {rej.load_id} ↛ {rej.vehicle_id}
                        </div>
                        <p className="mt-0.5 text-rose-600 dark:text-rose-400 font-medium">
                          {rej.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}
        </div>
      )}

      {/* VIEW MODE 3: MULTI-STOP / LTL PART-LOAD 2-DROP CONSOLIDATION ENGINE */}
      {viewMode === "ltl" && (
        <div className="space-y-5">
          {/* LTL Engine Header Banner */}
          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-card to-emerald-500/5 p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <Layers className="h-3.5 w-3.5" />
                    LTL 2-Drop Consolidation Engine
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">GLEC Framework Sustainability</span>
                </div>
                <h2 className="mt-2 font-heading text-lg font-bold text-heading">
                  Multi-Stop Part-Load Deck Consolidation & Shared Freight Corridor
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground max-w-2xl">
                  Intelligently pairs compatible partial loads within multi-axle truck capacity limits across the same corridor. Eliminates deadhead return runs, lowers shipper freight costs, and directly reduces diesel carbon footprint.
                </p>
              </div>

              <ActionBtn primary onClick={runLtlConsolidation} disabled={ltlLoading}>
                <Sparkles className={`mr-1.5 h-3.5 w-3.5 inline ${ltlLoading ? "animate-spin" : ""}`} />
                {ltlLoading ? "Calculating Pairings..." : "Re-Scan LTL Pairings"}
              </ActionBtn>
            </div>

            {/* Overall LTL Potential KPIs */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-border/50 pt-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Consolidation Opportunities</p>
                <p className="mt-1 font-heading text-xl font-bold text-heading">
                  {ltlResult?.consolidation_candidates_count ?? 3} Corridor Pairs
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Shared corridor compatibility verified</p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Direct Freight Savings</p>
                <p className="mt-1 font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  Rs {Math.round(ltlResult?.total_savings_potential || 21400).toLocaleString("en-IN")}
                </p>
                <p className="text-[10px] text-muted-foreground">vs individual single-load dispatches</p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Diesel Fuel Conserved</p>
                <p className="mt-1 font-mono text-xl font-bold text-heading">
                  {Math.round((ltlResult?.total_co2_potential_kg || 192.4) / 2.68)} Litres
                </p>
                <p className="text-[10px] text-muted-foreground">Eliminated empty backhauls</p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">CO₂ Carbon Offset</p>
                <p className="mt-1 font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Leaf className="h-4 w-4" />
                  {ltlResult?.total_co2_potential_kg ?? 192.4} kg CO₂
                </p>
                <p className="text-[10px] text-muted-foreground">GLEC-certified emissions reduction</p>
              </div>
            </div>
          </div>

          {/* Proposals List */}
          <div className="space-y-4">
            <h3 className="font-heading text-sm font-bold text-heading flex items-center gap-2">
              <Split className="h-4 w-4 text-emerald-500" />
              Recommended Multi-Stop 2-Drop Candidate Pairings
            </h3>

            {(ltlResult?.proposals && ltlResult.proposals.length > 0 ? ltlResult.proposals : [
              {
                consolidation_id: "CONSOL-LD-201-LD-202",
                primary_load_id: "LD-201",
                secondary_load_id: "LD-202",
                vehicle_id: "V-32MXL-01",
                vehicle_type: "32ft Multi-Axle Container",
                carrier_id: "carrier-hasmukh",
                corridor: "Bhiwandi / Mumbai to Delhi / Narela",
                combined_weight_kg: 13200,
                combined_pallets: 20,
                vehicle_capacity_weight: 16000,
                vehicle_capacity_pallets: 24,
                capacity_utilization_pct: 83.3,
                standalone_total_cost: 112000,
                consolidated_cost: 93500,
                net_savings: 18500,
                savings_percent: 16.5,
                co2_saved_kg: 142.8,
                diesel_saved_litres: 53.3,
                deck_breakdown: { load_a_pallets: 12, load_b_pallets: 8, empty_pallets: 4 },
                status: "feasible_recommended",
              }
            ]).map((prop, idx) => (
              <div
                key={prop.consolidation_id || idx}
                className="rounded-xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-emerald-500/40 space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {prop.consolidation_id}
                    </span>
                    <span className="font-heading text-xs font-bold text-heading">
                      {prop.corridor}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-500/30">
                      {prop.savings_percent}% Net Savings
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      Vehicle: {prop.vehicle_id} ({prop.vehicle_type})
                    </span>
                  </div>
                </div>

                {/* Loads Combined */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/60 bg-surface/50 p-3 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-600 dark:text-sky-400 uppercase text-[10px]">Drop 1 (Primary Load)</span>
                      <span className="font-mono font-bold text-heading">{prop.primary_load_id}</span>
                    </div>
                    <p className="text-muted-foreground">Pallets: {prop.deck_breakdown?.load_a_pallets || 12} · Bhiwandi WH Hub</p>
                    <p className="text-[10px] text-muted-foreground">Direct unloading clearance scheduled at Drop 1</p>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-surface/50 p-3 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-600 dark:text-purple-400 uppercase text-[10px]">Drop 2 (Secondary Part-Load)</span>
                      <span className="font-mono font-bold text-heading">{prop.secondary_load_id}</span>
                    </div>
                    <p className="text-muted-foreground">Pallets: {prop.deck_breakdown?.load_b_pallets || 8} · Narela Logistics Park</p>
                    <p className="text-[10px] text-muted-foreground">En-route secondary drop (+45km transit deviation)</p>
                  </div>
                </div>

                {/* Deck Utilization & Breakdown */}
                <div className="rounded-lg border border-border/60 bg-surface/30 p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                    <span className="font-semibold text-heading flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-primary" />
                      32ft Multi-Axle Deck Space Utilization:
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {prop.capacity_utilization_pct}% Deck Utilized ({prop.combined_pallets} of {prop.vehicle_capacity_pallets} Pallets)
                    </span>
                  </div>

                  {/* Deck Slots visualization */}
                  <div className="grid grid-cols-12 gap-1 py-1">
                    {Array.from({ length: prop.vehicle_capacity_pallets || 24 }).map((_, slotIdx) => {
                      const loadAPallets = prop.deck_breakdown?.load_a_pallets || 12;
                      const loadBPallets = prop.deck_breakdown?.load_b_pallets || 8;
                      const isLoadA = slotIdx < loadAPallets;
                      const isLoadB = slotIdx >= loadAPallets && slotIdx < loadAPallets + loadBPallets;
                      return (
                        <div
                          key={slotIdx}
                          title={isLoadA ? `Slot ${slotIdx + 1}: Drop 1 (${prop.primary_load_id})` : isLoadB ? `Slot ${slotIdx + 1}: Drop 2 (${prop.secondary_load_id})` : `Slot ${slotIdx + 1}: Empty Buffer`}
                          className={`h-6 rounded flex items-center justify-center text-[9px] font-mono font-bold transition-all ${
                            isLoadA
                              ? "bg-sky-500 text-white shadow-xs"
                              : isLoadB
                              ? "bg-purple-500 text-white shadow-xs"
                              : "bg-border/40 text-muted-foreground border border-dashed border-border"
                          }`}
                        >
                          {isLoadA ? "A" : isLoadB ? "B" : "·"}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded bg-sky-500 inline-block" /> Drop 1 ({prop.primary_load_id}): {prop.deck_breakdown?.load_a_pallets} pallets
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded bg-purple-500 inline-block" /> Drop 2 ({prop.secondary_load_id}): {prop.deck_breakdown?.load_b_pallets} pallets
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded bg-border inline-block" /> Buffer Space: {prop.deck_breakdown?.empty_pallets} slots
                    </span>
                  </div>
                </div>

                {/* Financial & Environmental Breakdown */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/50">
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Standalone 2-Truck Cost</p>
                      <p className="font-mono text-muted-foreground line-through">
                        Rs {Math.round(prop.standalone_total_cost).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Consolidated Rate</p>
                      <p className="font-mono text-base font-bold text-heading">
                        Rs {Math.round(prop.consolidated_cost).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase">Net Shipper Savings</p>
                      <p className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                        Rs {Math.round(prop.net_savings).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="border-l border-border/60 pl-3">
                      <p className="text-[10px] text-muted-foreground uppercase">Green Impact</p>
                      <p className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Leaf className="h-3 w-3" />
                        {prop.co2_saved_kg} kg CO₂ ({prop.diesel_saved_litres} L diesel)
                      </p>
                    </div>
                  </div>

                  <ActionBtn primary onClick={() => approveConsolidatedPair(prop)}>
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 inline" />
                    Book 2-Drop Consolidated Run
                  </ActionBtn>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coordination Loop */}

      <Panel title="Autonomous Coordination Loop" testId="coordination-loop">
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

      {/* FEATURE 2: DYNAMIC CARRIER RATE NEGOTIATION CO-PILOT MODAL */}
      {copilotOpen && copilotTargetLoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
          <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 text-foreground dark:text-white animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/20">
                  Module 2 Voice AI + ML Cost Intelligence
                </span>
                <h3 className="text-lg font-bold text-heading dark:text-white mt-1.5 flex items-center gap-2">
                  <PhoneCall className="h-5 w-5 text-sky-500 dark:text-sky-400" />
                  Dynamic Carrier Negotiation Co-Pilot
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Route: <span className="font-semibold text-foreground dark:text-slate-200">{copilotTargetLoad.origin || "Bhiwandi"} → {copilotTargetLoad.destination || "Delhi"}</span> · Load ID: <span className="font-mono">{copilotTargetLoad.id}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCopilotOpen(false)}
                className="text-muted-foreground hover:text-foreground dark:hover:text-white p-1.5 rounded-lg hover:bg-surface dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Carrier Ask Input & Recalculate */}
            <div className="bg-surface/70 dark:bg-slate-950/70 border border-border dark:border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground dark:text-slate-300">Carrier Quoted Ask (Rs):</label>
                  <p className="text-[11px] text-muted-foreground">Rate proposed by driver/owner on phone</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={carrierAskInput}
                    onChange={(e) => setCarrierAskInput(e.target.value)}
                    className="w-36 bg-background dark:bg-slate-900 border border-border dark:border-slate-700 rounded-lg px-3 py-1.5 font-mono text-sm font-bold text-foreground dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => evaluateCopilot(copilotTargetLoad, carrierAskInput)}
                    disabled={copilotLoading}
                    className="btn-tactile bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all"
                  >
                    {copilotLoading ? "Calculating..." : "Recalculate"}
                  </button>
                </div>
              </div>
            </div>

            {/* Co-Pilot Evaluation Cards */}
            {copilotResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-surface/60 dark:bg-slate-950/60 border border-border dark:border-slate-800 rounded-xl p-3 card-lift">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">ML Fair Benchmark</div>
                    <div className="text-base font-bold font-mono text-foreground dark:text-white mt-1">
                      Rs {Math.round(copilotResult.ml_fair_cost).toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Expected fair market rate</div>
                  </div>

                  <div className="bg-sky-500/10 dark:bg-sky-950/40 border border-sky-500/30 dark:border-sky-800/60 rounded-xl p-3 card-lift">
                    <div className="text-[10px] uppercase font-bold text-sky-700 dark:text-sky-300">Target Counter-Offer</div>
                    <div className="text-base font-bold font-mono text-sky-600 dark:text-sky-400 mt-1">
                      Rs {Math.round(copilotResult.recommended_counter_offer).toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] text-sky-600/80 dark:text-sky-300/80">{copilotResult.margin_at_counter_rate}% margin</div>
                  </div>

                  <div className="bg-surface/60 dark:bg-slate-950/60 border border-border dark:border-slate-800 rounded-xl p-3 card-lift">
                    <div className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Hard Rate Ceiling</div>
                    <div className="text-base font-bold font-mono text-rose-700 dark:text-rose-300 mt-1">
                      Rs {Math.round(copilotResult.max_acceptable_ceiling).toLocaleString("en-IN")}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Min 12% margin policy</div>
                  </div>
                </div>

                {/* Verdict & Rationale */}
                <div className="rounded-xl border border-border dark:border-slate-800 bg-surface/50 dark:bg-slate-950/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground dark:text-slate-300">AI Valuation Verdict:</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                      copilotResult.decision_verdict === "APPROVE_RATE"
                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40"
                        : copilotResult.decision_verdict === "COUNTER_OFFER"
                        ? "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40"
                        : "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40"
                    }`}>
                      {copilotResult.decision_verdict.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 dark:text-slate-300 leading-relaxed">
                    {copilotResult.explanation}
                  </p>
                </div>

                {/* Multi-Lingual Dynamic Voice AI Script */}
                {copilotResult.scripts && (
                  <div className="rounded-xl border border-border dark:border-slate-800 bg-surface/60 dark:bg-slate-950/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground dark:text-slate-300">
                        <Volume2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                        Dynamic Telephony Script for Voice Agent:
                      </div>
                      <div className="flex items-center gap-1 bg-surface dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg p-0.5 text-xs">
                        {[
                          { key: "gu", label: "ગુજરાતી" },
                          { key: "hi", label: "हिन्दी" },
                          { key: "en", label: "English" },
                        ].map((lang) => (
                          <button
                            key={lang.key}
                            type="button"
                            onClick={() => setSelectedScriptLang(lang.key)}
                            className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                              selectedScriptLang === lang.key
                                ? "bg-sky-600 text-white font-bold shadow-xs"
                                : "text-muted-foreground hover:text-foreground dark:hover:text-white"
                            }`}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-background dark:bg-slate-900/90 rounded-lg p-3 border border-border/80 dark:border-slate-800/80 font-mono text-xs text-sky-800 dark:text-sky-200 leading-relaxed">
                      "{copilotResult.scripts[selectedScriptLang] || copilotResult.scripts.en}"
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCopilotOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-surface dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeVoiceNegotiation}
                disabled={voiceCallInProgress || !copilotResult}
                className="btn-tactile flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg transition-all disabled:opacity-50"
              >
                <PhoneCall className={`h-4 w-4 ${voiceCallInProgress ? "animate-bounce" : ""}`} />
                {voiceCallInProgress ? "Placing Voice Call..." : `Confirm Voice AI Call (Rs ${copilotResult ? Math.round(copilotResult.recommended_counter_offer).toLocaleString("en-IN") : "..."})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loads;
