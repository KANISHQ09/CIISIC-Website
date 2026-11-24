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
      title: 'CII approves and publishes it',
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
      <div className="max-w-[1180px] mx-auto px-6 sm:px-8 lg:px-12">
        {/* What CIISIC is */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[#c48825] font-bold text-xs tracking-wider uppercase">About CIISIC · Powered by CII</p>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-[#063028] tracking-tight leading-[1.15] font-serif">
            Where industry challenges meet student <span className="text-[#c48825]">innovation</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-stone-700 text-base sm:text-lg leading-relaxed">
            The CII Student Innovation Challenge connects industries in Madhya Pradesh with partner institutions and
            their students, so real problems get practical, research-backed solutions.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/about"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-white bg-[#063028] hover:bg-[#04201a] transition-colors"
            >
              Read more about CIISIC <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center justify-center px-5 py-3.5 rounded-xl text-sm font-bold text-[#063028] bg-white border border-stone-300 hover:bg-stone-50 transition-colors"
            >
              How it works
            </Link>
          </div>
        </div>

        {/* How it works, in three connected steps */}
        <ol className="relative mt-12 sm:mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          <div
            className="absolute left-[16.66%] right-[16.66%] top-[52px] hidden border-t-2 border-dashed border-[#c48825]/40 md:block"
            aria-hidden="true"
          />
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="relative flex flex-col items-center rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-7 text-center shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[#c48825]/50 hover:shadow-md"
              >
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#063028] text-white ring-8 ring-white">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#063028] leading-snug">{step.title}</h3>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">{step.text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};
