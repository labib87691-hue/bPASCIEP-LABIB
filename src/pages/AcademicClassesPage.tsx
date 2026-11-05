import React, { useMemo, useState } from 'react';
import { Download, Eye } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { SeoHead } from '../components/common/SeoHead';
import { PageHeader } from '../components/common/PageHeader';
import { DocumentPreviewModal } from '../components/common/DocumentPreviewModal';

export const AcademicClassesPage: React.FC = () => {
  const { t, num } = useLanguage();
  const { classes } = usePublicData();
  const [groupFilter, setGroupFilter] = useState<'all' | 'pre_primary' | 'primary' | 'junior' | 'secondary'>('all');
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);

  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      if (groupFilter === 'all') return true;
      if (groupFilter === 'pre_primary') return cls.levelOrder === 0;
      if (groupFilter === 'primary') return cls.levelOrder >= 1 && cls.levelOrder <= 5;
      if (groupFilter === 'junior') return cls.levelOrder >= 6 && cls.levelOrder <= 8;
      return cls.levelOrder >= 9;
    });
  }, [classes, groupFilter]);

  return (
    <>
      <SeoHead
        title={t('শ্রেণিসমূহ (নার্সারি – দশম শ্রেণি)', 'Academic Classes (Nursery to Class 10)')}
        description={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড-এ নার্সারি থেকে দশম শ্রেণি পর্যন্ত পাঠদানের স্তর ও বিষয়সমূহ।',
          'Explore Nursery, Primary (Classes 1–5), Junior Secondary (Classes 6–8), and Secondary (Classes 9–10) programs at BPSC, Ishwardi EPZ.'
        )}
      />

      <PageHeader
        titleBn="শ্রেণিসমূহ (নার্সারি থেকে দশম শ্রেণি)"
        titleEn="Academic Classes (Nursery to Class 10)"
        subtitleBn="প্রতিটি শ্রেণির পাঠ্যবিষয়, শাখা পরিচিতি এবং সংশ্লিষ্ট ক্লাস রুটিন ও সিলেবাসের সমন্বিত তালিকা।"
        subtitleEn="Structured academic progression across Pre-Primary, Primary, Junior Secondary, and Secondary levels."
        breadcrumbs={[
          { labelBn: 'একাডেমিক', labelEn: 'Academic', to: '/academic' },
          { labelBn: 'শ্রেণিসমূহ', labelEn: 'Classes' },
        ]}
      />

      <section className="py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Interactive Section Filter */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {[
              { id: 'all', bn: 'সকল শ্রেণি (১১টি স্তর)', en: 'All Levels (11)' },
              { id: 'pre_primary', bn: 'প্রাক-প্রাথমিক (নার্সারি)', en: 'Pre-Primary (Nursery)' },
              { id: 'primary', bn: 'প্রাথমিক (১ম – ৫ম শ্রেণি)', en: 'Primary (Classes 1–5)' },
              { id: 'junior', bn: 'নিম্ন মাধ্যমিক (৬ষ্ঠ – ৮ম শ্রেণি)', en: 'Junior Secondary (6–8)' },
              { id: 'secondary', bn: 'মাধ্যমিক (৯ম – ১০ম শ্রেণি)', en: 'Secondary (Classes 9–10)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setGroupFilter(tab.id as typeof groupFilter)}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                  groupFilter === tab.id
                    ? 'bg-[#102B50] text-white'
                    : 'bg-white border border-slate-200 text-[#617187] hover:text-[#102B50]'
                }`}
              >
                {t(tab.bn, tab.en)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredClasses.map((cls) => (
              <article
                key={cls.id}
                className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-7 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#617187] tabular-nums">
                    <span className="font-semibold text-[#1F5FAF]">
                      {t(cls.sectionGroupBn, cls.sectionGroupEn)}
                    </span>
                    <span>
                      {cls.levelOrder === 0
                        ? t('প্রারম্ভিক স্তর', 'Foundational')
                        : `${t('স্তর', 'Level')} ${num(cls.levelOrder)}`}
                    </span>
                  </div>

                  <h2 className="mt-1.5 text-xl sm:text-2xl font-bold text-[#102B50]">
                    {t(cls.nameBn, cls.nameEn)}
                  </h2>

                  <p className="mt-2.5 text-sm text-[#617187] leading-relaxed">
                    {t(cls.descriptionBn, cls.descriptionEn)}
                  </p>

                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-semibold text-[#102B50] mb-2">
                      {t('প্রধান পঠিত বিষয়সমূহ:', 'Core Subjects Taught:')}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#617187] leading-relaxed">
                      {(t('bn', 'en') === 'bn' ? cls.subjectsBn : cls.subjectsEn).join(' · ')}
                    </p>
                  </div>
                </div>

                {(cls.routineUrl || cls.syllabusUrl) && (
                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                    {cls.routineUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewDoc({
                            title: `${t(cls.nameBn, cls.nameEn)} — ${t('ক্লাস রুটিন', 'Class Routine')}`,
                            url: cls.routineUrl!,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t('ক্লাস রুটিন দেখুন', 'View Routine')}</span>
                      </button>
                    )}

                    {cls.syllabusUrl && (
                      <a
                        href={cls.syllabusUrl}
                        download
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50] hover:text-[#1F5FAF] transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t('সিলেবাস / কাঠামো PDF', 'Syllabus / Structure PDF')}</span>
                      </a>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.title || ''}
        fileUrl={previewDoc?.url || ''}
        fileType="pdf"
      />
    </>
  );
};
