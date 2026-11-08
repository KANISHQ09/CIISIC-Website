import React from 'react';
import { WorkflowSection } from '../components/landing/WorkflowSection';
import { FAQSection } from '../components/landing/FAQSection';
import { usePageTitle } from '../lib/usePageTitle';
import { PageCTA } from '../components/common/PageCTA';

export const HowItWorks: React.FC = () => {
  usePageTitle('How It Works');
  return (
    <div className="bg-[#faf8f4] overflow-x-hidden">
      <WorkflowSection asPage />
      <FAQSection />
      <PageCTA />
    </div>
  );
};
