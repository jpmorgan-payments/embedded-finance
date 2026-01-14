import { ComponentChart } from './ComponentChart';
import { ContributionHeatmap } from './ContributionHeatmap';
import { ContributorWall } from './ContributorWall';
import { FeaturesShipped } from './FeaturesShipped';
import { FunFacts } from './FunFacts';
import { HeroSection } from './HeroSection';
import { HighlightCards } from './HighlightCards';
import { LookingAhead } from './LookingAhead';
import { MonthlyActivityChart } from './MonthlyActivityChart';
import { UXTestingJourney } from './UXTestingJourney';
import { VersionTimeline } from './VersionTimeline';

export function YearInReviewDashboard() {
  return (
    <div className="snap-y snap-mandatory">
      <section className="min-h-screen snap-start">
        <HeroSection />
      </section>
      <section className="min-h-screen snap-start">
        <HighlightCards />
      </section>
      <section className="min-h-screen snap-start">
        <VersionTimeline />
      </section>
      <section className="min-h-screen snap-start">
        <ComponentChart />
      </section>
      <section className="min-h-screen snap-start">
        <MonthlyActivityChart />
      </section>
      <section className="min-h-screen snap-start">
        <FeaturesShipped />
      </section>
      <section className="min-h-screen snap-start">
        <ContributorWall />
      </section>
      <section className="min-h-screen snap-start">
        <UXTestingJourney />
      </section>
      <section className="min-h-screen snap-start">
        <ContributionHeatmap />
      </section>
      <section className="min-h-screen snap-start">
        <FunFacts />
      </section>
      <section className="min-h-screen snap-start">
        <LookingAhead />
      </section>
    </div>
  );
}
