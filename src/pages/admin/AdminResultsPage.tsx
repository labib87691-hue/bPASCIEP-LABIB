import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  Eye,
  FileSpreadsheet,
  Lock,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  AcademicYearRecord,
  ExaminationRecord,
  ExamTermType,
  GradingRuleRecord,
  ResultSubjectMarkRecord,
  StudentRecord,
  StudentResultRecord,
  SubjectConfigRecord,
  SubjectMarkInput,
  SupportedClassCode,
} from '../../types/result';
import { SUPPORTED_RESULT_CLASSES } from '../../data/resultPortalSeedData';
import {
  configureClassSubject,
  configureExaminationDetails,
  configureGradingRule,
  createExamination,
  fetchAllAcademicYearsForAdmin,
  fetchAllExaminationsForAdmin,
  fetchAllGradingRulesForAdmin,
  fetchAllSubjectsForAdmin,
  fetchClassResultsForAdmin,
  fetchResultSubjectsForResult,
  publishApprovedClassResults,
  reviewSubmittedClassResults,
  saveDraftStudentResult,
  unpublishClassResults,
  upsertAcademicYear,
  validateAndPreviewStudentResult,
} from '../../services/resultManagementService';
import { fetchStudentsForAdmin } from '../../services/adminService';
import { recordActivityLog } from '../../services/activityLogService';

type ResultsTab = 'marks_entry' | 'review_publish' | 'config';

const EXAM_TERM_OPTIONS: { value: ExamTermType; label: string }[] = [
  { value: 'mid_term_1', label: '1st Mid-Term Examination' },
  { value: 'half_yearly', label: 'Half-Yearly Examination' },
  { value: 'mid_term_2', label: '2nd Mid-Term Examination' },
  { value: 'annual', label: 'Annual Examination' },
  { value: 'pre_test', label: 'Pre-Test Examination' },
  { value: 'test', label: 'Test Examination' },
  { value: 'model_test', label: 'Model Test' },
];

export const AdminResultsPage: React.FC = () => {
  const { adminProfile, can } = useAdminAuth();
  const canApprovePublish = can('approve_publish_results');

  const [activeTab, setActiveTab] = useState<ResultsTab>('review_publish');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Master data
  const [academicYears, setAcademicYears] = useState<AcademicYearRecord[]>([]);
  const [examinations, setExaminations] = useState<ExaminationRecord[]>([]);
  const [gradingRules, setGradingRules] = useState<GradingRuleRecord[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('2026');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedClassCode, setSelectedClassCode] = useState<SupportedClassCode>('class-10');

  // Class students & results
  const [classStudents, setClassStudents] = useState<StudentRecord[]>([]);
  const [classSubjects, setClassSubjects] = useState<SubjectConfigRecord[]>([]);
  const [classResults, setClassResults] = useState<StudentResultRecord[]>([]);

  // Marks Entry state
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [manualRoll, setManualRoll] = useState<string>('101');
  const [manualNameEn, setManualNameEn] = useState<string>('');
  const [manualNameBn, setManualNameBn] = useState<string>('');
  const [manualSection, setManualSection] = useState<string>('A');
  const [manualGroupEn, setManualGroupEn] = useState<string>('');
  const [positionInput, setPositionInput] = useState<string>('');
  const [markInputs, setMarkInputs] = useState<SubjectMarkInput[]>([]);

  // Review & Publish state
  const [publishDateEn, setPublishDateEn] = useState<string>(
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  );
  const [publishDateBn, setPublishDateBn] = useState<string>('২০২৬');
  const [publishShowPosition, setPublishShowPosition] = useState<boolean>(true);
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [confirmUnpublishOpen, setConfirmUnpublishOpen] = useState<boolean>(false);
  const [inspectResult, setInspectResult] = useState<{
    result: StudentResultRecord;
    subjects: ResultSubjectMarkRecord[];
  } | null>(null);

  // Config tab forms
  const [newYearForm, setNewYearForm] = useState({
    id: '2026',
    yearCode: '2026',
    labelEn: 'Academic Year 2026',
    labelBn: 'শিক্ষাবর্ষ ২০২৬',
    isCurrent: true,
    isActive: true,
    order: 1,
  });
  const [examForm, setExamForm] = useState({
    id: '',
    examCode: 'HALF_YEARLY_2026',
    nameEn: 'Half-Yearly Examination 2026',
    nameBn: 'অর্ধবার্ষিক পরীক্ষা ২০২৬',
    termType: 'half_yearly' as ExamTermType,
    showPosition: true,
    order: 2,
    applicableClasses: SUPPORTED_RESULT_CLASSES.map((c) => c.classCode),
  });
  const [subjectForm, setSubjectForm] = useState({
    id: '',
    subjectCode: 'ENG1',
    nameEn: 'English 1st Paper',
    nameBn: 'ইংরেজি ১ম পত্র',
    fullMarks: 100,
    passMarks: 33,
    hasComponents: false,
    writtenFullMarks: 70,
    writtenPassMarks: 23,
    mcqFullMarks: 30,
    mcqPassMarks: 10,
    hasPractical: false,
    practicalFullMarks: 25,
    practicalPassMarks: 8,
    isOptional: false,
    displayOrder: 1,
  });

  const loadMasterConfig = useCallback(async () => {
    setLoading(true);
    try {
      const [years, exams, rules] = await Promise.all([
        fetchAllAcademicYearsForAdmin(),
        fetchAllExaminationsForAdmin(),
        fetchAllGradingRulesForAdmin(),
      ]);
      setAcademicYears(years);
      setExaminations(exams);
      setGradingRules(rules);

      const defaultYear = years.find((y) => y.isCurrent)?.id || years[0]?.id || '2026';
      setSelectedYearId((prev) => prev || defaultYear);

      const yearExams = exams.filter((e) => e.academicYearId === defaultYear);
      const firstExamId = yearExams[0]?.id || exams[0]?.id || '';
      setSelectedExamId((prev) => prev || firstExamId);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to load result configuration.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMasterConfig();
  }, [loadMasterConfig]);

  const loadClassContext = useCallback(async () => {
    if (!selectedYearId || !selectedClassCode) return;
    try {
      const [subjects, students, results] = await Promise.all([
        fetchAllSubjectsForAdmin(selectedClassCode),
        fetchStudentsForAdmin({
          academicYearId: selectedYearId,
          classCode: selectedClassCode,
        }).catch(() => []),
        selectedExamId
          ? fetchClassResultsForAdmin(selectedYearId, selectedExamId, selectedClassCode).catch(
              () => []
            )
          : Promise.resolve([]),
      ]);

      const activeSubjects = subjects.filter((s) => s.isActive);
      setClassSubjects(activeSubjects);
      setClassStudents(students);
      setClassResults(results);

      setMarkInputs(
        activeSubjects.map((sub) => ({
          subjectId: sub.id,
          subjectCode: sub.subjectCode,
          subjectNameBn: sub.nameBn,
          subjectNameEn: sub.nameEn,
          fullMarks: sub.fullMarks,
          passMarks: sub.passMarks,
          isOptional: sub.isOptional,
          hasComponents: sub.hasComponents,
          hasPractical: sub.hasPractical,
          writtenFullMarks: sub.writtenFullMarks,
          writtenPassMarks: sub.writtenPassMarks,
          mcqFullMarks: sub.mcqFullMarks,
          mcqPassMarks: sub.mcqPassMarks,
          practicalFullMarks: sub.practicalFullMarks,
          practicalPassMarks: sub.practicalPassMarks,
          writtenMarks: sub.hasComponents ? 0 : null,
          mcqMarks: sub.hasComponents ? 0 : null,
          practicalMarks: sub.hasPractical ? 0 : null,
          obtainedMarks: 0,
          isAbsent: false,
          displayOrder: sub.displayOrder,
        }))
      );
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to load class marks context.',
      });
    }
  }, [selectedYearId, selectedExamId, selectedClassCode]);

  useEffect(() => {
    loadClassContext();
  }, [loadClassContext]);

  const activeYear = useMemo(
    () => academicYears.find((y) => y.id === selectedYearId) || academicYears[0],
    [academicYears, selectedYearId]
  );

  const filteredExams = useMemo(
    () =>
      examinations.filter(
        (e) =>
          e.academicYearId === selectedYearId &&
          (e.applicableClasses.includes(selectedClassCode) || e.applicableClasses.length === 0)
      ),
    [examinations, selectedYearId, selectedClassCode]
  );

  const activeExam = useMemo(
    () =>
      filteredExams.find((e) => e.id === selectedExamId) ||
      examinations.find((e) => e.id === selectedExamId) ||
      filteredExams[0],
    [filteredExams, examinations, selectedExamId]
  );

  const activeGradingRule = useMemo(() => {
    const classMeta = SUPPORTED_RESULT_CLASSES.find((c) => c.classCode === selectedClassCode);
    return (
      gradingRules.find((r) => r.id === classMeta?.defaultGradingRuleId) ||
      gradingRules[0] ||
      null
    );
  }, [gradingRules, selectedClassCode]);

  const livePreview = useMemo(() => {
    if (!activeGradingRule || markInputs.length === 0) return null;
    return validateAndPreviewStudentResult(markInputs, activeGradingRule);
  }, [markInputs, activeGradingRule]);

  const handleSelectRegisteredStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    const found = classStudents.find((s) => s.id === studentId);
    if (found) {
      setManualRoll(found.rollNumber);
      setManualNameEn(found.fullNameEn);
      setManualNameBn(found.fullNameBn || '');
      setManualSection(found.section || '');
      setManualGroupEn(found.groupNameEn || '');
    }
  };

  const handleMarkChange = (
    idx: number,
    field: 'obtainedMarks' | 'writtenMarks' | 'mcqMarks' | 'practicalMarks' | 'isAbsent',
    rawVal: string | boolean
  ) => {
    setMarkInputs((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        if (field === 'isAbsent') {
          const absent = Boolean(rawVal);
          return {
            ...item,
            isAbsent: absent,
            writtenMarks: absent && item.hasComponents ? 0 : item.writtenMarks,
            mcqMarks: absent && item.hasComponents ? 0 : item.mcqMarks,
            practicalMarks: absent && item.hasPractical ? 0 : item.practicalMarks,
            obtainedMarks: absent ? 0 : item.obtainedMarks,
          };
        }
        const num = rawVal === '' ? 0 : Number(rawVal);
        const updated = { ...item, [field]: Number.isFinite(num) ? num : 0 };
        if (updated.hasComponents || updated.hasPractical) {
          const w = updated.hasComponents ? Number(updated.writtenMarks || 0) : 0;
          const m = updated.hasComponents ? Number(updated.mcqMarks || 0) : 0;
          const p = updated.hasPractical ? Number(updated.practicalMarks || 0) : 0;
          updated.obtainedMarks = w + m + p;
        }
        return updated;
      })
    );
  };

  const handleSaveStudentMarksDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile || !activeYear || !activeExam || !activeGradingRule) return;
    if (!manualRoll.trim() || !manualNameEn.trim()) {
      setFeedback({
        type: 'error',
        message: 'Student Roll Number and English Full Name are required.',
      });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const studentObj: StudentRecord = {
        id: selectedStudentId || `${activeYear.id}_${selectedClassCode}_${manualRoll.trim()}`,
        academicYearId: activeYear.id,
        classCode: selectedClassCode,
        rollNumber: manualRoll.trim(),
        fullNameEn: manualNameEn.trim(),
        ...(manualNameBn.trim() ? { fullNameBn: manualNameBn.trim() } : {}),
        ...(manualSection.trim() ? { section: manualSection.trim() } : {}),
        ...(manualGroupEn.trim() ? { groupNameEn: manualGroupEn.trim() } : {}),
        isActive: true,
      };

      const saved = await saveDraftStudentResult({
        academicYear: activeYear,
        examination: activeExam,
        classCode: selectedClassCode,
        student: studentObj,
        gradingRule: activeGradingRule,
        subjectMarks: markInputs,
        position: positionInput.trim() ? Number(positionInput.trim()) : null,
      });

      await recordActivityLog({
        actionType: 'marks_saved',
        targetCollection: 'results',
        targetId: saved.resultId,
        summary: `Saved calculated draft result for Roll ${manualRoll.trim()} (${selectedClassCode}, ${activeExam.nameEn}) — ${saved.summary.letterGrade}`,
        actorRole: adminProfile.role,
      });

      setFeedback({
        type: 'success',
        message: `Draft marksheet saved for Roll ${manualRoll.trim()} (${saved.summary.letterGrade}, ${saved.summary.finalStatus}). Review and approve in the Review & Publish tab.`,
      });
      await loadClassContext();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save student result draft.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApproveClassResults = async () => {
    if (!adminProfile || !activeExam) return;
    setSaving(true);
    setFeedback(null);
    try {
      const count = await reviewSubmittedClassResults(
        selectedYearId,
        activeExam.id,
        selectedClassCode,
        'approved'
      );
      await recordActivityLog({
        actionType: 'result_approved',
        targetCollection: 'resultPublication',
        targetId: `${selectedYearId}_${activeExam.id}_${selectedClassCode}`,
        summary: `Approved ${count} result record(s) for ${selectedClassCode} — ${activeExam.nameEn}`,
        actorRole: adminProfile.role,
      });
      setFeedback({
        type: 'success',
        message: `Approved ${count} student result record(s) for ${selectedClassCode}. Ready for publication.`,
      });
      await loadClassContext();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to approve class results.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRejectClassResults = async () => {
    if (!adminProfile || !activeExam) return;
    setSaving(true);
    setFeedback(null);
    try {
      const count = await reviewSubmittedClassResults(
        selectedYearId,
        activeExam.id,
        selectedClassCode,
        'rejected',
        rejectionReason
      );
      await recordActivityLog({
        actionType: 'result_rejected',
        targetCollection: 'resultPublication',
        targetId: `${selectedYearId}_${activeExam.id}_${selectedClassCode}`,
        summary: `Rejected ${count} result record(s) for ${selectedClassCode} (${rejectionReason || 'Revision requested'})`,
        actorRole: adminProfile.role,
      });
      setRejectModalOpen(false);
      setRejectionReason('');
      setFeedback({
        type: 'success',
        message: `Returned ${count} result record(s) as rejected with revision feedback.`,
      });
      await loadClassContext();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to reject class results.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublishClassResults = async () => {
    if (!adminProfile || !activeExam) return;
    setSaving(true);
    setFeedback(null);
    try {
      const count = await publishApprovedClassResults({
        academicYearId: selectedYearId,
        examId: activeExam.id,
        classCode: selectedClassCode,
        publishedDateLabelEn: publishDateEn.trim() || '2026',
        publishedDateLabelBn: publishDateBn.trim() || '২০২৬',
        showPosition: publishShowPosition,
      });
      await recordActivityLog({
        actionType: 'result_published',
        targetCollection: 'resultPublication',
        targetId: `${selectedYearId}_${activeExam.id}_${selectedClassCode}`,
        summary: `Published ${count} approved result(s) to Public Result Portal (/result) for ${selectedClassCode} — ${activeExam.nameEn}`,
        actorRole: adminProfile.role,
      });
      setFeedback({
        type: 'success',
        message: `Published ${count} student result(s) live on /result for ${selectedClassCode}.`,
      });
      await loadClassContext();
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error && err.message === 'NO_APPROVED_RESULTS_TO_PUBLISH'
            ? 'Approve draft/submitted results first before publishing to the public portal.'
            : err instanceof Error
              ? err.message
              : 'Unable to publish class results.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUnpublishClassResults = async () => {
    if (!adminProfile || !activeExam) return;
    setSaving(true);
    setFeedback(null);
    try {
      const count = await unpublishClassResults(selectedYearId, activeExam.id, selectedClassCode);
      await recordActivityLog({
        actionType: 'result_unpublished',
        targetCollection: 'resultPublication',
        targetId: `${selectedYearId}_${activeExam.id}_${selectedClassCode}`,
        summary: `Unpublished ${count} result(s) for ${selectedClassCode} — ${activeExam.nameEn}`,
        actorRole: adminProfile.role,
      });
      setConfirmUnpublishOpen(false);
      setFeedback({
        type: 'success',
        message: `Unpublished ${count} result(s). They are immediately hidden from public /result queries.`,
      });
      await loadClassContext();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to unpublish class results.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInspectStudentSubjects = async (res: StudentResultRecord) => {
    try {
      const subjects = await fetchResultSubjectsForResult(res.id);
      setInspectResult({ result: res, subjects });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to load subject marks breakdown.',
      });
    }
  };

  const handleLoadExistingIntoEditor = async (res: StudentResultRecord) => {
    try {
      const subRecords = await fetchResultSubjectsForResult(res.id);
      setManualRoll(res.rollNumber);
      setManualNameEn(res.studentNameEn);
      setManualNameBn(res.studentNameBn || '');
      setManualSection(res.section || '');
      setManualGroupEn(res.groupNameEn || '');
      setPositionInput(res.position != null ? String(res.position) : '');
      if (subRecords.length > 0) {
        setMarkInputs(
          subRecords.map((sr) => ({
            subjectId: sr.subjectId,
            subjectCode: sr.subjectCode,
            subjectNameBn: sr.subjectNameBn,
            subjectNameEn: sr.subjectNameEn,
            fullMarks: sr.fullMarks,
            passMarks: sr.passMarks,
            isOptional: sr.isOptional,
            hasComponents: sr.hasComponents,
            hasPractical: sr.hasPractical,
            writtenFullMarks: sr.writtenFullMarks,
            mcqFullMarks: sr.mcqFullMarks,
            practicalFullMarks: sr.practicalFullMarks,
            writtenMarks: sr.writtenMarks ?? null,
            mcqMarks: sr.mcqMarks ?? null,
            practicalMarks: sr.practicalMarks ?? null,
            obtainedMarks: sr.obtainedMarks,
            isAbsent: sr.isAbsent,
            displayOrder: sr.displayOrder,
          }))
        );
      }
      setActiveTab('marks_entry');
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to load result into editor.',
      });
    }
  };

  const handleSaveAcademicYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile) return;
    setSaving(true);
    setFeedback(null);
    try {
      await upsertAcademicYear(newYearForm);
      await recordActivityLog({
        actionType: 'exam_configured',
        targetCollection: 'academicYears',
        targetId: newYearForm.id,
        summary: `Saved Academic Year ${newYearForm.labelEn}`,
        actorRole: adminProfile.role,
      });
      setFeedback({ type: 'success', message: `Saved Academic Year ${newYearForm.yearCode}.` });
      await loadMasterConfig();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save Academic Year.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveExamination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile) return;
    setSaving(true);
    setFeedback(null);
    try {
      const cleanId =
        examForm.id.trim() ||
        `${selectedYearId}_${examForm.termType}_${Date.now().toString(36).slice(-4)}`;
      if (examinations.some((ex) => ex.id === cleanId)) {
        await configureExaminationDetails(cleanId, {
          examCode: examForm.examCode,
          nameEn: examForm.nameEn,
          nameBn: examForm.nameBn,
          termType: examForm.termType,
          applicableClasses: examForm.applicableClasses,
          showPosition: examForm.showPosition,
          order: examForm.order,
        });
      } else {
        await createExamination({
          id: cleanId,
          academicYearId: selectedYearId,
          examCode: examForm.examCode,
          nameEn: examForm.nameEn,
          nameBn: examForm.nameBn,
          termType: examForm.termType,
          applicableClasses: examForm.applicableClasses,
          showPosition: examForm.showPosition,
          order: examForm.order,
        });
      }
      await recordActivityLog({
        actionType: 'exam_configured',
        targetCollection: 'examinations',
        targetId: cleanId,
        summary: `Configured examination "${examForm.nameEn}" (${selectedYearId})`,
        actorRole: adminProfile.role,
      });
      setFeedback({ type: 'success', message: `Saved examination "${examForm.nameEn}".` });
      await loadMasterConfig();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save examination.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSubjectConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile) return;
    setSaving(true);
    setFeedback(null);
    try {
      const id = await configureClassSubject({
        id: subjectForm.id || `${selectedClassCode}_${subjectForm.subjectCode.trim()}`,
        subjectCode: subjectForm.subjectCode.trim(),
        classCode: selectedClassCode,
        nameEn: subjectForm.nameEn.trim(),
        nameBn: subjectForm.nameBn.trim() || subjectForm.nameEn.trim(),
        fullMarks: Number(subjectForm.fullMarks),
        passMarks: Number(subjectForm.passMarks),
        hasComponents: subjectForm.hasComponents,
        ...(subjectForm.hasComponents
          ? {
              writtenFullMarks: Number(subjectForm.writtenFullMarks),
              writtenPassMarks: Number(subjectForm.writtenPassMarks),
              mcqFullMarks: Number(subjectForm.mcqFullMarks),
              mcqPassMarks: Number(subjectForm.mcqPassMarks),
            }
          : {}),
        hasPractical: subjectForm.hasPractical,
        ...(subjectForm.hasPractical
          ? {
              practicalFullMarks: Number(subjectForm.practicalFullMarks),
              practicalPassMarks: Number(subjectForm.practicalPassMarks),
            }
          : {}),
        isOptional: subjectForm.isOptional,
        displayOrder: Number(subjectForm.displayOrder) || 1,
        isActive: true,
      });
      await recordActivityLog({
        actionType: 'exam_configured',
        targetCollection: 'subjects',
        targetId: id,
        summary: `Configured subject "${subjectForm.nameEn}" (${subjectForm.fullMarks} marks) for ${selectedClassCode}`,
        actorRole: adminProfile.role,
      });
      setFeedback({
        type: 'success',
        message: `Saved subject "${subjectForm.nameEn}" for ${selectedClassCode}.`,
      });
      await loadClassContext();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save subject configuration.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSyncDefaultGradingRules = async () => {
    if (!adminProfile || gradingRules.length === 0) return;
    setSaving(true);
    setFeedback(null);
    try {
      for (const rule of gradingRules) {
        await configureGradingRule(rule);
      }
      await recordActivityLog({
        actionType: 'exam_configured',
        targetCollection: 'gradingRules',
        targetId: 'all_rules',
        summary: `Verified & persisted ${gradingRules.length} institutional GPA/grade scales to Firestore`,
        actorRole: adminProfile.role,
      });
      setFeedback({
        type: 'success',
        message: `Synced ${gradingRules.length} institutional grading rules to Firestore.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to sync grading rules.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#102B50]">
            Result Management & Publication Control
          </h1>
          <p className="text-sm text-[#617187] mt-0.5">
            Configure exams, calculate marksheets, review submitted results, and control public{' '}
            <code className="text-xs font-mono text-[#1F5FAF]">/result</code> publication
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            loadMasterConfig();
            loadClassContext();
          }}
          disabled={loading}
          className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 rounded hover:bg-black/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Context Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[#102B50] mb-1">Academic Year</label>
          <select
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm text-[#17263C] bg-white focus:border-[#1F5FAF] focus:outline-none"
          >
            {academicYears.map((yr) => (
              <option key={yr.id} value={yr.id}>
                {yr.labelEn} ({yr.yearCode})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#102B50] mb-1">Examination</label>
          <select
            value={activeExam?.id || ''}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm text-[#17263C] bg-white focus:border-[#1F5FAF] focus:outline-none"
          >
            {filteredExams.length === 0 && <option value="">No exam for selected year</option>}
            {filteredExams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.nameEn}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#102B50] mb-1">Class</label>
          <select
            value={selectedClassCode}
            onChange={(e) => setSelectedClassCode(e.target.value as SupportedClassCode)}
            className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm text-[#17263C] bg-white focus:border-[#1F5FAF] focus:outline-none"
          >
            {SUPPORTED_RESULT_CLASSES.map((cls) => (
              <option key={cls.classCode} value={cls.classCode}>
                {cls.nameEn} ({cls.nameBn})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Module Tabs */}
      <div className="border-b border-slate-200 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('review_publish')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'review_publish'
              ? 'border-[#1F5FAF] text-[#102B50]'
              : 'border-transparent text-[#617187] hover:text-[#102B50]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Review, Approve & Publish ({classResults.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('marks_entry')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'marks_entry'
              ? 'border-[#1F5FAF] text-[#102B50]'
              : 'border-transparent text-[#617187] hover:text-[#102B50]'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Marks Entry & GPA Calculator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'config'
              ? 'border-[#1F5FAF] text-[#102B50]'
              : 'border-transparent text-[#617187] hover:text-[#102B50]'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span>Exams, Subjects & Grading Rules</span>
        </button>
      </div>

      {/* TAB 1: REVIEW, APPROVE & PUBLISH */}
      {activeTab === 'review_publish' && (
        <div className="space-y-5">
          {/* Approval & Publication Control Strip */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#102B50]">
                  Class Result Workflow & Public Portal Gatekeeper
                </h2>
                <p className="text-xs text-[#617187] mt-0.5">
                  Unpublished, draft, submitted, or rejected results are blocked at the Firestore
                  rule level from appearing on <code className="font-mono">/result</code>.
                </p>
              </div>

              {canApprovePublish ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={saving || classResults.length === 0}
                    onClick={handleApproveClassResults}
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-800 text-xs font-semibold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Class Results</span>
                  </button>

                  <button
                    type="button"
                    disabled={saving || classResults.length === 0}
                    onClick={() => setRejectModalOpen(true)}
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 text-amber-800 text-xs font-semibold"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject with Reason</span>
                  </button>

                  <button
                    type="button"
                    disabled={saving || classResults.length === 0}
                    onClick={handlePublishClassResults}
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] disabled:opacity-50 text-white text-xs font-semibold"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Publish Approved Results</span>
                  </button>

                  <button
                    type="button"
                    disabled={saving || !classResults.some((r) => r.isPublished)}
                    onClick={() => setConfirmUnpublishOpen(true)}
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-700 text-xs font-semibold"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Unpublish</span>
                  </button>
                </div>
              ) : (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                  Super Admin, Admin, or Result Manager role required to publish
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Published Date Label (English)
                </label>
                <input
                  type="text"
                  value={publishDateEn}
                  onChange={(e) => setPublishDateEn(e.target.value)}
                  className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-[#17263C]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Published Date Label (Bengali)
                </label>
                <input
                  type="text"
                  value={publishDateBn}
                  onChange={(e) => setPublishDateBn(e.target.value)}
                  className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-[#17263C]"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#102B50] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publishShowPosition}
                    onChange={(e) => setPublishShowPosition(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#1F5FAF]"
                  />
                  <span>Display Merit Position on Public Marksheets</span>
                </label>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="text-sm font-bold text-[#102B50]">
                Stored Result Records ({classResults.length})
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('marks_entry')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F6F8FC] hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-[#102B50]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Enter Student Marks</span>
              </button>
            </div>

            {classResults.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-sm font-semibold text-[#102B50]">
                  No result records saved yet for this Class & Examination
                </div>
                <p className="text-xs text-[#617187] max-w-md mx-auto">
                  Switch to the Marks Entry & GPA Calculator tab to enter student marks, validate
                  full/pass thresholds, and compute grades automatically.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F6F8FC] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-[#617187]">
                      <th className="py-3 px-4">Roll</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Marks</th>
                      <th className="py-3 px-4">GPA / %</th>
                      <th className="py-3 px-4">Grade</th>
                      <th className="py-3 px-4">Outcome</th>
                      <th className="py-3 px-4">Workflow</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {classResults.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-bold text-[#102B50] tabular-nums">
                          {res.rollNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#17263C]">{res.studentNameEn}</div>
                          {res.section && (
                            <div className="text-xs text-[#617187]">Section {res.section}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 tabular-nums text-[#17263C]">
                          {res.obtainedTotalMarks} / {res.totalFullMarks}
                        </td>
                        <td className="py-3 px-4 tabular-nums font-semibold text-[#102B50]">
                          {res.gpa != null
                            ? `GPA ${res.gpa.toFixed(2)}`
                            : res.percentage != null
                              ? `${res.percentage.toFixed(1)}%`
                              : '—'}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#102B50]">{res.letterGrade}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                              res.finalStatus === 'PASS'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {res.finalStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                              res.isPublished
                                ? 'bg-emerald-100 text-emerald-800'
                                : res.workflowStatus === 'approved'
                                  ? 'bg-blue-50 text-blue-700'
                                  : res.workflowStatus === 'rejected'
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {res.isPublished ? 'Published' : res.workflowStatus}
                          </span>
                          {res.rejectionReason && (
                            <div className="text-[11px] text-red-600 mt-0.5 max-w-[180px] truncate">
                              Reason: {res.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleInspectStudentSubjects(res)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoadExistingIntoEditor(res)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#1F5FAF]"
                          >
                            Edit Marks
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MARKS ENTRY & GPA CALCULATOR */}
      {activeTab === 'marks_entry' && (
        <form onSubmit={handleSaveStudentMarksDraft} className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="text-base font-bold text-[#102B50]">
              1. Student Identity ({selectedClassCode})
            </h2>

            {classStudents.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Quick-Fill from Registered Class Students ({classStudents.length} found)
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleSelectRegisteredStudent(e.target.value)}
                  className="w-full sm:max-w-md min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-[#F6F8FC]"
                >
                  <option value="">-- Select a registered student or enter manually --</option>
                  {classStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      Roll {st.rollNumber} — {st.fullNameEn}
                      {st.section ? ` (${st.section})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Roll Number *
                </label>
                <input
                  type="text"
                  required
                  value={manualRoll}
                  onChange={(e) => setManualRoll(e.target.value)}
                  placeholder="e.g. 101"
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Student Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={manualNameEn}
                  onChange={(e) => setManualNameEn(e.target.value)}
                  placeholder="Full name in English"
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Name (Bengali)
                </label>
                <input
                  type="text"
                  value={manualNameBn}
                  onChange={(e) => setManualNameBn(e.target.value)}
                  placeholder="বাংলা নাম"
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">Section</label>
                <input
                  type="text"
                  value={manualSection}
                  onChange={(e) => setManualSection(e.target.value)}
                  placeholder="A"
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Merit Position
                </label>
                <input
                  type="number"
                  min={1}
                  value={positionInput}
                  onChange={(e) => setPositionInput(e.target.value)}
                  placeholder="Optional"
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Subject Marks Grid */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[#102B50]">
                  2. Subject Marks Entry & Real-Time Validation
                </h2>
                <p className="text-xs text-[#617187]">
                  Active Grading Scale: {activeGradingRule?.nameEn || 'Standard GPA 5.00'}
                </p>
              </div>
              {livePreview?.calculation && (
                <div className="flex items-center gap-3 text-xs font-bold tabular-nums">
                  <span className="px-2.5 py-1 rounded bg-[#F6F8FC] border border-slate-200 text-[#102B50]">
                    Total: {livePreview.calculation.obtainedTotalMarks} /{' '}
                    {livePreview.calculation.totalFullMarks}
                  </span>
                  {livePreview.calculation.gpa != null && (
                    <span className="px-2.5 py-1 rounded bg-[#102B50] text-white">
                      GPA {livePreview.calculation.gpa.toFixed(2)} (
                      {livePreview.calculation.letterGrade})
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-1 rounded ${
                      livePreview.calculation.finalStatus === 'PASS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {livePreview.calculation.finalStatus}
                  </span>
                </div>
              )}
            </div>

            {livePreview && !livePreview.isValid && (
              <div className="m-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 space-y-1">
                <div className="font-bold">Marks Validation Issues:</div>
                {livePreview.issues.map((iss, idx) => (
                  <div key={idx}>• {iss.messageEn}</div>
                ))}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F6F8FC] border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-[#617187]">
                    <th className="py-2.5 px-4">Subject</th>
                    <th className="py-2.5 px-3">Full / Pass</th>
                    <th className="py-2.5 px-3">Written (CQ)</th>
                    <th className="py-2.5 px-3">MCQ</th>
                    <th className="py-2.5 px-3">Practical</th>
                    <th className="py-2.5 px-3">Total Marks</th>
                    <th className="py-2.5 px-3">Absent</th>
                    <th className="py-2.5 px-4">Calculated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {markInputs.map((sub, idx) => {
                    const calcSub = livePreview?.calculation?.subjects[idx];
                    return (
                      <tr key={sub.subjectId} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-[#102B50]">
                            {sub.subjectNameEn}{' '}
                            {sub.isOptional && (
                              <span className="text-[11px] font-semibold text-[#1F5FAF]">
                                (4th Optional)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#617187]">{sub.subjectCode}</div>
                        </td>
                        <td className="py-2.5 px-3 text-xs tabular-nums text-[#617187]">
                          {sub.fullMarks} / {sub.passMarks}
                        </td>
                        <td className="py-2.5 px-3">
                          {sub.hasComponents ? (
                            <input
                              type="number"
                              min={0}
                              max={sub.writtenFullMarks || sub.fullMarks}
                              disabled={sub.isAbsent}
                              value={sub.writtenMarks ?? 0}
                              onChange={(e) =>
                                handleMarkChange(idx, 'writtenMarks', e.target.value)
                              }
                              className="w-20 px-2.5 py-1.5 rounded border border-slate-200 text-sm tabular-nums"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {sub.hasComponents ? (
                            <input
                              type="number"
                              min={0}
                              max={sub.mcqFullMarks || sub.fullMarks}
                              disabled={sub.isAbsent}
                              value={sub.mcqMarks ?? 0}
                              onChange={(e) => handleMarkChange(idx, 'mcqMarks', e.target.value)}
                              className="w-20 px-2.5 py-1.5 rounded border border-slate-200 text-sm tabular-nums"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {sub.hasPractical ? (
                            <input
                              type="number"
                              min={0}
                              max={sub.practicalFullMarks || sub.fullMarks}
                              disabled={sub.isAbsent}
                              value={sub.practicalMarks ?? 0}
                              onChange={(e) =>
                                handleMarkChange(idx, 'practicalMarks', e.target.value)
                              }
                              className="w-20 px-2.5 py-1.5 rounded border border-slate-200 text-sm tabular-nums"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min={0}
                            max={sub.fullMarks}
                            disabled={sub.isAbsent || sub.hasComponents || sub.hasPractical}
                            value={sub.obtainedMarks}
                            onChange={(e) => handleMarkChange(idx, 'obtainedMarks', e.target.value)}
                            className="w-24 px-2.5 py-1.5 rounded border border-slate-200 text-sm font-semibold tabular-nums disabled:bg-slate-100"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="checkbox"
                            checked={Boolean(sub.isAbsent)}
                            onChange={(e) => handleMarkChange(idx, 'isAbsent', e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-xs font-bold tabular-nums">
                          {calcSub ? (
                            <span
                              className={calcSub.isPassed ? 'text-emerald-700' : 'text-red-600'}
                            >
                              {calcSub.letterGrade} ({calcSub.gradePoint.toFixed(2)})
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-[#F6F8FC] border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={saving || Boolean(livePreview && !livePreview.isValid)}
                className="inline-flex items-center gap-2 min-h-[42px] px-5 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] disabled:opacity-50 text-white text-sm font-semibold"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Draft...' : 'Save Calculated Result Draft'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: EXAMS, SUBJECTS & GRADING CONFIG */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create / Update Examination */}
          <form
            onSubmit={handleSaveExamination}
            className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
          >
            <h2 className="text-base font-bold text-[#102B50]">
              Configure Examination ({selectedYearId})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Exam Code *
                </label>
                <input
                  type="text"
                  required
                  value={examForm.examCode}
                  onChange={(e) => setExamForm({ ...examForm, examCode: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Term Type *
                </label>
                <select
                  value={examForm.termType}
                  onChange={(e) =>
                    setExamForm({ ...examForm, termType: e.target.value as ExamTermType })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  {EXAM_TERM_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Examination Title (English) *
                </label>
                <input
                  type="text"
                  required
                  value={examForm.nameEn}
                  onChange={(e) => setExamForm({ ...examForm, nameEn: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Examination Title (Bengali) *
                </label>
                <input
                  type="text"
                  required
                  value={examForm.nameBn}
                  onChange={(e) => setExamForm({ ...examForm, nameBn: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#102B50]">
              <input
                type="checkbox"
                checked={examForm.showPosition}
                onChange={(e) => setExamForm({ ...examForm, showPosition: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span>Enable Merit Position Calculation for this Exam</span>
            </label>
            <div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Examination</span>
              </button>
            </div>
          </form>

          {/* Configure Subject for Selected Class */}
          <form
            onSubmit={handleSaveSubjectConfig}
            className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
          >
            <h2 className="text-base font-bold text-[#102B50]">
              Configure Subject ({selectedClassCode})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Subject Code *
                </label>
                <input
                  type="text"
                  required
                  value={subjectForm.subjectCode}
                  onChange={(e) => setSubjectForm({ ...subjectForm, subjectCode: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min={1}
                  value={subjectForm.displayOrder}
                  onChange={(e) =>
                    setSubjectForm({ ...subjectForm, displayOrder: Number(e.target.value) })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Subject Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={subjectForm.nameEn}
                  onChange={(e) => setSubjectForm({ ...subjectForm, nameEn: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Subject Name (Bengali)
                </label>
                <input
                  type="text"
                  value={subjectForm.nameBn}
                  onChange={(e) => setSubjectForm({ ...subjectForm, nameBn: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Full Marks *
                </label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  required
                  value={subjectForm.fullMarks}
                  onChange={(e) =>
                    setSubjectForm({ ...subjectForm, fullMarks: Number(e.target.value) })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Pass Marks *
                </label>
                <input
                  type="number"
                  min={0}
                  max={500}
                  required
                  value={subjectForm.passMarks}
                  onChange={(e) =>
                    setSubjectForm({ ...subjectForm, passMarks: Number(e.target.value) })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#102B50]">
                <input
                  type="checkbox"
                  checked={subjectForm.hasComponents}
                  onChange={(e) =>
                    setSubjectForm({ ...subjectForm, hasComponents: e.target.checked })
                  }
                  className="w-4 h-4 rounded"
                />
                <span>Written + MCQ Split</span>
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#102B50]">
                <input
                  type="checkbox"
                  checked={subjectForm.hasPractical}
                  onChange={(e) =>
                    setSubjectForm({ ...subjectForm, hasPractical: e.target.checked })
                  }
                  className="w-4 h-4 rounded"
                />
                <span>Includes Practical</span>
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#102B50]">
                <input
                  type="checkbox"
                  checked={subjectForm.isOptional}
                  onChange={(e) => setSubjectForm({ ...subjectForm, isOptional: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span>4th Optional Subject</span>
              </label>
            </div>
            <div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Subject Configuration</span>
              </button>
            </div>
          </form>

          {/* Academic Year & Grading Rules Persistence */}
          <form
            onSubmit={handleSaveAcademicYear}
            className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
          >
            <h2 className="text-base font-bold text-[#102B50]">Add / Update Academic Year</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Year Code (ID) *
                </label>
                <input
                  type="text"
                  required
                  value={newYearForm.yearCode}
                  onChange={(e) =>
                    setNewYearForm({
                      ...newYearForm,
                      id: e.target.value,
                      yearCode: e.target.value,
                    })
                  }
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#102B50] mb-1">
                  Label (English) *
                </label>
                <input
                  type="text"
                  required
                  value={newYearForm.labelEn}
                  onChange={(e) => setNewYearForm({ ...newYearForm, labelEn: e.target.value })}
                  className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-[#102B50] text-xs font-semibold"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Academic Year</span>
            </button>
          </form>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <h2 className="text-base font-bold text-[#102B50]">
              Institutional Grading Rules ({gradingRules.length})
            </h2>
            <p className="text-xs text-[#617187]">
              BPSC uses standard NCTB GPA 5.00 grading scales (A+ = 80–100%, Pass = 33% with
              component pass enforcement for Classes 9–10).
            </p>
            <ul className="space-y-1.5 text-xs text-[#17263C]">
              {gradingRules.map((r) => (
                <li
                  key={r.id}
                  className="p-2.5 rounded-lg bg-[#F6F8FC] border border-slate-200 flex items-center justify-between"
                >
                  <span className="font-semibold text-[#102B50]">{r.nameEn}</span>
                  <span className="tabular-nums text-[#617187]">Max GPA {r.maxGpa.toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={saving}
              onClick={handleSyncDefaultGradingRules}
              className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-[#102B50] text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Grading Scales to Firestore</span>
            </button>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setRejectModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-[#102B50]">Reject Class Results</h3>
            <p className="text-xs text-[#617187]">
              Provide a clear correction note so teachers or result operators can revise the
              marksheets.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Verify Practical marks for Roll 104 and Roll 109"
              className="w-full p-3 rounded-lg border border-slate-200 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#617187]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleRejectClassResults}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unpublish Confirmation Modal */}
      {confirmUnpublishOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setConfirmUnpublishOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-[#102B50]">Unpublish Class Results?</h3>
            <p className="text-xs text-[#617187]">
              Unpublishing immediately hides all marksheets for <strong>{selectedClassCode}</strong>{' '}
              ({activeExam?.nameEn}) from the public <code className="font-mono">/result</code>{' '}
              portal without deleting stored marks.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmUnpublishOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#617187]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleUnpublishClassResults}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                Yes, Unpublish Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subject Breakdown Inspect Modal */}
      {inspectResult && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/60 flex items-center justify-center p-4"
          onClick={() => setInspectResult(null)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#102B50]">
                  Roll {inspectResult.result.rollNumber} — {inspectResult.result.studentNameEn}
                </h3>
                <p className="text-xs text-[#617187]">
                  {inspectResult.result.classNameEn} • {inspectResult.result.examNameEn} • Grade:{' '}
                  <strong>{inspectResult.result.letterGrade}</strong> (
                  {inspectResult.result.finalStatus})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectResult(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-[#617187]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 max-h-[70dvh] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[#617187]">
                    <th className="py-2">Subject</th>
                    <th className="py-2">Full</th>
                    <th className="py-2">Obtained</th>
                    <th className="py-2">Grade</th>
                    <th className="py-2">GP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inspectResult.subjects.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2 font-semibold text-[#102B50]">{s.subjectNameEn}</td>
                      <td className="py-2 tabular-nums">{s.fullMarks}</td>
                      <td className="py-2 tabular-nums font-semibold">
                        {s.isAbsent ? 'Absent' : s.obtainedMarks}
                      </td>
                      <td className="py-2 font-bold">{s.letterGrade}</td>
                      <td className="py-2 tabular-nums">{s.gradePoint.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
