import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

/* ─── Count-up hook for KPI values ─────────────────────────────────────── */
const useCountUp = (target, duration = 700) => {
  const [display, setDisplay] = useState(null);

  useEffect(() => {
    // Extract numeric portion and suffix (e.g. "93%" → 93, "%")
    const match = String(target).match(/^(Rs\s*)?([\d.]+)(.*)$/);
    if (!match) {
      // Non-numeric — just do a delayed reveal
      const t = setTimeout(() => setDisplay(target), 60);
      return () => clearTimeout(t);
    }

    const prefix  = match[1] || "";
    const numeric = parseFloat(match[2]);
    const suffix  = match[3] || "";

    // Only count-up whole numbers; floats/decimals just blur-in
    if (!Number.isInteger(numeric) || numeric > 999) {
      const t = setTimeout(() => setDisplay(target), 60);
      return () => clearTimeout(t);
    }

    const start = performance.now();
    let raf;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease out quart
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(eased * numeric);
      setDisplay(`${prefix}${current}${suffix}`);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return display;
};

/* ─── Panel ─────────────────────────────────────────────────────────────── */
export const Panel = ({ title, right, children, className = "", testId }) => (
  <section
    data-testid={testId}
    className={`card-craft p-5 shadow-xs ${className}`}
  >
    {(title || right) && (
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-border/50 pb-3">
        <h2 className="font-heading text-sm font-bold tracking-tight text-heading">{title}</h2>
        {right}
      </div>
    )}
    {children}
  </section>
);

/* ─── Kpi ────────────────────────────────────────────────────────────────── */
export const Kpi = ({ label, value, sub, testId }) => {
  const counted = useCountUp(value);

  return (
    <div
      data-testid={testId}
      className="card-craft group p-4 shadow-xs"
    >
      <div className="flex items-center justify-between">
        <p className="label-caps text-muted-foreground">{label}</p>
        <span className="h-1.5 w-1.5 rounded-full bg-border group-hover:bg-primary transition-colors" />
      </div>
      <p className="mt-2 font-heading text-2xl font-bold tracking-tight text-heading tabular">
        <span className="count-up">{counted ?? value}</span>
      </p>
      {sub && <p className="mt-1 font-mono text-[10px] text-muted-foreground/80">{sub}</p>}
    </div>
  );
};

/* ─── Confidence dot ─────────────────────────────────────────────────────── */
export const Conf = ({ pct }) => {
  const tone =
    pct >= 90 ? "bg-status-ai text-status-ai"
    : pct >= 75 ? "bg-status-approval text-status-approval"
    : "bg-status-human text-status-human";
  return (
    <span className="inline-flex items-center gap-1.5 tabular text-[10px] text-muted-foreground font-mono">
      <span className={`sonar-ping h-1.5 w-1.5 rounded-full ${tone}`} aria-hidden="true" />
      {pct}%
    </span>
  );
};

/* ─── ActionBtn ──────────────────────────────────────────────────────────── */
export const ActionBtn = ({ children, onClick, primary = false, testId, disabled = false }) => (
  <button
    type="button"
    data-testid={testId}
    onClick={onClick}
    disabled={disabled}
    className={`rounded-lg px-3 py-1.5 text-xs font-semibold
      disabled:pointer-events-none disabled:opacity-40
      ${primary
        ? "btn-tactile bg-primary text-primary-foreground hover:opacity-95"
        : "btn-tactile-secondary border border-border/80 bg-background text-heading hover:bg-accent"
      }`}
  >
    {children}
  </button>
);

/* ─── Keyboard Shortcut Kbd ──────────────────────────────────────────────── */
export const Kbd = ({ children }) => (
  <kbd className="human-kbd">{children}</kbd>
);

/* ─── Live Telematics Tag ────────────────────────────────────────────────── */
export const LiveTag = ({ children, variant = "emerald" }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-surface/80 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground shadow-xs">
    <span className="sonar-ping h-1.5 w-1.5 rounded-full bg-emerald-500" />
    <span className="font-mono">{children}</span>
  </span>
);

/* ─── ResolvedNote ───────────────────────────────────────────────────────── */
export const ResolvedNote = ({ children }) => (
  <p className="animate-fade-in mt-2 flex items-center gap-1.5 text-xs font-medium text-status-ai">
    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    {children}
  </p>
);

/* ─── AnimatedBar — progress bar with bar-fill animation ─────────────────── */
export const AnimatedBar = ({ pct, color = "bg-status-ai", delay = 0 }) => (
  <div className="h-2 flex-1 overflow-hidden rounded-full bg-border/80">
    <div
      className={`bar-fill h-full rounded-full ${color}`}
      style={{ width: `${pct}%`, animationDelay: `${delay}ms` }}
    />
  </div>
);

/* ─── SkeletonRow — single shimmer placeholder ───────────────────────────── */
export const SkeletonRow = ({ cols = 4 }) => (
  <tr className="border-b border-border/50">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="skeleton h-4 w-full max-w-[120px]" />
      </td>
    ))}
  </tr>
);
