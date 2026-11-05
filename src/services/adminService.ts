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
  AdminDashboardStats,
  AdminRole,
  AdminUserProfile,
  AuthorizedTeacherAccount,
  ContactMessageRecord,
  HolidayRecord,
  HolidayType,
  SchoolOperationalSettings,
  TeacherAccessRequestRecord,
  TeacherPortalRole,
} from '../types/admin';
import { TeacherMarkSubmissionRecord } from '../types/teacher';
import {
  AdminLeader,
  BannerItem,
  FacilityItem,
  GalleryPhoto,
  GoverningMember,
  NewsEventItem,
  NoticeItem,
  SiteContentBlock,
  SiteSetting,
  StaffProfile,
  TeacherProfile,
} from '../types/school';
import { StudentRecord, SupportedClassCode } from '../types/result';
import {
  VERIFIED_ADMINISTRATION,
  VERIFIED_BANNERS,
  VERIFIED_FACILITIES,
  VERIFIED_GALLERY,
  VERIFIED_GOVERNING_BODY,
  VERIFIED_NEWS_EVENTS,
  VERIFIED_NOTICES,
  VERIFIED_SITE_SETTINGS,
  VERIFIED_STAFF,
  VERIFIED_TEACHERS,
} from '../data/verifiedSchoolData';
import { SUPPORTED_RESULT_CLASSES } from '../data/resultPortalSeedData';
import { DEMO_CLOUD_DOCUMENTS } from '../data/cloudCenterSeedData';
import {
  DEFAULT_PUBLIC_HOLIDAYS,
  DEFAULT_SITE_CONTENT_BLOCKS,
} from './publicContentService';
import {
  isValidCanonicalRoll,
  normalizeRollNumber,
} from './resultCalculationEngine';
import { recordActivityLog } from './activityLogService';

const SAFE_ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
const HTTPS_URL_REGEX = /^https:\/\/[^\s]+$/i;
const VALID_IMAGE_URL_REGEX = /^https:\/\/[^\s]+$/i;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function assertAuthenticatedDb() {
  if (!isFirebaseConfigured || !db) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  if (!auth?.currentUser) {
    throw new Error('ADMIN_AUTHENTICATION_REQUIRED');
  }
  return db;
}

function makeDocId(prefix: string, customId?: string): string {
  if (customId && customId.trim()) {
    const clean = customId.trim();
    if (!SAFE_ID_REGEX.test(clean) || clean.length > 128) {
      throw new Error('INVALID_DOCUMENT_ID');
    }
    return clean;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function tsToIso(val: unknown): string {
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as Timestamp).toDate === 'function') {
    return (val as Timestamp).toDate().toISOString();
  }
  if (typeof val === 'string' && val.trim()) return val;
  return new Date().toISOString();
}

// ============================================================================
// 1. ADMIN USERS & ROLE MANAGEMENT (RBAC)
// ============================================================================

export async function fetchAdminUserProfile(uid: string): Promise<AdminUserProfile | null> {
  if (!isFirebaseConfigured || !db) return null;
  const path = `adminUsers/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'adminUsers', uid));
    if (!snap.exists()) return null;
    const raw = snap.data() as Record<string, unknown>;
    return {
      uid: snap.id,
      email: String(raw.email || ''),
      displayName: String(raw.displayName || ''),
      role: (raw.role as AdminRole) || 'admin',
      isActive: raw.isActive !== false,
      createdAtIso: tsToIso(raw.createdAt),
      updatedAtIso: tsToIso(raw.updatedAt),
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
      return null;
    }
    console.warn('Admin profile lookup note:', path, error);
    return null;
  }
}

export async function bootstrapInitialSuperAdmin(
  idToken: string,
  displayName?: string
): Promise<AdminUserProfile> {
  const firestore = assertAuthenticatedDb();
  const currentUser = auth!.currentUser!;

  // Verify token server-side via /api/admin/verify-bootstrap
  const res = await fetch('/api/admin/verify-bootstrap', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  });

  const payload = (await res.json().catch(() => ({}))) as {
    eligible?: boolean;
    reason?: string;
    email?: string;
    displayName?: string;
  };

  if (!res.ok || !payload.eligible) {
    throw new Error(
      payload.reason ||
        'This account is not eligible for initial Super Admin provisioning. Verify your institutional email or ask an existing Super Admin to grant access.'
    );
  }

  const finalEmail = (currentUser.email || payload.email || '').trim().toLowerCase();
  const finalName = (
    displayName?.trim() ||
    currentUser.displayName?.trim() ||
    payload.displayName?.trim() ||
    finalEmail.split('@')[0] ||
    'Super Administrator'
  ).slice(0, 120);

  const path = `adminUsers/${currentUser.uid}`;
  try {
    await setDoc(doc(firestore, 'adminUsers', currentUser.uid), {
      uid: currentUser.uid,
      email: finalEmail.slice(0, 160),
      displayName: finalName,
      role: 'super_admin' as AdminRole,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await recordActivityLog({
      actionType: 'admin_bootstrapped',
      targetCollection: 'adminUsers',
      targetId: currentUser.uid,
      summary: `Provisioned Super Admin account for ${finalEmail}`,
      actorRole: 'super_admin',
    });

    const nowIso = new Date().toISOString();
    return {
      uid: currentUser.uid,
      email: finalEmail,
      displayName: finalName,
      role: 'super_admin',
      isActive: true,
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchAllAdminUsers(): Promise<AdminUserProfile[]> {
  const firestore = assertAuthenticatedDb();
  try {
    const snap = await getDocs(collection(firestore, 'adminUsers'));
    return snap.docs
      .map((d) => {
        const raw = d.data() as Record<string, unknown>;
        return {
          uid: d.id,
          email: String(raw.email || ''),
          displayName: String(raw.displayName || ''),
          role: (raw.role as AdminRole) || 'admin',
          isActive: raw.isActive !== false,
          createdAtIso: tsToIso(raw.createdAt),
          updatedAtIso: tsToIso(raw.updatedAt),
        } satisfies AdminUserProfile;
      })
      .sort((a, b) => a.email.localeCompare(b.email));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'adminUsers');
  }
}

export async function upsertAdminUserRole(
  targetUid: string,
  input: {
    email: string;
    displayName: string;
    role: AdminRole;
    isActive: boolean;
  },
  actorRole: AdminRole
): Promise<void> {
  if (actorRole !== 'super_admin') {
    throw new Error('SUPER_ADMIN_REQUIRED');
  }
  const firestore = assertAuthenticatedDb();
  const cleanUid = targetUid.trim();
  if (!cleanUid || cleanUid.length > 128 || !SAFE_ID_REGEX.test(cleanUid)) {
    throw new Error('INVALID_ADMIN_UID');
  }

  const path = `adminUsers/${cleanUid}`;
  try {
    const existing = await getDoc(doc(firestore, 'adminUsers', cleanUid));
    await setDoc(doc(firestore, 'adminUsers', cleanUid), {
      uid: cleanUid,
      email: input.email.trim().toLowerCase().slice(0, 160),
      displayName: input.displayName.trim().slice(0, 120),
      role: input.role,
      isActive: Boolean(input.isActive),
      createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await recordActivityLog({
      actionType: 'role_updated',
      targetCollection: 'adminUsers',
      targetId: cleanUid,
      summary: `Assigned role "${input.role}" (${input.isActive ? 'active' : 'inactive'}) to ${input.email}`,
      actorRole,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ============================================================================
// 2. ADMIN DASHBOARD LIVE STATISTICS
// ============================================================================

export async function fetchLiveAdminDashboardStats(): Promise<AdminDashboardStats> {
  const firestore = assertAuthenticatedDb();

  const safeDocs = async (colName: string) => {
    try {
      const snap = await getDocs(collection(firestore, colName));
      return snap.docs;
    } catch {
      return [];
    }
  };

  const [
    studentDocs,
    teacherDocs,
    cloudDocs,
    resultDocs,
    noticeDocs,
    teacherReqDocs,
    contactDocs,
    holidayDocs,
  ] = await Promise.all([
    safeDocs('students'),
    safeDocs('teachers'),
    safeDocs('cloudDocuments'),
    safeDocs('results'),
    safeDocs('notices'),
    safeDocs('teacherAccessRequests'),
    safeDocs('contactMessages'),
    safeDocs('holidays'),
  ]);

  const totalTeachers =
    teacherDocs.length > 0
      ? teacherDocs.filter((d) => d.data().isActive !== false).length
      : VERIFIED_TEACHERS.length;

  const publishedCloudDocs =
    cloudDocs.length > 0
      ? cloudDocs.filter((d) => d.data().isPublished === true).length
      : DEMO_CLOUD_DOCUMENTS.filter((d) => d.isPublished).length;

  const draftCloudDocs =
    cloudDocs.length > 0
      ? cloudDocs.filter((d) => d.data().isPublished !== true).length
      : DEMO_CLOUD_DOCUMENTS.filter((d) => !d.isPublished).length;

  const publishedResults = resultDocs.filter((d) => d.data().isPublished === true).length;
  const pendingResultApprovals = resultDocs.filter(
    (d) => d.data().workflowStatus === 'submitted'
  ).length;

  const publishedNotices =
    noticeDocs.length > 0
      ? noticeDocs.filter((d) => d.data().isPublished === true).length
      : VERIFIED_NOTICES.length;

  const pendingTeacherApprovals = teacherReqDocs.filter(
    (d) => d.data().status === 'pending'
  ).length;

  const unreadContactMessages = contactDocs.filter((d) => d.data().status === 'new').length;

  const publishedHolidays =
    holidayDocs.length > 0
      ? holidayDocs.filter((d) => d.data().isPublished === true).length
      : DEFAULT_PUBLIC_HOLIDAYS.length;

  return {
    totalStudents: studentDocs.filter((d) => d.data().isActive !== false).length,
    totalTeachers,
    publishedCloudDocs,
    draftCloudDocs,
    publishedResults,
    pendingResultApprovals,
    publishedNotices,
    pendingTeacherApprovals,
    unreadContactMessages,
    publishedHolidays,
    dataSource:
      teacherDocs.length > 0 && cloudDocs.length > 0 && noticeDocs.length > 0
        ? 'firestore'
        : 'hybrid',
  };
}

// ============================================================================
// 3. WEBSITE CONTENT, BANNERS, ADMINISTRATION, GOVERNING BODY, FACILITIES & SETTINGS
// ============================================================================

async function fetchCollectionWithFallback<T extends { id: string }>(
  colName: string,
  fallback: T[]
): Promise<{ items: T[]; fromFirestore: boolean }> {
  const firestore = assertAuthenticatedDb();
  try {
    const snap = await getDocs(collection(firestore, colName));
    if (snap.empty) {
      return { items: fallback, fromFirestore: false };
    }
    const items = snap.docs.map(
      (d) => ({ ...(d.data() as Omit<T, 'id'>), id: d.id }) as T
    );
    return { items, fromFirestore: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colName);
  }
}

export async function fetchSiteContentBlocksForAdmin() {
  return fetchCollectionWithFallback<SiteContentBlock>('siteContent', DEFAULT_SITE_CONTENT_BLOCKS);
}

export async function saveSiteContentBlock(
  block: SiteContentBlock,
  actorRole: AdminRole
): Promise<void> {
  const firestore = assertAuthenticatedDb();
  const id = makeDocId('sc', block.id);
  const path = `siteContent/${id}`;
  try {
    await setDoc(doc(firestore, 'siteContent', id), {
      sectionKey: block.sectionKey.trim().slice(0, 80),
      titleEn: block.titleEn.trim().slice(0, 240),
      titleBn: block.titleBn.trim().slice(0, 240),
      bodyEn: block.bodyEn.trim().slice(0, 4000),
      bodyBn: block.bodyBn.trim().slice(0, 4000),
      isPublished: Boolean(block.isPublished),
      updatedAt: serverTimestamp(),
    });
    await recordActivityLog({
      actionType: 'website_content_updated',
      targetCollection: 'siteContent',
      targetId: id,
      summary: `Updated website content block "${block.sectionKey}"`,
      actorRole,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchBannersForAdmin() {
  const res = await fetchCollectionWithFallback<BannerItem>('banners', VERIFIED_BANNERS);
  return { ...res, items: [...res.items].sort((a, b) => a.order - b.order) };
}

export async function saveBannerItem(banner: BannerItem, actorRole: AdminRole): Promise<string> {
  const firestore = assertAuthenticatedDb();
  const cleanImg = banner.imageUrl.trim();
  if (!cleanImg.startsWith('/') && !VALID_IMAGE_URL_REGEX.test(cleanImg)) {
    throw new Error('A valid HTTPS or campus asset image URL is required for hero banners.');
  }
  const id = makeDocId('bnr', banner.id);
  const path = `banners/${id}`;
  try {
    await setDoc(doc(firestore, 'banners', id), {
      titleBn: banner.titleBn.trim().slice(0, 200),
      titleEn: banner.titleEn.trim().slice(0, 200),
      subtitleBn: banner.subtitleBn.trim().slice(0, 400),
      subtitleEn: banner.subtitleEn.trim().slice(0, 400),
      imageUrl: cleanImg.slice(0, 600),
      order: Number(banner.order) || 1,
      isPublished: Boolean(banner.isPublished),
      updatedAt: serverTimestamp(),
    });
    await recordActivityLog({
      actionType: 'website_content_updated',
      targetCollection: 'banners',
      targetId: id,
      summary: `Saved hero banner "${banner.titleEn}"`,
      actorRole,
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBannerItem(bannerId: string, actorRole: AdminRole): Promise<void> {
  const firestore = assertAuthenticatedDb();
  const path = `banners/${bannerId}`;
  try {
    await deleteDoc(doc(firestore, 'banners', bannerId));
    await recordActivityLog({
      actionType: 'website_content_updated',
      targetCollection: 'banners',
      targetId: bannerId,
      summary: `Deleted hero banner ${bannerId}`,
      actorRole,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchAdministrationForAdmin() {
  const res = await fetchCollectionWithFallback<AdminLeader>(
    'administration',
    VERIFIED_ADMINISTRATION
  );
  return { ...res, items: [...res.items].sort((a, b) => a.order - b.order) };
}

export async function saveAdminLeader(leader: AdminLeader, actorRole: AdminRole): Promise<string> {
  const firestore = assertAuthenticatedDb();
  const id = makeDocId('adm', leader.id);
  const path = `administration/${id}`;
  try {
    await setDoc(doc(firestore, 'administration', id), {
      roleKey: leader.roleKey,
      name: leader.name.trim().slice(0, 160),
      nameBn: leader.nameBn.trim().slice(0, 160),
      ...(leader.credentials ? { credentials: leader.credentials.trim().slice(0, 160) } : {}),
      designationBn: leader.designationBn.trim().slice(0, 200),
      designationEn: leader.designationEn.trim().slice(0, 200),
      organizationBn: leader.organizationBn.trim().slice(0, 200),
      organizationEn: leader.organizationEn.trim().slice(0, 200),
      photoUrl: leader.photoUrl.trim().slice(0, 600),
      messageBn: leader.messageBn.trim().slice(0, 4000),
      messageEn: leader.messageEn.trim().slice(0, 4000),
      ...(leader.phone ? { phone: leader.phone.trim().slice(0, 40) } : {}),
      ...(leader.email ? { email: leader.email.trim().slice(0, 160) } : {}),
      order: Number(leader.order) || 1,
      isPublished: Boolean(leader.isPublished),
      updatedAt: serverTimestamp(),
    });
    await recordActivityLog({
      actionType: 'website_content_updated',
      targetCollection: 'administration',
      targetId: id,
      summary: `Updated administration leader "${leader.name}" (${leader.roleKey})`,
      actorRole,
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchGoverningBodyForAdmin() {
  const res = await fetchCollectionWithFallback<GoverningMember>(
    'governingBody',
    VERIFIED_GOVERNING_BODY
  );
  return { ...res, items: [...res.items].sort((a, b) => a.order - b.order) };
}

export async function saveGoverningMember(
  member: GoverningMember,
  actorRole: AdminRole
): Promise<string> {
  const firestore = assertAuthenticatedDb();
  const id = makeDocId('gov', member.id);
  const path = `governingBody/${id}`;
  try {
    await setDoc(doc(firestore, 'governingBody', id), {
      name: member.name.trim().slice(0, 160),
      nameBn: member.nameBn.trim().slice(0, 160),
      boardRoleBn: member.boardRoleBn.trim().slice(0, 160),
      boardRoleEn: member.boardRoleEn.trim().slice(0, 160),
      designationBn: member.designationBn.trim().slice(0, 240),
      designationEn: member.designationEn.trim().slice(0, 240),
      photoUrl: member.photoUrl ? member.photoUrl.trim().slice(0, 600) : '',
      ...(member.photoMissingNote
        ? { photoMissingNote: member.photoMissingNote.trim().slice(0, 200) }
        : {}),
      order: Number(member.order) || 1,
      isPublished: Boolean(member.isPublished),
      updatedAt: serverTimestamp(),
    });
    await recordActivityLog({
      actionType: 'website_content_updated',
      targetCollection: 'governingBody',
      targetId: id,
      summary: `Updated Governing Body member "${member.name}"`,
      actorRole,
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchFacilitiesForAdmin() {
  const res = await fetchCollectionWithFallback<FacilityItem>('facilities', VERIFIED_FACILITIES);
  return { ...res, items: [...res.items].sort((a, b) => a.order - b.order) };
}

export async function saveFacilityItem(
  facility: FacilityItem,
  actorRole: AdminRole
): Promise<string> {
  const firestore = assertAuthenticatedDb();
  const id = makeDocId('fac', facility.id);
  const path = `facilities/${id}`;
  try {
    await setDoc(doc(firestore, 'facilities', id), {
      titleBn: facility.titleBn.trim().slice(0, 160),
      titleEn: facility.titleEn.trim().slice(0, 160),
      descriptionBn: facility.descriptionBn.trim().slice(0, 1500),
      descriptionEn: facility.descriptionEn.trim().slice(0, 1500),
      highlightsBn: Array.isArray(facility.highlightsBn) ? facility.highlightsBn.slice(0, 10) : [],
      highlightsEn: Array.isArray(facility.highlightsEn) ? facility.highlightsEn.slice(0, 10) : [],
      imageUrl: facility.imageUrl ? facility.imageUrl.trim().slice(0, 600) : '',
      order: Number(facility.order) || 1,
      isPublished: Boolean(facility.isPublished),
      updatedAt: serverTimestamp(),
    });
    await recordActivityLog({
      actionType: 'website_content_updated',
      targetCollection: 'facilities',
      targetId: id,
      summary: `Updated facility "${facility.titleEn}"`,
      actorRole,
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchSiteSettingsForAdmin(): Promise<SiteSetting> {
  const res = await fetchCollectionWithFallback<SiteSetting>('settings', [VERIFIED_SITE_SETTINGS]);
  return res.items[0] || VERIFIED_SITE_SETTINGS;
}

export async function saveSiteSettings(
  setting: SiteSetting,
  actorRole: AdminRole
): Promise<void> {
  const firestore = assertAuthenticatedDb();
  const id = makeDocId('set', setting.id || 'main');
  const path = `settings/${id}`;
  try {
    await setDoc(doc(firestore, 'settings', id), {
      schoolNameBn: setting.schoolNameBn.trim().slice(0, 200),
      schoolNameEn: setting.schoolNameEn.trim().slice(0, 200),
      shortName: (setting.shortName || 'BPSC').trim().slice(0, 40),
      eiin: setting.eiin.trim().slice(0, 30),
      establishedYear: setting.establishedYear.trim().slice(0, 20),
      inauguratedDateBn: setting.inauguratedDateBn.trim().slice(0, 120),
      inauguratedDateEn: setting.inauguratedDateEn.trim().slice(0, 120),
      addressBn: setting.addressBn.trim().slice(0, 260),
      addressEn: setting.addressEn.trim().slice(0, 260),
      phonePrimary: setting.phonePrimary.trim().slice(0, 40),
      phoneSecondary: setting.phoneSecondary.trim().slice(0, 40),
      emailPrimary: setting.emailPrimary.trim().slice(0, 160),
      emailSecondary: setting.emailSecondary.trim().slice(0, 160),
      facebookUrl: setting.facebookUrl.trim().slice(0, 400),
      mapEmbedUrl: setting.mapEmbedUrl.trim().slice(0, 1000),
      totalStudents: String(setting.totalStudents || '').trim().slice(0, 40),
      totalTeachers: Number(setting.totalTeachers) || 0,
      totalStaff: Number(setting.totalStaff) || 0,
      totalClasses: Number(setting.totalClasses) || 11,
      ...(setting.logoUrl ? { logoUrl: setting.logoUrl.trim().slice(0, 600) } : {}),
      ...(setting.youtubeUrl ? { youtubeUrl: setting.youtubeUrl.trim().slice(0, 400) } : {}),
      ...(setting.linkedinUrl ? { linkedinUrl: setting.linkedinUrl.trim().slice(0, 400) } : {}),
      ...(setting.footerTaglineEn
        ? { footerTaglineEn: setting.footerTaglineEn.trim().slice(0, 300) }
        : {}),
      ...(setting.footerTaglineBn
        ? { footerTaglineBn: setting.footerTaglineBn.trim().slice(0, 300) }
        : {}),
      isPublished: true,
      updatedAt: serverTimestamp(),
    });
    await recordActivityLog({
      actionType: 'settings_changed',
      targetCollection: 'settings',
      targetId: id,
      summary: `Updated institutional contact, branding & site settings`,
      actorRole,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export const DEFAULT_OPERATIONAL_SETTINGS: SchoolOperationalSettings = {
  id: 'operational_main',
  currentAcademicYear: '2026',
  admissionOpen: true,
  resultPortalEnabled: true,
  defaultShowPositionInResults: true,
  requireResultApprovalBeforePublish: true,
  cloudCenterEnabled: true,
  cloudItemsPerPage: 12,
  maintenanceBannerTextEn: '',
  maintenanceBannerTextBn: '',
  updatedAtIso: new Date().toISOString(),
};

export async function fetchOperationalSettings(): Promise<SchoolOperationalSettings> {
  const firestore = assertAuthenticatedDb();
  try {
    const snap = await getDoc(doc(firestore, 'schoolSettings', 'operational_main'));
    if (!snap.exists()) return DEFAULT_OPERATIONAL_SETTINGS;
    const raw = snap.data() as Record<string, unknown>;
    return {
      id: snap.id,
      currentAcademicYear: String(raw.currentAcademicYear || '2026'),
      admissionOpen: raw.admissionOpen !== false,
      resultPortalEnabled: raw.resultPortalEnabled !== false,
      defaultShowPositionInResults: raw.defaultShowPositionInResults !== false,
      requireResultApprovalBeforePublish: raw.requireResultApprovalBeforePublish !== false,
      cloudCenterEnabled: raw.cloudCenterEnabled !== false,
      cloudItemsPerPage: Number(raw.cloudItemsPerPage) || 12,
      maintenanceBannerTextEn: String(raw.maintenanceBannerTextEn || ''),
      maintenanceBannerTextBn: String(raw.maintenanceBannerTextBn || ''),
      updatedAtIso: tsToIso(raw.updatedAt),
    };
  } catch {
    return DEFAULT_OPERATIONAL_SETTINGS;
  }
}

export async function saveOperationalSettings(
  input: Omit<SchoolOperationalSettings, 'id' | 'updatedAtIso'>,
  actorRole: AdminRole
): Promise<void> {
  const firestore = assertAuthenticatedDb();
  const path = 'schoolSettings/operational_main';
  try {
    await setDoc(doc(firestore, 'schoolSettings', 'operational_main'), {
      currentAcademicYear: input.currentAcademicYear.trim().slice(0, 20),
      admissionOpen: Boolean(input.admissionOpen),
      resultPortalEnabled: Boolean(input.resultPortalEnabled),
      defaultShowPositionInResults: Boolean(input.defaultShowPositionInResults),
      requireResultApprovalBeforePublish: Boolean(input.requireResultApprovalBeforePublish),
      cloudCenterEnabled: Boolean(input.cloudCenterEnabled),
      cloudItemsPerPage: Math.min(48, Math.max(6, Number(input.cloudItemsPerPage) || 12)),
      maintenanceBannerTextEn: input.maintenanceBannerTextEn.trim().slice(0, 300),
      maintenanceBannerTextBn: input.maintenanceBannerTextBn.trim().slice(0, 300),
      updatedAt: serverTimestamp(),
    });
    await recordActivityLog({
      actionType: 'settings_changed',
      targetCollection: 'schoolSettings',
      targetId: 'operational_main',
      summary: `Updated operational school preferences (Academic Year ${input.currentAcademicYear})`,
      actorRole,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ============================================================================
// 4. TEACHERS & STAFF DIRECTORY MANAGEMENT (`teachers`, `staff`)
// ============================================================================

export async function fetchTeachersForAdmin() {
  const res = await fetchCollectionWithFallback<TeacherProfile>('teachers', VERIFIED_TEACHERS);
  return { ...res, items: [...res.items].sort((a, b) => a.serial - b.serial) };
}

export async function saveTeacherProfile(
  teacher: TeacherProfile,
  actorRole: AdminRole
): Promise<string> {
  const firestore = assertAuthenticatedDb();
  const id = makeDocId('tch', teacher.id);
  const path = `teachers/${id}`;
  try {
    await setDoc(doc(firestore, 'teachers', id), {
      serial: Number(teacher.serial) || 1,
      name: teacher.name.trim().slice(0, 160),
      nameBn: teacher.nameBn.trim().slice(0, 160),
      designationBn: teacher.designationBn.trim().slice(0, 160),
      designationEn: teacher.designationEn.trim().slice(0, 160),
      department: teacher.department,
      departmentBn: teacher.departmentBn.trim().slice(0, 160),
      subjectBn: teacher.subjectBn.trim().slice(0, 160),
      subjectEn: teacher.subjectEn.trim().slice(0, 160),
      qualification: teacher.qualification ? teacher.qualification.trim().slice(0, 200) : '',
      publicPhone: teacher.publicPhone ? teacher.publicPhone.trim().slice(0, 40) : '',
      publicEmail: teacher.publicEmail ? teacher.publicEmail.trim().slice(0, 160) : '',
      photoUrl: teacher.photoUrl.trim().slice(0, 600),
      assignedClass: teacher.assignedClass ? teacher.assignedClass.trim().slice(0, 60) : '',
      assignedSection: teacher.assignedSection ? teacher.assignedSection.trim().slice(0, 40) : '',
      ...(teacher.coordinatorRoleBn
        ? { coordinatorRoleBn: teacher.coordinatorRoleBn.trim().slice(0, 160) }
        : {}),
      ...(teacher.coordinatorRoleEn
        ? { coordinatorRoleEn: teacher.coordinatorRoleEn.trim().slice(0, 160) }
        : {}),
      employmentStatus: teacher.employmentStatus || 'active',
      isActive: teacher.isActive !== false && teacher.employmentStatus !== 'inactive',
      isPublished: Boolean(teacher.isPublished),
      updatedAt: serverTimestamp(),
    });
    await recordActivityLog({
      actionType: 'teacher_updated',
      targetCollection: 'teachers',
      targetId: id,
      summary: `Saved teacher profile "${teacher.name}" (${teacher.designationEn})`,
      actorRole,
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteTeacherProfile(teacherId: string, actorRole: AdminRole): Promise<void> {
  const firestore = assertAuthenticatedDb();
  const path = `teachers/${teacherId}`;
  try {
    await deleteDoc(doc(firestore, 'teachers', teacherId));
    await recordActivityLog({
      actionType: 'teacher_updated',
      targetCollection: 'teachers',
      targetId: teacherId,
      summary: `Removed teacher record ${teacherId}`,
      actorRole,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchStaffForAdmin() {
  const res = await fetchCollectionWithFallback<StaffProfile>('staff', VERIFIED_STAFF);
  return { ...res, items: [...res.items].sort((a, b) => a.serial - b.serial) };
}

export async function saveStaffProfile(
  staffItem: StaffProfile,
  actorRole: AdminRole
): Promise<string> {
  const firestore = assertAuthenticatedDb();
  const id = makeDocId('stf', staffItem.id);
  const path = `staff/${id}`;
  try {
    await setDoc(doc(firestore, 'staff', id), {
      serial: Number(staffItem.serial) || 1,
      name: staffItem.name.trim().slice(0, 160),
      nameBn: staffItem.nameBn.trim().slice(0, 160),
      designationBn: staffItem.designationBn.trim().slice(0, 160),
      designationEn: staffItem.designationEn.trim().slice(0, 160),
      publicPhone: staffItem.publicPhone ? staffItem.publicPhone.trim().slice(0, 40) : '',
      publicEmail: staffItem.publicEmail ? staffItem.publicEmail.trim().slice(0, 160) : '',
      photoUrl: staffItem.photoUrl ? staffItem.photoUrl.trim().slice(0, 600) : '',
      employmentStatus: staffItem.employmentStatus || 'active',
      isActive: staffItem.isActive !== false && staffItem.employmentStatus !== 'inactive',
      isPublished: Boolean(staffItem.isPublished),
      updatedAt: serverTimestamp(),
    });
    await recordActivityLog({
      actionType: 'teacher_updated',
      targetCollection: 'staff',
      targetId: id,
      summary: `Saved staff profile "${staffItem.name}"`,
      actorRole,
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteStaffProfile(staffId: string, actorRole: AdminRole): Promise<void> {
  const firestore = assertAuthenticatedDb();
  const path = `staff/${staffId}`;
  try {
    await deleteDoc(doc(firestore, 'staff', staffId));
    await recordActivityLog({
      actionType: 'teacher_updated',
      targetCollection: 'staff',
      targetId: staffId,
      summary: `Removed staff record ${staffId}`,
      actorRole,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// 5. STUDENT REGISTRY & VALIDATED BULK CSV IMPORT (`students`)
// ============================================================================

export async function fetchStudentsForAdmin(filters?: {
  academicYearId?: string;
  classCode?: SupportedClassCode | 'ALL';
}): Promise<StudentRecord[]> {
  const firestore = assertAuthenticatedDb();
  try {
    const snap = await getDocs(collection(firestore, 'students'));
    let list = snap.docs.map(
      (d) => ({ ...(d.data() as Omit<StudentRecord, 'id'>), id: d.id }) as StudentRecord
    );
    if (filters?.academicYearId && filters.academicYearId !== 'ALL') {
      list = list.filter((s) => s.academicYearId === filters.academicYearId);
    }
    if (filters?.classCode && filters.classCode !== 'ALL') {
      list = list.filter((s) => s.classCode === filters.classCode);
    }
    return list.sort((a, b) => {
      if (a.classCode !== b.classCode) return a.classCode.localeCompare(b.classCode);
      return Number(a.rollNumber) - Number(b.rollNumber);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'students');
  }
}

export async function upsertStudentFromAdmin(
  student: Omit<StudentRecord, 'id'> & { id?: string },
  actorRole: AdminRole,
  allowOverwriteExistingId = false
): Promise<string> {
  const firestore = assertAuthenticatedDb();
  const canonicalRoll = normalizeRollNumber(student.rollNumber);
  if (!isValidCanonicalRoll(canonicalRoll)) {
    throw new Error('Roll number must contain digits only (e.g., 101).');
  }
  if (!SUPPORTED_RESULT_CLASSES.some((c) => c.classCode === student.classCode)) {
    throw new Error('Unsupported class selection.');
  }
  if (!student.fullNameEn || student.fullNameEn.trim().length < 2) {
    throw new Error('Student English name is required (at least 2 characters).');
  }

  const sectionClean = student.section ? student.section.trim() : '';
  const idSuffix = sectionClean ? `_${sectionClean.replace(/[^a-zA-Z0-9]/g, '')}` : '';
  const deterministicId = `${student.academicYearId.trim()}_${student.classCode}${idSuffix}_${canonicalRoll}`;
  const targetId = student.id?.trim() || deterministicId;

  // Duplicate roll number prevention within the same Academic Year + Class + Section
  const dupQuery = query(
    collection(firestore, 'students'),
    where('academicYearId', '==', student.academicYearId.trim()),
    where('classCode', '==', student.classCode),
    where('rollNumber', '==', canonicalRoll)
  );
  const dupSnap = await getDocs(dupQuery);
  const conflictingDoc = dupSnap.docs.find((d) => {
    if (allowOverwriteExistingId && d.id === targetId) return false;
    const existingSec = String(d.data().section || '').trim().toLowerCase();
    const incomingSec = sectionClean.toLowerCase();
    return existingSec === incomingSec;
  });

  if (conflictingDoc) {
    throw new Error(
      `Duplicate roll number prevented: Roll ${canonicalRoll} already exists in ${student.classCode}${
        sectionClean ? ` (Section ${sectionClean})` : ''
      } for Academic Year ${student.academicYearId}.`
    );
  }

  const path = `students/${targetId}`;
  try {
    await setDoc(doc(firestore, 'students', targetId), {
      ...(student.studentCode ? { studentCode: student.studentCode.trim().slice(0, 60) } : {}),
      academicYearId: student.academicYearId.trim(),
      classCode: student.classCode,
      rollNumber: canonicalRoll,
      fullNameEn: student.fullNameEn.trim().slice(0, 160),
      ...(student.fullNameBn ? { fullNameBn: student.fullNameBn.trim().slice(0, 160) } : {}),
      ...(sectionClean ? { section: sectionClean.slice(0, 40) } : {}),
      ...(student.groupNameEn ? { groupNameEn: student.groupNameEn.trim().slice(0, 60) } : {}),
      ...(student.groupNameBn ? { groupNameBn: student.groupNameBn.trim().slice(0, 60) } : {}),
      ...(student.guardianName ? { guardianName: student.guardianName.trim().slice(0, 160) } : {}),
      ...(student.guardianPhone ? { guardianPhone: student.guardianPhone.trim().slice(0, 30) } : {}),
      isActive: Boolean(student.isActive),
      updatedAt: serverTimestamp(),
    });

    await recordActivityLog({
      actionType: 'student_updated',
      targetCollection: 'students',
      targetId,
      summary: `Saved student "${student.fullNameEn}" (Roll ${canonicalRoll}, ${student.classCode})`,
      actorRole,
    });
    return targetId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface CsvStudentValidationRow {
  rowNumber: number;
  rawLine: string;
  student: StudentRecord | null;
  errors: string[];
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeClassCodeInput(raw: string): SupportedClassCode | null {
  const clean = raw.trim().toLowerCase().replace(/\s+/g, '-');
  const direct = SUPPORTED_RESULT_CLASSES.find(
    (c) => c.classCode === clean || c.nameEn.toLowerCase() === raw.trim().toLowerCase()
  );
  if (direct) return direct.classCode;
  if (/^\d+$/.test(clean)) {
    const numericMatch = SUPPORTED_RESULT_CLASSES.find((c) => c.classCode === `class-${clean}`);
    if (numericMatch) return numericMatch.classCode;
  }
  return null;
}

/**
 * Validates CSV rows before saving to Firestore.
 * Expected columns:
 * academicYear,classCode,rollNumber,fullNameEn,fullNameBn,section,groupNameEn,studentCode,guardianName,guardianPhone
 */
export function parseAndValidateStudentCsv(
  csvText: string,
  existingStudents: StudentRecord[]
): {
  validRows: StudentRecord[];
  invalidRows: CsvStudentValidationRow[];
  allRows: CsvStudentValidationRow[];
} {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { validRows: [], invalidRows: [], allRows: [] };
  }

  const firstCells = splitCsvLine(lines[0]).map((c) => c.toLowerCase());
  const hasHeader =
    firstCells.includes('rollnumber') ||
    firstCells.includes('roll') ||
    firstCells.includes('fullnameen') ||
    firstCells.includes('classcode') ||
    firstCells.includes('class');

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const seenKeysInBatch = new Set<string>();
  const existingKeys = new Set(
    existingStudents.map(
      (s) =>
        `${s.academicYearId}_${s.classCode}_${normalizeRollNumber(s.rollNumber)}_${(
          s.section || ''
        )
          .trim()
          .toLowerCase()}`
    )
  );

  const allRows: CsvStudentValidationRow[] = [];
  const validRows: StudentRecord[] = [];
  const invalidRows: CsvStudentValidationRow[] = [];

  dataLines.forEach((line, idx) => {
    const rowNumber = hasHeader ? idx + 2 : idx + 1;
    const cols = splitCsvLine(line);
    const errors: string[] = [];

    const academicYearId = (cols[0] || '').trim();
    const rawClass = (cols[1] || '').trim();
    const rawRoll = (cols[2] || '').trim();
    const fullNameEn = (cols[3] || '').trim();
    const fullNameBn = (cols[4] || '').trim();
    const section = (cols[5] || '').trim();
    const groupNameEn = (cols[6] || '').trim();
    const studentCode = (cols[7] || '').trim();
    const guardianName = (cols[8] || '').trim();
    const guardianPhone = (cols[9] || '').trim();

    if (!/^\d{4}$/.test(academicYearId)) {
      errors.push('Invalid academicYear (expected 4-digit year such as 2026).');
    }

    const classCode = normalizeClassCodeInput(rawClass);
    if (!classCode) {
      errors.push(`Invalid class "${rawClass}" (use Nursery or Class 1 to Class 10).`);
    }

    const canonicalRoll = normalizeRollNumber(rawRoll);
    if (!isValidCanonicalRoll(canonicalRoll)) {
      errors.push(`Invalid rollNumber "${rawRoll}" (digits required).`);
    }

    if (fullNameEn.length < 2 || fullNameEn.length > 160) {
      errors.push('fullNameEn must be 2–160 characters.');
    }

    if (academicYearId && classCode && isValidCanonicalRoll(canonicalRoll)) {
      const uniquenessKey = `${academicYearId}_${classCode}_${canonicalRoll}_${section.toLowerCase()}`;
      if (seenKeysInBatch.has(uniquenessKey)) {
        errors.push(`Duplicate roll ${canonicalRoll} inside this CSV file.`);
      } else {
        seenKeysInBatch.add(uniquenessKey);
      }
      if (existingKeys.has(uniquenessKey)) {
        errors.push(
          `Roll ${canonicalRoll} already exists in ${classCode}${
            section ? ` (${section})` : ''
          } for ${academicYearId}.`
        );
      }
    }

    if (errors.length > 0 || !classCode) {
      const rowObj: CsvStudentValidationRow = {
        rowNumber,
        rawLine: line,
        student: null,
        errors,
      };
      invalidRows.push(rowObj);
      allRows.push(rowObj);
    } else {
      const idSuffix = section ? `_${section.replace(/[^a-zA-Z0-9]/g, '')}` : '';
      const studentObj: StudentRecord = {
        id: `${academicYearId}_${classCode}${idSuffix}_${canonicalRoll}`,
        academicYearId,
        classCode,
        rollNumber: canonicalRoll,
        fullNameEn,
        ...(fullNameBn ? { fullNameBn } : {}),
        ...(section ? { section } : {}),
        ...(groupNameEn ? { groupNameEn } : {}),
        ...(studentCode ? { studentCode } : {}),
        ...(guardianName ? { guardianName } : {}),
        ...(guardianPhone ? { guardianPhone } : {}),
        isActive: true,
      };
      validRows.push(studentObj);
      allRows.push({
        rowNumber,
        rawLine: line,
        student: studentObj,
        errors: [],
      });
    }
  });

  return { validRows, invalidRows, allRows };
}

export async function commitValidatedStudentCsvImport(
  studentsToImport: StudentRecord[],
  actorRole: AdminRole
): Promise<number> {
  if (studentsToImport.length === 0) return 0;
  const firestore = assertAuthenticatedDb();

  let imported = 0;
  for (let i = 0; i < studentsToImport.length; i += 400) {
    const chunk = studentsToImport.slice(i, i + 400);
    const batch = writeBatch(firestore);
    for (const s of chunk) {
      batch.set(doc(firestore, 'students', s.id), {
        ...(s.studentCode ? { studentCode: s.studentCode.slice(0, 60) } : {}),
        academicYearId: s.academicYearId,
        classCode: s.classCode,
        rollNumber: s.rollNumber,
        fullNameEn: s.fullNameEn.slice(0, 160),
        ...(s.fullNameBn ? { fullNameBn: s.fullNameBn.slice(0, 160) } : {}),
        ...(s.section ? { section: s.section.slice(0, 40) } : {}),
        ...(s.groupNameEn ? { groupNameEn: s.groupNameEn.slice(0, 60) } : {}),
        ...(s.guardianName ? { guardianName: s.guardianName.slice(0, 160) } : {}),
        ...(s.guardianPhone ? { guardianPhone: s.guardianPhone.slice(0, 30) } : {}),
        isActive: true,
        updatedAt: serverTimestamp(),
      });
    }
    try {
      await batch.commit();
      imported += chunk.length;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'students');
    }
  }

  await recordActivityLog({
    actionType: 'students_imported',
    targetCollection: 'students',
    targetId: `batch_${imported}`,
    summary: `Bulk imported ${imported} validated student records via CSV`,
    actorRole,
    metadata: { count: imported },
  });

  return imported;
}

// ============================================================================
// 6. NOTICES, NEWS & EVENTS, GALLERY (`notices`, `news`, `gallery`)
// ============================================================================

export async function fetchNoticesForAdmin() {
  const res = await fetchCollectionWithFallback<NoticeItem>('notices', VERIFIED_NOTICES);
  return { ...res, items: [...res.items].sort((a, b) => a.serial - b.serial) };
}

export async function saveNoticeItem(
  notice: NoticeItem,
  actorRole: AdminRole,
  isNew = false
): Promise<string> {
  const firestore = assertAuthenticatedDb();
  if (
    notice.attachmentUrl &&
    !notice.attachmentUrl.trim().startsWith('/') &&
    !HTTPS_URL_REGEX.test(notice.attachmentUrl.trim())
  ) {
    throw new Error('Attachment / Google Drive URL must be a valid HTTPS URL.');
  }
  const id = makeDocId('ntc', notice.id);
  const path = `notices/${id}`;
  try {
    await setDoc(doc(firestore, 'notices', id), {
      serial: Number(notice.serial) || 1,
      titleBn: notice.titleBn.trim().slice(0, 260),
      titleEn: notice.titleEn.trim().slice(0, 260),
      category: notice.category,
      publishDate: notice.publishDate.trim().slice(0, 40),
      year: (notice.year || notice.publishDate.slice(0, 4) || '2026').trim().slice(0, 10),
      summaryBn: notice.summaryBn.trim().slice(0, 1200),
      summaryEn: notice.summaryEn.trim().slice(0, 1200),
      detailsBn: (notice.detailsBn || notice.summaryBn).trim().slice(0, 4000),
      detailsEn: (notice.detailsEn || notice.summaryEn).trim().slice(0, 4000),
      ...(notice.attachmentUrl ? { attachmentUrl: notice.attachmentUrl.trim().slice(0, 600) } : {}),
      ...(notice.attachmentType ? { attachmentType: notice.attachmentType } : {}),
      ...(notice.externalUrl ? { externalUrl: notice.externalUrl.trim().slice(0, 600) } : {}),
      isImportant: Boolean(notice.isImportant),
      isPublished: Boolean(notice.isPublished),
      updatedAt: serverTimestamp(),
    });
    await recordActivityLog({
      actionType: isNew ? 'notice_created' : 'notice_updated',
      targetCollection: 'notices',
      targetId: id,
      summary: `${isNew ? 'Created' : 'Updated'} notice "${notice.titleEn}" (${
        notice.isPublished ? 'Published' : 'Draft'
      })`,
      actorRole,
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteNoticeItem(noticeId: string, actorRole: AdminRole): Promise<void> {
  const firestore = assertAuthenticatedDb();
  const path = `notices/${noticeId}`;
  try {
    await deleteDoc(doc(firestore, 'notices', noticeId));
    await recordActivityLog({
      actionType: 'notice_updated',
      targetCollection: 'notices',
      targetId: noticeId,
      summary: `Deleted notice ${noticeId}`,
      actorRole,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchNewsEventsForAdmin() {
  return fetchCollectionWithFallback<NewsEventItem>('news', VERIFIED_NEWS_EVENTS);
}

export async function saveNewsEventItem(
  item: NewsEventItem,
  actorRole: AdminRole
): Promise<string> {
  const firestore = assertAuthenticatedDb();
  const cleanImg = item.imageUrl.trim();
  if (!cleanImg.startsWith('/') && !VALID_IMAGE_URL_REGEX.test(cleanImg)) {
    throw new Error('A valid HTTPS or campus asset image URL is required for News & Events.');
  }
  const id = makeDocId('news', item.id);
  const path = `news/${id}`;
  try {
    await setDoc(doc(firestore, 'news', id), {
      type: item.type,
      titleBn: item.titleBn.trim().slice(0, 250),
      titleEn: item.titleEn.trim().slice(0, 250),
      publishDate: item.publishDate.trim().slice(0, 80),
      categoryBn: item.categoryBn.trim().slice(0, 100),
      categoryEn: item.categoryEn.trim().slice(0, 100),
      summaryBn: item.summaryBn.trim().slice(0, 1500),
      summaryEn: item.summaryEn.trim().slice(0, 1500),
      detailsBn: (item.detailsBn || item.summaryBn).trim().slice(0, 4000),
      detailsEn: (item.detailsEn || item.summaryEn).trim().slice(0, 4000),
      imageUrl: cleanImg.slice(0, 600),
      ...(item.extraImages && item.extraImages.length > 0
        ? { extraImages: item.extraImages.slice(0, 6) }
        : {}),
      ...(item.attachmentUrl ? { attachmentUrl: item.attachmentUrl.trim().slice(0, 600) } : {}),
      isPublished: Boolean(item.isPublished),
      updatedAt: serverTimestamp(),
    });
    await recordActivityLog({
      actionType: 'news_event_updated',
      targetCollection: 'news',
      targetId: id,
      summary: `Saved ${item.type} "${item.titleEn}" (${item.isPublished ? 'Published' : 'Draft'})`,
      actorRole,
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteNewsEventItem(itemId: string, actorRole: AdminRole): Promise<void> {
  const firestore = assertAuthenticatedDb();
  const path = `news/${itemId}`;
  try {
    await deleteDoc(doc(firestore, 'news', itemId));
    await recordActivityLog({
      actionType: 'news_event_updated',
      targetCollection: 'news',
      targetId: itemId,
      summary: `Deleted news/event item ${itemId}`,
      actorRole,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchGalleryForAdmin() {
  const res = await fetchCollectionWithFallback<GalleryPhoto>('gallery', VERIFIED_GALLERY);
  return { ...res, items: [...res.items].sort((a, b) => a.order - b.order) };
}

export async function saveGalleryPhoto(
  photo: GalleryPhoto,
  actorRole: AdminRole
): Promise<string> {
  const firestore = assertAuthenticatedDb();
  const cleanUrl = photo.imageUrl.trim();
  if (!cleanUrl.startsWith('/') && !VALID_IMAGE_URL_REGEX.test(cleanUrl)) {
    throw new Error('Gallery photo requires a valid HTTPS or campus asset image URL.');
  }
  const id = makeDocId('gal', photo.id);
  const path = `gallery/${id}`;
  try {
    await setDoc(doc(firestore, 'gallery', id), {
      titleBn: photo.titleBn.trim().slice(0, 220),
      titleEn: photo.titleEn.trim().slice(0, 220),
      category: photo.category,
      imageUrl: cleanUrl.slice(0, 600),
      dateLabel: photo.dateLabel.trim().slice(0, 80),
      order: Number(photo.order) || 1,
      isPublished: Boolean(photo.isPublished),
      updatedAt: serverTimestamp(),
    });
    await recordActivityLog({
      actionType: 'gallery_updated',
      targetCollection: 'gallery',
      targetId: id,
      summary: `Saved gallery photograph "${photo.titleEn}" (${photo.category})`,
      actorRole,
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteGalleryPhoto(photoId: string, actorRole: AdminRole): Promise<void> {
  const firestore = assertAuthenticatedDb();
  const path = `gallery/${photoId}`;
  try {
    await deleteDoc(doc(firestore, 'gallery', photoId));
    await recordActivityLog({
      actionType: 'gallery_updated',
      targetCollection: 'gallery',
      targetId: photoId,
      summary: `Deleted gallery photograph ${photoId}`,
      actorRole,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// 7. HOLIDAYS & ACADEMIC CALENDAR MANAGEMENT (`holidays`)
// ============================================================================

export async function fetchHolidaysForAdmin(): Promise<{
  items: HolidayRecord[];
  fromFirestore: boolean;
}> {
  const firestore = assertAuthenticatedDb();
  try {
    const snap = await getDocs(collection(firestore, 'holidays'));
    if (snap.empty) {
      return { items: DEFAULT_PUBLIC_HOLIDAYS, fromFirestore: false };
    }
    const items = snap.docs
      .map((d) => {
        const raw = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          titleEn: String(raw.titleEn || ''),
          titleBn: String(raw.titleBn || ''),
          descriptionEn: String(raw.descriptionEn || ''),
          descriptionBn: String(raw.descriptionBn || ''),
          isMultiDay: Boolean(raw.isMultiDay),
          startDate: String(raw.startDate || ''),
          endDate: String(raw.endDate || raw.startDate || ''),
          holidayType: (raw.holidayType as HolidayType) || 'institutional',
          applicableClass: String(raw.applicableClass || 'ALL'),
          academicYear: String(raw.academicYear || '2026'),
          driveUrl: typeof raw.driveUrl === 'string' && raw.driveUrl.trim() ? raw.driveUrl : null,
          isPublished: raw.isPublished === true,
          createdAtIso: tsToIso(raw.createdAt),
          updatedAtIso: tsToIso(raw.updatedAt),
        } satisfies HolidayRecord;
      })
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
    return { items, fromFirestore: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'holidays');
  }
}

export async function saveHolidayRecord(
  input: Omit<HolidayRecord, 'id' | 'createdAtIso' | 'updatedAtIso'> & { id?: string },
  actorRole: AdminRole
): Promise<string> {
  const firestore = assertAuthenticatedDb();
  if (!ISO_DATE_REGEX.test(input.startDate)) {
    throw new Error('Start date must be in YYYY-MM-DD format.');
  }
  const finalEndDate = input.isMultiDay ? input.endDate : input.startDate;
  if (!ISO_DATE_REGEX.test(finalEndDate) || finalEndDate < input.startDate) {
    throw new Error('End date must be on or after the start date.');
  }
  if (!input.titleEn.trim()) {
    throw new Error('Holiday title is required.');
  }

  const id = makeDocId('hol', input.id);
  const path = `holidays/${id}`;
  try {
    const existing = await getDoc(doc(firestore, 'holidays', id));
    await setDoc(doc(firestore, 'holidays', id), {
      titleEn: input.titleEn.trim().slice(0, 220),
      titleBn: input.titleBn.trim().slice(0, 220),
      descriptionEn: input.descriptionEn.trim().slice(0, 1200),
      descriptionBn: input.descriptionBn.trim().slice(0, 1200),
      isMultiDay: Boolean(input.isMultiDay),
      startDate: input.startDate,
      endDate: finalEndDate,
      holidayType: input.holidayType,
      applicableClass: (input.applicableClass || 'ALL').trim().slice(0, 40),
      academicYear: (input.academicYear || '2026').trim().slice(0, 20),
      driveUrl: input.driveUrl && input.driveUrl.trim() ? input.driveUrl.trim().slice(0, 600) : null,
      isPublished: Boolean(input.isPublished),
      createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await recordActivityLog({
      actionType: 'holiday_updated',
      targetCollection: 'holidays',
      targetId: id,
      summary: `Saved holiday "${input.titleEn}" (${input.startDate}${
        input.isMultiDay ? ` to ${finalEndDate}` : ''
      })`,
      actorRole,
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteHolidayRecord(holidayId: string, actorRole: AdminRole): Promise<void> {
  const firestore = assertAuthenticatedDb();
  const path = `holidays/${holidayId}`;
  try {
    await deleteDoc(doc(firestore, 'holidays', holidayId));
    await recordActivityLog({
      actionType: 'holiday_updated',
      targetCollection: 'holidays',
      targetId: holidayId,
      summary: `Deleted holiday schedule ${holidayId}`,
      actorRole,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// 8. TEACHER ACCESS & PERMISSIONS MANAGEMENT (PHASE 5 PREPARATION)
// ============================================================================

export async function fetchTeacherAccessRequestsForAdmin(): Promise<TeacherAccessRequestRecord[]> {
  const firestore = assertAuthenticatedDb();
  try {
    const snap = await getDocs(collection(firestore, 'teacherAccessRequests'));
    return snap.docs
      .map((d) => {
        const raw = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          applicantUid: typeof raw.applicantUid === 'string' ? raw.applicantUid : null,
          fullName: String(raw.fullName || ''),
          email: String(raw.email || ''),
          phone: String(raw.phone || ''),
          teacherId: String(raw.teacherId || ''),
          designation: String(raw.designation || ''),
          department: String(raw.department || ''),
          requestedClasses: Array.isArray(raw.requestedClasses)
            ? (raw.requestedClasses as string[])
            : [],
          requestedSubjects: Array.isArray(raw.requestedSubjects)
            ? (raw.requestedSubjects as string[])
            : [],
          status: (raw.status as TeacherAccessRequestRecord['status']) || 'pending',
          rejectionReason: typeof raw.rejectionReason === 'string' ? raw.rejectionReason : null,
          reviewedByUid: typeof raw.reviewedByUid === 'string' ? raw.reviewedByUid : null,
          createdAtIso: tsToIso(raw.createdAt),
          updatedAtIso: tsToIso(raw.updatedAt),
        } satisfies TeacherAccessRequestRecord;
      })
      .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'teacherAccessRequests');
  }
}

export async function fetchAuthorizedTeachersForAdmin(): Promise<AuthorizedTeacherAccount[]> {
  const firestore = assertAuthenticatedDb();
  try {
    const snap = await getDocs(collection(firestore, 'authorizedTeachers'));
    return snap.docs
      .map((d) => {
        const raw = d.data() as Record<string, unknown>;
        return {
          uid: d.id,
          email: String(raw.email || ''),
          fullName: String(raw.fullName || ''),
          teacherId: String(raw.teacherId || ''),
          teacherRole: (raw.teacherRole as TeacherPortalRole) || 'subject_teacher',
          assignedClasses: Array.isArray(raw.assignedClasses)
            ? (raw.assignedClasses as string[])
            : [],
          assignedSections: Array.isArray(raw.assignedSections)
            ? (raw.assignedSections as string[])
            : [],
          assignedSubjects: Array.isArray(raw.assignedSubjects)
            ? (raw.assignedSubjects as string[])
            : [],
          isClassTeacher: Boolean(raw.isClassTeacher),
          classTeacherOf: typeof raw.classTeacherOf === 'string' ? raw.classTeacherOf : null,
          canEnterMarks: raw.canEnterMarks !== false,
          canSubmitResults: raw.canSubmitResults !== false,
          canTakeAttendance: Boolean(raw.canTakeAttendance),
          canViewStudents: raw.canViewStudents !== false,
          isActive: raw.isActive !== false,
          createdAtIso: tsToIso(raw.createdAt),
          updatedAtIso: tsToIso(raw.updatedAt),
        } satisfies AuthorizedTeacherAccount;
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'authorizedTeachers');
  }
}

export async function createTeacherAccessRequestRecord(
  input: {
    applicantUid?: string;
    fullName: string;
    email: string;
    phone: string;
    teacherId: string;
    designation: string;
    department: string;
    requestedClasses: string[];
    requestedSubjects: string[];
  },
  actorRole: AdminRole
): Promise<string> {
  const firestore = assertAuthenticatedDb();
  const id = makeDocId('treq');
  const path = `teacherAccessRequests/${id}`;
  try {
    await setDoc(doc(firestore, 'teacherAccessRequests', id), {
      applicantUid: input.applicantUid?.trim() ? input.applicantUid.trim().slice(0, 128) : null,
      fullName: input.fullName.trim().slice(0, 160),
      email: input.email.trim().toLowerCase().slice(0, 160),
      phone: input.phone.trim().slice(0, 30),
      teacherId: input.teacherId.trim().slice(0, 40),
      designation: input.designation.trim().slice(0, 120),
      department: input.department.trim().slice(0, 120),
      requestedClasses: input.requestedClasses.slice(0, 11),
      requestedSubjects: input.requestedSubjects.slice(0, 20),
      status: 'pending',
      rejectionReason: null,
      reviewedByUid: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await recordActivityLog({
      actionType: 'teacher_updated',
      targetCollection: 'teacherAccessRequests',
      targetId: id,
      summary: `Logged teacher portal access request for ${input.fullName} (${input.email})`,
      actorRole,
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function approveTeacherAccessRequest(
  request: TeacherAccessRequestRecord,
  assignment: {
    targetUid: string;
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
  },
  actorRole: AdminRole
): Promise<void> {
  const firestore = assertAuthenticatedDb();
  const targetUid = assignment.targetUid.trim();
  if (!targetUid || !SAFE_ID_REGEX.test(targetUid)) {
    throw new Error(
      'A valid Firebase User UID (or deterministic teacher UID) is required to authorize a teacher account.'
    );
  }

  const batch = writeBatch(firestore);
  batch.update(doc(firestore, 'teacherAccessRequests', request.id), {
    status: 'approved',
    applicantUid: targetUid,
    rejectionReason: null,
    reviewedByUid: auth?.currentUser?.uid || null,
    updatedAt: serverTimestamp(),
  });

  // Strictly scoped teacher permissions — NEVER grants adminUsers record or publish privileges!
  batch.set(doc(firestore, 'authorizedTeachers', targetUid), {
    uid: targetUid,
    email: request.email.trim().toLowerCase().slice(0, 160),
    fullName: request.fullName.trim().slice(0, 160),
    teacherId: request.teacherId.trim().slice(0, 40),
    teacherRole: assignment.teacherRole,
    assignedClasses: assignment.assignedClasses.slice(0, 11),
    assignedSections: assignment.assignedSections.slice(0, 10),
    assignedSubjects: assignment.assignedSubjects.slice(0, 20),
    isClassTeacher: Boolean(assignment.isClassTeacher),
    classTeacherOf: assignment.isClassTeacher
      ? (assignment.classTeacherOf || '').trim().slice(0, 60) || null
      : null,
    canEnterMarks: Boolean(assignment.canEnterMarks),
    canSubmitResults: Boolean(assignment.canSubmitResults),
    canTakeAttendance: Boolean(assignment.canTakeAttendance),
    canViewStudents: Boolean(assignment.canViewStudents),
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    await recordActivityLog({
      actionType: 'teacher_approved',
      targetCollection: 'authorizedTeachers',
      targetId: targetUid,
      summary: `Approved teacher portal access for "${request.fullName}" (${request.email})`,
      actorRole,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `authorizedTeachers/${targetUid}`);
  }
}

export async function rejectTeacherAccessRequest(
  requestId: string,
  rejectionReason: string,
  actorRole: AdminRole
): Promise<void> {
  const firestore = assertAuthenticatedDb();
  const path = `teacherAccessRequests/${requestId}`;
  try {
    await updateDoc(doc(firestore, 'teacherAccessRequests', requestId), {
      status: 'rejected',
      rejectionReason: rejectionReason.trim().slice(0, 400) || 'Declined by Administrator',
      reviewedByUid: auth?.currentUser?.uid || null,
      updatedAt: serverTimestamp(),
    });
    await recordActivityLog({
      actionType: 'teacher_rejected',
      targetCollection: 'teacherAccessRequests',
      targetId: requestId,
      summary: `Rejected teacher access request ${requestId}`,
      actorRole,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function upsertAuthorizedTeacherAccount(
  account: Omit<AuthorizedTeacherAccount, 'createdAtIso' | 'updatedAtIso'>,
  actorRole: AdminRole
): Promise<void> {
  const firestore = assertAuthenticatedDb();
  const cleanUid = account.uid.trim();
  if (!cleanUid || !SAFE_ID_REGEX.test(cleanUid)) {
    throw new Error('Valid teacher UID is required.');
  }
  const path = `authorizedTeachers/${cleanUid}`;
  try {
    const existing = await getDoc(doc(firestore, 'authorizedTeachers', cleanUid));
    await setDoc(doc(firestore, 'authorizedTeachers', cleanUid), {
      uid: cleanUid,
      email: account.email.trim().toLowerCase().slice(0, 160),
      fullName: account.fullName.trim().slice(0, 160),
      teacherId: account.teacherId.trim().slice(0, 40),
      teacherRole: account.teacherRole,
      assignedClasses: account.assignedClasses.slice(0, 11),
      assignedSections: account.assignedSections.slice(0, 10),
      assignedSubjects: account.assignedSubjects.slice(0, 20),
      isClassTeacher: Boolean(account.isClassTeacher),
      classTeacherOf: account.isClassTeacher
        ? (account.classTeacherOf || '').trim().slice(0, 60) || null
        : null,
      canEnterMarks: Boolean(account.canEnterMarks),
      canSubmitResults: Boolean(account.canSubmitResults),
      canTakeAttendance: Boolean(account.canTakeAttendance),
      canViewStudents: Boolean(account.canViewStudents),
      isActive: Boolean(account.isActive),
      createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await recordActivityLog({
      actionType: 'teacher_permissions_updated',
      targetCollection: 'authorizedTeachers',
      targetId: cleanUid,
      summary: `Updated Phase 5 teacher permissions for "${account.fullName}" (${
        account.isActive ? 'Active' : 'Deactivated'
      })`,
      actorRole,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ============================================================================
// 9. CONTACT MESSAGES MANAGEMENT (`contactMessages`)
// ============================================================================

export async function fetchContactMessagesForAdmin(): Promise<ContactMessageRecord[]> {
  const firestore = assertAuthenticatedDb();
  try {
    const snap = await getDocs(collection(firestore, 'contactMessages'));
    return snap.docs
      .map((d) => {
        const raw = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          senderName: String(raw.senderName || ''),
          senderEmail: String(raw.senderEmail || ''),
          senderPhone: String(raw.senderPhone || ''),
          subject: String(raw.subject || ''),
          message: String(raw.message || ''),
          status: (raw.status as ContactMessageRecord['status']) || 'new',
          createdAtIso: tsToIso(raw.createdAt),
        } satisfies ContactMessageRecord;
      })
      .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'contactMessages');
  }
}

export async function updateContactMessageStatus(
  messageId: string,
  status: ContactMessageRecord['status'],
  actorRole: AdminRole
): Promise<void> {
  const firestore = assertAuthenticatedDb();
  const path = `contactMessages/${messageId}`;
  try {
    await updateDoc(doc(firestore, 'contactMessages', messageId), {
      status,
      updatedAt: serverTimestamp(),
    });
    await recordActivityLog({
      actionType: 'message_updated',
      targetCollection: 'contactMessages',
      targetId: messageId,
      summary: `Marked contact inquiry ${messageId} as "${status}"`,
      actorRole,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteContactMessage(
  messageId: string,
  actorRole: AdminRole
): Promise<void> {
  const firestore = assertAuthenticatedDb();
  const path = `contactMessages/${messageId}`;
  try {
    await deleteDoc(doc(firestore, 'contactMessages', messageId));
    await recordActivityLog({
      actionType: 'message_updated',
      targetCollection: 'contactMessages',
      targetId: messageId,
      summary: `Deleted contact inquiry ${messageId}`,
      actorRole,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchAllTeacherMarkSubmissionsForAdmin(): Promise<TeacherMarkSubmissionRecord[]> {
  const firestore = assertAuthenticatedDb();
  const path = 'teacherMarkSubmissions';
  try {
    const snap = await getDocs(collection(firestore, 'teacherMarkSubmissions'));
    return snap.docs.map((d) => {
      const raw = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        teacherUid: String(raw.teacherUid || ''),
        teacherId: String(raw.teacherId || ''),
        teacherName: String(raw.teacherName || ''),
        academicYearId: String(raw.academicYearId || ''),
        examId: String(raw.examId || ''),
        examName: String(raw.examNameEn || raw.examNameBn || raw.examId || ''),
        classCode: raw.classCode as any,
        className: String(raw.classNameEn || raw.classNameBn || raw.classCode || ''),
        subjectCode: String(raw.subjectCode || ''),
        subjectName: String(raw.subjectName || raw.subjectNameEn || ''),
        totalCandidates: Number(raw.totalCandidates || 0),
        submittedMarksCount: Number(raw.submittedMarksCount || 0),
        status: (raw.status as any) || 'draft',
        rejectionReason: raw.rejectionReason ? String(raw.rejectionReason) : null,
        submittedAtIso: raw.submittedAt ? (raw.submittedAt as any).toDate?.().toISOString() : null,
        reviewedBy: raw.reviewedBy ? String(raw.reviewedBy) : null,
        reviewedAtIso: raw.reviewedAt ? (raw.reviewedAt as any).toDate?.().toISOString() : null,
        createdAtIso: raw.createdAt ? (raw.createdAt as any).toDate?.().toISOString() : new Date().toISOString(),
        updatedAtIso: raw.updatedAt ? (raw.updatedAt as any).toDate?.().toISOString() : new Date().toISOString(),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function reviewTeacherMarkSubmission(
  submissionId: string,
  status: 'approved' | 'rejected',
  reviewerUid: string,
  reviewerName: string,
  rejectionReason?: string
): Promise<void> {
  const firestore = assertAuthenticatedDb();
  const path = `teacherMarkSubmissions/${submissionId}`;
  try {
    const updateData: Record<string, unknown> = {
      status,
      reviewedBy: reviewerName,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    await updateDoc(doc(firestore, 'teacherMarkSubmissions', submissionId), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

