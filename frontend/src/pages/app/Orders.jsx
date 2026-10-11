import { useEffect, useState } from "react";
import { Mail, FileText, Send, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Upload } from "lucide-react";
import { Seo } from "../../components/Seo";
import { StatusTag } from "../../components/site/ui";
import { Panel, Conf, ActionBtn, ResolvedNote } from "../../components/app/bits";
import { useMock, ORD_1042_FIELDS } from "../../mock/store";
import { apiRequest, LIVE_API_ENABLED } from "../../lib/api";
import { toast } from "sonner";

const Hl = ({ children }) => <mark className="rounded bg-status-ai/15 px-0.5 text-heading">{children}</mark>;

const SAMPLE_EMAIL = `Hi team, please book 18 pallets of packaged goods from Bhiwandi WH-3 to Gupta Trading Co., Narela. Pickup window Thursday 08:00-12:00. Vehicle: 32 ft MXL. Gross weight is 14.2 t. Purchase Order PO-7712, INV-2211.
Regards, Meera — Aarav Consumer Products`;

const SAMPLE_WHATSAPP = `Namaste! Urgent dispatch needed from Bhiwandi to Pune for 12 pallets polymer raw material, 8.0 tons. Vehicle 24ft. PO-7688. Please confirm booking.
- Kedia Polymers`;

const OrderDetail = ({ selectedId, liveOrders, onOrderUpdated }) => {
  const { orders, resolveOrder } = useMock();
  const mockOrder = orders.find((o) => o.id === selectedId) || orders[0];
  const liveOrder = liveOrders?.find((o) => o.id === selectedId);
  const order = liveOrder || mockOrder;

  const [weight, setWeight] = useState("14.2 t");
  const [edited, setEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amendDest, setAmendDest] = useState("");
  const [showAmend, setShowAmend] = useState(false);

  useEffect(() => {
    if (order?.weight_kg) {
      setWeight(`${(order.weight_kg / 1000).toFixed(1)} t`);
    } else {
      setWeight("14.2 t");
    }
    setEdited(false);
  }, [selectedId, order?.weight_kg]);

  const handleApprove = async () => {
    setLoading(true);
    try {
      if (LIVE_API_ENABLED && order?.id) {
        if (edited) {
          const numWeight = (parseFloat(weight) || 14.2) * 1000;
          await apiRequest(`/orders/${order.id}/correct`, {
            method: "POST",
            body: JSON.stringify({ field_name: "weight_kg", corrected_value: numWeight }),
          });
        }
        await apiRequest(`/orders/${order.id}/approve`, { method: "POST" });
        toast.success(`${order.id} approved and synced to TMS loads for Module 3 matching`);
        if (onOrderUpdated) onOrderUpdated();
      } else {
        resolveOrder(order?.id || "ORD-1042", "approve");
      }
    } catch (err) {
      toast.error(err.message || "Approval failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    resolveOrder(order?.id || "ORD-1042", "escalate");
  };

  const handleApplyAmendment = async () => {
    if (!amendDest.trim() || !order?.id) return;
    setLoading(true);
    try {
      if (LIVE_API_ENABLED) {
        const res = await apiRequest(`/orders/${order.id}/amend`, {
          method: "POST",
          body: JSON.stringify({ amendments: { destination: amendDest.trim() } }),
        });
        toast.success(`Amendment applied to ${order.id}. Rematching triggered.`);
        setShowAmend(false);
        if (onOrderUpdated) onOrderUpdated();
      } else {
        toast.success(`Amendment applied to ${order.id} (demo state)`);
        setShowAmend(false);
      }
    } catch (err) {
      toast.error(err.message || "Amendment failed");
    } finally {
      setLoading(false);
    }
  };

  // Build field list from live order or fallback
  const fields = order?.extracted_fields
    ? Object.entries(order.extracted_fields).map(([k, v]) => ({
        k,
        v: typeof v.value === "number" && k.toLowerCase().includes("weight") ? `${(v.value / 1000).toFixed(1)} t` : String(v.value ?? "-"),
        conf: Math.round(v.confidence ?? 90),
        src: v.source_evidence || "extraction",
        low: Boolean(v.is_conflict || v.confidence < 70),
      }))
    : ORD_1042_FIELDS;

  return (
    <Panel title={`${order?.id || "ORD-1042"} · Intake evidence and extracted fields`} testId="order-detail" className="mt-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border bg-surface p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Mail className="h-3 w-3" /> Original intake · {order?.customer_name || "Aarav Consumer Products"} ({order?.source_channel || "email"})
          </p>
          <p className="mt-3 text-xs font-semibold text-heading">
            Order: {order?.pallets || 18} pallets to {order?.destination || "Narela"}, {order?.pickup_window || "Thursday pickup"}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Hi team, please book <Hl>{order?.pallets || 18} pallets</Hl> of {order?.cargo || "packaged goods"} from <Hl>{order?.origin || "Bhiwandi WH-3"}</Hl> to{" "}
            <Hl>{order?.destination || "Gupta Trading Co., Narela"}</Hl>. Pickup window <Hl>{order?.pickup_window || "Thursday 08:00-12:00"}</Hl>. Vehicle: <Hl>{order?.vehicle_requirement || "32 ft MXL"}</Hl>.
            Regards, Meera — <Hl>{order?.customer_name || "Aarav Consumer Products"}</Hl>
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <FileText className="h-3.5 w-3.5" /> {order?.po_number ? `${order.po_number}.xlsx` : "order-1042.xlsx"} · invoice-2211.pdf attached
          </p>
          {order?.conflicts?.length > 0 && (
            <div className="mt-3 rounded-lg border border-status-human/40 bg-status-human/10 p-2.5 text-xs text-status-human">
              <p className="font-semibold flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> Discrepancy detected</p>
              <p className="mt-0.5 text-[11px]">{order.conflicts.join(", ")}</p>
            </div>
          )}
          {order?.assignment_warning && (
            <div className="mt-3 rounded-lg border border-status-approval/40 bg-status-approval/10 p-2.5 text-xs text-status-approval">
              <p className="font-semibold flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" /> Operational Warning</p>
              <p className="mt-0.5 text-[11px]">{order.assignment_warning}</p>
            </div>
          )}
        </div>

        <div>
          <ul className="space-y-2">
            {fields.map((f) => (
              <li
                key={f.k}
                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${f.low ? "border-status-human/50 bg-status-human/5" : "bg-surface"}`}
              >
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{f.k}</p>
                  {f.low && f.k.toLowerCase().includes("weight") ? (
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        value={weight}
                        data-testid="order-1042-weight-input"
                        onChange={(e) => { setWeight(e.target.value); setEdited(true); }}
                        aria-label="Weight field, low confidence, editable"
                        className="h-8 w-24 rounded-lg border bg-background px-2 text-xs font-medium text-foreground"
                      />
                      <span className="text-[10px] text-status-human">conflict: invoice 14.2 t vs Excel 14.5 t</span>
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-heading">{f.v}</p>
                  )}
                </div>
                <div className="text-right">
                  <Conf pct={f.conf} />
                  <p className="mt-0.5 text-[9px] text-muted-foreground">source: {f.src}</p>
                </div>
              </li>
            ))}
          </ul>

          {order?.tag === "ai" || order?.status === "ready_for_matching" || order?.status === "assigned" ? (
            <div className="mt-4 flex items-center justify-between">
              <ResolvedNote>Created in TMS · Synced to Load Matching</ResolvedNote>
              <button
                type="button"
                onClick={() => setShowAmend(!showAmend)}
                className="text-xs text-status-ai hover:underline font-medium"
              >
                {showAmend ? "Cancel Amendment" : "Amend order..."}
              </button>
            </div>
          ) : order?.tag === "human" || order?.status === "exception_raised" ? (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs font-medium text-status-human">Escalated to human review queue.</p>
              <button
                type="button"
                onClick={() => setShowAmend(!showAmend)}
                className="text-xs text-status-ai hover:underline font-medium"
              >
                {showAmend ? "Cancel Amendment" : "Amend order..."}
              </button>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionBtn
                primary
                testId="order-1042-approve"
                disabled={loading}
                onClick={handleApprove}
              >
                {loading ? "Processing..." : `Approve and create in TMS${edited ? ` (weight ${weight})` : ""}`}
              </ActionBtn>
              <ActionBtn testId="order-1042-escalate" onClick={handleEscalate}>Escalate</ActionBtn>
              <ActionBtn onClick={() => setShowAmend(!showAmend)}>Amend</ActionBtn>
            </div>
          )}

          {showAmend && (
            <div className="mt-3 rounded-lg border bg-card p-3 shadow-sm">
              <p className="text-xs font-semibold text-heading">Customer Order Amendment</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Change delivery destination or capacity specs. Auto-rechecks Module 3 feasibility.</p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New destination (e.g. Jaipur, Ludhiana)"
                  value={amendDest}
                  onChange={(e) => setAmendDest(e.target.value)}
                  className="h-8 flex-1 rounded-lg border bg-background px-2 text-xs text-foreground"
                />
                <button
                  type="button"
                  onClick={handleApplyAmendment}
                  disabled={loading || !amendDest.trim()}
                  className="rounded-lg bg-status-ai px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                >
                  Apply & Re-check
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
};

const Orders = () => {
  const { orders: mockOrders } = useMock();
  const [liveOrders, setLiveOrders] = useState(null);
  const [selectedId, setSelectedId] = useState("ORD-1042");
  const [showIngestBox, setShowIngestBox] = useState(false);
  const [channel, setChannel] = useState("email");
  const [inputText, setInputText] = useState(SAMPLE_EMAIL);
  const [ingestResult, setIngestResult] = useState(null);
  const [ingesting, setIngesting] = useState(false);

  const fetchLiveOrders = () => {
    if (!LIVE_API_ENABLED) return;
    apiRequest("/orders")
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setLiveOrders(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchLiveOrders();
  }, []);

  const handleIngestSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setIngesting(true);
    setIngestResult(null);
    try {
      if (LIVE_API_ENABLED) {
        const res = await apiRequest("/ingestion/message", {
          method: "POST",
          body: JSON.stringify({
            sender: channel === "email" ? "customer@example.com" : "+919876543210",
            channel,
            subject: channel === "email" ? "New Freight Indent" : "",
            body_text: inputText,
          }),
        });
        setIngestResult(res);
        toast.success(`Message classified as '${res.intent}' (${Math.round(res.intent_confidence * 100)}% conf)`);
        fetchLiveOrders();
        if (res.order?.id) setSelectedId(res.order.id);
      } else {
        setIngestResult({
          intent: "new_order",
          intent_confidence: 0.95,
          order: { id: "ORD-NEW", customer_name: "Aarav Consumer Products", confidence_tier: "high" },
        });
        toast.success("Simulated message ingestion (demo state)");
      }
    } catch (err) {
      toast.error(err.message || "Ingestion failed");
    } finally {
      setIngesting(false);
    }
  };

  const displayedOrders = liveOrders || mockOrders;

  return (
    <div data-testid="orders-page">
      <Seo title="Orders - Haulage AI" description="Email-to-TMS order intake demo with confidence-scored extraction." />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold sm:text-2xl">Orders & AI Back-Office</h1>
          <p className="mt-1 text-sm text-muted-foreground">Emails, WhatsApp messages, and spreadsheets become validated orders. {LIVE_API_ENABLED ? "Live API mode." : "Demo data."}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowIngestBox(!showIngestBox)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-status-ai/40 bg-status-ai/10 px-3.5 py-2 text-xs font-semibold text-status-ai hover:bg-status-ai/20 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" /> {showIngestBox ? "Hide Ingestion Panel" : "+ Ingest Customer Message"}
        </button>
      </div>

      {showIngestBox && (
        <div className="mt-4 rounded-xl border bg-card p-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-heading flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-status-ai" /> Module 1: AI Multi-Channel Ingestion & Parsing
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setChannel("email"); setInputText(SAMPLE_EMAIL); }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium border ${channel === "email" ? "border-status-ai bg-status-ai/10 text-status-ai" : "bg-surface"}`}
              >
                Sample Email
              </button>
              <button
                type="button"
                onClick={() => { setChannel("whatsapp"); setInputText(SAMPLE_WHATSAPP); }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium border ${channel === "whatsapp" ? "border-status-ai bg-status-ai/10 text-status-ai" : "bg-surface"}`}
              >
                Sample WhatsApp
              </button>
            </div>
          </div>
          <form onSubmit={handleIngestSubmit} className="mt-3">
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste customer email text, WhatsApp message, or order indent..."
              className="w-full rounded-xl border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-status-ai"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Channel: <strong className="capitalize text-heading">{channel}</strong> · Automatic hash deduplication & entity resolution
              </span>
              <button
                type="submit"
                disabled={ingesting || !inputText.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-status-ai px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" /> {ingesting ? "Extracting..." : "Process & Extract"}
              </button>
            </div>
          </form>

          {ingestResult && (
            <div className="mt-3 rounded-lg border bg-surface p-3 text-xs animate-in fade-in">
              <p className="font-semibold text-heading flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-status-ai" /> Extracted Intent: <span className="text-status-ai uppercase">{ingestResult.intent}</span> ({Math.round((ingestResult.intent_confidence || 0.95) * 100)}% confidence)
              </p>
              {ingestResult.order && (
                <p className="mt-1 text-muted-foreground text-[11px]">
                  Generated Order Ref: <strong>{ingestResult.order.id}</strong> ({ingestResult.order.customer_name}) · Tier: <strong>{ingestResult.order.confidence_tier}</strong>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-5 overflow-x-auto rounded-xl border bg-card shadow-sm" data-testid="orders-table">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b bg-surface">
              {["Order", "Customer", "Route", "Source", "Confidence", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold text-heading">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedOrders.map((o) => {
              const isSelected = (o.id || o.order_id) === selectedId;
              const tag = o.tag || (o.confidence_tier === "high" || o.status === "ready_for_matching" ? "ai" : (o.confidence_tier === "medium" || o.status === "draft_pending_review" ? "approval" : "human"));
              const conf = o.confidence ?? o.overall_confidence ?? 85;
              const route = o.route || o.lane || `${o.origin} → ${o.destination}`;
              const source = o.source || (o.source_channel ? o.source_channel.toUpperCase() : "Email");
              return (
                <tr
                  key={o.id}
                  onClick={() => setSelectedId(o.id)}
                  className={`border-b last:border-0 cursor-pointer transition-colors ${isSelected ? "bg-status-ai/10 font-medium" : "hover:bg-accent"}`}
                  data-testid={`order-row-${o.id}`}
                >
                  <td className="px-4 py-3 font-medium text-heading">{o.id}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.customer || o.customer_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{route}</td>
                  <td className="px-4 py-3 text-muted-foreground">{source}</td>
                  <td className="px-4 py-3"><Conf pct={conf} /></td>
                  <td className="px-4 py-3"><StatusTag variant={tag} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <OrderDetail selectedId={selectedId} liveOrders={liveOrders} onOrderUpdated={fetchLiveOrders} />
    </div>
  );
};

export default Orders;
