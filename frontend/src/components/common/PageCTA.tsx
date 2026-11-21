import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building, Factory, Search, type LucideIcon } from 'lucide-react';

/** One way to take part: who it is for, what it does, where it goes. */
const ACTIONS: { to: string; icon: LucideIcon; title: string; text: string; primary?: boolean }[] = [
  {
    to: '/submit-problem',
    icon: Factory,
    title: 'Submit a Problem',
    text: 'For industries. No login needed; CII approves it before it goes live.',
    primary: true,
  },
  {
    to: '/institution/login',
    icon: Building,
    title: 'Institution Portal',
    text: 'For partner institutions. Pick problems and submit your teams’ solutions.',
  },
  {
    to: '/problem-statements',
    icon: Search,
    title: 'Browse problems',
    text: 'For everyone. See the approved industry challenges open right now.',
  },
];

/** Closing call to action at the bottom of the information pages. */
export const PageCTA: React.FC = () => (
  <section className="bg-[#faf8f4] pb-16 sm:pb-24">
    <div className="max-w-[1320px] mx-auto px-6 sm:px-8 lg:px-12">
      <div className="bg-[#063028] text-white rounded-3xl p-8 sm:p-12 shadow-xl">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-bold text-[#e2b765] uppercase tracking-wider">Get involved</p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-serif leading-tight">
            Ready to solve the next industry challenge?
          </h2>
        </div>

        <ul className="mt-8 grid grid-cols-1 md:grid-cols-3 auto-rows-fr gap-4">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <li key={action.to}>
                <Link
                  to={action.to}
                  className={`group h-full flex flex-col rounded-2xl p-5 sm:p-6 transition-colors ${
                    action.primary
                      ? 'bg-[#c48825] text-[#04201a] hover:bg-[#d69a35]'
                      : 'bg-white/5 text-white border border-white/15 hover:bg-white/10 hover:border-white/30'
                  }`}
                >
                  <span
                    className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                      action.primary ? 'bg-[#04201a]/10' : 'bg-white/10'
                    }`}
                    aria-hidden="true"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-lg font-bold">{action.title}</span>
                    <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                  <span className={`mt-1.5 text-sm leading-relaxed ${action.primary ? 'text-[#04201a]/80' : 'text-stone-300'}`}>
                    {action.text}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  </section>
);
