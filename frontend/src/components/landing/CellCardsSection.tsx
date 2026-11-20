import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, GraduationCap, Layers, Leaf, Lightbulb, Rocket, Users, type LucideIcon } from 'lucide-react';
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

/**
 * The 7 Excellence Cells as a single strip of "logos" below the problem statements on the
 * home page (CII portal review, 16 Nov 2026). Each opens the Ecosystem page with the full profiles.
 */
export const CellCardsSection: React.FC = () => (
  <section id="excellence-cells" aria-labelledby="excellence-cells-title" className="py-10 sm:py-12 bg-white border-b border-[#e8e4dc] scroll-mt-20">
    <div className="max-w-[1320px] mx-auto px-6 sm:px-8 lg:px-12">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 mb-6">
        <h2 id="excellence-cells-title" className="text-xs font-bold uppercase tracking-wider text-[#c48825]">
          Our 7 CII Industry–Academia Excellence Cells
        </h2>
        <Link to="/ecosystem" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#063028] hover:text-[#c48825] transition-colors">
          Explore the ecosystem <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <ul className="flex flex-wrap items-center justify-center xl:justify-between gap-x-8 2xl:gap-x-10 gap-y-5">
        {EXCELLENCE_CELLS.map((cell) => {
          const logo = CELL_LOGOS[cell.id];
          if (!logo) return null;
          const Icon = logo.icon;
          return (
            <li key={cell.id}>
              <Link
                to="/ecosystem"
                title={`${cell.name} · ${cell.partner}`}
                aria-label={`${cell.name}, hosted by ${cell.partner}`}
                className="group inline-flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity"
              >
                <Icon className="h-6 w-6 2xl:h-7 2xl:w-7 shrink-0" style={{ color: logo.color }} strokeWidth={2.25} aria-hidden="true" />
                <span className="text-base 2xl:text-lg font-bold tracking-tight text-stone-800 whitespace-nowrap group-hover:text-[#063028]">
                  {logo.short}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  </section>
);
