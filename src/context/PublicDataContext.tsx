import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  DEFAULT_PUBLIC_HOLIDAYS,
  DEFAULT_SITE_CONTENT_BLOCKS,
  loadPublicSiteBundle,
  PublicSiteBundle,
} from '../services/publicContentService';
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
import { isFirebaseConfigured, testFirestoreConnection } from '../lib/firebase';

interface PublicDataContextValue extends PublicSiteBundle {
  isLoading: boolean;
  error: string | null;
  firebaseStatus: 'checking' | 'connected' | 'unconfigured' | 'offline';
  refreshData: () => Promise<void>;
}

const initialBundle: PublicSiteBundle = {
  settings: VERIFIED_SITE_SETTINGS,
  siteContent: DEFAULT_SITE_CONTENT_BLOCKS,
  banners: VERIFIED_BANNERS,
  administration: VERIFIED_ADMINISTRATION,
  governingBody: VERIFIED_GOVERNING_BODY,
  teachers: VERIFIED_TEACHERS,
  staff: VERIFIED_STAFF,
  classes: VERIFIED_CLASSES,
  academicResources: VERIFIED_ACADEMIC_RESOURCES,
  notices: VERIFIED_NOTICES,
  gallery: VERIFIED_GALLERY,
  newsEvents: VERIFIED_NEWS_EVENTS,
  facilities: VERIFIED_FACILITIES,
  transport: VERIFIED_TRANSPORT,
  holidays: DEFAULT_PUBLIC_HOLIDAYS,
};

const PublicDataContext = createContext<PublicDataContextValue | undefined>(undefined);

export const PublicDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bundle, setBundle] = useState<PublicSiteBundle>(initialBundle);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [firebaseStatus, setFirebaseStatus] = useState<
    'checking' | 'connected' | 'unconfigured' | 'offline'
  >(isFirebaseConfigured ? 'checking' : 'unconfigured');

  const refreshData = async () => {
    if (!isFirebaseConfigured) {
      setFirebaseStatus('unconfigured');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [connState, liveBundle] = await Promise.all([
        testFirestoreConnection(),
        loadPublicSiteBundle(),
      ]);
      setFirebaseStatus(connState);
      setBundle(liveBundle);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync public content');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshData();
  }, []);

  return (
    <PublicDataContext.Provider
      value={{
        ...bundle,
        isLoading,
        error,
        firebaseStatus,
        refreshData,
      }}
    >
      {children}
    </PublicDataContext.Provider>
  );
};

export function usePublicData(): PublicDataContextValue {
  const ctx = useContext(PublicDataContext);
  if (!ctx) {
    throw new Error('usePublicData must be used within PublicDataProvider');
  }
  return ctx;
}
