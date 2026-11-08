import React from 'react';
import { CalendarDays, ExternalLink, MapPin, Sparkles, Users } from 'lucide-react';
import { CiisicEvent, EVENTS, SAMPLE_EVENT, isEventOver } from '../data/events';
import { EventTimeline } from '../components/events/EventTimeline';
import { PageCTA } from '../components/common/PageCTA';
import { usePageTitle } from '../lib/usePageTitle';

const EventCard: React.FC<{ event: CiisicEvent; sample?: boolean }> = ({ event, sample = false }) => (
  <article className="bg-white border border-stone-200 rounded-3xl shadow-xs overflow-hidden">
    <div className="p-6 sm:p-8 border-b border-stone-100 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#063028] bg-[#edf4f0] px-2.5 py-1 rounded-md">
          {event.type}
        </span>
        {sample && (
          <span className="text-xs font-bold uppercase tracking-wider text-[#9a6a1b] bg-[#c48825]/10 px-2.5 py-1 rounded-md">
            Sample timeline
          </span>
        )}
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-[#063028] font-serif">{event.title}</h2>
      <p className="text-stone-700 leading-relaxed">{event.summary}</p>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="flex items-start gap-2 text-stone-700">
          <MapPin className="h-4 w-4 mt-0.5 text-[#c48825] shrink-0" />
          <div>
            <dt className="sr-only">Where</dt>
            <dd>{event.location}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2 text-stone-700">
          <Users className="h-4 w-4 mt-0.5 text-[#c48825] shrink-0" />
          <div>
            <dt className="sr-only">Who can take part</dt>
            <dd>{event.eligibility}</dd>
          </div>
        </div>
      </dl>
      {event.registrationUrl && !sample && (
        <a
          href={event.registrationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-[#063028] hover:bg-[#04201a] transition-colors"
        >
          Register <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
    <div className="p-6 sm:p-8 bg-[#faf8f4]">
      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-5">Timeline</h3>
      <EventTimeline stages={event.stages} sample={sample} />
    </div>
  </article>
);

export const Events: React.FC = () => {
  usePageTitle('Events');
  const upcoming = EVENTS.filter((event) => !isEventOver(event));
  const past = EVENTS.filter((event) => isEventOver(event));

  return (
    <div className="bg-[#faf8f4]">
      <div className="max-w-4xl mx-auto px-6 py-16 sm:py-20 space-y-12">
        {/* Header */}
        <header className="text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edf4f0] text-[#063028] text-xs font-bold uppercase tracking-wider">
            <CalendarDays className="h-3.5 w-3.5" /> Events
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#063028] tracking-tight font-serif">
            Hackathons, workshops &amp; industry meets
          </h1>
          <p className="text-stone-700 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Every event comes with a clear timeline, so students, faculty and industry partners know exactly what
            happens when: from registration to the grand finale.
          </p>
        </header>

        {upcoming.length > 0 ? (
          <section aria-label="Upcoming events" className="space-y-8">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </section>
        ) : (
          <>
            <div className="rounded-2xl border border-[#c48825]/30 bg-[#c48825]/5 p-6 text-center space-y-2">
              <p className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-[#9a6a1b]">
                <Sparkles className="h-4 w-4" /> Coming soon
              </p>
              <p className="text-stone-700">
                The first events will be announced here soon. Below is an example of how each event&apos;s timeline
                will look.
              </p>
            </div>
            <EventCard event={SAMPLE_EVENT} sample />
          </>
        )}

        {past.length > 0 && (
          <section aria-label="Past events" className="space-y-6">
            <h2 className="text-2xl font-bold text-[#063028] font-serif">Past events</h2>
            {past.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </section>
        )}
      </div>
      <PageCTA />
    </div>
  );
};
