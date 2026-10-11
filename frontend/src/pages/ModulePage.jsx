import { useParams, Navigate } from "react-router-dom";
import { Seo } from "../components/Seo";
import { SiteLayout } from "../components/SiteLayout";
import { Hero, Section, Container, SectionHeading, PlaceholderChip } from "../components/site/ui";
import {
  IntegrationStrip,
  ProblemCards,
  StepRow,
  FeatureBlock,
  BeforeAfterTable,
  MetricsBand,
  CaseTeaserCard,
  TrustBlock,
  Testimonial,
  FaqAccordion,
  RelatedModules,
  FinalCtaBanner,
} from "../components/site/blocks";
import { MODULE_MOCKUPS } from "../components/site/moduleMockups";
import { MODULE_CONTENT } from "../content/modules";
import { moduleBySlug } from "../content/site";

const Mockup = ({ id }) => {
  const M = MODULE_MOCKUPS[id];
  return M ? <M /> : null;
};

const LanguageBand = () => (
  <Section tint>
    <Container>
      <SectionHeading
        title="Built for how India moves freight"
        sub="Real conversations, in the languages your drivers and carriers speak."
        testId="language-band-heading"
      />
      <div className="grid gap-5 md:grid-cols-2" data-testid="language-band">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Hindi</p>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-base font-medium text-heading">"नमस्ते रमेश जी, आपका ट्रक अभी कहाँ है?"</p>
              <p className="mt-1 text-sm text-muted-foreground">Hello Ramesh ji, where is your truck right now?</p>
            </div>
            <div>
              <p className="text-base font-medium text-heading">"क्या ₹74,500 भाड़ा ठीक रहेगा?"</p>
              <p className="mt-1 text-sm text-muted-foreground">Would a freight rate of Rs 74,500 work?</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Gujarati</p>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-base font-medium text-heading">"નમસ્તે હસમુખભાઈ, તમારી ગાડી અત્યારે ક્યાં છે?"</p>
              <p className="mt-1 text-sm text-muted-foreground">Hello Hasmukhbhai, where is your truck right now?</p>
            </div>
            <div>
              <p className="text-base font-medium text-heading">"₹74,500 ભાડું ચાલશે?"</p>
              <p className="mt-1 text-sm text-muted-foreground">Will a rate of Rs 74,500 work?</p>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Sample lines, pending native-speaker review.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {["Hindi", "Gujarati", "English"].map((l) => (
          <span key={l} className="rounded-full border bg-card px-3.5 py-1.5 text-xs font-semibold text-heading">{l}</span>
        ))}
        <span className="inline-flex items-center gap-2 rounded-full border border-dashed px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
          More languages coming <PlaceholderChip />
        </span>
      </div>
    </Container>
  </Section>
);

const ModulePage = () => {
  const { slug } = useParams();
  const m = MODULE_CONTENT[slug];
  const meta = moduleBySlug(slug);
  if (!m || !meta) return <Navigate to="/product" replace />;

  return (
    <SiteLayout>
      <Seo title={m.seo.title} description={m.seo.description} />
      <Hero
        testId={`module-hero-${slug}`}
        title={m.hero.headline}
        sub={m.hero.subheadline}
        secondaryTo="/case-study"
        visual={<Mockup id={m.hero.mockup} />}
      />
      <IntegrationStrip logos={m.integrations.logos} caption={m.integrations.caption} />
      <ProblemCards title={m.problem.heading} items={m.problem.items} />
      <StepRow title="How it works" steps={m.steps} />
      {m.extra === "language-band" && <LanguageBand />}
      {m.features.map((f, i) => (
        <FeatureBlock
          key={f.title}
          testId={`feature-${slug}-${i}`}
          title={f.title}
          bullets={f.bullets}
          visual={<Mockup id={f.mockup} />}
          reverse={i % 2 === 1}
        />
      ))}
      <Section>
        <Container>
          <SectionHeading title="Before and after" testId="before-after-heading" />
          <BeforeAfterTable rows={m.beforeAfter} />
        </Container>
      </Section>
      <MetricsBand metrics={m.metrics} />
      <CaseTeaserCard copy={m.caseTeaser.copy} ctaLabel={m.caseTeaser.cta} />
      <TrustBlock heading={m.trust.heading} points={m.trust.points} />
      <Section>
        <Container className="max-w-3xl">
          <Testimonial {...m.testimonial} testId={`module-testimonial-${slug}`} />
        </Container>
      </Section>
      <FaqAccordion items={m.faqs} />
      <Section tint>
        <Container>
          <SectionHeading title="Related modules" testId="related-modules-heading" />
          <RelatedModules slugs={m.related} />
        </Container>
      </Section>
      <FinalCtaBanner headline={m.finalCta} />
    </SiteLayout>
  );
};

export default ModulePage;
