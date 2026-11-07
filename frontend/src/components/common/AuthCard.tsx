import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/** Card layout matching the login pages, used by the password reset pages. */
export const AuthCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ icon, title, subtitle, children }) => (
  <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#faf8f4] relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(#e5e0d8_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>
    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#edf4f0]/60 rounded-full blur-3xl pointer-events-none"></div>

    <div className="max-w-md w-full space-y-6 relative z-10 animate-fade-in">
      <div className="px-1">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-[#063028] transition-all group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Homepage
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-[#063028] via-[#c48825] to-[#063028]"></div>
        <div className="p-8 sm:p-10 space-y-7">
          <div className="text-center space-y-3">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-[#edf4f0] text-[#063028] border border-[#063028]/15 flex items-center justify-center shadow-sm">
              {icon}
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#063028] tracking-tight font-serif">{title}</h2>
              <p className="text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">{subtitle}</p>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  </div>
);
