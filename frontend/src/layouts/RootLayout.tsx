import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useNavigationType } from 'react-router-dom';
import { Menu, X, LogOut, Building, Factory, LayoutDashboard, Home, ChevronDown } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { CiiLogo } from '../components/CiiLogo';
import { Toast } from '../components/Toast';
import { FullScreenLoader } from '../components/common/Loader';
import { FooterSection } from '../components/landing/FooterSection';

type NavItem = { to: string; label: string; alsoActiveOn?: string[] };

// Desktop nav (shown from 1280px): tabs and buttons share one text size and one gap
const NAV_TEXT = 'text-[13px] 2xl:text-[15px]';
const NAV_GAP = 'gap-1.5 2xl:gap-2';
const navButtonClass = (look: string) =>
  `inline-flex items-center gap-1.5 px-2.5 py-1.5 2xl:px-3.5 2xl:py-2 ${NAV_TEXT} font-bold rounded-lg border transition-all whitespace-nowrap cursor-pointer shadow-2xs ${look}`;
const NAV_ICON = 'w-4 h-4 2xl:w-[18px] 2xl:h-[18px] text-[#c48825] shrink-0';

const desktopLinkClass = (active: boolean) =>
  `relative py-1.5 px-2 2xl:px-2.5 ${NAV_TEXT} font-semibold whitespace-nowrap transition-all cursor-pointer ${
    active
      ? 'text-[#063028] font-bold after:absolute after:bottom-0 after:left-2 after:right-2 2xl:after:left-2.5 2xl:after:right-2.5 after:h-[2px] after:bg-[#c48825] after:rounded-full'
      : 'text-stone-700 hover:text-[#063028]'
  }`;

const mobileLinkClass = (active: boolean) =>
  `w-full text-left block px-3.5 py-2.5 rounded-lg text-base font-semibold cursor-pointer transition-colors ${
    active ? 'text-[#063028] bg-[#edf4f0] font-bold' : 'text-stone-700 hover:bg-stone-50 hover:text-[#063028]'
  }`;

export const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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
      const target = e.target as HTMLElement;
      if (dropdownOpen && !target.closest('.profile-dropdown-container')) {
        setDropdownOpen(false);
      }
      if (exploreOpen && !target.closest('.explore-menu-container')) {
        setExploreOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExploreOpen(false);
    };
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [dropdownOpen, exploreOpen]);

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
    setExploreOpen(false);
  }, [location.pathname]);

  // Every link or button that navigates starts the page at its top — also when it points
  // to the page you're already on (each navigation has a new location.key). The browser's
  // own back/forward ("POP") keeps its position restore.
  const navigationType = useNavigationType();
  // A link with a section (like /#get-involved) scrolls to that section instead, once the
  // page has loaded it (pages download on demand, so wait for it, up to ~3 s).
  useEffect(() => {
    if (navigationType === 'POP') return;
    const sectionId = location.hash.slice(1);
    if (!sectionId) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return;
    }
    let cancelled = false;
    const scrollWhenReady = (attempt: number) => {
      if (cancelled) return;
      const el = document.getElementById(sectionId);
      if (el) {
        const nav = document.getElementById('platform-navbar');
        const navHeight = nav ? nav.offsetHeight : 72;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - navHeight - 16, behavior: 'smooth' });
      } else if (attempt < 30) {
        setTimeout(() => scrollWhenReady(attempt + 1), 100);
      }
    };
    scrollWhenReady(0);
    return () => {
      cancelled = true;
    };
  }, [location.key, location.hash, navigationType]);

  // Main tabs, then the "Explore" menu. Each opens its own page.
  const navItems: NavItem[] = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/ecosystem', label: 'Our Ecosystem' },
    { to: '/how-it-works', label: 'How It Works' },
    { to: '/problem-statements', label: 'Problem Statements', alsoActiveOn: ['/details'] },
    { to: '/events', label: 'Events' },
  ];
  const exploreItems: NavItem[] = [
    { to: '/services', label: 'Services' },
    { to: '/institutions', label: 'Institutions' },
    { to: '/opportunities', label: 'Opportunities' },
  ];

  const isNavActive = (item: NavItem) => {
    const path = location.pathname;
    if (item.to === '/') return path === '/';
    const prefixes = [item.to, ...(item.alsoActiveOn ?? [])];
    return prefixes.some((p) => path === p || path.startsWith(p + '/'));
  };
  const exploreActive = exploreItems.some(isNavActive);

  // Sign-out covers the screen with a loader until the server has ended the session, so the
  // page never shows a half-signed-out state (old header on the home page, or a flash of a
  // login screen from the dashboard's sign-in guard). Leave the dashboard first, then sign out.
  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
    // Keep the loader up briefly even on a fast server, so it doesn't just flicker
    await Promise.all([logout(), new Promise((resolve) => setTimeout(resolve, 600))]);
    setSigningOut(false);
    showToast('Signed out successfully.', 'info');
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


  return (
    <div className="min-h-screen bg-[#faf7f0] flex flex-col font-sans selection:bg-[#c48825]/20 selection:text-[#063028]">
      {signingOut && <FullScreenLoader label="Signing you out…" />}
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
                  {/* Hidden on laptop widths when the full nav shows, so the tabs fit on one line */}
                  <span className={`text-[9px] sm:text-[9.5px] text-stone-600 font-semibold tracking-wide mt-0.5 whitespace-nowrap ${showPublicNav ? 'xl:max-[1800px]:hidden' : ''}`}>
                    CII Student Innovation Challenge
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links - hidden on signed-in portal pages */}
            {showPublicNav && (
            <div className={`hidden xl:flex items-center justify-center flex-1 mx-3 ${NAV_GAP}`}>
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={isNavActive(item) ? 'page' : undefined}
                  className={desktopLinkClass(isNavActive(item))}
                >
                  {item.label}
                </Link>
              ))}

              {/* Explore: the less-used pages, in a small menu */}
              <div className="relative explore-menu-container">
                <button
                  type="button"
                  onClick={() => setExploreOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={exploreOpen}
                  className={`${desktopLinkClass(exploreActive)} inline-flex items-center gap-1`}
                >
                  Explore
                  <ChevronDown className={`h-4 w-4 transition-transform ${exploreOpen ? 'rotate-180' : ''}`} />
                </button>
                {exploreOpen && (
                  <div
                    role="menu"
                    className="absolute left-1/2 -translate-x-1/2 mt-2 w-52 bg-white border border-stone-200 rounded-xl shadow-lg p-1.5 z-50"
                  >
                    {exploreItems.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        role="menuitem"
                        onClick={() => setExploreOpen(false)}
                        className={`block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          isNavActive(item)
                            ? 'bg-[#edf4f0] text-[#063028] font-bold'
                            : 'text-stone-700 hover:bg-stone-50 hover:text-[#063028]'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Right side */}
            {!currentUser ? (
              <>
                {/* Desktop CTA buttons */}
                <div className={`hidden xl:flex items-center shrink-0 ${NAV_GAP}`}>
                  <Link
                    to="/institution/login"
                    className={navButtonClass('border-stone-800 text-[#063028] bg-transparent hover:bg-[#edf4f0]')}
                  >
                    <Building className={NAV_ICON} />
                    Institution Portal
                  </Link>
                  <Link
                    to="/industry/login"
                    className={navButtonClass('border-stone-800 text-stone-900 bg-transparent hover:bg-stone-50')}
                  >
                    <Factory className={NAV_ICON} />
                    Industry Login
                  </Link>
                  <Link
                    to="/submit-problem"
                    className={navButtonClass('border-[#063028] text-white bg-[#063028] hover:bg-[#04201a]')}
                  >
                    Submit a Problem
                  </Link>
                </div>

                {/* Mobile menu button */}
                <div className="flex items-center xl:hidden">
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
                <div className="flex items-center xl:hidden">
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
          <div className="xl:hidden fixed inset-0 z-50 bg-white flex flex-col h-[100dvh] w-screen animate-fade-in">
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
                  {navItems.map((item) => (
                    <Link key={item.to} to={item.to} className={mobileLinkClass(isNavActive(item))}>
                      {item.label}
                    </Link>
                  ))}
                  <p className="px-3.5 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-stone-400">Explore</p>
                  {exploreItems.map((item) => (
                    <Link key={item.to} to={item.to} className={mobileLinkClass(isNavActive(item))}>
                      {item.label}
                    </Link>
                  ))}

                  {!currentUser && (
                  <div className="border-t border-stone-200 my-3 pt-3 space-y-2.5 px-0.5">
                    <Link
                      to="/institution/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-base font-semibold border border-stone-800 text-[#063028] text-center hover:bg-[#edf4f0] transition-all cursor-pointer"
                    >
                      <Building className="w-4 h-4 text-[#c48825]" />
                      Institution Portal
                    </Link>
                    <Link
                      to="/industry/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-base font-semibold border border-stone-800 text-stone-900 text-center hover:bg-stone-50 transition-all cursor-pointer"
                    >
                      <Factory className="w-4 h-4 text-[#c48825]" />
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

      {/* Site footer on every public page (portal pages keep their own minimal layout) */}
      {!isPortalPage && <FooterSection />}

      {/* Global Toast component */}
      <Toast />
    </div>
  );
};

