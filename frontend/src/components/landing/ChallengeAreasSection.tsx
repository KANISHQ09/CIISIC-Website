import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Building2, Cpu, Factory, Laptop, Leaf, Megaphone, Package, PenLine, Settings,
  Stethoscope, Users, type LucideIcon,
} from 'lucide-react';

/** Circle tints from the CII flyer: peach, green, lavender and blue. */
const TINT = { peach: '#fbeee3', green: '#e9f2ea', lavender: '#e9eaf6', blue: '#e5f0f9' } as const;

const AREAS: { name: string; icon: LucideIcon; tint: string }[] = [
  { name: 'Marketing & Brand Strategy', icon: Megaphone, tint: TINT.peach },
  { name: 'People & Finance Solutions', icon: Users, tint: TINT.green },
  { name: 'Engineering Excellence', icon: Settings, tint: TINT.green },
  { name: 'Design Innovation', icon: PenLine, tint: TINT.peach },
  { name: 'Healthcare & Pharma', icon: Stethoscope, tint: TINT.green },
  { name: 'Artificial Intelligence', icon: Cpu, tint: TINT.lavender },
  { name: 'Agriculture & Sustainability', icon: Leaf, tint: TINT.green },
  { name: 'Manufacturing', icon: Factory, tint: TINT.blue },
  { name: 'Digital Transformation', icon: Laptop, tint: TINT.blue },
  { name: 'Supply Chain', icon: Package, tint: TINT.peach },
  { name: 'Business Operations', icon: BarChart3, tint: TINT.peach },
  { name: 'Smart Cities & Urban Innovation', icon: Building2, tint: TINT.green },
];

/**
 * The challenge areas CII welcomes, shown under the problem list, in the design of the CII flyer.
 * Each area opens Submit a Problem.
 */
export const ChallengeAreasSection: React.FC = () => (
  <section id="challenge-areas" aria-labelledby="challenge-areas-title" className="mb-16 scroll-mt-24">
    <div className="relative overflow-hidden rounded-3xl bg-[#f7f5f0] border border-stone-200/80 px-6 py-10 sm:px-10 sm:py-12">
      {/* CII building, faded into the background (from the CII flyer) */}
      <img
        src="/images/challenge-areas-building.jpg"
        alt=""
        aria-hidden="true"
        width={256}
        height={397}
        loading="lazy"
        className="hidden md:block absolute right-0 top-0 h-[230px] w-auto pointer-events-none select-none"
        style={{
          // Fades out towards the bottom-left so it blends into the background like on the flyer
          maskImage: 'linear-gradient(to bottom left, black 45%, transparent 88%)',
          WebkitMaskImage: 'linear-gradient(to bottom left, black 45%, transparent 88%)',
        }}
      />

      {/* Heading */}
      <div className="relative max-w-3xl">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-10">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-[#e7ece6] text-[#063028] text-xs font-semibold">
              Challenge Areas
            </span>
            <h2
              id="challenge-areas-title"
              className="mt-5 text-4xl sm:text-5xl font-serif font-medium text-[#063028] leading-[1.08] tracking-tight"
            >
              Every Industry Challenge Creates an <em className="font-serif italic text-[#c48825]">Opportunity</em>
            </h2>
          </div>
          <ul
            className="hidden sm:block shrink-0 border-l-2 border-[#c48825] pl-4 mt-14 space-y-1.5 text-[11px] font-medium tracking-[0.2em] uppercase text-stone-600"
            aria-label="What CIISIC brings together"
          >
            <li>Ideas</li>
            <li>People</li>
            <li>Industry</li>
            <li>Impact</li>
          </ul>
        </div>
        <p className="mt-7 flex items-center gap-4 text-xs font-medium tracking-[0.2em] uppercase text-stone-600">
          <span className="h-px w-14 bg-[#c48825]" aria-hidden="true" />
          Diverse sectors. Real impact.
        </p>
      </div>

      {/* Areas */}
      <ul className="relative mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 auto-rows-fr gap-4">
        {AREAS.map((area) => {
          const Icon = area.icon;
          return (
            <li key={area.name}>
              <Link
                to="/submit-problem"
                aria-label={`Submit a challenge in ${area.name}`}
                className="group h-full flex items-center gap-4 rounded-2xl bg-white/80 border border-stone-200/80 px-4 py-4 sm:px-5 hover:bg-white hover:border-[#063028]/30 hover:shadow-md transition-all"
              >
                <span
                  className="h-14 w-14 shrink-0 rounded-full flex items-center justify-center text-[#063028]"
                  style={{ background: area.tint }}
                  aria-hidden="true"
                >
                  <Icon className="h-6 w-6" strokeWidth={1.6} />
                </span>
                <span className="flex-1 font-serif text-lg leading-snug text-[#063028]">{area.name}</span>
                <span
                  className="h-10 w-10 shrink-0 rounded-full border border-stone-300 flex items-center justify-center text-stone-700 group-hover:border-[#063028] group-hover:bg-[#063028] group-hover:text-white transition-colors"
                  aria-hidden="true"
                >
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  </section>
);
