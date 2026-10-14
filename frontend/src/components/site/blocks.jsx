import { Link } from "react-router-dom";
import { ShieldCheck, ClipboardList, LockKeyhole, ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Container, Section, SectionHeading, PrimaryButton, SecondaryButton, TextLink, PlaceholderChip } from "./ui";
import { MODULES, ROLES, moduleBySlug } from "../../content/site";

const DEFAULT_INTEGRATIONS = ["Gmail", "Outlook", "WhatsApp", "TMS", "Tally", "GPS & FASTag", "ERP"];

export const IntegrationStrip = ({ logos = DEFAULT_INTEGRATIONS, caption = "Connects to the tools you already use." }) => (
  <div data-testid="integration-strip" className="border-y bg-surface py-6">
    <Container className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        {logos.map((name) => (
          <span key={name} className="text-sm font-semibold text-muted-foreground">
            {name}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{caption}</p>
    </Container>
  </div>
);

export const LogoBar = () => (
  <div data-testid="logo-bar" className="border-b border-border/80 bg-surface/30 py-10">
    <Container>
      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
        <span>Trusted by forward-thinking freight fleets across India</span>
        <PlaceholderChip />
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {[
          { name: "TransIndia Express", code: "TIE" },
          { name: "Bhiwandi Freight Lines", code: "BFL" },
          { name: "Narela Logistics Corp", code: "NLC" },
          { name: "Western Carriers", code: "WCR" },
          { name: "Deccan Haulage", code: "DHL-IN" },
          { name: "GST Freight Co", code: "GFC" },
        ].map((item) => (
          <div
            key={item.name}
            className="group flex h-11 items-center gap-2 rounded-xl border border-border/80 bg-card/60 px-4 text-xs font-semibold text-muted-foreground shadow-2xs backdrop-blur-xs transition-all duration-200 hover:border-primary/40 hover:text-heading hover:-translate-y-0.5"
            aria-label={`${item.name} logo (placeholder)`}
          >
            <span className="font-mono text-[10px] font-bold text-status-ai/80 bg-status-ai/10 px-1.5 py-0.5 rounded">
              {item.code}
            </span>
            <span>{item.name}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-[11px] text-muted-foreground">Placeholder carriers · Simulated production environment</p>
    </Container>
  </div>
);

export const ProblemCards = ({ title, sub, items }) => (
  <Section>
    <Container>
      <SectionHeading title={title} sub={sub} testId="problem-heading" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 stagger-list" data-testid="problem-cards">
        {items.map(({ icon: Icon, title: t, text }) => (
          <div key={t} className="card-craft p-6">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/80 bg-surface text-heading shadow-xs transition-transform duration-200 group-hover:scale-105">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-heading">{t}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </Container>
  </Section>
);

export const ModuleGrid = ({ title, sub, withBullets = false }) => (
  <Section tint>
    <Container>
      <SectionHeading title={title} sub={sub} testId="module-grid-heading" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 stagger-list" data-testid="module-grid">
        {MODULES.map(({ slug, name, icon: Icon, line, bullets }, i) => (
          <div
            key={slug}
            data-testid={`module-card-${slug}`}
            className={`card-craft flex flex-col p-6 ${i === 4 ? "lg:col-start-2" : ""}`}
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/80 bg-surface text-heading shadow-xs">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-heading">{name}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{line}</p>
            {withBullets && (
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-auto pt-4">
              <TextLink to={`/product/${slug}`} testId={`module-learn-more-${slug}`}>
                Learn more
              </TextLink>
            </div>
          </div>
        ))}
      </div>
    </Container>
  </Section>
);

export const StepRow = ({ title, sub, steps, link, stageChips = null, footBar = null }) => (
  <Section>
    <Container>
      <SectionHeading title={title} sub={sub} testId="step-row-heading" />
      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 stagger-list" data-testid="step-row">
        {steps.map((s, i) => (
          <li key={s.title} className="card-craft relative p-6">
            <span className="font-heading text-3xl font-extrabold text-muted-foreground/30 tabular">{i + 1}</span>
            <h3 className="mt-3 text-base font-semibold text-heading">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.line}</p>
            {stageChips && stageChips[i] && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {stageChips[i].map((c) => (
                  <span key={c} className="rounded-full border border-border/80 bg-surface px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-xs">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
      {footBar && (
        <div className="card-craft mt-5 px-6 py-4 text-center text-sm font-medium text-muted-foreground">
          {footBar}
        </div>
      )}
      {link && (
        <div className="mt-8">
          <TextLink to={link.to} testId="step-row-link">
            {link.label}
          </TextLink>
        </div>
      )}
    </Container>
  </Section>
);

export const FeatureBlock = ({ title, bullets, link, visual, reverse = false, testId }) => (
  <Section tint={reverse}>
    <Container>
      <div
        className={`grid items-center gap-10 lg:grid-cols-2 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}
        data-testid={testId}
      >
        <div>
          <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
          <ul className="mt-6 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex gap-3 text-base text-muted-foreground">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-heading" aria-hidden="true" />
                {b}
              </li>
            ))}
          </ul>
          {link && (
            <div className="mt-6">
              <TextLink to={link.to} testId={link.testId}>
                {link.label}
              </TextLink>
            </div>
          )}
        </div>
        <div>{visual}</div>
      </div>
    </Container>
  </Section>
);

export const MetricsBand = ({ metrics }) => (
  <section className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-navy to-slate-950 py-16 md:py-20 border-y border-white/10" data-testid="metrics-band">
    {/* Ambient illumination */}
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.18),transparent_70%)]" aria-hidden="true" />
    <div className="pointer-events-none absolute inset-0 bg-grid-dots opacity-20" aria-hidden="true" />

    <Container className="relative z-10">
      <div className="grid gap-6 text-center sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="group relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xs transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08] hover:-translate-y-1"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              FASTag Verified
            </div>
            <p className="font-heading text-4xl font-extrabold text-white md:text-5xl tracking-tight">{m.value}</p>
            <p className="mt-2 text-sm text-white/80 leading-snug">{m.label}</p>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-wider text-white/40">Verified Corridor Telemetry</p>
          </div>
        ))}
      </div>
    </Container>
  </section>
);

export const CaseTeaserCard = ({
  copy = "Follow 18 pallets from the first email order to the final invoice, and see where each AI agent steps in.",
  ctaLabel = "Follow the shipment",
}) => (
  <Section>
    <Container>
      <div
        data-testid="case-teaser"
        className="card-craft flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-10 border-border/80 shadow-lg"
      >
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-status-ai/30 bg-status-ai/10 px-3 py-1 text-xs font-semibold text-status-ai mb-3">
            <span className="sonar-ping h-2 w-2 rounded-full bg-status-ai" />
            <span>Case study · Real-world Indian Freight Scenario</span>
          </div>
          <h3 className="font-heading text-2xl font-bold text-heading sm:text-3xl tracking-tight">
            One shipment, Mumbai to Delhi, seven modules.
          </h3>
          <p className="mt-2.5 text-sm md:text-base text-muted-foreground leading-relaxed">{copy}</p>
        </div>
        <PrimaryButton to="/case-study" testId="case-teaser-btn" className="shrink-0">
          {ctaLabel}
        </PrimaryButton>
      </div>
    </Container>
  </Section>
);

const TRUST_ICONS = [ShieldCheck, ClipboardList, LockKeyhole, ClipboardList];

const DEFAULT_TRUST_TEXT = {
  "Humans approve what matters": "Money or risk above your limits goes to a human, with full context.",
  "Full audit trail": "Every AI action is logged, visible and reversible.",
  "Data privacy and consent": "Consent-based calling and encryption in transit and at rest.",
  "Guardrails you set": "You set the limits; the agents never cross them.",
};

export const TrustBlock = ({
  heading,
  points = ["Humans approve what matters", "Full audit trail", "Data privacy and consent"],
}) => {
  const items = points.map((p) => (typeof p === "string" ? { title: p, text: DEFAULT_TRUST_TEXT[p] || "" } : p));
  return (
    <Section tint>
      <Container>
        {heading && <SectionHeading title={heading} testId="trust-heading" />}
        <div className={`grid gap-5 sm:grid-cols-2 ${items.length === 4 ? "lg:grid-cols-4" : "sm:grid-cols-3"}`} data-testid="trust-block">
          {items.map((p, i) => {
            const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
            return (
              <div key={p.title} className="rounded-xl border bg-card p-6 shadow-sm">
                <Icon className="h-5 w-5 text-heading" aria-hidden="true" />
                <h3 className="mt-3 text-base font-semibold">{p.title}</h3>
                {p.text && <p className="mt-1.5 text-sm text-muted-foreground">{p.text}</p>}
              </div>
            );
          })}
        </div>
        <div className="mt-8">
          <TextLink to="/trust-security" testId="trust-block-link">
            Read about Trust and Security
          </TextLink>
        </div>
      </Container>
    </Section>
  );
};

export const Testimonial = ({ quote, name, role, testId }) => (
  <figure data-testid={testId} className="rounded-xl border bg-card p-6 shadow-sm md:p-8">
    <PlaceholderChip />
    <blockquote className="mt-4 text-base text-foreground md:text-lg">“{quote}”</blockquote>
    <figcaption className="mt-4 text-sm text-muted-foreground">
      <span className="font-semibold text-heading">{name}</span> · {role}
    </figcaption>
  </figure>
);

export const FaqAccordion = ({ items, title = "Questions, answered" }) => (
  <Section>
    <Container className="max-w-3xl">
      <SectionHeading title={title} testId="faq-heading" />
      <Accordion type="single" collapsible data-testid="faq-accordion">
        {items.map((f, i) => (
          <AccordionItem key={f.q} value={`item-${i}`}>
            <AccordionTrigger data-testid={`faq-question-${i}`} className="text-left text-base font-semibold text-heading">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground md:text-base">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Container>
  </Section>
);

export const RoleTabs = () => (
  <Section tint>
    <Container>
      <SectionHeading
        title="Built for every role in the operation"
        sub="The same platform, tuned to the problems your role owns."
        testId="role-tabs-heading"
      />
      <Tabs defaultValue={ROLES[0].slug} data-testid="role-tabs">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-surface p-1">
          {ROLES.map((r) => (
            <TabsTrigger key={r.slug} value={r.slug} data-testid={`role-tab-${r.slug}`} className="text-sm">
              {r.tab}
            </TabsTrigger>
          ))}
        </TabsList>
        {ROLES.map((r) => (
          <TabsContent key={r.slug} value={r.slug} className="mt-6 rounded-xl border bg-card p-6 shadow-sm md:p-8">
            <p className="text-base text-muted-foreground md:text-lg">{r.pain}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {r.modules.map((slug) => (
                <span key={slug} className="rounded-full border bg-surface px-3 py-1.5 text-xs font-semibold text-heading">
                  {moduleBySlug(slug).name}
                </span>
              ))}
            </div>
            <div className="mt-6">
              <TextLink to={`/solutions/${r.slug}`} testId={`role-link-${r.slug}`}>
                Haulage AI for {r.name}
              </TextLink>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </Container>
  </Section>
);

export const RelatedModules = ({ current, slugs = null }) => {
  const related = slugs
    ? slugs.map((s) => moduleBySlug(s)).filter(Boolean).slice(0, 3)
    : MODULES.filter((m) => m.slug !== current).slice(0, 3);
  return (
    <div className="grid gap-5 sm:grid-cols-3" data-testid="related-modules">
      {related.map(({ slug, name, icon: Icon, line }) => (
        <Link key={slug} to={`/product/${slug}`} className="rounded-xl border bg-card p-6 shadow-sm transition-colors hover:bg-accent">
          <Icon className="h-5 w-5 text-heading" aria-hidden="true" />
          <h3 className="mt-3 text-base font-semibold">{name}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{line}</p>
        </Link>
      ))}
    </div>
  );
};

export const BeforeAfterTable = ({ rows }) => (
  <div className="overflow-x-auto rounded-xl border bg-card shadow-sm" data-testid="before-after-table">
    <table className="w-full min-w-[560px] text-left text-sm">
      <thead>
        <tr className="border-b bg-surface">
          <th className="px-5 py-3.5 font-semibold text-heading">Task</th>
          <th className="px-5 py-3.5 font-semibold text-heading">Before</th>
          <th className="px-5 py-3.5 font-semibold text-heading">With Haulage AI</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.task} className="border-b last:border-0">
            <td className="px-5 py-3.5 font-medium">{r.task}</td>
            <td className="px-5 py-3.5 text-muted-foreground">{r.before}</td>
            <td className="px-5 py-3.5 text-muted-foreground">{r.after}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const FinalCtaBanner = ({ headline = "See Haulage AI run your operation", secondaryTo = "/case-study" }) => (
  <section className="relative overflow-hidden bg-primary py-16 md:py-24" data-testid="final-cta-banner">
    {/* Ambient illumination */}
    <div className="ambient-glow -top-24 left-1/2 -translate-x-1/2 h-72 w-96 bg-status-ai/25" aria-hidden="true" />
    <div className="pointer-events-none absolute inset-0 bg-grid-dots opacity-15" aria-hidden="true" />

    <Container className="relative z-10 text-center">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3.5 py-1 text-xs font-semibold text-primary-foreground backdrop-blur-xs">
        <span className="sonar-ping h-2 w-2 rounded-full bg-emerald-400" />
        Live Onboarding Available · Mumbai & Delhi Hubs
      </div>
      <h2 className="mx-auto max-w-2xl font-heading text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl tracking-tight">
        {headline}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm md:text-base text-primary-foreground/80 leading-relaxed">
        Connect your TMS, WhatsApp, and FASTag in 15 minutes. See your first load auto-dispatched today.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/contact"
          data-testid="final-cta-book-demo-btn"
          className="btn-tactile inline-flex items-center justify-center rounded-xl bg-primary-foreground px-7 py-3.5 text-sm font-bold text-primary transition-all hover:bg-white shadow-xl"
        >
          Book a 30-Min Demo
        </Link>
        <Link
          to={secondaryTo}
          data-testid="final-cta-see-in-action-btn"
          className="btn-tactile-secondary inline-flex items-center justify-center rounded-xl border border-primary-foreground/30 bg-primary-foreground/10 px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-foreground/20 backdrop-blur-xs"
        >
          See it in action
        </Link>
      </div>
    </Container>
  </section>
);

export const PersonaChips = () => (
  <div className="flex flex-wrap gap-2" data-testid="persona-chips">
    {ROLES.map((r) => (
      <Link
        key={r.slug}
        to={`/solutions/${r.slug}`}
        data-testid={`persona-chip-${r.slug}`}
        className="group inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-2 text-sm font-medium text-heading transition-colors hover:bg-accent"
      >
        {r.tab}
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    ))}
  </div>
);
