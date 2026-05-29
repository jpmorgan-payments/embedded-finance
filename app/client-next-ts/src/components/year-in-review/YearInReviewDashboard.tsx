import { useRef } from 'react';

import { ComponentChart } from './ComponentChart';
import { ContributionHeatmap } from './ContributionHeatmap';
import { ContributorWall } from './ContributorWall';
import { FeaturesShipped } from './FeaturesShipped';
import { FunFacts } from './FunFacts';
import { HeroSection } from './HeroSection';
import { HighlightCards } from './HighlightCards';
import { LookingAhead } from './LookingAhead';
import { MonthlyActivityChart } from './MonthlyActivityChart';
import { SlideNavigation } from './SlideNavigation';
import { UXTestingJourney } from './UXTestingJourney';
import { VersionTimeline } from './VersionTimeline';

export function YearInReviewDashboard() {
  const section1Ref = useRef<HTMLElement>(null);
  const section2Ref = useRef<HTMLElement>(null);
  const section3Ref = useRef<HTMLElement>(null);
  const section4Ref = useRef<HTMLElement>(null);
  const section5Ref = useRef<HTMLElement>(null);
  const section6Ref = useRef<HTMLElement>(null);
  const section7Ref = useRef<HTMLElement>(null);
  const section8Ref = useRef<HTMLElement>(null);
  const section9Ref = useRef<HTMLElement>(null);
  const section10Ref = useRef<HTMLElement>(null);
  const section11Ref = useRef<HTMLElement>(null);

  const sectionRefs = [
    section1Ref,
    section2Ref,
    section3Ref,
    section4Ref,
    section5Ref,
    section6Ref,
    section7Ref,
    section8Ref,
    section9Ref,
    section10Ref,
    section11Ref,
  ];

  return (
    <>
      <div className="snap-y snap-mandatory">
        <section ref={section1Ref} className="min-h-screen snap-start">
          <HeroSection />
        </section>
        <section ref={section2Ref} className="min-h-screen snap-start">
          <HighlightCards />
        </section>
        <section ref={section3Ref} className="min-h-screen snap-start">
          <VersionTimeline />
        </section>
        <section ref={section4Ref} className="min-h-screen snap-start">
          <ComponentChart />
        </section>
        <section ref={section5Ref} className="min-h-screen snap-start">
          <MonthlyActivityChart />
        </section>
        <section ref={section6Ref} className="min-h-screen snap-start">
          <FeaturesShipped />
        </section>
        <section ref={section7Ref} className="min-h-screen snap-start">
          <ContributorWall />
        </section>
        <section ref={section8Ref} className="min-h-screen snap-start">
          <UXTestingJourney />
        </section>
        <section ref={section9Ref} className="min-h-screen snap-start">
          <ContributionHeatmap />
        </section>
        <section ref={section10Ref} className="min-h-screen snap-start">
          <FunFacts />
        </section>
        <section ref={section11Ref} className="min-h-screen snap-start">
          <LookingAhead />
        </section>
      </div>
      <SlideNavigation sectionRefs={sectionRefs} />
    </>
  );
}
