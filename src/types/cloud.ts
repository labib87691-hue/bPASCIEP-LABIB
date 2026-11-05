export type CloudDocumentCategory =
  | 'Class Routine'
  | 'Exam Routine'
  | 'Syllabus'
  | 'Office Notice'
  | 'Office Order'
  | 'Forms'
  | 'Academic Calendar'
  | 'Holiday List'
  | 'Question Papers'
  | 'Model Questions'
  | 'Study Materials'
  | 'Other Documents';

export type CloudSupportedClassName =
  | 'Nursery'
  | 'Class 1'
  | 'Class 2'
  | 'Class 3'
  | 'Class 4'
  | 'Class 5'
  | 'Class 6'
  | 'Class 7'
  | 'Class 8'
  | 'Class 9'
  | 'Class 10';

export type CloudFileType =
  | 'PDF'
  | 'DOC'
  | 'DOCX'
  | 'XLS'
  | 'XLSX'
  | 'PPT'
  | 'PPTX'
  | 'JPG'
  | 'PNG'
  | 'ZIP'
  | 'OTHER';

export interface CloudCategoryMeta {
  key: CloudDocumentCategory;
  slug: string;
  labelEn: string;
  labelBn: string;
  descriptionEn: string;
  descriptionBn: string;
  order: number;
}

export interface CloudClassMeta {
  nameEn: CloudSupportedClassName;
  nameBn: string;
  order: number;
}

export interface CloudDocumentRecord {
  id: string;
  title: string;
  titleBn?: string | null;
  category: CloudDocumentCategory;
  className: CloudSupportedClassName | null;
  subject: string | null;
  academicYear: string | null;
  description: string;
  descriptionBn?: string | null;
  driveUrl: string;
  fileType: CloudFileType;
  fileSize: string | null;
  isPublished: boolean;
  isDemoRecord?: boolean;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface CloudDocumentInput {
  id?: string;
  title: string;
  titleBn?: string | null;
  category: CloudDocumentCategory;
  className?: CloudSupportedClassName | null;
  subject?: string | null;
  academicYear?: string | null;
  description: string;
  descriptionBn?: string | null;
  driveUrl: string;
  fileType: CloudFileType;
  fileSize?: string | null;
  isPublished: boolean;
  isDemoRecord?: boolean;
}

export interface CloudDocumentFilterState {
  searchQuery: string;
  category: CloudDocumentCategory | 'ALL';
  className: CloudSupportedClassName | 'ALL' | 'GENERAL';
  subject: string | 'ALL';
  academicYear: string | 'ALL';
}

export type GoogleDriveResourceKind =
  | 'drive_file'
  | 'google_doc'
  | 'google_sheet'
  | 'google_slide'
  | 'drive_folder'
  | 'drive_generic'
  | 'invalid';

export interface GoogleDriveLinkResolution {
  isValid: boolean;
  kind: GoogleDriveResourceKind;
  fileId: string | null;
  normalizedOriginalUrl: string | null;
  directDownloadUrl: string | null;
  fallbackViewUrl: string | null;
  embedPreviewUrl: string | null;
  canDirectDownload: boolean;
  canEmbedPreview: boolean;
  errorCode?: 'EMPTY_URL' | 'UNSAFE_PROTOCOL' | 'UNSUPPORTED_DOMAIN' | 'MALFORMED_DRIVE_LINK';
  errorMessageEn?: string;
  errorMessageBn?: string;
}
