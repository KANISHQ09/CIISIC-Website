import React from 'react';
import { WorkflowSection } from '../components/landing/WorkflowSection';
import { FAQSection } from '../components/landing/FAQSection';
import { usePageTitle } from '../lib/usePageTitle';

export const HowItWorks: React.FC = () => {
  usePageTitle('How It Works');
  return (
    <div className="bg-[#faf8f4] overflow-x-hidden">
      <WorkflowSection />
      <FAQSection />
    </div>
  );
};
