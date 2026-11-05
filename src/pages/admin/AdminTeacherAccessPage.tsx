import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Plus,
  RefreshCw,
  ShieldAlert,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  AuthorizedTeacherAccount,
  TeacherAccessRequestRecord,
  TeacherPortalRole,
} from '../../types/admin';
import { TeacherMarkSubmissionRecord } from '../../types/teacher';
import { SUPPORTED_RESULT_CLASSES } from '../../data/resultPortalSeedData';
import {
  approveTeacherAccessRequest,
  createTeacherAccessRequestRecord,
  fetchAuthorizedTeachersForAdmin,
  fetchTeacherAccessRequestsForAdmin,
  fetchAllTeacherMarkSubmissionsForAdmin,
  reviewTeacherMarkSubmission,
  rejectTeacherAccessRequest,
  upsertAuthorizedTeacherAccount,
} from '../../services/adminService';

export const AdminTeacherAccessPage: React.FC = () => {
  const { adminProfile } = useAdminAuth();

  const [tab, setTab] = useState<'requests' | 'authorized' | 'submissions'>('requests');
  const [requests, setRequests] = useState<TeacherAccessRequestRecord[]>([]);
  const [authorized, setAuthorized] = useState<AuthorizedTeacherAccount[]>([]);
  const [submissions, setSubmissions] = useState<TeacherMarkSubmissionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Modals
  const [newReqModalOpen, setNewReqModalOpen] = useState<boolean>(false);
  const [newReqForm, setNewReqForm] = useState({
    applicantUid: '',
    fullName: '',
    email: '',
    phone: '',
    teacherId: '',
    designation: 'Assistant Teacher',
    department: 'Science',
    requestedClassesText: 'class-9, class-10',
    requestedSubjectsText: 'Physics, Higher Mathematics',
  });

  const [approvingReq, setApprovingReq] = useState<{
    req: TeacherAccessRequestRecord;
    targetUid: string;
    teacherRole: TeacherPortalRole;
    assignedClassesText: string;
    assignedSectionsText: string;
    assignedSubjectsText: string;
    isClassTeacher: boolean;
    classTeacherOf: string;
    canEnterMarks: boolean;
    canSubmitResults: boolean;
    canTakeAttendance: boolean;
    canViewStudents: boolean;
  } | null>(null);

  const [rejectingReq, setRejectingReq] = useState<{
    req: TeacherAccessRequestRecord;
    reason: string;
  } | null>(null);

  const [editingAuthorized, setEditingAuthorized] = useState<{
    uid: string;
    email: string;
    fullName: string;
    teacherId: string;
    teacherRole: TeacherPortalRole;
    assignedClassesText: string;
    assignedSectionsText: string;
    assignedSubjectsText: string;
    isClassTeacher: boolean;
    classTeacherOf: string;
    canEnterMarks: boolean;
    canSubmitResults: boolean;
    canTakeAttendance: boolean;
    canViewStudents: boolean;
    isActive: boolean;
  } | null>(null);

  const [reviewingSubmission, setReviewingSubmission] = useState<{
    sub: TeacherMarkSubmissionRecord;
    status: 'approved' | 'rejected';
    rejectionReason: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqs, authList, subs] = await Promise.all([
        fetchTeacherAccessRequestsForAdmin(),
        fetchAuthorizedTeachersForAdmin(),
        fetchAllTeacherMarkSubmissionsForAdmin(),
      ]);
      setRequests(reqs);
      setAuthorized(authList);
      setSubmissions(subs);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to load teacher access records.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReviewSubmissionSubmit = async () => {
    if (!reviewingSubmission || !adminProfile) return;
    setSaving(true);
    try {
      await reviewTeacherMarkSubmission(
        reviewingSubmission.sub.id,
        reviewingSubmission.status,
        adminProfile.uid,
        adminProfile.displayName,
        reviewingSubmission.status === 'rejected' ? reviewingSubmission.rejectionReason : undefined
      );
      setFeedback({
        type: 'success',
        message: `Mark submission marked as "${reviewingSubmission.status.toUpperCase()}".`,
      });
      setReviewingSubmission(null);
      await loadData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update submission status.',
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const splitCsvItems = (val: string) =>
    val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile) return;
    setSaving(true);
    setFeedback(null);
    try {
      await createTeacherAccessRequestRecord(
        {
          applicantUid: newReqForm.applicantUid.trim() || undefined,
          fullName: newReqForm.fullName,
          email: newReqForm.email,
          phone: newReqForm.phone,
          teacherId: newReqForm.teacherId,
          designation: newReqForm.designation,
          department: newReqForm.department,
          requestedClasses: splitCsvItems(newReqForm.requestedClassesText),
          requestedSubjects: splitCsvItems(newReqForm.requestedSubjectsText),
        },
        adminProfile.role
      );
      setNewReqModalOpen(false);
      setFeedback({
        type: 'success',
        message: `Logged teacher portal access request for "${newReqForm.fullName}".`,
      });
      await loadData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to create teacher request.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile || !approvingReq) return;
    setSaving(true);
    setFeedback(null);
    try {
      await approveTeacherAccessRequest(
        approvingReq.req,
        {
          targetUid: approvingReq.targetUid,
          teacherRole: approvingReq.teacherRole,
          assignedClasses: splitCsvItems(approvingReq.assignedClassesText),
          assignedSections: splitCsvItems(approvingReq.assignedSectionsText),
          assignedSubjects: splitCsvItems(approvingReq.assignedSubjectsText),
          isClassTeacher: approvingReq.isClassTeacher,
          classTeacherOf: approvingReq.classTeacherOf,
          canEnterMarks: approvingReq.canEnterMarks,
          canSubmitResults: approvingReq.canSubmitResults,
          canTakeAttendance: approvingReq.canTakeAttendance,
          canViewStudents: approvingReq.canViewStudents,
        },
        adminProfile.role
      );
      setApprovingReq(null);
      setFeedback({
        type: 'success',
        message: `Approved teacher portal permissions for "${approvingReq.req.fullName}".`,
      });
      await loadData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to approve teacher access.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!adminProfile || !rejectingReq) return;
    setSaving(true);
    try {
      await rejectTeacherAccessRequest(
        rejectingReq.req.id,
        rejectingReq.reason,
        adminProfile.role
      );
      setRejectingReq(null);
      setFeedback({ type: 'success', message: 'Teacher access request rejected.' });
      await loadData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to reject request.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAuthorizedAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile || !editingAuthorized) return;
    setSaving(true);
    setFeedback(null);
    try {
      await upsertAuthorizedTeacherAccount(
        {
          uid: editingAuthorized.uid,
          email: editingAuthorized.email,
          fullName: editingAuthorized.fullName,
          teacherId: editingAuthorized.teacherId,
          teacherRole: editingAuthorized.teacherRole,
          assignedClasses: splitCsvItems(editingAuthorized.assignedClassesText),
          assignedSections: splitCsvItems(editingAuthorized.assignedSectionsText),
          assignedSubjects: splitCsvItems(editingAuthorized.assignedSubjectsText),
          isClassTeacher: editingAuthorized.isClassTeacher,
          classTeacherOf: editingAuthorized.classTeacherOf || null,
          canEnterMarks: editingAuthorized.canEnterMarks,
          canSubmitResults: editingAuthorized.canSubmitResults,
          canTakeAttendance: editingAuthorized.canTakeAttendance,
          canViewStudents: editingAuthorized.canViewStudents,
          isActive: editingAuthorized.isActive,
        },
        adminProfile.role
      );
      setEditingAuthorized(null);
      setFeedback({
        type: 'success',
        message: `Updated Phase 5 permissions for "${editingAuthorized.fullName}".`,
      });
      await loadData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to update teacher account.',
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
            Teacher Access & Permissions Control (Phase 5 Ready)
          </h1>
          <p className="text-sm text-[#617187] mt-0.5">
            Approve or reject teacher portal requests and assign scoped class, section, subject, and
            draft-marks permissions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#102B50]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setNewReqModalOpen(true)}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50]"
          >
            <Plus className="w-4 h-4" />
            <span>Log Access Request</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setEditingAuthorized({
                uid: '',
                email: '',
                fullName: '',
                teacherId: 'BPSC-T-',
                teacherRole: 'subject_teacher',
                assignedClassesText: 'class-9, class-10',
                assignedSectionsText: 'A',
                assignedSubjectsText: 'English',
                isClassTeacher: false,
                classTeacherOf: '',
                canEnterMarks: true,
                canSubmitResults: true,
                canTakeAttendance: true,
                canViewStudents: true,
                isActive: true,
              })
            }
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
          >
            <UserCheck className="w-4 h-4" />
            <span>Authorize Teacher UID</span>
          </button>
        </div>
      </div>

      {/* Strict Isolation Notice */}
      <div className="bg-[#F6F8FC] rounded-xl border border-slate-200 p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-[#1F5FAF] shrink-0 mt-0.5" />
        <div className="text-xs text-[#17263C] leading-relaxed">
          <strong className="text-[#102B50]">Security Isolation Enforced:</strong> Authorized
          teachers are stored in <code className="font-mono">authorizedTeachers</code> (never in{' '}
          <code className="font-mono">adminUsers</code>). Firestore Security Rules strictly prevent
          teachers from accessing <code className="font-mono">/admin/*</code>, publishing results,
          modifying website content, or viewing unassigned privileges.
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

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('requests')}
          className={`px-4 py-2 rounded-lg text-xs font-bold ${
            tab === 'requests'
              ? 'bg-[#102B50] text-white'
              : 'bg-white border border-slate-200 text-[#617187]'
          }`}
        >
          Access Requests ({requests.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('authorized')}
          className={`px-4 py-2 rounded-lg text-xs font-bold ${
            tab === 'authorized'
              ? 'bg-[#102B50] text-white'
              : 'bg-white border border-slate-200 text-[#617187]'
          }`}
        >
          Authorized Teacher Accounts ({authorized.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('submissions')}
          className={`px-4 py-2 rounded-lg text-xs font-bold ${
            tab === 'submissions'
              ? 'bg-[#102B50] text-white'
              : 'bg-white border border-slate-200 text-[#617187]'
          }`}
        >
          Mark Submissions Review ({submissions.length})
        </button>
      </div>

      {tab === 'requests' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {requests.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#617187]">
              No pending or historical teacher access requests recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F6F8FC] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-[#617187]">
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Teacher ID & Dept</th>
                    <th className="py-3 px-4">Requested Scope</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#102B50]">{r.fullName}</div>
                        <div className="text-xs text-[#617187]">{r.email}</div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="font-mono font-semibold text-[#17263C]">
                          {r.teacherId || '—'}
                        </div>
                        <div className="text-[#617187]">{r.department}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#617187]">
                        <div>Classes: {r.requestedClasses.join(', ') || '—'}</div>
                        <div>Subjects: {r.requestedSubjects.join(', ') || '—'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                            r.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : r.status === 'rejected'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        {r.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setApprovingReq({
                                  req: r,
                                  targetUid:
                                    r.applicantUid ||
                                    `tch_${r.teacherId.replace(/[^a-zA-Z0-9]/g, '') || Date.now()}`,
                                  teacherRole: 'subject_teacher',
                                  assignedClassesText: r.requestedClasses.join(', '),
                                  assignedSectionsText: 'A',
                                  assignedSubjectsText: r.requestedSubjects.join(', '),
                                  isClassTeacher: false,
                                  classTeacherOf: '',
                                  canEnterMarks: true,
                                  canSubmitResults: true,
                                  canTakeAttendance: true,
                                  canViewStudents: true,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingReq({ req: r, reason: '' })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {authorized.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#617187]">
              No authorized teacher accounts provisioned yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F6F8FC] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-[#617187]">
                    <th className="py-3 px-4">Teacher & UID</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Assigned Classes & Subjects</th>
                    <th className="py-3 px-4">Capabilities</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {authorized.map((acc) => (
                    <tr key={acc.uid} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#102B50]">{acc.fullName}</div>
                        <div className="text-xs text-[#617187]">{acc.email}</div>
                        <div className="text-[11px] font-mono text-slate-400">{acc.uid}</div>
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-[#1F5FAF]">
                        {acc.teacherRole === 'class_teacher'
                          ? `Class Teacher (${acc.classTeacherOf || 'Assigned'})`
                          : 'Subject Teacher'}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#617187]">
                        <div>Classes: {acc.assignedClasses.join(', ') || '—'}</div>
                        <div>Subjects: {acc.assignedSubjects.join(', ') || '—'}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#17263C]">
                        {[
                          acc.canEnterMarks && 'Marks',
                          acc.canSubmitResults && 'Submit',
                          acc.canTakeAttendance && 'Attendance',
                          acc.canViewStudents && 'Roster',
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            acc.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {acc.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingAuthorized({
                              uid: acc.uid,
                              email: acc.email,
                              fullName: acc.fullName,
                              teacherId: acc.teacherId,
                              teacherRole: acc.teacherRole,
                              assignedClassesText: acc.assignedClasses.join(', '),
                              assignedSectionsText: acc.assignedSections.join(', '),
                              assignedSubjectsText: acc.assignedSubjects.join(', '),
                              isClassTeacher: acc.isClassTeacher,
                              classTeacherOf: acc.classTeacherOf || '',
                              canEnterMarks: acc.canEnterMarks,
                              canSubmitResults: acc.canSubmitResults,
                              canTakeAttendance: acc.canTakeAttendance,
                              canViewStudents: acc.canViewStudents,
                              isActive: acc.isActive,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50]"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Permissions</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Mark Submissions Review Tab */}
      {tab === 'submissions' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {submissions.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#617187]">
              No teacher mark submissions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F6F8FC] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-[#617187]">
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Examination</th>
                    <th className="py-3 px-4">Class & Subject</th>
                    <th className="py-3 px-4">Submitted Marks</th>
                    <th className="py-3 px-4">Review Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#102B50]">{sub.teacherName}</div>
                        <div className="text-xs text-[#617187]">ID: {sub.teacherId}</div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="font-bold text-[#102B50]">{sub.examName}</div>
                        <div className="text-slate-400">Year: {sub.academicYearId}</div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className="font-bold text-[#100261] uppercase">{sub.classCode}</span>
                        <div className="text-[#617187] font-semibold">{sub.subjectName}</div>
                      </td>
                      <td className="py-3 px-4 text-xs font-bold text-slate-700">
                        {sub.submittedMarksCount} / {sub.totalCandidates}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            sub.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : sub.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700'
                              : sub.status === 'submitted'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {sub.status}
                        </span>
                        {sub.rejectionReason && (
                          <p className="text-[10px] text-rose-600 mt-0.5 italic max-w-xs">{sub.rejectionReason}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setReviewingSubmission({
                              sub,
                              status: 'approved',
                              rejectionReason: '',
                            })
                          }
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setReviewingSubmission({
                              sub,
                              status: 'rejected',
                              rejectionReason: 'Please recheck component mark entries.',
                            })
                          }
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Review Submission Modal */}
      {reviewingSubmission && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setReviewingSubmission(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#102B50]">
                {reviewingSubmission.status === 'approved' ? 'Approve' : 'Reject'} Mark Submission
              </h3>
              <button type="button" onClick={() => setReviewingSubmission(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="text-xs space-y-1.5 text-slate-600">
              <p>
                <strong>Faculty:</strong> {reviewingSubmission.sub.teacherName} (ID: {reviewingSubmission.sub.teacherId})
              </p>
              <p>
                <strong>Class & Subject:</strong> {reviewingSubmission.sub.classCode.toUpperCase()} — {reviewingSubmission.sub.subjectName}
              </p>
              <p>
                <strong>Exam:</strong> {reviewingSubmission.sub.examName} ({reviewingSubmission.sub.academicYearId})
              </p>
            </div>

            {reviewingSubmission.status === 'rejected' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Rejection (Visible to Teacher)
                </label>
                <textarea
                  rows={3}
                  value={reviewingSubmission.rejectionReason}
                  onChange={(e) =>
                    setReviewingSubmission({
                      ...reviewingSubmission,
                      rejectionReason: e.target.value,
                    })
                  }
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#102B50]"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewingSubmission(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleReviewSubmissionSubmit}
                className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg ${
                  reviewingSubmission.status === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {saving ? 'Processing...' : `Confirm ${reviewingSubmission.status.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log New Request Modal */}
      {newReqModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setNewReqModalOpen(false)}
        >
          <form
            onSubmit={handleCreateRequest}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#102B50]">Log Teacher Access Request</h3>
              <button type="button" onClick={() => setNewReqModalOpen(false)}>
                <X className="w-5 h-5 text-[#617187]" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newReqForm.fullName}
                  onChange={(e) => setNewReqForm({ ...newReqForm, fullName: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={newReqForm.email}
                  onChange={(e) => setNewReqForm({ ...newReqForm, email: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Teacher ID *
                </label>
                <input
                  type="text"
                  required
                  value={newReqForm.teacherId}
                  onChange={(e) => setNewReqForm({ ...newReqForm, teacherId: e.target.value })}
                  placeholder="BPSC-T-104"
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">Phone</label>
                <input
                  type="text"
                  value={newReqForm.phone}
                  onChange={(e) => setNewReqForm({ ...newReqForm, phone: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Requested Classes (comma-separated)
                </label>
                <input
                  type="text"
                  value={newReqForm.requestedClassesText}
                  onChange={(e) =>
                    setNewReqForm({ ...newReqForm, requestedClassesText: e.target.value })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Requested Subjects (comma-separated)
                </label>
                <input
                  type="text"
                  value={newReqForm.requestedSubjectsText}
                  onChange={(e) =>
                    setNewReqForm({ ...newReqForm, requestedSubjectsText: e.target.value })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
            </div>
            <div className="px-5 py-3.5 bg-[#F6F8FC] border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewReqModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#617187]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Approve Request Modal */}
      {approvingReq && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setApprovingReq(null)}
        >
          <form
            onSubmit={handleConfirmApprove}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#102B50]">
                Approve & Assign Teacher Permissions — {approvingReq.req.fullName}
              </h3>
              <button type="button" onClick={() => setApprovingReq(null)}>
                <X className="w-5 h-5 text-[#617187]" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[75dvh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    Firebase User UID *
                  </label>
                  <input
                    type="text"
                    required
                    value={approvingReq.targetUid}
                    onChange={(e) =>
                      setApprovingReq({ ...approvingReq, targetUid: e.target.value })
                    }
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B50] mb-1">
                    Teacher Portal Role
                  </label>
                  <select
                    value={approvingReq.teacherRole}
                    onChange={(e) =>
                      setApprovingReq({
                        ...approvingReq,
                        teacherRole: e.target.value as TeacherPortalRole,
                        isClassTeacher: e.target.value === 'class_teacher',
                      })
                    }
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                  >
                    <option value="subject_teacher">Subject Teacher</option>
                    <option value="class_teacher">Class Teacher</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Assigned Classes (comma-separated, e.g. class-9, class-10)
                </label>
                <input
                  type="text"
                  value={approvingReq.assignedClassesText}
                  onChange={(e) =>
                    setApprovingReq({ ...approvingReq, assignedClassesText: e.target.value })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Assigned Subjects (comma-separated)
                </label>
                <input
                  type="text"
                  value={approvingReq.assignedSubjectsText}
                  onChange={(e) =>
                    setApprovingReq({ ...approvingReq, assignedSubjectsText: e.target.value })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-semibold text-[#102B50]">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={approvingReq.canEnterMarks}
                    onChange={(e) =>
                      setApprovingReq({ ...approvingReq, canEnterMarks: e.target.checked })
                    }
                  />
                  <span>Enter Draft Marks</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={approvingReq.canSubmitResults}
                    onChange={(e) =>
                      setApprovingReq({ ...approvingReq, canSubmitResults: e.target.checked })
                    }
                  />
                  <span>Submit for Admin Approval</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={approvingReq.canTakeAttendance}
                    onChange={(e) =>
                      setApprovingReq({ ...approvingReq, canTakeAttendance: e.target.checked })
                    }
                  />
                  <span>Attendance Access</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={approvingReq.canViewStudents}
                    onChange={(e) =>
                      setApprovingReq({ ...approvingReq, canViewStudents: e.target.checked })
                    }
                  />
                  <span>View Assigned Class Students</span>
                </label>
              </div>
            </div>
            <div className="px-5 py-3.5 bg-[#F6F8FC] border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setApprovingReq(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#617187]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                Approve & Provision Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reject Request Modal */}
      {rejectingReq && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setRejectingReq(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-[#102B50]">Reject Teacher Access Request</h3>
            <textarea
              rows={3}
              value={rejectingReq.reason}
              onChange={(e) => setRejectingReq({ ...rejectingReq, reason: e.target.value })}
              placeholder="Reason for declining..."
              className="w-full p-3 rounded-lg border border-slate-200 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingReq(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#617187]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Authorized Teacher Account Modal */}
      {editingAuthorized && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setEditingAuthorized(null)}
        >
          <form
            onSubmit={handleSaveAuthorizedAccount}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-xl border border-slate-200 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#102B50]">
                Configure Authorized Teacher Account
              </h3>
              <button type="button" onClick={() => setEditingAuthorized(null)}>
                <X className="w-5 h-5 text-[#617187]" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[75dvh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Firebase UID *
                </label>
                <input
                  type="text"
                  required
                  value={editingAuthorized.uid}
                  onChange={(e) =>
                    setEditingAuthorized({ ...editingAuthorized, uid: e.target.value })
                  }
                  placeholder="Firebase Auth UID"
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Teacher ID *
                </label>
                <input
                  type="text"
                  required
                  value={editingAuthorized.teacherId}
                  onChange={(e) =>
                    setEditingAuthorized({ ...editingAuthorized, teacherId: e.target.value })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingAuthorized.fullName}
                  onChange={(e) =>
                    setEditingAuthorized({ ...editingAuthorized, fullName: e.target.value })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={editingAuthorized.email}
                  onChange={(e) =>
                    setEditingAuthorized({ ...editingAuthorized, email: e.target.value })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Teacher Role
                </label>
                <select
                  value={editingAuthorized.teacherRole}
                  onChange={(e) =>
                    setEditingAuthorized({
                      ...editingAuthorized,
                      teacherRole: e.target.value as TeacherPortalRole,
                      isClassTeacher: e.target.value === 'class_teacher',
                    })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  <option value="subject_teacher">Subject Teacher</option>
                  <option value="class_teacher">Class Teacher</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Class Teacher Of
                </label>
                <select
                  value={editingAuthorized.classTeacherOf}
                  onChange={(e) =>
                    setEditingAuthorized({ ...editingAuthorized, classTeacherOf: e.target.value })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  <option value="">None</option>
                  {SUPPORTED_RESULT_CLASSES.map((c) => (
                    <option key={c.classCode} value={c.classCode}>
                      {c.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Assigned Classes (comma-separated)
                </label>
                <input
                  type="text"
                  value={editingAuthorized.assignedClassesText}
                  onChange={(e) =>
                    setEditingAuthorized({
                      ...editingAuthorized,
                      assignedClassesText: e.target.value,
                    })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Assigned Subjects (comma-separated)
                </label>
                <input
                  type="text"
                  value={editingAuthorized.assignedSubjectsText}
                  onChange={(e) =>
                    setEditingAuthorized({
                      ...editingAuthorized,
                      assignedSubjectsText: e.target.value,
                    })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2 grid grid-cols-2 gap-2 pt-1 text-xs font-semibold text-[#102B50]">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingAuthorized.canEnterMarks}
                    onChange={(e) =>
                      setEditingAuthorized({
                        ...editingAuthorized,
                        canEnterMarks: e.target.checked,
                      })
                    }
                  />
                  <span>Enter Marks (Draft)</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingAuthorized.canSubmitResults}
                    onChange={(e) =>
                      setEditingAuthorized({
                        ...editingAuthorized,
                        canSubmitResults: e.target.checked,
                      })
                    }
                  />
                  <span>Submit for Approval</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingAuthorized.canTakeAttendance}
                    onChange={(e) =>
                      setEditingAuthorized({
                        ...editingAuthorized,
                        canTakeAttendance: e.target.checked,
                      })
                    }
                  />
                  <span>Take Attendance</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingAuthorized.isActive}
                    onChange={(e) =>
                      setEditingAuthorized({
                        ...editingAuthorized,
                        isActive: e.target.checked,
                      })
                    }
                  />
                  <span>Account Active</span>
                </label>
              </div>
            </div>
            <div className="px-5 py-3.5 bg-[#F6F8FC] border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingAuthorized(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#617187]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
              >
                Save Permissions
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
