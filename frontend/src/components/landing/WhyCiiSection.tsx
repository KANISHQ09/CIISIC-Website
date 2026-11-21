import React from 'react';
import { Building2, GraduationCap, Users } from 'lucide-react';

export const WhyCiiSection: React.FC = () => {
  const stakeholders = [
    {
      title: "Industry",
      icon: <Building2 className="h-6 w-6 text-[#063028]" />,
      bg: "bg-[#edf4f0]",
      border: "hover:border-[#063028]",
      text: "Transform business challenges into practical, research-backed solutions while engaging with future talent and discovering new partnerships."
    },
    {
      title: "Students",
      icon: <Users className="h-6 w-6 text-[#c48825]" />,
      bg: "bg-[#fef6e7]",
      border: "hover:border-[#c48825]",
      text: "Gain real-world experience by solving meaningful industry challenges under expert mentorship, building a strong portfolio and career-ready skills."
    },
    {
      title: "Institutions",
      icon: <GraduationCap className="h-6 w-6 text-[#063028]" />,
      bg: "bg-[#edf4f0]",
      border: "hover:border-[#063028]",
      text: "Strengthen innovation ecosystems through applied research, collaboration, and sustained industry engagement that benefits students and faculty alike."
    }
  ];

  return (
    <section id="why-cii" className="py-16 sm:py-24 bg-[#faf8f4] scroll-mt-20 border-t border-[#e8e4dc]">
      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Our purpose: heading on the left; the explanation and the motto on the right, aligned with it */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start mb-16 sm:mb-20">
          <div className="lg:col-span-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#c48825]">Our purpose</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#063028] tracking-tight leading-tight font-serif">
              Why the CII Industry–Academia Excellence Initiative
            </h2>
          </div>
          <div className="lg:col-span-7 lg:pt-7 space-y-6">
            <p className="text-stone-700 text-base sm:text-lg leading-relaxed">
              Most organizations know innovation matters — what&apos;s missing is research capacity, fresh thinking, or a
              low-risk way to test new ideas. The CII Industry–Academia Excellence Initiative bridges industry with
              academia, creating opportunities to solve real-world challenges through collective expertise, innovation,
              and shared purpose.
            </p>
            <blockquote className="border-l-4 border-[#c48825] pl-5">
              <p className="font-serif italic text-xl sm:text-2xl text-[#063028] leading-snug">
                “Solving real problems through collaborative innovation.”
              </p>
            </blockquote>
          </div>
        </div>

        {/* Stakeholder Value Cards Section (Section 8) */}
        <div className="space-y-6">
          <div className="text-left border-b border-stone-200 pb-4 mb-8">
            <h3 className="text-xs font-bold text-[#c48825] uppercase tracking-wider">Stakeholder Ecosystem</h3>
            <p className="text-2xl sm:text-3xl font-bold text-[#063028] mt-1 font-serif">Creating Value for Every Stakeholder</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stakeholders.map((s, idx) => (
              <div 
                key={idx}
                className={`bg-white border border-stone-200/90 p-6 sm:p-8 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 ${s.border}`}
              >
                <div className="space-y-6">
                  <div className={`p-3.5 ${s.bg} rounded-2xl w-fit`}>
                    {s.icon}
                  </div>
                  <h4 className="text-2xl font-bold text-[#063028] font-serif">{s.title}</h4>
                  <p className="text-base text-stone-700 leading-relaxed font-normal">
                    {s.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
