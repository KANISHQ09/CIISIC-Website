import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Building2, Cpu, ArrowRight, ChevronDown, 
  GraduationCap,
  Layers, BookOpen, ChevronRight, X
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { fetchChallenges } from '../lib/api';
import { ProblemStatement } from '../types';
import { usePageTitle } from '../lib/usePageTitle';
import { ChallengeAreasSection } from '../components/landing/ChallengeAreasSection';
import { ProblemRowCard } from '../components/problems/ProblemRowCard';

export const ProblemStatements: React.FC = () => {
  usePageTitle('Problem Statements');
  const { submissions } = useApp();
  const [challenges, setChallenges] = useState<ProblemStatement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');

  // Load challenges (from AppContext or API)
  useEffect(() => {
    window.scrollTo(0, 0);
    let active = true;

    (async () => {
      try {
        setIsLoading(true);
        if (submissions && submissions.length > 0) {
          // Publicly visible challenges are those that are Approved/Open
          const approved = submissions.filter(s => s.status === 'Approved');
          setChallenges(approved);
        } else {
          const apiChallenges = await fetchChallenges();
          if (active) {
            const approved = apiChallenges.filter(s => s.status === 'Approved');
            setChallenges(approved);
          }
        }
      } catch (err) {
        console.error('Failed to load public challenges:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [submissions]);

  // Available unique domains for filter tabs
  const domainTabs = useMemo(() => {
    return [
      'All',
      'Manufacturing',
      'Artificial Intelligence',
      'Agritech',
      'Healthcare & Pharma',
      'Energy & Power',
      'Research & Innovation'
    ];
  }, []);

  // Filtered challenges based on user selection
  const filteredChallenges = useMemo(() => {
    return challenges.filter((c) => {
      // Domain filter
      if (selectedDomain !== 'All') {
        const domainNormalized = selectedDomain.toLowerCase();
        const compDomain = (c.company.industryName || '').toLowerCase();
        const compSector = (c.company.industrySector || '').toLowerCase();
        const matchesDomain = 
          compDomain.includes(domainNormalized) ||
          compSector.includes(domainNormalized) ||
          (selectedDomain === 'Artificial Intelligence' && (compDomain.includes('ai') || compSector.includes('ai') || c.details.title.toLowerCase().includes('ai'))) ||
          (selectedDomain === 'Healthcare & Pharma' && (compDomain.includes('pharma') || compSector.includes('pharma') || compDomain.includes('health'))) ||
          (selectedDomain === 'Energy & Power' && (compDomain.includes('power') || compSector.includes('power') || compDomain.includes('energy')));
        if (!matchesDomain) return false;
      }

      // Difficulty filter
      if (selectedDifficulty !== 'All') {
        if (c.technical.difficultyLevel !== selectedDifficulty) return false;
      }

      // Search Query filter (title, company, description, tags, business challenge)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSearch = 
          c.id.toLowerCase().includes(q) ||
          c.details.title.toLowerCase().includes(q) ||
          c.details.description.toLowerCase().includes(q) ||
          c.details.businessChallenge.toLowerCase().includes(q) ||
          c.company.companyName.toLowerCase().includes(q) ||
          c.company.industrySector.toLowerCase().includes(q) ||
          c.technical.requiredTechnologies.some(t => t.toLowerCase().includes(q)) ||
          c.technical.requiredSkills.some(s => s.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [challenges, selectedDomain, selectedDifficulty, searchQuery]);

  // Extract funding string helper
  // Reference time for "days left" on the rows
  const now = useMemo(() => Date.now(), [challenges]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDomain('All');
    setSelectedDifficulty('All');
  };

  return (
    <div className="bg-[#faf8f4] min-h-screen py-12 sm:py-16 md:py-20 font-sans selection:bg-[#c48825]/20 selection:text-[#063028]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* Hero & Banner Section */}
        <div className="relative bg-white rounded-3xl border border-stone-200/90 shadow-sm p-8 sm:p-12 overflow-hidden">
          {/* Subtle background graphic */}
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-[#edf4f0] rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
            <Building2 className="w-96 h-96 text-[#063028]" />
          </div>

          <div className="relative z-10 max-w-3xl space-y-5 text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-[#c48825]">Open Innovation Repository</p>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#063028] font-serif tracking-tight leading-tight">
              Industry Problem Statements
            </h1>

            <p className="text-stone-700 text-base sm:text-lg leading-relaxed font-normal">
              Explore live, vetted challenges submitted by leading industrial enterprises across Madhya Pradesh. Students, faculty mentors, and partner institutions are invited to form teams, innovate, and submit technological solutions.
            </p>

            {/* Quick Metrics */}
            <div className="pt-4 flex flex-wrap items-center gap-6 sm:gap-10 md:gap-14 border-t border-stone-100">
              <div className="space-y-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#063028] font-serif">
                  {challenges.length}
                </span>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider whitespace-nowrap">
                  Active Challenges
                </p>
              </div>

              <div className="hidden sm:block h-9 w-px bg-stone-200/80" />

              <div className="space-y-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#c48825] font-serif">
                  36
                </span>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider whitespace-nowrap">
                  Corporate Partners
                </p>
              </div>

              <div className="hidden sm:block h-9 w-px bg-stone-200/80" />

              <div className="space-y-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#063028] font-serif">
                  7
                </span>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider whitespace-nowrap">
                  Excellence Cells
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Student & Faculty Quick How-To Banner */}
        <div className="bg-[#edf4f0] border border-[#063028]/15 rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white text-[#063028] rounded-xl shadow-xs shrink-0">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-[#063028]">
                How Can Students &amp; Institutions Participate?
              </h2>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed max-w-2xl">
                Review challenge specifications below. Student teams can partner with an approved faculty advisor and submit their solution proposal through their college SPOC or by contacting the CII Excellence Secretariat.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <Link
              to="/institutions"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-stone-300 text-stone-800 rounded-xl text-xs sm:text-sm font-bold hover:bg-stone-50 transition-all shadow-2xs w-full md:w-auto text-center"
            >
              <BookOpen className="h-4 w-4 text-[#c48825]" /> Partner Institutes
            </Link>
            <Link
              to="/submit-problem"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#063028] hover:bg-[#04201a] text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs w-full md:w-auto text-center"
            >
              Post a Problem <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Search & Domain Filter Bar */}
        <div className="space-y-4">
          
          {/* Search Box & Basic Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Search className="h-5 w-5" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by keywords, technologies (e.g. PyTorch, IoT), company, or problem description..."
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-stone-300 rounded-xl text-sm sm:text-base text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 transition-all shadow-2xs font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Difficulty Filter */}
            <div className="flex gap-2 min-w-0">
              {/* Own arrow inside the box (the browser's default one sits against the edge) */}
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  aria-label="Filter by difficulty"
                  className="appearance-none w-full sm:w-44 pl-4 pr-10 py-3.5 bg-white border border-stone-300 rounded-xl text-sm font-bold text-stone-800 focus:outline-none focus:border-[#063028] focus:ring-2 focus:ring-[#063028]/10 cursor-pointer shadow-2xs"
                >
                  <option value="All">All Tiers</option>
                  <option value="Easy">Easy Tier</option>
                  <option value="Medium">Medium Tier</option>
                  <option value="Hard">Hard Tier</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" aria-hidden="true" />
              </div>

              {(searchQuery || selectedDomain !== 'All' || selectedDifficulty !== 'All') && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-3.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl text-xs sm:text-sm font-bold text-stone-700 transition-all cursor-pointer whitespace-nowrap"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Domain Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 whitespace-nowrap pr-1 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> Domains:
            </span>
            {domainTabs.map((domain) => (
              <button
                key={domain}
                onClick={() => setSelectedDomain(domain)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedDomain === domain
                    ? 'bg-[#063028] text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-200/90 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                {domain}
              </button>
            ))}
          </div>

        </div>

        {/* Results Counter */}
        <div className="flex justify-between items-center text-sm text-stone-600 border-b border-stone-200 pb-3">
          <span className="font-medium">
            Showing <strong className="text-stone-900 font-bold">{filteredChallenges.length}</strong> problem {filteredChallenges.length === 1 ? 'statement' : 'statements'}
            {selectedDomain !== 'All' && <span> in <strong className="text-[#063028] font-bold">{selectedDomain}</strong></span>}
          </span>
          {filteredChallenges.length > 0 && (
            <span className="text-xs text-stone-500 hidden sm:inline">
              Click on any card to view full technical specifications &amp; outcomes
            </span>
          )}
        </div>

        {/* Problem Statements Cards List */}
        {isLoading ? (
          <div className="space-y-5 animate-pulse" role="status" aria-label="Loading problem statements">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 h-52" />
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200/90 p-10 sm:p-14 text-center space-y-5 shadow-xs max-w-2xl mx-auto">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[#edf4f0] text-[#063028] flex items-center justify-center">
              <Building2 className="h-8 w-8 text-[#063028]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-stone-900 font-serif">No Problem Statements Published Yet</h3>
              <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed font-normal">
                Any organisation can submit an industry problem statement — no login needed. CII approves each one before it is published to partner institutions.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <Link
                to="/submit-problem"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#063028] text-white text-sm font-bold rounded-xl hover:bg-[#04201a] transition-all shadow-sm"
              >
                Post an Industry Challenge <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200/90 p-12 text-center space-y-4 shadow-sm">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Search className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 font-serif">No problem statements match your criteria</h3>
            <p className="text-sm text-stone-600 max-w-md mx-auto">
              Try adjusting your search query, clearing domain filters, or selecting &quot;All Domains&quot; to see all open challenges.
            </p>
            <div className="pt-2">
              <button
                onClick={clearFilters}
                className="px-5 py-2.5 bg-[#063028] text-white text-sm font-bold rounded-xl hover:bg-[#04201a] transition-all cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        ) : (
          // One wide row per problem, in the style of a MakeMyTrip flight result
          <div className="space-y-5">
            {filteredChallenges.map((challenge) => {
              const stated = challenge.additional.budget || challenge.additional.additionalNotes?.match(/Budget allocated:\s*([^.]+)/)?.[1]?.trim();
              return <ProblemRowCard key={challenge.id} problem={challenge} funding={stated || undefined} now={now} />;
            })}
          </div>
        )}

        {/* Challenge areas CII welcomes (moved here from the home page) */}
        <ChallengeAreasSection />

        {/* Bottom Industry Callout */}
        <div className="bg-[#063028] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <Cpu className="w-96 h-96" />
          </div>
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full border border-white/10">
              For Industry Leaders
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-serif leading-tight">
              Have an Engineering or R&amp;D Challenge in Your Enterprise?
            </h3>
            <p className="text-sm sm:text-base text-stone-300 leading-relaxed">
              Any organisation can submit an industrial problem statement — no login needed, and CII approves it before publishing. Our technical review committee pairs your challenge with top student and faculty innovation clusters across Indore and Bhopal.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                to="/submit-problem"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-[#063028] bg-[#c48825] hover:bg-[#b0781e] transition-all shadow-sm"
              >
                Submit a Problem Statement <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/institutions"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
              >
                View Academic Network
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
