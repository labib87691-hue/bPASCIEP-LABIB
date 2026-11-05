import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  db,
  isFirebaseConfigured,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  AcademicClassLevel,
  AcademicResourceItem,
  AdminLeader,
  BannerItem,
  ContactInquiryInput,
  FacilityItem,
  GalleryPhoto,
  GoverningMember,
  NewsEventItem,
  NoticeItem,
  SiteContentBlock,
  SiteSetting,
  StaffProfile,
  TeacherProfile,
  TransportRecord,
} from '../types/school';
import { HolidayRecord } from '../types/admin';
import {
  VERIFIED_ACADEMIC_RESOURCES,
  VERIFIED_ADMINISTRATION,
  VERIFIED_BANNERS,
  VERIFIED_CLASSES,
  VERIFIED_FACILITIES,
  VERIFIED_GALLERY,
  VERIFIED_GOVERNING_BODY,
  VERIFIED_NEWS_EVENTS,
  VERIFIED_NOTICES,
  VERIFIED_SITE_SETTINGS,
  VERIFIED_STAFF,
  VERIFIED_TEACHERS,
  VERIFIED_TRANSPORT,
} from '../data/verifiedSchoolData';

export const DEFAULT_SITE_CONTENT_BLOCKS: SiteContentBlock[] = [
  {
    id: 'home_welcome',
    sectionKey: 'home_welcome',
    titleEn: 'Excellence in Discipline, Morality & Modern Education',
    titleBn: 'শৃঙ্খলা, নৈতিকতা ও আধুনিক শিক্ষার সমন্বয়ে এক অনন্য বিদ্যাপীঠ',
    bodyEn:
      'Operated under Bangladesh Export Processing Zones Authority (BEPZA), Chief Adviser’s Office, BEPZA Public School & College, Ishwardi EPZ nurtures learners with modern classrooms, science & ICT labs, safe campus transport, and co-curricular leadership.',
    bodyBn:
      'প্রধান উপদেষ্টার কার্যালয়ের অধীনস্থ বাংলাদেশ রপ্তানি প্রক্রিয়াকরণ এলাকা কর্তৃপক্ষ (বেপজা) পরিচালিত ঈশ্বরদী ইপিজেড ক্যাম্পাসে আধুনিক শ্রেণিকক্ষ, বিজ্ঞানাগার, আইসিটি ল্যাব এবং সহশিক্ষা কার্যক্রমের মাধ্যমে শিক্ষার্থীদের সুনাগরিক হিসেবে গড়ে তোলা হচ্ছে।',
    isPublished: true,
  },
  {
    id: 'about_overview',
    sectionKey: 'about_overview',
    titleEn: 'About BEPZA Public School & College, Ishwardi EPZ',
    titleBn: 'বেপজা পাবলিক স্কুল অ্যান্ড কলেজ, ঈশ্বরদী ইপিজেড পরিচিতি',
    bodyEn:
      'Established in 2012 within the secure premises of Ishwardi Export Processing Zone, Pakshi, Pabna (EIIN: 140336), BPSC serves children of EPZ officials, investors, workers, and surrounding communities with high academic standards.',
    bodyBn:
      '২০১২ সালে পাবনার পাকশীস্থ ঈশ্বরদী রপ্তানি প্রক্রিয়াকরণ এলাকার সুরক্ষিত পরিবেশে প্রতিষ্ঠিত এই প্রতিষ্ঠানটি (EIIN: 140336) ইপিজেড কর্মকর্তা, বিনিয়োগকারী, কর্মী এবং পার্শ্ববর্তী এলাকার শিক্ষার্থীদের মানসম্মত শিক্ষা প্রদান করে আসছে।',
    isPublished: true,
  },
];

export const DEFAULT_PUBLIC_HOLIDAYS: HolidayRecord[] = [
  {
    id: 'hol_2026_intl_mother_lang',
    titleEn: 'Shaheed Day & International Mother Language Day',
    titleBn: 'শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস',
    descriptionEn: 'National observance and tribute at the campus Shaheed Minar; regular classes remain closed.',
    descriptionBn: 'ক্যাম্পাস শহীদ মিনারে শ্রদ্ধাঞ্জলি অর্পণ ও আলোচনা সভা; নিয়মিত শ্রেণি কার্যক্রম বন্ধ থাকবে।',
    isMultiDay: false,
    startDate: '2026-02-21',
    endDate: '2026-02-21',
    holidayType: 'national',
    applicableClass: 'ALL',
    academicYear: '2026',
    driveUrl: null,
    isPublished: true,
    createdAtIso: '2026-01-05T08:00:00.000Z',
    updatedAtIso: '2026-01-05T08:00:00.000Z',
  },
  {
    id: 'hol_2026_independence_day',
    titleEn: 'Independence & National Day',
    titleBn: 'মহান স্বাধীনতা ও জাতীয় দিবস',
    descriptionEn: 'Flag hoisting, parade, and cultural program at BPSC Ishwardi EPZ campus.',
    descriptionBn: 'জাতীয় পতাকা উত্তোলন, কুচকাওয়াজ ও সাংস্কৃতিক অনুষ্ঠান উপলক্ষে শ্রেণি কার্যক্রম বন্ধ থাকবে।',
    isMultiDay: false,
    startDate: '2026-03-26',
    endDate: '2026-03-26',
    holidayType: 'national',
    applicableClass: 'ALL',
    academicYear: '2026',
    driveUrl: null,
    isPublished: true,
    createdAtIso: '2026-01-05T08:00:00.000Z',
    updatedAtIso: '2026-01-05T08:00:00.000Z',
  },
  {
    id: 'hol_2026_summer_eid',
    titleEn: 'Summer & Holy Eid-ul-Adha Vacation',
    titleBn: 'গ্রীষ্মকালীন অবকাশ ও পবিত্র ঈদুল আযহা ছুটি',
    descriptionEn: 'Scheduled institutional vacation for all academic sections from Nursery to Class 10.',
    descriptionBn: 'নার্সারি থেকে দশম শ্রেণি পর্যন্ত গ্রীষ্মকালীন অবকাশ ও পবিত্র ঈদুল আযহা উপলক্ষে নির্ধারিত ছুটি।',
    isMultiDay: true,
    startDate: '2026-05-24',
    endDate: '2026-06-04',
    holidayType: 'vacation',
    applicableClass: 'ALL',
    academicYear: '2026',
    driveUrl: null,
    isPublished: true,
    createdAtIso: '2026-01-05T08:00:00.000Z',
    updatedAtIso: '2026-01-05T08:00:00.000Z',
  },
];

async function fetchPublishedCollection<T extends { id: string }>(
  collectionName: string,
  fallback: T[]
): Promise<T[]> {
  if (!isFirebaseConfigured || !db) {
    return fallback;
  }

  try {
    const q = query(collection(db, collectionName), where('isPublished', '==', true));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return fallback;
    }
    return snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as Omit<T, 'id'>),
      id: docSnap.id,
    })) as T[];
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.LIST, collectionName);
    }
    console.warn(`Using verified institutional baseline for ${collectionName}:`, error);
    return fallback;
  }
}

export interface PublicSiteBundle {
  settings: SiteSetting;
  siteContent: SiteContentBlock[];
  banners: BannerItem[];
  administration: AdminLeader[];
  governingBody: GoverningMember[];
  teachers: TeacherProfile[];
  staff: StaffProfile[];
  classes: AcademicClassLevel[];
  academicResources: AcademicResourceItem[];
  notices: NoticeItem[];
  gallery: GalleryPhoto[];
  newsEvents: NewsEventItem[];
  facilities: FacilityItem[];
  transport: TransportRecord[];
  holidays: HolidayRecord[];
}

export async function loadPublicSiteBundle(): Promise<PublicSiteBundle> {
  const [
    settingsList,
    siteContent,
    banners,
    administration,
    governingBody,
    teachers,
    staff,
    classes,
    academicResources,
    notices,
    gallery,
    newsEvents,
    facilities,
    transport,
    holidays,
  ] = await Promise.all([
    fetchPublishedCollection<SiteSetting>('settings', [VERIFIED_SITE_SETTINGS]),
    fetchPublishedCollection<SiteContentBlock>('siteContent', DEFAULT_SITE_CONTENT_BLOCKS),
    fetchPublishedCollection<BannerItem>('banners', VERIFIED_BANNERS),
    fetchPublishedCollection<AdminLeader>('administration', VERIFIED_ADMINISTRATION),
    fetchPublishedCollection<GoverningMember>('governingBody', VERIFIED_GOVERNING_BODY),
    fetchPublishedCollection<TeacherProfile>('teachers', VERIFIED_TEACHERS),
    fetchPublishedCollection<StaffProfile>('staff', VERIFIED_STAFF),
    fetchPublishedCollection<AcademicClassLevel>('classes', VERIFIED_CLASSES),
    fetchPublishedCollection<AcademicResourceItem>('academicResources', VERIFIED_ACADEMIC_RESOURCES),
    fetchPublishedCollection<NoticeItem>('notices', VERIFIED_NOTICES),
    fetchPublishedCollection<GalleryPhoto>('gallery', VERIFIED_GALLERY),
    fetchPublishedCollection<NewsEventItem>('news', VERIFIED_NEWS_EVENTS),
    fetchPublishedCollection<FacilityItem>('facilities', VERIFIED_FACILITIES),
    fetchPublishedCollection<TransportRecord>('transport', VERIFIED_TRANSPORT),
    fetchPublishedCollection<HolidayRecord>('holidays', DEFAULT_PUBLIC_HOLIDAYS),
  ]);

  return {
    settings: settingsList[0] || VERIFIED_SITE_SETTINGS,
    siteContent,
    banners: [...banners].sort((a, b) => a.order - b.order),
    administration: [...administration].sort((a, b) => a.order - b.order),
    governingBody: [...governingBody].sort((a, b) => a.order - b.order),
    teachers: [...teachers]
      .filter((t) => t.isActive !== false && t.employmentStatus !== 'inactive')
      .sort((a, b) => a.serial - b.serial),
    staff: [...staff]
      .filter((s) => s.isActive !== false && s.employmentStatus !== 'inactive')
      .sort((a, b) => a.serial - b.serial),
    classes: [...classes].sort((a, b) => a.levelOrder - b.levelOrder),
    academicResources: [...academicResources].sort((a, b) => a.order - b.order),
    notices: [...notices].sort((a, b) => a.serial - b.serial),
    gallery: [...gallery].sort((a, b) => a.order - b.order),
    newsEvents,
    facilities: [...facilities].sort((a, b) => a.order - b.order),
    transport: [...transport].sort((a, b) => a.order - b.order),
    holidays: [...holidays].sort((a, b) => a.startDate.localeCompare(b.startDate)),
  };
}

// Strict validation constants synchronized with firebase-blueprint.json & firestore.rules
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{6,30}$/;

export function validateContactInquiry(input: ContactInquiryInput): string | null {
  const name = input.senderName.trim();
  const email = input.senderEmail.trim();
  const phone = input.senderPhone.trim();
  const subject = input.subject.trim();
  const message = input.message.trim();

  if (name.length < 2 || name.length > 120) {
    return 'name';
  }
  if (email.length < 5 || email.length > 160 || !EMAIL_REGEX.test(email)) {
    return 'email';
  }
  if (phone.length < 6 || phone.length > 30 || !PHONE_REGEX.test(phone)) {
    return 'phone';
  }
  if (subject.length < 3 || subject.length > 200) {
    return 'subject';
  }
  if (message.length < 10 || message.length > 3000) {
    return 'message';
  }
  return null;
}

export async function submitContactInquiry(
  input: ContactInquiryInput
): Promise<{ referenceId: string; persistedToCloud: boolean }> {
  const validationError = validateContactInquiry(input);
  if (validationError) {
    throw new Error(`VALIDATION_${validationError.toUpperCase()}`);
  }

  const sanitized = {
    senderName: input.senderName.trim().slice(0, 120),
    senderEmail: input.senderEmail.trim().slice(0, 160),
    senderPhone: input.senderPhone.trim().slice(0, 30),
    subject: input.subject.trim().slice(0, 200),
    message: input.message.trim().slice(0, 3000),
  };

  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const messageId = `inq_${Date.now()}_${randomSuffix}`;

  if (!isFirebaseConfigured || !db) {
    return { referenceId: messageId, persistedToCloud: false };
  }

  const path = `contactMessages/${messageId}`;
  try {
    await setDoc(doc(db, 'contactMessages', messageId), {
      ...sanitized,
      status: 'new',
      createdAt: serverTimestamp(),
    });
    return { referenceId: messageId, persistedToCloud: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
