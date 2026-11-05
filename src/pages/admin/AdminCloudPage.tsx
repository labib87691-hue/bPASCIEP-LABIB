import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  Edit3,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  QrCode,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  CloudDocumentCategory,
  CloudDocumentInput,
  CloudDocumentRecord,
  CloudFileType,
  CloudSupportedClassName,
} from '../../types/cloud';
import {
  CLOUD_DOCUMENT_CATEGORIES,
  CLOUD_SUPPORTED_CLASSES,
  DEMO_CLOUD_DOCUMENTS,
  STANDARD_CLOUD_SUBJECTS,
} from '../../data/cloudCenterSeedData';
import {
  addCloudDocument,
  deleteCloudDocument,
  fetchAllCloudDocumentsForAdmin,
  publishCloudDocument,
  unpublishCloudDocument,
  updateCloudDocument,
} from '../../services/cloudDocumentService';
import { inspectGoogleDriveUrl } from '../../utils/googleDriveUtils';
import { recordActivityLog } from '../../services/activityLogService';
import { CloudPreviewModal } from '../../components/cloud/CloudPreviewModal';
import { QrCodeGeneratorModal } from '../../components/admin/QrCodeGeneratorModal';

const FILE_TYPES: CloudFileType[] = [
  'PDF',
  'DOC',
  'DOCX',
  'XLS',
  'XLSX',
  'PPT',
  'PPTX',
  'JPG',
  'PNG',
  'ZIP',
  'OTHER',
];

const EMPTY_FORM: CloudDocumentInput = {
  title: '',
  titleBn: '',
  category: 'Class Routine',
  className: null,
  subject: '',
  academicYear: '2026',
  description: '',
  descriptionBn: '',
  driveUrl: '',
  fileType: 'PDF',
  fileSize: '',
  isPublished: true,
  isDemoRecord: false,
};

export const AdminCloudPage: React.FC = () => {
  const { adminProfile } = useAdminAuth();
  const actorRole = adminProfile?.role || 'cloud_manager';
  const [searchParams, setSearchParams] = useSearchParams();

  const [documents, setDocuments] = useState<CloudDocumentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');

  // Editor & Confirmation Modals
  const [editorOpen, setEditorOpen] = useState<boolean>(searchParams.get('action') === 'new');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CloudDocumentInput>(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<CloudDocumentRecord | null>(null);
  const [qrTarget, setQrTarget] = useState<{ url: string; label: string } | null>(null);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const list = await fetchAllCloudDocumentsForAdmin();
      setDocuments(list);
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Unable to fetch cloudDocuments.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDocs();
  }, []);

  const driveResolution = useMemo(() => {
    if (!form.driveUrl.trim()) return null;
    return inspectGoogleDriveUrl(form.driveUrl, form.fileType);
  }, [form.driveUrl, form.fileType]);

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return documents.filter((d) => {
      if (categoryFilter !== 'ALL' && d.category !== categoryFilter) return false;
      if (classFilter === 'GENERAL' && d.className !== null) return false;
      if (classFilter !== 'ALL' && classFilter !== 'GENERAL' && d.className !== classFilter) {
        return false;
      }
      if (yearFilter !== 'ALL' && d.academicYear !== yearFilter) return false;
      if (statusFilter === 'PUBLISHED' && !d.isPublished) return false;
      if (statusFilter === 'DRAFT' && d.isPublished) return false;
      if (q) {
        const hay = `${d.title} ${d.titleBn || ''} ${d.category} ${d.className || ''} ${
          d.subject || ''
        } ${d.description}`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    });
  }, [documents, searchQuery, categoryFilter, classFilter, yearFilter, statusFilter]);

  const openNewEditor = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
    setSearchParams({}, { replace: true });
  };

  const openEditModal = (docItem: CloudDocumentRecord) => {
    setEditingId(docItem.id);
    setForm({
      title: docItem.title,
      titleBn: docItem.titleBn || '',
      category: docItem.category,
      className: docItem.className,
      subject: docItem.subject || '',
      academicYear: docItem.academicYear || '2026',
      description: docItem.description,
      descriptionBn: docItem.descriptionBn || '',
      driveUrl: docItem.driveUrl,
      fileType: docItem.fileType,
      fileSize: docItem.fileSize || '',
      isPublished: docItem.isPublished,
      isDemoRecord: docItem.isDemoRecord,
    });
    setEditorOpen(true);
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      if (editingId) {
        await updateCloudDocument(editingId, form);
        await recordActivityLog({
          actionType: 'document_updated',
          targetCollection: 'cloudDocuments',
          targetId: editingId,
          summary: `Updated Cloud Document "${form.title}" (${form.category})`,
          actorRole,
        });
        setFeedback({ type: 'success', msg: `Updated "${form.title}".` });
      } else {
        const newId = await addCloudDocument(form);
        await recordActivityLog({
          actionType: 'document_created',
          targetCollection: 'cloudDocuments',
          targetId: newId,
          summary: `Added Cloud Document "${form.title}" in ${form.category}`,
          actorRole,
        });
        setFeedback({ type: 'success', msg: `Created Cloud Document "${form.title}".` });
      }
      setEditorOpen(false);
      await loadDocs();
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Validation or save failed.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (docItem: CloudDocumentRecord) => {
    setSaving(true);
    try {
      if (docItem.isPublished) {
        await unpublishCloudDocument(docItem.id);
        await recordActivityLog({
          actionType: 'document_unpublished',
          targetCollection: 'cloudDocuments',
          targetId: docItem.id,
          summary: `Unpublished Cloud Document "${docItem.title}"`,
          actorRole,
        });
      } else {
        await publishCloudDocument(docItem.id);
        await recordActivityLog({
          actionType: 'document_published',
          targetCollection: 'cloudDocuments',
          targetId: docItem.id,
          summary: `Published Cloud Document "${docItem.title}"`,
          actorRole,
        });
      }
      await loadDocs();
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Status update failed.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setSaving(true);
    try {
      await deleteCloudDocument(deleteConfirmId);
      await recordActivityLog({
        actionType: 'document_deleted',
        targetCollection: 'cloudDocuments',
        targetId: deleteConfirmId,
        summary: `Deleted Cloud Document ${deleteConfirmId}`,
        actorRole,
      });
      setDeleteConfirmId(null);
      setFeedback({ type: 'success', msg: 'Document deleted from BPSC Cloud.' });
      await loadDocs();
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Delete failed.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSyncDemoBaseline = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      for (const sample of DEMO_CLOUD_DOCUMENTS) {
        await addCloudDocument({
          id: sample.id,
          title: sample.title,
          titleBn: sample.titleBn,
          category: sample.category,
          className: sample.className,
          subject: sample.subject,
          academicYear: sample.academicYear,
          description: sample.description,
          descriptionBn: sample.descriptionBn,
          driveUrl: sample.driveUrl,
          fileType: sample.fileType,
          fileSize: sample.fileSize,
          isPublished: sample.isPublished,
          isDemoRecord: true,
        });
      }
      setFeedback({
        type: 'success',
        msg: 'Seeded baseline records into cloudDocuments collection for live editing.',
      });
      await loadDocs();
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Seed sync failed.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#102B50] flex items-center gap-2">
            <Cloud className="w-5 h-5 text-[#1F5FAF]" />
            <span>BPSC Cloud Document Management</span>
          </h2>
          <p className="text-xs text-[#617187] mt-0.5">
            Connected to the existing <code>cloudDocuments</code> collection using external Google
            Drive links (no Firebase Storage uploads).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {documents.length === 0 && !loading && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSyncDemoBaseline()}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-200 bg-[#F6F8FC] hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50]"
            >
              <span>Import Sample Baseline</span>
            </button>
          )}
          <button
            type="button"
            onClick={openNewEditor}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Cloud Document</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Multi-Filter Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="sm:col-span-2 lg:col-span-2 relative">
            <Search className="w-4 h-4 text-[#617187] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, category, subject, description..."
              className="w-full min-h-[40px] pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm bg-white"
          >
            <option value="ALL">All 12 Categories</option>
            {CLOUD_DOCUMENT_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.labelEn}
              </option>
            ))}
          </select>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm bg-white"
          >
            <option value="ALL">All Classes</option>
            <option value="GENERAL">General (Non-Class)</option>
            {CLOUD_SUPPORTED_CLASSES.map((c) => (
              <option key={c.nameEn} value={c.nameEn}>
                {c.nameEn}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'PUBLISHED' | 'DRAFT')}
            className="min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published Only</option>
            <option value="DRAFT">Unpublished Drafts</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-[#617187] tabular-nums">
          <span>
            Showing <strong>{filteredDocs.length}</strong> of <strong>{documents.length}</strong>{' '}
            documents in Firestore
          </span>
          {yearFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setYearFilter('ALL')}
              className="text-[#1F5FAF] hover:underline"
            >
              Reset Year ({yearFilter})
            </button>
          )}
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-14 flex items-center justify-center gap-2 text-xs text-[#617187]">
            <Loader2 className="w-5 h-5 animate-spin text-[#1F5FAF]" />
            <span>Loading cloudDocuments...</span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-14 px-6 text-center space-y-2">
            <p className="text-sm font-semibold text-[#102B50]">No Cloud Documents Found</p>
            <p className="text-xs text-[#617187]">
              Click &ldquo;Add Cloud Document&rdquo; to publish a Google Drive resource to{' '}
              <code>/cloud</code>.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#F6F8FC] border-b border-slate-200 text-[11px] font-bold text-[#617187] uppercase">
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Class / Year</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((docItem) => (
                  <tr key={docItem.id} className="hover:bg-[#F6F8FC]/60">
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-[#102B50] line-clamp-1">
                        {docItem.title}
                      </div>
                      {docItem.subject && (
                        <div className="text-[11px] text-[#617187] truncate">
                          Subject: {docItem.subject}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap text-xs font-medium text-[#1F5FAF]">
                      {docItem.category}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap text-xs text-[#17263C] tabular-nums">
                      {docItem.className || 'General'}{' '}
                      {docItem.academicYear ? `· ${docItem.academicYear}` : ''}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap text-xs font-semibold text-[#617187]">
                      {docItem.fileType}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          docItem.isPublished
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {docItem.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(docItem)}
                          title="Test Preview & Download Link"
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-[#102B50]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setQrTarget({ url: docItem.driveUrl, label: docItem.title })
                          }
                          title="Generate Document QR Code"
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-[#102B50]"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void handleTogglePublish(docItem)}
                          title={docItem.isPublished ? 'Unpublish' : 'Publish'}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50]"
                        >
                          {docItem.isPublished ? (
                            <span className="inline-flex items-center gap-1">
                              <EyeOff className="w-3.5 h-3.5" /> Unpublish
                            </span>
                          ) : (
                            'Publish'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(docItem)}
                          title="Edit"
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-[#1F5FAF]"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(docItem.id)}
                          title="Delete"
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-red-300 text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Document Modal */}
      {editorOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setEditorOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#102B50]">
                {editingId ? 'Edit Cloud Document' : 'Add New BPSC Cloud Document'}
              </h3>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="p-1.5 rounded-lg text-[#617187] hover:text-[#102B50]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveDocument}
              className="p-5 space-y-4 max-h-[82dvh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    Document Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Class 9 Annual Examination Routine 2026"
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    Document Title (Bengali — Optional)
                  </label>
                  <input
                    type="text"
                    value={form.titleBn || ''}
                    onChange={(e) => setForm({ ...form, titleBn: e.target.value })}
                    placeholder="নবম শ্রেণির বার্ষিক পরীক্ষার রুটিন ২০২৬"
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    Category (12 Official Sections) *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as CloudDocumentCategory })
                    }
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                  >
                    {CLOUD_DOCUMENT_CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    Class (Optional)
                  </label>
                  <select
                    value={form.className || ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        className: e.target.value
                          ? (e.target.value as CloudSupportedClassName)
                          : null,
                      })
                    }
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                  >
                    <option value="">General (All Classes)</option>
                    {CLOUD_SUPPORTED_CLASSES.map((c) => (
                      <option key={c.nameEn} value={c.nameEn}>
                        {c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    Subject (Optional)
                  </label>
                  <input
                    type="text"
                    list="cloud-subject-suggestions"
                    value={form.subject || ''}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g., Mathematics"
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                  <datalist id="cloud-subject-suggestions">
                    {STANDARD_CLOUD_SUBJECTS.map((s) => (
                      <option key={s.nameEn} value={s.nameEn} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={form.academicYear || ''}
                    onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                    placeholder="2026"
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    Google Drive Link (HTTPS drive.google.com or docs.google.com) *
                  </label>
                  <input
                    type="url"
                    required
                    value={form.driveUrl}
                    onChange={(e) => setForm({ ...form, driveUrl: e.target.value })}
                    placeholder="https://drive.google.com/file/d/FILE_ID/view"
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                  {driveResolution && (
                    <div
                      className={`mt-1.5 text-xs flex items-center gap-1.5 ${
                        driveResolution.isValid ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {driveResolution.isValid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Valid Google Drive URL verified
                            {driveResolution.fileId ? ` (File ID: ${driveResolution.fileId})` : ''}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{driveResolution.errorMessageEn}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    File Type Indicator *
                  </label>
                  <select
                    value={form.fileType}
                    onChange={(e) => setForm({ ...form, fileType: e.target.value as CloudFileType })}
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                  >
                    {FILE_TYPES.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    File Size Label (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.fileSize || ''}
                    onChange={(e) => setForm({ ...form, fileSize: e.target.value })}
                    placeholder="e.g., 420 KB"
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    Description (English) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Concise institutional summary of this document..."
                    className="w-full p-3 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <label className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#102B50]">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isPublished)}
                    onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  />
                  <span>Publish immediately on /cloud</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditorOpen(false)}
                    className="min-h-[40px] px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#617187]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || Boolean(driveResolution && !driveResolution.isValid)}
                    className="min-h-[40px] px-5 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold"
                  >
                    {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Document'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-[#102B50]">Confirm Document Deletion</h3>
            <p className="text-xs sm:text-sm text-[#617187] leading-relaxed">
              Are you sure you want to permanently remove this document record from BPSC Cloud?
              This action will be recorded in the administrative audit log.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="min-h-[38px] px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#17263C]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleConfirmDelete()}
                className="min-h-[38px] px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                {saving ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CloudPreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
      <QrCodeGeneratorModal
        isOpen={Boolean(qrTarget)}
        onClose={() => setQrTarget(null)}
        initialUrl={qrTarget?.url}
        initialLabel={qrTarget?.label}
      />
    </div>
  );
};
