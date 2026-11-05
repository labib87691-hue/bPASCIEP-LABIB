/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Save,
  Send,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import {
  fetchTeacherMarkSubmissions,
  fetchTeacherStudents,
  saveTeacherMarkSubmission,
} from '../../services/teacherService';
import { fetchAllExaminationsForAdmin } from '../../services/resultManagementService';
import {
  ExaminationRecord,
  StudentRecord,
  SupportedClassCode,
} from '../../types/result';
import { SUPPORTED_RESULT_CLASSES } from '../../data/resultPortalSeedData';
import { TeacherMarkSubmissionRecord } from '../../types/teacher';
import { SeoHead } from '../../components/common/SeoHead';

interface StudentMarkRow {
  studentId: string;
  rollNumber: string;
  studentName: string;
  writtenMarks: number;
  mcqMarks: number;
  practicalMarks: number;
  obtainedMarks: number;
  isAbsent: boolean;
}

export const TeacherResultsPage: React.FC = () => {
  const { teacherProfile, canTeacher } = useTeacherAuth();
  const [searchParams] = useSearchParams();

  const [exams, setExams] = useState<ExaminationRecord[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [existingSubmissions, setExistingSubmissions] = useState<TeacherMarkSubmissionRecord[]>([]);

  // Selection state
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClass, setSelectedClass] = useState<SupportedClassCode>(
    (searchParams.get('class') as SupportedClassCode) ||
      ((teacherProfile?.assignedClasses?.[0] as SupportedClassCode) || 'class-6')
  );
  const [selectedSubject, setSelectedSubject] = useState<string>(
    teacherProfile?.assignedSubjects?.[0] || 'English'
  );

  // Mark table state
  const [markRows, setMarkRows] = useState<StudentMarkRow[]>([]);
  const [fullMarks, setFullMarks] = useState(100);
  const [passMarks, setPassMarks] = useState(33);

  // Status & UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canEnter = canTeacher('enter_marks');
  const canSubmit = canTeacher('submit_results');

  // Load examinations and submissions
  useEffect(() => {
    async function init() {
      if (!teacherProfile) return;
      try {
        const [examList, subs] = await Promise.all([
          fetchAllExaminationsForAdmin(),
          fetchTeacherMarkSubmissions(teacherProfile.uid),
        ]);
        setExams(examList);
        setExistingSubmissions(subs);
        if (examList.length > 0) {
          setSelectedExamId(examList[0].id);
        }
      } catch (err) {
        console.error('Failed loading examinations:', err);
      } finally {
        setLoading(false);
      }
    }
    void init();
  }, [teacherProfile, selectedAcademicYear]);

  // Load students for selected class
  useEffect(() => {
    async function loadStudents() {
      if (!selectedClass) return;
      try {
        const list = await fetchTeacherStudents([selectedClass]);
        setStudents(list);

        // Check if there is an existing submission for this combination
        const subId = `${selectedAcademicYear}_${selectedExamId}_${selectedClass}_${selectedSubject.replace(/\s+/g, '_')}_${teacherProfile?.uid}`;
        const existing = existingSubmissions.find((s) => s.id === subId);

        // Initialize rows
        const rows: StudentMarkRow[] = list.map((s) => ({
          studentId: s.id,
          rollNumber: s.rollNumber,
          studentName: s.fullNameEn,
          writtenMarks: 0,
          mcqMarks: 0,
          practicalMarks: 0,
          obtainedMarks: 0,
          isAbsent: false,
        }));
        setMarkRows(rows);
      } catch (err) {
        console.error('Error loading students for class:', err);
      }
    }
    void loadStudents();
  }, [selectedClass, selectedAcademicYear, selectedExamId, selectedSubject, teacherProfile]);

  const handleMarkChange = (
    studentId: string,
    field: 'writtenMarks' | 'mcqMarks' | 'practicalMarks',
    value: number
  ) => {
    setMarkRows((prev) =>
      prev.map((row) => {
        if (row.studentId !== studentId) return row;
        const updated = { ...row, [field]: Math.max(0, value) };
        updated.obtainedMarks = updated.writtenMarks + updated.mcqMarks + updated.practicalMarks;
        return updated;
      })
    );
  };

  const handleAbsentToggle = (studentId: string) => {
    setMarkRows((prev) =>
      prev.map((row) => {
        if (row.studentId !== studentId) return row;
        const newAbsent = !row.isAbsent;
        return {
          ...row,
          isAbsent: newAbsent,
          obtainedMarks: newAbsent ? 0 : row.writtenMarks + row.mcqMarks + row.practicalMarks,
        };
      })
    );
  };

  const handleSaveMarks = async (status: 'draft' | 'submitted') => {
    if (!teacherProfile) return;
    if (status === 'submitted' && !canSubmit) {
      setFeedback({ type: 'error', message: 'You do not have permission to submit results.' });
      return;
    }
    setSaving(true);
    setFeedback(null);

    const submissionId = `${selectedAcademicYear}_${selectedExamId || 'annual'}_${selectedClass}_${selectedSubject.replace(/\s+/g, '_')}_${teacherProfile.uid}`;
    const selectedExamObj = exams.find((e) => e.id === selectedExamId);

    try {
      await saveTeacherMarkSubmission(
        {
          id: submissionId,
          teacherUid: teacherProfile.uid,
          teacherId: teacherProfile.teacherId,
          teacherName: teacherProfile.fullName,
          academicYearId: selectedAcademicYear,
          examId: selectedExamId || 'annual',
          examName: selectedExamObj?.nameEn || selectedExamObj?.nameBn || 'Annual Examination',
          classCode: selectedClass,
          className:
            SUPPORTED_RESULT_CLASSES.find((c) => c.classCode === selectedClass)?.nameEn ||
            selectedClass,
          subjectCode: selectedSubject.replace(/\s+/g, '_').toUpperCase(),
          subjectName: selectedSubject,
          totalCandidates: markRows.length,
          submittedMarksCount: markRows.filter((r) => !r.isAbsent && r.obtainedMarks > 0).length,
          status,
        },
        markRows
      );

      setFeedback({
        type: 'success',
        message:
          status === 'submitted'
            ? 'Marks successfully submitted for Administrator approval.'
            : 'Draft marks saved securely. You can return and edit anytime.',
      });

      // Refresh submissions
      const updated = await fetchTeacherMarkSubmissions(teacherProfile.uid);
      setExistingSubmissions(updated);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save marks',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SeoHead
        title="Student Result Entry | BPSC Teacher Panel"
        description="Faculty portal to enter subject marks, save drafts, and submit marks for administrative approval."
      />

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#100261]" />
            <span>Student Examination Mark Entry</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enter subject marks for your assigned classes. Save drafts or submit for Master Admin review.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#F0C94A]/20 text-[#100261] border border-[#F0C94A]">
            Draft Submission Mode
          </span>
        </div>
      </div>

      {/* Institutional Security Notice */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">Administrative Policy:</span> Teachers can enter, calculate,
          and save draft marks. Final publication to the public Result Portal is strictly executed by
          authorized Administrators after verification.
        </div>
      </div>

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

      {/* Selection Filters */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Academic Year */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#100261]"
            >
              <option value="2026">2026 (Current Academic Session)</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {/* Examination */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Examination</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#100261]"
            >
              {exams.length > 0 ? (
                exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.nameEn || ex.nameBn}
                  </option>
                ))
              ) : (
                <option value="annual">Annual Examination 2026</option>
              )}
            </select>
          </div>

          {/* Assigned Class */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Assigned Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value as SupportedClassCode)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#100261]"
            >
              {teacherProfile?.assignedClasses?.map((cls) => {
                const conf = SUPPORTED_RESULT_CLASSES.find((c) => c.classCode === cls);
                return (
                  <option key={cls} value={cls}>
                    {cls.toUpperCase()} ({conf?.nameEn || cls})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Assigned Subject */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Assigned Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#100261]"
            >
              {teacherProfile?.assignedSubjects?.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Marks Entry Grid */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Mark Sheet: {selectedClass.toUpperCase()} — {selectedSubject} ({students.length} Students)
            </h3>
            <p className="text-[11px] text-slate-500">Full Marks: 100 • Pass Marks: 33</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSaveMarks('draft')}
              className="py-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>

            {canSubmit && (
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSaveMarks('submitted')}
                className="py-1.5 px-3.5 bg-[#100261] hover:bg-[#142863] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-[#F0C94A]" />
                <span>Submit for Approval</span>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#100261]/20 border-t-[#100261] animate-spin" />
          </div>
        ) : markRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Roll</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-3 text-center">Absent?</th>
                  <th className="py-2.5 px-3 text-center">Written (70)</th>
                  <th className="py-2.5 px-3 text-center">MCQ (30)</th>
                  <th className="py-2.5 px-4 text-center">Total (100)</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {markRows.map((row) => (
                  <tr key={row.studentId} className={row.isAbsent ? 'bg-slate-50 opacity-60' : ''}>
                    <td className="py-2.5 px-4 font-bold text-[#100261]">{row.rollNumber}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{row.studentName}</td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={row.isAbsent}
                        onChange={() => handleAbsentToggle(row.studentId)}
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max="70"
                        disabled={row.isAbsent}
                        value={row.writtenMarks}
                        onChange={(e) =>
                          handleMarkChange(row.studentId, 'writtenMarks', Number(e.target.value))
                        }
                        className="w-16 text-center py-1 border border-slate-300 rounded font-bold text-slate-800 focus:ring-1 focus:ring-[#100261] disabled:bg-slate-100"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        disabled={row.isAbsent}
                        value={row.mcqMarks}
                        onChange={(e) =>
                          handleMarkChange(row.studentId, 'mcqMarks', Number(e.target.value))
                        }
                        className="w-16 text-center py-1 border border-slate-300 rounded font-bold text-slate-800 focus:ring-1 focus:ring-[#100261] disabled:bg-slate-100"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-center font-extrabold text-sm text-[#100261]">
                      {row.isAbsent ? 'ABS' : row.obtainedMarks}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {row.isAbsent ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                          ABSENT
                        </span>
                      ) : row.obtainedMarks >= passMarks ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                          PASSED
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                          FAILED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-slate-500">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs">No students enrolled for {selectedClass.toUpperCase()}.</p>
          </div>
        )}
      </div>
    </div>
  );
};
