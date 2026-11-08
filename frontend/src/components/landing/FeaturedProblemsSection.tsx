import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, CalendarClock, Sparkles } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { htmlToPlainText } from '../../lib/html';
import { ProblemStatement } from '../../types';

const MAX_FEATURED = 6;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Time left to submit a solution, in words ("12 days left", "Less than a day left"). */
function deadlineLabel(deadline: string | undefined, now: number): { text: string; urgent: boolean } {
  if (!deadline) return { text: 'Open for solutions', urgent: false };
  const msLeft = new Date(deadline).getTime() - now;
  if (msLeft < DAY_MS) return { text: 'Less than a day left', urgent: true };
  // Round up: 2 days and 5 hours left reads "3 days left"
  const days = Math.ceil(msLeft / DAY_MS);
  if (days <= 60) return { text: `${days} days left`, urgent: days <= 7 };
  return {
    text: `Open till ${new Date(deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    urgent: false,
  };
}

/**
 * Problem statements CII has approved and that are still open, closing soonest first,
 * so visitors see what they can work on right now.
 */
export const FeaturedProblemsSection: React.FC = () => {
  const { submissions, submissionsLoading } = useApp();
  // Re-checked whenever the problems change (fine-grained enough for "days left")
  const now = useMemo(() => Date.now(), [submissions]);

  const featured = useMemo(() => {
    const isOpen = (p: ProblemStatement) =>
      p.status === 'Approved' && (!p.additional.deadline || new Date(p.additional.deadline).getTime() > now);
    const closesAt = (p: ProblemStatement) =>
      p.additional.deadline ? new Date(p.additional.deadline).getTime() : Number.MAX_SAFE_INTEGER;
    return submissions.filter(isOpen).sort((a, b) => closesAt(a) - closesAt(b)).slice(0, MAX_FEATURED);
  }, [submissions, now]);

  return (
    <section id="featured-problems" className="py-16 sm:py-24 bg-white border-y border-[#e8e4dc] scroll-mt-20">
      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 lg:px-12">
        {/* Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c48825]/10 text-[#9a6a1b] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> Open now · Verified by CII
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#063028] tracking-tight leading-tight font-serif">
              Featured Problem Statements
            </h2>
            <p className="text-stone-700 text-base sm:text-lg leading-relaxed">
              Real challenges from industry, approved by CII and waiting for solutions. Partner institutions can pick one
              and submit their team&apos;s solution.
            </p>
          </div>
          <Link
            to="/problem-statements"
            className="inline-flex items-center gap-2 self-start md:self-auto px-5 py-3 rounded-xl text-sm font-bold text-[#063028] bg-white border border-stone-300 hover:bg-stone-50 transition-colors whitespace-nowrap"
          >
            View all problem statements <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {submissionsLoading ? (
          // Placeholder cards while the problems load
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="status" aria-label="Loading problem statements">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-64 rounded-2xl border border-stone-200 bg-[#faf8f4] animate-pulse" />
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
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((problem) => {
              const deadline = deadlineLabel(problem.additional.deadline, now);
              const sector = problem.company.industrySector || problem.company.industryName;
              const skills = problem.technical.requiredTechnologies?.length
                ? problem.technical.requiredTechnologies
                : problem.technical.requiredSkills ?? [];
              return (
                <li key={problem.id}>
                  <Link
                    to={`/details/${problem.id}`}
                    state={{ from: '/' }}
                    className="group h-full flex flex-col bg-[#faf8f4] border border-stone-200 rounded-2xl p-6 hover:border-[#063028]/40 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between gap-3 mb-4">
                      {sector ? (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#063028] bg-[#edf4f0] px-2.5 py-1 rounded-md truncate">
                          {sector}
                        </span>
                      ) : (
                        <span />
                      )}
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold whitespace-nowrap ${
                          deadline.urgent ? 'text-red-700' : 'text-[#9a6a1b]'
                        }`}
                      >
                        <CalendarClock className="h-3.5 w-3.5" /> {deadline.text}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#063028] leading-snug group-hover:text-[#c48825] transition-colors line-clamp-2">
                      {problem.details.title}
                    </h3>
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-stone-600">
                      <Building2 className="h-4 w-4 text-stone-400 shrink-0" />
                      <span className="truncate">{problem.company.companyName || 'Industry partner'}</span>
                    </p>
                    <p className="mt-3 text-sm text-stone-600 leading-relaxed line-clamp-3">
                      {/* The one-line problem statement reads best on a card; fall back to the description */}
                      {htmlToPlainText(problem.details.businessChallenge || problem.details.description)}
                    </p>

                    {skills.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {skills.slice(0, 3).map((skill) => (
                          <span key={skill} className="text-xs font-medium text-stone-700 bg-white border border-stone-200 px-2 py-0.5 rounded-md">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    <span className="mt-auto pt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#c48825]">
                      View &amp; solve <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};
