import React from 'react';
import { ExcellenceCellsSection } from '../components/landing/ExcellenceCellsSection';
import { usePageTitle } from '../lib/usePageTitle';
import { PageCTA } from '../components/common/PageCTA';

export const Ecosystem: React.FC = () => {
  usePageTitle('Our Ecosystem');
  return (
    <div className="bg-[#faf8f4] overflow-x-hidden">
      <ExcellenceCellsSection />
      <PageCTA />
    </div>
  );
};
