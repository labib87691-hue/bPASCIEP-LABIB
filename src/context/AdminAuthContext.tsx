import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { AdminPermissionKey, AdminUserProfile } from '../types/admin';
import {
  bootstrapInitialSuperAdmin,
  fetchAdminUserProfile,
} from '../services/adminService';
import { hasAdminPermission } from '../utils/adminPermissions';
import { recordActivityLog } from '../services/activityLogService';

interface AdminAuthContextValue {
  firebaseUser: User | null;
  adminProfile: AdminUserProfile | null;
  isLoadingAuth: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginWithEmailPassword: (email: string, password: string) => Promise<AdminUserProfile | null>;
  loginWithGoogle: () => Promise<AdminUserProfile | null>;
  requestPasswordReset: (email: string) => Promise<void>;
  provisionInitialSuperAdmin: (displayName?: string) => Promise<AdminUserProfile>;
  logoutAdmin: () => Promise<void>;
  refreshAdminProfile: () => Promise<AdminUserProfile | null>;
  can: (permission: AdminPermissionKey) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

function mapFirebaseAuthErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
    return 'Invalid email address or password. Please verify your administrator credentials.';
  }
  if (msg.includes('auth/invalid-email')) {
    return 'Please enter a valid institutional email address.';
  }
  if (msg.includes('auth/too-many-requests')) {
    return 'Too many failed sign-in attempts. Please wait a few minutes or reset your password.';
  }
  if (msg.includes('auth/operation-not-allowed')) {
    return 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method). You may sign in with Google or enable Email/Password in Firebase Console.';
  }
  if (msg.includes('auth/popup-closed-by-user')) {
    return 'Sign-in window was closed before completing authentication.';
  }
  return msg || 'Authentication failed. Please try again.';
}

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminUserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const loadProfileForUser = useCallback(async (user: User | null): Promise<AdminUserProfile | null> => {
    if (!user) {
      setAdminProfile(null);
      return null;
    }
    const profile = await fetchAdminUserProfile(user.uid);
    if (profile && profile.isActive) {
      setAdminProfile(profile);
      return profile;
    }
    setAdminProfile(null);
    return null;
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setIsLoadingAuth(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await loadProfileForUser(user);
      } else {
        setAdminProfile(null);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [loadProfileForUser]);

  const refreshAdminProfile = useCallback(async () => {
    if (!auth?.currentUser) {
      setAdminProfile(null);
      return null;
    }
    return loadProfileForUser(auth.currentUser);
  }, [loadProfileForUser]);

  const loginWithEmailPassword = useCallback(
    async (email: string, password: string): Promise<AdminUserProfile | null> => {
      if (!auth) throw new Error('Firebase Authentication is not configured.');
      setAuthError(null);
      try {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        setFirebaseUser(cred.user);
        const profile = await loadProfileForUser(cred.user);
        if (profile && profile.isActive) {
          await recordActivityLog({
            actionType: 'login',
            targetCollection: 'adminUsers',
            targetId: cred.user.uid,
            summary: `Administrator signed in via Email/Password (${profile.email})`,
            actorRole: profile.role,
          });
        }
        return profile;
      } catch (err) {
        const friendly = mapFirebaseAuthErrorMessage(err);
        setAuthError(friendly);
        throw new Error(friendly);
      }
    },
    [loadProfileForUser]
  );

  const loginWithGoogle = useCallback(async (): Promise<AdminUserProfile | null> => {
    if (!auth) throw new Error('Firebase Authentication is not configured.');
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      setFirebaseUser(cred.user);
      const profile = await loadProfileForUser(cred.user);
      if (profile && profile.isActive) {
        await recordActivityLog({
          actionType: 'login',
          targetCollection: 'adminUsers',
          targetId: cred.user.uid,
          summary: `Administrator signed in via Google (${profile.email})`,
          actorRole: profile.role,
        });
      }
      return profile;
    } catch (err) {
      const friendly = mapFirebaseAuthErrorMessage(err);
      setAuthError(friendly);
      throw new Error(friendly);
    }
  }, [loadProfileForUser]);

  const requestPasswordReset = useCallback(async (email: string): Promise<void> => {
    if (!auth) throw new Error('Firebase Authentication is not configured.');
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      const friendly = mapFirebaseAuthErrorMessage(err);
      setAuthError(friendly);
      throw new Error(friendly);
    }
  }, []);

  const provisionInitialSuperAdmin = useCallback(
    async (displayName?: string): Promise<AdminUserProfile> => {
      if (!auth?.currentUser) {
        throw new Error('Please sign in first to verify Super Admin eligibility.');
      }
      setAuthError(null);
      try {
        const idToken = await auth.currentUser.getIdToken(true);
        const created = await bootstrapInitialSuperAdmin(idToken, displayName);
        setAdminProfile(created);
        return created;
      } catch (err) {
        const friendly = err instanceof Error ? err.message : 'Super Admin setup failed.';
        setAuthError(friendly);
        throw new Error(friendly);
      }
    },
    []
  );

  const logoutAdmin = useCallback(async (): Promise<void> => {
    if (!auth) return;
    if (adminProfile && auth.currentUser) {
      await recordActivityLog({
        actionType: 'logout',
        targetCollection: 'adminUsers',
        targetId: auth.currentUser.uid,
        summary: `Administrator signed out (${adminProfile.email})`,
        actorRole: adminProfile.role,
      });
    }
    await signOut(auth);
    setAdminProfile(null);
    setFirebaseUser(null);
  }, [adminProfile]);

  const can = useCallback(
    (permission: AdminPermissionKey) => hasAdminPermission(adminProfile?.role, permission),
    [adminProfile?.role]
  );

  return (
    <AdminAuthContext.Provider
      value={{
        firebaseUser,
        adminProfile,
        isLoadingAuth,
        authError,
        clearAuthError,
        loginWithEmailPassword,
        loginWithGoogle,
        requestPasswordReset,
        provisionInitialSuperAdmin,
        logoutAdmin,
        refreshAdminProfile,
        can,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return ctx;
}
