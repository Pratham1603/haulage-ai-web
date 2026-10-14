import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const Container = ({ className = "", children, ...rest }) => (
  <div className={`mx-auto w-full max-w-[1200px] px-5 md:px-8 ${className}`} {...rest}>{children}</div>
);

export const Section = ({ id, tint = false, className = "", children }) => (
  <section id={id} className={`py-16 md:py-24 ${tint ? "bg-surface" : ""} ${className}`}>
    {children}
  </section>
);

export const SectionHeading = ({ eyebrow, title, sub, center = false, testId }) => (
  <div className={`mb-10 max-w-2xl md:mb-14 ${center ? "mx-auto text-center" : ""}`} data-testid={testId}>
    {eyebrow && (
      <div className="mb-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground shadow-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {eyebrow}
        </span>
      </div>
    )}
    <h2 className="text-3xl font-bold sm:text-4xl tracking-tight text-heading">{title}</h2>
    {sub && <p className="mt-4 text-base text-muted-foreground md:text-lg leading-relaxed">{sub}</p>}
  </div>
);

export const PrimaryButton = ({ to = "/contact", children = "Book a Demo", className = "", testId }) => (
  <Link
    to={to}
    data-testid={testId}
    className={`btn-tactile group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground ${className}`}
  >
    {children}
    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
  </Link>
);

export const SecondaryButton = ({ to = "/product", children = "See it in action", className = "", testId }) => (
  <Link
    to={to}
    data-testid={testId}
    className={`btn-tactile-secondary inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/80 backdrop-blur-xs px-6 py-3 text-sm font-semibold text-heading ${className}`}
  >
    {children}
  </Link>
);

export const TextLink = ({ to, children, className = "", testId }) => (
  <Link
    to={to}
    data-testid={testId}
    className={`group inline-flex items-center gap-1.5 text-sm font-semibold text-heading underline-offset-4 hover:underline ${className}`}
  >
    {children}
    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
  </Link>
);

const STATUS_STYLES = {
  ai: "border-status-ai/40 bg-status-ai/10 text-status-ai shadow-xs",
  approval: "border-status-approval/40 bg-status-approval/10 text-status-approval shadow-xs",
  human: "border-status-human/40 bg-status-human/10 text-status-human shadow-xs",
};

const STATUS_LABELS = {
  ai: "Handled by AI",
  approval: "Needs approval",
  human: "Needs a human",
};

export const StatusTag = ({ variant = "ai", className = "" }) => (
  <span
    data-testid={`status-tag-${variant}`}
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide backdrop-blur-xs ${STATUS_STYLES[variant]} ${className}`}
  >
    <span className="sonar-ping h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
    {STATUS_LABELS[variant]}
  </span>
);

export const PlaceholderChip = ({ className = "" }) => (
  <span
    className={`inline-flex items-center rounded-full border border-dashed border-muted-foreground/40 bg-surface/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground ${className}`}
  >
    Placeholder
  </span>
);

export const Hero = ({ title, sub, visual, secondaryTo = "/product", testId }) => (
  <Section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
    {/* Ambient Craft Glow */}
    <div className="ambient-glow -top-32 -left-24 h-96 w-96 bg-primary/20" aria-hidden="true" />
    <div className="ambient-glow top-1/2 -right-32 h-[450px] w-[450px] bg-status-ai/15" aria-hidden="true" />

    {/* Subtle blueprint grid overlay */}
    <div className="pointer-events-none absolute inset-0 bg-grid-dots opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]" aria-hidden="true" />

    <Container className="relative z-10 grid items-center gap-10 lg:grid-cols-2" data-testid={testId}>
      <div>
        {/* Live Operational Ticker Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-status-ai/30 bg-status-ai/10 px-3 py-1 text-xs font-semibold text-status-ai backdrop-blur-xs shadow-xs animate-fade-in">
          <span className="sonar-ping h-2 w-2 rounded-full bg-status-ai" />
          <span>NH-48 Corridor Active · Mumbai ⇄ Delhi 1,420 km</span>
        </div>

        <h1 className="text-4xl font-extrabold sm:text-5xl lg:text-6xl tracking-tight leading-[1.08] text-heading">
          {title}
        </h1>
        <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg leading-relaxed">{sub}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <PrimaryButton testId="hero-book-demo-btn" />
          <SecondaryButton to={secondaryTo} testId="hero-see-in-action-btn" />
        </div>
      </div>
      <div className="relative">{visual}</div>
    </Container>
  </Section>
);
