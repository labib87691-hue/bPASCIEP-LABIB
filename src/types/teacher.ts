import { SupportedClassCode } from './result';
import { TeacherPortalRole } from './admin';

export type TeacherPermissionKey =
  | 'access_dashboard'
  | 'view_classes'
  | 'view_students'
  | 'access_cloud'
  | 'view_notices'
  | 'enter_marks'
  | 'edit_draft_marks'
  | 'submit_results'
  | 'take_attendance'
  | 'edit_profile';

export interface TeacherPermissionsConfig {
  canAccessDashboard: boolean;
  canViewClasses: boolean;
  canViewStudents: boolean;
  canAccessCloud: boolean;
  canViewNotices: boolean;
  canEnterMarks: boolean;
  canEditDraftMarks: boolean;
  canSubmitResults: boolean;
  canTakeAttendance: boolean;
  canEditProfile: boolean;
}

export interface TeacherAccountProfile {
  uid: string;
  email: string;
  fullName: string;
  teacherId: string;
  teacherRole: TeacherPortalRole;
  assignedClasses: string[];
  assignedSections: string[];
  assignedSubjects: string[];
  isClassTeacher: boolean;
  classTeacherOf?: string | null;
  canEnterMarks: boolean;
  canSubmitResults: boolean;
  canTakeAttendance: boolean;
  canViewStudents: boolean;
  canAccessCloud: boolean;
  canViewNotices: boolean;
  canEditProfile: boolean;
  canEditDraftMarks: boolean;
  phone?: string;
  designation?: string;
  department?: string;
  qualification?: string;
  photoUrl?: string;
  bio?: string;
  officeHours?: string;
  isActive: boolean;
  createdAtIso: string;
  updatedAtIso: string;
}

export type MarkSubmissionStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface TeacherMarkSubmissionRecord {
  id: string; // Deterministic: `${academicYearId}_${examId}_${classCode}_${subjectCode}_${teacherUid}`
  teacherUid: string;
  teacherId: string;
  teacherName: string;
  academicYearId: string;
  examId: string;
  examName: string;
  classCode: SupportedClassCode;
  className: string;
  subjectCode: string;
  subjectName: string;
  totalCandidates: number;
  submittedMarksCount: number;
  status: MarkSubmissionStatus;
  rejectionReason?: string | null;
  submittedAtIso?: string | null;
  reviewedBy?: string | null;
  reviewedAtIso?: string | null;
  createdAtIso: string;
  updatedAtIso: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceRecord {
  id: string; // Deterministic: `${academicYearId}_${classCode}_${section || 'all'}_${date}`
  academicYearId: string;
  classCode: SupportedClassCode;
  className: string;
  section: string;
  date: string; // YYYY-MM-DD
  teacherUid: string;
  teacherId: string;
  teacherName: string;
  studentAttendance: Record<string, AttendanceStatus>; // studentId -> status
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  remarks?: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface TeacherClassOverview {
  classCode: SupportedClassCode;
  className: string;
  sections: string[];
  subjects: string[];
  studentCount: number;
  routineDocUrl?: string | null;
  syllabusDocUrl?: string | null;
}
