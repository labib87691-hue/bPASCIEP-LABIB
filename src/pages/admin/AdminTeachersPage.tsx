import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePublicData } from '../../context/PublicDataContext';
import {
  StaffProfile,
  TeacherEmploymentStatus,
  TeacherProfile,
} from '../../types/school';
import {
  deleteStaffProfile,
  deleteTeacherProfile,
  fetchStaffForAdmin,
  fetchTeachersForAdmin,
  saveStaffProfile,
  saveTeacherProfile,
} from '../../services/adminService';

const DEPARTMENTS: { value: TeacherProfile['department']; bn: string }[] = [
  { value: 'Science', bn: 'বিজ্ঞান বিভাগ' },
  { value: 'Mathematics', bn: 'গণিত বিভাগ' },
  { value: 'Language & Literature', bn: 'ভাষা ও সাহিত্য বিভাগ' },
  { value: 'Humanities & Social Science', bn: 'মানবিক ও সামাজিক বিজ্ঞান' },
  { value: 'Business Studies', bn: 'ব্যবসায় শিক্ষা বিভাগ' },
  { value: 'Arts, ICT & Co-Curricular', bn: 'চারুকলা, আইসিটি ও সহশিক্ষা' },
];

const EMPTY_TEACHER: TeacherProfile = {
  id: '',
  serial: 1,
  name: '',
  nameBn: '',
  designationEn: 'Assistant Teacher',
  designationBn: 'সহকারী শিক্ষক',
  department: 'Science',
  departmentBn: 'বিজ্ঞান বিভাগ',
  subjectEn: '',
  subjectBn: '',
  qualification: '',
  photoUrl: '',
  publicPhone: '',
  publicEmail: '',
  assignedClass: '',
  assignedSection: '',
  employmentStatus: 'active',
  isActive: true,
  isPublished: true,
};

const EMPTY_STAFF: StaffProfile = {
  id: '',
  serial: 1,
  name: '',
  nameBn: '',
  designationEn: 'Office Assistant',
  designationBn: 'অফিস সহকারী',
  photoUrl: '',
  publicPhone: '',
  publicEmail: '',
  employmentStatus: 'active',
  isActive: true,
  isPublished: true,
};

export const AdminTeachersPage: React.FC = () => {
  const { adminProfile } = useAdminAuth();
  const { refreshData } = usePublicData();

  const [tab, setTab] = useState<'teachers' | 'staff'>('teachers');
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const [editingTeacher, setEditingTeacher] = useState<TeacherProfile | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    kind: 'teacher' | 'staff';
    id: string;
    name: string;
  } | null>(null);

  const loadDirectory = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([fetchTeachersForAdmin(), fetchStaffForAdmin()]);
      setTeachers(tRes.items);
      setStaffList(sRes.items);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to load directory.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  const filteredTeachers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return teachers.filter((t) => {
      if (deptFilter !== 'ALL' && t.department !== deptFilter) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.nameBn.toLowerCase().includes(q) ||
        t.designationEn.toLowerCase().includes(q) ||
        t.subjectEn.toLowerCase().includes(q)
      );
    });
  }, [teachers, searchQuery, deptFilter]);

  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return staffList.filter((s) => {
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.nameBn.toLowerCase().includes(q) ||
        s.designationEn.toLowerCase().includes(q)
      );
    });
  }, [staffList, searchQuery]);

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile || !editingTeacher) return;
    setSaving(true);
    setFeedback(null);
    try {
      const matchedDept = DEPARTMENTS.find((d) => d.value === editingTeacher.department);
      await saveTeacherProfile(
        {
          ...editingTeacher,
          departmentBn: matchedDept?.bn || editingTeacher.departmentBn || 'শিক্ষা বিভাগ',
          nameBn: editingTeacher.nameBn.trim() || editingTeacher.name.trim(),
          subjectBn: editingTeacher.subjectBn.trim() || editingTeacher.subjectEn.trim(),
        },
        adminProfile.role
      );
      setEditingTeacher(null);
      setFeedback({ type: 'success', message: `Saved teacher profile "${editingTeacher.name}".` });
      await loadDirectory();
      await refreshData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to save teacher profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile || !editingStaff) return;
    setSaving(true);
    setFeedback(null);
    try {
      await saveStaffProfile(
        {
          ...editingStaff,
          nameBn: editingStaff.nameBn.trim() || editingStaff.name.trim(),
        },
        adminProfile.role
      );
      setEditingStaff(null);
      setFeedback({ type: 'success', message: `Saved staff profile "${editingStaff.name}".` });
      await loadDirectory();
      await refreshData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to save staff profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickToggleTeacher = async (
    teacher: TeacherProfile,
    patch: Partial<TeacherProfile>
  ) => {
    if (!adminProfile) return;
    try {
      await saveTeacherProfile({ ...teacher, ...patch }, adminProfile.role);
      await loadDirectory();
      await refreshData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to update teacher status.',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!adminProfile || !confirmDelete) return;
    setSaving(true);
    try {
      if (confirmDelete.kind === 'teacher') {
        await deleteTeacherProfile(confirmDelete.id, adminProfile.role);
      } else {
        await deleteStaffProfile(confirmDelete.id, adminProfile.role);
      }
      setFeedback({
        type: 'success',
        message: `Removed "${confirmDelete.name}" from Firestore directory.`,
      });
      setConfirmDelete(null);
      await loadDirectory();
      await refreshData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to delete record.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102B50]">
            Teacher & Staff Directory Management
          </h1>
          <p className="text-sm text-[#617187] mt-0.5">
            Manage faculty profiles, designations, departments, employment status, and public
            directory visibility
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDirectory}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#102B50]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (tab === 'teachers') {
                setEditingTeacher({ ...EMPTY_TEACHER, serial: teachers.length + 1 });
              } else {
                setEditingStaff({ ...EMPTY_STAFF, serial: staffList.length + 1 });
              }
            }}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>{tab === 'teachers' ? 'Add Teacher' : 'Add Staff Member'}</span>
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

      {/* Tabs & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('teachers')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              tab === 'teachers'
                ? 'bg-[#102B50] text-white'
                : 'bg-[#F6F8FC] text-[#617187] hover:text-[#102B50]'
            }`}
          >
            Teachers ({teachers.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('staff')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              tab === 'staff'
                ? 'bg-[#102B50] text-white'
                : 'bg-[#F6F8FC] text-[#617187] hover:text-[#102B50]'
            }`}
          >
            Administrative Staff ({staffList.length})
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          {tab === 'teachers' && (
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-[#17263C]"
            >
              <option value="ALL">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.value}
                </option>
              ))}
            </select>
          )}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, subject, designation..."
              className="w-full sm:w-64 min-h-[38px] pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Teachers Table */}
      {tab === 'teachers' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F6F8FC] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-[#617187]">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Teacher</th>
                  <th className="py-3 px-4">Department & Subject</th>
                  <th className="py-3 px-4">Class / Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredTeachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 tabular-nums text-xs text-[#617187]">{t.serial}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {t.photoUrl ? (
                          <img
                            src={t.photoUrl}
                            alt={t.name}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-[#102B50]/10 text-[#102B50] flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-[#102B50]">{t.name}</div>
                          <div className="text-xs text-[#617187]">{t.designationEn}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-semibold text-[#17263C]">{t.department}</div>
                      <div className="text-xs text-[#617187]">{t.subjectEn}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#617187]">
                      {t.assignedClass ? (
                        <div className="font-semibold text-[#102B50]">
                          {t.assignedClass}
                          {t.assignedSection ? ` (${t.assignedSection})` : ''}
                        </div>
                      ) : null}
                      <div>{t.publicPhone || t.publicEmail || '—'}</div>
                    </td>
                    <td className="py-3 px-4 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickToggleTeacher(t, { isPublished: !t.isPublished })
                          }
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            t.isPublished
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t.isPublished ? 'Published' : 'Hidden'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickToggleTeacher(t, {
                              isActive: t.isActive === false,
                              employmentStatus: t.isActive === false ? 'active' : 'inactive',
                            })
                          }
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            t.isActive !== false
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {t.isActive !== false ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingTeacher(t)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDelete({ kind: 'teacher', id: t.id, name: t.name })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F6F8FC] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-[#617187]">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Visibility</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredStaff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 tabular-nums text-xs text-[#617187]">{s.serial}</td>
                    <td className="py-3 px-4 font-semibold text-[#102B50]">{s.name}</td>
                    <td className="py-3 px-4 text-xs text-[#617187]">{s.designationEn}</td>
                    <td className="py-3 px-4 text-xs text-[#617187]">
                      {s.publicPhone || s.publicEmail || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          s.isPublished
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {s.isPublished ? 'Published' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingStaff(s)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete({ kind: 'staff', id: s.id, name: s.name })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Teacher Modal */}
      {editingTeacher && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setEditingTeacher(null)}
        >
          <form
            onSubmit={handleSaveTeacher}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#102B50]">
                {editingTeacher.id ? 'Edit Teacher Profile' : 'Add New Teacher'}
              </h3>
              <button type="button" onClick={() => setEditingTeacher(null)}>
                <X className="w-5 h-5 text-[#617187]" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[75dvh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Full Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={editingTeacher.name}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Full Name (Bengali)
                </label>
                <input
                  type="text"
                  value={editingTeacher.nameBn}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, nameBn: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Designation (English) *
                </label>
                <input
                  type="text"
                  required
                  value={editingTeacher.designationEn}
                  onChange={(e) =>
                    setEditingTeacher({ ...editingTeacher, designationEn: e.target.value })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Designation (Bengali)
                </label>
                <input
                  type="text"
                  value={editingTeacher.designationBn}
                  onChange={(e) =>
                    setEditingTeacher({ ...editingTeacher, designationBn: e.target.value })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Department *
                </label>
                <select
                  value={editingTeacher.department}
                  onChange={(e) =>
                    setEditingTeacher({
                      ...editingTeacher,
                      department: e.target.value as TeacherProfile['department'],
                    })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Subject (English) *
                </label>
                <input
                  type="text"
                  required
                  value={editingTeacher.subjectEn}
                  onChange={(e) =>
                    setEditingTeacher({ ...editingTeacher, subjectEn: e.target.value })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Qualification
                </label>
                <input
                  type="text"
                  value={editingTeacher.qualification}
                  onChange={(e) =>
                    setEditingTeacher({ ...editingTeacher, qualification: e.target.value })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Display Serial
                </label>
                <input
                  type="number"
                  min={1}
                  value={editingTeacher.serial}
                  onChange={(e) =>
                    setEditingTeacher({ ...editingTeacher, serial: Number(e.target.value) })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Assigned Class
                </label>
                <input
                  type="text"
                  value={editingTeacher.assignedClass || ''}
                  onChange={(e) =>
                    setEditingTeacher({ ...editingTeacher, assignedClass: e.target.value })
                  }
                  placeholder="e.g. Class 10"
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Employment Status
                </label>
                <select
                  value={editingTeacher.employmentStatus || 'active'}
                  onChange={(e) =>
                    setEditingTeacher({
                      ...editingTeacher,
                      employmentStatus: e.target.value as TeacherEmploymentStatus,
                      isActive: e.target.value !== 'inactive',
                    })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Public Phone
                </label>
                <input
                  type="text"
                  value={editingTeacher.publicPhone}
                  onChange={(e) =>
                    setEditingTeacher({ ...editingTeacher, publicPhone: e.target.value })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Public Email
                </label>
                <input
                  type="email"
                  value={editingTeacher.publicEmail}
                  onChange={(e) =>
                    setEditingTeacher({ ...editingTeacher, publicEmail: e.target.value })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Photo URL (HTTPS or Campus Asset Path)
                </label>
                <input
                  type="text"
                  value={editingTeacher.photoUrl}
                  onChange={(e) =>
                    setEditingTeacher({ ...editingTeacher, photoUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-4 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#102B50]">
                  <input
                    type="checkbox"
                    checked={editingTeacher.isPublished}
                    onChange={(e) =>
                      setEditingTeacher({ ...editingTeacher, isPublished: e.target.checked })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span>Publish on Public Teachers & Staff Directory</span>
                </label>
              </div>
            </div>
            <div className="px-5 py-3.5 bg-[#F6F8FC] border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#617187]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
              >
                {saving ? 'Saving...' : 'Save Teacher Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Modal */}
      {editingStaff && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setEditingStaff(null)}
        >
          <form
            onSubmit={handleSaveStaff}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#102B50]">
                {editingStaff.id ? 'Edit Staff Member' : 'Add Staff Member'}
              </h3>
              <button type="button" onClick={() => setEditingStaff(null)}>
                <X className="w-5 h-5 text-[#617187]" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[75dvh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Full Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={editingStaff.name}
                  onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Designation (English) *
                </label>
                <input
                  type="text"
                  required
                  value={editingStaff.designationEn}
                  onChange={(e) =>
                    setEditingStaff({ ...editingStaff, designationEn: e.target.value })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">Serial</label>
                  <input
                    type="number"
                    min={1}
                    value={editingStaff.serial}
                    onChange={(e) =>
                      setEditingStaff({ ...editingStaff, serial: Number(e.target.value) })
                    }
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">Phone</label>
                  <input
                    type="text"
                    value={editingStaff.publicPhone || ''}
                    onChange={(e) =>
                      setEditingStaff({ ...editingStaff, publicPhone: e.target.value })
                    }
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">Photo URL</label>
                <input
                  type="text"
                  value={editingStaff.photoUrl}
                  onChange={(e) => setEditingStaff({ ...editingStaff, photoUrl: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#102B50]">
                <input
                  type="checkbox"
                  checked={editingStaff.isPublished}
                  onChange={(e) =>
                    setEditingStaff({ ...editingStaff, isPublished: e.target.checked })
                  }
                  className="w-4 h-4 rounded"
                />
                <span>Publish on Public Directory</span>
              </label>
            </div>
            <div className="px-5 py-3.5 bg-[#F6F8FC] border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#617187]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
              >
                Save Staff Member
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-[#102B50]">Remove Directory Record?</h3>
            <p className="text-xs text-[#617187]">
              Are you sure you want to delete <strong>{confirmDelete.name}</strong> from Firestore?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#617187]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
