import React from 'react';
import { CalendarDays } from 'lucide-react';
import { ComingSoon } from '../components/common/ComingSoon';
import { usePageTitle } from '../lib/usePageTitle';

export const Events: React.FC = () => {
  usePageTitle('Events');
  return (
    <ComingSoon
      icon={<CalendarDays className="h-8 w-8" />}
      eyebrow="Coming soon"
      title="Events"
      description="Hackathons, workshops and industry meets will be announced here, each with a clear timeline of what happens when: from registration to the grand finale."
    />
  );
};
