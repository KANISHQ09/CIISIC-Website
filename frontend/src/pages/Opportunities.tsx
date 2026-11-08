import React from 'react';
import { Briefcase } from 'lucide-react';
import { ComingSoon } from '../components/common/ComingSoon';
import { usePageTitle } from '../lib/usePageTitle';

export const Opportunities: React.FC = () => {
  usePageTitle('Opportunities');
  return (
    <ComingSoon
      icon={<Briefcase className="h-8 w-8" />}
      eyebrow="Coming soon"
      title="Opportunities"
      description="Internships, live industry projects, fellowships and funding from CII's partner network will be listed here."
    />
  );
};
