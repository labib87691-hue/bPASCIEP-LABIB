import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { VERIFIED_CALENDAR_EVENTS } from '../data/verifiedSchoolData';
import { CalendarEventItem } from '../types/school';
import { SeoHead } from '../components/common/SeoHead';
import { PageHeader } from '../components/common/PageHeader';

type FilterType = 'all' | CalendarEventItem['type'];

export const AcademicCalendarPage: React.FC = () => {
  const { t, num } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filterTabs: { key: FilterType; labelBn: string; labelEn: string }[] = [
    { key: 'all', labelBn: 'সকল কার্যক্রম', labelEn: 'All Milestones' },
    { key: 'academic', labelBn: 'একাডেমিক পাঠদান', labelEn: 'Academic' },
    { key: 'examination', labelBn: 'পরীক্ষা ও মূল্যায়ন', labelEn: 'Examinations' },
    { key: 'admission', labelBn: 'ভর্তি কার্যক্রম', labelEn: 'Admission' },
    { key: 'cultural', labelBn: 'জাতীয় ও সাংস্কৃতিক দিবস', labelEn: 'National & Cultural' },
  ];

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') return VERIFIED_CALENDAR_EVENTS;
    return VERIFIED_CALENDAR_EVENTS.filter((item) => item.type === activeFilter);
  }, [activeFilter]);

  const typeLabel = (type: CalendarEventItem['type']) => {
    switch (type) {
      case 'academic':
        return t('একাডেমিক কার্যক্রম', 'Academic');
      case 'examination':
        return t('পরীক্ষা ও মূল্যায়ন', 'Examination');
      case 'admission':
        return t('ভর্তি ও সেশন নবায়ন', 'Admission');
      case 'cultural':
        return t('জাতীয় ও সাংস্কৃতিক অনুষ্ঠান', 'National & Cultural');
    }
  };

  return (
    <>
      <SeoHead
        title={t('একাডেমিক ক্যালেন্ডার ও বার্ষিক কর্মপরিকল্পনা', 'Academic Calendar')}
        description={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড-এর শিক্ষাবর্ষের পরীক্ষা, ভর্তি ও সাংস্কৃতিক কার্যক্রমের বার্ষিক বর্ষপঞ্জি।',
          'Annual academic calendar covering classes, mid-term and final examinations, admission cycles, and cultural observances at BPSC, Ishwardi EPZ.'
        )}
      />

      <PageHeader
        titleBn="একাডেমিক ক্যালেন্ডার"
        titleEn="Academic Calendar"
        subtitleBn="শিক্ষাবর্ষের পাঠদান, পর্বভিত্তিক পরীক্ষা, অভিভাবক সমাবেশ, জাতীয় দিবস উদযাপন এবং ভর্তি কার্যক্রমের সময়সূচি।"
        subtitleEn="Institutional schedule of academic sessions, mid-term and final evaluations, guardian assemblies, and cultural milestones."
        breadcrumbs={[
          { labelBn: 'একাডেমিক', labelEn: 'Academic', to: '/academic' },
          { labelBn: 'একাডেমিক ক্যালেন্ডার', labelEn: 'Academic Calendar' },
        ]}
      />

      <section className="py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Interactive Filter Controls */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2" role="tablist">
              {filterTabs.map((tab) => {
                const isActive = activeFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveFilter(tab.key)}
                    className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#102B50] text-white'
                        : 'bg-[#F6F8FC] text-[#17263C] hover:bg-slate-200/70'
                    }`}
                  >
                    {t(tab.labelBn, tab.labelEn)}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-[#617187] tabular-nums shrink-0">
              {t(
                `প্রদর্শিত পর্ব: ${num(filteredEvents.length)}টি`,
                `Showing ${filteredEvents.length} milestones`
              )}
            </p>
          </div>

          {/* Calendar Timeline Cards */}
          <div className="bg-white rounded-xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden">
            {filteredEvents.map((event, index) => (
              <div
                key={event.id}
                className="p-5 sm:p-6 hover:bg-[#F6F8FC]/60 transition-colors grid grid-cols-1 md:grid-cols-12 gap-4 items-start"
              >
                <div className="md:col-span-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#1F5FAF] tabular-nums">
                    <Calendar className="w-3.5 h-3.5 text-[#17A9C6]" />
                    <span>{t(event.monthBn, event.monthEn)}</span>
                  </div>
                  <p className="text-xs text-[#617187] tabular-nums">
                    {t(event.dateLabelBn, event.dateLabelEn)}
                  </p>
                </div>

                <div className="md:col-span-9 space-y-1.5">
                  <div className="text-xs font-medium text-[#617187] tabular-nums">
                    <span>{num(String(index + 1).padStart(2, '0'))}</span>
                    <span className="mx-2" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-[#102B50] font-semibold">{typeLabel(event.type)}</span>
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-[#102B50]">
                    {t(event.titleBn, event.titleEn)}
                  </h2>

                  <p className="text-sm text-[#617187] leading-relaxed">
                    {t(event.descriptionBn, event.descriptionEn)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Official Government Holiday Notice Note */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <h3 className="text-sm sm:text-base font-bold text-[#102B50]">
                {t(
                  'সরকারি ছুটি ও তাৎক্ষণিক সময়সূচি পরিবর্তন',
                  'Government Holidays & Official Schedule Updates'
                )}
              </h3>
              <p className="text-xs sm:text-sm text-[#617187] leading-relaxed">
                {t(
                  'শিক্ষা মন্ত্রণালয় ও মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড, রাজশাহী কর্তৃক নির্ধারিত ছুটির তালিকা অনুসরণ করা হয়। যেকোনো জরুরি ছুটি বা পরীক্ষার তারিখ পরিবর্তনের বিজ্ঞপ্তি নোটিশ বোর্ডে প্রকাশিত হয়।',
                  'BPSC follows the official holiday calendar issued by the Ministry of Education and Rajshahi Education Board. Any schedule adjustments are published on the Notice Board.'
                )}
              </p>
            </div>
            <Link
              to="/notices"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs sm:text-sm font-semibold transition-colors self-start sm:self-auto shrink-0"
            >
              <span>{t('নোটিশ বোর্ড দেখুন', 'Visit Notice Board')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};
