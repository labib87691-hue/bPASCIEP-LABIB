import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import {
  db,
  handleFirestoreError,
  isFirebaseConfigured,
  OperationType,
} from '../lib/firebase';
import {
  AcademicYearRecord,
  ExaminationRecord,
  GradingRuleRecord,
  ResultMarksheetBundle,
  ResultPublicationRecord,
  ResultSearchOutcome,
  ResultSearchQuery,
  ResultSubjectMarkRecord,
  StudentResultRecord,
  SupportedClassCode,
} from '../types/result';
import {
  ALL_CLASS_CODES,
  DEFAULT_ACADEMIC_YEARS,
  DEFAULT_EXAMINATIONS,
  DEFAULT_GRADING_RULES,
  DEMO_SANDBOX_BUNDLES,
  DEMO_SANDBOX_PUBLICATIONS,
  SUPPORTED_RESULT_CLASSES,
} from '../data/resultPortalSeedData';
import {
  buildPublicationDocId,
  buildResultDocId,
  isValidCanonicalRoll,
  normalizeRollNumber,
} from './resultCalculationEngine';

export interface ResultPortalCatalog {
  academicYears: AcademicYearRecord[];
  examinations: ExaminationRecord[];
  gradingRules: GradingRuleRecord[];
}

function mergeById<T extends { id: string }>(primary: T[], fallback: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of fallback) {
    map.set(item.id, item);
  }
  for (const item of primary) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

/**
 * Loads active Academic Years, Examinations, and Grading Rules from Firestore,
 * seamlessly merging with BPSC institutional configuration defaults.
 */
export async function loadResultPortalCatalog(): Promise<ResultPortalCatalog> {
  if (!isFirebaseConfigured || !db) {
    return {
      academicYears: [...DEFAULT_ACADEMIC_YEARS].sort((a, b) => a.order - b.order),
      examinations: [...DEFAULT_EXAMINATIONS].sort((a, b) => a.order - b.order),
      gradingRules: [...DEFAULT_GRADING_RULES],
    };
  }

  try {
    const [yearsSnap, examsSnap, rulesSnap] = await Promise.all([
      getDocs(query(collection(db, 'academicYears'), where('isActive', '==', true))),
      getDocs(query(collection(db, 'examinations'), where('isActive', '==', true))),
      getDocs(query(collection(db, 'gradingRules'), where('isActive', '==', true))),
    ]);

    const firestoreYears = yearsSnap.docs.map((d) => ({
      ...(d.data() as Omit<AcademicYearRecord, 'id'>),
      id: d.id,
    }));
    const firestoreExams = examsSnap.docs.map((d) => ({
      ...(d.data() as Omit<ExaminationRecord, 'id'>),
      id: d.id,
    }));
    const firestoreRules = rulesSnap.docs.map((d) => ({
      ...(d.data() as Omit<GradingRuleRecord, 'id'>),
      id: d.id,
    }));

    return {
      academicYears: mergeById(firestoreYears, DEFAULT_ACADEMIC_YEARS).sort(
        (a, b) => a.order - b.order
      ),
      examinations: mergeById(firestoreExams, DEFAULT_EXAMINATIONS).sort(
        (a, b) => a.order - b.order
      ),
      gradingRules: mergeById(firestoreRules, DEFAULT_GRADING_RULES),
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Missing or insufficient permissions')
    ) {
      handleFirestoreError(error, OperationType.LIST, 'academicYears/examinations/gradingRules');
    }
    console.warn('Result catalog fallback active:', error);
    return {
      academicYears: [...DEFAULT_ACADEMIC_YEARS].sort((a, b) => a.order - b.order),
      examinations: [...DEFAULT_EXAMINATIONS].sort((a, b) => a.order - b.order),
      gradingRules: [...DEFAULT_GRADING_RULES],
    };
  }
}

/**
 * Searches for an officially published student result with full validation,
 * publication-gate checks, and strict protection of unpublished records.
 */
export async function searchPublishedStudentResult(
  input: ResultSearchQuery,
  catalog?: ResultPortalCatalog
): Promise<ResultSearchOutcome> {
  const yearId = input.academicYearId.trim();
  const examId = input.examId.trim();
  const classCode = input.classCode.trim();
  const rawRoll = input.rollNumber.trim();

  // 1. Validate required fields
  const missingFields: ('academicYearId' | 'examId' | 'classCode' | 'rollNumber')[] = [];
  if (!yearId) missingFields.push('academicYearId');
  if (!examId) missingFields.push('examId');
  if (!classCode) missingFields.push('classCode');
  if (!rawRoll) missingFields.push('rollNumber');

  if (missingFields.length > 0) {
    return {
      ok: false,
      errorCode: 'EMPTY_FIELDS',
      missingFields,
      messageBn:
        'অনুগ্রহ করে শিক্ষাবর্ষ, পরীক্ষার নাম, শ্রেণি এবং শিক্ষার্থীর রোল নম্বর সঠিকভাবে পূরণ করুন।',
      messageEn:
        'Please select Academic Year, Examination, Class, and enter the Student Roll Number.',
    };
  }

  // 2. Validate class code
  if (!ALL_CLASS_CODES.includes(classCode as SupportedClassCode)) {
    return {
      ok: false,
      errorCode: 'EXAM_NOT_FOUND',
      messageBn: 'নির্বাচিত শ্রেণিটি বৈধ নয়। অনুগ্রহ করে তালিকা থেকে সঠিক শ্রেণি নির্বাচন করুন।',
      messageEn: 'The selected class is invalid. Please choose a valid class from Nursery to Class 10.',
    };
  }
  const typedClassCode = classCode as SupportedClassCode;

  // 3. Validate roll number (supports Bengali ০-৯ and English 0-9 numerals)
  const canonicalRoll = normalizeRollNumber(rawRoll);
  if (!isValidCanonicalRoll(canonicalRoll)) {
    return {
      ok: false,
      errorCode: 'INVALID_ROLL',
      messageBn:
        'প্রদত্ত রোল নম্বরটি সঠিক নয়। অনুগ্রহ করে শুধুমাত্র ধনাত্মক সংখ্যা (১ – ৯৯৯৯৯৯) ব্যবহার করুন।',
      messageEn:
        'Invalid roll number format. Please enter a valid positive numeric roll number (e.g., 101).',
    };
  }

  // 4. Verify Examination existence and applicability to Academic Year & Class
  const activeCatalog = catalog || (await loadResultPortalCatalog());
  const selectedYear = activeCatalog.academicYears.find((y) => y.id === yearId && y.isActive);
  const selectedExam = activeCatalog.examinations.find(
    (e) => e.id === examId && e.academicYearId === yearId && e.isActive
  );

  if (!selectedYear || !selectedExam) {
    return {
      ok: false,
      errorCode: 'EXAM_NOT_FOUND',
      messageBn:
        'নির্বাচিত শিক্ষাবর্ষে উক্ত পরীক্ষাটি পাওয়া যায়নি। অনুগ্রহ করে সঠিক শিক্ষাবর্ষ ও পরীক্ষা নির্বাচন করুন।',
      messageEn:
        'The selected examination does not exist for the chosen academic year.',
    };
  }

  if (!selectedExam.applicableClasses.includes(typedClassCode)) {
    const clsMeta = SUPPORTED_RESULT_CLASSES.find((c) => c.classCode === typedClassCode);
    return {
      ok: false,
      errorCode: 'EXAM_NOT_FOUND',
      messageBn: `${clsMeta?.nameBn || typedClassCode}-এর জন্য "${selectedExam.nameBn}" পরীক্ষাটি প্রযোজ্য নয়।`,
      messageEn: `"${selectedExam.nameEn}" is not scheduled or configured for ${clsMeta?.nameEn || typedClassCode}.`,
    };
  }

  const publicationId = buildPublicationDocId(yearId, examId, typedClassCode);
  const resultId = buildResultDocId(yearId, examId, typedClassCode, canonicalRoll);

  // 5. Check Firestore first (Authoritative backend source of truth)
  if (isFirebaseConfigured && db) {
    let firestorePublication: ResultPublicationRecord | null = null;

    try {
      const pubSnap = await getDoc(doc(db, 'resultPublication', publicationId));
      if (pubSnap.exists()) {
        firestorePublication = {
          ...(pubSnap.data() as Omit<ResultPublicationRecord, 'id'>),
          id: pubSnap.id,
        };
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Missing or insufficient permissions')
      ) {
        handleFirestoreError(error, OperationType.GET, `resultPublication/${publicationId}`);
      }
    }

    // If an explicit publication record exists in Firestore and is NOT published, strictly block!
    if (
      firestorePublication &&
      (!firestorePublication.isPublished ||
        firestorePublication.workflowStatus !== 'published')
    ) {
      return {
        ok: false,
        errorCode: 'NOT_PUBLISHED',
        messageBn:
          'নির্বাচিত পরীক্ষা ও শ্রেণির ফলাফল এখনো আনুষ্ঠানিকভাবে প্রকাশ করা হয়নি। ফলাফল প্রকাশিত হলে পুনরায় চেষ্টা করুন।',
        messageEn:
          'Results for the selected examination and class have not been officially published yet.',
      };
    }

    // If officially published in Firestore, fetch the published student marksheet & subjects
    if (
      firestorePublication &&
      firestorePublication.isPublished &&
      firestorePublication.workflowStatus === 'published'
    ) {
      try {
        const resultQueries = await getDocs(
          query(
            collection(db, 'results'),
            where('academicYearId', '==', yearId),
            where('examId', '==', examId),
            where('classCode', '==', typedClassCode),
            where('rollNumber', '==', canonicalRoll),
            where('isPublished', '==', true),
            where('workflowStatus', '==', 'published')
          )
        );

        if (resultQueries.empty) {
          return {
            ok: false,
            errorCode: 'RESULT_NOT_FOUND',
            messageBn: `প্রদত্ত রোল নম্বর (${canonicalRoll})-এর জন্য কোনো প্রকাশিত ফলাফল পাওয়া যায়নি। রোল নম্বর ও শ্রেণি যাচাই করুন।`,
            messageEn: `No published result was found for Roll Number ${canonicalRoll} in the selected class and examination.`,
          };
        }

        const resultDoc = resultQueries.docs[0];
        const studentResult: StudentResultRecord = {
          ...(resultDoc.data() as Omit<StudentResultRecord, 'id'>),
          id: resultDoc.id,
        };

        // Double defense-in-depth gate: never return unpublished records
        if (!studentResult.isPublished || studentResult.workflowStatus !== 'published') {
          return {
            ok: false,
            errorCode: 'NOT_PUBLISHED',
            messageBn: 'এই ফলাফলটি এখনো আনুষ্ঠানিকভাবে প্রকাশিত হয়নি।',
            messageEn: 'This result has not been officially published yet.',
          };
        }

        const subjectsSnap = await getDocs(
          query(
            collection(db, 'resultSubjects'),
            where('resultId', '==', studentResult.id),
            where('isPublished', '==', true)
          )
        );

        const subjectRows: ResultSubjectMarkRecord[] = subjectsSnap.docs
          .map((d) => ({
            ...(d.data() as Omit<ResultSubjectMarkRecord, 'id'>),
            id: d.id,
          }))
          .sort((a, b) => a.displayOrder - b.displayOrder);

        const gradingRule =
          activeCatalog.gradingRules.find((r) => r.id === studentResult.gradingRuleId) ||
          DEFAULT_GRADING_RULES[0];

        return {
          ok: true,
          source: 'firestore',
          data: {
            result: studentResult,
            subjects: subjectRows,
            gradingRule,
          },
        };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('Missing or insufficient permissions')
        ) {
          handleFirestoreError(error, OperationType.LIST, `results/${resultId}`);
        }
        return {
          ok: false,
          errorCode: 'SYSTEM_ERROR',
          messageBn:
            'সার্ভার থেকে ফলাফল লোড করতে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
          messageEn:
            'Unable to retrieve result from server at the moment. Please try again shortly.',
        };
      }
    }
  }

  // 6. Check clearly identified Demo Verification Sandbox (only when no live Firestore publication overrides it)
  const sandboxPub = DEMO_SANDBOX_PUBLICATIONS.find((p) => p.id === publicationId);

  if (!sandboxPub || !sandboxPub.isPublished || sandboxPub.workflowStatus !== 'published') {
    return {
      ok: false,
      errorCode: 'NOT_PUBLISHED',
      messageBn:
        'নির্বাচিত পরীক্ষা ও শ্রেণির ফলাফল এখনো আনুষ্ঠানিকভাবে প্রকাশ করা হয়নি। ফলাফল প্রকাশের বিজ্ঞপ্তি নোটিশ বোর্ডে জানানো হবে।',
      messageEn:
        'Results for this examination and class have not been officially published yet.',
    };
  }

  const sandboxBundle = DEMO_SANDBOX_BUNDLES.find(
    (b) =>
      b.result.id === resultId &&
      b.result.isPublished === true &&
      b.result.workflowStatus === 'published'
  );

  if (!sandboxBundle) {
    return {
      ok: false,
      errorCode: 'RESULT_NOT_FOUND',
      messageBn: `প্রদত্ত রোল নম্বর (${canonicalRoll})-এর কোনো প্রকাশিত ফলাফল পাওয়া যায়নি। রোল নম্বর ও শ্রেণি পুনরায় যাচাই করুন।`,
      messageEn: `No published result found for Roll Number ${canonicalRoll} in the selected class and examination.`,
    };
  }

  return {
    ok: true,
    source: 'demo_sandbox',
    data: sandboxBundle,
  };
}
