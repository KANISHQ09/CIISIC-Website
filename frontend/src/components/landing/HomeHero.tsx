import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { CellCardsSection } from './CellCardsSection';
import { timeLeft } from '../../lib/problemDisplay';
import { stripHTML } from '../../lib/html';
import { ProblemStatement } from '../../types';

const DECK_SIZE = 5;
const ROTATE_MS = 3800;
const SWIPE_MS = 560;
const WORD_MS = 2400;
const HEADLINE_WORDS = ['Solve it.', 'Build it.', 'Launch it.'];
const MAX_SKILLS = 3;

/** Where a card sits in the deck: 0 is on top, 1 and 2 peek out behind it, the rest wait unseen. */
function cardPlacement(position: number, leaving: boolean, dealt: boolean, lifted: boolean) {
  if (leaving) return { transform: 'translate(-118%, -6%) rotate(-14deg)', opacity: 0, zIndex: 40, tint: 'transparent', tintOpacity: 0 };
  if (!dealt) return { transform: 'translateY(48px) scale(0.92)', opacity: 0, zIndex: 30 - position, tint: 'transparent', tintOpacity: 0 };
  if (position === 0) return { transform: `translateY(${lifted ? -6 : 0}px)`, opacity: 1, zIndex: 30, tint: 'transparent', tintOpacity: 0 };
  if (position === 1) return { transform: 'translate(14px, 14px) rotate(3.2deg) scale(0.97)', opacity: 1, zIndex: 20, tint: '#c48825', tintOpacity: 0.84 };
  if (position === 2) return { transform: 'translate(-13px, 10px) rotate(-2.8deg) scale(0.95)', opacity: 1, zIndex: 10, tint: '#dbe7e1', tintOpacity: 0.9 };
  return { transform: 'translateY(16px) scale(0.9)', opacity: 0, zIndex: 0, tint: '#dbe7e1', tintOpacity: 0.9 };
}

const LiveChallengeCard: React.FC<{ problem: ProblemStatement; now: number; showTimer: boolean }> = ({
  problem,
  now,
  showTimer,
}) => {
  const left = timeLeft(problem.additional.deadline, now);
  const skills = problem.technical.requiredTechnologies.length
    ? problem.technical.requiredTechnologies
    : problem.technical.requiredSkills;
  return (
    <Link
      to={`/details/${problem.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 sm:p-7 text-left shadow-xl shadow-[#063028]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e0a63f]"
    >
      {/* Shows how long until the next card */}
      {showTimer && (
        <span
          className="hero-progress absolute inset-x-0 top-0 h-1 bg-[#e0a63f]"
          style={{ '--hero-timer': `${ROTATE_MS}ms` } as React.CSSProperties}
          aria-hidden="true"
        />
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            <span className="hero-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          Live challenge
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            left.urgent ? 'bg-red-50 text-red-700' : 'bg-[#edf4f0] text-[#063028]'
          }`}
        >
          {left.figure} {left.unit}
        </span>
      </div>

      <p className="mt-5 truncate text-xs font-bold uppercase tracking-wider text-[#9a6a1b]">
        {problem.company.industrySector}
      </p>
      <h2 className="mt-1.5 line-clamp-2 font-serif text-2xl min-[106rem]:text-3xl font-bold leading-snug text-[#063028]">
        {problem.details.title}
      </h2>
      <p className="mt-2 line-clamp-2 text-sm min-[106rem]:text-base leading-relaxed text-stone-600">
        {stripHTML(problem.details.businessChallenge || problem.details.description)}
      </p>

      {skills.length > 0 && (
        <ul className="mt-4 flex h-7 flex-wrap gap-1.5 overflow-hidden">
          {skills.slice(0, MAX_SKILLS).map((skill) => (
            <li key={skill} className="max-w-[140px] truncate rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
              {skill}
            </li>
          ))}
          {skills.length > MAX_SKILLS && (
            <li className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-500">
              +{skills.length - MAX_SKILLS}
            </li>
          )}
        </ul>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
        <span className="min-w-0 truncate text-sm font-bold text-stone-800">{problem.company.companyName}</span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#063028] px-4 py-2 text-xs font-bold text-white transition-colors group-hover:bg-[#04201a]">
          View challenge
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
};

/** The first screen of the home page: a clear, energetic invitation for students and visitors. */
export const HomeHero: React.FC = () => {
  const { submissions } = useApp();
  const now = useMemo(() => Date.now(), [submissions]);
  const deck = useMemo(() => {
    const added = (p: ProblemStatement) => new Date(p.submittedDate).getTime() || 0;
    return submissions
      .filter((p) => p.status === 'Approved' && (!p.additional.deadline || new Date(p.additional.deadline).getTime() > now))
      .sort((a, b) => added(b) - added(a))
      .slice(0, DECK_SIZE);
  }, [submissions, now]);

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [dealt, setDealt] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const leaveTimer = useRef<number | undefined>(undefined);
  const touchStartX = useRef<number | null>(null);
  const reducedMotion = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const current = deck.length ? active % deck.length : 0;
  const hasCards = deck.length > 0;

  /** The top card swipes away and the chosen one comes forward. */
  const goTo = useCallback(
    (next: number) => {
      if (next === current) return;
      window.clearTimeout(leaveTimer.current);
      if (!reducedMotion) {
        setLeaving(current);
        leaveTimer.current = window.setTimeout(() => setLeaving(null), SWIPE_MS);
      }
      setActive(next);
    },
    [current, reducedMotion]
  );

  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  // Deal the cards in once the problems have loaded
  useEffect(() => {
    if (!hasCards) return;
    const timer = window.setTimeout(() => setDealt(true), 80);
    return () => window.clearTimeout(timer);
  }, [hasCards]);

  useEffect(() => {
    if (paused || reducedMotion || deck.length < 2) return;
    const timer = window.setTimeout(() => {
      goTo((current + 1) % deck.length);
    }, ROTATE_MS);
    return () => window.clearTimeout(timer);
  }, [paused, reducedMotion, deck.length, current, goTo]);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => setWordIndex((i) => (i + 1) % HEADLINE_WORDS.length), WORD_MS);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const riseDelay = (ms: number) => ({ '--hero-delay': `${ms}ms` } as React.CSSProperties);
  const controlClass =
    'flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-stone-300 bg-white text-[#063028] transition-colors hover:border-[#063028] hover:bg-[#edf4f0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c48825]';

  return (
    <section id="hero" className="relative isolate flex min-h-[calc(100svh-65px)] flex-col overflow-hidden bg-[#faf8f4] text-[#063028]">
      <div className="mx-auto grid w-full max-w-[1320px] min-[106rem]:max-w-[1600px] flex-1 grid-cols-1 items-center gap-10 px-6 py-12 sm:px-8 sm:py-14 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:py-7">
        <div className="lg:col-span-7">
          <p className="hero-rise flex items-center gap-3 text-xs sm:text-sm font-bold uppercase tracking-[0.16em] text-[#9a6a1b]">
            <span className="hidden h-px w-8 bg-[#c48825] sm:block" aria-hidden="true" />
            CII Student Innovation Challenge
          </p>
          <h1
            className="hero-rise mt-4 font-serif text-[clamp(2rem,10.6vw,3.75rem)] font-bold leading-[1.08] tracking-tight !text-[#063028] sm:text-6xl xl:text-7xl min-[106rem]:text-[6.25rem]"
            style={riseDelay(90)}
          >
            Don&apos;t just study it.
            <span className="sr-only"> Solve it.</span>
            <span className="relative mt-1 block h-[1.22em] [perspective:600px]" aria-hidden="true">
              <span key={wordIndex} className="hero-word relative inline-block text-[#b47a1c]">
                {HEADLINE_WORDS[wordIndex]}
                <svg
                  className="hero-underline absolute -bottom-[0.1em] left-0 h-[0.16em] w-full"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  <path d="M2 8 C 45 2, 120 2, 198 7" pathLength={1} stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              </span>
            </span>
          </h1>
          <p className="hero-rise mt-5 max-w-xl text-base leading-relaxed text-stone-700 sm:text-lg min-[106rem]:max-w-2xl min-[106rem]:text-xl" style={riseDelay(180)}>
            Take on real challenges from Indian industry, build solutions with your team and faculty
            mentor, and put your work in front of the companies that need it.
          </p>

          <div className="hero-rise mt-7 flex flex-col gap-3 sm:flex-row" style={riseDelay(270)}>
            <Link
              to="/problem-statements"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#063028] px-6 py-3.5 text-base font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#04201a] hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c48825] focus-visible:ring-offset-2"
            >
              Explore Problem Statements
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-6 py-3.5 text-base font-bold text-[#063028] transition-all hover:-translate-y-0.5 hover:border-[#063028] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c48825] focus-visible:ring-offset-2"
            >
              See How It Works
            </Link>
          </div>

          <p className="hero-rise mt-4 text-sm text-stone-600" style={riseDelay(360)}>
            Students take part through their institution.{' '}
            <Link to="/institutions" className="font-bold text-[#9a6a1b] hover:underline">
              Find yours
            </Link>
          </p>
        </div>

        {/* A deck of real, CII-approved challenges */}
        <div
          className="hero-rise lg:col-span-5"
          style={riseDelay(200)}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={(e) => {
            // A mouse click on a dot should not stop the deck; a keyboard user on it should
            if ((e.target as HTMLElement).matches(':focus-visible')) setPaused(true);
          }}
          onBlur={() => setPaused(false)}
        >
          <div
            className="relative mx-auto h-[370px] w-full max-w-[480px] touch-pan-y min-[106rem]:h-[430px] min-[106rem]:max-w-[580px]"
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null || deck.length < 2) return;
              const moved = e.changedTouches[0].clientX - touchStartX.current;
              touchStartX.current = null;
              if (moved < -40) goTo((current + 1) % deck.length);
              if (moved > 40) goTo((current - 1 + deck.length) % deck.length);
            }}
          >
            {deck.length < 2 && (
              <>
                <div className="absolute inset-0 translate-x-3 translate-y-3 rotate-3 rounded-3xl bg-[#c48825]/40" aria-hidden="true" />
                <div className="absolute inset-0 -translate-x-2 translate-y-1.5 -rotate-2 rounded-3xl bg-[#dbe7e1]" aria-hidden="true" />
              </>
            )}
            {hasCards ? (
              deck.map((problem, i) => {
                const position = (i - current + deck.length) % deck.length;
                const place = cardPlacement(position, leaving === i, dealt || reducedMotion, paused);
                const motion = reducedMotion ? 'none' : `${SWIPE_MS}ms cubic-bezier(0.22, 0.8, 0.24, 1)`;
                return (
                  <div
                    key={problem.id}
                    className="absolute inset-0"
                    inert={position !== 0}
                    aria-hidden={position !== 0}
                    style={{
                      transform: place.transform,
                      opacity: place.opacity,
                      zIndex: place.zIndex,
                      transition: reducedMotion ? 'none' : `transform ${motion}, opacity 180ms ease-out`,
                      transitionDelay: dealt ? '0ms' : `${(2 - Math.min(position, 2)) * 90}ms`,
                    }}
                  >
                    <LiveChallengeCard
                      key={position === 0 ? `top-${current}` : 'behind'}
                      problem={problem}
                      now={now}
                      showTimer={position === 0 && !paused && !reducedMotion && deck.length > 1}
                    />
                    {/* Cards behind the top one take a colour, and clear as they come forward */}
                    <div
                      className="pointer-events-none absolute inset-0 rounded-3xl"
                      style={{
                        backgroundColor: place.tint,
                        opacity: place.tintOpacity,
                        transition: reducedMotion ? 'none' : 'opacity 160ms ease-out',
                      }}
                      aria-hidden="true"
                    />
                  </div>
                );
              })
            ) : (
              <div className="absolute inset-0">
                <Link
                  to="/how-it-works"
                  className="flex h-full flex-col justify-center rounded-3xl border border-stone-200 bg-white p-7 text-left shadow-xl shadow-[#063028]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e0a63f]"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-[#9a6a1b]">New challenges on the way</span>
                  <span className="mt-3 font-serif text-2xl font-bold leading-snug text-[#063028]">
                    Your team could solve the next one.
                  </span>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#063028]">
                    See how it works <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              </div>
            )}
          </div>

          {deck.length > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => goTo((current - 1 + deck.length) % deck.length)}
                aria-label="Previous challenge"
                className={controlClass}
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="flex items-center">
                {deck.map((problem, i) => (
                  <button
                    key={problem.id}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Show challenge ${i + 1} of ${deck.length}`}
                    aria-current={i === current}
                    className="flex h-6 w-8 cursor-pointer items-center justify-center"
                  >
                    <span className={`h-1.5 rounded-full transition-all ${i === current ? 'w-7 bg-[#c48825]' : 'w-3 bg-stone-300'}`} />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => goTo((current + 1) % deck.length)}
                aria-label="Next challenge"
                className={controlClass}
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>

      <CellCardsSection />
    </section>
  );
};
