/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Save,
  ShieldAlert,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import {
  fetchAttendanceRecord,
  fetchTeacherStudents,
  saveAttendanceRecord,
} from '../../services/teacherService';
import { StudentRecord, SupportedClassCode } from '../../types/result';
import { SUPPORTED_RESULT_CLASSES } from '../../data/resultPortalSeedData';
import { AttendanceStatus } from '../../types/teacher';
import { SeoHead } from '../../components/common/SeoHead';

export const TeacherAttendancePage: React.FC = () => {
  const { teacherProfile, canTeacher } = useTeacherAuth();
  const [searchParams] = useSearchParams();

  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedClass, setSelectedClass] = useState<SupportedClassCode>(
    (searchParams.get('class') as SupportedClassCode) ||
      ((teacherProfile?.assignedClasses?.[0] as SupportedClassCode) || 'class-6')
  );
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [remarks, setRemarks] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canTakeAttendance = canTeacher('take_attendance');

  // Load students and existing attendance
  useEffect(() => {
    async function loadData() {
      if (!selectedClass || !teacherProfile) return;
      setLoading(true);
      setFeedback(null);
      try {
        const [studentList, existing] = await Promise.all([
          fetchTeacherStudents([selectedClass]),
          fetchAttendanceRecord('2026', selectedClass, selectedSection, selectedDate),
        ]);

        const filtered = selectedSection === 'all'
          ? studentList
          : studentList.filter((s) => !s.section || s.section === selectedSection);

        setStudents(filtered);

        if (existing) {
          setAttendanceMap(existing.studentAttendance);
          setRemarks(existing.remarks || '');
        } else {
          // Default all to 'present'
          const defaultMap: Record<string, AttendanceStatus> = {};
          filtered.forEach((s) => {
            defaultMap[s.id] = 'present';
          });
          setAttendanceMap(defaultMap);
          setRemarks('');
        }
      } catch (err) {
        console.error('Error loading attendance data:', err);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [selectedClass, selectedSection, selectedDate, teacherProfile]);

  const setStatusForStudent = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const markAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
  };

  // Metrics
  const totalStudents = students.length;
  const presentCount = Object.values(attendanceMap).filter((s) => s === 'present').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'absent').length;
  const lateCount = Object.values(attendanceMap).filter((s) => s === 'late').length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  const handleSaveAttendance = async () => {
    if (!teacherProfile) return;
    if (!canTakeAttendance) {
      setFeedback({ type: 'error', message: 'You do not have permission to take attendance.' });
      return;
    }
    setSaving(true);
    setFeedback(null);

    const recordId = `2026_${selectedClass}_${selectedSection || 'all'}_${selectedDate}`;
    try {
      await saveAttendanceRecord({
        id: recordId,
        academicYearId: '2026',
        classCode: selectedClass,
        className: SUPPORTED_RESULT_CLASSES.find((c) => c.classCode === selectedClass)?.nameEn || selectedClass,
        section: selectedSection,
        date: selectedDate,
        teacherUid: teacherProfile.uid,
        teacherId: teacherProfile.teacherId,
        teacherName: teacherProfile.fullName,
        studentAttendance: attendanceMap,
        totalStudents,
        presentCount,
        absentCount,
        lateCount,
        remarks,
      });

      setFeedback({
        type: 'success',
        message: `Attendance for ${selectedClass.toUpperCase()} (${selectedDate}) saved successfully.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save attendance',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SeoHead
        title="Student Daily Attendance | BPSC Teacher Panel"
        description="Daily classroom student attendance management portal for teachers at BEPZA Public School and College."
      />

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#100261]" />
            <span>Daily Student Attendance Sheet</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Record, verify, and finalize daily attendance for assigned classroom sections.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {presentCount}/{totalStudents} Present ({attendanceRate}%)
          </span>
        </div>
      </div>

      {!canTakeAttendance && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-xs text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Attendance Write Permission Required:</span> Your profile is in
            read-only mode for student attendance. Contact School Administration if you need write access.
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Selector Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Class Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Teaching Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value as SupportedClassCode)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#100261]"
            >
              {teacherProfile?.assignedClasses?.map((cls) => (
                <option key={cls} value={cls}>
                  {cls.toUpperCase()} ({SUPPORTED_RESULT_CLASSES.find((c) => c.classCode === cls)?.nameEn || cls})
                </option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#100261]"
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="all">All Sections</option>
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Attendance Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#100261]"
            />
          </div>
        </div>
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 text-center">
          <p className="text-[11px] font-semibold text-slate-500">Total Enrolled</p>
          <p className="text-xl font-black text-slate-900 mt-1">{totalStudents}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 text-center">
          <p className="text-[11px] font-semibold text-emerald-600">Present</p>
          <p className="text-xl font-black text-emerald-700 mt-1">{presentCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 text-center">
          <p className="text-[11px] font-semibold text-rose-600">Absent</p>
          <p className="text-xl font-black text-rose-700 mt-1">{absentCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 text-center">
          <p className="text-[11px] font-semibold text-amber-600">Late</p>
          <p className="text-xl font-black text-amber-700 mt-1">{lateCount}</p>
        </div>
      </div>

      {/* Student Attendance List */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {selectedClass.toUpperCase()} — Section {selectedSection} ({selectedDate})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canTakeAttendance}
              onClick={() => markAll('present')}
              className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded transition-colors disabled:opacity-40"
            >
              Mark All Present
            </button>
            <button
              type="button"
              disabled={!canTakeAttendance}
              onClick={() => markAll('absent')}
              className="py-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded transition-colors disabled:opacity-40"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#100261]/20 border-t-[#100261] animate-spin" />
          </div>
        ) : students.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {students.map((student) => {
              const currentStatus = attendanceMap[student.id] || 'present';
              return (
                <div
                  key={student.id}
                  className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-slate-100 font-bold text-xs text-[#100261] flex items-center justify-center shrink-0">
                      {student.rollNumber}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{student.fullNameEn}</p>
                      <p className="text-[11px] text-slate-500">
                        Roll: {student.rollNumber} • Section: {student.section || 'General'}
                      </p>
                    </div>
                  </div>

                  {/* Status Toggle Radios */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={!canTakeAttendance}
                      onClick={() => setStatusForStudent(student.id, 'present')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                        currentStatus === 'present'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      P
                    </button>

                    <button
                      type="button"
                      disabled={!canTakeAttendance}
                      onClick={() => setStatusForStudent(student.id, 'absent')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                        currentStatus === 'absent'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      A
                    </button>

                    <button
                      type="button"
                      disabled={!canTakeAttendance}
                      onClick={() => setStatusForStudent(student.id, 'late')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                        currentStatus === 'late'
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      L
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold">No students found for this class section.</p>
          </div>
        )}

        {/* Remarks & Save */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Class Notes / Absence Remarks (Optional)
            </label>
            <input
              type="text"
              disabled={!canTakeAttendance}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. 2 students absent with medical leave application..."
              className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#100261]"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving || !canTakeAttendance || students.length === 0}
              onClick={handleSaveAttendance}
              className="py-2 px-5 bg-[#100261] hover:bg-[#142863] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save & Submit Attendance'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
