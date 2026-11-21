import React, { useMemo, useState } from 'react';
import { Building2, MapPin } from 'lucide-react';
import { ALL_INSTITUTIONS } from '../../data/institutions';

/**
 * Participating institutions grouped by city, with a city filter (CII portal review,
 * 16 Nov 2026). Cities come from the institution list itself, so a new city shows up on its own.
 */
export const InstitutionDirectory: React.FC = () => {
  const byCity = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const inst of ALL_INSTITUTIONS) {
      groups.set(inst.city, [...(groups.get(inst.city) ?? []), inst.name]);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([city, names]) => ({ city, names: [...names].sort((a, b) => a.localeCompare(b)) }));
  }, []);
  const [city, setCity] = useState<string>('All');
  const shown = city === 'All' ? byCity : byCity.filter((g) => g.city === city);

  const chip = (value: string, label: string) => (
    <button
      key={value}
      type="button"
      aria-pressed={city === value}
      onClick={() => setCity(value)}
      className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors cursor-pointer ${
        city === value
          ? 'bg-[#063028] text-white border-[#063028]'
          : 'bg-white text-stone-700 border-stone-300 hover:border-[#063028] hover:text-[#063028]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <section id="institution-list" aria-label="Partner institutions by city" className="scroll-mt-24">
      {/* City filter */}
      <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter by city">
        {chip('All', `All cities (${ALL_INSTITUTIONS.length})`)}
        {byCity.map((g) => chip(g.city, `${g.city} (${g.names.length})`))}
      </div>

      <div className="space-y-10">
        {shown.map((group) => (
          <div key={group.city}>
            <h3 className="flex items-center gap-2 pb-3 mb-4 border-b border-stone-200 text-xl font-bold text-[#063028] font-serif">
              <MapPin className="h-5 w-5 text-[#c48825]" aria-hidden="true" />
              {group.city}
              <span className="text-sm font-sans font-semibold text-stone-500">· {group.names.length} institutions</span>
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr gap-3">
              {group.names.map((name) => (
                <li
                  key={name}
                  className="h-full flex items-center gap-3 bg-white border border-stone-200/90 rounded-xl px-4 py-3.5"
                >
                  <Building2 className="h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />
                  <span className="text-sm font-semibold text-stone-800 leading-snug">{name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};
