/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  AttendanceRecord,
  AttendanceStatus,
  MarkSubmissionStatus,
  TeacherAccountProfile,
  TeacherClassOverview,
  TeacherMarkSubmissionRecord,
} from '../types/teacher';
import { StudentRecord, SupportedClassCode } from '../types/result';
import { CloudDocumentRecord } from '../types/cloud';
import { NoticeItem } from '../types/school';
import { SUPPORTED_RESULT_CLASSES } from '../data/resultPortalSeedData';

function convertTimestampToIso(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

function getFirestoreDb() {
  if (!db) throw new Error('Firestore is not configured.');
  return db;
}

/**
 * Loads the authorized teacher's profile from the `authorizedTeachers/{uid}` document.
 */
export async function getAuthorizedTeacherProfile(
  uid: string
): Promise<TeacherAccountProfile | null> {
  const firestore = getFirestoreDb();
  const path = `authorizedTeachers/${uid}`;
  try {
    const snap = await getDoc(doc(firestore, 'authorizedTeachers', uid));
    if (!snap.exists()) {
      return null;
    }
    const raw = snap.data() as Record<string, unknown>;
    if (raw.isActive === false) {
      return null;
    }

    return {
      uid: snap.id,
      email: String(raw.email || ''),
      fullName: String(raw.fullName || raw.email || ''),
      teacherId: String(raw.teacherId || ''),
      teacherRole: (raw.teacherRole as 'subject_teacher' | 'class_teacher') || 'subject_teacher',
      assignedClasses: Array.isArray(raw.assignedClasses) ? (raw.assignedClasses as string[]) : [],
      assignedSections: Array.isArray(raw.assignedSections) ? (raw.assignedSections as string[]) : [],
      assignedSubjects: Array.isArray(raw.assignedSubjects) ? (raw.assignedSubjects as string[]) : [],
      isClassTeacher: Boolean(raw.isClassTeacher),
      classTeacherOf: raw.classTeacherOf ? String(raw.classTeacherOf) : null,
      canEnterMarks: raw.canEnterMarks !== false,
      canSubmitResults: raw.canSubmitResults !== false,
      canTakeAttendance: raw.canTakeAttendance !== false,
      canViewStudents: raw.canViewStudents !== false,
      canAccessCloud: raw.canAccessCloud !== false,
      canViewNotices: raw.canViewNotices !== false,
      canEditProfile: raw.canEditProfile !== false,
      canEditDraftMarks: raw.canEditDraftMarks !== false,
      phone: raw.phone ? String(raw.phone) : undefined,
      designation: raw.designation ? String(raw.designation) : undefined,
      department: raw.department ? String(raw.department) : undefined,
      qualification: raw.qualification ? String(raw.qualification) : undefined,
      photoUrl: raw.photoUrl ? String(raw.photoUrl) : undefined,
      bio: raw.bio ? String(raw.bio) : undefined,
      officeHours: raw.officeHours ? String(raw.officeHours) : undefined,
      isActive: Boolean(raw.isActive),
      createdAtIso: convertTimestampToIso(raw.createdAt),
      updatedAtIso: convertTimestampToIso(raw.updatedAt || raw.createdAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Updates permitted teacher profile fields (self-update: phone, photoUrl, bio, officeHours, qualification).
 */
export async function updateTeacherSelfProfile(
  uid: string,
  updates: {
    phone?: string;
    photoUrl?: string;
    bio?: string;
    officeHours?: string;
    qualification?: string;
  }
): Promise<void> {
  const firestore = getFirestoreDb();
  const path = `authorizedTeachers/${uid}`;
  try {
    const cleanUpdates: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (updates.phone !== undefined) cleanUpdates.phone = updates.phone.trim().slice(0, 40);
    if (updates.photoUrl !== undefined) cleanUpdates.photoUrl = updates.photoUrl.trim().slice(0, 600);
    if (updates.bio !== undefined) cleanUpdates.bio = updates.bio.trim().slice(0, 2000);
    if (updates.officeHours !== undefined) cleanUpdates.officeHours = updates.officeHours.trim().slice(0, 200);
    if (updates.qualification !== undefined) cleanUpdates.qualification = updates.qualification.trim().slice(0, 600);

    await setDoc(doc(firestore, 'authorizedTeachers', uid), cleanUpdates, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Fetches students belonging to the teacher's assigned classes only.
 */
export async function fetchTeacherStudents(
  assignedClasses: string[],
  academicYearId?: string
): Promise<StudentRecord[]> {
  if (!assignedClasses || assignedClasses.length === 0) {
    return [];
  }
  const firestore = getFirestoreDb();
  const path = 'students';
  try {
    const studentsCol = collection(firestore, 'students');
    // Fetch in chunks of max 10 for Firestore 'in' limitation
    const results: StudentRecord[] = [];
    const chunks: string[][] = [];
    for (let i = 0; i < assignedClasses.length; i += 10) {
      chunks.push(assignedClasses.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const q = academicYearId
        ? query(studentsCol, where('classCode', 'in', chunk), where('academicYearId', '==', academicYearId))
        : query(studentsCol, where('classCode', 'in', chunk));

      const snap = await getDocs(q);
      snap.forEach((d) => {
        const raw = d.data() as Record<string, unknown>;
        results.push({
          id: d.id,
          studentCode: raw.studentCode ? String(raw.studentCode) : undefined,
          academicYearId: String(raw.academicYearId || ''),
          classCode: raw.classCode as SupportedClassCode,
          rollNumber: String(raw.rollNumber || ''),
          fullNameEn: String(raw.fullNameEn || ''),
          fullNameBn: raw.fullNameBn ? String(raw.fullNameBn) : undefined,
          section: raw.section ? String(raw.section) : undefined,
          groupNameEn: raw.groupNameEn ? String(raw.groupNameEn) : undefined,
          groupNameBn: raw.groupNameBn ? String(raw.groupNameBn) : undefined,
          guardianName: raw.guardianName ? String(raw.guardianName) : undefined,
          guardianPhone: raw.guardianPhone ? String(raw.guardianPhone) : undefined,
          isActive: Boolean(raw.isActive),
        });
      });
    }

    // Sort by class and roll number
    return results.sort((a, b) => {
      if (a.classCode !== b.classCode) return a.classCode.localeCompare(b.classCode);
      return Number(a.rollNumber || 0) - Number(b.rollNumber || 0);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Builds teacher class overview cards with student counts, sections, and subjects.
 */
export async function fetchTeacherClassOverviews(
  teacher: TeacherAccountProfile
): Promise<TeacherClassOverview[]> {
  const students = await fetchTeacherStudents(teacher.assignedClasses);
  const countMap = new Map<string, number>();
  students.forEach((s) => {
    countMap.set(s.classCode, (countMap.get(s.classCode) || 0) + 1);
  });

  return teacher.assignedClasses.map((code) => {
    const meta = SUPPORTED_RESULT_CLASSES.find((c) => c.classCode === code);
    return {
      classCode: code as SupportedClassCode,
      className: meta ? meta.nameEn : code,
      sections: teacher.assignedSections.length > 0 ? teacher.assignedSections : ['A'],
      subjects: teacher.assignedSubjects,
      studentCount: countMap.get(code) || 0,
      routineDocUrl: null,
      syllabusDocUrl: null,
    };
  });
}

/**
 * Fetches teacher's mark submission records.
 */
export async function fetchTeacherMarkSubmissions(
  teacherUid: string
): Promise<TeacherMarkSubmissionRecord[]> {
  const firestore = getFirestoreDb();
  const path = 'teacherMarkSubmissions';
  try {
    const q = query(
      collection(firestore, 'teacherMarkSubmissions'),
      where('teacherUid', '==', teacherUid)
    );
    const snap = await getDocs(q);
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
        classCode: raw.classCode as SupportedClassCode,
        className: String(raw.classNameEn || raw.classNameBn || raw.classCode || ''),
        subjectCode: String(raw.subjectCode || ''),
        subjectName: String(raw.subjectName || raw.subjectNameEn || ''),
        totalCandidates: Number(raw.totalCandidates || 0),
        submittedMarksCount: Number(raw.submittedMarksCount || 0),
        status: (raw.status as MarkSubmissionStatus) || 'draft',
        rejectionReason: raw.rejectionReason ? String(raw.rejectionReason) : null,
        submittedAtIso: raw.submittedAt ? convertTimestampToIso(raw.submittedAt) : null,
        reviewedBy: raw.reviewedBy ? String(raw.reviewedBy) : null,
        reviewedAtIso: raw.reviewedAt ? convertTimestampToIso(raw.reviewedAt) : null,
        createdAtIso: convertTimestampToIso(raw.createdAt),
        updatedAtIso: convertTimestampToIso(raw.updatedAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Saves or updates a teacher mark submission record (Draft or Submitted).
 */
export async function saveTeacherMarkSubmission(
  submission: Omit<TeacherMarkSubmissionRecord, 'createdAtIso' | 'updatedAtIso'>,
  entriesPayload?: unknown[]
): Promise<void> {
  const firestore = getFirestoreDb();
  const path = `teacherMarkSubmissions/${submission.id}`;
  try {
    const dataToSave: Record<string, unknown> = {
      teacherUid: submission.teacherUid,
      teacherId: submission.teacherId,
      teacherName: submission.teacherName,
      academicYearId: submission.academicYearId,
      examId: submission.examId,
      classCode: submission.classCode,
      subjectCode: submission.subjectCode,
      subjectName: submission.subjectName,
      totalCandidates: submission.totalCandidates,
      submittedMarksCount: submission.submittedMarksCount,
      status: submission.status,
      updatedAt: serverTimestamp(),
    };

    if (submission.rejectionReason) dataToSave.rejectionReason = submission.rejectionReason;
    if (submission.status === 'submitted') {
      dataToSave.submittedAt = serverTimestamp();
    }
    if (entriesPayload) {
      dataToSave.entries = entriesPayload;
    }

    const docRef = doc(firestore, 'teacherMarkSubmissions', submission.id);
    const existingSnap = await getDoc(docRef);
    if (!existingSnap.exists()) {
      dataToSave.createdAt = serverTimestamp();
      await setDoc(docRef, dataToSave);
    } else {
      await setDoc(docRef, dataToSave, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches attendance record for a class, section and date.
 */
export async function fetchAttendanceRecord(
  academicYearId: string,
  classCode: SupportedClassCode,
  section: string,
  date: string
): Promise<AttendanceRecord | null> {
  const firestore = getFirestoreDb();
  const id = `${academicYearId}_${classCode}_${section || 'all'}_${date}`;
  const path = `attendanceRecords/${id}`;
  try {
    const snap = await getDoc(doc(firestore, 'attendanceRecords', id));
    if (!snap.exists()) {
      return null;
    }
    const raw = snap.data() as Record<string, unknown>;
    return {
      id: snap.id,
      academicYearId: String(raw.academicYearId || ''),
      classCode: raw.classCode as SupportedClassCode,
      className: String(raw.className || raw.classCode || ''),
      section: String(raw.section || 'A'),
      date: String(raw.date || date),
      teacherUid: String(raw.teacherUid || ''),
      teacherId: String(raw.teacherId || ''),
      teacherName: String(raw.teacherName || ''),
      studentAttendance: (raw.studentAttendance as Record<string, AttendanceStatus>) || {},
      totalStudents: Number(raw.totalStudents || 0),
      presentCount: Number(raw.presentCount || 0),
      absentCount: Number(raw.absentCount || 0),
      lateCount: Number(raw.lateCount || 0),
      remarks: raw.remarks ? String(raw.remarks) : undefined,
      createdAtIso: convertTimestampToIso(raw.createdAt),
      updatedAtIso: convertTimestampToIso(raw.updatedAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Saves or updates an attendance record.
 */
export async function saveAttendanceRecord(
  record: Omit<AttendanceRecord, 'createdAtIso' | 'updatedAtIso'>
): Promise<void> {
  const firestore = getFirestoreDb();
  const path = `attendanceRecords/${record.id}`;
  try {
    const dataToSave: Record<string, unknown> = {
      academicYearId: record.academicYearId,
      classCode: record.classCode,
      className: record.className,
      section: record.section,
      date: record.date,
      teacherUid: record.teacherUid,
      teacherId: record.teacherId,
      teacherName: record.teacherName,
      studentAttendance: record.studentAttendance,
      totalStudents: record.totalStudents,
      presentCount: record.presentCount,
      absentCount: record.absentCount,
      lateCount: record.lateCount,
      updatedAt: serverTimestamp(),
    };
    if (record.remarks) dataToSave.remarks = record.remarks.slice(0, 500);

    const docRef = doc(firestore, 'attendanceRecords', record.id);
    const existingSnap = await getDoc(docRef);
    if (!existingSnap.exists()) {
      dataToSave.createdAt = serverTimestamp();
      await setDoc(docRef, dataToSave);
    } else {
      await setDoc(docRef, dataToSave, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches published school notices for teachers.
 */
export async function fetchTeacherNotices(): Promise<NoticeItem[]> {
  const firestore = getFirestoreDb();
  const path = 'notices';
  try {
    const snap = await getDocs(
      query(collection(firestore, 'notices'), where('isPublished', '==', true))
    );
    return snap.docs
      .map((d) => {
        const raw = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          serial: Number(raw.serial || 0),
          titleBn: String(raw.titleBn || ''),
          titleEn: String(raw.titleEn || ''),
          category: (raw.category as NoticeItem['category']) || 'general',
          publishDate: String(raw.publishDate || ''),
          year: String(raw.year || '2026'),
          summaryBn: String(raw.summaryBn || ''),
          summaryEn: String(raw.summaryEn || ''),
          detailsBn: String(raw.detailsBn || raw.summaryBn || ''),
          detailsEn: String(raw.detailsEn || raw.summaryEn || ''),
          attachmentUrl: raw.attachmentUrl ? String(raw.attachmentUrl) : undefined,
          attachmentType: raw.attachmentType as 'pdf' | 'image' | undefined,
          externalUrl: raw.externalUrl ? String(raw.externalUrl) : undefined,
          isImportant: Boolean(raw.isImportant),
          isPublished: Boolean(raw.isPublished),
          updatedAt: raw.updatedAt ? convertTimestampToIso(raw.updatedAt) : undefined,
        };
      })
      .sort((a, b) => b.serial - a.serial);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Fetches published Cloud documents for teachers (routines, syllabus, question papers, etc.).
 */
export async function fetchTeacherCloudDocuments(
  category?: string
): Promise<CloudDocumentRecord[]> {
  const firestore = getFirestoreDb();
  const path = 'cloudDocuments';
  try {
    const q = category
      ? query(
          collection(firestore, 'cloudDocuments'),
          where('isPublished', '==', true),
          where('category', '==', category)
        )
      : query(collection(firestore, 'cloudDocuments'), where('isPublished', '==', true));

    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const raw = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        title: String(raw.title || ''),
        titleBn: raw.titleBn ? String(raw.titleBn) : undefined,
        category: raw.category as CloudDocumentRecord['category'],
        className: raw.className ? (raw.className as CloudDocumentRecord['className']) : null,
        subject: raw.subject ? String(raw.subject) : null,
        academicYear: raw.academicYear ? String(raw.academicYear) : null,
        description: String(raw.description || ''),
        descriptionBn: raw.descriptionBn ? String(raw.descriptionBn) : undefined,
        driveUrl: String(raw.driveUrl || ''),
        fileType: (raw.fileType as CloudDocumentRecord['fileType']) || 'PDF',
        fileSize: raw.fileSize ? String(raw.fileSize) : null,
        isPublished: Boolean(raw.isPublished),
        isDemoRecord: Boolean(raw.isDemoRecord),
        createdAtIso: convertTimestampToIso(raw.createdAt),
        updatedAtIso: convertTimestampToIso(raw.updatedAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
