import { createFileRoute } from '@tanstack/react-router';
import { HeroSection } from '../components/landing/hero-section';
import { ComponentsSection } from '../components/landing/components-section';
import { ExperiencesSection } from '../components/landing/experiences-section';
import { DemoCarousel } from '../components/landing/demo-carousel';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div>
      <HeroSection />
      <DemoCarousel />
      <ExperiencesSection />
      <ComponentsSection />
    </div>
  );
}
