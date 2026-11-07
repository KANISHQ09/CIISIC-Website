import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Building, LayoutDashboard, Home, ChevronDown } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { CiiLogo } from '../components/CiiLogo';
import { Toast } from '../components/Toast';

export const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownOpen && !(e.target as HTMLElement).closest('.profile-dropdown-container')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [dropdownOpen]);

  // Lock body scroll when mobile menu is open & close on route changes
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { id: 'hero', label: 'Home' },
    { id: 'about-ciisic', label: 'About CIISIC' },
    { id: 'services', label: 'Services' },
    { id: 'partner-institutions', label: 'Institutions' },
    { id: 'problem-statements', label: 'Problem Statements' },
    { id: 'our-ecosystem', label: 'Our Ecosystem' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'get-involved', label: 'Get Involved' },
  ];

  const isNavActive = (id: string) => {
    if (id === 'services' && location.pathname === '/services') return true;
    if (id === 'partner-institutions' && location.pathname === '/institutions') return true;
    if (
      id === 'problem-statements' &&
      (location.pathname === '/problem-statements' || location.pathname.startsWith('/details'))
    ) {
      return true;
    }
    if (location.pathname === '/') {
      return activeSection === id;
    }
    return false;
  };

  // Active section scroll highlighter
  useEffect(() => {
    if (location.pathname === '/services') {
      setActiveSection('services');
      return;
    }
    if (location.pathname === '/institutions') {
      setActiveSection('partner-institutions');
      return;
    }
    if (location.pathname === '/problem-statements' || location.pathname.startsWith('/details')) {
      setActiveSection('problem-statements');
      return;
    }

    const handleScroll = () => {
      const sections = [
        'hero',
        'about-ciisic',
        'services',
        'partner-institutions',
        'problem-statements',
        'our-ecosystem',
        'how-it-works',
        'get-involved',
      ];

      // If scrolled to very bottom of document (within 60px), activate last section
      const isBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60;
      if (isBottom) {
        setActiveSection('get-involved');
        return;
      }

      // If near top of page, activate hero
      if (window.scrollY < 80) {
        setActiveSection('hero');
        return;
      }

      const navOffset = 110;
      let currentSection = 'hero';

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.getBoundingClientRect().top;
          if (top <= navOffset) {
            currentSection = section;
          }
        }
      }

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Run immediately to sync on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    showToast('Signed out successfully.', 'info');
    navigate('/');
    setMobileMenuOpen(false);
  };

  // Signed-in users get a minimal header: logo + profile menu only
  const dashboardPath = !currentUser
    ? '/'
    : currentUser.role === 'admin'
    ? '/admin/dashboard'
    : currentUser.role === 'institution'
    ? '/institution/dashboard'
    : '/industry/dashboard';
  const isOnDashboard = !!currentUser && location.pathname.startsWith(dashboardPath);
  // Portal pages (dashboards, logins, solution forms) get the minimal header;
  // public pages (home, services, problem statements, ...) keep the site navigation.
  const isPortalPage = /^\/(admin|industry|institution)(\/|$)/.test(location.pathname);
  const showPublicNav = !currentUser || !isPortalPage;
  const roleLabel = !currentUser
    ? ''
    : currentUser.role === 'admin'
    ? 'CII Admin'
    : currentUser.role === 'institution'
    ? 'Institution SPOC'
    : 'Industry Partner';
  const organisationLabel = !currentUser
    ? ''
    : currentUser.role === 'admin'
    ? 'Confederation of Indian Industry'
    : currentUser.role === 'institution'
    ? currentUser.institutionName || ''
    : currentUser.companyName || '';

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    
    if (sectionId === 'partner-institutions' && location.pathname === '/institutions') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (sectionId === 'services' && location.pathname === '/services') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (sectionId === 'problem-statements' && (location.pathname === '/problem-statements' || location.pathname.startsWith('/details'))) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const scrollToSection = (id: string) => {
      const el = document.getElementById(id);
      if (el) {
        const navElement = document.getElementById('platform-navbar');
        const navHeight = navElement ? navElement.offsetHeight : 72;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navHeight - 16;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    };

    if (location.pathname !== '/') {
      navigate('/');
      // Wait a moment for the page to transition, then scroll
      setTimeout(() => {
        scrollToSection(sectionId);
      }, 150);
    } else {
      scrollToSection(sectionId);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f0] flex flex-col font-sans selection:bg-[#c48825]/20 selection:text-[#063028]">
      {/* Sticky Premium Navbar - Full Width & Adaptive */}
      <nav id="platform-navbar" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e8e4dc] shadow-xs w-full">
        <div className="w-full px-3 sm:px-5 lg:px-4 xl:px-6 2xl:px-8">
          <div className="flex justify-between items-center h-15 sm:h-16 w-full">
            {/* Logo and Brand */}
            <div className="flex items-center shrink-0 pr-1.5 lg:pr-2 xl:pr-3">
              <Link to={currentUser ? dashboardPath : '/'} className="shrink-0 flex items-center gap-2 sm:gap-2.5">
                <CiiLogo size="sm" />
                <div className="flex flex-col justify-center leading-tight">
                  <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#063028] font-serif">
                    CIISIC
                  </span>
                  <span className="text-[9px] sm:text-[9.5px] text-stone-600 font-semibold tracking-wide mt-0.5 whitespace-nowrap">
                    CII Student Innovation Challenge
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links - hidden on signed-in portal pages */}
            {showPublicNav && (
            <div className="hidden lg:flex items-center justify-center flex-1 mx-1 xl:mx-2 space-x-0.5 xl:space-x-1">
              {navItems.map((item) => {
                const active = isNavActive(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`relative py-1.5 px-1.5 xl:px-2 2xl:px-2.5 text-[11px] xl:text-[11.5px] 2xl:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      active
                        ? 'text-[#063028] font-bold after:absolute after:bottom-0 after:left-1.5 after:right-1.5 xl:after:left-2 xl:after:right-2 after:h-[2px] after:bg-[#c48825] after:rounded-full'
                        : 'text-stone-700 hover:text-[#063028]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            )}

            {/* Right side */}
            {!currentUser ? (
              <>
                {/* Desktop CTA buttons */}
                <div className="hidden lg:flex items-center space-x-1 xl:space-x-1.5 shrink-0 pl-1 xl:pl-2">
                  <Link
                    to="/institution/login"
                    className="px-2 xl:px-2.5 py-1.5 border border-[#063028]/25 text-[#063028] bg-transparent hover:bg-[#edf4f0] text-[11px] xl:text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer shadow-2xs flex items-center gap-1"
                  >
                    <Building className="w-3.5 h-3.5 text-[#c48825]" />
                    Institution Portal
                  </Link>
                  <Link
                    to="/industry/login"
                    className="px-2 xl:px-2.5 py-1.5 border border-stone-800 text-stone-900 bg-transparent hover:bg-stone-50 text-[11px] xl:text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer shadow-2xs"
                  >
                    Industry Login
                  </Link>
                  <Link
                    to="/submit-problem"
                    className="px-2 xl:px-2.5 py-1.5 border border-[#063028] text-white bg-[#063028] hover:bg-[#04201a] text-[11px] xl:text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer shadow-2xs"
                  >
                    Submit a Problem
                  </Link>
                </div>

                {/* Mobile menu button */}
                <div className="flex items-center lg:hidden">
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="inline-flex items-center justify-center p-2 rounded-lg text-stone-600 hover:text-[#063028] hover:bg-stone-100 transition-colors cursor-pointer"
                    aria-expanded={mobileMenuOpen}
                  >
                    <span className="sr-only">Open main menu</span>
                    {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                  </button>
                </div>
              </>
            ) : (
              /* Signed in: profile menu (no login buttons); site menu on public pages for mobile */
              <div className="flex items-center gap-1.5 shrink-0">
              {showPublicNav && (
                <div className="flex items-center lg:hidden">
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="inline-flex items-center justify-center p-2 rounded-lg text-stone-600 hover:text-[#063028] hover:bg-stone-100 transition-colors cursor-pointer"
                    aria-expanded={mobileMenuOpen}
                  >
                    <span className="sr-only">Open main menu</span>
                    {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                  </button>
                </div>
              )}
              <div className="relative profile-dropdown-container shrink-0">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-haspopup="menu"
                  aria-expanded={dropdownOpen}
                  className="flex items-center gap-2 pl-1 pr-2 sm:pr-3 py-1 rounded-full border border-stone-200 hover:border-[#063028]/40 hover:bg-stone-50 transition-all cursor-pointer select-none"
                >
                  <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#063028] text-white flex items-center justify-center font-extrabold text-xs sm:text-sm uppercase shadow-sm">
                    {getInitials(currentUser.name)}
                  </span>
                  <span className="hidden sm:flex flex-col items-start leading-tight max-w-[180px]">
                    <span className="text-sm font-bold text-stone-900 truncate max-w-full">{currentUser.name}</span>
                    <span className="text-[11px] font-semibold text-[#c48825] uppercase tracking-wide">{roleLabel}</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 text-stone-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white text-stone-800 rounded-xl shadow-xl border border-stone-200/80 py-1.5 z-[100] origin-top-right divide-y divide-stone-100 animate-fade-in"
                  >
                    {/* Who is signed in */}
                    <div className="px-4 py-3 bg-stone-50/70">
                      <p className="font-extrabold text-stone-900 truncate text-sm">{currentUser.name}</p>
                      <p className="text-xs text-[#063028] font-bold uppercase tracking-wider mt-0.5">{roleLabel}</p>
                      {organisationLabel && (
                        <p className="text-xs text-stone-600 font-medium truncate mt-0.5">{organisationLabel}</p>
                      )}
                      <p className="text-xs text-stone-500 truncate mt-1">{currentUser.email}</p>
                    </div>

                    {/* Switch between the dashboard and the public site */}
                    <div className="p-1.5">
                      {isOnDashboard ? (
                        <Link
                          to="/"
                          role="menuitem"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2.5 font-bold text-sm text-stone-700 hover:bg-stone-50 hover:text-[#063028] rounded-lg transition-all"
                        >
                          <Home className="h-4 w-4 text-stone-400 shrink-0" />
                          <span>Return to Home</span>
                        </Link>
                      ) : (
                        <Link
                          to={dashboardPath}
                          role="menuitem"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2.5 font-bold text-sm text-stone-700 hover:bg-stone-50 hover:text-[#063028] rounded-lg transition-all"
                        >
                          <LayoutDashboard className="h-4 w-4 text-stone-400 shrink-0" />
                          <span>Back to Dashboard</span>
                        </Link>
                      )}
                    </div>

                    {/* Sign out */}
                    <div className="p-1.5">
                      <button
                        role="menuitem"
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 font-bold text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all text-left cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 text-red-500 shrink-0" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile full-screen menu overlay */}
        {mobileMenuOpen && showPublicNav && (
          <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col h-[100dvh] w-screen animate-fade-in">
            {/* Mobile Header with Logo & Close Button */}
            <div className="flex justify-between items-center h-15 sm:h-16 px-3 sm:px-5 border-b border-stone-200 bg-white shrink-0">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="shrink-0 flex items-center gap-2 sm:gap-2.5"
              >
                <CiiLogo size="sm" />
                <div className="flex flex-col justify-center leading-tight">
                  <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#063028] font-serif">
                    CIISIC
                  </span>
                  <span className="text-[9px] sm:text-[9.5px] text-stone-600 font-semibold tracking-wide mt-0.5 whitespace-nowrap">
                    CII Student Innovation Challenge
                  </span>
                </div>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-stone-600 hover:text-[#063028] hover:bg-stone-100 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Scrollable Nav Content - Full screen height coverage */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-12 space-y-1 sm:px-6 bg-white">
              {(
                <>
                  {navItems.map((item) => {
                    const active = isNavActive(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full text-left block px-3.5 py-2.5 rounded-lg text-base font-semibold cursor-pointer transition-colors ${
                          active
                            ? 'text-[#063028] bg-[#edf4f0] font-bold'
                            : 'text-stone-700 hover:bg-stone-50 hover:text-[#063028]'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}

                  {!currentUser && (
                  <div className="border-t border-stone-200 my-3 pt-3 space-y-2.5 px-0.5">
                    <Link
                      to="/institution/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-base font-semibold border border-[#063028]/30 text-[#063028] text-center hover:bg-[#edf4f0] transition-all cursor-pointer"
                    >
                      <Building className="w-4 h-4 text-[#c48825]" />
                      Institution Portal
                    </Link>
                    <Link
                      to="/industry/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full py-2.5 rounded-lg text-base font-semibold border border-stone-800 text-stone-900 text-center hover:bg-stone-50 transition-all cursor-pointer"
                    >
                      Industry Login
                    </Link>
                    <Link
                      to="/submit-problem"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full py-2.5 rounded-lg text-base font-semibold bg-[#063028] text-white text-center hover:bg-[#04201a] transition-all cursor-pointer shadow-xs"
                    >
                      Submit a Problem
                    </Link>
                  </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Container */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Global Toast component */}
      <Toast />
    </div>
  );
};

