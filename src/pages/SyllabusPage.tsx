import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Download, Eye, Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { SeoHead } from '../components/common/SeoHead';
import { PageHeader } from '../components/common/PageHeader';
import { DocumentPreviewModal } from '../components/common/DocumentPreviewModal';

export const SyllabusPage: React.FC = () => {
  const { t, num } = useLanguage();
  const { academicResources, classes } = usePublicData();
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    url: string;
    type?: 'pdf' | 'image';
  } | null>(null);

  const publishedSyllabi = useMemo(
    () =>
      academicResources.filter(
        (r) => r.resourceType === 'syllabus' || r.resourceType === 'course_plan'
      ),
    [academicResources]
  );

  return (
    <>
      <SeoHead
        title={t('পাঠ্যক্রম, সিলেবাস ও কোর্স প্ল্যান', 'Syllabus & Course Plans')}
        description={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড-এর শ্রেণিভিত্তিক পাঠ্যক্রম, সিলেবাস ও কোর্স প্ল্যান ডাউনলোড করুন।',
          'Download official class syllabi, subject structures, and SSC 2026 course plans for BEPZA Public School and College, Ishwardi EPZ.'
        )}
      />

      <PageHeader
        titleBn="পাঠ্যক্রম, সিলেবাস ও কোর্স প্ল্যান"
        titleEn="Syllabus & Academic Course Plans"
        subtitleBn="জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB) অনুমোদিত পাঠ্যক্রম অনুযায়ী প্রকাশিত শ্রেণিভিত্তিক সিলেবাস ও কোর্স প্ল্যান।"
        subtitleEn="NCTB-aligned class syllabi, subject structure frameworks, and board examination marks distribution."
        breadcrumbs={[
          { labelBn: 'একাডেমিক', labelEn: 'Academic', to: '/academic' },
          { labelBn: 'সিলেবাস ও কোর্স প্ল্যান', labelEn: 'Syllabus' },
        ]}
      />

      <section className="py-10 sm:py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Official Downloadable PDFs */}
          <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#102B50]">
                  {t(
                    'প্রকাশিত পিডিএফ সিলেবাস ও কোর্স প্ল্যান',
                    'Published PDF Syllabi & Course Plans'
                  )}
                </h2>
                <p className="text-xs text-[#617187] mt-0.5 tabular-nums">
                  {t(
                    `মোট ডাউনলোডযোগ্য ডকুমেন্ট: ${num(publishedSyllabi.length)}টি`,
                    `Available official documents: ${publishedSyllabi.length}`
                  )}
                </p>
              </div>
              <Link
                to="/academic/classes"
                className="text-xs sm:text-sm font-semibold text-[#1F5FAF] hover:text-[#102B50] transition-colors self-start sm:self-auto"
              >
                {t('সকল শ্রেণির বিষয় তালিকা দেখুন →', 'View all class subject lists →')}
              </Link>
            </div>

            {/* Mobile Single-Column Cards (<768px) */}
            <div className="md:hidden divide-y divide-slate-100">
              {publishedSyllabi.map((item, idx) => (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#617187] tabular-nums">
                      <span className="font-semibold text-[#1F5FAF]">
                        #{num(String(idx + 1).padStart(2, '0'))}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-[#102B50]">
                        {t(item.classNameBn, item.classNameEn)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{num(item.publishDate)}</span>
                    </div>
                    <h3 className="text-sm font-bold text-[#17263C]">
                      {t(item.titleBn, item.titleEn)}
                    </h3>
                    <p className="text-xs text-[#617187]">
                      {item.resourceType === 'syllabus'
                        ? t('বার্ষিক সিলেবাস', 'Annual Syllabus')
                        : t('কোর্স প্ল্যান ও কাঠামো', 'Course Plan')}
                    </p>
                  </div>

                  {item.fileUrl && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewDoc({
                            title: t(item.titleBn, item.titleEn),
                            url: item.fileUrl!,
                            type: item.fileType,
                          })
                        }
                        className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                        <span>{t('দেখুন', 'Preview')}</span>
                      </button>
                      <a
                        href={item.fileUrl}
                        download
                        className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 shrink-0" />
                        <span>{t('ডাউনলোড', 'Download')}</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Tablet & Desktop Table (>=768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F6F8FC] border-b border-slate-200 text-xs font-semibold text-[#617187]">
                    <th className="py-3.5 px-5">{t('ক্রমিক', 'SL')}</th>
                    <th className="py-3.5 px-5">{t('শ্রেণি / স্তর', 'Class / Level')}</th>
                    <th className="py-3.5 px-5">{t('ডকুমেন্টের শিরোনাম', 'Document Title')}</th>
                    <th className="py-3.5 px-5">{t('ধরন', 'Type')}</th>
                    <th className="py-3.5 px-5">{t('প্রকাশের তারিখ', 'Publish Date')}</th>
                    <th className="py-3.5 px-5 text-right">{t('কার্যক্রম', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {publishedSyllabi.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-[#F6F8FC]/70 transition-colors">
                      <td className="py-4 px-5 font-medium text-[#617187] tabular-nums">
                        {num(String(idx + 1).padStart(2, '0'))}
                      </td>
                      <td className="py-4 px-5 font-semibold text-[#102B50] whitespace-nowrap">
                        {t(item.classNameBn, item.classNameEn)}
                      </td>
                      <td className="py-4 px-5 text-[#17263C]">
                        {t(item.titleBn, item.titleEn)}
                      </td>
                      <td className="py-4 px-5 text-xs text-[#617187] whitespace-nowrap">
                        {item.resourceType === 'syllabus'
                          ? t('বার্ষিক সিলেবাস', 'Annual Syllabus')
                          : t('কোর্স প্ল্যান ও কাঠামো', 'Course Plan')}
                      </td>
                      <td className="py-4 px-5 text-[#617187] tabular-nums whitespace-nowrap">
                        {num(item.publishDate)}
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        {item.fileUrl && (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewDoc({
                                  title: t(item.titleBn, item.titleEn),
                                  url: item.fileUrl!,
                                  type: item.fileType,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50] hover:text-[#1F5FAF] transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{t('দেখুন', 'Preview')}</span>
                            </button>
                            <a
                              href={item.fileUrl}
                              download
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{t('ডাউনলোড', 'Download')}</span>
                            </a>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Complete Nursery to Class 10 Curriculum Matrix */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-6 lg:p-7">
            <div className="flex items-start gap-3 pb-4 sm:pb-5 border-b border-slate-200">
              <BookOpen className="w-5 h-5 text-[#1F5FAF] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#102B50]">
                  {t(
                    'নার্সারি থেকে ১০ম শ্রেণি পর্যন্ত শ্রেণিভিত্তিক পাঠ্যবিষয় সারসংক্ষেপ',
                    'Class-Wise Curriculum Matrix (Nursery to Class 10)'
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-[#617187] mt-1">
                  {t(
                    'যে সকল শ্রেণির পৃথক পিডিএফ সিলেবাস এখনও ওয়েবসাইটে সংযুক্ত হয়নি, সেগুলো অ্যাডমিন প্যানেলের মাধ্যমে আপলোডের জন্য তালিকাভুক্ত রাখা হয়েছে।',
                    'Classes without standalone syllabus PDFs on the reference archive display verified NCTB subject structures and are queued for future Admin Panel upload.'
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="rounded-xl border border-slate-200/90 p-4 flex flex-col justify-between bg-[#F6F8FC]/50 h-full"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-[#617187]">
                      <span className="truncate">{t(cls.sectionGroupBn, cls.sectionGroupEn)}</span>
                      <span className="tabular-nums shrink-0">
                        {t(
                          `${num(cls.subjectsBn.length)}টি বিষয়`,
                          `${cls.subjectsEn.length} subjects`
                        )}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#102B50] mt-1">
                      {t(cls.nameBn, cls.nameEn)}
                    </h3>
                    <p className="text-xs text-[#617187] mt-2 leading-relaxed">
                      {langSubjects(cls, t).join(' · ')}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    {cls.syllabusUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewDoc({
                            title: `${t(cls.nameBn, cls.nameEn)} — ${t('সিলেবাস ও পাঠ্যক্রম', 'Syllabus')}`,
                            url: cls.syllabusUrl!,
                            type: 'pdf',
                          })
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F5FAF] hover:text-[#102B50] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                        <span>{t('পিডিএফ দেখুন', 'Preview PDF')}</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-[#617187] min-w-0">
                        <Info className="w-3.5 h-3.5 text-[#17A9C6] shrink-0" />
                        <span className="truncate">
                          {t(
                            'আপলোড প্রক্রিয়াধীন',
                            'Queued for upload'
                          )}
                        </span>
                      </span>
                    )}

                    {cls.routineUrl && (
                      <Link
                        to="/academic/class-routine"
                        className="text-xs font-medium text-[#102B50] hover:text-[#1F5FAF] transition-colors shrink-0"
                      >
                        {t('রুটিন', 'Routine')}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.title || ''}
        fileUrl={previewDoc?.url || ''}
        fileType={previewDoc?.type}
      />
    </>
  );
};

function langSubjects(
  cls: { subjectsBn: string[]; subjectsEn: string[] },
  t: (bn: string, en: string) => string
): string[] {
  return t('bn', 'en') === 'bn' ? cls.subjectsBn : cls.subjectsEn;
}
