import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { GalleryCategory } from '../types/school';
import { SeoHead } from '../components/common/SeoHead';
import { PageHeader } from '../components/common/PageHeader';
import { SmartImage } from '../components/common/SmartImage';

export const GalleryPage: React.FC = () => {
  const { t, num } = useLanguage();
  const { gallery } = usePublicData();
  const [selectedCategory, setSelectedCategory] = useState<'all' | GalleryCategory>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories: { key: 'all' | GalleryCategory; labelBn: string; labelEn: string }[] = [
    { key: 'all', labelBn: 'সকল ছবি', labelEn: 'All Photographs' },
    { key: 'campus', labelBn: 'ক্যাম্পাস ও ভবন', labelEn: 'Campus & Architecture' },
    { key: 'science_fair', labelBn: 'বিজ্ঞান মেলা ও উদ্ভাবন', labelEn: 'Science Fair & Innovation' },
    { key: 'guardians_meeting', labelBn: 'অভিভাবক সমাবেশ', labelEn: 'Guardian Assembly' },
    { key: 'events', labelBn: 'অনুষ্ঠান ও সহশিক্ষা', labelEn: 'Events & Co-Curricular' },
    { key: 'cultural', labelBn: 'সাংস্কৃতিক অনুষ্ঠান', labelEn: 'Cultural Programs' },
    { key: 'transport', labelBn: 'পরিবহন সেবা', labelEn: 'Student Transport' },
  ];

  const filteredPhotos = useMemo(() => {
    if (selectedCategory === 'all') return gallery;
    return gallery.filter((p) => p.category === selectedCategory);
  }, [gallery, selectedCategory]);

  const categoryText = (cat: GalleryCategory) => {
    const found = categories.find((c) => c.key === cat);
    return found ? t(found.labelBn, found.labelEn) : cat;
  };

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const showPrev = useCallback(() => {
    setLightboxIndex((prev) => {
      if (prev === null || filteredPhotos.length === 0) return null;
      return (prev - 1 + filteredPhotos.length) % filteredPhotos.length;
    });
  }, [filteredPhotos.length]);

  const showNext = useCallback(() => {
    setLightboxIndex((prev) => {
      if (prev === null || filteredPhotos.length === 0) return null;
      return (prev + 1) % filteredPhotos.length;
    });
  }, [filteredPhotos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, closeLightbox, showPrev, showNext]);

  const activePhoto =
    lightboxIndex !== null && filteredPhotos[lightboxIndex]
      ? filteredPhotos[lightboxIndex]
      : null;

  return (
    <>
      <SeoHead
        title={t('ফটো গ্যালারি ও ক্যাম্পাস অ্যালবাম', 'Photo Gallery')}
        description={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড-এর ক্যাম্পাস, বিজ্ঞান মেলা, অভিভাবক সমাবেশ, সাংস্কৃতিক অনুষ্ঠান ও সহশিক্ষা কার্যক্রমের আলোকচিত্র।',
          'Authentic photographs of BEPZA Public School and College, Ishwardi EPZ campus, science fairs, guardian assemblies, cultural celebrations, and student transport.'
        )}
      />

      <PageHeader
        titleBn="ফটো গ্যালারি"
        titleEn="Institutional Photo Gallery"
        subtitleBn="ক্যাম্পাস প্রাঙ্গণ, বিজ্ঞান ও উদ্ভাবনী প্রদর্শনী, অভিভাবক সমাবেশ এবং সাংস্কৃতিক অনুষ্ঠানের প্রামাণ্য আলোকচিত্র।"
        subtitleEn="Authentic photographic archive of campus architecture, district champion science showcases, guardian assemblies, and cultural life."
        breadcrumbs={[{ labelBn: 'গ্যালারি', labelEn: 'Gallery' }]}
      />

      <section className="py-10 sm:py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          {/* Category Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => {
                const active = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.key);
                      setLightboxIndex(null);
                    }}
                    className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-[#102B50] text-white'
                        : 'bg-[#F6F8FC] text-[#17263C] hover:bg-slate-200/70'
                    }`}
                  >
                    {t(cat.labelBn, cat.labelEn)}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-[#617187] tabular-nums shrink-0">
              {t(
                `মোট আলোকচিত্র: ${num(filteredPhotos.length)}টি`,
                `${filteredPhotos.length} photographs`
              )}
            </p>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredPhotos.map((photo, index) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="group h-full flex flex-col text-left bg-white rounded-xl border border-slate-200/90 overflow-hidden hover:border-[#1F5FAF]/60 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1F5FAF]"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden shrink-0">
                  <SmartImage
                    src={photo.imageUrl}
                    alt={t(photo.titleBn, photo.titleEn)}
                    className="w-full h-full"
                    imgClassName="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-[#102B50]/0 group-hover:bg-[#102B50]/30 transition-colors flex items-end justify-end p-3">
                    <span className="w-9 h-9 rounded-lg bg-white/95 text-[#102B50] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs">
                      <Expand className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-1 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-[#617187] tabular-nums">
                    {categoryText(photo.category)} · {num(photo.dateLabel)}
                  </p>
                  <h2 className="text-sm sm:text-base font-semibold text-[#102B50] line-clamp-2 leading-snug">
                    {t(photo.titleBn, photo.titleEn)}
                  </h2>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {activePhoto && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/92 backdrop-blur-xs flex flex-col justify-between p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={t(activePhoto.titleBn, activePhoto.titleEn)}
          onClick={closeLightbox}
        >
          <div
            className="flex items-center justify-between text-white max-w-6xl w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs sm:text-sm text-slate-200 tabular-nums">
              {num(lightboxIndex + 1)} / {num(filteredPhotos.length)} ·{' '}
              {categoryText(activePhoto.category)}
            </span>
            <button
              type="button"
              onClick={closeLightbox}
              aria-label={t('বন্ধ করুন', 'Close lightbox')}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className="relative flex-1 flex items-center justify-center max-w-6xl w-full mx-auto my-4 min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            {filteredPhotos.length > 1 && (
              <button
                type="button"
                onClick={showPrev}
                aria-label={t('পূর্ববর্তী ছবি', 'Previous photo')}
                className="absolute left-0 sm:left-2 z-10 p-2.5 rounded-lg bg-[#102B50]/80 hover:bg-[#1F5FAF] text-white border border-white/15 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <img
              src={activePhoto.imageUrl}
              alt={t(activePhoto.titleBn, activePhoto.titleEn)}
              referrerPolicy="no-referrer"
              className="max-h-[74dvh] max-w-full object-contain rounded-lg shadow-2xl"
            />

            {filteredPhotos.length > 1 && (
              <button
                type="button"
                onClick={showNext}
                aria-label={t('পরবর্তী ছবি', 'Next photo')}
                className="absolute right-0 sm:right-2 z-10 p-2.5 rounded-lg bg-[#102B50]/80 hover:bg-[#1F5FAF] text-white border border-white/15 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          <div
            className="max-w-3xl w-full mx-auto text-center space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm sm:text-base font-semibold text-white">
              {t(activePhoto.titleBn, activePhoto.titleEn)}
            </p>
            <p className="text-xs text-slate-300 tabular-nums">{num(activePhoto.dateLabel)}</p>
          </div>
        </div>
      )}
    </>
  );
};
