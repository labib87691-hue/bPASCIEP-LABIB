import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  isFirebaseConfigured,
  OperationType,
} from '../lib/firebase';
import {
  AcademicYearRecord,
  ExaminationRecord,
  GradingRuleRecord,
  ResultCalculationSummary,
  ResultPublicationRecord,
  ResultSubjectMarkRecord,
  ResultWorkflowStatus,
  StudentRecord,
  StudentResultRecord,
  SubjectConfigRecord,
  SubjectMarkInput,
  SupportedClassCode,
} from '../types/result';
import {
  DEFAULT_ACADEMIC_YEARS,
  DEFAULT_EXAMINATIONS,
  DEFAULT_GRADING_RULES,
  DEFAULT_SUBJECT_CONFIGS,
  SUPPORTED_RESULT_CLASSES,
} from '../data/resultPortalSeedData';
import {
  buildPublicationDocId,
  buildResultDocId,
  buildResultSubjectDocId,
  calculateInstitutionalResult,
  isValidCanonicalRoll,
  MarksValidationIssue,
  normalizeRollNumber,
  validateSubjectMarkInputs,
} from './resultCalculationEngine';

/**
 * Phase 2 Result Management Foundation Service
 * ----------------------------------------------------------------------------
 * Reusable backend workflow engine designed for integration by:
 * - Phase 4: Master Admin Panel (exam creation, grading config, approval, publish/unpublish)
 * - Phase 5: Teacher Panel (marks entry, validation, calculation, draft save, submit for approval)
 *
 * Security enforcement is backed by Firestore Security Rules (`firestore.rules`):
 * - Teachers can save drafts and submit for approval (`isPublished == false`), NEVER publish.
 * - Only verified Administrators (`isAdmin()`) can approve, reject, publish, or unpublish results.
 */

const SAFE_ID_REGEX = /^[a-zA-Z0-9_\-]+$/;

function assertDbConfigured() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  return db;
}

function assertValidDocId(id: string, label: string) {
  if (!id || id.length > 128 || !SAFE_ID_REGEX.test(id)) {
    throw new Error(`INVALID_${label.toUpperCase()}_ID`);
  }
}

// ---------------------------------------------------------------------------
// Step 1 & 2: Create & Configure Examination Details
// ---------------------------------------------------------------------------

export interface CreateExaminationInput {
  id: string;
  examCode: string;
  academicYearId: string;
  nameBn: string;
  nameEn: string;
  termType: ExaminationRecord['termType'];
  applicableClasses: SupportedClassCode[];
  examSessionBn?: string;
  examSessionEn?: string;
  showPosition: boolean;
  order: number;
}

export async function createExamination(input: CreateExaminationInput): Promise<string> {
  const firestore = assertDbConfigured();
  assertValidDocId(input.id, 'examination');
  assertValidDocId(input.academicYearId, 'academic_year');

  if (input.applicableClasses.length === 0 || input.applicableClasses.length > 11) {
    throw new Error('INVALID_APPLICABLE_CLASSES');
  }

  const path = `examinations/${input.id}`;
  try {
    await setDoc(doc(firestore, 'examinations', input.id), {
      examCode: input.examCode.trim().slice(0, 60),
      academicYearId: input.academicYearId.trim(),
      nameBn: input.nameBn.trim().slice(0, 200),
      nameEn: input.nameEn.trim().slice(0, 200),
      termType: input.termType,
      applicableClasses: input.applicableClasses,
      ...(input.examSessionBn ? { examSessionBn: input.examSessionBn.trim().slice(0, 80) } : {}),
      ...(input.examSessionEn ? { examSessionEn: input.examSessionEn.trim().slice(0, 80) } : {}),
      showPosition: Boolean(input.showPosition),
      isActive: true,
      order: Number(input.order) || 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return input.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function configureExaminationDetails(
  examId: string,
  updates: Partial<Omit<CreateExaminationInput, 'id' | 'academicYearId'>> & {
    isActive?: boolean;
  }
): Promise<void> {
  const firestore = assertDbConfigured();
  assertValidDocId(examId, 'examination');

  const path = `examinations/${examId}`;
  try {
    await updateDoc(doc(firestore, 'examinations', examId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ---------------------------------------------------------------------------
// Step 3 & 4: Academic Year, Class Context & Student Registry Management
// ---------------------------------------------------------------------------

export async function upsertAcademicYear(record: AcademicYearRecord): Promise<void> {
  const firestore = assertDbConfigured();
  assertValidDocId(record.id, 'academic_year');

  const path = `academicYears/${record.id}`;
  try {
    await setDoc(doc(firestore, 'academicYears', record.id), {
      yearCode: record.yearCode.trim().slice(0, 20),
      labelBn: record.labelBn.trim().slice(0, 120),
      labelEn: record.labelEn.trim().slice(0, 120),
      isCurrent: Boolean(record.isCurrent),
      isActive: Boolean(record.isActive),
      order: Number(record.order) || 1,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function registerOrUpdateStudent(student: StudentRecord): Promise<string> {
  const firestore = assertDbConfigured();
  const canonicalRoll = normalizeRollNumber(student.rollNumber);
  if (!isValidCanonicalRoll(canonicalRoll)) {
    throw new Error('INVALID_STUDENT_ROLL');
  }

  const studentDocId =
    student.id || `${student.academicYearId}_${student.classCode}_${canonicalRoll}`;
  assertValidDocId(studentDocId, 'student');

  const path = `students/${studentDocId}`;
  try {
    await setDoc(doc(firestore, 'students', studentDocId), {
      ...(student.studentCode ? { studentCode: student.studentCode.trim().slice(0, 60) } : {}),
      academicYearId: student.academicYearId.trim(),
      classCode: student.classCode,
      rollNumber: canonicalRoll,
      fullNameEn: student.fullNameEn.trim().slice(0, 160),
      ...(student.fullNameBn ? { fullNameBn: student.fullNameBn.trim().slice(0, 160) } : {}),
      ...(student.section ? { section: student.section.trim().slice(0, 40) } : {}),
      ...(student.groupNameEn ? { groupNameEn: student.groupNameEn.trim().slice(0, 60) } : {}),
      ...(student.groupNameBn ? { groupNameBn: student.groupNameBn.trim().slice(0, 60) } : {}),
      ...(student.guardianName ? { guardianName: student.guardianName.trim().slice(0, 160) } : {}),
      ...(student.guardianPhone ? { guardianPhone: student.guardianPhone.trim().slice(0, 30) } : {}),
      isActive: Boolean(student.isActive),
      updatedAt: serverTimestamp(),
    });
    return studentDocId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ---------------------------------------------------------------------------
// Step 5: Configure Subjects, Full Marks & Grading Rules
// ---------------------------------------------------------------------------

export async function configureClassSubject(subject: SubjectConfigRecord): Promise<string> {
  const firestore = assertDbConfigured();
  const subjectDocId = subject.id || `${subject.classCode}_${subject.subjectCode}`;
  assertValidDocId(subjectDocId, 'subject');

  if (subject.fullMarks <= 0 || subject.fullMarks > 500) {
    throw new Error('INVALID_SUBJECT_FULL_MARKS');
  }
  if (subject.passMarks < 0 || subject.passMarks > subject.fullMarks) {
    throw new Error('INVALID_SUBJECT_PASS_MARKS');
  }

  const path = `subjects/${subjectDocId}`;
  try {
    await setDoc(doc(firestore, 'subjects', subjectDocId), {
      subjectCode: subject.subjectCode.trim().slice(0, 30),
      classCode: subject.classCode,
      nameBn: subject.nameBn.trim().slice(0, 160),
      nameEn: subject.nameEn.trim().slice(0, 160),
      fullMarks: subject.fullMarks,
      passMarks: subject.passMarks,
      hasComponents: Boolean(subject.hasComponents),
      ...(subject.writtenFullMarks != null ? { writtenFullMarks: subject.writtenFullMarks } : {}),
      ...(subject.writtenPassMarks != null ? { writtenPassMarks: subject.writtenPassMarks } : {}),
      ...(subject.mcqFullMarks != null ? { mcqFullMarks: subject.mcqFullMarks } : {}),
      ...(subject.mcqPassMarks != null ? { mcqPassMarks: subject.mcqPassMarks } : {}),
      hasPractical: Boolean(subject.hasPractical),
      ...(subject.practicalFullMarks != null
        ? { practicalFullMarks: subject.practicalFullMarks }
        : {}),
      ...(subject.practicalPassMarks != null
        ? { practicalPassMarks: subject.practicalPassMarks }
        : {}),
      isOptional: Boolean(subject.isOptional),
      displayOrder: subject.displayOrder,
      isActive: Boolean(subject.isActive),
      updatedAt: serverTimestamp(),
    });
    return subjectDocId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function configureGradingRule(rule: GradingRuleRecord): Promise<string> {
  const firestore = assertDbConfigured();
  assertValidDocId(rule.id, 'grading_rule');

  if (!Array.isArray(rule.gradeScale) || rule.gradeScale.length === 0 || rule.gradeScale.length > 12) {
    throw new Error('INVALID_GRADE_SCALE');
  }

  const path = `gradingRules/${rule.id}`;
  try {
    await setDoc(doc(firestore, 'gradingRules', rule.id), {
      ruleCode: rule.ruleCode.trim().slice(0, 60),
      nameBn: rule.nameBn.trim().slice(0, 200),
      nameEn: rule.nameEn.trim().slice(0, 200),
      descriptionBn: rule.descriptionBn.trim().slice(0, 800),
      descriptionEn: rule.descriptionEn.trim().slice(0, 800),
      maxGpa: rule.maxGpa,
      defaultPassPercentage: rule.defaultPassPercentage,
      requireComponentPass: Boolean(rule.requireComponentPass),
      enableOptionalBonus: Boolean(rule.enableOptionalBonus),
      optionalBonusThreshold: rule.optionalBonusThreshold,
      calculateGpa: Boolean(rule.calculateGpa),
      calculatePercentage: Boolean(rule.calculatePercentage),
      gradeScale: rule.gradeScale,
      isActive: Boolean(rule.isActive),
      updatedAt: serverTimestamp(),
    });
    return rule.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ---------------------------------------------------------------------------
// Step 6, 7 & 8: Enter Student Marks, Validate Marks & Calculate Results
// ---------------------------------------------------------------------------

export function validateAndPreviewStudentResult(
  marks: SubjectMarkInput[],
  gradingRule: GradingRuleRecord
): {
  isValid: boolean;
  issues: MarksValidationIssue[];
  calculation: ResultCalculationSummary | null;
} {
  const issues = validateSubjectMarkInputs(marks);
  if (issues.length > 0) {
    return { isValid: false, issues, calculation: null };
  }
  const calculation = calculateInstitutionalResult(marks, gradingRule);
  return { isValid: true, issues: [], calculation };
}

// ---------------------------------------------------------------------------
// Step 9: Save Draft Results (Teacher / Admin)
// ---------------------------------------------------------------------------

export interface SaveDraftResultPayload {
  academicYear: AcademicYearRecord;
  examination: ExaminationRecord;
  classCode: SupportedClassCode;
  student: StudentRecord;
  gradingRule?: GradingRuleRecord;
  subjectMarks: SubjectMarkInput[];
  position?: number | null;
}

export async function saveDraftStudentResult(
  payload: SaveDraftResultPayload
): Promise<{ resultId: string; summary: ResultCalculationSummary }> {
  const firestore = assertDbConfigured();
  const currentUid = auth?.currentUser?.uid;
  if (!currentUid) {
    throw new Error('AUTHENTICATION_REQUIRED');
  }

  const canonicalRoll = normalizeRollNumber(payload.student.rollNumber);
  if (!isValidCanonicalRoll(canonicalRoll)) {
    throw new Error('INVALID_STUDENT_ROLL');
  }

  const classMeta = SUPPORTED_RESULT_CLASSES.find((c) => c.classCode === payload.classCode);
  if (!classMeta) {
    throw new Error('INVALID_CLASS_CODE');
  }

  const activeRule =
    payload.gradingRule ||
    DEFAULT_GRADING_RULES.find((r) => r.id === classMeta.defaultGradingRuleId) ||
    DEFAULT_GRADING_RULES[0];

  const { isValid, issues, calculation } = validateAndPreviewStudentResult(
    payload.subjectMarks,
    activeRule
  );
  if (!isValid || !calculation) {
    throw new Error(`MARKS_VALIDATION_FAILED: ${issues.map((i) => i.messageEn).join('; ')}`);
  }

  const resultId = buildResultDocId(
    payload.academicYear.id,
    payload.examination.id,
    payload.classCode,
    canonicalRoll
  );
  const publicationId = buildPublicationDocId(
    payload.academicYear.id,
    payload.examination.id,
    payload.classCode
  );

  assertValidDocId(resultId, 'result');
  assertValidDocId(publicationId, 'publication');

  const batch = writeBatch(firestore);
  const resultRef = doc(firestore, 'results', resultId);

  batch.set(resultRef, {
    academicYearId: payload.academicYear.id,
    academicYearLabelBn: payload.academicYear.labelBn.slice(0, 120),
    academicYearLabelEn: payload.academicYear.labelEn.slice(0, 120),
    examId: payload.examination.id,
    examNameBn: payload.examination.nameBn.slice(0, 200),
    examNameEn: payload.examination.nameEn.slice(0, 200),
    classCode: payload.classCode,
    classNameBn: classMeta.nameBn,
    classNameEn: classMeta.nameEn,
    rollNumber: canonicalRoll,
    studentId: payload.student.id,
    ...(payload.student.studentCode ? { studentCode: payload.student.studentCode.slice(0, 60) } : {}),
    studentNameEn: payload.student.fullNameEn.slice(0, 160),
    ...(payload.student.fullNameBn ? { studentNameBn: payload.student.fullNameBn.slice(0, 160) } : {}),
    ...(payload.student.section ? { section: payload.student.section.slice(0, 40) } : {}),
    ...(payload.student.groupNameEn ? { groupNameEn: payload.student.groupNameEn.slice(0, 60) } : {}),
    ...(payload.student.groupNameBn ? { groupNameBn: payload.student.groupNameBn.slice(0, 60) } : {}),
    gradingRuleId: activeRule.id,
    totalFullMarks: calculation.totalFullMarks,
    obtainedTotalMarks: calculation.obtainedTotalMarks,
    percentage: calculation.percentage,
    gpa: calculation.gpa,
    gpaWithoutOptional: calculation.gpaWithoutOptional,
    calculateGpa: activeRule.calculateGpa,
    calculatePercentage: activeRule.calculatePercentage,
    maxGpa: activeRule.maxGpa,
    letterGrade: calculation.letterGrade,
    finalStatus: calculation.finalStatus,
    compulsorySubjectCount: calculation.compulsorySubjectCount,
    failedCompulsoryCount: calculation.failedCompulsoryCount,
    position: payload.examination.showPosition ? payload.position ?? null : null,
    showPosition: Boolean(payload.examination.showPosition && payload.position != null),
    workflowStatus: 'draft' as ResultWorkflowStatus,
    isPublished: false,
    isDemoRecord: false,
    enteredByUid: currentUid,
    updatedAt: serverTimestamp(),
  });

  for (const sub of calculation.subjects) {
    const subDocId = buildResultSubjectDocId(resultId, sub.subjectCode);
    assertValidDocId(subDocId, 'result_subject');
    batch.set(doc(firestore, 'resultSubjects', subDocId), {
      resultId,
      academicYearId: payload.academicYear.id,
      examId: payload.examination.id,
      classCode: payload.classCode,
      rollNumber: canonicalRoll,
      subjectId: sub.subjectId,
      subjectCode: sub.subjectCode.slice(0, 30),
      subjectNameBn: sub.subjectNameBn.slice(0, 160),
      subjectNameEn: sub.subjectNameEn.slice(0, 160),
      fullMarks: sub.fullMarks,
      passMarks: sub.passMarks,
      isOptional: Boolean(sub.isOptional),
      hasComponents: Boolean(sub.hasComponents),
      hasPractical: Boolean(sub.hasPractical),
      ...(sub.writtenFullMarks != null ? { writtenFullMarks: sub.writtenFullMarks } : {}),
      ...(sub.mcqFullMarks != null ? { mcqFullMarks: sub.mcqFullMarks } : {}),
      ...(sub.practicalFullMarks != null ? { practicalFullMarks: sub.practicalFullMarks } : {}),
      writtenMarks: sub.writtenMarks ?? null,
      mcqMarks: sub.mcqMarks ?? null,
      practicalMarks: sub.practicalMarks ?? null,
      obtainedMarks: sub.obtainedMarks,
      isAbsent: Boolean(sub.isAbsent),
      letterGrade: sub.letterGrade,
      gradePoint: sub.gradePoint,
      isPassed: sub.isPassed,
      displayOrder: sub.displayOrder,
      isPublished: false,
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
    return { resultId, summary: calculation };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `results/${resultId}`);
  }
}

// ---------------------------------------------------------------------------
// Step 10, 11, 12 & 13: Submit, Approve/Reject, Publish & Unpublish Workflow
// ---------------------------------------------------------------------------

export async function submitResultsForApproval(
  academicYearId: string,
  examId: string,
  classCode: SupportedClassCode
): Promise<number> {
  const firestore = assertDbConfigured();
  const currentUid = auth?.currentUser?.uid;
  if (!currentUid) {
    throw new Error('AUTHENTICATION_REQUIRED');
  }

  const publicationId = buildPublicationDocId(academicYearId, examId, classCode);
  const path = `resultPublication/${publicationId}`;

  try {
    const [draftsSnap, existingPubSnap] = await Promise.all([
      getDocs(
        query(
          collection(firestore, 'results'),
          where('academicYearId', '==', academicYearId),
          where('examId', '==', examId),
          where('classCode', '==', classCode),
          where('enteredByUid', '==', currentUid),
          where('workflowStatus', 'in', ['draft', 'rejected'])
        )
      ),
      getDoc(doc(firestore, 'resultPublication', publicationId)),
    ]);

    const batch = writeBatch(firestore);
    draftsSnap.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        workflowStatus: 'submitted',
        isPublished: false,
        updatedAt: serverTimestamp(),
      });
    });

    if (existingPubSnap.exists()) {
      batch.update(existingPubSnap.ref, {
        workflowStatus: 'submitted',
        isPublished: false,
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(doc(firestore, 'resultPublication', publicationId), {
        academicYearId,
        examId,
        classCode,
        workflowStatus: 'submitted',
        isPublished: false,
        showPosition: false,
        isActive: true,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return draftsSnap.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function reviewSubmittedClassResults(
  academicYearId: string,
  examId: string,
  classCode: SupportedClassCode,
  decision: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<number> {
  const firestore = assertDbConfigured();
  const publicationId = buildPublicationDocId(academicYearId, examId, classCode);
  const path = `resultPublication/${publicationId}`;
  const cleanReason =
    decision === 'rejected' && rejectionReason?.trim()
      ? rejectionReason.trim().slice(0, 400)
      : null;

  try {
    const [submittedSnap, existingPubSnap] = await Promise.all([
      getDocs(
        query(
          collection(firestore, 'results'),
          where('academicYearId', '==', academicYearId),
          where('examId', '==', examId),
          where('classCode', '==', classCode),
          where('workflowStatus', 'in', ['submitted', 'draft', 'rejected'])
        )
      ),
      getDoc(doc(firestore, 'resultPublication', publicationId)),
    ]);

    const existingShowPosition = existingPubSnap.exists()
      ? Boolean((existingPubSnap.data() as ResultPublicationRecord).showPosition)
      : false;

    const batch = writeBatch(firestore);
    submittedSnap.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        workflowStatus: decision,
        isPublished: false,
        rejectionReason: cleanReason,
        updatedAt: serverTimestamp(),
      });
    });

    batch.set(
      doc(firestore, 'resultPublication', publicationId),
      {
        academicYearId,
        examId,
        classCode,
        workflowStatus: decision,
        isPublished: false,
        rejectionReason: cleanReason,
        showPosition: existingShowPosition,
        isActive: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();
    return submittedSnap.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function publishApprovedClassResults(params: {
  academicYearId: string;
  examId: string;
  classCode: SupportedClassCode;
  publishedDateLabelBn: string;
  publishedDateLabelEn: string;
  showPosition: boolean;
}): Promise<number> {
  const firestore = assertDbConfigured();
  const publicationId = buildPublicationDocId(
    params.academicYearId,
    params.examId,
    params.classCode
  );
  const path = `resultPublication/${publicationId}`;

  try {
    const approvedResultsSnap = await getDocs(
      query(
        collection(firestore, 'results'),
        where('academicYearId', '==', params.academicYearId),
        where('examId', '==', params.examId),
        where('classCode', '==', params.classCode),
        where('workflowStatus', 'in', ['approved', 'unpublished'])
      )
    );

    if (approvedResultsSnap.empty) {
      throw new Error('NO_APPROVED_RESULTS_TO_PUBLISH');
    }

    const subjectSnaps = await getDocs(
      query(
        collection(firestore, 'resultSubjects'),
        where('academicYearId', '==', params.academicYearId),
        where('examId', '==', params.examId),
        where('classCode', '==', params.classCode)
      )
    );

    let passCount = 0;
    const batch = writeBatch(firestore);

    approvedResultsSnap.docs.forEach((docSnap) => {
      const data = docSnap.data() as StudentResultRecord;
      if (data.finalStatus === 'PASS') passCount += 1;

      batch.update(docSnap.ref, {
        workflowStatus: 'published',
        isPublished: true,
        rejectionReason: null,
        publishedDateLabelBn: params.publishedDateLabelBn.slice(0, 60),
        publishedDateLabelEn: params.publishedDateLabelEn.slice(0, 60),
        showPosition: Boolean(params.showPosition && data.position != null),
        updatedAt: serverTimestamp(),
      });
    });

    subjectSnaps.docs.forEach((subDoc) => {
      batch.update(subDoc.ref, {
        isPublished: true,
        updatedAt: serverTimestamp(),
      });
    });

    batch.set(doc(firestore, 'resultPublication', publicationId), {
      academicYearId: params.academicYearId,
      examId: params.examId,
      classCode: params.classCode,
      workflowStatus: 'published',
      isPublished: true,
      rejectionReason: null,
      publishedDateLabelBn: params.publishedDateLabelBn.slice(0, 60),
      publishedDateLabelEn: params.publishedDateLabelEn.slice(0, 60),
      showPosition: Boolean(params.showPosition),
      totalCandidates: approvedResultsSnap.size,
      passCount,
      isActive: true,
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    return approvedResultsSnap.size;
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_APPROVED_RESULTS_TO_PUBLISH') {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function unpublishClassResults(
  academicYearId: string,
  examId: string,
  classCode: SupportedClassCode
): Promise<number> {
  const firestore = assertDbConfigured();
  const publicationId = buildPublicationDocId(academicYearId, examId, classCode);
  const path = `resultPublication/${publicationId}`;

  try {
    const [publishedResultsSnap, subjectSnaps, pubSnap] = await Promise.all([
      getDocs(
        query(
          collection(firestore, 'results'),
          where('academicYearId', '==', academicYearId),
          where('examId', '==', examId),
          where('classCode', '==', classCode),
          where('isPublished', '==', true)
        )
      ),
      getDocs(
        query(
          collection(firestore, 'resultSubjects'),
          where('academicYearId', '==', academicYearId),
          where('examId', '==', examId),
          where('classCode', '==', classCode),
          where('isPublished', '==', true)
        )
      ),
      getDoc(doc(firestore, 'resultPublication', publicationId)),
    ]);

    const batch = writeBatch(firestore);

    publishedResultsSnap.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        workflowStatus: 'unpublished',
        isPublished: false,
        updatedAt: serverTimestamp(),
      });
    });

    subjectSnaps.docs.forEach((subDoc) => {
      batch.update(subDoc.ref, {
        isPublished: false,
        updatedAt: serverTimestamp(),
      });
    });

    if (pubSnap.exists()) {
      const existingPub = pubSnap.data() as ResultPublicationRecord;
      batch.update(pubSnap.ref, {
        workflowStatus: 'unpublished',
        isPublished: false,
        showPosition: Boolean(existingPub.showPosition),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return publishedResultsSnap.size;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ---------------------------------------------------------------------------
// Phase 4 Master Admin Panel Read & Query Helpers
// ---------------------------------------------------------------------------

export async function fetchAllAcademicYearsForAdmin(): Promise<AcademicYearRecord[]> {
  if (!isFirebaseConfigured || !db) return DEFAULT_ACADEMIC_YEARS;
  try {
    const snap = await getDocs(collection(db, 'academicYears'));
    if (snap.empty) return DEFAULT_ACADEMIC_YEARS;
    const live = snap.docs.map(
      (d) => ({ ...(d.data() as Omit<AcademicYearRecord, 'id'>), id: d.id }) as AcademicYearRecord
    );
    const mergedMap = new Map<string, AcademicYearRecord>();
    DEFAULT_ACADEMIC_YEARS.forEach((y) => mergedMap.set(y.id, y));
    live.forEach((y) => mergedMap.set(y.id, y));
    return Array.from(mergedMap.values()).sort((a, b) => a.order - b.order);
  } catch {
    return DEFAULT_ACADEMIC_YEARS;
  }
}

export async function fetchAllExaminationsForAdmin(): Promise<ExaminationRecord[]> {
  if (!isFirebaseConfigured || !db) return DEFAULT_EXAMINATIONS;
  try {
    const snap = await getDocs(collection(db, 'examinations'));
    if (snap.empty) return DEFAULT_EXAMINATIONS;
    const live = snap.docs.map(
      (d) => ({ ...(d.data() as Omit<ExaminationRecord, 'id'>), id: d.id }) as ExaminationRecord
    );
    const mergedMap = new Map<string, ExaminationRecord>();
    DEFAULT_EXAMINATIONS.forEach((ex) => mergedMap.set(ex.id, ex));
    live.forEach((ex) => mergedMap.set(ex.id, ex));
    return Array.from(mergedMap.values()).sort((a, b) => a.order - b.order);
  } catch {
    return DEFAULT_EXAMINATIONS;
  }
}

export async function fetchAllSubjectsForAdmin(
  classCode?: SupportedClassCode
): Promise<SubjectConfigRecord[]> {
  const baseline = classCode
    ? DEFAULT_SUBJECT_CONFIGS.filter((s) => s.classCode === classCode)
    : DEFAULT_SUBJECT_CONFIGS;

  if (!isFirebaseConfigured || !db) return baseline;
  try {
    const q = classCode
      ? query(collection(db, 'subjects'), where('classCode', '==', classCode))
      : collection(db, 'subjects');
    const snap = await getDocs(q);
    if (snap.empty) return baseline;
    const live = snap.docs.map(
      (d) => ({ ...(d.data() as Omit<SubjectConfigRecord, 'id'>), id: d.id }) as SubjectConfigRecord
    );
    const mergedMap = new Map<string, SubjectConfigRecord>();
    baseline.forEach((s) => mergedMap.set(s.id, s));
    live.forEach((s) => mergedMap.set(s.id, s));
    return Array.from(mergedMap.values()).sort((a, b) => a.displayOrder - b.displayOrder);
  } catch {
    return baseline;
  }
}

export async function fetchAllGradingRulesForAdmin(): Promise<GradingRuleRecord[]> {
  if (!isFirebaseConfigured || !db) return DEFAULT_GRADING_RULES;
  try {
    const snap = await getDocs(collection(db, 'gradingRules'));
    if (snap.empty) return DEFAULT_GRADING_RULES;
    const live = snap.docs.map(
      (d) => ({ ...(d.data() as Omit<GradingRuleRecord, 'id'>), id: d.id }) as GradingRuleRecord
    );
    const mergedMap = new Map<string, GradingRuleRecord>();
    DEFAULT_GRADING_RULES.forEach((r) => mergedMap.set(r.id, r));
    live.forEach((r) => mergedMap.set(r.id, r));
    return Array.from(mergedMap.values());
  } catch {
    return DEFAULT_GRADING_RULES;
  }
}

export async function fetchClassResultsForAdmin(
  academicYearId: string,
  examId: string,
  classCode: SupportedClassCode
): Promise<StudentResultRecord[]> {
  const firestore = assertDbConfigured();
  try {
    const snap = await getDocs(
      query(
        collection(firestore, 'results'),
        where('academicYearId', '==', academicYearId),
        where('examId', '==', examId),
        where('classCode', '==', classCode)
      )
    );
    return snap.docs
      .map(
        (d) =>
          ({ ...(d.data() as Omit<StudentResultRecord, 'id'>), id: d.id }) as StudentResultRecord
      )
      .sort((a, b) => Number(a.rollNumber) - Number(b.rollNumber));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'results');
  }
}

export async function fetchResultSubjectsForResult(
  resultId: string
): Promise<ResultSubjectMarkRecord[]> {
  const firestore = assertDbConfigured();
  try {
    const snap = await getDocs(
      query(collection(firestore, 'resultSubjects'), where('resultId', '==', resultId))
    );
    return snap.docs
      .map(
        (d) =>
          ({
            ...(d.data() as Omit<ResultSubjectMarkRecord, 'id'>),
            id: d.id,
          }) as ResultSubjectMarkRecord
      )
      .sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'resultSubjects');
  }
}

export async function fetchAllResultPublicationsForAdmin(): Promise<ResultPublicationRecord[]> {
  const firestore = assertDbConfigured();
  try {
    const snap = await getDocs(collection(firestore, 'resultPublication'));
    return snap.docs.map(
      (d) =>
        ({
          ...(d.data() as Omit<ResultPublicationRecord, 'id'>),
          id: d.id,
        }) as ResultPublicationRecord
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'resultPublication');
  }
}

