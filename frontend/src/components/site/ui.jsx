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
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{eyebrow}</p>
    )}
    <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
    {sub && <p className="mt-4 text-base text-muted-foreground md:text-lg">{sub}</p>}
  </div>
);

export const PrimaryButton = ({ to = "/contact", children = "Book a Demo", className = "", testId }) => (
  <Link
    to={to}
    data-testid={testId}
    className={`inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 ${className}`}
  >
    {children}
  </Link>
);

export const SecondaryButton = ({ to = "/product", children = "See it in action", className = "", testId }) => (
  <Link
    to={to}
    data-testid={testId}
    className={`inline-flex items-center justify-center gap-2 rounded-xl border border-primary/60 px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 ${className}`}
  >
    {children}
  </Link>
);

export const TextLink = ({ to, children, className = "", testId }) => (
  <Link
    to={to}
    data-testid={testId}
    className={`inline-flex items-center gap-1.5 text-sm font-semibold text-heading underline-offset-4 hover:underline ${className}`}
  >
    {children}
    <ArrowRight className="h-4 w-4" aria-hidden="true" />
  </Link>
);

const STATUS_STYLES = {
  ai: "border-status-ai/40 bg-status-ai/10 text-status-ai",
  approval: "border-status-approval/40 bg-status-approval/10 text-status-approval",
  human: "border-status-human/40 bg-status-human/10 text-status-human",
};

const STATUS_LABELS = {
  ai: "Handled by AI",
  approval: "Needs approval",
  human: "Needs a human",
};

export const StatusTag = ({ variant = "ai", className = "" }) => (
  <span
    data-testid={`status-tag-${variant}`}
    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[variant]} ${className}`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
    {STATUS_LABELS[variant]}
  </span>
);

export const PlaceholderChip = ({ className = "" }) => (
  <span
    className={`inline-flex items-center rounded-full border border-dashed border-muted-foreground/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground ${className}`}
  >
    Placeholder
  </span>
);

export const Hero = ({ title, sub, visual, secondaryTo = "/product", testId }) => (
  <Section className="pt-12 md:pt-20">
    <Container className="grid items-center gap-10 lg:grid-cols-2" data-testid={testId}>
      <div>
        <h1 className="text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">{title}</h1>
        <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">{sub}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <PrimaryButton testId="hero-book-demo-btn" />
          <SecondaryButton to={secondaryTo} testId="hero-see-in-action-btn" />
        </div>
      </div>
      <div className="relative">{visual}</div>
    </Container>
  </Section>
);
