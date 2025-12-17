import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { HeroSection } from '../components/landing/hero-section';
import { ComponentsSection } from '../components/landing/components-section';
import { ExperiencesSection } from '../components/landing/experiences-section';
import { DemoCarousel } from '../components/landing/demo-carousel';
import { RecipesSection } from '../components/landing/recipes-section';
import { LandingPageExperiment } from '../experiments/landing-page/constants';
import { CompactHomepage } from '../experiments/landing-page/compact-homepage/CompactHomepage';
import { useExperiment } from '../hooks/use-experiment';

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
  // Use hook to sync experiment to localStorage
  const activeExperiment = useExperiment(search);

  // Render compact homepage if experiment is active
  if (activeExperiment === LandingPageExperiment.COMPACT_HOMEPAGE) {
    return <CompactHomepage />;
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
