import React, { useState, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useScrollIntoViewOnChange } from '../lib/useScrollIntoViewOnChange';
import {
  GraduationCap, FileText, Search, ExternalLink, AlertCircle,
  Layers, Check, Send, Award, Lock
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { htmlToPlainText } from '../lib/html';
import { ChangePasswordModal } from '../components/common/ChangePasswordModal';
import { InlineLoader } from '../components/common/Loader';

export const InstitutionDashboard: React.FC = () => {
  const { currentUser, submissions, solutions, showToast, submissionsLoading, solutionsLoading } = useApp();

  // Change password modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Active Tab: 'available' | 'solutions'
  // A link like /institution/dashboard?tab=solutions opens that tab
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'available' | 'solutions'>(
    searchParams.get('tab') === 'solutions' ? 'solutions' : 'available'
  );
  const tabsRef = useRef<HTMLDivElement>(null);
  useScrollIntoViewOnChange(tabsRef, activeTab);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');

  // Available approved challenges
  const approvedChallenges = useMemo(() => {
    return submissions.filter(s => s.status === 'Approved');
  }, [submissions]);

  // Unique sectors for filtering
  const sectors = useMemo(() => {
    const list = approvedChallenges.map(c => c.company.industrySector || c.company.industryName).filter(Boolean);
    return ['All', ...Array.from(new Set(list))];
  }, [approvedChallenges]);

  // Filtered available challenges
  const filteredAvailable = useMemo(() => {
    return approvedChallenges.filter(c => {
      if (selectedSector !== 'All') {
        const sec = (c.company.industrySector || c.company.industryName || '').toLowerCase();
        if (!sec.includes(selectedSector.toLowerCase())) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.details.title.toLowerCase().includes(q) ||
          c.company.companyName.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [approvedChallenges, selectedSector, searchQuery]);

  // Current institution's submitted solutions
  const institutionSolutions = useMemo(() => {
    return solutions.filter(s => 
      !currentUser?.institutionName || 
      s.institutionName.toLowerCase() === currentUser.institutionName.toLowerCase()
    );
  }, [solutions, currentUser]);

  return (
    <div className="bg-[#faf8f4] min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 lg:p-10 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-5 pointer-events-none">
            <GraduationCap className="w-80 h-80 text-[#063028]" />
          </div>

          <div className="space-y-3 relative z-10 text-left max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#edf4f0] text-[#063028] border border-[#063028]/15">
                Institution Innovation Portal
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold text-stone-600 bg-stone-100">
                {currentUser?.institutionCity || 'Madhya Pradesh'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#063028] font-serif tracking-tight">
              {currentUser?.institutionName || 'Partner Academic Institution'}
            </h1>

            <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
              Coordinator: <strong className="text-stone-800 font-semibold">{currentUser?.name || 'Academic SPOC'}</strong> • {currentUser?.designation || 'Innovation Cell Lead'} ({currentUser?.department || 'R&D Cell'})
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 relative z-10 flex-wrap">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-3 bg-white text-stone-700 border border-stone-300 rounded-xl text-xs sm:text-sm font-bold hover:bg-stone-50 transition-all shadow-2xs cursor-pointer"
            >
              <Lock className="h-4 w-4 text-[#c48825]" /> Change Password
            </button>
            <Link
              to="/problem-statements"
              className="inline-flex items-center gap-2 px-4 py-3 bg-[#063028] text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-[#04201a] transition-all shadow-2xs"
            >
              <Search className="h-4 w-4" /> Browse Problems
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs text-left space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Available Problems</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#063028] font-serif">{approvedChallenges.length}</p>
            <p className="text-[11px] text-stone-500">Open for adoption</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs text-left space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Solutions</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#063028] font-serif">{institutionSolutions.length}</p>
            <p className="text-[11px] text-stone-500">Sent to sponsors</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs text-left space-y-1 col-span-2 md:col-span-1">
            <span className="text-xs font-bold uppercase tracking-wider text-green-700">Approved</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-green-700 font-serif">
              {institutionSolutions.filter(s => s.status === 'APPROVED').length}
            </p>
            <p className="text-[11px] text-stone-500">Shortlisted</p>
          </div>
        </div>

        {/* Tabbed Navigation Bar */}
        <div ref={tabsRef} className="border-b border-stone-200 flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'available'
                ? 'border-[#063028] text-[#063028] bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Layers className="h-4 w-4" /> Available Problem Statements ({approvedChallenges.length})
          </button>

          <button
            onClick={() => setActiveTab('solutions')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'solutions'
                ? 'border-[#063028] text-[#063028] bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileText className="h-4 w-4" /> Submitted Solutions &amp; Reviews ({institutionSolutions.length})
          </button>
        </div>

        {/* TAB 1: AVAILABLE PROBLEM STATEMENTS */}
        {activeTab === 'available' && (
          <div className="space-y-6">
            {/* Search & Sector Filters */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-96 text-left">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search challenges, keywords, companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#063028]"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                <span className="text-xs font-bold text-stone-500 whitespace-nowrap">Sector:</span>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="px-3 py-2 border border-stone-300 rounded-xl text-xs font-semibold bg-white text-stone-800 focus:outline-none focus:border-[#063028] cursor-pointer"
                >
                  {sectors.map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Challenges List */}
            {submissionsLoading ? (
              <div className="bg-white rounded-3xl border border-stone-200/90"><InlineLoader label="Loading problem statements…" /></div>
            ) : filteredAvailable.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200/90 p-12 text-center space-y-4">
                <AlertCircle className="h-10 w-10 text-stone-400 mx-auto" />
                <h3 className="text-lg font-bold text-stone-800">No Open Challenges Found</h3>
                <p className="text-sm text-stone-600 max-w-md mx-auto">
                  There are currently no approved challenges matching your query. Industry partners post new problems regularly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredAvailable.map(challenge => {
                  const existingSolution = institutionSolutions.find(s => s.challengeId === challenge.id);
                  return (
                    <div 
                      key={challenge.id}
                      className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 p-6 sm:p-7 shadow-xs hover:border-[#063028] transition-all flex flex-col justify-between text-left space-y-5"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#edf4f0] text-[#063028] border border-[#063028]/15">
                            {challenge.company.industrySector || challenge.company.industryName}
                          </span>
                          <span className="text-xs font-mono text-stone-500">{challenge.id}</span>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-[#c48825] uppercase tracking-wider">{challenge.company.companyName}</p>
                          <h3 className="text-lg font-bold text-stone-900 font-serif leading-snug mt-1">
                            {challenge.details.title}
                          </h3>
                        </div>

                        <p className="text-xs sm:text-sm text-stone-600 line-clamp-3 leading-relaxed">
                          {htmlToPlainText(challenge.details.description)}
                        </p>

                        {/* Tech tags */}
                        {challenge.technical.requiredTechnologies?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {challenge.technical.requiredTechnologies.slice(0, 4).map((tech, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[11px] font-medium">
                                {tech}
                              </span>
                            ))}
                            {challenge.technical.requiredTechnologies.length > 4 && (
                              <span className="px-1.5 py-0.5 text-stone-500 text-[11px]">
                                +{challenge.technical.requiredTechnologies.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Action footer */}
                      <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3 flex-wrap">
                        <Link
                          to={`/details/${challenge.id}`} state={{ from: '/institution/dashboard' }}
                          className="text-xs font-bold text-stone-700 hover:text-[#063028] inline-flex items-center gap-1"
                        >
                          View Full Spec <ExternalLink className="h-3.5 w-3.5" />
                        </Link>

                        {existingSolution ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-green-50 text-green-800 border border-green-200">
                            <Check className="h-3.5 w-3.5" /> Solution Submitted
                          </span>
                        ) : (
                          <Link
                            to={`/institution/submit-solution/${challenge.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#063028] text-white text-xs font-bold rounded-xl hover:bg-[#04201a] transition-all shadow-xs"
                          >
                            <Send className="h-3.5 w-3.5" /> Submit Solution
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SUBMITTED SOLUTIONS & REVIEWS */}
        {activeTab === 'solutions' && (
          <div className="space-y-6">
            <div className="px-1 text-left">
              <h2 className="text-xl font-bold text-[#063028] font-serif">
                Submitted Solutions &amp; Industry Reviews
              </h2>
              <p className="text-xs sm:text-sm text-stone-600">
                Track corporate sponsor evaluations, reviewer remarks, and shortlisted solution prototypes.
              </p>
            </div>

            {solutionsLoading ? (
              <div className="bg-white rounded-3xl border border-stone-200/90"><InlineLoader label="Loading your solutions…" /></div>
            ) : institutionSolutions.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200/90 p-12 text-center space-y-4">
                <FileText className="h-12 w-12 text-stone-400 mx-auto" />
                <h3 className="text-xl font-bold text-stone-800 font-serif">No Solutions Submitted Yet</h3>
                <p className="text-sm text-stone-600 max-w-md mx-auto">
                  Pick an open problem statement from the Available tab and submit your team's solution approach to connect directly with industry sponsors.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('available')}
                    className="px-5 py-2.5 bg-[#063028] text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-[#04201a] transition-all cursor-pointer"
                  >
                    Browse Available Challenges &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {institutionSolutions.map(solution => {
                  return (
                    <div 
                      key={solution.id}
                      className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-xs text-left space-y-5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                        <div className="space-y-1">
                          <span className="text-xs font-mono font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-md">
                            {solution.id}
                          </span>
                          <p className="text-xs font-bold text-[#c48825] uppercase tracking-wider mt-1">{solution.industryCompanyName}</p>
                          <h3 className="text-lg sm:text-xl font-bold text-stone-900 font-serif">
                            {solution.title}
                          </h3>
                          <p className="text-xs text-stone-500">
                            Challenge: <strong className="text-stone-700">{solution.challengeTitle}</strong> ({solution.challengeId})
                          </p>
                        </div>

                        <div className="shrink-0 flex sm:flex-col sm:items-end gap-2">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            solution.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800 border border-green-300'
                              : solution.status === 'REVISION_REQUESTED'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : solution.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : 'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}>
                            {solution.status.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] text-stone-500">
                            Submitted: {new Date(solution.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Details & Approach summary */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Executive Solution Summary</h4>
                        <p className="text-sm text-stone-700 leading-relaxed font-normal bg-[#faf8f4] p-4 rounded-xl border border-stone-200">
                          {solution.summary}
                        </p>
                      </div>

                      {/* Team & Mentor info */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                        <div>
                          <p className="text-stone-500 font-bold uppercase text-[10px]">Team Name</p>
                          <p className="font-bold text-stone-900 text-sm mt-0.5">{solution.teamName}</p>
                        </div>
                        <div>
                          <p className="text-stone-500 font-bold uppercase text-[10px]">Team Lead</p>
                          <p className="font-semibold text-stone-900 mt-0.5">{solution.teamLead.name} ({solution.teamLead.department})</p>
                          <p className="text-stone-500">{solution.teamLead.email}</p>
                        </div>
                        <div>
                          <p className="text-stone-500 font-bold uppercase text-[10px]">Faculty Mentor</p>
                          <p className="font-semibold text-stone-900 mt-0.5">{solution.facultyMentor.name}</p>
                          <p className="text-stone-500">{solution.facultyMentor.designation}</p>
                        </div>
                      </div>

                      {/* Tech stack */}
                      {solution.technologiesUsed?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-xs font-bold text-stone-500 mr-1">Tech Stack:</span>
                          {solution.technologiesUsed.map((t, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-[#edf4f0] text-[#063028] text-xs rounded-md font-semibold">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Demo URL / Link */}
                      {solution.demoUrl && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-stone-600">Demo Prototype:</span>
                          <a 
                            href={solution.demoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#c48825] hover:underline font-bold inline-flex items-center gap-1"
                          >
                            {solution.demoUrl} <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}

                      {/* Industry Feedback Banner if reviewed */}
                      {solution.industryFeedback && (
                        <div className="p-4 rounded-xl bg-[#fef6e7] border border-[#c48825]/30 space-y-1">
                          <span className="text-xs font-bold text-[#a6711c] uppercase tracking-wider flex items-center gap-1.5">
                            <Award className="h-4 w-4" /> Feedback from {solution.industryCompanyName}:
                          </span>
                          <p className="text-xs sm:text-sm text-stone-800 leading-relaxed italic">
                            &quot;{solution.industryFeedback}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => showToast('Password successfully updated!', 'success')}
      />

    </div>
  );
};
