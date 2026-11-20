import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building, Factory } from 'lucide-react';

/** Closing call to action at the bottom of the information pages. */
export const PageCTA: React.FC = () => (
  <section className="bg-[#faf8f4] pb-16 sm:pb-24">
    <div className="max-w-[1320px] mx-auto px-6 sm:px-8 lg:px-12">
      <div className="bg-[#063028] text-white rounded-3xl p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8 shadow-xl">
        <div className="space-y-3 max-w-2xl">
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Get involved</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-serif leading-tight">
            Ready to solve the next industry challenge?
          </h2>
          <p className="text-sm sm:text-base text-stone-300 leading-relaxed">
            Industries can submit a problem without logging in; CII approves it before it goes live. Partner
            institutions pick problems and submit their teams&apos; solutions through the Institution Portal.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 shrink-0">
          <Link
            to="/submit-problem"
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-[#063028] bg-[#c48825] hover:bg-[#b0781e] transition-colors"
          >
            <Factory className="h-4 w-4" /> Submit a Problem
          </Link>
          <Link
            to="/institution/login"
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
          >
            <Building className="h-4 w-4" /> Institution Portal
          </Link>
          <Link
            to="/problem-statements"
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-white hover:text-[#e2b765] transition-colors"
          >
            Browse problems <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  </section>
);
