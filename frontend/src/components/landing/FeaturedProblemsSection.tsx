import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { timeLeft } from '../../lib/problemDisplay';
import { useApp } from '../../contexts/AppContext';
import { ProblemStatement } from '../../types';

// CII portal review (16 Nov 2026): up to 10 recent problem statements, in a slider
const MAX_FEATURED = 10;

/**
 * The most recent problem statements CII has approved that are still open, in a sideways
 * slider (in the style of MakeMyTrip's offer cards): arrows, swipe, or trackpad to move.
 */
export const FeaturedProblemsSection: React.FC = () => {
  const { submissions, submissionsLoading } = useApp();
  // Re-checked whenever the problems change (fine-grained enough for "days left")
  const now = useMemo(() => Date.now(), [submissions]);

  const featured = useMemo(() => {
    const isOpen = (p: ProblemStatement) =>
      p.status === 'Approved' && (!p.additional.deadline || new Date(p.additional.deadline).getTime() > now);
    const added = (p: ProblemStatement) => new Date(p.submittedDate).getTime() || 0;
    return submissions.filter(isOpen).sort((a, b) => added(b) - added(a)).slice(0, MAX_FEATURED);
  }, [submissions, now]);

  // ── Slider: which arrows can be used
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const updateEnds = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateEnds();
    el.addEventListener('scroll', updateEnds, { passive: true });
    const observer = new ResizeObserver(updateEnds);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', updateEnds);
      observer.disconnect();
    };
  }, [featured.length, submissionsLoading, updateEnds]);

  /** Moves the slider by about one screenful of cards. */
  const slide = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('li');
    const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8;
    const perView = Math.max(1, Math.floor(el.clientWidth / step));
    el.scrollBy({ left: direction * step * perView, behavior: 'smooth' });
  };

  const arrowClass =
    'h-11 w-11 rounded-full border border-stone-300 bg-white text-[#063028] flex items-center justify-center shadow-xs transition-all hover:border-[#063028] hover:bg-[#edf4f0] disabled:opacity-35 disabled:hover:bg-white disabled:hover:border-stone-300 cursor-pointer disabled:cursor-default';

  return (
    <section id="featured-problems" className="py-16 sm:py-24 bg-white border-y border-[#e8e4dc] scroll-mt-20">
      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 lg:px-12">
        {/* Heading, with the slider arrows on the right */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-[#c48825]">Open now · Approved by CII</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#063028] tracking-tight leading-tight font-serif">
              Featured Problem Statements
            </h2>
            <p className="text-stone-700 text-base sm:text-lg leading-relaxed">
              The latest real challenges from industry, approved by CII and waiting for solutions. Partner institutions
              can pick one and submit their team&apos;s solution.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <Link
              to="/problem-statements"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-[#063028] bg-white border border-stone-300 hover:bg-stone-50 transition-colors whitespace-nowrap"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
            {featured.length > 1 && (
              <div className="hidden sm:flex items-center gap-2">
                <button type="button" aria-label="Previous problem statements" disabled={atStart} onClick={() => slide(-1)} className={arrowClass}>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button type="button" aria-label="More problem statements" disabled={atEnd} onClick={() => slide(1)} className={arrowClass}>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {submissionsLoading ? (
          // Placeholder cards while the problems load
          <div className="flex gap-5 overflow-hidden" role="status" aria-label="Loading problem statements">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-60 w-[78%] sm:w-[300px] shrink-0 rounded-2xl border border-stone-200 bg-[#faf8f4] animate-pulse" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-[#faf8f4] p-10 text-center space-y-3">
            <h3 className="text-lg font-bold text-[#063028]">New problem statements are coming soon</h3>
            <p className="text-sm text-stone-600 max-w-xl mx-auto">
              CII is reviewing the latest industry challenges. Is your organisation facing one? Submit it, no login
              needed.
            </p>
            <Link
              to="/submit-problem"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-[#063028] hover:bg-[#04201a] transition-colors"
            >
              Submit a Problem <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="relative">
            <ul
              ref={trackRef}
              aria-label="Featured problem statements"
              className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 -mb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {featured.map((problem, index) => {
                const left = timeLeft(problem.additional.deadline, now);
                const sector = problem.company.industrySector || problem.company.industryName || 'Industry challenge';
                const place = [problem.company.companyName || 'Industry partner', problem.company.city]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <li
                    key={problem.id}
                    className="snap-start shrink-0 w-[78%] sm:w-[300px]"
                    aria-label={`${index + 1} of ${featured.length}`}
                  >
                    <Link
                      to={`/details/${problem.id}`}
                      state={{ from: '/' }}
                      className="group h-full flex flex-col bg-white border border-stone-200 rounded-2xl overflow-hidden hover:border-[#063028]/40 hover:shadow-md transition-all"
                    >
                      {/* Image area (where a hotel card shows its photo): the problem's cover image when it
                          has one, otherwise a plain placeholder. Badge in the corner, like a hotel's rating. */}
                      <div className="relative h-36 bg-stone-100 overflow-hidden">
                        {problem.additional.coverImageUrl && (
                          <img
                            src={problem.additional.coverImageUrl}
                            alt=""
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        )}
                        <span className="absolute left-3 top-3 text-[11px] font-bold uppercase tracking-wider text-stone-700 bg-white/90 px-2 py-0.5 rounded-md truncate max-w-[75%]">
                          {sector}
                        </span>
                        <span className="absolute right-3 bottom-3 text-xs font-bold bg-white text-[#063028] px-2 py-0.5 rounded-md shadow-sm">
                          Open
                        </span>
                      </div>

                      {/* Name on the left, time left on the right (where a hotel card shows its price) */}
                      <div className="flex-1 flex items-start justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-stone-900 leading-snug line-clamp-2 min-h-[2.75rem] group-hover:text-[#063028]">
                            {problem.details.title}
                          </h3>
                          <p className="mt-1 text-sm text-stone-500 truncate">{place}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`text-lg font-extrabold leading-tight ${left.urgent ? 'text-red-700' : 'text-stone-900'}`}>
                            {left.figure}
                          </p>
                          <p className="text-xs text-stone-500 whitespace-nowrap">{left.unit}</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {/* Soft fade on the right while more cards follow */}
            {!atEnd && (
              <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
            )}
          </div>
        )}
      </div>
    </section>
  );
};
