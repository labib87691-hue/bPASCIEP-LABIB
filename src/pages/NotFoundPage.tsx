import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SeoHead } from '../components/common/SeoHead';

export const NotFoundPage: React.FC = () => {
  const { t, num } = useLanguage();

  return (
    <>
      <SeoHead
        title={t('পৃষ্ঠা পাওয়া যায়নি (৪০৪)', 'Page Not Found (404)')}
        description={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড — কাঙ্ক্ষিত পৃষ্ঠাটি পাওয়া যায়নি।',
          'Requested page was not found on BEPZA Public School and College, Ishwardi EPZ.'
        )}
      />

      <section className="py-20 lg:py-28 bg-[#F6F8FC]">
        <div className="max-w-xl mx-auto px-4 text-center space-y-5">
          <p className="text-4xl sm:text-5xl font-bold text-[#1F5FAF] tabular-nums">
            {num('404')}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#102B50]">
            {t('কাঙ্ক্ষিত পৃষ্ঠাটি পাওয়া যায়নি', 'Requested Page Not Found')}
          </h1>
          <p className="text-sm sm:text-base text-[#617187] leading-relaxed">
            {t(
              'আপনি যে ঠিকানায় প্রবেশ করতে চেয়েছেন তা পরিবর্তন করা হয়েছে অথবা সঠিক নয়। মূল পাতায় বা নোটিশ বোর্ডে ফিরে যান।',
              'The page address you entered may have moved or does not exist. Use the links below to return to the homepage or official Notice Board.'
            )}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-sm font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('প্রচ্ছদ পাতায় ফিরুন', 'Back to Homepage')}</span>
            </Link>
            <Link
              to="/notices"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 bg-white hover:border-[#1F5FAF] text-sm font-semibold text-[#102B50] transition-colors"
            >
              <Bell className="w-4 h-4 text-[#1F5FAF]" />
              <span>{t('নোটিশ বোর্ড', 'Notice Board')}</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};
