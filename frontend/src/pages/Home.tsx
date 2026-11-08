import React from 'react';
import { HeroBannerCarousel } from '../components/landing/HeroBannerCarousel';
import { QuickImpactStatsSection } from '../components/landing/QuickImpactStatsSection';
import { AboutSummarySection } from '../components/landing/AboutSummarySection';
import { GetInvolvedSection } from '../components/landing/GetInvolvedSection';

/**
 * The home page is kept short: banner and numbers, a short About, then how to get involved.
 * Everything else has its own page (see the nav).
 */
export const Home: React.FC = () => {
  return (
    <div className="bg-[#faf8f4] min-h-screen font-sans selection:bg-[#c48825]/20 selection:text-[#063028] overflow-x-hidden">
      {/* Banner and key numbers fill the first screen under the navbar */}
      <section
        id="hero"
        className="w-full h-[calc(100vh-72px)] min-h-[560px] flex flex-col justify-between bg-[#faf8f4] border-b border-[#e8e4dc] overflow-hidden"
      >
        <div className="w-full flex-1 min-h-0 relative flex flex-col">
          <HeroBannerCarousel />
        </div>
        <QuickImpactStatsSection />
      </section>

      <AboutSummarySection />
      <GetInvolvedSection />
    </div>
  );
};
