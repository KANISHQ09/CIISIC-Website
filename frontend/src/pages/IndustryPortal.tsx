import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, FilePlus2, LogIn } from 'lucide-react';
import { IndustryChoiceDisclaimer } from '../components/common/Notice';
import { usePageTitle } from '../lib/usePageTitle';

/**
 * What "Industry Login" opens (CII portal review, 16 Nov 2026): a choice between submitting a
 * problem statement without an account and signing in to an existing industry account.
 */
export const IndustryPortal: React.FC = () => {
  usePageTitle('Industry Partners');

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#faf8f4] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e0d8_1px,transparent_1px)] [background-size:24px_24px] opacity-60" aria-hidden="true" />

      <div className="max-w-3xl w-full space-y-8 relative z-10 animate-fade-in">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-stone-600 hover:text-[#063028] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <header className="text-center space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[#c48825]">Industry partners</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#063028] font-serif">What would you like to do?</h1>
          <p className="text-stone-600 max-w-xl mx-auto">
            Share a challenge with CII's partner institutions, or sign in to manage your problem statements and the
            solutions you receive.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Option 1: submit without an account */}
          <section className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col">
            <div className="h-12 w-12 rounded-xl bg-[#c48825]/10 text-[#9a6a1b] flex items-center justify-center mb-4">
              <FilePlus2 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-[#063028] font-serif">Submit a Problem Statement</h2>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed flex-1">
              No account needed. Fill in a short form about your challenge and get a reference code. CII reviews it and
              publishes it to partner institutions once approved.
            </p>
            <Link
              to="/submit-problem"
              className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-white bg-[#063028] hover:bg-[#04201a] transition-colors"
            >
              Submit a Problem <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          {/* Option 2: existing account */}
          <section className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col">
            <div className="h-12 w-12 rounded-xl bg-[#edf4f0] text-[#063028] flex items-center justify-center mb-4">
              <LogIn className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-[#063028] font-serif">Log in to your industry account</h2>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed flex-1">
              For registered, CII-approved companies. Track your problem statements and review the solutions partner
              institutions send you.
            </p>
            <Link
              to="/industry/login"
              className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-[#063028] bg-white border border-[#063028]/30 hover:bg-[#edf4f0] transition-colors"
            >
              Log in <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-center text-xs text-stone-500">
              New company?{' '}
              <Link to="/industry/register" className="font-bold text-[#c48825] hover:underline">
                Register an account
              </Link>
            </p>
          </section>
        </div>

        <IndustryChoiceDisclaimer />
      </div>
    </div>
  );
};
