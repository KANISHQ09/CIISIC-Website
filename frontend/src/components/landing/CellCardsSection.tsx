import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, GraduationCap, Layers, Leaf, Lightbulb, Rocket, Users, type LucideIcon } from 'lucide-react';
import { EXCELLENCE_CELLS } from '../../data/excellenceCells';

/** How each cell appears in the strip: a logo-style icon, its colour and a short name. */
const CELL_LOGOS: Record<string, { icon: LucideIcon; color: string; short: string }> = {
  'family-business': { icon: Users, color: '#c2410c', short: 'Family Business' },
  'talent-readiness': { icon: GraduationCap, color: '#4f46e5', short: 'Talent Readiness' },
  'research-innovation': { icon: Lightbulb, color: '#d97706', short: 'Research & Innovation' },
  'ai-in-business': { icon: Brain, color: '#7c3aed', short: 'AI in Business' },
  agritech: { icon: Leaf, color: '#16a34a', short: 'AgriTech' },
  'skill-development': { icon: Layers, color: '#0284c7', short: 'Skill Development' },
  'startup-cell': { icon: Rocket, color: '#e11d48', short: 'Startup' },
};

const CellLogos: React.FC<{ copy?: boolean }> = ({ copy = false }) => (
  <ul className="flex shrink-0 items-center gap-x-10 pr-10" aria-hidden={copy || undefined}>
    {EXCELLENCE_CELLS.map((cell) => {
      const logo = CELL_LOGOS[cell.id];
      if (!logo) return null;
      const Icon = logo.icon;
      return (
        <li key={cell.id}>
          <Link
            to="/ecosystem"
            tabIndex={copy ? -1 : undefined}
            title={`${cell.name} · ${cell.partner}`}
            aria-label={`${cell.name}, hosted by ${cell.partner}`}
            className="group inline-flex items-center gap-2 opacity-90 transition-all duration-200 hover:-translate-y-0.5 hover:opacity-100"
          >
            <Icon
              className="h-6 w-6 shrink-0 transition-transform duration-200 group-hover:scale-110 2xl:h-7 2xl:w-7"
              style={{ color: logo.color }}
              strokeWidth={2.25}
              aria-hidden="true"
            />
            <span className="whitespace-nowrap text-base font-bold tracking-tight text-stone-800 group-hover:text-[#063028] 2xl:text-lg">
              {logo.short}
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
  <section id="excellence-cells" aria-labelledby="excellence-cells-title" className="py-5 sm:py-6 bg-white border-b border-[#e8e4dc] scroll-mt-20">
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
