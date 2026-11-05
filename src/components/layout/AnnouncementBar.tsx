import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, ChevronLeft, ChevronRight, Cloud } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePublicData } from '../../context/PublicDataContext';

export const AnnouncementBar: React.FC = () => {
  const { t, num } = useLanguage();
  const { notices, settings } = usePublicData();
  const [activeIndex, setActiveIndex] = useState(0);

  const featuredNotices = notices.filter((n) => n.isImportant).slice(0, 5);
  const items = featuredNotices.length > 0 ? featuredNotices : notices.slice(0, 4);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [items.length]);

  const current = items[activeIndex];

  return (
    <div className="bg-[#102B50] text-white border-b border-white/10 text-xs">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-1.5 sm:py-2 flex items-center justify-between gap-3">
        {/* Announcement Ticker */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-semibold text-[#17A9C6] tracking-wide whitespace-nowrap shrink-0">
            {t('বিজ্ঞপ্তি:', 'Notice:')}
          </span>
          {current ? (
            <Link
              to={`/notices/${current.id}`}
              className="text-slate-100 hover:text-white hover:underline truncate transition-colors min-w-0 flex-1"
            >
              {t(current.titleBn, current.titleEn)}
            </Link>
          ) : (
            <span className="text-slate-200 truncate min-w-0 flex-1">
              {t(
                'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড-এ স্বাগতম',
                'Welcome to BEPZA Public School and College, Ishwardi EPZ'
              )}
            </span>
          )}

          {items.length > 1 && (
            <div className="hidden sm:flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => (prev - 1 + items.length) % items.length)}
                aria-label={t('পূর্ববর্তী বিজ্ঞপ্তি', 'Previous announcement')}
                className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => (prev + 1) % items.length)}
                aria-label={t('পরবর্তী বিজ্ঞপ্তি', 'Next announcement')}
                className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Institutional Identifiers & Prominent Portal Quick Links */}
        <div className="hidden lg:flex items-center gap-3.5 shrink-0 text-slate-200 tabular-nums">
          <span className="whitespace-nowrap">
            EIIN: <strong className="text-white font-semibold">{num(settings.eiin)}</strong>
            <span className="mx-2 text-white/30">·</span>
            {t('স্থাপিত:', 'Est.')}{' '}
            <strong className="text-white font-semibold">{num(settings.establishedYear)}</strong>
          </span>
          <span className="text-white/25" aria-hidden="true">
            |
          </span>
          <Link
            to="/cloud"
            className="inline-flex items-center gap-1.5 text-white hover:text-[#17A9C6] font-medium transition-colors whitespace-nowrap"
          >
            <Cloud className="w-3.5 h-3.5 text-[#17A9C6]" />
            <span>{t('বিপিএসসি ক্লাউড', 'BPSC Cloud')}</span>
          </Link>
          <span className="text-white/25" aria-hidden="true">
            ·
          </span>
          <Link
            to="/result"
            className="inline-flex items-center gap-1.5 text-white hover:text-[#17A9C6] font-medium transition-colors whitespace-nowrap"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#17A9C6]" />
            <span>{t('ফলাফল', 'Result')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
