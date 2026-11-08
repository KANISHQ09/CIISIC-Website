import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Factory, ShieldCheck, GraduationCap } from 'lucide-react';

/** Short "what is CIISIC" for the home page; the full story is on the About page. */
export const AboutSummarySection: React.FC = () => {
  const steps = [
    {
      icon: Factory,
      title: 'Industry shares a challenge',
      text: 'Any organisation can submit a real business or engineering problem, no login needed.',
    },
    {
      icon: ShieldCheck,
      title: 'CII verifies and publishes it',
      text: 'CII officials review every problem before it goes live for institutions to see.',
    },
    {
      icon: GraduationCap,
      title: 'Student teams solve it',
      text: 'Partner institutions pick problems and submit their faculty-mentored teams’ solutions.',
    },
  ];

  return (
    <section id="about-ciisic" className="py-16 sm:py-24 bg-[#faf8f4] scroll-mt-20">
      <div className="max-w-[1320px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* What CIISIC is */}
          <div className="lg:col-span-5 space-y-5 text-left">
            <div className="flex items-center gap-2 text-[#c48825] font-bold text-xs tracking-wider uppercase">
              About CIISIC · Powered by CII
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#063028] tracking-tight leading-[1.15] font-serif">
              Where industry challenges meet student <span className="text-[#c48825]">innovation</span>
            </h1>
            <p className="text-stone-700 text-base sm:text-lg leading-relaxed">
              The CII Student Innovation Challenge connects industries in Madhya Pradesh with partner institutions and
              their students, so real problems get practical, research-backed solutions.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-white bg-[#063028] hover:bg-[#04201a] transition-colors"
              >
                Read more about CIISIC <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center px-5 py-3.5 rounded-xl text-sm font-bold text-[#063028] bg-white border border-stone-300 hover:bg-stone-50 transition-colors"
              >
                How it works
              </Link>
            </div>
          </div>

          {/* How it works, in three steps */}
          <ol className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-11 w-11 rounded-full bg-[#edf4f0] text-[#063028] flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold font-mono text-[#c48825]">0{index + 1}</span>
                  </div>
                  <h2 className="text-base font-bold text-[#063028] leading-snug">{step.title}</h2>
                  <p className="text-sm text-stone-600 leading-relaxed">{step.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
};
