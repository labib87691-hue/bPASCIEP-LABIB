/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { TeacherAccountProfile, TeacherPermissionKey } from '../types/teacher';
import { getAuthorizedTeacherProfile } from '../services/teacherService';

interface TeacherAuthContextValue {
  currentUser: User | null;
  teacherProfile: TeacherAccountProfile | null;
  isLoading: boolean;
  isTeacherAuthenticated: boolean;
  canTeacher: (permission: TeacherPermissionKey) => boolean;
  signInWithEmail: (email: string, pass: string) => Promise<TeacherAccountProfile>;
  signInWithGoogle: () => Promise<TeacherAccountProfile>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const TeacherAuthContext = createContext<TeacherAuthContextValue | undefined>(undefined);

export const TeacherAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<TeacherAccountProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadProfile = async (firebaseUser: User | null): Promise<TeacherAccountProfile | null> => {
    if (!firebaseUser) {
      setTeacherProfile(null);
      return null;
    }
    try {
      const profile = await getAuthorizedTeacherProfile(firebaseUser.uid);
      setTeacherProfile(profile);
      return profile;
    } catch (err) {
      console.warn('Could not load teacher profile:', err);
      setTeacherProfile(null);
      return null;
    }
  };

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);
      if (fbUser) {
        await loadProfile(fbUser);
      } else {
        setTeacherProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const canTeacher = (permission: TeacherPermissionKey): boolean => {
    if (!teacherProfile || !teacherProfile.isActive) return false;
    switch (permission) {
      case 'access_dashboard':
        return true;
      case 'view_classes':
        return true;
      case 'view_students':
        return teacherProfile.canViewStudents !== false;
      case 'access_cloud':
        return teacherProfile.canAccessCloud !== false;
      case 'view_notices':
        return teacherProfile.canViewNotices !== false;
      case 'enter_marks':
        return teacherProfile.canEnterMarks !== false;
      case 'edit_draft_marks':
        return teacherProfile.canEditDraftMarks !== false;
      case 'submit_results':
        return teacherProfile.canSubmitResults !== false;
      case 'take_attendance':
        return teacherProfile.canTakeAttendance !== false;
      case 'edit_profile':
        return teacherProfile.canEditProfile !== false;
      default:
        return false;
    }
  };

  const signInWithEmail = async (email: string, pass: string): Promise<TeacherAccountProfile> => {
    if (!auth) throw new Error('Firebase Authentication is not configured.');
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const profile = await loadProfile(cred.user);
    if (!profile) {
      await firebaseSignOut(auth);
      throw new Error(
        'ACCESS_DENIED: Your account is not authorized as a faculty member at BPSC. Please contact the School Administrator.'
      );
    }
    return profile;
  };

  const signInWithGoogle = async (): Promise<TeacherAccountProfile> => {
    if (!auth) throw new Error('Firebase Authentication is not configured.');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    const profile = await loadProfile(cred.user);
    if (!profile) {
      await firebaseSignOut(auth);
      throw new Error(
        'ACCESS_DENIED: Your Google account is not registered in the BPSC Faculty Registry. Please contact the School Administrator.'
      );
    }
    return profile;
  };

  const signOut = async (): Promise<void> => {
    if (auth) {
      await firebaseSignOut(auth);
    }
    setCurrentUser(null);
    setTeacherProfile(null);
  };

  const refreshProfile = async (): Promise<void> => {
    if (currentUser) {
      await loadProfile(currentUser);
    }
  };

  return (
    <TeacherAuthContext.Provider
      value={{
        currentUser,
        teacherProfile,
        isLoading,
        isTeacherAuthenticated: Boolean(currentUser && teacherProfile && teacherProfile.isActive),
        canTeacher,
        signInWithEmail,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </TeacherAuthContext.Provider>
  );
};

export function useTeacherAuth(): TeacherAuthContextValue {
  const ctx = useContext(TeacherAuthContext);
  if (!ctx) {
    throw new Error('useTeacherAuth must be used within a TeacherAuthProvider');
  }
  return ctx;
}
