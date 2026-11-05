import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Edit3,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePublicData } from '../../context/PublicDataContext';
import { HolidayRecord, HolidayType } from '../../types/admin';
import { SUPPORTED_RESULT_CLASSES } from '../../data/resultPortalSeedData';
import {
  deleteHolidayRecord,
  fetchHolidaysForAdmin,
  saveHolidayRecord,
} from '../../services/adminService';

const HOLIDAY_TYPES: { value: HolidayType; label: string }[] = [
  { value: 'national', label: 'National Holiday' },
  { value: 'institutional', label: 'Institutional / BEPZA Holiday' },
  { value: 'vacation', label: 'Seasonal / Eid / Summer Vacation' },
  { value: 'exam_break', label: 'Examination Preparation Break' },
  { value: 'class_specific', label: 'Class-Specific Closure' },
];

export const AdminHolidaysPage: React.FC = () => {
  const { adminProfile } = useAdminAuth();
  const { refreshData } = usePublicData();

  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const [editingHoliday, setEditingHoliday] = useState<
    (Omit<HolidayRecord, 'id' | 'createdAtIso' | 'updatedAtIso'> & { id?: string }) | null
  >(null);
  const [confirmDelete, setConfirmDelete] = useState<HolidayRecord | null>(null);

  const loadHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchHolidaysForAdmin();
      setHolidays(res.items);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to load holiday schedule.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile || !editingHoliday) return;
    setSaving(true);
    setFeedback(null);
    try {
      await saveHolidayRecord(
        {
          ...editingHoliday,
          titleBn: editingHoliday.titleBn.trim() || editingHoliday.titleEn.trim(),
          descriptionBn:
            editingHoliday.descriptionBn.trim() || editingHoliday.descriptionEn.trim(),
          endDate: editingHoliday.isMultiDay ? editingHoliday.endDate : editingHoliday.startDate,
        },
        adminProfile.role
      );
      setEditingHoliday(null);
      setFeedback({
        type: 'success',
        message: `Saved holiday "${editingHoliday.titleEn}" (synced to /cloud Holiday List).`,
      });
      await loadHolidays();
      await refreshData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to save holiday.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (h: HolidayRecord) => {
    if (!adminProfile) return;
    try {
      await saveHolidayRecord({ ...h, isPublished: !h.isPublished }, adminProfile.role);
      await loadHolidays();
      await refreshData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to update holiday status.',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!adminProfile || !confirmDelete) return;
    setSaving(true);
    try {
      await deleteHolidayRecord(confirmDelete.id, adminProfile.role);
      setConfirmDelete(null);
      setFeedback({ type: 'success', message: `Deleted holiday "${confirmDelete.titleEn}".` });
      await loadHolidays();
      await refreshData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to delete holiday.',
      });
    } finally {
      setSaving(false);
    }
  };

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102B50]">
            Holiday & Academic Calendar Schedule
          </h1>
          <p className="text-sm text-[#617187] mt-0.5">
            Manage single-day and multi-day holidays, class-specific closures, and circulars
            displayed inside <code className="font-mono text-[#1F5FAF]">/cloud</code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadHolidays}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#102B50]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setEditingHoliday({
                titleEn: '',
                titleBn: '',
                descriptionEn: '',
                descriptionBn: '',
                isMultiDay: false,
                startDate: todayIso,
                endDate: todayIso,
                holidayType: 'national',
                applicableClass: 'ALL',
                academicYear: '2026',
                driveUrl: '',
                isPublished: true,
              })
            }
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Add Holiday / Closure</span>
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

      {/* Holidays Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {holidays.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-semibold text-[#102B50]">No holidays configured</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F6F8FC] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-[#617187]">
                  <th className="py-3 px-4">Date / Range</th>
                  <th className="py-3 px-4">Holiday Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Applicable Class</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 tabular-nums text-xs font-semibold text-[#102B50] whitespace-nowrap">
                      {h.isMultiDay && h.endDate !== h.startDate
                        ? `${h.startDate} → ${h.endDate}`
                        : h.startDate}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#17263C]">{h.titleEn}</div>
                      {h.descriptionEn && (
                        <div className="text-xs text-[#617187] line-clamp-1">{h.descriptionEn}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs capitalize text-[#1F5FAF] font-semibold">
                      {h.holidayType.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-[#102B50]">
                      {h.applicableClass === 'ALL' ? 'All Classes' : h.applicableClass}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(h)}
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          h.isPublished
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {h.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingHoliday({ ...h })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(h)}
                        className="inline-flex items-center p-1.5 rounded border border-red-200 hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Holiday Modal */}
      {editingHoliday && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setEditingHoliday(null)}
        >
          <form
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#102B50]">
                {editingHoliday.id ? 'Edit Holiday Schedule' : 'Add Holiday / Closure'}
              </h3>
              <button type="button" onClick={() => setEditingHoliday(null)}>
                <X className="w-5 h-5 text-[#617187]" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[75dvh] overflow-y-auto">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Holiday Title (English) *
                </label>
                <input
                  type="text"
                  required
                  value={editingHoliday.titleEn}
                  onChange={(e) =>
                    setEditingHoliday({ ...editingHoliday, titleEn: e.target.value })
                  }
                  placeholder="e.g. Independence & National Day"
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Holiday Title (Bengali)
                </label>
                <input
                  type="text"
                  value={editingHoliday.titleBn}
                  onChange={(e) =>
                    setEditingHoliday({ ...editingHoliday, titleBn: e.target.value })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Holiday Type *
                </label>
                <select
                  value={editingHoliday.holidayType}
                  onChange={(e) =>
                    setEditingHoliday({
                      ...editingHoliday,
                      holidayType: e.target.value as HolidayType,
                    })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  {HOLIDAY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Applicable Class
                </label>
                <select
                  value={editingHoliday.applicableClass}
                  onChange={(e) =>
                    setEditingHoliday({ ...editingHoliday, applicableClass: e.target.value })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  <option value="ALL">All Classes (Whole Institution)</option>
                  {SUPPORTED_RESULT_CLASSES.map((c) => (
                    <option key={c.classCode} value={c.nameEn}>
                      {c.nameEn} Only
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#102B50]">
                  <input
                    type="checkbox"
                    checked={editingHoliday.isMultiDay}
                    onChange={(e) =>
                      setEditingHoliday({
                        ...editingHoliday,
                        isMultiDay: e.target.checked,
                        endDate: e.target.checked
                          ? editingHoliday.endDate
                          : editingHoliday.startDate,
                      })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span>Multi-Day Date Range Vacation / Closure</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  {editingHoliday.isMultiDay ? 'Start Date *' : 'Holiday Date *'}
                </label>
                <input
                  type="date"
                  required
                  value={editingHoliday.startDate}
                  onChange={(e) =>
                    setEditingHoliday({
                      ...editingHoliday,
                      startDate: e.target.value,
                      endDate: editingHoliday.isMultiDay
                        ? editingHoliday.endDate
                        : e.target.value,
                    })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                />
              </div>

              {editingHoliday.isMultiDay ? (
                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={editingHoliday.startDate}
                    value={editingHoliday.endDate}
                    onChange={(e) =>
                      setEditingHoliday({ ...editingHoliday, endDate: e.target.value })
                    }
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={editingHoliday.academicYear}
                    onChange={(e) =>
                      setEditingHoliday({ ...editingHoliday, academicYear: e.target.value })
                    }
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Notes / Description (English)
                </label>
                <textarea
                  rows={2}
                  value={editingHoliday.descriptionEn}
                  onChange={(e) =>
                    setEditingHoliday({ ...editingHoliday, descriptionEn: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Optional Circular Google Drive URL
                </label>
                <input
                  type="url"
                  value={editingHoliday.driveUrl || ''}
                  onChange={(e) =>
                    setEditingHoliday({ ...editingHoliday, driveUrl: e.target.value })
                  }
                  placeholder="https://drive.google.com/..."
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#102B50]">
                  <input
                    type="checkbox"
                    checked={editingHoliday.isPublished}
                    onChange={(e) =>
                      setEditingHoliday({ ...editingHoliday, isPublished: e.target.checked })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span>Publish on BPSC Cloud (/cloud) Holiday List</span>
                </label>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-[#F6F8FC] border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingHoliday(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#617187]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
              >
                {saving ? 'Saving...' : 'Save Holiday'}
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-[#102B50]">Delete Holiday?</h3>
            <p className="text-xs text-[#617187]">
              Remove <strong>{confirmDelete.titleEn}</strong>?
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
