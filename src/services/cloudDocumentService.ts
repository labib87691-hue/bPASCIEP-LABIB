import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  isFirebaseConfigured,
  OperationType,
} from '../lib/firebase';
import {
  CloudDocumentCategory,
  CloudDocumentFilterState,
  CloudDocumentInput,
  CloudDocumentRecord,
  CloudFileType,
  CloudSupportedClassName,
} from '../types/cloud';
import {
  ALL_CLOUD_CATEGORY_NAMES,
  ALL_CLOUD_CLASS_NAMES,
  CLOUD_DOCUMENT_CATEGORIES,
  CLOUD_SUPPORTED_CLASSES,
  DEMO_CLOUD_DOCUMENTS,
} from '../data/cloudCenterSeedData';
import { isValidFirestoreDriveUrl } from '../utils/googleDriveUtils';

const SAFE_DOC_ID_REGEX = /^[a-zA-Z0-9_\-]+$/;

const ALLOWED_FILE_TYPES: CloudFileType[] = [
  'PDF',
  'DOC',
  'DOCX',
  'XLS',
  'XLSX',
  'PPT',
  'PPTX',
  'JPG',
  'PNG',
  'ZIP',
  'OTHER',
];

function timestampToIso(value: unknown, fallbackIso: string): string {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate().toISOString();
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  return fallbackIso;
}

function mapFirestoreCloudDoc(id: string, raw: Record<string, unknown>): CloudDocumentRecord {
  const fallbackIso = new Date().toISOString();
  const createdAtIso = timestampToIso(raw.createdAt, fallbackIso);
  const updatedAtIso = timestampToIso(raw.updatedAt, createdAtIso);

  return {
    id,
    title: String(raw.title || ''),
    titleBn: typeof raw.titleBn === 'string' && raw.titleBn.trim() ? raw.titleBn : null,
    category: (ALL_CLOUD_CATEGORY_NAMES.includes(raw.category as CloudDocumentCategory)
      ? raw.category
      : 'Other Documents') as CloudDocumentCategory,
    className:
      raw.className && ALL_CLOUD_CLASS_NAMES.includes(raw.className as CloudSupportedClassName)
        ? (raw.className as CloudSupportedClassName)
        : null,
    subject: typeof raw.subject === 'string' && raw.subject.trim() ? raw.subject.trim() : null,
    academicYear:
      typeof raw.academicYear === 'string' && raw.academicYear.trim()
        ? raw.academicYear.trim()
        : null,
    description: String(raw.description || ''),
    descriptionBn:
      typeof raw.descriptionBn === 'string' && raw.descriptionBn.trim()
        ? raw.descriptionBn
        : null,
    driveUrl: String(raw.driveUrl || ''),
    fileType: (ALLOWED_FILE_TYPES.includes(raw.fileType as CloudFileType)
      ? raw.fileType
      : 'OTHER') as CloudFileType,
    fileSize: typeof raw.fileSize === 'string' && raw.fileSize.trim() ? raw.fileSize.trim() : null,
    isPublished: raw.isPublished === true,
    isDemoRecord: raw.isDemoRecord === true,
    createdAtIso,
    updatedAtIso,
  };
}

function assertAuthenticatedFirestore() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  if (!auth?.currentUser) {
    throw new Error('ADMIN_AUTHENTICATION_REQUIRED');
  }
  return db;
}

export function validateCloudDocumentPayload(input: CloudDocumentInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const title = (input.title || '').trim();
  if (!title || title.length > 250) {
    errors.push('Document title is required and must be 1–250 characters.');
  }

  if (input.titleBn && input.titleBn.trim().length > 250) {
    errors.push('Bengali title must not exceed 250 characters.');
  }

  if (!ALL_CLOUD_CATEGORY_NAMES.includes(input.category)) {
    errors.push('Invalid document category.');
  }

  if (input.className != null && input.className !== '' as unknown) {
    if (!ALL_CLOUD_CLASS_NAMES.includes(input.className)) {
      errors.push('Invalid class selection. Supported classes are Nursery to Class 10.');
    }
  }

  if (input.subject != null && input.subject.trim().length > 120) {
    errors.push('Subject name must not exceed 120 characters.');
  }

  if (input.academicYear != null && input.academicYear.trim().length > 0) {
    if (!/^[0-9]{4}(-[0-9]{2,4})?$/.test(input.academicYear.trim())) {
      errors.push('Academic year must be a valid year such as 2026.');
    }
  }

  const description = (input.description || '').trim();
  if (!description || description.length > 2000) {
    errors.push('Document description is required and must be 1–2000 characters.');
  }

  if (input.descriptionBn && input.descriptionBn.trim().length > 2000) {
    errors.push('Bengali description must not exceed 2000 characters.');
  }

  if (!isValidFirestoreDriveUrl(input.driveUrl || '')) {
    errors.push(
      'A valid HTTPS Google Drive link (drive.google.com or docs.google.com) is required.'
    );
  }

  if (!ALLOWED_FILE_TYPES.includes(input.fileType)) {
    errors.push('Unsupported file type indicator.');
  }

  if (input.fileSize != null && input.fileSize.trim().length > 40) {
    errors.push('File size label must not exceed 40 characters.');
  }

  return { valid: errors.length === 0, errors };
}

export interface PublishedCloudResult {
  documents: CloudDocumentRecord[];
  source: 'firestore' | 'demo_sandbox';
}

/**
 * Fetches ONLY published documents (`isPublished == true`) for the public Cloud Center.
 * Unpublished documents are strictly excluded at both the Firestore security-rule level
 * and client defense-in-depth filter level.
 */
export async function fetchPublishedCloudDocuments(): Promise<PublishedCloudResult> {
  const publishedDemos = DEMO_CLOUD_DOCUMENTS.filter((d) => d.isPublished === true).sort((a, b) =>
    b.createdAtIso.localeCompare(a.createdAtIso)
  );

  if (!isFirebaseConfigured || !db) {
    return { documents: publishedDemos, source: 'demo_sandbox' };
  }

  try {
    const snap = await getDocs(
      query(collection(db, 'cloudDocuments'), where('isPublished', '==', true))
    );

    const liveDocs = snap.docs
      .map((d) => mapFirestoreCloudDoc(d.id, d.data() as Record<string, unknown>))
      .filter((d) => d.isPublished === true)
      .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));

    if (liveDocs.length > 0) {
      return { documents: liveDocs, source: 'firestore' };
    }

    return { documents: publishedDemos, source: 'demo_sandbox' };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Missing or insufficient permissions')
    ) {
      handleFirestoreError(error, OperationType.LIST, 'cloudDocuments');
    }
    console.warn('Cloud Center fallback active:', error);
    return { documents: publishedDemos, source: 'demo_sandbox' };
  }
}

/**
 * Searches published Cloud Documents across title, category, class, subject,
 * academic year, and description (supporting both English and Bengali queries).
 */
export function searchCloudDocuments(
  documents: CloudDocumentRecord[],
  rawQuery: string
): CloudDocumentRecord[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return documents;

  return documents.filter((docItem) => {
    const catMeta = CLOUD_DOCUMENT_CATEGORIES.find((c) => c.key === docItem.category);
    const classMeta = docItem.className
      ? CLOUD_SUPPORTED_CLASSES.find((c) => c.nameEn === docItem.className)
      : undefined;

    const searchableFields = [
      docItem.title,
      docItem.titleBn || '',
      docItem.category,
      catMeta?.labelBn || '',
      docItem.className || '',
      classMeta?.nameBn || '',
      docItem.subject || '',
      docItem.academicYear || '',
      docItem.description,
      docItem.descriptionBn || '',
      docItem.fileType,
    ];

    return searchableFields.some((val) => val.toLowerCase().includes(q));
  });
}

/**
 * Applies combined search + multi-dimensional filters (Category, Class, Subject, Academic Year).
 * Always enforces `isPublished === true` for public queries.
 */
export function filterCloudDocuments(
  documents: CloudDocumentRecord[],
  filters: CloudDocumentFilterState
): CloudDocumentRecord[] {
  const publishedOnly = documents.filter((d) => d.isPublished === true);
  const searched = searchCloudDocuments(publishedOnly, filters.searchQuery);

  return searched.filter((docItem) => {
    if (filters.category !== 'ALL' && docItem.category !== filters.category) {
      return false;
    }

    if (filters.className === 'GENERAL') {
      if (docItem.className !== null) return false;
    } else if (filters.className !== 'ALL') {
      if (docItem.className !== filters.className) return false;
    }

    if (filters.subject !== 'ALL') {
      if (!docItem.subject || docItem.subject.toLowerCase() !== filters.subject.toLowerCase()) {
        return false;
      }
    }

    if (filters.academicYear !== 'ALL') {
      if (docItem.academicYear !== filters.academicYear) {
        return false;
      }
    }

    return true;
  });
}

// ============================================================================
// Reusable Cloud Document Management Functions (Ready for Phase 4 Admin Panel)
// ============================================================================
// All mutations require an authenticated Administrator (`isAdmin()` in Firestore Rules).
// ============================================================================

function buildDeterministicOrSafeId(customId?: string): string {
  if (customId && customId.trim()) {
    const clean = customId.trim();
    if (!SAFE_DOC_ID_REGEX.test(clean) || clean.length > 128) {
      throw new Error('INVALID_DOCUMENT_ID');
    }
    return clean;
  }
  return `cdoc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function buildSanitizedFirestoreBody(input: CloudDocumentInput) {
  return {
    title: input.title.trim().slice(0, 250),
    ...(input.titleBn && input.titleBn.trim()
      ? { titleBn: input.titleBn.trim().slice(0, 250) }
      : {}),
    category: input.category,
    className: input.className ? input.className : null,
    subject: input.subject && input.subject.trim() ? input.subject.trim().slice(0, 120) : null,
    academicYear:
      input.academicYear && input.academicYear.trim()
        ? input.academicYear.trim().slice(0, 20)
        : null,
    description: input.description.trim().slice(0, 2000),
    ...(input.descriptionBn && input.descriptionBn.trim()
      ? { descriptionBn: input.descriptionBn.trim().slice(0, 2000) }
      : {}),
    driveUrl: input.driveUrl.trim().slice(0, 600),
    fileType: input.fileType,
    fileSize: input.fileSize && input.fileSize.trim() ? input.fileSize.trim().slice(0, 40) : null,
    isPublished: Boolean(input.isPublished),
    isDemoRecord: Boolean(input.isDemoRecord),
  };
}

export async function addCloudDocument(input: CloudDocumentInput): Promise<string> {
  const firestore = assertAuthenticatedFirestore();
  const validation = validateCloudDocumentPayload(input);
  if (!validation.valid) {
    throw new Error(`VALIDATION_FAILED: ${validation.errors.join(' ')}`);
  }

  const documentId = buildDeterministicOrSafeId(input.id);
  const path = `cloudDocuments/${documentId}`;

  try {
    await setDoc(doc(firestore, 'cloudDocuments', documentId), {
      ...buildSanitizedFirestoreBody(input),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return documentId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCloudDocument(
  documentId: string,
  updates: Partial<Omit<CloudDocumentInput, 'id'>>
): Promise<void> {
  const firestore = assertAuthenticatedFirestore();
  if (!SAFE_DOC_ID_REGEX.test(documentId) || documentId.length > 128) {
    throw new Error('INVALID_DOCUMENT_ID');
  }

  const path = `cloudDocuments/${documentId}`;
  try {
    const existingSnap = await getDoc(doc(firestore, 'cloudDocuments', documentId));
    if (!existingSnap.exists()) {
      throw new Error('DOCUMENT_NOT_FOUND');
    }

    const existingRaw = existingSnap.data() as Record<string, unknown>;
    const existingMapped = mapFirestoreCloudDoc(documentId, existingRaw);

    const mergedInput: CloudDocumentInput = {
      title: updates.title ?? existingMapped.title,
      titleBn: updates.titleBn !== undefined ? updates.titleBn : existingMapped.titleBn,
      category: updates.category ?? existingMapped.category,
      className: updates.className !== undefined ? updates.className : existingMapped.className,
      subject: updates.subject !== undefined ? updates.subject : existingMapped.subject,
      academicYear:
        updates.academicYear !== undefined ? updates.academicYear : existingMapped.academicYear,
      description: updates.description ?? existingMapped.description,
      descriptionBn:
        updates.descriptionBn !== undefined ? updates.descriptionBn : existingMapped.descriptionBn,
      driveUrl: updates.driveUrl ?? existingMapped.driveUrl,
      fileType: updates.fileType ?? existingMapped.fileType,
      fileSize: updates.fileSize !== undefined ? updates.fileSize : existingMapped.fileSize,
      isPublished: updates.isPublished ?? existingMapped.isPublished,
      isDemoRecord: updates.isDemoRecord ?? existingMapped.isDemoRecord,
    };

    const validation = validateCloudDocumentPayload(mergedInput);
    if (!validation.valid) {
      throw new Error(`VALIDATION_FAILED: ${validation.errors.join(' ')}`);
    }

    await setDoc(doc(firestore, 'cloudDocuments', documentId), {
      ...buildSanitizedFirestoreBody(mergedInput),
      createdAt: existingRaw.createdAt,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith('VALIDATION_FAILED') || error.message === 'DOCUMENT_NOT_FOUND')
    ) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function publishCloudDocument(documentId: string): Promise<void> {
  const firestore = assertAuthenticatedFirestore();
  if (!SAFE_DOC_ID_REGEX.test(documentId) || documentId.length > 128) {
    throw new Error('INVALID_DOCUMENT_ID');
  }

  const path = `cloudDocuments/${documentId}`;
  try {
    await updateDoc(doc(firestore, 'cloudDocuments', documentId), {
      isPublished: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function unpublishCloudDocument(documentId: string): Promise<void> {
  const firestore = assertAuthenticatedFirestore();
  if (!SAFE_DOC_ID_REGEX.test(documentId) || documentId.length > 128) {
    throw new Error('INVALID_DOCUMENT_ID');
  }

  const path = `cloudDocuments/${documentId}`;
  try {
    await updateDoc(doc(firestore, 'cloudDocuments', documentId), {
      isPublished: false,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCloudDocument(documentId: string): Promise<void> {
  const firestore = assertAuthenticatedFirestore();
  if (!SAFE_DOC_ID_REGEX.test(documentId) || documentId.length > 128) {
    throw new Error('INVALID_DOCUMENT_ID');
  }

  const path = `cloudDocuments/${documentId}`;
  try {
    await deleteDoc(doc(firestore, 'cloudDocuments', documentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchAllCloudDocumentsForAdmin(): Promise<CloudDocumentRecord[]> {
  const firestore = assertAuthenticatedFirestore();
  try {
    const snap = await getDocs(collection(firestore, 'cloudDocuments'));
    return snap.docs
      .map((d) => mapFirestoreCloudDoc(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'cloudDocuments');
  }
}
