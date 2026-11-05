/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  Cloud,
  FileSpreadsheet,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react';
import { useTeacherAuth } from '../../context/TeacherAuthContext';

interface TeacherNavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: 'view_students' | 'access_cloud' | 'view_notices' | 'enter_marks' | 'take_attendance';
}

const NAV_ITEMS: TeacherNavItem[] = [
  { to: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/teacher/profile', label: 'My Profile', icon: User },
  { to: '/teacher/classes', label: 'My Classes', icon: BookOpen },
  { to: '/teacher/students', label: 'My Students', icon: Users, permission: 'view_students' },
  { to: '/teacher/notices', label: 'School Notices', icon: Bell, permission: 'view_notices' },
  { to: '/teacher/cloud', label: 'BPSC Cloud', icon: Cloud, permission: 'access_cloud' },
  { to: '/teacher/results', label: 'Result Entry', icon: FileSpreadsheet, permission: 'enter_marks' },
  { to: '/teacher/attendance', label: 'Attendance', icon: ClipboardCheck, permission: 'take_attendance' },
  { to: '/teacher/settings', label: 'Settings', icon: Settings },
];

export const TeacherLayout: React.FC = () => {
  const { teacherProfile, signOut, canTeacher } = useTeacherAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/teacher/login');
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#100261] text-white shadow-md border-b border-[#F0C94A]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/teacher/dashboard" className="flex items-center gap-3 group">
              <img
                src="https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=100&auto=format&fit=crop&q=80"
                alt="BPSC Logo"
                className="w-9 h-9 rounded-full object-cover border-2 border-[#F0C94A] shadow-xs"
              />
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-wide text-white">BPSC TEACHER PANEL</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F0C94A] text-[#100261]">
                    FACULTY
                  </span>
                </div>
                <p className="text-[11px] text-white/70 truncate max-w-xs">
                  BEPZA Public School & College, Ishwardi EPZ
                </p>
              </div>
            </Link>
          </div>

          {/* Right Header User & Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-white/10 transition-colors"
              title="Return to Public Website"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Public Website</span>
            </Link>

            <div className="h-5 w-px bg-white/20 hidden sm:block" />

            {teacherProfile && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-white truncate max-w-[150px]">
                    {teacherProfile.fullName}
                  </p>
                  <p className="text-[10px] text-[#F0C94A] font-medium truncate">
                    ID: {teacherProfile.teacherId} • {teacherProfile.teacherRole === 'class_teacher' ? 'Class Teacher' : 'Faculty'}
                  </p>
                </div>
                {teacherProfile.photoUrl ? (
                  <img
                    src={teacherProfile.photoUrl}
                    alt={teacherProfile.fullName}
                    className="w-8 h-8 rounded-full object-cover border border-[#F0C94A]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#142863] border border-[#F0C94A]/60 flex items-center justify-center text-xs font-bold text-[#F0C94A]">
                    {teacherProfile.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 text-xs font-medium text-white/80 hover:text-rose-200 p-2 rounded-md hover:bg-rose-950/40 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden sticky top-22">
            {/* Teacher Crest Profile Header */}
            <div className="p-4 bg-gradient-to-br from-[#100261] to-[#142863] text-white text-center border-b border-slate-200">
              <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-[#F0C94A] shadow-md mb-2 bg-[#100261] flex items-center justify-center">
                {teacherProfile?.photoUrl ? (
                  <img
                    src={teacherProfile.photoUrl}
                    alt={teacherProfile.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-[#F0C94A]" />
                )}
              </div>
              <h3 className="text-sm font-bold text-white truncate">{teacherProfile?.fullName}</h3>
              <p className="text-xs text-[#F0C94A] font-medium truncate">
                {teacherProfile?.designation || 'Faculty Member'}
              </p>
              <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded text-white/90">
                <ShieldCheck className="w-3 h-3 text-[#F0C94A]" />
                <span>ID: {teacherProfile?.teacherId}</span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="p-2 space-y-1">
              {NAV_ITEMS.map((item) => {
                if (item.permission && !canTeacher(item.permission)) {
                  return null;
                }
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-[#100261] text-white shadow-2xs'
                          : 'text-slate-600 hover:text-[#100261] hover:bg-slate-100'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[85%] bg-white h-full shadow-2xl flex flex-col z-10">
              <div className="p-4 bg-[#100261] text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">{teacherProfile?.fullName}</h3>
                  <p className="text-xs text-[#F0C94A]">{teacherProfile?.teacherId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                  if (item.permission && !canTeacher(item.permission)) {
                    return null;
                  }
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold ${
                          isActive
                            ? 'bg-[#100261] text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                    </NavLink>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Outlet */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
