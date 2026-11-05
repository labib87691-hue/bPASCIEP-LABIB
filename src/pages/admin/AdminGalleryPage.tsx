import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePublicData } from '../../context/PublicDataContext';
import { GalleryCategory, GalleryPhoto } from '../../types/school';
import {
  deleteGalleryPhoto,
  fetchGalleryForAdmin,
  saveGalleryPhoto,
} from '../../services/adminService';

const GALLERY_CATEGORIES: { value: GalleryCategory; label: string }[] = [
  { value: 'campus', label: 'Campus & Architecture' },
  { value: 'science_fair', label: 'Science Fair & Labs' },
  { value: 'events', label: 'Annual Sports & Events' },
  { value: 'cultural', label: 'Cultural Celebrations' },
  { value: 'guardians_meeting', label: 'Guardians Meetings' },
  { value: 'transport', label: 'Student Transport' },
];

export const AdminGalleryPage: React.FC = () => {
  const { adminProfile } = useAdminAuth();
  const { refreshData } = usePublicData();

  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<GalleryPhoto | null>(null);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchGalleryForAdmin();
      setPhotos(res.items);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to load gallery.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const filteredPhotos = useMemo(() => {
    if (categoryFilter === 'ALL') return photos;
    return photos.filter((p) => p.category === categoryFilter);
  }, [photos, categoryFilter]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile || !editingPhoto) return;
    setSaving(true);
    setFeedback(null);
    try {
      await saveGalleryPhoto(
        {
          ...editingPhoto,
          titleBn: editingPhoto.titleBn.trim() || editingPhoto.titleEn.trim(),
        },
        adminProfile.role
      );
      setEditingPhoto(null);
      setFeedback({ type: 'success', message: `Saved photograph "${editingPhoto.titleEn}".` });
      await loadPhotos();
      await refreshData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to save gallery photograph.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (photo: GalleryPhoto) => {
    if (!adminProfile) return;
    try {
      await saveGalleryPhoto({ ...photo, isPublished: !photo.isPublished }, adminProfile.role);
      await loadPhotos();
      await refreshData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to update photo visibility.',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!adminProfile || !confirmDelete) return;
    setSaving(true);
    try {
      await deleteGalleryPhoto(confirmDelete.id, adminProfile.role);
      setConfirmDelete(null);
      setFeedback({ type: 'success', message: `Deleted photograph "${confirmDelete.titleEn}".` });
      await loadPhotos();
      await refreshData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to delete photograph.',
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
            Campus Photo Gallery Management
          </h1>
          <p className="text-sm text-[#617187] mt-0.5">
            Curate verified institutional photographs across campus, science labs, sports, and
            cultural albums
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadPhotos}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#102B50]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setEditingPhoto({
                id: '',
                titleEn: '',
                titleBn: '',
                category: 'campus',
                imageUrl: '',
                dateLabel: '2026',
                order: photos.length + 1,
                isPublished: true,
              })
            }
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Add Photograph</span>
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

      {/* Album Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategoryFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            categoryFilter === 'ALL'
              ? 'bg-[#102B50] text-white'
              : 'bg-[#F6F8FC] text-[#617187] hover:text-[#102B50]'
          }`}
        >
          All Albums ({photos.length})
        </button>
        {GALLERY_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setCategoryFilter(cat.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              categoryFilter === cat.value
                ? 'bg-[#102B50] text-white'
                : 'bg-[#F6F8FC] text-[#617187] hover:text-[#102B50]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Photo Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-2">
          <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-sm font-semibold text-[#102B50]">No photographs in this album</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPhotos.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] bg-[#F6F8FC] overflow-hidden border-b border-slate-100">
                <img src={p.imageUrl} alt={p.titleEn} className="w-full h-full object-cover" />
              </div>
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[#617187] mb-1">
                    <span className="uppercase font-semibold text-[#1F5FAF]">
                      {p.category.replace('_', ' ')}
                    </span>
                    <span className="tabular-nums">#{p.order}</span>
                  </div>
                  <div className="text-sm font-bold text-[#102B50] line-clamp-1">{p.titleEn}</div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(p)}
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      p.isPublished
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {p.isPublished ? 'Published' : 'Hidden'}
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingPhoto({ ...p })}
                      className="p-1.5 rounded border border-slate-200 hover:border-[#1F5FAF] text-[#102B50]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(p)}
                      className="p-1.5 rounded border border-red-200 hover:bg-red-50 text-red-600"
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

      {/* Modal */}
      {editingPhoto && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setEditingPhoto(null)}
        >
          <form
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#102B50]">
                {editingPhoto.id ? 'Edit Gallery Photograph' : 'Add Gallery Photograph'}
              </h3>
              <button type="button" onClick={() => setEditingPhoto(null)}>
                <X className="w-5 h-5 text-[#617187]" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[75dvh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Caption (English) *
                </label>
                <input
                  type="text"
                  required
                  value={editingPhoto.titleEn}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, titleEn: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Caption (Bengali)
                </label>
                <input
                  type="text"
                  value={editingPhoto.titleBn}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, titleBn: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">Album *</label>
                  <select
                    value={editingPhoto.category}
                    onChange={(e) =>
                      setEditingPhoto({
                        ...editingPhoto,
                        category: e.target.value as GalleryCategory,
                      })
                    }
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                  >
                    {GALLERY_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    Date / Year Label
                  </label>
                  <input
                    type="text"
                    value={editingPhoto.dateLabel}
                    onChange={(e) =>
                      setEditingPhoto({ ...editingPhoto, dateLabel: e.target.value })
                    }
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Image URL (HTTPS or Campus Asset Path) *
                </label>
                <input
                  type="text"
                  required
                  value={editingPhoto.imageUrl}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              {editingPhoto.imageUrl && (
                <div className="aspect-[16/9] rounded-lg overflow-hidden border border-slate-200 bg-[#F6F8FC]">
                  <img
                    src={editingPhoto.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#102B50]">
                <input
                  type="checkbox"
                  checked={editingPhoto.isPublished}
                  onChange={(e) =>
                    setEditingPhoto({ ...editingPhoto, isPublished: e.target.checked })
                  }
                  className="w-4 h-4 rounded"
                />
                <span>Publish on Public Gallery</span>
              </label>
            </div>
            <div className="px-5 py-3.5 bg-[#F6F8FC] border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingPhoto(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#617187]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
              >
                {saving ? 'Saving...' : 'Save Photograph'}
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
            <h3 className="text-base font-bold text-[#102B50]">Delete Photograph?</h3>
            <p className="text-xs text-[#617187]">
              Remove <strong>{confirmDelete.titleEn}</strong> from the gallery?
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
