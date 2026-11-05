import {
  CalculatedSubjectMark,
  GradeScaleBand,
  GradingRuleRecord,
  ResultCalculationSummary,
  SubjectMarkInput,
} from '../types/result';

export interface MarksValidationIssue {
  subjectCode: string;
  field: string;
  messageEn: string;
  messageBn: string;
}

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Validates raw subject mark entries against configured full marks and component caps.
 * Used by both future Teacher/Admin panels and deterministic seed calculation.
 */
export function validateSubjectMarkInputs(
  subjects: SubjectMarkInput[]
): MarksValidationIssue[] {
  const issues: MarksValidationIssue[] = [];

  if (!Array.isArray(subjects) || subjects.length === 0) {
    issues.push({
      subjectCode: 'GLOBAL',
      field: 'subjects',
      messageEn: 'At least one subject mark entry is required.',
      messageBn: 'কমপক্ষে একটি বিষয়ের নম্বর প্রদান করা আবশ্যক।',
    });
    return issues;
  }

  const seenCodes = new Set<string>();

  for (const sub of subjects) {
    if (seenCodes.has(sub.subjectCode)) {
      issues.push({
        subjectCode: sub.subjectCode,
        field: 'subjectCode',
        messageEn: `Duplicate subject entry detected for ${sub.subjectNameEn}.`,
        messageBn: `${sub.subjectNameBn} বিষয়ের নম্বর একাধিকবার যুক্ত হয়েছে।`,
      });
    }
    seenCodes.add(sub.subjectCode);

    if (sub.fullMarks <= 0 || sub.fullMarks > 500) {
      issues.push({
        subjectCode: sub.subjectCode,
        field: 'fullMarks',
        messageEn: `Invalid full marks (${sub.fullMarks}) for ${sub.subjectNameEn}.`,
        messageBn: `${sub.subjectNameBn} বিষয়ের পূর্ণমান (${sub.fullMarks}) সঠিক নয়।`,
      });
    }

    if (sub.isAbsent) {
      continue;
    }

    if (
      typeof sub.obtainedMarks !== 'number' ||
      Number.isNaN(sub.obtainedMarks) ||
      sub.obtainedMarks < 0 ||
      sub.obtainedMarks > sub.fullMarks
    ) {
      issues.push({
        subjectCode: sub.subjectCode,
        field: 'obtainedMarks',
        messageEn: `Obtained marks for ${sub.subjectNameEn} must be between 0 and ${sub.fullMarks}.`,
        messageBn: `${sub.subjectNameBn} বিষয়ে প্রাপ্ত নম্বর ০ থেকে ${sub.fullMarks}-এর মধ্যে হতে হবে।`,
      });
    }

    if (sub.hasComponents) {
      if (sub.writtenFullMarks != null && sub.writtenMarks != null) {
        if (sub.writtenMarks < 0 || sub.writtenMarks > sub.writtenFullMarks) {
          issues.push({
            subjectCode: sub.subjectCode,
            field: 'writtenMarks',
            messageEn: `Written marks for ${sub.subjectNameEn} cannot exceed ${sub.writtenFullMarks}.`,
            messageBn: `${sub.subjectNameBn} বিষয়ের লিখিত নম্বর ${sub.writtenFullMarks}-এর বেশি হতে পারবে না।`,
          });
        }
      }

      if (sub.mcqFullMarks != null && sub.mcqMarks != null) {
        if (sub.mcqMarks < 0 || sub.mcqMarks > sub.mcqFullMarks) {
          issues.push({
            subjectCode: sub.subjectCode,
            field: 'mcqMarks',
            messageEn: `MCQ marks for ${sub.subjectNameEn} cannot exceed ${sub.mcqFullMarks}.`,
            messageBn: `${sub.subjectNameBn} বিষয়ের বহুনির্বাচনি নম্বর ${sub.mcqFullMarks}-এর বেশি হতে পারবে না।`,
          });
        }
      }

      if (sub.hasPractical && sub.practicalFullMarks != null && sub.practicalMarks != null) {
        if (sub.practicalMarks < 0 || sub.practicalMarks > sub.practicalFullMarks) {
          issues.push({
            subjectCode: sub.subjectCode,
            field: 'practicalMarks',
            messageEn: `Practical marks for ${sub.subjectNameEn} cannot exceed ${sub.practicalFullMarks}.`,
            messageBn: `${sub.subjectNameBn} বিষয়ের ব্যবহারিক নম্বর ${sub.practicalFullMarks}-এর বেশি হতে পারবে না।`,
          });
        }
      }

      const hasAnyComponentValue =
        sub.writtenMarks != null || sub.mcqMarks != null || sub.practicalMarks != null;
      if (hasAnyComponentValue) {
        const componentSum =
          (sub.writtenMarks ?? 0) + (sub.mcqMarks ?? 0) + (sub.practicalMarks ?? 0);
        if (Math.abs(componentSum - sub.obtainedMarks) > 0.01) {
          issues.push({
            subjectCode: sub.subjectCode,
            field: 'obtainedMarks',
            messageEn: `Component sum (${componentSum}) does not match obtained total (${sub.obtainedMarks}) for ${sub.subjectNameEn}.`,
            messageBn: `${sub.subjectNameBn} বিষয়ের অংশভিত্তিক নম্বরের যোগফল (${componentSum}) মোট নম্বরের (${sub.obtainedMarks}) সাথে মিলছে না।`,
          });
        }
      }
    }
  }

  return issues;
}

function matchBandByPercentage(
  percentage: number,
  gradeScale: GradeScaleBand[]
): GradeScaleBand {
  const sorted = [...gradeScale].sort((a, b) => b.minPercentage - a.minPercentage);
  const roundedPct = Math.floor(percentage + 1e-9);
  for (const band of sorted) {
    if (roundedPct >= band.minPercentage && roundedPct <= band.maxPercentage) {
      return band;
    }
  }
  return (
    sorted[sorted.length - 1] || {
      minPercentage: 0,
      maxPercentage: 32,
      letterGrade: 'F',
      gradePoint: 0,
      remarksBn: 'অকৃতকার্য',
      remarksEn: 'Unsatisfactory',
    }
  );
}

function matchBandByGpa(
  gpa: number,
  gradeScale: GradeScaleBand[],
  isPassed: boolean
): string {
  if (!isPassed) return 'F';
  const sorted = [...gradeScale]
    .filter((b) => b.gradePoint > 0)
    .sort((a, b) => b.gradePoint - a.gradePoint);
  for (const band of sorted) {
    if (gpa + 1e-9 >= band.gradePoint) {
      return band.letterGrade;
    }
  }
  return sorted[sorted.length - 1]?.letterGrade || 'D';
}

/**
 * Configurable institutional result calculation engine.
 * Supports distinct grading rules per class/examination, component-level pass gates,
 * practical marks, optional 4th subjects, and non-GPA percentage-only classes.
 */
export function calculateInstitutionalResult(
  rawSubjects: SubjectMarkInput[],
  gradingRule: GradingRuleRecord
): ResultCalculationSummary {
  const orderedSubjects = [...rawSubjects].sort((a, b) => a.displayOrder - b.displayOrder);

  const calculatedSubjects: CalculatedSubjectMark[] = orderedSubjects.map((sub) => {
    if (sub.isAbsent) {
      return {
        ...sub,
        obtainedMarks: 0,
        percentage: 0,
        letterGrade: 'F',
        gradePoint: 0,
        isPassed: false,
        failReasonEn: 'Absent in examination',
        failReasonBn: 'পরীক্ষায় অনুপস্থিত',
      };
    }

    const effectivePassMarks =
      sub.passMarks > 0
        ? sub.passMarks
        : Math.ceil((sub.fullMarks * gradingRule.defaultPassPercentage) / 100);

    let componentFailed = false;
    let failReasonEn: string | undefined;
    let failReasonBn: string | undefined;

    if (gradingRule.requireComponentPass && sub.hasComponents) {
      if (
        sub.writtenPassMarks != null &&
        sub.writtenMarks != null &&
        sub.writtenMarks < sub.writtenPassMarks
      ) {
        componentFailed = true;
        failReasonEn = 'Below pass marks in Written (CQ)';
        failReasonBn = 'লিখিত অংশে পাস নম্বরের কম';
      } else if (
        sub.mcqPassMarks != null &&
        sub.mcqMarks != null &&
        sub.mcqMarks < sub.mcqPassMarks
      ) {
        componentFailed = true;
        failReasonEn = 'Below pass marks in MCQ';
        failReasonBn = 'বহুনির্বাচনি অংশে পাস নম্বরের কম';
      } else if (
        sub.hasPractical &&
        sub.practicalPassMarks != null &&
        sub.practicalMarks != null &&
        sub.practicalMarks < sub.practicalPassMarks
      ) {
        componentFailed = true;
        failReasonEn = 'Below pass marks in Practical';
        failReasonBn = 'ব্যবহারিক অংশে পাস নম্বরের কম';
      }
    }

    const totalPassed = sub.obtainedMarks >= effectivePassMarks;
    const isPassed = totalPassed && !componentFailed;
    const pct = sub.fullMarks > 0 ? roundToTwo((sub.obtainedMarks / sub.fullMarks) * 100) : 0;

    if (!isPassed) {
      return {
        ...sub,
        percentage: pct,
        letterGrade: 'F',
        gradePoint: 0,
        isPassed: false,
        failReasonEn:
          failReasonEn || `Obtained marks below pass threshold (${effectivePassMarks})`,
        failReasonBn:
          failReasonBn || `ন্যূনতম পাস নম্বরের (${effectivePassMarks}) কম`,
      };
    }

    const band = matchBandByPercentage(pct, gradingRule.gradeScale);
    return {
      ...sub,
      percentage: pct,
      letterGrade: band.letterGrade,
      gradePoint: band.gradePoint,
      isPassed: true,
    };
  });

  const compulsorySubjects = calculatedSubjects.filter((s) => !s.isOptional);
  const optionalSubjects = calculatedSubjects.filter((s) => s.isOptional);

  const failedCompulsoryCount = compulsorySubjects.filter((s) => !s.isPassed).length;
  const finalStatus: 'PASS' | 'FAIL' =
    compulsorySubjects.length > 0 && failedCompulsoryCount === 0 ? 'PASS' : 'FAIL';

  const totalFullMarks = calculatedSubjects.reduce((acc, s) => acc + s.fullMarks, 0);
  const compulsoryFullMarks = compulsorySubjects.reduce((acc, s) => acc + s.fullMarks, 0);
  const obtainedTotalMarks = roundToTwo(
    calculatedSubjects.reduce((acc, s) => acc + s.obtainedMarks, 0)
  );

  const percentage =
    gradingRule.calculatePercentage && totalFullMarks > 0
      ? roundToTwo((obtainedTotalMarks / totalFullMarks) * 100)
      : null;

  let gpa: number | null = null;
  let gpaWithoutOptional: number | null = null;
  let optionalBonusAdded = 0;

  if (gradingRule.calculateGpa && compulsorySubjects.length > 0) {
    if (finalStatus === 'FAIL') {
      gpa = 0;
      gpaWithoutOptional = 0;
    } else {
      const compulsoryPoints = compulsorySubjects.reduce((acc, s) => acc + s.gradePoint, 0);
      gpaWithoutOptional = roundToTwo(compulsoryPoints / compulsorySubjects.length);

      if (gradingRule.enableOptionalBonus && optionalSubjects.length > 0) {
        for (const opt of optionalSubjects) {
          if (opt.isPassed && opt.gradePoint > gradingRule.optionalBonusThreshold) {
            optionalBonusAdded += roundToTwo(
              opt.gradePoint - gradingRule.optionalBonusThreshold
            );
          }
        }
      }

      const rawWithBonus = (compulsoryPoints + optionalBonusAdded) / compulsorySubjects.length;
      gpa = Math.min(gradingRule.maxGpa, roundToTwo(rawWithBonus));
    }
  }

  let letterGrade = 'F';
  if (finalStatus === 'PASS') {
    if (gradingRule.calculateGpa && gpa !== null) {
      letterGrade = matchBandByGpa(gpa, gradingRule.gradeScale, true);
    } else if (percentage !== null) {
      letterGrade = matchBandByPercentage(percentage, gradingRule.gradeScale).letterGrade;
    } else {
      letterGrade = 'PASS';
    }
  }

  return {
    subjects: calculatedSubjects,
    totalFullMarks,
    compulsoryFullMarks,
    obtainedTotalMarks,
    percentage,
    gpa,
    gpaWithoutOptional: optionalSubjects.length > 0 ? gpaWithoutOptional : null,
    optionalBonusAdded: roundToTwo(optionalBonusAdded),
    letterGrade,
    finalStatus,
    compulsorySubjectCount: compulsorySubjects.length,
    failedCompulsoryCount,
  };
}

/**
 * Normalizes Bengali digits (০-৯) and trims spaces so roll numbers like "১০১" and "101"
 * map deterministically to the same canonical roll string.
 */
export function normalizeRollNumber(rawRoll: string): string {
  const bengaliDigits = '০১২৩৪৫৬৭৮৯';
  let normalized = rawRoll.trim();
  for (let i = 0; i < 10; i += 1) {
    normalized = normalized.replaceAll(bengaliDigits[i], String(i));
  }
  // Strip leading zeros only if multi-digit positive integer (e.g. "01" -> "1", "101" -> "101")
  if (/^[0-9]+$/.test(normalized)) {
    const asNumber = Number.parseInt(normalized, 10);
    if (!Number.isNaN(asNumber) && asNumber > 0) {
      return String(asNumber);
    }
  }
  return normalized;
}

export function isValidCanonicalRoll(canonicalRoll: string): boolean {
  if (!/^[1-9][0-9]{0,5}$/.test(canonicalRoll)) {
    return false;
  }
  const numeric = Number.parseInt(canonicalRoll, 10);
  return numeric >= 1 && numeric <= 999999;
}

export function buildPublicationDocId(
  academicYearId: string,
  examId: string,
  classCode: string
): string {
  return `${academicYearId}_${examId}_${classCode}`;
}

export function buildResultDocId(
  academicYearId: string,
  examId: string,
  classCode: string,
  canonicalRoll: string
): string {
  return `${academicYearId}_${examId}_${classCode}_${canonicalRoll}`;
}

export function buildResultSubjectDocId(resultId: string, subjectCode: string): string {
  return `${resultId}_${subjectCode}`;
}
