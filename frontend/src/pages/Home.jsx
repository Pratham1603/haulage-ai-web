import { Seo } from "../components/Seo";
import { SiteLayout } from "../components/SiteLayout";
import { Hero, PlaceholderChip } from "../components/site/ui";
import {
  LogoBar,
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
import { VoiceCallMockup } from "../components/site/mockups";
import { HeroInteractiveShowcase } from "../components/site/HeroInteractiveShowcase";
import { CorridorTickerTape } from "../components/site/CorridorTickerTape";
import { InteractiveSimulator } from "../components/site/InteractiveSimulator";
import { Section, Container, SectionHeading } from "../components/site/ui";
import { PROBLEMS, STEPS, METRICS, TESTIMONIALS, HOME_FAQS } from "../content/site";

const Home = () => (
  <SiteLayout>
    <Seo
      title="Haulage AI - Your logistics back office, run by AI agents"
      description="AI agents read orders, answer calls in Hindi and Gujarati, match trucks, audit invoices and handle returns. Built for Indian freight."
    />
    <Hero
      testId="home-hero"
      title="Your logistics back office, run by AI agents."
      sub="Haulage AI reads orders, answers calls in Hindi and Gujarati, matches trucks, checks warehouses, audits invoices, and handles returns. Your team handles the exceptions."
      secondaryTo="/how-it-works"
      visual={<HeroInteractiveShowcase />}
    />
    <CorridorTickerTape />
    <LogoBar />
    <ProblemCards
      title="Freight still runs on inboxes, phone calls, and spreadsheets."
      sub="The work is not hard. It is endless, and it scales with every truck you add."
      items={PROBLEMS}
    />
    <ModuleGrid title="Seven modules, one operating system." sub="Each module removes a layer of manual coordination. Together they run the loop." />
    <StepRow
      title="How it works"
      sub="One loop, running continuously across your lanes."
      steps={STEPS}
      link={{ to: "/how-it-works", label: "See how it works" }}
    />
    <InteractiveSimulator />
    <FeatureBlock
      testId="voice-highlight"
      title="Calls your drivers actually pick up."
      bullets={[
        "Hindi and Gujarati calls, made and answered around the clock",
        "Status queries resolved without your dispatcher",
        "Rate negotiation within the limits you set",
      ]}
      link={{ to: "/product/voice-ai", label: "Explore Voice AI", testId: "voice-highlight-link" }}
      visual={<VoiceCallMockup />}
    />
    <MetricsBand metrics={METRICS} />
    <CaseTeaserCard />
    <RoleTabs />
    <TrustBlock />
    <Section>
      <Container>
        <SectionHeading title="What operators say" sub="Placeholder testimonials. Real references come after launch." testId="testimonials-heading" />
        <div className="grid gap-5 md:grid-cols-2" data-testid="testimonials">
          {TESTIMONIALS.map((t, i) => (
            <Testimonial key={i} {...t} testId={`testimonial-${i}`} />
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          <PlaceholderChip /> All testimonials on this page are placeholders.
        </p>
      </Container>
    </Section>
    <FaqAccordion items={HOME_FAQS} />
    <FinalCtaBanner headline="See Haulage AI run your operation" />
  </SiteLayout>
);

export default Home;

