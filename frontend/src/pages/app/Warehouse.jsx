import { CheckCircle2, XCircle, Camera } from "lucide-react";
import { Seo } from "../../components/Seo";
import { StatusTag } from "../../components/site/ui";
import { Panel, ActionBtn, ResolvedNote } from "../../components/app/bits";
import { useMock } from "../../mock/store";

const CHECK_LABELS = {
  label: "Label position",
  barcode: "Barcode readable",
  cartons: "Carton count",
  seal: "Seal intact",
  height: "Height under 1.6 m",
};

const CameraPanel = ({ pallet }) => (
  <div className="relative rounded-xl border bg-surface p-3" data-testid="camera-panel">
    <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <Camera className="h-3 w-3" /> Camera placeholder · pallet {pallet.id}
    </p>
    <div className="relative mt-2 h-40 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card">
      <span className={`absolute left-4 top-4 h-9 w-16 rounded border-2 ${pallet.checks.label ? "border-status-ai bg-status-ai/10" : "border-status-human bg-status-human/10"}`} aria-hidden="true" />
      <span className="absolute bottom-4 right-5 h-4 w-24 rounded border-2 border-status-ai bg-status-ai/10" aria-hidden="true" />
      <span className="absolute inset-x-0 border-t-2 border-status-approval/70" style={{ top: pallet.checks.height ? "18%" : "8%" }} aria-hidden="true" />
      <span className="absolute right-1.5 text-[9px] font-semibold text-status-approval" style={{ top: pallet.checks.height ? "6%" : "0%" }}>
        1.6 m limit{pallet.checks.height ? "" : " · pallet at 1.8 m"}
      </span>
    </div>
  </div>
);

const PalletCard = ({ pallet }) => {
  const { markPalletFixed } = useMock();
  return (
    <article data-testid={`pallet-${pallet.id}`} className={`rounded-xl border p-4 shadow-sm ${pallet.status === "fail" ? "border-status-human/50 bg-card" : "bg-card"}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-heading text-base font-bold text-heading">Pallet {pallet.id}</h3>
        <StatusTag variant={pallet.tag} />
      </div>
      <CameraPanel pallet={pallet} />
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Object.entries(CHECK_LABELS).map(([k, label]) => (
          <li key={k} className="flex items-center gap-2 rounded-lg border bg-surface px-3 py-2.5 text-xs font-medium">
            {pallet.checks[k] ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-status-ai" aria-hidden="true" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0 text-status-human" aria-hidden="true" />
            )}
            <span className={pallet.checks[k] ? "text-heading" : "text-status-human"}>{label}</span>
          </li>
        ))}
      </ul>
      {pallet.flag ? (
        <div className="mt-3 rounded-xl border border-status-human/40 bg-status-human/10 p-3">
          <p className="text-xs font-semibold text-heading">{pallet.flag}</p>
          <p className="mt-1 text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">Rebuild:</span> {pallet.fix}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Rule: "Pallets must not exceed 1.6 m including pallet. Labels required on two adjacent faces." — Retailer routing guide v12, p. 42</p>
          <div className="mt-3">
            <ActionBtn primary testId={`pallet-${pallet.id}-mark-fixed`} onClick={() => markPalletFixed(pallet.id)}>Mark fixed</ActionBtn>
          </div>
        </div>
      ) : (
        <ResolvedNote>All checks pass</ResolvedNote>
      )}
    </article>
  );
};

const Warehouse = () => {
  const { pallets } = useMock();
  const fails = pallets.filter((p) => p.status === "fail").length;
  return (
    <div data-testid="warehouse-page">
      <Seo title="Warehouse - Haulage AI" description="Warehouse Vision packing-bench demo with pallet checks and retailer rules." />
      <h1 className="font-heading text-xl font-bold sm:text-2xl">Warehouse · Packing bench 3</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {fails} pallet{fails === 1 ? "" : "s"} need attention before loading. Large touch targets, built for a tablet. Demo data.
      </p>
      <div className="mt-5 grid gap-5 lg:grid-cols-2" data-testid="pallet-grid">
        {pallets.map((p) => (
          <PalletCard key={p.id} pallet={p} />
        ))}
      </div>
    </div>
  );
};

export default Warehouse;
