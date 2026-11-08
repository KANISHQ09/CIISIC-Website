import React from 'react';
import { Link } from 'react-router-dom';
import { INDORE_INSTITUTIONS, BHOPAL_INSTITUTIONS, ALL_INSTITUTIONS } from '../data/institutions';

const PARTNER_LOGOS = [
  { name: 'Jagran Lakecity University', src: '/images/jagran_lakecity_logo.jpg' },
  { name: 'LNCT Group', src: '/images/lnct_g_logo.png' },
  { name: 'LNCT University', src: '/images/lnct_university_logo.png' },
  { name: 'Oriental Group of Institutes', src: '/images/oriental_group_logo.png' },
  { name: 'Rabindranath Tagore University', src: '/images/rntu_logo.png' },
  { name: 'Scope Global Skills University', src: '/images/scope_global_logo.png' },
];
import { Building2, GraduationCap, ArrowRight } from 'lucide-react';
import { usePageTitle } from '../lib/usePageTitle';

export const Institutions: React.FC = () => {
  usePageTitle('Partner Institutions');

  return (
    <div className="bg-[#faf8f4] min-h-screen py-16 sm:py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edf4f0] text-[#063028] text-xs font-semibold tracking-wide">
            Partner Network
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#063028] tracking-tight font-serif leading-tight">
            Partner Institutions
          </h1>
          <p className="text-stone-700 text-base sm:text-lg leading-relaxed">
            Connecting leading technical universities, engineering colleges, and research institutes across Indore and Bhopal to drive student-led innovations for industry challenges.
          </p>
        </div>

        {/* Network at a glance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12 border-y border-[#e8e4dc] py-8">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#063028] tracking-tight font-serif">{ALL_INSTITUTIONS.length}</div>
            <div className="text-sm font-bold text-stone-700 uppercase tracking-wider mt-2">Partner Institutions</div>
            <p className="text-xs sm:text-sm text-[#a6711c] font-bold uppercase tracking-wider mt-1">
              {BHOPAL_INSTITUTIONS.length} Bhopal · {INDORE_INSTITUTIONS.length} Indore
            </p>
          </div>
          <div className="text-center sm:border-x border-[#e8e4dc] py-2 sm:py-0">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#063028] tracking-tight font-serif">7</div>
            <div className="text-sm font-bold text-stone-700 uppercase tracking-wider mt-2">CII Excellence Cells</div>
            <p className="text-xs sm:text-sm text-[#a6711c] font-bold uppercase tracking-wider mt-1">Domain-specific hubs</p>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#063028] tracking-tight font-serif">2</div>
            <div className="text-sm font-bold text-stone-700 uppercase tracking-wider mt-2">Divisions</div>
            <p className="text-xs sm:text-sm text-[#a6711c] font-bold uppercase tracking-wider mt-1">Madhya Pradesh network</p>
          </div>
        </div>

        {/* Partner logos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-center max-w-5xl mx-auto mb-16">
          {PARTNER_LOGOS.map((logo) => (
            <div
              key={logo.name}
              className="bg-white border border-stone-200/90 p-5 rounded-2xl flex items-center justify-center h-24 hover:shadow-sm hover:border-stone-300 transition-all duration-300"
            >
              <img
                src={logo.src}
                alt={`${logo.name} logo`}
                className="max-h-full max-w-full object-contain filter grayscale opacity-75 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {/* Institution Access Banner */}
        <div className="max-w-4xl mx-auto mb-16 bg-gradient-to-r from-[#063028] to-[#0d4f40] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <GraduationCap className="w-4 h-4" /> Academic Institution Portal
            </div>
            <h3 className="text-xl font-bold font-serif">Are you a Faculty SPOC or University Coordinator?</h3>
            <p className="text-xs text-emerald-100/80 max-w-md">
              Log in to view live industry problem statements and submit your faculty-mentored team's research solutions directly to corporate partners.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
            <Link
              to="/institution/login"
              className="w-full sm:w-auto text-center px-5 py-2.5 rounded-xl bg-[#c48825] hover:bg-[#b0781e] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              SPOC Login <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/institution/register"
              className="w-full sm:w-auto text-center px-5 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Register Institute
            </Link>
          </div>
        </div>

        {/* Two-Column Grid for Cities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Indore Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-stone-200 pb-4">
              <div className="p-3 bg-[#edf4f0] text-[#063028] rounded-xl">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#063028] font-serif">Indore Division</h2>
                <p className="text-sm text-[#a6711c] font-bold uppercase tracking-wider">{INDORE_INSTITUTIONS.length} Partner Institutions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {INDORE_INSTITUTIONS.map((inst, index) => (
                <div 
                  key={index} 
                  className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-xs flex flex-col justify-center min-h-[5.5rem] transition-all duration-300 hover:border-[#063028] hover:shadow-md hover:-translate-y-0.5"
                >
                  <p className="text-sm sm:text-base font-bold text-stone-800 leading-snug">
                    {inst.name}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bhopal Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-stone-200 pb-4">
              <div className="p-3 bg-[#fef6e7] text-[#c48825] rounded-xl">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#063028] font-serif">Bhopal Division</h2>
                <p className="text-sm text-[#a6711c] font-bold uppercase tracking-wider">{BHOPAL_INSTITUTIONS.length} Partner Institutions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BHOPAL_INSTITUTIONS.map((inst, index) => (
                <div 
                  key={index} 
                  className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-xs flex flex-col justify-center min-h-[5.5rem] transition-all duration-300 hover:border-[#063028] hover:shadow-md hover:-translate-y-0.5"
                >
                  <p className="text-sm sm:text-base font-bold text-stone-800 leading-snug">
                    {inst.name}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
