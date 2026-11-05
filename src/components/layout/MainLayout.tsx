import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnnouncementBar } from './AnnouncementBar';
import { Header } from './Header';
import { Footer } from './Footer';
import { SearchModal } from '../common/SearchModal';
import { usePublicData } from '../../context/PublicDataContext';
import { useLanguage } from '../../context/LanguageContext';

export const MainLayout: React.FC = () => {
  const { pathname } = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const { firebaseStatus } = usePublicData();
  const { t } = useLanguage();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FC] print:bg-white text-[#17263C]">
      {firebaseStatus === 'unconfigured' && (
        <div className="no-print bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 text-center">
          {t(
            'ক্লাউড ডাটাবেস (Firebase) সংযোগ কনফিগার করা নেই — যাচাইকৃত প্রাতিষ্ঠানিক তথ্য প্রদর্শিত হচ্ছে।',
            'Firebase credentials are not configured — displaying verified institutional baseline content.'
          )}
        </div>
      )}

      <div className="no-print contents">
        <AnnouncementBar />
        <Header onOpenSearch={() => setSearchOpen(true)} />
      </div>

      <main className="flex-1">
        <Outlet />
      </main>

      <div className="no-print">
        <Footer />
      </div>
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};
