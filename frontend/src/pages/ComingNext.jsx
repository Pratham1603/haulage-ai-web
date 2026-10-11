import { Construction } from "lucide-react";
import { Seo } from "../components/Seo";
import { SiteLayout } from "../components/SiteLayout";
import { Container, PrimaryButton, SecondaryButton } from "../components/site/ui";

const ComingNext = ({ title, description }) => (
  <SiteLayout>
    <Seo title={`${title} - Haulage AI`} description={description || `${title} on Haulage AI, the AI-native logistics operating system for Indian freight.`} />
    <div className="flex min-h-[55vh] items-center" data-testid="coming-next">
      <Container className="py-20 text-center">
        <Construction className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-5 font-heading text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">
          Coming next. This page is being built; the rest of the site is already live.
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
