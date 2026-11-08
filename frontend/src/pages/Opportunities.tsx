import React from 'react';
import { Award, Briefcase, CalendarClock, ExternalLink, FlaskConical, GraduationCap, MapPin, Rocket, Sparkles } from 'lucide-react';
import { OPPORTUNITIES, OPPORTUNITY_CATEGORIES, OpportunityCategoryId } from '../data/opportunities';
import { PageCTA } from '../components/common/PageCTA';
import { usePageTitle } from '../lib/usePageTitle';

const CATEGORY_ICONS: Record<OpportunityCategoryId, React.ElementType> = {
  internships: GraduationCap,
  projects: FlaskConical,
  fellowships: Award,
  funding: Rocket,
};

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const Opportunities: React.FC = () => {
  usePageTitle('Opportunities');
  // Hide opportunities once their last day to apply has passed
  const today = new Date().toISOString().slice(0, 10);
  const open = OPPORTUNITIES.filter((o) => !o.deadline || o.deadline >= today);

  return (
    <div className="bg-[#faf8f4]">
      <div className="max-w-6xl mx-auto px-6 py-16 sm:py-20 space-y-12">
        {/* Header */}
        <header className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edf4f0] text-[#063028] text-xs font-bold uppercase tracking-wider">
            <Briefcase className="h-3.5 w-3.5" /> Opportunities
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#063028] tracking-tight font-serif">
            Opportunities from CII&apos;s industry network
          </h1>
          <p className="text-stone-700 text-base sm:text-lg leading-relaxed">
            Internships, live projects, fellowships and funding for students and faculty of partner institutions.
          </p>
        </header>

        {open.length === 0 && (
          <div className="rounded-2xl border border-[#c48825]/30 bg-[#c48825]/5 p-6 text-center space-y-2 max-w-3xl mx-auto">
            <p className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-[#9a6a1b]">
              <Sparkles className="h-4 w-4" /> Coming soon
            </p>
            <p className="text-stone-700">
              Opportunities will be listed here as partners announce them. Here&apos;s what to look out for.
            </p>
          </div>
        )}

        {/* Categories, with what's open in each */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {OPPORTUNITY_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.id];
            const items = open.filter((o) => o.category === category.id);
            return (
              <section key={category.id} className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-[#edf4f0] text-[#063028] flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      items.length ? 'bg-[#063028] text-white' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {items.length ? `${items.length} open` : 'Coming soon'}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-bold text-[#063028] font-serif">{category.title}</h2>
                  <p className="text-sm text-stone-600 leading-relaxed">{category.description}</p>
                </div>

                {items.length > 0 && (
                  <ul className="space-y-3 pt-2">
                    {items.map((item) => (
                      <li key={item.id} className="rounded-2xl border border-stone-200 bg-[#faf8f4] p-4 space-y-2">
                        <h3 className="font-bold text-[#063028]">{item.title}</h3>
                        <p className="text-sm text-stone-600">{item.summary}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-stone-600">
                          <span>{item.organisation}</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-[#c48825]" /> {item.location}
                          </span>
                          {item.deadline && (
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock className="h-3.5 w-3.5 text-[#c48825]" /> Apply by {formatDate(item.deadline)}
                            </span>
                          )}
                        </div>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#c48825] hover:text-[#9a6a1b]"
                          >
                            Details &amp; apply <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>
      <PageCTA />
    </div>
  );
};
