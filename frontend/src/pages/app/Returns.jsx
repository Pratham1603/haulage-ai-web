import { PackageCheck } from "lucide-react";
import { Seo } from "../../components/Seo";
import { StatusTag } from "../../components/site/ui";
import { useMock } from "../../mock/store";

const Returns = () => {
  const { returns } = useMock();
  return (
    <div data-testid="returns-page">
      <Seo title="Returns - Haulage AI" description="Reverse logistics pipeline demo: returns, claims and return-leg matching." />
      <h1 className="font-heading text-xl font-bold sm:text-2xl">Returns</h1>
      <p className="mt-1 text-sm text-muted-foreground">From rejection to credit note, one pipeline. Demo data.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="returns-board">
        {returns.columns.map((col) => (
          <div key={col.name} className="card-craft p-3 bg-surface/50">
            <div className="flex items-center justify-between px-1 border-b border-border/50 pb-2">
              <h2 className="label-caps text-[10px] text-muted-foreground">
                {col.name}
              </h2>
              <span className="font-mono text-[10px] font-bold rounded-full bg-surface px-2 py-0.5 border border-border/60">
                {col.cards.length}
              </span>
            </div>
            <div className="mt-3 space-y-3 stagger-list">
              {col.cards.map((c) => (
                <article key={c.id} data-testid={`return-card-${c.id}`} className="card-craft p-3.5 bg-card">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-xs font-bold text-heading">{c.id}</p>
                    <StatusTag variant={c.tag} />
                  </div>
                  <p className="mt-1.5 text-xs font-bold text-heading">{c.title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{c.detail}</p>
                  <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground bg-surface/80 p-2 rounded-md border border-border/40">
                    <PackageCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-ai" aria-hidden="true" />
                    <span>{c.match}</span>
                  </p>
                </article>
              ))}
              {col.cards.length === 0 && (
                <p className="rounded-lg border border-dashed border-border/80 p-3 text-center font-mono text-[11px] text-muted-foreground">Empty Pipeline</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Seed story: 6 cartons rejected by Mr. Gupta at Narela became RMA-118, with POD, photos and invoice auto-bundled, matched to a truck already returning to Mumbai.
      </p>
    </div>
  );
};

export default Returns;
