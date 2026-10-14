import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Camera, Radio, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Seo } from "../../components/Seo";
import { StatusTag } from "../../components/site/ui";
import { Panel, ActionBtn, ResolvedNote } from "../../components/app/bits";
import { useMock } from "../../mock/store";
import { apiRequest, LIVE_API_ENABLED } from "../../lib/api";

const CHECK_LABELS = {
  label: "Label position",
  barcode: "Barcode readable",
  cartons: "Carton count",
  seal: "Seal intact",
  height: "Height under 1.6 m",
};

const CameraPanel = ({ pallet }) => (
  <div className="relative rounded-xl border border-border/80 bg-surface/80 p-3 shadow-xs" data-testid="camera-panel">
    <div className="flex items-center justify-between gap-1.5 text-[10px] text-muted-foreground font-mono">
      <span className="flex items-center gap-1.5 font-semibold text-heading">
        <Camera className="h-3.5 w-3.5 text-primary" /> Vision AI · Packing Bench 3 · Pallet {pallet.id}
      </span>
      <span className="inline-flex items-center gap-1 text-[9px] text-red-500 font-bold">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE OCR 30FPS
      </span>
    </div>
    <div className="relative mt-2 h-44 rounded-lg border-2 border-dashed border-border/80 bg-card/80 overflow-hidden bg-grid-dots">
      {/* Dynamic Laser Scanning Line */}
      <div className="laser-scanline" />

      {/* Center Reticle Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="h-12 w-12 border border-current rounded-full" />
        <div className="absolute h-16 w-[1px] bg-current" />
        <div className="absolute w-16 h-[1px] bg-current" />
      </div>

      {/* Label bounding box */}
      <div className={`absolute left-4 top-4 h-10 w-20 rounded border-2 transition-all ${pallet.checks?.label ? "border-status-ai bg-status-ai/10" : "border-status-human bg-status-human/15 shadow-sm"}`} aria-hidden="true">
        <span className="absolute -top-3 left-0 rounded bg-heading px-1 text-[8px] font-mono font-bold text-background">
          BARCODE {pallet.checks?.label ? "PASS" : "FAIL"}
        </span>
      </div>

      {/* Carton detection */}
      <div className="absolute bottom-4 right-5 h-5 w-28 rounded border-2 border-status-ai bg-status-ai/10 flex items-center justify-center" aria-hidden="true">
        <span className="text-[8px] font-mono font-bold text-status-ai">SSCC-18 OCR: 99.1%</span>
      </div>

      {/* Laser Height Limit Line */}
      <div className="absolute inset-x-0 border-t-2 border-dashed border-status-approval" style={{ top: pallet.checks?.height ? "22%" : "9%" }} aria-hidden="true">
        <span className="absolute right-2 -top-4 rounded bg-status-approval/20 border border-status-approval/40 px-1 text-[8.5px] font-mono font-bold text-status-approval">
          1.60m MoRTH Legal Height {pallet.checks?.height ? "(1.52m OK)" : "(1.82m OVERSIZE)"}
        </span>
      </div>
    </div>
  </div>
);

const PalletCard = ({ pallet, onFix }) => {
  return (
    <article
      data-testid={`pallet-${pallet.id}`}
      className={`card-craft p-4.5 border-l-4 ${
        pallet.status === "fail"
          ? "border-l-status-human bg-card"
          : "border-l-status-ai bg-card"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-base font-bold text-heading">Pallet {pallet.id}</h3>
          <span className="font-mono text-[10px] text-muted-foreground">SKU-PLT-094</span>
        </div>
        <StatusTag variant={pallet.tag} />
      </div>
      <div className="mt-3">
        <CameraPanel pallet={pallet} />
      </div>
      <ul className="mt-3.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Object.entries(CHECK_LABELS).map(([k, label]) => (
          <li key={k} className="flex items-center gap-2 rounded-lg border border-border/70 bg-surface/70 px-3 py-2 text-xs font-medium">
            {pallet.checks && pallet.checks[k] ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-status-ai" aria-hidden="true" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0 text-status-human" aria-hidden="true" />
            )}
            <span className={pallet.checks && pallet.checks[k] ? "text-heading" : "text-status-human font-semibold"}>{label}</span>
          </li>
        ))}
      </ul>
      {pallet.flag ? (
        <div className="mt-3.5 rounded-xl border border-status-human/40 bg-status-human/10 p-3 shadow-xs">
          <p className="text-xs font-bold text-heading flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5 text-status-human" />
            {pallet.flag}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">Action required:</span> {pallet.fix}</p>
          <p className="mt-1 text-[10px] text-muted-foreground italic font-mono">Routing Rule: "Pallets must not exceed 1.6 m including pallet base." — Retailer routing guide v12, p. 42</p>
          <div className="mt-3 pt-2 border-t border-status-human/20">
            <ActionBtn primary testId={`pallet-${pallet.id}-mark-fixed`} onClick={() => onFix(pallet.id)}>Mark fixed & re-scan</ActionBtn>
          </div>
        </div>
      ) : (
        <ResolvedNote>All warehouse gate & dimension checks pass</ResolvedNote>
      )}
    </article>
  );
};

const Warehouse = () => {
  const { pallets: mockPallets, markPalletFixed } = useMock();
  const [palletList, setPalletList] = useState(mockPallets);
  const [loading, setLoading] = useState(false);

  const fetchLivePallets = async () => {
    if (!LIVE_API_ENABLED) return;
    try {
      setLoading(true);
      const data = await apiRequest("/operations/warehouse/pallets");
      if (Array.isArray(data) && data.length > 0) {
        setPalletList(data);
      }
    } catch (e) {
      // Fallback silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivePallets();
  }, []);

  const handleFix = async (id) => {
    // Update local mock store
    markPalletFixed(id);
    // Update local state
    setPalletList((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "pass",
              tag: "ai",
              flag: null,
              checks: Object.fromEntries(Object.keys(p.checks || {}).map((k) => [k, true])),
            }
          : p
      )
    );
    // Call live API if enabled
    if (LIVE_API_ENABLED) {
      try {
        await apiRequest(`/operations/warehouse/pallets/${id}/fix`, {
          method: "POST",
          body: JSON.stringify({ fix_note: "Re-scanned and verified by supervisor" }),
        });
      } catch (e) {
        // Handled gracefully
      }
    }
  };

  const fails = palletList.filter((p) => p.status === "fail").length;

  return (
    <div data-testid="warehouse-page">
      <Seo title="Warehouse - Haulage AI" description="Warehouse Vision packing-bench demo with pallet checks and retailer rules." />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-bold sm:text-2xl">Warehouse · Packing bench 3</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {fails} pallet{fails === 1 ? "" : "s"} need attention before loading. Computer Vision checks against retailer routing guides.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {LIVE_API_ENABLED && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-status-ai/30 bg-status-ai/10 px-2.5 py-1 text-xs font-medium text-status-ai">
              <Radio className="h-3 w-3 animate-pulse" /> Live Vision Stream
            </span>
          )}
          <button
            type="button"
            onClick={fetchLivePallets}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:bg-surface"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2" data-testid="pallet-grid">
        {palletList.map((p) => (
          <PalletCard key={p.id} pallet={p} onFix={handleFix} />
        ))}
      </div>
    </div>
  );
};

export default Warehouse;
