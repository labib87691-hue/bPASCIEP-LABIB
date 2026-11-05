import { CloudFileType, GoogleDriveLinkResolution, GoogleDriveResourceKind } from '../types/cloud';

const ALLOWED_GOOGLE_HOSTS = new Set(['drive.google.com', 'docs.google.com']);
const SAFE_DRIVE_ID_REGEX = /^[a-zA-Z0-9_-]{10,120}$/;

const PREVIEWABLE_FILE_TYPES = new Set<CloudFileType>([
  'PDF',
  'DOC',
  'DOCX',
  'XLS',
  'XLSX',
  'PPT',
  'PPTX',
  'JPG',
  'PNG',
]);

/**
 * Validates and resolves external Google Drive / Google Docs links into:
 * - Direct download URL (when a valid Google Drive file ID can be extracted)
 * - Fallback Google Drive file/folder view URL
 * - Embedded preview URL (for supported file types such as public PDFs/docs/images)
 *
 * Strictly rejects non-HTTPS protocols, script/data URIs, and non-Google-Drive domains.
 */
export function inspectGoogleDriveUrl(
  rawUrl: string,
  fileType: CloudFileType = 'PDF'
): GoogleDriveLinkResolution {
  const trimmed = (rawUrl || '').trim();

  if (!trimmed) {
    return {
      isValid: false,
      kind: 'invalid',
      fileId: null,
      normalizedOriginalUrl: null,
      directDownloadUrl: null,
      fallbackViewUrl: null,
      embedPreviewUrl: null,
      canDirectDownload: false,
      canEmbedPreview: false,
      errorCode: 'EMPTY_URL',
      errorMessageEn: 'No Google Drive document link is configured for this item.',
      errorMessageBn: 'এই ডকুমেন্টের জন্য কোনো গুগল ড্রাইভ লিংক যুক্ত করা হয়নি।',
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      kind: 'invalid',
      fileId: null,
      normalizedOriginalUrl: null,
      directDownloadUrl: null,
      fallbackViewUrl: null,
      embedPreviewUrl: null,
      canDirectDownload: false,
      canEmbedPreview: false,
      errorCode: 'MALFORMED_DRIVE_LINK',
      errorMessageEn: 'The stored document URL is malformed. Please verify the Google Drive link.',
      errorMessageBn: 'সংরক্ষিত ডকুমেন্ট লিংকটি সঠিক ফরম্যাটে নেই। অনুগ্রহ করে গুগল ড্রাইভ লিংক যাচাই করুন।',
    };
  }

  if (parsed.protocol !== 'https:') {
    return {
      isValid: false,
      kind: 'invalid',
      fileId: null,
      normalizedOriginalUrl: null,
      directDownloadUrl: null,
      fallbackViewUrl: null,
      embedPreviewUrl: null,
      canDirectDownload: false,
      canEmbedPreview: false,
      errorCode: 'UNSAFE_PROTOCOL',
      errorMessageEn: 'Only secure HTTPS Google Drive links are permitted.',
      errorMessageBn: 'নিরাপত্তার স্বার্থে শুধুমাত্র HTTPS গুগল ড্রাইভ লিংক অনুমোদিত।',
    };
  }

  const host = parsed.hostname.toLowerCase();
  if (!ALLOWED_GOOGLE_HOSTS.has(host)) {
    return {
      isValid: false,
      kind: 'invalid',
      fileId: null,
      normalizedOriginalUrl: null,
      directDownloadUrl: null,
      fallbackViewUrl: null,
      embedPreviewUrl: null,
      canDirectDownload: false,
      canEmbedPreview: false,
      errorCode: 'UNSUPPORTED_DOMAIN',
      errorMessageEn:
        'Invalid host. Documents in BPSC Cloud Center must be hosted on Google Drive (drive.google.com or docs.google.com).',
      errorMessageBn:
        'লিংকটি গুগল ড্রাইভের নয়। ক্লাউড সেন্টারে শুধুমাত্র অফিসিয়াল Google Drive লিংক সমর্থিত।',
    };
  }

  const pathname = parsed.pathname;
  let kind: GoogleDriveResourceKind = 'drive_generic';
  let extractedId: string | null = null;

  // 1. Standard Drive file: /file/d/{FILE_ID}/...
  const driveFileMatch = pathname.match(/\/file\/d\/([^/]+)/);
  if (driveFileMatch?.[1]) {
    extractedId = driveFileMatch[1];
    kind = 'drive_file';
  }

  // 2. Google Docs / Sheets / Slides: /document|spreadsheets|presentation/d/{FILE_ID}/...
  if (!extractedId && host === 'docs.google.com') {
    const docMatch = pathname.match(/\/(document|spreadsheets|presentation)\/d\/([^/]+)/);
    if (docMatch?.[2]) {
      extractedId = docMatch[2];
      kind =
        docMatch[1] === 'document'
          ? 'google_doc'
          : docMatch[1] === 'spreadsheets'
          ? 'google_sheet'
          : 'google_slide';
    }
  }

  // 3. Drive folder: /drive/folders/{FOLDER_ID} or /drive/u/0/folders/{FOLDER_ID}
  if (!extractedId) {
    const folderMatch = pathname.match(/\/folders\/([^/?#]+)/);
    if (folderMatch?.[1] && SAFE_DRIVE_ID_REGEX.test(folderMatch[1])) {
      const folderId = folderMatch[1];
      const cleanFolderUrl = `https://drive.google.com/drive/folders/${folderId}`;
      return {
        isValid: true,
        kind: 'drive_folder',
        fileId: folderId,
        normalizedOriginalUrl: parsed.toString(),
        directDownloadUrl: null,
        fallbackViewUrl: cleanFolderUrl,
        embedPreviewUrl: null,
        canDirectDownload: false,
        canEmbedPreview: false,
      };
    }
  }

  // 4. Query param formats: /open?id={FILE_ID} or /uc?id={FILE_ID}&export=download
  if (!extractedId && (pathname === '/open' || pathname === '/uc' || pathname.startsWith('/file'))) {
    const queryId = parsed.searchParams.get('id');
    if (queryId) {
      extractedId = queryId;
      kind = 'drive_file';
    }
  }

  // Validate extracted ID if found
  if (extractedId !== null) {
    if (!SAFE_DRIVE_ID_REGEX.test(extractedId)) {
      return {
        isValid: false,
        kind: 'invalid',
        fileId: null,
        normalizedOriginalUrl: null,
        directDownloadUrl: null,
        fallbackViewUrl: null,
        embedPreviewUrl: null,
        canDirectDownload: false,
        canEmbedPreview: false,
        errorCode: 'MALFORMED_DRIVE_LINK',
        errorMessageEn:
          'The Google Drive File ID in this link is invalid or incomplete. Please check the shared link.',
        errorMessageBn:
          'গুগল ড্রাইভ লিংকের ফাইল আইডি (File ID) সঠিক নয় বা অসম্পূর্ণ। অনুগ্রহ করে শেয়ারিং লিংকটি যাচাই করুন।',
      };
    }

    let directDownloadUrl: string;
    let fallbackViewUrl: string;
    let embedPreviewUrl: string | null = null;

    if (kind === 'google_doc') {
      const exportFmt = fileType === 'DOC' || fileType === 'DOCX' ? 'docx' : 'pdf';
      directDownloadUrl = `https://docs.google.com/document/d/${extractedId}/export?format=${exportFmt}`;
      fallbackViewUrl = `https://docs.google.com/document/d/${extractedId}/view`;
      embedPreviewUrl = `https://docs.google.com/document/d/${extractedId}/preview`;
    } else if (kind === 'google_sheet') {
      const exportFmt = fileType === 'PDF' ? 'pdf' : 'xlsx';
      directDownloadUrl = `https://docs.google.com/spreadsheets/d/${extractedId}/export?format=${exportFmt}`;
      fallbackViewUrl = `https://docs.google.com/spreadsheets/d/${extractedId}/view`;
      embedPreviewUrl = `https://docs.google.com/spreadsheets/d/${extractedId}/preview`;
    } else if (kind === 'google_slide') {
      const exportFmt = fileType === 'PPT' || fileType === 'PPTX' ? 'pptx' : 'pdf';
      directDownloadUrl = `https://docs.google.com/presentation/d/${extractedId}/export?format=${exportFmt}`;
      fallbackViewUrl = `https://docs.google.com/presentation/d/${extractedId}/view`;
      embedPreviewUrl = `https://docs.google.com/presentation/d/${extractedId}/preview`;
    } else {
      directDownloadUrl = `https://drive.google.com/uc?export=download&id=${extractedId}`;
      fallbackViewUrl = `https://drive.google.com/file/d/${extractedId}/view`;
      if (PREVIEWABLE_FILE_TYPES.has(fileType)) {
        embedPreviewUrl = `https://drive.google.com/file/d/${extractedId}/preview`;
      }
    }

    return {
      isValid: true,
      kind,
      fileId: extractedId,
      normalizedOriginalUrl: parsed.toString(),
      directDownloadUrl,
      fallbackViewUrl,
      embedPreviewUrl,
      canDirectDownload: true,
      canEmbedPreview: Boolean(embedPreviewUrl),
    };
  }

  // Reject bare root URLs with no resource path/id (e.g. "https://drive.google.com/")
  if (pathname === '/' || pathname === '') {
    return {
      isValid: false,
      kind: 'invalid',
      fileId: null,
      normalizedOriginalUrl: null,
      directDownloadUrl: null,
      fallbackViewUrl: null,
      embedPreviewUrl: null,
      canDirectDownload: false,
      canEmbedPreview: false,
      errorCode: 'MALFORMED_DRIVE_LINK',
      errorMessageEn:
        'This link points to Google Drive home instead of a specific document or shared folder.',
      errorMessageBn:
        'লিংকটিতে কোনো নির্দিষ্ট ফাইল বা ফোল্ডারের ঠিকানা নেই। অনুগ্রহ করে সঠিক শেয়ার লিংক ব্যবহার করুন।',
    };
  }

  // Valid Google Drive URL where direct file ID is not extractable -> safe fallback to opening Google Drive page
  return {
    isValid: true,
    kind: 'drive_generic',
    fileId: null,
    normalizedOriginalUrl: parsed.toString(),
    directDownloadUrl: null,
    fallbackViewUrl: parsed.toString(),
    embedPreviewUrl: null,
    canDirectDownload: false,
    canEmbedPreview: false,
  };
}

/**
 * Firestore-rules-compatible check for Admin create/update validation.
 */
export function isValidFirestoreDriveUrl(rawUrl: string): boolean {
  const trimmed = (rawUrl || '').trim();
  if (trimmed.length < 24 || trimmed.length > 600) return false;
  if (!/^https:\/\/(drive|docs)\.google\.com\/[a-zA-Z0-9_\-./?=&%+]+$/.test(trimmed)) {
    return false;
  }
  const resolution = inspectGoogleDriveUrl(trimmed);
  return resolution.isValid;
}
