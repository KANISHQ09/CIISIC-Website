import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ListChecks } from 'lucide-react';
import { ProblemStatement } from '../../types';
import { htmlToPlainText } from '../../lib/html';
import { shortDate, timeLeft } from '../../lib/problemDisplay';

/**
 * One problem statement as a wide row, laid out like a MakeMyTrip flight result:
 * who and what on the left, posted → apply-by timeline in the middle, time left and the
 * button on the right, then a summary line, skill chips and a "More details" toggle.
 */
export const ProblemRowCard: React.FC<{
  problem: ProblemStatement;
  /** Funding text when the problem states one */
  funding?: string;
  now: number;
}> = ({ problem, funding, now }) => {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const sector = problem.company.industrySector || problem.company.industryName || 'Industry challenge';
  const left = timeLeft(problem.additional.deadline, now);
  const place = [problem.company.companyName || 'Industry partner', problem.company.city].filter(Boolean).join(' · ');
  const skills = problem.technical.requiredTechnologies?.length
    ? problem.technical.requiredTechnologies
    : problem.technical.requiredSkills ?? [];
  const summary = htmlToPlainText(problem.details.businessChallenge || problem.details.description);
  const description = htmlToPlainText(problem.details.description);
  const detailsLink = { pathname: `/details/${problem.id}` };

  return (
    <article className="bg-white rounded-2xl border border-stone-200 shadow-xs hover:shadow-md hover:border-stone-300 transition-all">
      <div className="flex flex-col lg:flex-row">
        {/* Main part */}
        <div className="flex-1 min-w-0 p-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-5 md:gap-8 items-start">
            {/* Who and what (like the airline) */}
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-stone-900 leading-snug line-clamp-2">
                <Link to={detailsLink} state={{ from: '/problem-statements' }} className="hover:text-[#063028]">
                  {problem.details.title}
                </Link>
              </h3>
              <p className="mt-0.5 text-sm text-stone-500 truncate">
                {sector} | {place}
              </p>
            </div>

            {/* Timeline: posted → apply by (like departure → arrival) */}
            <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3 text-center">
              <div>
                <p className="text-base font-bold text-stone-900 whitespace-nowrap">{shortDate(problem.submittedDate)}</p>
                <p className="text-xs text-stone-500">Posted</p>
              </div>
              <div className="pt-0.5 min-w-0">
                <p className="text-sm font-semibold text-stone-600 truncate">{problem.technical.expectedDuration || 'Duration open'}</p>
                <div className="my-1 border-t-2 border-dashed border-stone-300" aria-hidden="true" />
                <p className="text-xs text-stone-500 truncate">
                  {problem.technical.difficultyLevel ? `${problem.technical.difficultyLevel} level` : 'Any level'}
                </p>
              </div>
              <div>
                <p className="text-base font-bold text-stone-900 whitespace-nowrap">
                  {problem.additional.deadline ? shortDate(problem.additional.deadline) : 'Open'}
                </p>
                <p className="text-xs text-stone-500">Apply by</p>
              </div>
            </div>
          </div>

          {/* Summary line (like the meal and seat line) */}
          <p className="mt-4 text-sm font-semibold text-stone-800 line-clamp-1">{summary}</p>

          {/* Skill chips (like "Change of Terminals") */}
          {skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.slice(0, 4).map((skill) => (
                <span key={skill} className="text-xs font-medium text-stone-700 bg-stone-100 px-2.5 py-1 rounded-md">
                  {skill}
                </span>
              ))}
              {skills.length > 4 && <span className="text-xs font-semibold text-stone-500 self-center">+{skills.length - 4} more</span>}
            </div>
          )}

          {/* More details */}
          <button
            type="button"
            aria-expanded={open}
            aria-controls={detailsId}
            onClick={() => setOpen((v) => !v)}
            className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#edf4f0] text-sm font-semibold text-[#063028] hover:bg-[#e2ece6] transition-colors cursor-pointer"
          >
            <ListChecks className="h-4 w-4" /> More details
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div id={detailsId} className="mt-4 rounded-xl bg-stone-50 border border-stone-200 p-4 space-y-3 text-sm">
              {description && <p className="text-stone-700 leading-relaxed line-clamp-4">{description}</p>}
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-stone-500">Preferred branches</dt>
                  <dd className="text-stone-800">{problem.technical.preferredBranches?.join(', ') || 'Any branch'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-stone-500">Target students</dt>
                  <dd className="text-stone-800">{problem.technical.preferredAcademicYear || 'Any year'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-stone-500">Deliverables</dt>
                  <dd className="text-stone-800 line-clamp-2">{problem.additional.expectedDeliverables || 'See full details'}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Right panel: time left and the button (like the fare and VIEW PRICES) */}
        <div className="lg:w-64 shrink-0 flex lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-3 px-5 sm:px-6 py-4 lg:py-6 border-t lg:border-t-0 lg:border-l border-stone-200 lg:my-6 lg:py-0">
          <div className="lg:text-right">
            <p className={`text-2xl font-extrabold leading-tight ${left.urgent ? 'text-red-700' : 'text-stone-900'}`}>
              {left.figure} <span className="text-sm font-semibold text-stone-500">{left.unit}</span>
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-700 truncate max-w-[14rem]" title={funding}>
              {funding ? `Funding: ${funding}` : 'Approved by CII'}
            </p>
          </div>
          <Link
            to={detailsLink}
            state={{ from: '/problem-statements' }}
            className="shrink-0 px-5 py-2.5 rounded-xl border-2 border-[#063028] text-sm font-bold uppercase tracking-wide text-[#063028] hover:bg-[#063028] hover:text-white transition-colors"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
};
