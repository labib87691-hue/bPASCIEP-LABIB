import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Edit3,
  Pin,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePublicData } from '../../context/PublicDataContext';
import { NoticeCategory, NoticeItem } from '../../types/school';
import {
  deleteNoticeItem,
  fetchNoticesForAdmin,
  saveNoticeItem,
} from '../../services/adminService';
import { QrCodeGeneratorModal } from '../../components/admin/QrCodeGeneratorModal';

const CATEGORIES: { value: NoticeCategory; label: string }[] = [
  { value: 'academic', label: 'Academic' },
  { value: 'examination', label: 'Examination' },
  { value: 'admission', label: 'Admission' },
  { value: 'recruitment', label: 'Recruitment' },
  { value: 'general', label: 'General / Office Order' },
];

export const AdminNoticesPage: React.FC = () => {
  const { adminProfile } = useAdminAuth();
  const { refreshData } = usePublicData();

  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const [editingNotice, setEditingNotice] = useState<{
    isNew: boolean;
    item: NoticeItem;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<NoticeItem | null>(null);
  const [qrTarget, setQrTarget] = useState<{ url: string; label: string } | null>(null);

  const loadNotices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchNoticesForAdmin();
      setNotices(res.items);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to load notices.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  const filteredNotices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notices.filter((n) => {
      if (categoryFilter !== 'ALL' && n.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        n.titleEn.toLowerCase().includes(q) ||
        n.titleBn.toLowerCase().includes(q) ||
        n.summaryEn.toLowerCase().includes(q)
      );
    });
  }, [notices, searchQuery, categoryFilter]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile || !editingNotice) return;
    setSaving(true);
    setFeedback(null);
    try {
      const n = editingNotice.item;
      await saveNoticeItem(
        {
          ...n,
          titleBn: n.titleBn.trim() || n.titleEn.trim(),
          summaryBn: n.summaryBn.trim() || n.summaryEn.trim(),
          detailsEn: n.detailsEn.trim() || n.summaryEn.trim(),
          detailsBn: n.detailsBn.trim() || n.summaryBn.trim() || n.summaryEn.trim(),
        },
        adminProfile.role,
        editingNotice.isNew
      );
      setEditingNotice(null);
      setFeedback({ type: 'success', message: `Saved notice "${n.titleEn}".` });
      await loadNotices();
      await refreshData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to save notice.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleQuickPatch = async (notice: NoticeItem, patch: Partial<NoticeItem>) => {
    if (!adminProfile) return;
    try {
      await saveNoticeItem({ ...notice, ...patch }, adminProfile.role, false);
      await loadNotices();
      await refreshData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to update notice.',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!adminProfile || !confirmDelete) return;
    setSaving(true);
    try {
      await deleteNoticeItem(confirmDelete.id, adminProfile.role);
      setConfirmDelete(null);
      setFeedback({ type: 'success', message: `Deleted notice "${confirmDelete.titleEn}".` });
      await loadNotices();
      await refreshData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to delete notice.',
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
            Institutional Notice Board Management
          </h1>
          <p className="text-sm text-[#617187] mt-0.5">
            Publish official notices, pin urgent circulars to the homepage ticker, and attach Google
            Drive PDF links
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadNotices}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#102B50]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setEditingNotice({
                isNew: true,
                item: {
                  id: '',
                  serial: notices.length + 1,
                  titleEn: '',
                  titleBn: '',
                  category: 'academic',
                  publishDate: todayIso,
                  year: todayIso.slice(0, 4),
                  summaryEn: '',
                  summaryBn: '',
                  detailsEn: '',
                  detailsBn: '',
                  attachmentUrl: '',
                  attachmentType: 'pdf',
                  isImportant: false,
                  isPublished: true,
                },
              })
            }
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Create Notice</span>
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

      {/* Search & Category Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3 justify-between">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
        >
          <option value="ALL">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <div className="relative flex-1 sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notice title..."
            className="w-full min-h-[40px] pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm"
          />
        </div>
      </div>

      {/* Notices List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredNotices.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Bell className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-semibold text-[#102B50]">No notices found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F6F8FC] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-[#617187]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Notice Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Pinned / Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredNotices.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 tabular-nums text-xs text-[#617187] whitespace-nowrap">
                      {n.publishDate}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#102B50] line-clamp-1">{n.titleEn}</div>
                      <div className="text-xs text-[#617187] line-clamp-1">{n.summaryEn}</div>
                    </td>
                    <td className="py-3 px-4 text-xs capitalize font-semibold text-[#1F5FAF]">
                      {n.category}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickPatch(n, { isImportant: !n.isImportant })}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                          n.isImportant
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Pin className="w-3 h-3" />
                        <span>{n.isImportant ? 'Pinned' : 'Standard'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPatch(n, { isPublished: !n.isPublished })}
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          n.isPublished
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {n.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setQrTarget({
                            url:
                              n.attachmentUrl ||
                              `${window.location.origin}/notices/${encodeURIComponent(n.id)}`,
                            label: n.titleEn,
                          })
                        }
                        title="Generate QR Code"
                        className="inline-flex items-center p-1.5 rounded border border-slate-200 hover:border-[#1F5FAF] text-[#102B50]"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingNotice({ isNew: false, item: { ...n } })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(n)}
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

      {/* Create / Edit Modal */}
      {editingNotice && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setEditingNotice(null)}
        >
          <form
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#102B50]">
                {editingNotice.isNew ? 'Create Official Notice' : 'Edit Official Notice'}
              </h3>
              <button type="button" onClick={() => setEditingNotice(null)}>
                <X className="w-5 h-5 text-[#617187]" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[75dvh] overflow-y-auto">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Title (English) *
                </label>
                <input
                  type="text"
                  required
                  value={editingNotice.item.titleEn}
                  onChange={(e) =>
                    setEditingNotice({
                      ...editingNotice,
                      item: { ...editingNotice.item, titleEn: e.target.value },
                    })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Title (Bengali)
                </label>
                <input
                  type="text"
                  value={editingNotice.item.titleBn}
                  onChange={(e) =>
                    setEditingNotice({
                      ...editingNotice,
                      item: { ...editingNotice.item, titleBn: e.target.value },
                    })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Category *
                </label>
                <select
                  value={editingNotice.item.category}
                  onChange={(e) =>
                    setEditingNotice({
                      ...editingNotice,
                      item: {
                        ...editingNotice.item,
                        category: e.target.value as NoticeCategory,
                      },
                    })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Publish Date *
                </label>
                <input
                  type="date"
                  required
                  value={editingNotice.item.publishDate}
                  onChange={(e) =>
                    setEditingNotice({
                      ...editingNotice,
                      item: {
                        ...editingNotice.item,
                        publishDate: e.target.value,
                        year: e.target.value.slice(0, 4),
                      },
                    })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Summary / Notice Body (English) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingNotice.item.summaryEn}
                  onChange={(e) =>
                    setEditingNotice({
                      ...editingNotice,
                      item: {
                        ...editingNotice.item,
                        summaryEn: e.target.value,
                        detailsEn: e.target.value,
                      },
                    })
                  }
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Summary / Notice Body (Bengali)
                </label>
                <textarea
                  rows={3}
                  value={editingNotice.item.summaryBn}
                  onChange={(e) =>
                    setEditingNotice({
                      ...editingNotice,
                      item: {
                        ...editingNotice.item,
                        summaryBn: e.target.value,
                        detailsBn: e.target.value,
                      },
                    })
                  }
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Google Drive / PDF Attachment URL (Optional HTTPS Link)
                </label>
                <input
                  type="text"
                  value={editingNotice.item.attachmentUrl || ''}
                  onChange={(e) =>
                    setEditingNotice({
                      ...editingNotice,
                      item: { ...editingNotice.item, attachmentUrl: e.target.value },
                    })
                  }
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-5 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#102B50]">
                  <input
                    type="checkbox"
                    checked={editingNotice.item.isImportant}
                    onChange={(e) =>
                      setEditingNotice({
                        ...editingNotice,
                        item: { ...editingNotice.item, isImportant: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span>Pin as Urgent / Important Announcement</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#102B50]">
                  <input
                    type="checkbox"
                    checked={editingNotice.item.isPublished}
                    onChange={(e) =>
                      setEditingNotice({
                        ...editingNotice,
                        item: { ...editingNotice.item, isPublished: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span>Publish Immediately</span>
                </label>
              </div>
            </div>
            <div className="px-5 py-3.5 bg-[#F6F8FC] border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingNotice(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#617187]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
              >
                {saving ? 'Saving...' : 'Save Notice'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-[#102B50]">Delete Notice?</h3>
            <p className="text-xs text-[#617187]">
              Permanently remove <strong>{confirmDelete.titleEn}</strong>?
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

      <QrCodeGeneratorModal
        isOpen={Boolean(qrTarget)}
        onClose={() => setQrTarget(null)}
        initialUrl={qrTarget?.url}
        initialLabel={qrTarget?.label}
      />
    </div>
  );
};
