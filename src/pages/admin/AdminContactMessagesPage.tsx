import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Eye,
  Mail,
  MailOpen,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ContactMessageRecord } from '../../types/admin';
import {
  deleteContactMessage,
  fetchContactMessagesForAdmin,
  updateContactMessageStatus,
} from '../../services/adminService';

export const AdminContactMessagesPage: React.FC = () => {
  const { adminProfile } = useAdminAuth();

  const [messages, setMessages] = useState<ContactMessageRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'new' | 'read' | 'archived'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMsg, setSelectedMsg] = useState<ContactMessageRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ContactMessageRecord | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchContactMessagesForAdmin();
      setMessages(list);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to load contact messages.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return messages.filter((m) => {
      if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
      if (!q) return true;
      return (
        m.senderName.toLowerCase().includes(q) ||
        m.senderEmail.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    });
  }, [messages, statusFilter, searchQuery]);

  const handleStatusChange = async (
    msg: ContactMessageRecord,
    nextStatus: ContactMessageRecord['status']
  ) => {
    if (!adminProfile) return;
    setSaving(true);
    try {
      await updateContactMessageStatus(msg.id, nextStatus, adminProfile.role);
      if (selectedMsg?.id === msg.id) {
        setSelectedMsg({ ...msg, status: nextStatus });
      }
      await loadMessages();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to update message status.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!adminProfile || !confirmDelete) return;
    setSaving(true);
    try {
      await deleteContactMessage(confirmDelete.id, adminProfile.role);
      if (selectedMsg?.id === confirmDelete.id) setSelectedMsg(null);
      setConfirmDelete(null);
      setFeedback({ type: 'success', message: 'Contact inquiry deleted.' });
      await loadMessages();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to delete message.',
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
            Public Contact Inquiries Inbox
          </h1>
          <p className="text-sm text-[#617187] mt-0.5">
            Review guardian, student, and institutional messages submitted via the public Contact
            form
          </p>
        </div>

        <button
          type="button"
          onClick={loadMessages}
          className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#102B50]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Inbox</span>
        </button>
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
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'new', 'read', 'archived'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                statusFilter === st
                  ? 'bg-[#102B50] text-white'
                  : 'bg-[#F6F8FC] text-[#617187] hover:text-[#102B50]'
              }`}
            >
              {st === 'ALL' ? `All (${messages.length})` : st === 'new' ? 'Unread' : st}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sender or subject..."
            className="w-full min-h-[38px] pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs"
          />
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredMessages.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Mail className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-semibold text-[#102B50]">No contact messages found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F6F8FC] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-[#617187]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Sender</th>
                  <th className="py-3 px-4">Subject & Preview</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredMessages.map((msg) => (
                  <tr
                    key={msg.id}
                    className={`hover:bg-slate-50/70 ${msg.status === 'new' ? 'bg-blue-50/30' : ''}`}
                  >
                    <td className="py-3 px-4 tabular-nums text-xs text-[#617187] whitespace-nowrap">
                      {msg.createdAtIso.slice(0, 10)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#102B50]">{msg.senderName}</div>
                      <div className="text-xs text-[#617187]">
                        {msg.senderEmail}
                        {msg.senderPhone ? ` • ${msg.senderPhone}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#17263C] line-clamp-1">{msg.subject}</div>
                      <div className="text-xs text-[#617187] line-clamp-1">{msg.message}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                          msg.status === 'new'
                            ? 'bg-blue-100 text-blue-800'
                            : msg.status === 'archived'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {msg.status === 'new' ? 'Unread' : msg.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMsg(msg);
                          if (msg.status === 'new') {
                            handleStatusChange(msg, 'read');
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Read</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(msg, msg.status === 'new' ? 'read' : 'new')
                        }
                        title={msg.status === 'new' ? 'Mark Read' : 'Mark Unread'}
                        className="inline-flex items-center p-1.5 rounded border border-slate-200 hover:border-[#1F5FAF] text-[#102B50]"
                      >
                        {msg.status === 'new' ? (
                          <MailOpen className="w-3.5 h-3.5" />
                        ) : (
                          <Mail className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(msg, 'archived')}
                        title="Archive"
                        className="inline-flex items-center p-1.5 rounded border border-slate-200 hover:border-[#1F5FAF] text-[#617187]"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(msg)}
                        title="Delete"
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

      {/* View Message Modal */}
      {selectedMsg && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setSelectedMsg(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#102B50] line-clamp-1">
                {selectedMsg.subject}
              </h3>
              <button type="button" onClick={() => setSelectedMsg(null)}>
                <X className="w-5 h-5 text-[#617187]" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-xs text-[#617187] space-y-1 bg-[#F6F8FC] p-3 rounded-lg border border-slate-200">
                <div>
                  <strong className="text-[#102B50]">From:</strong> {selectedMsg.senderName}
                </div>
                <div>
                  <strong className="text-[#102B50]">Email:</strong> {selectedMsg.senderEmail}
                </div>
                {selectedMsg.senderPhone && (
                  <div>
                    <strong className="text-[#102B50]">Phone:</strong> {selectedMsg.senderPhone}
                  </div>
                )}
                <div>
                  <strong className="text-[#102B50]">Received:</strong>{' '}
                  {new Date(selectedMsg.createdAtIso).toLocaleString()}
                </div>
              </div>
              <p className="text-sm text-[#17263C] whitespace-pre-wrap leading-relaxed">
                {selectedMsg.message}
              </p>
            </div>
            <div className="px-5 py-3.5 bg-[#F6F8FC] border-t border-slate-200 flex justify-between">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  handleStatusChange(selectedMsg, selectedMsg.status === 'new' ? 'read' : 'new')
                }
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#102B50]"
              >
                {selectedMsg.status === 'new' ? 'Mark as Read' : 'Mark as Unread'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedMsg(null)}
                className="px-4 py-1.5 rounded-lg bg-[#102B50] text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
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
            <h3 className="text-base font-bold text-[#102B50]">Delete Contact Message?</h3>
            <p className="text-xs text-[#617187]">
              Remove message from <strong>{confirmDelete.senderName}</strong>?
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
