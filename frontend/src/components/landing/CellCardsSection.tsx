import React from 'react';
import { Link } from 'react-router-dom';
import { EXCELLENCE_CELLS } from '../../data/excellenceCells';

/** The short name shown beside each cell's round logo. */
const CELL_SHORT_NAMES: Record<string, string> = {
  'family-business': 'Family Business',
  'talent-readiness': 'Talent Readiness',
  'research-innovation': 'Research & Innovation',
  'ai-in-business': 'AI in Business',
  agritech: 'AgriTech',
  'skill-development': 'Skill Development',
  'startup-cell': 'Startup',
};

const CellLogos: React.FC<{ copy?: boolean }> = ({ copy = false }) => (
  <ul className="flex shrink-0 items-center gap-x-10 pr-10" aria-hidden={copy || undefined}>
    {EXCELLENCE_CELLS.map((cell) => {
      const shortName = CELL_SHORT_NAMES[cell.id];
      if (!shortName) return null;
      return (
        <li key={cell.id}>
          <Link
            to="/ecosystem"
            tabIndex={copy ? -1 : undefined}
            title={`${cell.name} · ${cell.partner}`}
            aria-label={`${cell.name}, hosted by ${cell.partner}`}
            className="group inline-flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <img
              src={`/images/cells/${cell.id}-logo.webp`}
              alt=""
              width={64}
              height={64}
              loading="eager"
              decoding="async"
              className="h-14 w-14 shrink-0 rounded-full shadow-sm transition-transform duration-200 group-hover:scale-105 2xl:h-16 2xl:w-16"
            />
            <span className="whitespace-nowrap text-base font-bold tracking-tight text-stone-800 group-hover:text-[#063028] 2xl:text-lg">
              {shortName}
            </span>
          </Link>
        </li>
      );
    })}
  </ul>
);

/**
 * The 7 Excellence Cells as a moving strip of "logos" at the bottom of the home page hero.
 * It pauses on hover or keyboard focus, and stays still for visitors who turn animations off.
 * Each opens the Ecosystem page with the full profiles.
 */
export const CellCardsSection: React.FC = () => (
  <section id="excellence-cells" aria-labelledby="excellence-cells-title" className="py-5 sm:py-6 bg-white border-y border-[#e8e4dc] scroll-mt-20">
    <div className="max-w-[1320px] mx-auto px-6 sm:px-8 lg:px-12">
      <h2 id="excellence-cells-title" className="mb-4 text-center text-xs font-bold uppercase tracking-wider text-[#c48825]">
        Our 7 CII Industry–Academia Excellence Cells
      </h2>

      <div className="cell-marquee-viewport overflow-hidden py-1 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <div className="cell-marquee flex w-max">
          <CellLogos />
          <CellLogos copy />
        </div>
      </div>
    </div>
  </section>
);
