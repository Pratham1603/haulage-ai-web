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
          <div key={col.name} className="rounded-xl border bg-surface p-3">
            <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {col.name} · {col.cards.length}
            </h2>
            <div className="mt-3 space-y-3">
              {col.cards.map((c) => (
                <article key={c.id} data-testid={`return-card-${c.id}`} className="rounded-xl border bg-card p-3.5 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-heading">{c.id}</p>
                    <StatusTag variant={c.tag} />
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-foreground">{c.title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{c.detail}</p>
                  <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <PackageCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-ai" aria-hidden="true" />
                    {c.match}
                  </p>
                </article>
              ))}
              {col.cards.length === 0 && (
                <p className="rounded-lg border border-dashed p-3 text-center text-[11px] text-muted-foreground">Nothing here</p>
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
