import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, CalendarDays } from 'lucide-react';
import { EVENTS, isEventOver, stageState } from '../../data/events';
import { OPPORTUNITIES } from '../../data/opportunities';

/** Home page preview of the Events and Opportunities pages. */
export const ComingUpSection: React.FC = () => {
  const nextEvent = EVENTS.find((event) => !isEventOver(event));
  const nextStage = nextEvent?.stages.find((stage) => stageState(stage) !== 'done');
  const today = new Date().toISOString().slice(0, 10);
  const openOpportunities = OPPORTUNITIES.filter((o) => !o.deadline || o.deadline >= today).length;

  const cards = [
    {
      to: '/events',
      icon: CalendarDays,
      eyebrow: nextEvent ? nextEvent.type : 'Coming soon',
      title: nextEvent ? nextEvent.title : 'Events & hackathons',
      text: nextEvent
        ? `Next: ${nextStage?.title ?? 'see the timeline'}. Every stage, from registration to the finale, is on the timeline.`
        : 'Hackathons, workshops and industry meets, each with a clear timeline of what happens when.',
      link: nextEvent ? 'See the timeline' : 'Preview a sample timeline',
    },
    {
      to: '/opportunities',
      icon: Briefcase,
      eyebrow: openOpportunities ? `${openOpportunities} open now` : 'Coming soon',
      title: 'Opportunities',
      text: 'Internships, live industry projects, fellowships and funding from CII’s partner network.',
      link: openOpportunities ? 'See opportunities' : 'See what’s coming',
    },
  ];

  return (
    <section id="coming-up" className="py-16 sm:py-20 bg-[#faf8f4] scroll-mt-20">
      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 lg:px-12">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#063028] tracking-tight font-serif mb-8">
          What&apos;s coming up
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.to}
                to={card.to}
                className="group flex gap-5 bg-white border border-stone-200 rounded-2xl p-6 sm:p-7 hover:border-[#063028]/40 hover:shadow-md transition-all"
              >
                <div className="h-12 w-12 rounded-2xl bg-[#edf4f0] text-[#063028] flex items-center justify-center shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#9a6a1b]">{card.eyebrow}</span>
                  <h3 className="text-xl font-bold text-[#063028] font-serif">{card.title}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed">{card.text}</p>
                  <span className="inline-flex items-center gap-1.5 pt-1 text-sm font-bold text-[#c48825]">
                    {card.link} <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
