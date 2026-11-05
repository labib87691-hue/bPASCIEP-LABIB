import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Cloud,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  QrCode,
  Settings,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ADMIN_ROLE_METADATA } from '../../utils/adminPermissions';
import { AdminDashboardStats, AdminPermissionKey } from '../../types/admin';
import { fetchLiveAdminDashboardStats } from '../../services/adminService';
import { QrCodeGeneratorModal } from './QrCodeGeneratorModal';

interface AdminNavItem {
  to: string;
  label: string;
  permission: AdminPermissionKey;
  icon: React.ComponentType<{ className?: string }>;
}

const ADMIN_SIDEBAR_ITEMS: AdminNavItem[] = [
  {
    to: '/admin/dashboard',
    label: 'Dashboard',
    permission: 'view_dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/admin/website-content',
    label: 'Website Content',
    permission: 'manage_website_content',
    icon: Globe,
  },
  {
    to: '/admin/cloud',
    label: 'BPSC Cloud',
    permission: 'manage_cloud',
    icon: Cloud,
  },
  {
    to: '/admin/results',
    label: 'Result Management',
    permission: 'manage_results',
    icon: BarChart3,
  },
  {
    to: '/admin/teachers',
    label: 'Teachers & Staff',
    permission: 'manage_teachers',
    icon: Users,
  },
  {
    to: '/admin/students',
    label: 'Students & CSV',
    permission: 'manage_students',
    icon: GraduationCap,
  },
  {
    to: '/admin/notices',
    label: 'Notices & Orders',
    permission: 'manage_notices',
    icon: FileText,
  },
  {
    to: '/admin/news-events',
    label: 'News & Events',
    permission: 'manage_news_events',
    icon: Newspaper,
  },
  {
    to: '/admin/gallery',
    label: 'Photo Gallery',
    permission: 'manage_gallery',
    icon: ImageIcon,
  },
  {
    to: '/admin/holidays',
    label: 'Holidays & Calendar',
    permission: 'manage_holidays',
    icon: CalendarDays,
  },
  {
    to: '/admin/teacher-access',
    label: 'Teacher Access',
    permission: 'manage_teacher_access',
    icon: UserCheck,
  },
  {
    to: '/admin/contact-messages',
    label: 'Contact Messages',
    permission: 'manage_contact_messages',
    icon: Inbox,
  },
  {
    to: '/admin/settings',
    label: 'Settings & Roles',
    permission: 'manage_settings',
    icon: Settings,
  },
  {
    to: '/admin/activity-logs',
    label: 'Activity Logs',
    permission: 'view_activity_logs',
    icon: Activity,
  },
];

const ROUTE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Executive Dashboard',
  '/admin/website-content': 'Website Content Management',
  '/admin/cloud': 'BPSC Cloud Document Management',
  '/admin/results': 'Result & Examination Management',
  '/admin/teachers': 'Teachers & Staff Directory',
  '/admin/students': 'Student Registry & CSV Import',
  '/admin/notices': 'Notice & Office Order Management',
  '/admin/news-events': 'News & Events Management',
  '/admin/gallery': 'Photo Gallery Management',
  '/admin/holidays': 'Holiday & Institutional Calendar',
  '/admin/teacher-access': 'Teacher Access & Permissions (Phase 5)',
  '/admin/contact-messages': 'Contact Inquiries Inbox',
  '/admin/settings': 'School Settings, QR & Admin Roles',
  '/admin/activity-logs': 'Administrative Activity Logs',
};

export const AdminLayout: React.FC = () => {
  const { adminProfile, logoutAdmin, can } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [notifOpen, setNotifOpen] = useState<boolean>(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [quickStats, setQuickStats] = useState<AdminDashboardStats | null>(null);

  const notifRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMobileDrawerOpen(false);
    setNotifOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let active = true;
    fetchLiveAdminDashboardStats()
      .then((res) => {
        if (active) setQuickStats(res);
      })
      .catch(() => {
        // Non-blocking notification count fallback
      });
    return () => {
      active = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const visibleNavItems = ADMIN_SIDEBAR_ITEMS.filter((item) => can(item.permission));
  const currentTitle = ROUTE_TITLES[location.pathname] || 'Master Admin Panel';
  const roleLabel = adminProfile ? ADMIN_ROLE_METADATA[adminProfile.role].labelEn : 'Administrator';

  const totalActionableAlerts =
    (quickStats?.unreadContactMessages || 0) +
    (quickStats?.pendingResultApprovals || 0) +
    (quickStats?.pendingTeacherApprovals || 0);

  const handleLogout = async () => {
    await logoutAdmin();
    navigate('/admin/login', { replace: true });
  };

  const renderSidebarLinks = (isMobile = false) => (
    <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5" aria-label="Admin Navigation">
      {visibleNavItems.map((item) => {
        const Icon = item.icon;
        const badgeCount =
          item.to === '/admin/contact-messages'
            ? quickStats?.unreadContactMessages || 0
            : item.to === '/admin/results'
            ? quickStats?.pendingResultApprovals || 0
            : item.to === '/admin/teacher-access'
            ? quickStats?.pendingTeacherApprovals || 0
            : 0;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed && !isMobile ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center justify-between gap-2.5 min-h-[40px] px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-[#102B50] text-white font-semibold'
                  : 'text-[#17263C] hover:bg-[#F6F8FC] hover:text-[#1F5FAF]'
              }`
            }
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className="w-4 h-4 shrink-0" />
              {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
            </div>
            {(!collapsed || isMobile) && badgeCount > 0 && (
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#17A9C6]/20 text-[#102B50] bg-white/90 tabular-nums shrink-0">
                {badgeCount}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#17263C] flex">
      {/* Desktop Collapsible Left Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-slate-200 shrink-0 transition-all duration-200 sticky top-0 h-screen ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <div className="h-16 px-3.5 border-b border-slate-200 flex items-center justify-between gap-2">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5 min-w-0">
            <img
              src="/assets/branding/logo.jpeg"
              alt="BPSC Logo"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
            />
            {!collapsed && (
              <div className="min-w-0">
                <span className="block text-sm font-bold text-[#102B50] truncate leading-tight">
                  BPSC Admin
                </span>
                <span className="block text-[11px] text-[#617187] truncate">
                  Ishwardi EPZ · 140336
                </span>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg text-[#617187] hover:text-[#102B50] hover:bg-slate-100 shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {renderSidebarLinks(false)}

        <div className="p-3 border-t border-slate-200 space-y-1.5">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Public Website"
            className="flex items-center gap-2.5 min-h-[38px] px-3 py-2 rounded-lg text-xs font-semibold text-[#1F5FAF] hover:bg-[#F6F8FC] transition-colors"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">Public Website</span>}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out"
            className="w-full flex items-center gap-2.5 min-h-[38px] px-3 py-2 rounded-lg text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-[#102B50]/60 backdrop-blur-xs flex"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <aside
            className="w-72 max-w-[85vw] bg-white h-full flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src="/assets/branding/logo.jpeg"
                  alt="BPSC Logo"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#102B50] truncate">BPSC Master Admin</div>
                  <div className="text-[11px] text-[#617187] truncate">{roleLabel}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close drawer"
                className="p-1.5 rounded-lg text-[#617187] hover:text-[#102B50]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderSidebarLinks(true)}

            <div className="p-3 border-t border-slate-200 flex items-center justify-between gap-2">
              <Link
                to="/"
                className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-lg border border-slate-200 text-xs font-semibold text-[#102B50]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Website</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-lg bg-red-50 text-xs font-semibold text-red-700"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header with Breadcrumbs, QR Trigger, Notification Indicator & Profile Menu */}
        <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open admin navigation"
              className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-[#102B50] hover:bg-[#F6F8FC] shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <nav aria-label="Breadcrumb" className="text-[11px] text-[#617187] flex items-center gap-1.5">
                <Link to="/admin/dashboard" className="hover:text-[#1F5FAF]">
                  Master Admin
                </Link>
                <span aria-hidden="true">/</span>
                <span className="text-[#102B50] font-medium truncate">{currentTitle}</span>
              </nav>
              <h1 className="text-sm sm:text-base font-bold text-[#102B50] truncate">
                {currentTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {can('generate_qr') && (
              <button
                type="button"
                onClick={() => setQrModalOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg border border-slate-200 bg-[#F6F8FC] hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50] transition-colors"
                title="Generate Institutional QR Code"
              >
                <QrCode className="w-4 h-4 text-[#1F5FAF]" />
                <span className="hidden sm:inline">QR Code</span>
              </button>
            )}

            {/* Notification Indicator */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                aria-label="Actionable notifications"
                className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-[#17263C] hover:border-[#1F5FAF] hover:bg-[#F6F8FC] transition-colors"
              >
                <Bell className="w-4 h-4" />
                {totalActionableAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#1F5FAF] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {totalActionableAlerts > 99 ? '99+' : totalActionableAlerts}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#102B50]">Pending Actions</span>
                    <span className="text-[11px] text-[#617187] tabular-nums">
                      {totalActionableAlerts} items
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    <Link
                      to="/admin/results"
                      className="flex items-center justify-between px-4 py-3 hover:bg-[#F6F8FC]"
                    >
                      <span className="text-[#17263C]">Submitted Results Awaiting Review</span>
                      <strong className="text-[#1F5FAF] tabular-nums">
                        {quickStats?.pendingResultApprovals || 0}
                      </strong>
                    </Link>
                    <Link
                      to="/admin/teacher-access"
                      className="flex items-center justify-between px-4 py-3 hover:bg-[#F6F8FC]"
                    >
                      <span className="text-[#17263C]">Pending Teacher Access Requests</span>
                      <strong className="text-[#1F5FAF] tabular-nums">
                        {quickStats?.pendingTeacherApprovals || 0}
                      </strong>
                    </Link>
                    <Link
                      to="/admin/contact-messages"
                      className="flex items-center justify-between px-4 py-3 hover:bg-[#F6F8FC]"
                    >
                      <span className="text-[#17263C]">Unread Contact Messages</span>
                      <strong className="text-[#1F5FAF] tabular-nums">
                        {quickStats?.unreadContactMessages || 0}
                      </strong>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 h-9 px-2.5 rounded-lg border border-slate-200 hover:border-[#1F5FAF] bg-white transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-[#102B50] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {(adminProfile?.displayName || adminProfile?.email || 'A')
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div className="hidden md:block text-left max-w-[140px]">
                  <div className="text-xs font-semibold text-[#102B50] truncate leading-tight">
                    {adminProfile?.displayName || 'Administrator'}
                  </div>
                  <div className="text-[10px] text-[#617187] truncate leading-tight">
                    {roleLabel}
                  </div>
                </div>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <div className="text-xs font-bold text-[#102B50] truncate">
                      {adminProfile?.displayName}
                    </div>
                    <div className="text-[11px] text-[#617187] truncate">
                      {adminProfile?.email}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-[#1F5FAF]">
                      Role: {roleLabel}
                    </div>
                  </div>
                  <div className="py-1 text-xs">
                    {can('manage_settings') && (
                      <Link
                        to="/admin/settings"
                        className="block px-4 py-2 text-[#17263C] hover:bg-[#F6F8FC]"
                      >
                        School Settings & Roles
                      </Link>
                    )}
                    <Link
                      to="/admin/activity-logs"
                      className="block px-4 py-2 text-[#17263C] hover:bg-[#F6F8FC]"
                    >
                      Activity Audit Logs
                    </Link>
                    <Link
                      to="/"
                      className="block px-4 py-2 text-[#17263C] hover:bg-[#F6F8FC]"
                    >
                      Return to Public Website
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-700 font-semibold hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Workspace Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <QrCodeGeneratorModal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} />
    </div>
  );
};
