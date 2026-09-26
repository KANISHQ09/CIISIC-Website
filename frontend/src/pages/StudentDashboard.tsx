import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Building2, Users, FileText, CheckCircle2, 
  Clock, ArrowRight, Search, ExternalLink, AlertCircle, 
  Layers, Sparkles, Filter, Eye, Award, Lock, BookOpen, Lightbulb
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { ProblemStatement, ProblemAssignment, SolutionSubmission } from '../types';
import { ChangePasswordModal } from '../components/common/ChangePasswordModal';

export const StudentDashboard: React.FC = () => {
  const { currentUser, submissions, assignments, solutions, logout, showToast } = useApp();
  const navigate = useNavigate();

  // Change password modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Active Tab: 'challenges' | 'assignments' | 'guidelines'
  const [activeTab, setActiveTab] = useState<'challenges' | 'assignments' | 'guidelines'>('challenges');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');

  // View Challenge Modal State
  const [selectedChallenge, setSelectedChallenge] = useState<ProblemStatement | null>(null);

  // Solution View Details Modal
  const [viewSolutionModal, setViewSolutionModal] = useState<SolutionSubmission | null>(null);

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

  // Student assignments (either matched by email, lead name, or institution)
  const studentAssignments = useMemo(() => {
    const studentEmail = currentUser?.email?.toLowerCase() || '';
    const studentName = currentUser?.name?.toLowerCase() || '';
    return assignments.filter(a => {
      if (a.teamLead?.email?.toLowerCase() === studentEmail) return true;
      if (a.teamLead?.name?.toLowerCase().includes(studentName)) return true;
      if (a.teamMembers?.some(m => m.email?.toLowerCase() === studentEmail || m.name?.toLowerCase().includes(studentName))) return true;
      // Fallback: If no direct match, show assignments from user's institution
      if (currentUser?.institutionName && a.institutionName.toLowerCase() === currentUser.institutionName.toLowerCase()) return true;
      return false;
    });
  }, [assignments, currentUser]);

  // Solutions related to student's institution or assignments
  const studentSolutions = useMemo(() => {
    const studentEmail = currentUser?.email?.toLowerCase() || '';
    return solutions.filter(s => {
      if (s.teamLead?.email?.toLowerCase() === studentEmail) return true;
      if (s.teamMembers?.some(m => m.email?.toLowerCase() === studentEmail)) return true;
      if (currentUser?.institutionName && s.institutionName?.toLowerCase() === currentUser.institutionName.toLowerCase()) return true;
      return false;
    });
  }, [solutions, currentUser]);

  const handleLogout = async () => {
    await logout();
    showToast('Successfully signed out.', 'info');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#faf8f4] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#edf4f0]/60 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold text-[#063028] tracking-wider uppercase bg-[#edf4f0] border border-[#063028]/15 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-[#063028]" />
                  Student Innovator Portal
                </span>
                {currentUser?.enrollmentNo && (
                  <span className="text-xs font-semibold text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-0.5 rounded-full">
                    ID: {currentUser.enrollmentNo}
                  </span>
                )}
                {currentUser?.department && (
                  <span className="text-xs font-semibold text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-0.5 rounded-full">
                    {currentUser.department}
                  </span>
                )}
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#063028] tracking-tight font-serif">
                Welcome back, {currentUser?.name || 'Student Innovator'}
              </h1>
              
              <p className="text-sm text-stone-600 flex items-center gap-2 flex-wrap">
                <span>{currentUser?.institutionName || 'Academic Partner Institution'}</span>
                {currentUser?.institutionCity && (
                  <>
                    <span className="text-stone-300">•</span>
                    <span>{currentUser.institutionCity}</span>
                  </>
                )}
                <span className="text-stone-300">•</span>
                <span className="text-stone-500 font-mono text-xs">{currentUser?.email}</span>
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4 text-stone-500" />
                Change Password
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-stone-100 relative z-10">
            <div className="p-4 rounded-2xl bg-[#faf8f4] border border-stone-200/60">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Open Challenges</p>
              <p className="text-2xl font-black text-[#063028] mt-1 font-serif">{approvedChallenges.length}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">Live industrial topics</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#faf8f4] border border-stone-200/60">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Assigned Projects</p>
              <p className="text-2xl font-black text-[#c48825] mt-1 font-serif">{studentAssignments.length}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">Team cohort tasks</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#faf8f4] border border-stone-200/60">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Solutions Submitted</p>
              <p className="text-2xl font-black text-[#063028] mt-1 font-serif">{studentSolutions.length}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">Prototypes & proposals</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#faf8f4] border border-stone-200/60">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Partner Sectors</p>
              <p className="text-2xl font-black text-[#063028] mt-1 font-serif">{Math.max(1, sectors.length - 1)}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">Industrial domains</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 space-x-2 sm:space-x-4">
          <button
            onClick={() => setActiveTab('challenges')}
            className={`pb-3 px-3 sm:px-4 text-sm sm:text-base font-bold transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'challenges'
                ? 'border-[#063028] text-[#063028]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Live Industry Challenges ({approvedChallenges.length})
          </button>
          
          <button
            onClick={() => setActiveTab('assignments')}
            className={`pb-3 px-3 sm:px-4 text-sm sm:text-base font-bold transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'assignments'
                ? 'border-[#063028] text-[#063028]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Users className="w-4 h-4" />
            My Team Assignments ({studentAssignments.length})
          </button>

          <button
            onClick={() => setActiveTab('guidelines')}
            className={`pb-3 px-3 sm:px-4 text-sm sm:text-base font-bold transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'guidelines'
                ? 'border-[#063028] text-[#063028]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Innovation Guidelines & IP
          </button>
        </div>

        {/* TAB 1: Live Challenges */}
        {activeTab === 'challenges' && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search challenges, keywords, or sponsors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-[#063028] focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <Filter className="w-4 h-4 text-stone-400 shrink-0" />
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider shrink-0">Domain:</span>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-stone-800 focus:outline-none focus:border-[#063028] transition-all cursor-pointer"
                >
                  {sectors.map((sec) => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Challenges Grid */}
            {filteredAvailable.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-12 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                  <Search className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-stone-800">No Problem Statements Found</h3>
                  <p className="text-sm text-stone-500 max-w-sm mx-auto">
                    Try adjusting your search terms or filter selection.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAvailable.map((challenge) => (
                  <div 
                    key={challenge.id}
                    className="bg-white rounded-2xl border border-stone-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-[11px] font-bold text-[#063028] bg-[#edf4f0] border border-[#063028]/15 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {challenge.company.industrySector || challenge.company.industryName || 'Industry Tech'}
                        </span>
                        <span className="text-xs font-mono text-stone-400">
                          {challenge.id}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-[#063028] group-hover:text-[#c48825] transition-colors leading-snug">
                          {challenge.details.title}
                        </h3>
                        <p className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-stone-400" />
                          {challenge.company.companyName}
                        </p>
                      </div>

                      <p className="text-sm text-stone-600 line-clamp-3 leading-relaxed">
                        {challenge.details.description}
                      </p>

                      {/* Tech stack tags */}
                      {challenge.additional?.technologies && challenge.additional.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {challenge.additional.technologies.slice(0, 3).map((tech, idx) => (
                            <span key={idx} className="text-[10px] font-medium bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md">
                              {tech}
                            </span>
                          ))}
                          {challenge.additional.technologies.length > 3 && (
                            <span className="text-[10px] font-medium text-stone-400">
                              +{challenge.additional.technologies.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                      <button
                        onClick={() => setSelectedChallenge(challenge)}
                        className="text-xs font-bold text-[#063028] hover:text-[#c48825] inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Challenge Specs
                      </button>

                      <Link
                        to={`/details/${challenge.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-[#063028] transition-colors"
                      >
                        Public Link <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: My Assignments & Solutions */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            {studentAssignments.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-12 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-[#edf4f0] flex items-center justify-center text-[#063028]">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-stone-800">No Current Team Assignments</h3>
                  <p className="text-sm text-stone-500 max-w-md mx-auto">
                    Your institution SPOC or faculty coordinator will assign challenge statements to your innovation team. Browse live challenges to propose your project to your department coordinator!
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('challenges')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#063028] hover:bg-[#04201a] transition-all cursor-pointer shadow-xs"
                >
                  Browse Open Challenges <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {studentAssignments.map((assignment) => {
                  const matchingChallenge = submissions.find(s => s.id === assignment.challengeId);
                  const matchingSolution = solutions.find(sol => sol.challengeId === assignment.challengeId);

                  return (
                    <div 
                      key={assignment.id}
                      className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs hover:shadow-xs transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#c48825] uppercase tracking-wider bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                              Team: {assignment.teamName}
                            </span>
                            <span className="text-xs font-mono text-stone-400">
                              Ref: {assignment.challengeId}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-[#063028]">
                            {assignment.challengeTitle}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {matchingSolution ? (
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Solution {matchingSolution.status}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              In Progress
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Team details bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-stone-50 rounded-xl text-xs text-stone-600">
                        <div>
                          <span className="font-bold text-stone-700">Team Lead: </span>
                          <span>{assignment.teamLead.name} ({assignment.teamLead.department})</span>
                        </div>
                        <div>
                          <span className="font-bold text-stone-700">Faculty Mentor: </span>
                          <span>{assignment.facultyMentor.name}</span>
                        </div>
                        <div>
                          <span className="font-bold text-stone-700">Institution: </span>
                          <span>{assignment.institutionName}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
                        {matchingChallenge && (
                          <button
                            onClick={() => setSelectedChallenge(matchingChallenge)}
                            className="text-xs font-bold text-[#063028] hover:text-[#c48825] inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Challenge Brief
                          </button>
                        )}

                        <div className="flex items-center gap-2">
                          {matchingSolution ? (
                            <button
                              onClick={() => setViewSolutionModal(matchingSolution)}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-[#063028] bg-[#edf4f0] hover:bg-[#dcefe5] transition-all cursor-pointer"
                            >
                              View Submitted Solution
                            </button>
                          ) : (
                            <Link
                              to={`/institution/submit-solution/${assignment.challengeId}?assignmentId=${assignment.id}`}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#063028] hover:bg-[#04201a] transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                            >
                              Submit Solution Proposal <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Innovation Guidelines */}
        {activeTab === 'guidelines' && (
          <div className="bg-white rounded-3xl border border-stone-200/90 p-8 sm:p-10 space-y-8">
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#063028] tracking-wider uppercase bg-[#edf4f0] border border-[#063028]/15 px-3 py-1 rounded-full">
                Charter & Guidelines
              </span>
              <h2 className="text-2xl font-extrabold text-[#063028] font-serif">
                CII Industry-Institute Innovation Guidelines for Students
              </h2>
              <p className="text-sm text-stone-600 max-w-2xl leading-relaxed">
                Review key guidelines on team formation, prototype submissions, intellectual property rights, and mentor endorsement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-[#faf8f4] border border-stone-200/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#edf4f0] text-[#063028] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-stone-900">Multidisciplinary Cohorts</h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Student innovation teams can comprise 2 to 4 members. We encourage interdisciplinary teams blending computer engineering, electronics, mechanical, and business domain capabilities.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#faf8f4] border border-stone-200/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#edf4f0] text-[#063028] flex items-center justify-center">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-stone-900">Prototype Benchmarks</h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Proposals must clearly demonstrate technical feasibility, architectural design, software or hardware prototypes, and test outcomes tailored to the industry partner's specifications.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#faf8f4] border border-stone-200/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#edf4f0] text-[#063028] flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-stone-900">Faculty Mentorship</h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Every student submission must be supported by an official faculty mentor or department coordinator who endorses academic integrity and validation standards.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#faf8f4] border border-stone-200/80 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#edf4f0] text-[#063028] flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-stone-900">Intellectual Property & CII Terms</h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Submissions are governed by the Confederation of Indian Industry framework ensuring confidentiality, fair credit, and mutual collaboration agreements with sponsoring enterprises.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Challenge Specs Modal */}
        {selectedChallenge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 relative my-8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#063028] bg-[#edf4f0] px-3 py-1 rounded-full uppercase tracking-wider">
                    {selectedChallenge.company.industrySector || selectedChallenge.company.industryName}
                  </span>
                  <h2 className="text-xl font-extrabold text-[#063028] font-serif mt-2">
                    {selectedChallenge.details.title}
                  </h2>
                  <p className="text-xs text-stone-500 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {selectedChallenge.company.companyName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedChallenge(null)}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm text-stone-700 leading-relaxed max-h-96 overflow-y-auto pr-2">
                <div>
                  <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wider mb-1">Problem Description</h4>
                  <p className="bg-stone-50 p-4 rounded-xl text-stone-800 leading-relaxed whitespace-pre-line">
                    {selectedChallenge.details.description}
                  </p>
                </div>

                {selectedChallenge.details.expectedOutcome && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wider mb-1">Expected Deliverables</h4>
                    <p className="bg-stone-50 p-4 rounded-xl text-stone-800 leading-relaxed">
                      {selectedChallenge.details.expectedOutcome}
                    </p>
                  </div>
                )}

                {selectedChallenge.additional?.technologies && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wider mb-1.5">Key Technology Stacks</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedChallenge.additional.technologies.map((t, i) => (
                        <span key={i} className="text-xs font-semibold bg-[#edf4f0] text-[#063028] px-2.5 py-1 rounded-md">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-200">
                <Link
                  to={`/details/${selectedChallenge.id}`}
                  className="text-xs font-bold text-stone-600 hover:text-[#063028] inline-flex items-center gap-1"
                >
                  Full Problem Page <ExternalLink className="w-3 h-3" />
                </Link>
                <button
                  onClick={() => setSelectedChallenge(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#063028] hover:bg-[#04201a] transition-all cursor-pointer"
                >
                  Close Specification
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Solution Modal */}
        {viewSolutionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 relative my-8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
                    Status: {viewSolutionModal.status}
                  </span>
                  <h2 className="text-xl font-extrabold text-[#063028] font-serif mt-2">
                    {viewSolutionModal.title}
                  </h2>
                  <p className="text-xs text-stone-500">
                    Team: <strong className="text-stone-700">{viewSolutionModal.teamName}</strong> • Submitted: {new Date(viewSolutionModal.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setViewSolutionModal(null)}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm text-stone-700 leading-relaxed max-h-96 overflow-y-auto pr-2">
                <div>
                  <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wider mb-1">Solution Summary</h4>
                  <p className="bg-stone-50 p-4 rounded-xl text-stone-800 leading-relaxed whitespace-pre-line">
                    {viewSolutionModal.summary}
                  </p>
                </div>

                {viewSolutionModal.detailedApproach && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wider mb-1">Technical Approach</h4>
                    <p className="bg-stone-50 p-4 rounded-xl text-stone-800 leading-relaxed whitespace-pre-line">
                      {viewSolutionModal.detailedApproach}
                    </p>
                  </div>
                )}

                {viewSolutionModal.reviewerFeedback && (
                  <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl space-y-1">
                    <h4 className="text-xs font-bold uppercase text-amber-900 tracking-wider">Reviewer Feedback</h4>
                    <p className="text-xs text-amber-800">{viewSolutionModal.reviewerFeedback}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-stone-200">
                <button
                  onClick={() => setViewSolutionModal(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#063028] hover:bg-[#04201a] transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
        />

      </div>
    </div>
  );
};
