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

export const IntegrationStrip = ({ caption = "Connects to the tools you already use." }) => (
  <div data-testid="integration-strip" className="border-y bg-surface py-6">
    <Container className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        {["Gmail", "Outlook", "WhatsApp", "TMS", "Tally", "GPS & FASTag", "ERP"].map((name) => (
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
  <div data-testid="logo-bar" className="border-b py-10">
    <Container>
      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Trusted by logistics teams across India <PlaceholderChip className="ml-2" />
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        {["TransIndia", "Bhiwandi Freight", "Narela Logistics", "Western Carriers", "Deccan Haul", "GST Freight Co"].map(
          (name) => (
            <div
              key={name}
              className="flex h-12 items-center rounded-xl border px-5 text-sm font-semibold text-muted-foreground"
              aria-label={`${name} logo (placeholder)`}
            >
              {name}
            </div>
          )
        )}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">Placeholder logos. Not real customers.</p>
    </Container>
  </div>
);

export const ProblemCards = ({ title, sub, items }) => (
  <Section>
    <Container>
      <SectionHeading title={title} sub={sub} testId="problem-heading" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-testid="problem-cards">
        {items.map(({ icon: Icon, title: t, text }) => (
          <div key={t} className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-heading">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold">{t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{text}</p>
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
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-testid="module-grid">
        {MODULES.map(({ slug, name, icon: Icon, line, bullets }, i) => (
          <div
            key={slug}
            data-testid={`module-card-${slug}`}
            className={`flex flex-col rounded-xl border bg-card p-6 shadow-sm ${i === 4 ? "lg:col-start-2" : ""}`}
          >
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-heading">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold">{name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{line}</p>
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
            <div className="mt-4 pt-2">
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
      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-testid="step-row">
        {steps.map((s, i) => (
          <li key={s.title} className="relative rounded-xl border bg-card p-6 shadow-sm">
            <span className="font-heading text-3xl font-bold text-muted-foreground/40">{i + 1}</span>
            <h3 className="mt-3 text-base font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.line}</p>
            {stageChips && stageChips[i] && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {stageChips[i].map((c) => (
                  <span key={c} className="rounded-full border bg-surface px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {c}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
      {footBar && (
        <div className="mt-5 rounded-xl border bg-card px-6 py-4 text-center text-sm font-medium text-muted-foreground shadow-sm">
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
  <section className="bg-navy py-14 md:py-16" data-testid="metrics-band">
    <Container>
      <div className="grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label}>
            <p className="font-heading text-4xl font-bold text-white md:text-5xl">{m.value}</p>
            <p className="mt-2 text-sm text-white/70">{m.label}</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-white/50">Placeholder</p>
          </div>
        ))}
      </div>
    </Container>
  </section>
);

export const CaseTeaserCard = () => (
  <Section>
    <Container>
      <div
        data-testid="case-teaser"
        className="flex flex-col items-start gap-6 rounded-xl border bg-card p-8 shadow-sm md:flex-row md:items-center md:justify-between md:p-10"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Case study · Illustrative scenario</p>
          <h3 className="mt-3 font-heading text-2xl font-bold">One shipment, Mumbai to Delhi, seven modules.</h3>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Follow 18 pallets from the first email order to the final invoice, and see where each AI agent steps in.
          </p>
        </div>
        <PrimaryButton to="/case-study" testId="case-teaser-btn">
          Follow the shipment
        </PrimaryButton>
      </div>
    </Container>
  </Section>
);

const TRUST_ICONS = [ShieldCheck, ClipboardList, LockKeyhole];

export const TrustBlock = ({ points = ["Humans approve what matters", "Full audit trail", "Data privacy and consent"] }) => (
  <Section tint>
    <Container>
      <div className="grid gap-5 sm:grid-cols-3" data-testid="trust-block">
        {points.map((p, i) => {
          const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
          return (
            <div key={p} className="rounded-xl border bg-card p-6 shadow-sm">
              <Icon className="h-5 w-5 text-heading" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold">{p}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {i === 0 && "Money or risk above your limits goes to a human, with full context."}
                {i === 1 && "Every AI action is logged, visible and reversible."}
                {i === 2 && "Consent-based calling and encryption in transit and at rest."}
              </p>
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

export const RelatedModules = ({ current }) => {
  const related = MODULES.filter((m) => m.slug !== current).slice(0, 3);
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
  <section className="bg-primary py-16 md:py-24" data-testid="final-cta-banner">
    <Container className="text-center">
      <h2 className="mx-auto max-w-2xl font-heading text-3xl font-bold text-primary-foreground sm:text-4xl">
        {headline}
      </h2>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/contact"
          data-testid="final-cta-book-demo-btn"
          className="inline-flex items-center justify-center rounded-xl bg-primary-foreground px-6 py-3 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
        >
          Book a Demo
        </Link>
        <Link
          to={secondaryTo}
          data-testid="final-cta-see-in-action-btn"
          className="inline-flex items-center justify-center rounded-xl border border-primary-foreground/60 px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
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
