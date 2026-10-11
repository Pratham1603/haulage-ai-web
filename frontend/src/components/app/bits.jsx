import { CheckCircle2 } from "lucide-react";

export const Panel = ({ title, right, children, className = "", testId }) => (
  <section data-testid={testId} className={`rounded-xl border bg-card p-5 shadow-sm ${className}`}>
    {(title || right) && (
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-heading text-base font-bold text-heading">{title}</h2>
        {right}
      </div>
    )}
    {children}
  </section>
);

export const Kpi = ({ label, value, sub, testId }) => (
  <div data-testid={testId} className="rounded-xl border bg-card p-4 shadow-sm">
    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-1 font-heading text-2xl font-bold text-heading">{value}</p>
    {sub && <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>}
  </div>
);

export const Conf = ({ pct }) => {
  const tone = pct >= 90 ? "bg-status-ai" : pct >= 75 ? "bg-status-approval" : "bg-status-human";
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${tone}`} aria-hidden="true" />
      {pct}%
    </span>
  );
};

export const ActionBtn = ({ children, onClick, primary = false, testId }) => (
  <button
    type="button"
    data-testid={testId}
    onClick={onClick}
    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90 ${
      primary ? "bg-primary text-primary-foreground" : "border text-heading hover:bg-accent"
    }`}
  >
    {children}
  </button>
);

export const ResolvedNote = ({ children }) => (
  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-status-ai">
    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
    {children}
  </p>
);
