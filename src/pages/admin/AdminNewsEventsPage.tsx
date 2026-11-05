import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Newspaper,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePublicData } from '../../context/PublicDataContext';
import { NewsEventItem } from '../../types/school';
import {
  deleteNewsEventItem,
  fetchNewsEventsForAdmin,
  saveNewsEventItem,
} from '../../services/adminService';

const ITEM_TYPES: { value: NewsEventItem['type']; labelEn: string; labelBn: string }[] = [
  { value: 'news', labelEn: 'Institutional News', labelBn: 'সংবাদ' },
  { value: 'event', labelEn: 'Campus Event', labelBn: 'ইভেন্ট' },
  { value: 'achievement', labelEn: 'Student / Faculty Achievement', labelBn: 'অর্জন' },
];

export const AdminNewsEventsPage: React.FC = () => {
  const { adminProfile } = useAdminAuth();
  const { refreshData } = usePublicData();

  const [items, setItems] = useState<NewsEventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const [editingItem, setEditingItem] = useState<NewsEventItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<NewsEventItem | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchNewsEventsForAdmin();
      setItems(res.items);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to load News & Events.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((it) => {
      if (typeFilter !== 'ALL' && it.type !== typeFilter) return false;
      if (!q) return true;
      return (
        it.titleEn.toLowerCase().includes(q) ||
        it.titleBn.toLowerCase().includes(q) ||
        it.summaryEn.toLowerCase().includes(q)
      );
    });
  }, [items, typeFilter, searchQuery]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile || !editingItem) return;
    setSaving(true);
    setFeedback(null);
    try {
      const matchedType = ITEM_TYPES.find((t) => t.value === editingItem.type);
      await saveNewsEventItem(
        {
          ...editingItem,
          titleBn: editingItem.titleBn.trim() || editingItem.titleEn.trim(),
          categoryEn: editingItem.categoryEn.trim() || matchedType?.labelEn || 'News',
          categoryBn: editingItem.categoryBn.trim() || matchedType?.labelBn || 'সংবাদ',
          summaryBn: editingItem.summaryBn.trim() || editingItem.summaryEn.trim(),
          detailsEn: editingItem.detailsEn.trim() || editingItem.summaryEn.trim(),
          detailsBn:
            editingItem.detailsBn.trim() ||
            editingItem.summaryBn.trim() ||
            editingItem.summaryEn.trim(),
        },
        adminProfile.role
      );
      setEditingItem(null);
      setFeedback({ type: 'success', message: `Saved "${editingItem.titleEn}".` });
      await loadItems();
      await refreshData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to save News & Event item.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (item: NewsEventItem) => {
    if (!adminProfile) return;
    try {
      await saveNewsEventItem({ ...item, isPublished: !item.isPublished }, adminProfile.role);
      await loadItems();
      await refreshData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to toggle publication status.',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!adminProfile || !confirmDelete) return;
    setSaving(true);
    try {
      await deleteNewsEventItem(confirmDelete.id, adminProfile.role);
      setConfirmDelete(null);
      setFeedback({ type: 'success', message: `Deleted "${confirmDelete.titleEn}".` });
      await loadItems();
      await refreshData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to delete item.',
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
            News, Events & Achievements Management
          </h1>
          <p className="text-sm text-[#617187] mt-0.5">
            Publish institutional news, co-curricular events, and student achievements on the
            homepage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadItems}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#102B50]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setEditingItem({
                id: '',
                type: 'news',
                titleEn: '',
                titleBn: '',
                publishDate: todayIso,
                categoryEn: 'Campus News',
                categoryBn: 'ক্যাম্পাস সংবাদ',
                summaryEn: '',
                summaryBn: '',
                detailsEn: '',
                detailsBn: '',
                imageUrl: '',
                isPublished: true,
              })
            }
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Add News / Event</span>
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
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3 justify-between">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
        >
          <option value="ALL">All Types</option>
          {ITEM_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.labelEn}
            </option>
          ))}
        </select>

        <div className="relative flex-1 sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news or event..."
            className="w-full min-h-[40px] pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-2">
          <Newspaper className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-sm font-semibold text-[#102B50]">No News & Events found</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map((it) => (
            <div
              key={it.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col"
            >
              <div className="aspect-[16/9] bg-[#F6F8FC] overflow-hidden border-b border-slate-100">
                {it.imageUrl ? (
                  <img
                    src={it.imageUrl}
                    alt={it.titleEn}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[#617187]">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#617187] mb-1">
                    <span className="font-semibold uppercase text-[#1F5FAF]">{it.type}</span>
                    <span className="tabular-nums">{it.publishDate}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#102B50] line-clamp-2">{it.titleEn}</h3>
                  <p className="text-xs text-[#617187] line-clamp-2 mt-1">{it.summaryEn}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(it)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      it.isPublished
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {it.isPublished ? 'Published' : 'Draft'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingItem({ ...it })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(it)}
                      className="inline-flex items-center p-1.5 rounded border border-red-200 hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setEditingItem(null)}
        >
          <form
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#102B50]">
                {editingItem.id ? 'Edit News / Event' : 'Add News / Event'}
              </h3>
              <button type="button" onClick={() => setEditingItem(null)}>
                <X className="w-5 h-5 text-[#617187]" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[75dvh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">Type *</label>
                <select
                  value={editingItem.type}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      type: e.target.value as NewsEventItem['type'],
                    })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  {ITEM_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.labelEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Publish Date *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.publishDate}
                  onChange={(e) => setEditingItem({ ...editingItem, publishDate: e.target.value })}
                  placeholder="2026-03-26"
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Headline (English) *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.titleEn}
                  onChange={(e) => setEditingItem({ ...editingItem, titleEn: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Headline (Bengali)
                </label>
                <input
                  type="text"
                  value={editingItem.titleBn}
                  onChange={(e) => setEditingItem({ ...editingItem, titleBn: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Cover Photograph URL (HTTPS or Campus Asset Path) *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.imageUrl}
                  onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Summary (English) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingItem.summaryEn}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      summaryEn: e.target.value,
                      detailsEn: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Summary (Bengali)
                </label>
                <textarea
                  rows={3}
                  value={editingItem.summaryBn}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      summaryBn: e.target.value,
                      detailsBn: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#102B50]">
                  <input
                    type="checkbox"
                    checked={editingItem.isPublished}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, isPublished: e.target.checked })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span>Publish on Public Homepage & News Page</span>
                </label>
              </div>
            </div>
            <div className="px-5 py-3.5 bg-[#F6F8FC] border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#617187]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
              >
                {saving ? 'Saving...' : 'Save Item'}
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
            <h3 className="text-base font-bold text-[#102B50]">Delete News / Event?</h3>
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
    </div>
  );
};
