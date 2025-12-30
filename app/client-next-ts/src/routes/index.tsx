import { z } from 'zod';

import { createFileRoute } from '@tanstack/react-router';

import { ComponentsSection } from '../components/landing/components-section';
import { DemoCarousel } from '../components/landing/demo-carousel';
import { ExperiencesSection } from '../components/landing/experiences-section';
import { HeroSection } from '../components/landing/hero-section';
import { RecipesSection } from '../components/landing/recipes-section';
import { CompactHomepage } from '../experiments/landing-page/compact-homepage/CompactHomepage';
import { CompactHomepage2 } from '../experiments/landing-page/compact-homepage2/CompactHomepage2';
import { LandingPageExperiment } from '../experiments/landing-page/constants';

// Define search param schema with validation
const indexSearchSchema = z.object({
  experiment: z.nativeEnum(LandingPageExperiment).optional(),
});

export const Route = createFileRoute('/')({
  component: LandingPage,
  validateSearch: indexSearchSchema,
});

function LandingPage() {
  const search = Route.useSearch();

  // Only use experiment from URL parameter, not localStorage
  // This ensures the default page is always the legacy layout
  const activeExperiment = search.experiment;

  // Render compact homepage if experiment is explicitly in URL
  if (activeExperiment === LandingPageExperiment.COMPACT_HOMEPAGE) {
    return <CompactHomepage />;
  }

  // Render enhanced compact homepage v2 if experiment is explicitly in URL
  if (activeExperiment === LandingPageExperiment.COMPACT_HOMEPAGE_2) {
    return <CompactHomepage2 />;
  }

  // Default landing page
  return (
    <div>
      <HeroSection />
      <DemoCarousel />
      <RecipesSection />
      <ExperiencesSection />
      <ComponentsSection />
    </div>
  );
}
