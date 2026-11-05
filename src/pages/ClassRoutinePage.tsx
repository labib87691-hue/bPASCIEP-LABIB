import React, { useMemo, useState } from 'react';
import { Download, Eye, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { SeoHead } from '../components/common/SeoHead';
import { PageHeader } from '../components/common/PageHeader';
import { DocumentPreviewModal } from '../components/common/DocumentPreviewModal';

export const ClassRoutinePage: React.FC = () => {
  const { t, num } = useLanguage();
  const { academicResources } = usePublicData();
  const [query, setQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);

  const routines = useMemo(() => {
    const all = academicResources.filter((r) => r.resourceType === 'class_routine');
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (r) =>
        r.titleBn.toLowerCase().includes(q) ||
        r.titleEn.toLowerCase().includes(q) ||
        r.classNameBn.toLowerCase().includes(q) ||
        r.classNameEn.toLowerCase().includes(q)
    );
  }, [academicResources, query]);

  return (
    <>
      <SeoHead
        title={t('ক্লাস রুটিন (১ম – ১০ম শ্রেণি)', 'Class Routine (Classes 1 to 10)')}
        description={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড-এর ১ম থেকে ১০ম শ্রেণি পর্যন্ত অফিসিয়াল পিডিএফ ক্লাস রুটিন।',
          'Download and preview official PDF class routines for Classes 1 to 10 at BEPZA Public School and College, Ishwardi EPZ.'
        )}
      />

      <PageHeader
        titleBn="ক্লাস রুটিন"
        titleEn="Official Class Routines"
        subtitleBn="প্রথম শ্রেণি থেকে দশম শ্রেণি পর্যন্ত প্রকাশিত অফিসিয়াল ক্লাস রুটিন অনলাইনে দেখুন অথবা পিডিএফ ডাউনলোড করুন।"
        subtitleEn="View inline or download official PDF class timetables published by BPSC Administration."
        breadcrumbs={[
          { labelBn: 'একাডেমিক', labelEn: 'Academic', to: '/academic' },
          { labelBn: 'ক্লাস রুটিন', labelEn: 'Class Routine' },
        ]}
      />

      <section className="py-10 sm:py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#102B50]">
                  {t('শ্রেণিভিত্তিক ক্লাস রুটিন তালিকা', 'Published Class Timetables')}
                </h2>
                <p className="text-xs text-[#617187] mt-0.5 tabular-nums">
                  {t(
                    `মোট প্রকাশিত রুটিন: ${num(routines.length)}টি`,
                    `Total published routines: ${routines.length}`
                  )}
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#617187] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('শ্রেণির নাম লিখুন...', 'Filter by class name...')}
                  className="w-full min-h-[40px] pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-[#F6F8FC] focus:bg-white focus:border-[#1F5FAF] focus:outline-none"
                />
              </div>
            </div>

            {routines.length === 0 ? (
              <div className="p-10 text-center text-sm text-[#617187]">
                {t('কোনো ক্লাস রুটিন পাওয়া যায়নি।', 'No matching class routine found.')}
              </div>
            ) : (
              <>
                {/* Mobile Single-Column Cards (<768px) — Zero horizontal table scroll */}
                <div className="md:hidden divide-y divide-slate-100">
                  {routines.map((item, idx) => (
                    <div key={item.id} className="p-4 space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-[#617187] tabular-nums">
                          <span className="font-semibold text-[#1F5FAF]">
                            #{num(String(idx + 1).padStart(2, '0'))}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-[#102B50]">
                            {t(item.classNameBn, item.classNameEn)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{num(item.publishDate)}</span>
                        </div>
                        <h3 className="text-sm font-bold text-[#17263C]">
                          {t(item.titleBn, item.titleEn)}
                        </h3>
                      </div>

                      {item.fileUrl && (
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({
                                title: t(item.titleBn, item.titleEn),
                                url: item.fileUrl!,
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

                {/* Tablet, Laptop & Desktop Table (>=768px) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F6F8FC] border-b border-slate-200 text-xs font-semibold text-[#617187]">
                        <th className="py-3.5 px-5">{t('ক্রমিক', 'SL')}</th>
                        <th className="py-3.5 px-5">{t('শ্রেণি', 'Class')}</th>
                        <th className="py-3.5 px-5">{t('রুটিনের শিরোনাম', 'Routine Title')}</th>
                        <th className="py-3.5 px-5">{t('প্রকাশের তারিখ', 'Publish Date')}</th>
                        <th className="py-3.5 px-5 text-right">{t('কার্যক্রম', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {routines.map((item, idx) => (
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
              </>
            )}
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
