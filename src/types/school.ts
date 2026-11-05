export type Language = 'bn' | 'en';

export interface SiteContentBlock {
  id: string;
  sectionKey: string;
  titleBn: string;
  titleEn: string;
  bodyBn: string;
  bodyEn: string;
  isPublished: boolean;
  updatedAtIso?: string;
}

export interface SiteSetting {
  id: string;
  schoolNameBn: string;
  schoolNameEn: string;
  shortName: string;
  logoUrl?: string;
  eiin: string;
  establishedYear: string;
  inauguratedDateBn: string;
  inauguratedDateEn: string;
  addressBn: string;
  addressEn: string;
  phonePrimary: string;
  phoneSecondary: string;
  emailPrimary: string;
  emailSecondary: string;
  facebookUrl: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
  footerTaglineBn?: string;
  footerTaglineEn?: string;
  mapEmbedUrl: string;
  totalStudents: string; // Verified or Admin-configured only
  totalTeachers: number;
  totalStaff: number;
  totalClasses: number;
  isPublished: boolean;
}

export interface BannerItem {
  id: string;
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  subtitleEn: string;
  imageUrl: string;
  order: number;
  isPublished: boolean;
}

export interface AdminLeader {
  id: string;
  roleKey: 'executive_chairman' | 'executive_director' | 'principal' | 'grs_focal_point' | 'assistant_head_teacher';
  name: string;
  nameBn: string;
  credentials?: string;
  designationBn: string;
  designationEn: string;
  organizationBn: string;
  organizationEn: string;
  messageBn: string;
  messageEn: string;
  photoUrl: string;
  phone?: string;
  email?: string;
  order: number;
  isPublished: boolean;
}

export interface GoverningMember {
  id: string;
  name: string;
  nameBn: string;
  boardRoleBn: string;
  boardRoleEn: string;
  designationBn: string;
  designationEn: string;
  photoUrl: string; // Empty string if not available on reference website (recorded for manual replacement)
  photoMissingNote?: string;
  order: number;
  isPublished: boolean;
}

export type TeacherEmploymentStatus = 'active' | 'on_leave' | 'inactive';

export interface TeacherProfile {
  id: string;
  serial: number;
  name: string;
  nameBn: string;
  designationBn: string;
  designationEn: string;
  department: 'Science' | 'Mathematics' | 'Language & Literature' | 'Humanities & Social Science' | 'Business Studies' | 'Arts, ICT & Co-Curricular';
  departmentBn: string;
  subjectBn: string;
  subjectEn: string;
  qualification: string;
  photoUrl: string;
  publicPhone: string;
  publicEmail: string;
  assignedClass?: string;
  assignedSection?: string;
  employmentStatus?: TeacherEmploymentStatus;
  isActive?: boolean;
  coordinatorRoleBn?: string;
  coordinatorRoleEn?: string;
  isPublished: boolean;
}

export interface StaffProfile {
  id: string;
  serial: number;
  name: string;
  nameBn: string;
  designationBn: string;
  designationEn: string;
  photoUrl: string;
  publicPhone?: string;
  publicEmail?: string;
  employmentStatus?: TeacherEmploymentStatus;
  isActive?: boolean;
  isPublished: boolean;
}

export interface AcademicClassLevel {
  id: string;
  levelOrder: number;
  classCode: string;
  nameBn: string;
  nameEn: string;
  sectionGroupBn: string;
  sectionGroupEn: string;
  subjectsBn: string[];
  subjectsEn: string[];
  descriptionBn: string;
  descriptionEn: string;
  routineUrl?: string;
  syllabusUrl?: string;
  isPublished: boolean;
}

export interface AcademicResourceItem {
  id: string;
  resourceType: 'class_routine' | 'exam_routine' | 'syllabus' | 'course_plan' | 'calendar';
  titleBn: string;
  titleEn: string;
  classNameBn: string;
  classNameEn: string;
  publishDate: string;
  fileUrl?: string;
  fileType?: 'pdf' | 'image';
  statusNoteBn?: string;
  statusNoteEn?: string;
  order: number;
  isPublished: boolean;
}

export type NoticeCategory = 'examination' | 'admission' | 'recruitment' | 'academic' | 'general';

export interface NoticeItem {
  id: string;
  serial: number;
  titleBn: string;
  titleEn: string;
  category: NoticeCategory;
  publishDate: string;
  year: string;
  summaryBn: string;
  summaryEn: string;
  detailsBn: string;
  detailsEn: string;
  attachmentUrl?: string;
  attachmentType?: 'pdf' | 'image';
  externalUrl?: string;
  isImportant: boolean;
  isPublished: boolean;
}

export type GalleryCategory = 'campus' | 'science_fair' | 'events' | 'cultural' | 'guardians_meeting' | 'transport';

export interface GalleryPhoto {
  id: string;
  titleBn: string;
  titleEn: string;
  category: GalleryCategory;
  imageUrl: string;
  dateLabel: string;
  order: number;
  isPublished: boolean;
}

export interface NewsEventItem {
  id: string;
  type: 'achievement' | 'event' | 'news';
  titleBn: string;
  titleEn: string;
  publishDate: string;
  categoryBn: string;
  categoryEn: string;
  summaryBn: string;
  summaryEn: string;
  detailsBn: string;
  detailsEn: string;
  imageUrl: string;
  extraImages?: string[];
  attachmentUrl?: string;
  isPublished: boolean;
}

export interface FacilityItem {
  id: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  highlightsBn: string[];
  highlightsEn: string[];
  imageUrl: string;
  order: number;
  isPublished: boolean;
}

export interface TransportRecord {
  id: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  imageUrl: string;
  order: number;
  isPublished: boolean;
}

export interface CalendarEventItem {
  id: string;
  monthBn: string;
  monthEn: string;
  dateLabelBn: string;
  dateLabelEn: string;
  titleBn: string;
  titleEn: string;
  type: 'academic' | 'examination' | 'admission' | 'cultural';
  descriptionBn: string;
  descriptionEn: string;
}

export interface ContactInquiryInput {
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  subject: string;
  message: string;
}
