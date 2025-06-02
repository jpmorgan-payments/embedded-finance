import { createFileRoute } from '@tanstack/react-router';
import { HeroSection } from '../components/landing/hero-section';
import { ContentSection } from '../components/landing/content-section';
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
      <ContentSection />
      <DemoCarousel />
      <ExperiencesSection />
      <ComponentsSection />
    </div>
  );
}
