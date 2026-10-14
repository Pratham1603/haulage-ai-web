import { Seo } from "../components/Seo";
import { SiteLayout } from "../components/SiteLayout";
import { Hero, StatusTag, Section, Container, SectionHeading, TextLink } from "../components/site/ui";
import {
  IntegrationStrip,
  ProblemCards,
  ModuleGrid,
  StepRow,
  FeatureBlock,
  MetricsBand,
  CaseTeaserCard,
  RoleTabs,
  TrustBlock,
  Testimonial,
  FaqAccordion,
  FinalCtaBanner,
} from "../components/site/blocks";
import { PlatformDiagram, ControlTowerMockup, ExceptionCardMockup } from "../components/site/mockups";
import { BrainCircuit, CopyPlus, AlarmClock } from "lucide-react";
import { STEPS, METRICS, TESTIMONIALS, PRODUCT_FAQS } from "../content/site";

const STACK_PROBLEMS = [
  {
    icon: BrainCircuit,
    title: "Coordination lives in people's heads",
    text: "Which driver is on which lane, who approved what rate. It walks out the door every evening.",
  },
  {
    icon: CopyPlus,
    title: "Data is re-keyed at every handover",
    text: "Email to spreadsheet, spreadsheet to TMS, TMS to invoice. Every copy is a chance to be wrong.",
  },
  {
    icon: AlarmClock,
    title: "Problems are found after they cost money",
    text: "Detention, chargebacks and empty runs surface in the month-end report, not when you can still act.",
  },
];

const STAGE_CHIPS = [
  ["Back-Office Automation", "Freight Matching"],
  ["Voice AI", "Warehouse Vision"],
  ["Back-Office tracking", "Control Tower"],
  ["Control Tower", "Reverse Logistics"],
];

const HITL = [
  {
    variant: "ai",
    title: "Handled by AI",
    text: "Routine work done automatically: order entry, status calls, tracking updates, invoice drafts.",
  },
  {
    variant: "approval",
    title: "Needs approval",
    text: "Money or risk above your limits. One tap to decide, with the evidence attached.",
  },
  {
    variant: "human",
    title: "Needs a human",
    text: "Judgment calls handed over with full context: what happened, what the AI tried, what it recommends.",
  },
];

const Product = () => (
  <SiteLayout>
    <Seo
      title="Product - One operating system for your entire freight operation | Haulage AI"
      description="Seven AI modules handle orders, calls, matching, warehouse checks, billing, routing and returns. Your team handles the exceptions."
    />
    <Hero
      testId="product-hero"
      title="One operating system for your entire freight operation."
      sub="AI agents handle orders, calls, matching, warehouse checks, billing, routing, and returns, and your team handles the exceptions."
      secondaryTo="/case-study"
      visual={<PlatformDiagram />}
    />
    <IntegrationStrip />
    <ProblemCards
      title="Your operation runs on inboxes, phone calls, and spreadsheets."
      sub="The stack is not the problem. The manual glue between the tools is."
      items={STACK_PROBLEMS}
    />
    <ModuleGrid
      title="Seven modules, one system."
      sub="Use one or use all seven. They share the same data and the same guardrails."
      withBullets
    />
    <StepRow
      title="One loop, not seven tools."
      sub="Every module acts at the stage of the loop where the work happens."
      steps={STEPS}
      stageChips={STAGE_CHIPS}
      footBar="Compliance and Finance watches every stage: audits, billing checks and collections across Plan, Dispatch, Track and Adjust."
      link={{ to: "/how-it-works", label: "See how it works" }}
    />
    <Section>
      <Container>
        <SectionHeading
          title="AI acts, your team approves what matters."
          sub="You set the limits. Everything is tagged, logged and reversible."
          testId="hitl-heading"
        />
        <div className="grid gap-5 lg:grid-cols-3 stagger-list" data-testid="hitl-grid">
          {HITL.map((h) => (
            <div key={h.variant} className="card-craft p-6">
              <StatusTag variant={h.variant} />
              <h3 className="mt-4 text-base font-semibold text-heading">{h.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{h.text}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-xl">
          <ExceptionCardMockup />
        </div>
      </Container>
    </Section>
    <FeatureBlock
      testId="control-tower-preview"
      reverse
      title="The Control Tower: one screen for the whole operation."
      bullets={[
        "One screen for the whole operation",
        "Exceptions first, everything else collapsed",
        "Every AI action visible and reversible",
      ]}
      link={{ to: "/product/control-tower", label: "Explore Control Tower", testId: "control-tower-link" }}
      visual={<ControlTowerMockup testId="control-tower-preview-mockup" />}
    />
    <RoleTabs />
    <MetricsBand metrics={METRICS} />
    <CaseTeaserCard />
    <TrustBlock points={["Guardrails you set", "Full audit trail", "Data privacy and consent"]} />
    <Section>
      <Container className="max-w-3xl">
        <SectionHeading title="What operators say" testId="product-testimonial-heading" />
        <Testimonial {...TESTIMONIALS[0]} testId="product-testimonial" />
      </Container>
    </Section>
    <FaqAccordion items={PRODUCT_FAQS} />
    <FinalCtaBanner headline="See the whole platform on your own operation" />
  </SiteLayout>
);

export default Product;
