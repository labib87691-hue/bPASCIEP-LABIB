/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  Clock,
  Cloud,
  FileSpreadsheet,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import { fetchTeacherNotices, fetchTeacherStudents } from '../../services/teacherService';
import { NoticeItem } from '../../types/school';
import { StudentRecord } from '../../types/result';
import { SeoHead } from '../../components/common/SeoHead';

export const TeacherDashboardPage: React.FC = () => {
  const { teacherProfile, canTeacher } = useTeacherAuth();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!teacherProfile) return;
      try {
        const [studentList, noticeList] = await Promise.all([
          fetchTeacherStudents(teacherProfile.assignedClasses),
          fetchTeacherNotices(),
        ]);
        setStudents(studentList);
        setNotices(noticeList.slice(0, 4));
      } catch (e) {
        console.error('Failed loading dashboard data:', e);
      } finally {
        setLoading(false);
      }
    }
    void loadDashboardData();
  }, [teacherProfile]);

  return (
    <div className="space-y-6">
      <SeoHead
        title="Teacher Dashboard | BEPZA Public School & College"
        description="Faculty portal dashboard for managing classes, entering exam marks, taking daily attendance, and accessing academic materials."
      />

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#100261] via-[#142863] to-[#1c3a8e] text-white rounded-2xl p-6 shadow-md border border-[#F0C94A]/30 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-[#F0C94A] text-[#100261] text-xs font-bold px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>FACULTY DASHBOARD</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Welcome, {teacherProfile?.fullName}
            </h1>
            <p className="text-xs text-white/80 max-w-xl">
              {teacherProfile?.designation || 'Faculty Member'} • ID: {teacherProfile?.teacherId}
              {teacherProfile?.isClassTeacher && teacherProfile.classTeacherOf && (
                <span className="ml-2 bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded font-medium">
                  Class Teacher ({teacherProfile.classTeacherOf.toUpperCase()})
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/teacher/profile"
              className="text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-lg transition-colors border border-white/20"
            >
              My Profile
            </Link>
            {canTeacher('enter_marks') && (
              <Link
                to="/teacher/results"
                className="text-xs font-semibold bg-[#F0C94A] hover:bg-[#e4be3e] text-[#100261] px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Enter Marks</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Assigned Classes */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">My Classes</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#100261] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {teacherProfile?.assignedClasses?.length || 0}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {teacherProfile?.assignedClasses?.map((cls) => (
              <span
                key={cls}
                className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700"
              >
                {cls}
              </span>
            ))}
          </div>
        </div>

        {/* Assigned Subjects */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">My Subjects</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {teacherProfile?.assignedSubjects?.length || 0}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {teacherProfile?.assignedSubjects?.slice(0, 3).map((sub) => (
              <span
                key={sub}
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 truncate max-w-[90px]"
                title={sub}
              >
                {sub}
              </span>
            ))}
          </div>
        </div>

        {/* Total Students */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Assigned Students</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {loading ? '...' : students.length}
          </p>
          <p className="mt-2 text-[11px] text-slate-500">Across assigned class sections</p>
        </div>

        {/* Attendance Access Status */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Attendance Portal</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-900 mt-2 flex items-center gap-1.5">
            {teacherProfile?.canTakeAttendance ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Authorized
              </span>
            ) : (
              <span className="text-slate-500">View Only</span>
            )}
          </p>
          <p className="mt-2 text-[11px] text-slate-500">
            {teacherProfile?.canTakeAttendance ? 'Can record daily attendance' : 'Contact admin for write role'}
          </p>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <span>Faculty Quick Tools</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/teacher/classes"
            className="p-3.5 rounded-lg border border-slate-200 hover:border-[#100261] hover:bg-slate-50 transition-all text-left group"
          >
            <BookOpen className="w-5 h-5 text-[#100261] mb-2" />
            <p className="text-xs font-bold text-slate-900 group-hover:text-[#100261]">My Classes</p>
            <p className="text-[10px] text-slate-500 mt-0.5">View classes & routines</p>
          </Link>

          {canTeacher('enter_marks') && (
            <Link
              to="/teacher/results"
              className="p-3.5 rounded-lg border border-slate-200 hover:border-[#100261] hover:bg-slate-50 transition-all text-left group"
            >
              <FileSpreadsheet className="w-5 h-5 text-indigo-600 mb-2" />
              <p className="text-xs font-bold text-slate-900 group-hover:text-[#100261]">Result Entry</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Submit draft exam marks</p>
            </Link>
          )}

          {canTeacher('take_attendance') && (
            <Link
              to="/teacher/attendance"
              className="p-3.5 rounded-lg border border-slate-200 hover:border-[#100261] hover:bg-slate-50 transition-all text-left group"
            >
              <ClipboardCheck className="w-5 h-5 text-emerald-600 mb-2" />
              <p className="text-xs font-bold text-slate-900 group-hover:text-[#100261]">Take Attendance</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Daily student log sheet</p>
            </Link>
          )}

          {canTeacher('access_cloud') && (
            <Link
              to="/teacher/cloud"
              className="p-3.5 rounded-lg border border-slate-200 hover:border-[#100261] hover:bg-slate-50 transition-all text-left group"
            >
              <Cloud className="w-5 h-5 text-sky-600 mb-2" />
              <p className="text-xs font-bold text-slate-900 group-hover:text-[#100261]">BPSC Cloud</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Syllabus, question papers</p>
            </Link>
          )}
        </div>
      </div>

      {/* Two Column Layout: Recent Notices & Assigned Classes Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Classes Quick View */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#100261]" />
              <span>Assigned Teaching Classes</span>
            </h2>
            <Link to="/teacher/classes" className="text-xs font-semibold text-[#100261] hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-2.5">
            {teacherProfile?.assignedClasses?.length ? (
              teacherProfile.assignedClasses.map((cls) => {
                const count = students.filter((s) => s.classCode === cls).length;
                return (
                  <div
                    key={cls}
                    className="p-3 rounded-lg border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 uppercase">{cls}</p>
                      <p className="text-[11px] text-slate-500">
                        {count} Verified Students • Sections: {teacherProfile.assignedSections.join(', ') || 'All'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/teacher/students?class=${cls}`}
                        className="text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
                      >
                        Students
                      </Link>
                      {canTeacher('enter_marks') && (
                        <Link
                          to={`/teacher/results?class=${cls}`}
                          className="text-[11px] font-semibold text-white bg-[#100261] hover:bg-[#142863] px-2 py-1 rounded"
                        >
                          Marks
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">
                No classes currently assigned. Contact administration.
              </p>
            )}
          </div>
        </div>

        {/* Recent Official Notices */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#100261]" />
              <span>Recent School Circulars</span>
            </h2>
            <Link to="/teacher/notices" className="text-xs font-semibold text-[#100261] hover:underline">
              All Notices
            </Link>
          </div>

          <div className="space-y-3">
            {notices.length ? (
              notices.map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-lg border border-slate-100 bg-[#F8FAFC] hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#100261]/10 text-[#100261]">
                      {n.category}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {n.publishDate}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-slate-800 mt-1 line-clamp-1">
                    {n.titleEn || n.titleBn}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                    {n.summaryEn || n.summaryBn}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No recent notices available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
