import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  ChevronDown,
  Cloud,
  Globe,
  Menu,
  Search,
  X,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePublicData } from '../../context/PublicDataContext';

interface NavChild {
  labelBn: string;
  labelEn: string;
  to: string;
}

interface NavItem {
  key: string;
  labelBn: string;
  labelEn: string;
  to: string;
  icon?: 'cloud' | 'result';
  children?: NavChild[];
}

/**
 * Exact 9-item Final Main Navigation Structure (Phase 4):
 * 1. Home
 * 2. About Us
 * 3. Administration
 * 4. Teachers & Staff
 * 5. BPSC Cloud (/cloud, with Cloud icon)
 * 6. Result (/result, with BarChart3 icon)
 * 7. Gallery
 * 8. Admission
 * 9. Contact
 */
export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    key: 'home',
    labelBn: 'প্রচ্ছদ',
    labelEn: 'Home',
    to: '/',
  },
  {
    key: 'about',
    labelBn: 'পরিচিতি',
    labelEn: 'About Us',
    to: '/about',
    children: [
      { labelBn: 'প্রতিষ্ঠান পরিচিতি ও ইতিহাস', labelEn: 'About BPSC & History', to: '/about' },
      { labelBn: 'সুযোগ-সুবিধা', labelEn: 'Campus Facilities', to: '/facilities' },
      { labelBn: 'পরিবহন ব্যবস্থা', labelEn: 'School Transport', to: '/transport' },
      { labelBn: 'সংবাদ ও অনুষ্ঠানসমূহ', labelEn: 'News & Events', to: '/news' },
      { labelBn: 'নোটিশ ও অফিস আদেশ', labelEn: 'Notice Board', to: '/notices' },
    ],
  },
  {
    key: 'administration',
    labelBn: 'প্রশাসন',
    labelEn: 'Administration',
    to: '/administration',
    children: [
      { labelBn: 'প্রশাসন ও বাণীসমূহ', labelEn: 'Leadership & Messages', to: '/administration' },
      { labelBn: 'গভর্নিং বডি', labelEn: 'Governing Body', to: '/governing-body' },
    ],
  },
  {
    key: 'teachers',
    labelBn: 'শিক্ষক ও স্টাফ',
    labelEn: 'Teachers & Staff',
    to: '/teachers',
  },
  {
    key: 'cloud',
    labelBn: 'বিপিএসসি ক্লাউড',
    labelEn: 'BPSC Cloud',
    to: '/cloud',
    icon: 'cloud',
  },
  {
    key: 'result',
    labelBn: 'ফলাফল',
    labelEn: 'Result',
    to: '/result',
    icon: 'result',
  },
  {
    key: 'gallery',
    labelBn: 'গ্যালারি',
    labelEn: 'Gallery',
    to: '/gallery',
  },
  {
    key: 'admission',
    labelBn: 'ভর্তি',
    labelEn: 'Admission',
    to: '/admission',
  },
  {
    key: 'contact',
    labelBn: 'যোগাযোগ',
    labelEn: 'Contact',
    to: '/contact',
  },
];

interface HeaderProps {
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const { lang, toggleLang, t } = useLanguage();
  const { settings } = usePublicData();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenSearch();
      }
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onOpenSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSectionActive = (item: NavItem) => {
    if (item.to === '/') return pathname === '/';
    if (pathname === item.to || pathname.startsWith(`${item.to}/`)) return true;
    return item.children?.some((c) => pathname === c.to || pathname.startsWith(`${c.to}/`)) ?? false;
  };

  const renderNavIcon = (iconType?: 'cloud' | 'result', active?: boolean) => {
    if (!iconType) return null;
    const iconClass = `w-4 h-4 shrink-0 transition-colors ${
      active ? 'text-[#1F5FAF]' : 'text-[#1F5FAF] group-hover:text-[#1F5FAF]'
    }`;
    if (iconType === 'cloud') {
      return <Cloud className={iconClass} aria-hidden="true" />;
    }
    return <BarChart3 className={iconClass} aria-hidden="true" />;
  };

  const logoSrc = settings.logoUrl?.trim() || '/assets/branding/logo.jpeg';

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90"
    >
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-14 sm:h-16 lg:h-[68px] flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Identity */}
        <Link
          to="/"
          className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 xl:flex-initial focus-visible:outline-2 focus-visible:outline-[#1F5FAF] rounded-lg"
        >
          <img
            src={logoSrc}
            alt="BEPZA Public School and College Logo"
            referrerPolicy="no-referrer"
            className="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-full object-cover border border-slate-200 shrink-0"
          />
          <div className="min-w-0">
            <span className="block text-[13px] min-[390px]:text-[14px] sm:text-[15px] lg:text-base font-bold text-[#102B50] tracking-tight leading-snug truncate">
              {t(settings.schoolNameBn, settings.schoolNameEn)}
            </span>
            <span className="block text-[11px] sm:text-xs text-[#617187] leading-tight truncate">
              {t('ঈশ্বরদী ইপিজেড, পাকশী, পাবনা', 'Ishwardi EPZ, Paksey, Pabna')}
            </span>
          </div>
        </Link>

        {/* Desktop & Laptop 9-Item Main Navigation */}
        <nav
          aria-label="Primary Navigation"
          className="hidden xl:flex items-center gap-0.5 2xl:gap-1 shrink-0"
        >
          {MAIN_NAV_ITEMS.map((item) => {
            const active = isSectionActive(item);
            const isHighlightedPortal = item.icon === 'cloud' || item.icon === 'result';

            if (!item.children) {
              return (
                <NavLink
                  key={item.key}
                  to={item.to}
                  className={`group inline-flex items-center gap-1.5 px-2 2xl:px-2.5 py-2 text-[12.5px] 2xl:text-[13.5px] rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'text-[#1F5FAF] bg-[#1F5FAF]/[0.1] font-semibold'
                      : isHighlightedPortal
                      ? 'text-[#102B50] font-semibold bg-[#F6F8FC] hover:bg-[#1F5FAF]/[0.08] hover:text-[#1F5FAF] border border-slate-200/80'
                      : 'text-[#17263C] font-medium hover:text-[#1F5FAF] hover:bg-slate-100/80'
                  }`}
                >
                  {renderNavIcon(item.icon, active)}
                  <span>{t(item.labelBn, item.labelEn)}</span>
                </NavLink>
              );
            }

            const isOpen = openDropdown === item.key;
            return (
              <div
                key={item.key}
                className="relative"
                onMouseEnter={() => setOpenDropdown(item.key)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => setOpenDropdown(isOpen ? null : item.key)}
                  aria-expanded={isOpen}
                  className={`inline-flex items-center gap-1 px-2 2xl:px-2.5 py-2 text-[12.5px] 2xl:text-[13.5px] font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'text-[#1F5FAF] bg-[#1F5FAF]/[0.1] font-semibold'
                      : 'text-[#17263C] hover:text-[#1F5FAF] hover:bg-slate-100/80'
                  }`}
                >
                  <span>{t(item.labelBn, item.labelEn)}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                      isOpen ? 'rotate-180 text-[#1F5FAF]' : 'text-[#617187]'
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="absolute left-0 top-full pt-1.5 w-60 z-50">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 overflow-hidden">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          end={child.to === '/about' || child.to === '/administration'}
                          className={({ isActive }) =>
                            `block px-4 py-2.5 text-[13px] font-medium transition-colors ${
                              isActive
                                ? 'bg-[#F6F8FC] text-[#1F5FAF] font-semibold'
                                : 'text-[#17263C] hover:bg-[#F6F8FC] hover:text-[#1F5FAF]'
                            }`
                          }
                        >
                          {t(child.labelBn, child.labelEn)}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Action Controls: Search, Language Switcher, Hamburger Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label={t('অনুসন্ধান করুন', 'Search')}
            className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-slate-200 text-[#17263C] hover:text-[#1F5FAF] hover:border-[#1F5FAF]/40 hover:bg-[#F6F8FC] transition-colors"
            title={t('অনুসন্ধান (Ctrl+K)', 'Search (Ctrl+K)')}
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleLang}
            aria-label={t('Switch to English', 'বাংলায় পরিবর্তন করুন')}
            className="inline-flex items-center justify-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-3 rounded-lg border border-slate-200 bg-[#F6F8FC] hover:bg-slate-100 text-xs font-semibold text-[#102B50] transition-colors whitespace-nowrap shrink-0"
          >
            <Globe className="w-3.5 h-3.5 text-[#1F5FAF] shrink-0" />
            <span className="hidden min-[380px]:inline">
              {lang === 'bn' ? 'English' : 'বাংলা'}
            </span>
            <span className="min-[380px]:hidden">
              {lang === 'bn' ? 'EN' : 'বাং'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={t('মেনু খুলুন', 'Toggle navigation menu')}
            className="xl:hidden inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-slate-200 text-[#102B50] hover:bg-[#F6F8FC] transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Navigation Drawer */}
      {mobileOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white max-h-[calc(100dvh-3.5rem)] overflow-y-auto shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {/* Equal-Importance Portal Quick Buttons on Mobile/Tablet */}
            <div className="pb-3 mb-2 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link
                to="/cloud"
                className="flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs sm:text-sm font-semibold transition-colors"
              >
                <Cloud className="w-4 h-4 text-[#17A9C6] shrink-0" />
                <span>{t('বিপিএসসি ক্লাউড', 'BPSC Cloud')}</span>
              </Link>
              <Link
                to="/result"
                className="flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg border border-slate-200 bg-[#F6F8FC] hover:bg-slate-100 text-[#102B50] text-xs sm:text-sm font-semibold transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-[#1F5FAF] shrink-0" />
                <span>{t('ফলাফল পোর্টাল', 'Result')}</span>
              </Link>
            </div>

            {MAIN_NAV_ITEMS.map((item) => {
              const active = isSectionActive(item);
              if (!item.children) {
                return (
                  <NavLink
                    key={item.key}
                    to={item.to}
                    className={`flex items-center gap-2 min-h-[44px] px-3.5 py-2.5 rounded-lg text-sm font-medium ${
                      active
                        ? 'bg-[#F6F8FC] text-[#1F5FAF] font-semibold'
                        : 'text-[#17263C] hover:bg-[#F6F8FC]'
                    }`}
                  >
                    {renderNavIcon(item.icon, active)}
                    <span>{t(item.labelBn, item.labelEn)}</span>
                  </NavLink>
                );
              }

              const expanded = mobileExpanded === item.key;
              return (
                <div key={item.key} className="rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMobileExpanded(expanded ? null : item.key)}
                    aria-expanded={expanded}
                    className={`w-full flex items-center justify-between min-h-[44px] px-3.5 py-2.5 text-sm font-medium rounded-lg ${
                      active
                        ? 'bg-[#F6F8FC] text-[#1F5FAF] font-semibold'
                        : 'text-[#17263C] hover:bg-[#F6F8FC]'
                    }`}
                  >
                    <span>{t(item.labelBn, item.labelEn)}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {expanded && (
                    <div className="pl-4 pr-2 py-1 space-y-0.5 bg-[#F6F8FC]/70 rounded-b-lg">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          end={child.to === '/about' || child.to === '/administration'}
                          className={({ isActive }) =>
                            `flex items-center min-h-[40px] px-3 py-2 rounded-md text-xs sm:text-sm ${
                              isActive
                                ? 'text-[#1F5FAF] font-semibold bg-white'
                                : 'text-[#617187] hover:text-[#17263C]'
                            }`
                          }
                        >
                          {t(child.labelBn, child.labelEn)}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
