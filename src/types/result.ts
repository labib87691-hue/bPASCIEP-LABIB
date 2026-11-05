export type SupportedClassCode =
  | 'nursery'
  | 'class-1'
  | 'class-2'
  | 'class-3'
  | 'class-4'
  | 'class-5'
  | 'class-6'
  | 'class-7'
  | 'class-8'
  | 'class-9'
  | 'class-10';

export interface ResultClassOption {
  classCode: SupportedClassCode;
  levelOrder: number;
  nameBn: string;
  nameEn: string;
  defaultGradingRuleId: string;
}

export interface AcademicYearRecord {
  id: string;
  yearCode: string; // e.g., "2026"
  labelBn: string;
  labelEn: string;
  isCurrent: boolean;
  isActive: boolean;
  order: number;
}

export type ExamTermType =
  | 'mid_term_1'
  | 'half_yearly'
  | 'mid_term_2'
  | 'annual'
  | 'pre_test'
  | 'test'
  | 'model_test';

export interface ExaminationRecord {
  id: string;
  examCode: string;
  academicYearId: string;
  nameBn: string;
  nameEn: string;
  termType: ExamTermType;
  applicableClasses: SupportedClassCode[];
  gradingRuleOverrides?: Partial<Record<SupportedClassCode, string>>;
  examSessionBn?: string;
  examSessionEn?: string;
  showPosition: boolean;
  isActive: boolean;
  order: number;
}

export interface GradeScaleBand {
  minPercentage: number; // inclusive, e.g., 80
  maxPercentage: number; // inclusive, e.g., 100
  letterGrade: string; // e.g., "A+"
  gradePoint: number; // e.g., 5.0
  remarksBn: string;
  remarksEn: string;
}

export interface GradingRuleRecord {
  id: string;
  ruleCode: string;
  nameBn: string;
  nameEn: string;
  descriptionBn: string;
  descriptionEn: string;
  maxGpa: number;
  defaultPassPercentage: number; // e.g., 33 or 40
  requireComponentPass: boolean; // true for Class 9-10 separate Written/MCQ/Practical pass
  enableOptionalBonus: boolean; // true for Class 9-10 4th subject bonus
  optionalBonusThreshold: number; // typically 2.00 (GP above 2.00 adds bonus)
  calculateGpa: boolean; // false for Nursery if percentage + grade only
  calculatePercentage: boolean;
  gradeScale: GradeScaleBand[];
  isActive: boolean;
}

export interface SubjectConfigRecord {
  id: string;
  subjectCode: string;
  classCode: SupportedClassCode;
  nameBn: string;
  nameEn: string;
  fullMarks: number;
  passMarks: number;
  hasComponents: boolean;
  writtenFullMarks?: number;
  writtenPassMarks?: number;
  mcqFullMarks?: number;
  mcqPassMarks?: number;
  hasPractical: boolean;
  practicalFullMarks?: number;
  practicalPassMarks?: number;
  isOptional: boolean;
  displayOrder: number;
  isActive: boolean;
}

/**
 * Private master student record (stored in /students/{studentId}).
 * Protected by Firestore Security Rules: readable ONLY by authorized admins/teachers.
 */
export interface StudentRecord {
  id: string;
  studentCode?: string;
  academicYearId: string;
  classCode: SupportedClassCode;
  rollNumber: string; // normalized ASCII numeric string e.g. "101"
  fullNameEn: string;
  fullNameBn?: string;
  section?: string;
  groupNameEn?: string;
  groupNameBn?: string;
  guardianName?: string;
  guardianPhone?: string;
  isActive: boolean;
}

export type ResultWorkflowStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'unpublished';

export interface ResultPublicationRecord {
  id: string; // Deterministic: `${academicYearId}_${examId}_${classCode}`
  academicYearId: string;
  examId: string;
  classCode: SupportedClassCode;
  workflowStatus: ResultWorkflowStatus;
  isPublished: boolean;
  rejectionReason?: string;
  publishedDateLabelBn?: string;
  publishedDateLabelEn?: string;
  showPosition: boolean;
  totalCandidates?: number;
  passCount?: number;
  isActive: boolean;
}

export interface SubjectMarkInput {
  subjectId: string;
  subjectCode: string;
  subjectNameBn: string;
  subjectNameEn: string;
  fullMarks: number;
  passMarks: number;
  isOptional: boolean;
  hasComponents: boolean;
  hasPractical: boolean;
  writtenFullMarks?: number;
  writtenPassMarks?: number;
  mcqFullMarks?: number;
  mcqPassMarks?: number;
  practicalFullMarks?: number;
  practicalPassMarks?: number;
  writtenMarks?: number | null;
  mcqMarks?: number | null;
  practicalMarks?: number | null;
  obtainedMarks: number;
  isAbsent?: boolean;
  displayOrder: number;
}

export interface CalculatedSubjectMark extends SubjectMarkInput {
  percentage: number;
  letterGrade: string;
  gradePoint: number;
  isPassed: boolean;
  failReasonEn?: string;
  failReasonBn?: string;
}

export interface ResultCalculationSummary {
  subjects: CalculatedSubjectMark[];
  totalFullMarks: number; // Compulsory + Optional full marks
  compulsoryFullMarks: number;
  obtainedTotalMarks: number;
  percentage: number | null;
  gpa: number | null;
  gpaWithoutOptional: number | null;
  optionalBonusAdded: number;
  letterGrade: string;
  finalStatus: 'PASS' | 'FAIL';
  compulsorySubjectCount: number;
  failedCompulsoryCount: number;
}

export interface StudentResultRecord {
  id: string; // Deterministic: `${academicYearId}_${examId}_${classCode}_${rollNumber}`
  academicYearId: string;
  academicYearLabelBn: string;
  academicYearLabelEn: string;
  examId: string;
  examNameBn: string;
  examNameEn: string;
  classCode: SupportedClassCode;
  classNameBn: string;
  classNameEn: string;
  rollNumber: string;
  studentId: string;
  studentCode?: string;
  studentNameEn: string;
  studentNameBn?: string;
  section?: string;
  groupNameEn?: string;
  groupNameBn?: string;
  gradingRuleId: string;
  totalFullMarks: number;
  obtainedTotalMarks: number;
  percentage: number | null;
  gpa: number | null;
  gpaWithoutOptional?: number | null;
  calculateGpa: boolean;
  calculatePercentage: boolean;
  maxGpa: number;
  letterGrade: string;
  finalStatus: 'PASS' | 'FAIL';
  compulsorySubjectCount: number;
  failedCompulsoryCount: number;
  position?: number | null;
  showPosition: boolean;
  workflowStatus: ResultWorkflowStatus;
  isPublished: boolean;
  rejectionReason?: string;
  publishedDateLabelBn?: string;
  publishedDateLabelEn?: string;
  enteredByUid?: string;
  isDemoRecord?: boolean;
}

export interface ResultSubjectMarkRecord {
  id: string; // Deterministic: `${resultId}_${subjectCode}`
  resultId: string;
  academicYearId: string;
  examId: string;
  classCode: SupportedClassCode;
  rollNumber: string;
  subjectId: string;
  subjectCode: string;
  subjectNameBn: string;
  subjectNameEn: string;
  fullMarks: number;
  passMarks: number;
  isOptional: boolean;
  hasComponents: boolean;
  hasPractical: boolean;
  writtenFullMarks?: number;
  mcqFullMarks?: number;
  practicalFullMarks?: number;
  writtenMarks?: number | null;
  mcqMarks?: number | null;
  practicalMarks?: number | null;
  obtainedMarks: number;
  isAbsent: boolean;
  letterGrade: string;
  gradePoint: number;
  isPassed: boolean;
  displayOrder: number;
  isPublished: boolean;
}

export interface ResultMarksheetBundle {
  result: StudentResultRecord;
  subjects: ResultSubjectMarkRecord[];
  gradingRule: GradingRuleRecord;
}

export interface ResultSearchQuery {
  academicYearId: string;
  examId: string;
  classCode: string;
  rollNumber: string;
}

export type ResultSearchErrorCode =
  | 'EMPTY_FIELDS'
  | 'INVALID_ROLL'
  | 'EXAM_NOT_FOUND'
  | 'NOT_PUBLISHED'
  | 'RESULT_NOT_FOUND'
  | 'SYSTEM_ERROR';

export type ResultSearchOutcome =
  | {
      ok: true;
      data: ResultMarksheetBundle;
      source: 'firestore' | 'demo_sandbox';
    }
  | {
      ok: false;
      errorCode: ResultSearchErrorCode;
      missingFields?: ('academicYearId' | 'examId' | 'classCode' | 'rollNumber')[];
      messageBn: string;
      messageEn: string;
    };
