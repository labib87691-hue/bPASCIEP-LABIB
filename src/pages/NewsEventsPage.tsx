import React, { useMemo, useState } from 'react';
import { Award, Calendar, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { NewsEventItem } from '../types/school';
import { SeoHead } from '../components/common/SeoHead';
import { PageHeader } from '../components/common/PageHeader';
import { SmartImage } from '../components/common/SmartImage';

export const NewsEventsPage: React.FC = () => {
  const { t, num } = useLanguage();
  const { newsEvents } = usePublicData();
  const [filter, setFilter] = useState<'all' | 'achievement' | 'event'>('all');
  const [selectedEvent, setSelectedEvent] = useState<NewsEventItem | null>(null);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>('');

  const filteredItems = useMemo(() => {
    if (filter === 'all') return newsEvents;
    return newsEvents.filter((item) => item.type === filter);
  }, [newsEvents, filter]);

  const openEventModal = (item: NewsEventItem) => {
    setSelectedEvent(item);
    setSelectedPhotoUrl(item.imageUrl);
  };

  return (
    <>
      <SeoHead
        title={t('সংবাদ, অনুষ্ঠান ও বিশেষ অর্জন', 'News, Events & Achievements')}
        description={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড-এর বিজ্ঞান উদ্ভাবনে জেলা পর্যায়ে ১ম স্থান অর্জন, অভিভাবক সমাবেশ ও সাংস্কৃতিক কার্যক্রম।',
          'Verified achievements, science fair championships, guardian assemblies, and cultural events at BEPZA Public School and College, Ishwardi EPZ.'
        )}
      />

      <PageHeader
        titleBn="সংবাদ, অনুষ্ঠান ও বিশেষ অর্জন"
        titleEn="News, Events & Institutional Achievements"
        subtitleBn="শিক্ষার্থীদের উদ্ভাবনী সাফল্য, অভিভাবক সমাবেশ, বিজ্ঞান মেলা এবং সহশিক্ষা কার্যক্রমের বিস্তারিত প্রতিবেদন।"
        subtitleEn="Verified coverage of district-level science championships, guardian assemblies, and campus cultural celebrations."
        breadcrumbs={[{ labelBn: 'সংবাদ ও ইভেন্ট', labelEn: 'News & Events' }]}
      />

      <section className="py-10 sm:py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'all' as const, bn: 'সকল সংবাদ ও অনুষ্ঠান', en: 'All News & Events' },
                { key: 'achievement' as const, bn: 'বিশেষ অর্জন', en: 'Achievements' },
                { key: 'event' as const, bn: 'ক্যাম্পাস অনুষ্ঠান', en: 'Campus Events' },
              ].map((btn) => (
                <button
                  key={btn.key}
                  type="button"
                  onClick={() => setFilter(btn.key)}
                  className={`min-h-[38px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                    filter === btn.key
                      ? 'bg-[#102B50] text-white'
                      : 'bg-[#F6F8FC] text-[#17263C] hover:bg-slate-200/70'
                  }`}
                >
                  {t(btn.bn, btn.en)}
                </button>
              ))}
            </div>

            <span className="text-xs text-[#617187] tabular-nums">
              {t(
                `প্রদর্শিত প্রতিবেদন: ${num(filteredItems.length)}টি`,
                `${filteredItems.length} published reports`
              )}
            </span>
          </div>

          {/* Editorial Feature List */}
          <div className="space-y-5 sm:space-y-6">
            {filteredItems.map((item) => {
              const allPhotos = [item.imageUrl, ...(item.extraImages || [])];
              return (
                <article
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12"
                >
                  <div className="lg:col-span-5">
                    <SmartImage
                      src={item.imageUrl}
                      alt={t(item.titleBn, item.titleEn)}
                      className="w-full aspect-[16/10] lg:h-full lg:max-h-[320px]"
                      imgClassName="w-full h-full object-cover"
                    />
                  </div>

                  <div className="lg:col-span-7 p-5 sm:p-7 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-[#617187] tabular-nums">
                        <span className="inline-flex items-center gap-1.5 text-[#1F5FAF] font-semibold">
                          {item.type === 'achievement' ? (
                            <Award className="w-3.5 h-3.5 text-[#17A9C6] shrink-0" />
                          ) : (
                            <Calendar className="w-3.5 h-3.5 text-[#17A9C6] shrink-0" />
                          )}
                          <span>{t(item.categoryBn, item.categoryEn)}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <time dateTime={item.publishDate}>{num(item.publishDate)}</time>
                      </div>

                      <h2 className="text-base sm:text-xl font-bold text-[#102B50] leading-snug">
                        {t(item.titleBn, item.titleEn)}
                      </h2>

                      <p className="text-sm text-[#17263C] leading-relaxed">
                        {t(item.detailsBn, item.detailsEn)}
                      </p>
                    </div>

                    <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      {allPhotos.length > 1 ? (
                        <div className="flex items-center gap-2">
                          {allPhotos.slice(0, 4).map((imgUrl, idx) => (
                            <button
                              key={imgUrl}
                              type="button"
                              onClick={() => {
                                setSelectedEvent(item);
                                setSelectedPhotoUrl(imgUrl);
                              }}
                              className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-slate-200 hover:border-[#1F5FAF] transition-colors shrink-0"
                              aria-label={`${t('ছবি দেখুন', 'View photo')} ${idx + 1}`}
                            >
                              <SmartImage
                                src={imgUrl}
                                alt={t(item.titleBn, item.titleEn)}
                                className="w-full h-full"
                              />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-[#617187]">
                          {t('প্রামাণ্য ক্যাম্পাস প্রতিবেদন', 'Verified Institutional Report')}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => openEventModal(item)}
                        className="inline-flex items-center gap-1.5 min-h-[38px] px-4 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold transition-colors"
                      >
                        <span>
                          {allPhotos.length > 1
                            ? t(
                                `সম্পূর্ণ প্রতিবেদন ও ${num(allPhotos.length)}টি ছবি`,
                                `Full Story & ${allPhotos.length} Photos`
                              )
                            : t('বিস্তারিত দেখুন', 'View Full Report')}
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Event Reader & Multi-Photo Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={t(selectedEvent.titleBn, selectedEvent.titleEn)}
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-xl border border-slate-200 max-w-4xl w-full max-h-[90dvh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-[#617187] tabular-nums">
                  {t(selectedEvent.categoryBn, selectedEvent.categoryEn)} ·{' '}
                  {num(selectedEvent.publishDate)}
                </p>
                <h3 className="text-sm sm:text-lg font-bold text-[#102B50] truncate">
                  {t(selectedEvent.titleBn, selectedEvent.titleEn)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                aria-label={t('বন্ধ করুন', 'Close')}
                className="p-2 rounded-lg text-[#617187] hover:text-[#102B50] hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-7 space-y-5">
              <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={selectedPhotoUrl || selectedEvent.imageUrl}
                  alt={t(selectedEvent.titleBn, selectedEvent.titleEn)}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-[420px] object-contain mx-auto bg-slate-950/5"
                />
              </div>

              {selectedEvent.extraImages && selectedEvent.extraImages.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {[selectedEvent.imageUrl, ...selectedEvent.extraImages].map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setSelectedPhotoUrl(url)}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedPhotoUrl === url
                          ? 'border-[#1F5FAF]'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={url}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-3 text-sm sm:text-base text-[#17263C] leading-relaxed">
                <p className="font-semibold text-[#102B50]">
                  {t(selectedEvent.summaryBn, selectedEvent.summaryEn)}
                </p>
                <p>{t(selectedEvent.detailsBn, selectedEvent.detailsEn)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
