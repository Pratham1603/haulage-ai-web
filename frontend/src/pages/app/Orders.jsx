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

const SAMPLE_DOCS = [
  {
    id: "doc-po",
    name: "PO-7712_Aarav_Consumer.pdf",
    type: "Purchase Order (PDF)",
    customer: "Aarav Consumer Products",
    route: "Bhiwandi WH-3 → Narela (Delhi)",
    cargo: "18 Pallets · Packaged Consumer Goods",
    weight: "14.2 t (flagged conflict: 14.2 t vs 14.5 t)",
    text: "Purchase Order PO-7712. Consignor: Aarav Consumer Products, Bhiwandi WH-3. Consignee: Gupta Trading Co., Narela, Delhi. Required: 32 ft MXL truck. Gross weight 14.2 t. Pallets: 18. Pickup: Thursday 08:00-12:00. Invoice refs: INV-2211.",
    boxes: [
      { label: "Customer", val: "Aarav Consumer Products", conf: 99 },
      { label: "Pickup", val: "Bhiwandi WH-3", conf: 98 },
      { label: "Drop", val: "Gupta Trading Co., Narela", conf: 96 },
      { label: "Pallets", val: "18 Pallets", conf: 99 },
      { label: "Weight", val: "14.2 t (Review Required)", conf: 58, low: true },
    ],
  },
  {
    id: "doc-excel",
    name: "Kedia_Indent_Bhiwandi_Pune.xlsx",
    type: "Excel Indent",
    customer: "Kedia Polymers",
    route: "Bhiwandi → Pune",
    cargo: "12 Pallets · Industrial Polymers",
    weight: "8.0 t",
    text: "Freight Indent IND-9921 from Kedia Polymers. Dispatch origin Bhiwandi to Pune. 12 pallets polymer raw material. Total gross weight: 8.0 tons. Vehicle required: 24 ft closed body.",
    boxes: [
      { label: "Customer", val: "Kedia Polymers", conf: 98 },
      { label: "Route", val: "Bhiwandi → Pune", conf: 99 },
      { label: "Pallets", val: "12 Pallets", conf: 95 },
      { label: "Weight", val: "8.0 t", conf: 97 },
    ],
  },
  {
    id: "doc-lr",
    name: "LR-8840_Transporter_Challan.png",
    type: "Lorry Receipt Scan",
    customer: "Shree Packaging",
    route: "Vashi → Ahmedabad",
    cargo: "16 Pallets · Corrugated Boxes",
    weight: "9.5 t",
    text: "Lorry Receipt LR-8840. Shipped by Shree Packaging, Vashi. Consignee: Star Logistics Hub, Ahmedabad. 16 pallets corrugated boxes. Weight: 9,500 kg. Vehicle: 32 ft SXL.",
    boxes: [
      { label: "Customer", val: "Shree Packaging", conf: 96 },
      { label: "Route", val: "Vashi → Ahmedabad", conf: 97 },
      { label: "Weight", val: "9.5 t", conf: 94 },
    ],
  },
];

const Orders = () => {
  const { orders: mockOrders } = useMock();
  const [liveOrders, setLiveOrders] = useState(null);
  const [selectedId, setSelectedId] = useState("ORD-1042");
  const [showIngestBox, setShowIngestBox] = useState(false);
  const [ingestTab, setIngestTab] = useState("ocr"); // "ocr" or "message"
  const [selectedDoc, setSelectedDoc] = useState(SAMPLE_DOCS[0]);
  const [channel, setChannel] = useState("email");
  const [inputText, setInputText] = useState(SAMPLE_EMAIL);
  const [ingestResult, setIngestResult] = useState(null);
  const [ingesting, setIngesting] = useState(false);
  const [llmExtracting, setLlmExtracting] = useState(false);
  const [scanning, setScanning] = useState(false);

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

  const handleLlmExtract = async () => {
    if (!inputText.trim()) return;
    setLlmExtracting(true);
    try {
      const storedKey = localStorage.getItem("openrouter_custom_key") || undefined;
      const res = await apiRequest("/operations/llm/parse-indent", {
        method: "POST",
        body: JSON.stringify({
          raw_text: inputText,
          auto_create_order: true,
          api_key: storedKey,
        }),
      });
      setIngestResult({
        intent: "new_order",
        intent_confidence: (res.confidence || 95) / 100,
        order: res.created_order || {
          id: "ORD-LLM",
          customer_name: res.customer,
          confidence_tier: res.confidence >= 90 ? "high" : "medium",
        },
        llmDetails: res,
      });
      toast.success(`Parsed by ${res.model_used || "OpenRouter Nemotron"}: Order created for ${res.customer}`);
      fetchLiveOrders();
    } catch (e) {
      toast.error("LLM parse failed: " + (e.message || "Network error"));
    } finally {
      setLlmExtracting(false);
    }
  };

  const handleIngestSubmit = async (e, textOverride, channelOverride) => {
    if (e) e.preventDefault();
    const textToProcess = textOverride || inputText;
    const activeChannel = channelOverride || channel;
    if (!textToProcess.trim()) return;

    setIngesting(true);
    setIngestResult(null);
    try {
      if (LIVE_API_ENABLED) {
        const res = await apiRequest("/ingestion/message", {
          method: "POST",
          body: JSON.stringify({
            sender: activeChannel === "email" ? "customer@example.com" : "+919876543210",
            channel: activeChannel,
            subject: activeChannel === "email" ? "New Freight Indent" : "",
            body_text: textToProcess,
          }),
        });
        setIngestResult(res);
        toast.success(`Extracted '${res.intent}' (${Math.round((res.intent_confidence || 0.95) * 100)}% conf)`);
        fetchLiveOrders();
        if (res.order?.id) setSelectedId(res.order.id);
      } else {
        setIngestResult({
          intent: "new_order",
          intent_confidence: 0.96,
          order: { id: "ORD-NEW", customer_name: selectedDoc.customer, confidence_tier: "high" },
        });
        toast.success("Simulated message ingestion (demo state)");
      }
    } catch (err) {
      toast.error(err.message || "Ingestion failed");
    } finally {
      setIngesting(false);
    }
  };

  const handleRunOcrScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      handleIngestSubmit(null, selectedDoc.text, "email");
    }, 1200);
  };

  const displayedOrders = liveOrders || mockOrders;

  return (
    <div data-testid="orders-page">
      <Seo title="Orders - Haulage AI" description="Email-to-TMS order intake demo with confidence-scored extraction." />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold sm:text-2xl">Orders & AI Back-Office</h1>
          <p className="mt-1 text-sm text-muted-foreground">Emails, WhatsApp indents, and PDF LR Challans transformed into validated orders. {LIVE_API_ENABLED ? "Live API mode." : "Demo data."}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowIngestBox(!showIngestBox)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-status-ai/40 bg-status-ai/10 px-3.5 py-2 text-xs font-semibold text-status-ai hover:bg-status-ai/20 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" /> {showIngestBox ? "Hide Ingestion Hub" : "+ Ingest Documents & Messages"}
        </button>
      </div>

      {showIngestBox && (
        <div className="mt-4 rounded-xl border bg-card p-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-status-ai" />
              <h3 className="text-sm font-semibold text-heading">Module 1: Multi-Channel Ingestion & OCR Vision</h3>
            </div>
            <div className="flex rounded-lg border bg-surface p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setIngestTab("ocr")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-all ${ingestTab === "ocr" ? "bg-card text-heading shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <FileText className="h-3.5 w-3.5 text-status-ai" /> Visual Document OCR
              </button>
              <button
                type="button"
                onClick={() => setIngestTab("message")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-all ${ingestTab === "message" ? "bg-card text-heading shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Mail className="h-3.5 w-3.5" /> Raw Message Text
              </button>
            </div>
          </div>

          {ingestTab === "ocr" ? (
            <div className="mt-4 grid gap-5 lg:grid-cols-12">
              {/* Document selection */}
              <div className="space-y-2 lg:col-span-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Select sample document to scan:</p>
                {SAMPLE_DOCS.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => { setSelectedDoc(doc); setIngestResult(null); }}
                    className={`block w-full rounded-xl border p-3 text-left transition-all ${selectedDoc.id === doc.id ? "border-status-ai bg-status-ai/10 shadow-sm" : "bg-surface hover:bg-accent"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-heading">{doc.name}</span>
                      <span className="rounded-md border bg-card px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">{doc.type}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{doc.customer} · {doc.cargo}</p>
                  </button>
                ))}
              </div>

              {/* Document Preview & OCR scanner */}
              <div className="relative rounded-xl border bg-surface p-4 lg:col-span-7 flex flex-col justify-between overflow-hidden">
                {scanning && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-status-ai to-transparent shadow-[0_0_15px_#10b981] animate-pulse" />
                )}
                <div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-bold text-heading flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-status-ai" /> {selectedDoc.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase font-mono">{selectedDoc.type}</span>
                  </div>

                  {/* Bounding box visual recognition */}
                  <div className="mt-3 space-y-2">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">AI Extracted Field Recognition:</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {selectedDoc.boxes.map((b, i) => (
                        <div
                          key={i}
                          className={`rounded-lg border p-2 text-xs transition-all ${
                            b.low
                              ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "border-status-ai/30 bg-card text-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase text-muted-foreground font-semibold">{b.label}</span>
                            <span className="text-[10px] font-bold font-mono">{b.conf}%</span>
                          </div>
                          <p className="mt-0.5 text-xs font-semibold">{b.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <span className="text-[10px] text-muted-foreground">OCR Engine: Multi-Lingual Entity Resolution</span>
                  <button
                    type="button"
                    onClick={handleRunOcrScan}
                    disabled={scanning || ingesting}
                    className="inline-flex items-center gap-2 rounded-lg bg-status-ai px-4 py-2 text-xs font-bold text-white shadow-md hover:opacity-90 disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {scanning ? "Scanning Laser..." : ingesting ? "Syncing to Orders..." : "Run AI OCR Scan & Ingest"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleIngestSubmit} className="mt-3">
              <div className="mb-2 flex gap-2">
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
              <textarea
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste customer email text, WhatsApp message, or order indent..."
                className="w-full rounded-xl border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-status-ai"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">
                  Channel: <strong className="capitalize text-heading">{channel}</strong> · Automatic hash deduplication
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLlmExtract}
                    disabled={llmExtracting || ingesting || !inputText.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary shadow-sm hover:bg-primary/20 disabled:opacity-50 transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {llmExtracting ? "LLM Parsing..." : "⚡ Parse with OpenRouter LLM"}
                  </button>
                  <button
                    type="submit"
                    disabled={ingesting || llmExtracting || !inputText.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-status-ai px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" /> {ingesting ? "Extracting..." : "Process & Extract"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {ingestResult && (
            <div className="mt-4 rounded-xl border border-status-ai/40 bg-status-ai/10 p-3.5 text-xs animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-heading flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-status-ai" /> Extracted Intent: <span className="text-status-ai uppercase">{ingestResult.intent}</span> ({Math.round((ingestResult.intent_confidence || 0.95) * 100)}% confidence)
                </p>
                {ingestResult.llmDetails?.model_used && (
                  <span className="rounded bg-primary/20 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                    Model: {ingestResult.llmDetails.model_used}
                  </span>
                )}
              </div>
              {ingestResult.order && (
                <p className="mt-1 text-muted-foreground text-[11px]">
                  Generated Order Ref: <strong className="text-heading">{ingestResult.order.id}</strong> ({ingestResult.order.customer_name}) · Confidence Tier: <strong className="text-status-ai">{ingestResult.order.confidence_tier}</strong>
                </p>
              )}
              {ingestResult.llmDetails && (
                <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-status-ai/30 pt-2 text-[11px]">
                  <div><span className="text-muted-foreground">Origin:</span> <strong>{ingestResult.llmDetails.origin}</strong></div>
                  <div><span className="text-muted-foreground">Destination:</span> <strong>{ingestResult.llmDetails.destination}</strong></div>
                  <div><span className="text-muted-foreground">Pallets:</span> <strong>{ingestResult.llmDetails.pallets} Pallets</strong></div>
                  <div><span className="text-muted-foreground">Offered Rate:</span> <strong>₹{ingestResult.llmDetails.offered_rate?.toLocaleString("en-IN")}</strong></div>
                </div>
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
