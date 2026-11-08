import React, { useEffect, useState } from 'react';
import { AlertCircle, Building2, ClipboardCheck, FileClock, Globe2, Inbox } from 'lucide-react';
import { AdminStats, fetchAdminStats } from '../../lib/api';

type CardTarget = 'challenges' | 'solutions' | 'registrations';

/**
 * Live, platform-wide numbers from the server, focused on what is waiting for CII.
 * Clicking a card opens the matching tab.
 */
export const AdminOverview: React.FC<{
  onOpen: (tab: CardTarget) => void;
  /** Change this value to reload (e.g. after an approval). */
  refreshKey?: number;
}> = ({ onOpen, refreshKey }) => {
  const [stats, setStats] = useState<AdminStats['summary'] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchAdminStats()
      .then((res) => {
        if (!cancelled) {
          setStats(res.summary);
          setError('');
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'Could not load the overview');
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const cards: Array<{
    label: string;
    value: number | undefined;
    hint: string;
    icon: React.ReactNode;
    target: CardTarget;
    urgent?: boolean;
  }> = [
    {
      label: 'Problems awaiting review',
      value: stats?.pendingProblems,
      hint: stats ? `${stats.publicPendingProblems} submitted without login` : '',
      icon: <FileClock className="h-5 w-5" />,
      target: 'challenges',
      urgent: !!stats?.pendingProblems,
    },
    {
      label: 'Registrations to approve',
      value: stats?.pendingRegistrations,
      hint: 'Industry and institution accounts',
      icon: <Inbox className="h-5 w-5" />,
      target: 'registrations',
      urgent: !!stats?.pendingRegistrations,
    },
    {
      label: 'Solutions in review',
      value: stats?.solutionsAwaitingReview,
      hint: stats ? `${stats.approvedProposals} approved so far` : '',
      icon: <ClipboardCheck className="h-5 w-5" />,
      target: 'solutions',
    },
    {
      label: 'Published problems',
      value: stats?.activeChallenges,
      hint: stats ? `${stats.totalChallenges} submitted in total` : '',
      icon: <Globe2 className="h-5 w-5" />,
      target: 'challenges',
    },
    {
      label: 'Partner network',
      value: stats ? stats.registeredIndustries + stats.totalInstitutions : undefined,
      hint: stats ? `${stats.registeredIndustries} industries · ${stats.totalInstitutions} institutions` : '',
      icon: <Building2 className="h-5 w-5" />,
      target: 'registrations',
    },
  ];

  return (
    <section aria-label="Platform overview" className="mb-8">
      {error && (
        <div className="mb-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" /> Overview unavailable: {error}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => onOpen(card.target)}
            className={`text-left rounded-2xl border p-4 transition-all cursor-pointer hover:shadow-sm ${
              card.urgent
                ? 'bg-amber-50 border-amber-300 hover:border-amber-400'
                : 'bg-white border-stone-200 hover:border-[#063028]/40'
            }`}
          >
            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${card.urgent ? 'text-amber-800' : 'text-stone-500'}`}>
              <span className={card.urgent ? 'text-amber-600' : 'text-[#063028]'}>{card.icon}</span>
              <span className="leading-tight">{card.label}</span>
            </div>
            <p className="mt-2 text-3xl font-extrabold font-serif text-[#063028]">
              {card.value === undefined ? <span className="inline-block h-8 w-10 rounded bg-stone-100 animate-pulse" /> : card.value}
            </p>
            {card.hint && <p className="mt-1 text-xs text-stone-500">{card.hint}</p>}
          </button>
        ))}
      </div>
    </section>
  );
};
