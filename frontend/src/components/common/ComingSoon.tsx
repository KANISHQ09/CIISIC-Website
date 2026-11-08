import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

/** A simple "coming soon" page for sections that are planned but not live yet. */
export const ComingSoon: React.FC<{
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}> = ({ icon, eyebrow, title, description }) => (
  <section className="bg-[#faf8f4] py-20 sm:py-28">
    <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
      <div className="mx-auto h-16 w-16 rounded-2xl bg-[#edf4f0] border border-[#e2ece6] text-[#063028] flex items-center justify-center">
        {icon}
      </div>
      <div className="space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c48825]/10 text-[#9a6a1b] text-xs font-bold uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" /> {eyebrow}
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#063028] font-serif">{title}</h1>
        <p className="text-base text-stone-600 leading-relaxed">{description}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Link
          to="/problem-statements"
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#063028] hover:bg-[#04201a] text-white rounded-xl text-sm font-bold transition-colors"
        >
          See open problem statements <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center px-5 py-3 border border-stone-300 bg-white hover:bg-stone-50 text-[#063028] rounded-xl text-sm font-bold transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  </section>
);
