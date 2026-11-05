import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Edit3,
  FileSpreadsheet,
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { StudentRecord, SupportedClassCode } from '../../types/result';
import { SUPPORTED_RESULT_CLASSES } from '../../data/resultPortalSeedData';
import {
  commitValidatedStudentCsvImport,
  CsvStudentValidationRow,
  fetchStudentsForAdmin,
  parseAndValidateStudentCsv,
  upsertStudentFromAdmin,
} from '../../services/adminService';

const SAMPLE_CSV_CONTENT = [
  'academicYear,classCode,rollNumber,fullNameEn,fullNameBn,section,groupNameEn,studentCode,guardianName,guardianPhone',
  '2026,class-10,101,Tahmid Hasan,তাহমিদ হাসান,A,Science,BPSC-26-1001,Md. Rafiqul Islam,01711000001',
  '2026,class-10,102,Nusrat Jahan,নুসরাত জাহান,A,Science,BPSC-26-1002,Md. Kamal Hossain,01711000002',
].join('\n');

export const AdminStudentsPage: React.FC = () => {
  const { adminProfile } = useAdminAuth();

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [yearFilter, setYearFilter] = useState<string>('2026');
  const [classFilter, setClassFilter] = useState<SupportedClassCode | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const [editingStudent, setEditingStudent] = useState<{
    isExisting: boolean;
    record: Omit<StudentRecord, 'id'> & { id?: string };
  } | null>(null);

  // CSV Bulk Import Modal state
  const [csvModalOpen, setCsvModalOpen] = useState<boolean>(false);
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [csvValidation, setCsvValidation] = useState<{
    validRows: StudentRecord[];
    invalidRows: CsvStudentValidationRow[];
    allRows: CsvStudentValidationRow[];
  } | null>(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchStudentsForAdmin({
        academicYearId: yearFilter,
        classCode: classFilter,
      });
      setStudents(list);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to load student registry.',
      });
    } finally {
      setLoading(false);
    }
  }, [yearFilter, classFilter]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.fullNameEn.toLowerCase().includes(q) ||
        (s.fullNameBn && s.fullNameBn.toLowerCase().includes(q)) ||
        s.rollNumber.includes(q) ||
        (s.studentCode && s.studentCode.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile || !editingStudent) return;
    setSaving(true);
    setFeedback(null);
    try {
      await upsertStudentFromAdmin(
        editingStudent.record,
        adminProfile.role,
        editingStudent.isExisting
      );
      setEditingStudent(null);
      setFeedback({
        type: 'success',
        message: `Saved student "${editingStudent.record.fullNameEn}" (Roll ${editingStudent.record.rollNumber}).`,
      });
      await loadStudents();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save student record.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStudentActive = async (student: StudentRecord) => {
    if (!adminProfile) return;
    try {
      await upsertStudentFromAdmin(
        { ...student, isActive: !student.isActive },
        adminProfile.role,
        true
      );
      await loadStudents();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to toggle student status.',
      });
    }
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setCsvRawText(text);
      setCsvValidation(parseAndValidateStudentCsv(text, students));
    };
    reader.readAsText(file);
  };

  const handleValidateCsvText = () => {
    setCsvValidation(parseAndValidateStudentCsv(csvRawText, students));
  };

  const handleCommitCsvImport = async () => {
    if (!adminProfile || !csvValidation || csvValidation.validRows.length === 0) return;
    setSaving(true);
    setFeedback(null);
    try {
      const count = await commitValidatedStudentCsvImport(
        csvValidation.validRows,
        adminProfile.role
      );
      setCsvModalOpen(false);
      setCsvRawText('');
      setCsvValidation(null);
      setFeedback({
        type: 'success',
        message: `Imported ${count} validated student record(s) into Firestore.`,
      });
      await loadStudents();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'CSV import failed.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadSampleCsv = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bpsc-student-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102B50]">
            Student Registry & Class Roster (Nursery – Class 10)
          </h1>
          <p className="text-sm text-[#617187] mt-0.5">
            Private institutional student records protected by Firestore Security Rules with
            duplicate roll prevention
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCsvModalOpen(true)}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50]"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk CSV Import</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setEditingStudent({
                isExisting: false,
                record: {
                  academicYearId: yearFilter === 'ALL' ? '2026' : yearFilter,
                  classCode: classFilter === 'ALL' ? 'class-10' : classFilter,
                  rollNumber: '',
                  fullNameEn: '',
                  fullNameBn: '',
                  section: 'A',
                  groupNameEn: '',
                  studentCode: '',
                  guardianName: '',
                  guardianPhone: '',
                  isActive: true,
                },
              })
            }
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[#102B50] mb-1">Academic Year</label>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="ALL">All Years</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#102B50] mb-1">Class</label>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value as SupportedClassCode | 'ALL')}
            className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
          >
            <option value="ALL">All Classes (Nursery – Class 10)</option>
            {SUPPORTED_RESULT_CLASSES.map((c) => (
              <option key={c.classCode} value={c.classCode}>
                {c.nameEn}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-[#102B50] mb-1">
            Search Roll, Name, or Student ID
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. 101 or Tahmid..."
                className="w-full min-h-[40px] pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={loadStudents}
              className="px-3 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-[#102B50]"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <GraduationCap className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-semibold text-[#102B50]">
              No student records found for current filter
            </div>
            <p className="text-xs text-[#617187]">
              Add individual students or use Bulk CSV Import to populate class rosters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F6F8FC] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-[#617187]">
                  <th className="py-3 px-4">Roll</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class & Section</th>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">Guardian Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-[#102B50] tabular-nums">
                      {st.rollNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#17263C]">{st.fullNameEn}</div>
                      {st.studentCode && (
                        <div className="text-xs text-[#617187] font-mono">{st.studentCode}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="font-semibold text-[#102B50] uppercase">{st.classCode}</span>
                      {st.section ? ` • Sec ${st.section}` : ''}
                      {st.groupNameEn ? ` • ${st.groupNameEn}` : ''}
                    </td>
                    <td className="py-3 px-4 tabular-nums text-xs text-[#617187]">
                      {st.academicYearId}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#617187]">
                      {st.guardianName || '—'}
                      {st.guardianPhone ? ` (${st.guardianPhone})` : ''}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStudentActive(st)}
                        className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                          st.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {st.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingStudent({
                            isExisting: true,
                            record: { ...st },
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {editingStudent && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setEditingStudent(null)}
        >
          <form
            onSubmit={handleSaveStudent}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#102B50]">
                {editingStudent.isExisting ? 'Edit Student Record' : 'Register New Student'}
              </h3>
              <button type="button" onClick={() => setEditingStudent(null)}>
                <X className="w-5 h-5 text-[#617187]" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[75dvh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Academic Year *
                </label>
                <input
                  type="text"
                  required
                  value={editingStudent.record.academicYearId}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      record: { ...editingStudent.record, academicYearId: e.target.value },
                    })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">Class *</label>
                <select
                  value={editingStudent.record.classCode}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      record: {
                        ...editingStudent.record,
                        classCode: e.target.value as SupportedClassCode,
                      },
                    })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  {SUPPORTED_RESULT_CLASSES.map((c) => (
                    <option key={c.classCode} value={c.classCode}>
                      {c.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Roll Number *
                </label>
                <input
                  type="text"
                  required
                  value={editingStudent.record.rollNumber}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      record: { ...editingStudent.record, rollNumber: e.target.value },
                    })
                  }
                  placeholder="e.g. 101"
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Student ID / Code
                </label>
                <input
                  type="text"
                  value={editingStudent.record.studentCode || ''}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      record: { ...editingStudent.record, studentCode: e.target.value },
                    })
                  }
                  placeholder="Optional ID"
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Full Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={editingStudent.record.fullNameEn}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      record: { ...editingStudent.record, fullNameEn: e.target.value },
                    })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Full Name (Bengali)
                </label>
                <input
                  type="text"
                  value={editingStudent.record.fullNameBn || ''}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      record: { ...editingStudent.record, fullNameBn: e.target.value },
                    })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">Section</label>
                <input
                  type="text"
                  value={editingStudent.record.section || ''}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      record: { ...editingStudent.record, section: e.target.value },
                    })
                  }
                  placeholder="A / B"
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Group (Classes 9–10)
                </label>
                <input
                  type="text"
                  value={editingStudent.record.groupNameEn || ''}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      record: { ...editingStudent.record, groupNameEn: e.target.value },
                    })
                  }
                  placeholder="Science / Business Studies / Humanities"
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Guardian Name
                </label>
                <input
                  type="text"
                  value={editingStudent.record.guardianName || ''}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      record: { ...editingStudent.record, guardianName: e.target.value },
                    })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Guardian Phone
                </label>
                <input
                  type="text"
                  value={editingStudent.record.guardianPhone || ''}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      record: { ...editingStudent.record, guardianPhone: e.target.value },
                    })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-[#F6F8FC] border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#617187]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
              >
                {saving ? 'Saving...' : 'Save Student'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Validated CSV Bulk Import Modal */}
      {csvModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setCsvModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#1F5FAF]" />
                <h3 className="text-base font-bold text-[#102B50]">
                  Bulk Student CSV Import (Pre-Validated)
                </h3>
              </div>
              <button type="button" onClick={() => setCsvModalOpen(false)}>
                <X className="w-5 h-5 text-[#617187]" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[78dvh] overflow-y-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F6F8FC] p-3 rounded-lg border border-slate-200">
                <span className="text-xs text-[#617187]">
                  Columns: academicYear, classCode, rollNumber, fullNameEn, fullNameBn, section,
                  groupNameEn, studentCode, guardianName, guardianPhone
                </span>
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-200 text-xs font-semibold text-[#102B50]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Sample CSV</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Upload .csv File or Paste Rows Below
                </label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileUpload}
                  className="block w-full text-xs text-[#617187] mb-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#102B50] file:text-white file:font-semibold"
                />
                <textarea
                  rows={5}
                  value={csvRawText}
                  onChange={(e) => {
                    setCsvRawText(e.target.value);
                    setCsvValidation(null);
                  }}
                  placeholder={SAMPLE_CSV_CONTENT}
                  className="w-full p-3 rounded-lg border border-slate-200 text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleValidateCsvText}
                  disabled={!csvRawText.trim()}
                  className="px-4 py-2 rounded-lg border border-[#1F5FAF] text-[#1F5FAF] text-xs font-semibold disabled:opacity-50"
                >
                  Validate CSV Rows
                </button>
              </div>

              {csvValidation && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Valid Rows: {csvValidation.validRows.length}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-red-50 text-red-700 border border-red-200">
                      Invalid / Duplicate Rows: {csvValidation.invalidRows.length}
                    </span>
                  </div>

                  {csvValidation.invalidRows.length > 0 && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 space-y-1 max-h-40 overflow-y-auto">
                      <div className="font-bold">Row Validation Errors (Blocked from Import):</div>
                      {csvValidation.invalidRows.map((row) => (
                        <div key={row.rowNumber}>
                          Row {row.rowNumber}: {row.errors.join(' ')}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 bg-[#F6F8FC] border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCsvModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#617187]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || !csvValidation || csvValidation.validRows.length === 0}
                onClick={handleCommitCsvImport}
                className="px-5 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] disabled:opacity-50 text-white text-xs font-semibold"
              >
                {saving
                  ? 'Importing...'
                  : `Import ${csvValidation?.validRows.length || 0} Valid Student(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
