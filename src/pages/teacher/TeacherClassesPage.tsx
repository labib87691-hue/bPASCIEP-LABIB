/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  ExternalLink,
  FileSpreadsheet,
  GraduationCap,
  Users,
} from 'lucide-react';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import { fetchTeacherClassOverviews } from '../../services/teacherService';
import { TeacherClassOverview } from '../../types/teacher';
import { SeoHead } from '../../components/common/SeoHead';

export const TeacherClassesPage: React.FC = () => {
  const { teacherProfile, canTeacher } = useTeacherAuth();
  const [classes, setClasses] = useState<TeacherClassOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!teacherProfile) return;
      try {
        const list = await fetchTeacherClassOverviews(teacherProfile);
        setClasses(list);
      } catch (err) {
        console.error('Error fetching classes:', err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [teacherProfile]);

  return (
    <div className="space-y-6">
      <SeoHead
        title="My Assigned Classes | BPSC Teacher Panel"
        description="View assigned teaching classes, verified student counts, and class schedules at BEPZA Public School and College."
      />

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#100261]" />
            <span>My Assigned Teaching Classes</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Classes and sections officially assigned to you by the School Administration.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#100261]/5 text-[#100261] border border-[#100261]/10 self-start sm:self-auto">
          {classes.length} Teaching Classes
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#100261]/20 border-t-[#100261] animate-spin" />
        </div>
      ) : classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => (
            <div
              key={cls.classCode}
              className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#100261] text-[#F0C94A]">
                    {cls.classCode}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {cls.studentCount} Students
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{cls.className}</h3>

                <div className="mt-3 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Sections:</span>
                    <span className="ml-1.5 font-semibold text-slate-700">
                      {cls.sections.join(', ')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium">Your Subjects:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {cls.subjects.length > 0 ? (
                        cls.subjects.map((s) => (
                          <span
                            key={s}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">All assigned subjects</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                <Link
                  to={`/teacher/students?class=${cls.classCode}`}
                  className="flex-1 text-center py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Students</span>
                </Link>

                {canTeacher('enter_marks') && (
                  <Link
                    to={`/teacher/results?class=${cls.classCode}`}
                    className="flex-1 text-center py-1.5 px-2 bg-[#100261] hover:bg-[#142863] text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Marks</span>
                  </Link>
                )}

                {canTeacher('take_attendance') && (
                  <Link
                    to={`/teacher/attendance?class=${cls.classCode}`}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                    title="Take Attendance"
                  >
                    <ClipboardCheck className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No Teaching Classes Assigned</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            You do not currently have any assigned classes. Please contact the Academic In-Charge or
            Administrator to assign teaching classes to your profile.
          </p>
        </div>
      )}
    </div>
  );
};
