import { createFileRoute } from '@tanstack/react-router';
import { HeroSection } from '../components/landing/hero-section';
import { ComponentsSection } from '../components/landing/components-section';
import { ExperiencesSection } from '../components/landing/experiences-section';
import { DemoCarousel } from '../components/landing/demo-carousel';
import { RecipesSection } from '../components/landing/recipes-section';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
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
