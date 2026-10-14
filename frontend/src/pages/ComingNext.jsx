import { Construction } from "lucide-react";
import { Seo } from "../components/Seo";
import { SiteLayout } from "../components/SiteLayout";
import { Container, PrimaryButton, SecondaryButton } from "../components/site/ui";

const ComingNext = ({ title, description }) => (
  <SiteLayout>
    <Seo title={`${title} - Haulage AI`} description={description || `${title} on Haulage AI, the AI-native logistics operating system for Indian freight.`} />
    <div className="relative overflow-hidden flex min-h-[60vh] items-center" data-testid="coming-next">
      <div className="ambient-glow -top-32 left-1/2 -translate-x-1/2 h-80 w-80 bg-primary/20" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-grid-dots opacity-30" aria-hidden="true" />
      <Container className="relative z-10 py-20 text-center">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border/80 bg-surface text-heading shadow-xs">
          <Construction className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-3xl font-extrabold text-heading sm:text-4xl tracking-tight">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground leading-relaxed">
          Coming next. This module is being actively provisioned on our corridor telemetry cluster.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <PrimaryButton testId="coming-next-book-demo" />
          <SecondaryButton to="/" testId="coming-next-home">Back to home</SecondaryButton>
        </div>
      </Container>
    </div>
  </SiteLayout>
);

export default ComingNext;
