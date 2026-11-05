export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'result_manager'
  | 'cloud_manager'
  | 'content_editor';

export interface AdminUserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  isActive: boolean;
  createdAtIso: string;
  updatedAtIso: string;
}

export type AdminPermissionKey =
  | 'view_dashboard'
  | 'manage_website_content'
  | 'manage_cloud'
  | 'manage_results'
  | 'approve_publish_results'
  | 'manage_teachers'
  | 'manage_students'
  | 'manage_notices'
  | 'manage_news_events'
  | 'manage_gallery'
  | 'manage_holidays'
  | 'manage_teacher_access'
  | 'manage_contact_messages'
  | 'manage_settings'
  | 'manage_admin_roles'
  | 'view_activity_logs'
  | 'generate_qr';

export type ActivityActionType =
  | 'login'
  | 'logout'
  | 'admin_bootstrapped'
  | 'role_updated'
  | 'website_content_updated'
  | 'document_created'
  | 'document_updated'
  | 'document_published'
  | 'document_unpublished'
  | 'document_deleted'
  | 'exam_configured'
  | 'marks_saved'
  | 'result_approved'
  | 'result_rejected'
  | 'result_published'
  | 'result_unpublished'
  | 'student_updated'
  | 'students_imported'
  | 'teacher_updated'
  | 'teacher_approved'
  | 'teacher_rejected'
  | 'teacher_permissions_updated'
  | 'notice_created'
  | 'notice_updated'
  | 'news_event_updated'
  | 'gallery_updated'
  | 'holiday_updated'
  | 'message_updated'
  | 'settings_changed';

export interface ActivityLogRecord {
  id: string;
  actorUid: string;
  actorEmail: string;
  actorRole: AdminRole;
  actionType: ActivityActionType;
  targetCollection: string;
  targetId: string;
  summary: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAtIso: string;
}

export type HolidayType =
  | 'national'
  | 'institutional'
  | 'exam_break'
  | 'vacation'
  | 'class_specific';

export interface HolidayRecord {
  id: string;
  titleEn: string;
  titleBn: string;
  descriptionEn: string;
  descriptionBn: string;
  isMultiDay: boolean;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  holidayType: HolidayType;
  applicableClass: string; // "ALL" or "Nursery" .. "Class 10"
  academicYear: string; // e.g. "2026"
  driveUrl?: string | null;
  isPublished: boolean;
  createdAtIso: string;
  updatedAtIso: string;
}

export type TeacherAccessRequestStatus = 'pending' | 'approved' | 'rejected';

export interface TeacherAccessRequestRecord {
  id: string;
  applicantUid?: string | null;
  fullName: string;
  email: string;
  phone: string;
  teacherId: string;
  designation: string;
  department: string;
  requestedClasses: string[];
  requestedSubjects: string[];
  status: TeacherAccessRequestStatus;
  rejectionReason?: string | null;
  reviewedByUid?: string | null;
  createdAtIso: string;
  updatedAtIso: string;
}

export type TeacherPortalRole = 'subject_teacher' | 'class_teacher';

export interface AuthorizedTeacherAccount {
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
  canAccessCloud?: boolean;
  canViewNotices?: boolean;
  canEditProfile?: boolean;
  canEditDraftMarks?: boolean;
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

export interface ContactMessageRecord {
  id: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'archived';
  createdAtIso: string;
}

export interface SchoolOperationalSettings {
  id: string;
  currentAcademicYear: string;
  admissionOpen: boolean;
  resultPortalEnabled: boolean;
  defaultShowPositionInResults: boolean;
  requireResultApprovalBeforePublish: boolean;
  cloudCenterEnabled: boolean;
  cloudItemsPerPage: number;
  maintenanceBannerTextEn: string;
  maintenanceBannerTextBn: string;
  updatedAtIso: string;
}

export interface AdminDashboardStats {
  totalStudents: number;
  totalTeachers: number;
  publishedCloudDocs: number;
  draftCloudDocs: number;
  publishedResults: number;
  pendingResultApprovals: number;
  publishedNotices: number;
  pendingTeacherApprovals: number;
  unreadContactMessages: number;
  publishedHolidays: number;
  dataSource: 'firestore' | 'hybrid';
}
