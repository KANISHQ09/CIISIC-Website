import React from 'react';
import { HomeHero } from '../components/landing/HomeHero';
import { HeroBannerCarousel } from '../components/landing/HeroBannerCarousel';
import { QuickImpactStatsSection } from '../components/landing/QuickImpactStatsSection';
import { AboutSummarySection } from '../components/landing/AboutSummarySection';
import { FeaturedProblemsSection } from '../components/landing/FeaturedProblemsSection';
import { ComingUpSection } from '../components/landing/ComingUpSection';
import { GetInvolvedSection } from '../components/landing/GetInvolvedSection';

/**
 * The home page is kept short: a hero for students and visitors with the cells, a short About, problems open
 * right now, a preview of events and opportunities, event photos and key numbers,
 * then how to get involved.
 * Everything else has its own page (see the nav).
 */
export const Home: React.FC = () => {
  return (
    <div className="bg-[#faf8f4] min-h-screen font-sans selection:bg-[#c48825]/20 selection:text-[#063028] overflow-x-hidden">
      <HomeHero />
      <AboutSummarySection />
      <FeaturedProblemsSection />
      <ComingUpSection />

      {/* Event photos and key numbers */}
      <section
        id="highlights"
        aria-label="Highlights"
        className="w-full flex flex-col bg-[#faf8f4] border-y border-[#e8e4dc] overflow-hidden"
      >
        <div className="w-full h-[400px] sm:h-[540px] lg:h-[76vh] lg:min-h-[600px] lg:max-h-[840px] relative flex flex-col">
          <HeroBannerCarousel />
        </div>
        <QuickImpactStatsSection />
      </section>

      <GetInvolvedSection />
    </div>
  );
};
