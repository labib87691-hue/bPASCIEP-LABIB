import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Download, Eye, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { NoticeCategory } from '../types/school';
import { SeoHead } from '../components/common/SeoHead';
import { PageHeader } from '../components/common/PageHeader';
import { DocumentPreviewModal } from '../components/common/DocumentPreviewModal';

const PAGE_SIZE = 6;

const VALID_CATEGORIES: NoticeCategory[] = [
  'examination',
  'admission',
  'recruitment',
  'academic',
  'general',
];

export const NoticesPage: React.FC = () => {
  const { t, num } = useLanguage();
  const { notices } = usePublicData();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCat = searchParams.get('category');
  const [category, setCategory] = useState<'all' | NoticeCategory>(
    initialCat && VALID_CATEGORIES.includes(initialCat as NoticeCategory)
      ? (initialCat as NoticeCategory)
      : 'all'
  );
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    url: string;
    type?: 'pdf' | 'image';
  } | null>(null);

  useEffect(() => {
    const paramCat = searchParams.get('category');
    if (paramCat && VALID_CATEGORIES.includes(paramCat as NoticeCategory)) {
      setCategory(paramCat as NoticeCategory);
    } else if (!paramCat) {
      setCategory('all');
    }
  }, [searchParams]);

  const handleCategoryChange = (next: 'all' | NoticeCategory) => {
    setCategory(next);
    setCurrentPage(1);
    const nextParams = new URLSearchParams(searchParams);
    if (next === 'all') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', next);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(notices.map((n) => n.year))).sort((a, b) =>
      b.localeCompare(a)
    );
    return years;
  }, [notices]);

  const categoryLabel = (cat: NoticeCategory) => {
    switch (cat) {
      case 'examination':
        return t('পরীক্ষা ও ফলাফল', 'Examination & Result');
      case 'admission':
        return t('ভর্তি বিজ্ঞপ্তি', 'Admission');
      case 'recruitment':
        return t('নিয়োগ বিজ্ঞপ্তি', 'Recruitment');
      case 'academic':
        return t('একাডেমিক', 'Academic');
      case 'general':
        return t('সাধারণ নোটিশ', 'General Notice');
    }
  };

  const filteredNotices = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return notices.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (yearFilter !== 'all' && item.year !== yearFilter) return false;
      if (!q) return true;
      return (
        item.titleBn.toLowerCase().includes(q) ||
        item.titleEn.toLowerCase().includes(q) ||
        item.summaryBn.toLowerCase().includes(q) ||
        item.summaryEn.toLowerCase().includes(q) ||
        item.publishDate.includes(q)
      );
    });
  }, [notices, category, yearFilter, searchText]);

  const totalPages = Math.max(1, Math.ceil(filteredNotices.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedNotices = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredNotices.slice(start, start + PAGE_SIZE);
  }, [filteredNotices, safePage]);

  const categoryButtons: { key: 'all' | NoticeCategory; labelBn: string; labelEn: string }[] = [
    { key: 'all', labelBn: 'সকল নোটিশ', labelEn: 'All Notices' },
    { key: 'examination', labelBn: 'পরীক্ষা ও ফলাফল', labelEn: 'Examinations' },
    { key: 'admission', labelBn: 'ভর্তি বিজ্ঞপ্তি', labelEn: 'Admission' },
    { key: 'recruitment', labelBn: 'নিয়োগ বিজ্ঞপ্তি', labelEn: 'Recruitment' },
    { key: 'academic', labelBn: 'একাডেমিক', labelEn: 'Academic' },
  ];

  return (
    <>
      <SeoHead
        title={t('অফিসিয়াল নোটিশ বোর্ড', 'Official Notice Board')}
        description={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড-এর সকল পরীক্ষা, ভর্তি, নিয়োগ ও একাডেমিক বিজ্ঞপ্তি এবং পিডিএফ ডাউনলোড।',
          'Search, preview, and download official notices, admission circulars, recruitment notices, and examination updates from BPSC, Ishwardi EPZ.'
        )}
      />

      <PageHeader
        titleBn="অফিসিয়াল নোটিশ বোর্ড"
        titleEn="Official Notice Board"
        subtitleBn="প্রতিষ্ঠানের সাম্প্রতিক পরীক্ষা, ফলাফল, ভর্তি, নিয়োগ ও প্রশাসনিক আদেশসমূহ অনুসন্ধান ও ডাউনলোড করুন।"
        subtitleEn="Browse, filter, preview inline, and download verified institutional circulars and office orders."
        breadcrumbs={[{ labelBn: 'নোটিশ বোর্ড', labelEn: 'Notices' }]}
      />

      <section className="py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {categoryButtons.map((btn) => {
                  const active = category === btn.key;
                  return (
                    <button
                      key={btn.key}
                      type="button"
                      onClick={() => handleCategoryChange(btn.key)}
                      className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                        active
                          ? 'bg-[#102B50] text-white'
                          : 'bg-[#F6F8FC] text-[#17263C] hover:bg-slate-200/70'
                      }`}
                    >
                      {t(btn.labelBn, btn.labelEn)}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <select
                  aria-label={t('বছর নির্বাচন করুন', 'Filter by year')}
                  value={yearFilter}
                  onChange={(e) => {
                    setYearFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 bg-[#F6F8FC] text-sm text-[#17263C] focus:bg-white focus:border-[#1F5FAF] focus:outline-none tabular-nums"
                >
                  <option value="all">{t('সকল বছর', 'All Years')}</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {num(yr)}
                    </option>
                  ))}
                </select>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-[#617187] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => {
                      setSearchText(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder={t('নোটিশ অনুসন্ধান করুন...', 'Search notices by title...')}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-[#F6F8FC] focus:bg-white focus:border-[#1F5FAF] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#617187] tabular-nums">
              <span>
                {t(
                  `মোট পাওয়া গেছে: ${num(filteredNotices.length)}টি বিজ্ঞপ্তি`,
                  `Found ${filteredNotices.length} official notices`
                )}
              </span>
              {(category !== 'all' || yearFilter !== 'all' || searchText.trim() !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    handleCategoryChange('all');
                    setYearFilter('all');
                    setSearchText('');
                  }}
                  className="font-semibold text-[#1F5FAF] hover:text-[#102B50]"
                >
                  {t('ফিল্টার মুছুন', 'Reset filters')}
                </button>
              )}
            </div>
          </div>

          {/* Notices List */}
          {paginatedNotices.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center">
              <p className="text-base font-semibold text-[#102B50]">
                {t('কোনো বিজ্ঞপ্তি পাওয়া যায়নি', 'No matching notices found')}
              </p>
              <p className="text-sm text-[#617187] mt-1">
                {t(
                  'অনুগ্রহ করে অনুসন্ধান শব্দ বা ক্যাটাগরি পরিবর্তন করে পুনরায় চেষ্টা করুন।',
                  'Try adjusting your search keywords, category, or year filter.'
                )}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden">
              {paginatedNotices.map((notice) => (
                <article
                  key={notice.id}
                  className="p-5 sm:p-6 hover:bg-[#F6F8FC]/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#617187] tabular-nums">
                      <span className="font-semibold text-[#1F5FAF]">
                        #{num(String(notice.serial).padStart(2, '0'))}
                      </span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={notice.publishDate}>{num(notice.publishDate)}</time>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-[#102B50]">
                        {categoryLabel(notice.category)}
                      </span>
                      {notice.isImportant && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-[#17A9C6]">
                            {t('গুরুত্বপূর্ণ বিজ্ঞপ্তি', 'Priority Circular')}
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-[#102B50] leading-snug">
                      <Link
                        to={`/notices/${notice.id}`}
                        className="hover:text-[#1F5FAF] transition-colors"
                      >
                        {t(notice.titleBn, notice.titleEn)}
                      </Link>
                    </h2>

                    <p className="text-sm text-[#617187] leading-relaxed">
                      {t(notice.summaryBn, notice.summaryEn)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {notice.attachmentUrl && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDoc({
                              title: t(notice.titleBn, notice.titleEn),
                              url: notice.attachmentUrl!,
                              type: notice.attachmentType,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50] hover:text-[#1F5FAF] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t('সংযুক্তি দেখুন', 'Preview')}</span>
                        </button>
                        <a
                          href={notice.attachmentUrl}
                          download
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:border-[#102B50] text-xs font-semibold text-[#17263C] hover:text-[#102B50] transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{t('ডাউনলোড', 'Download')}</span>
                        </a>
                      </>
                    )}

                    <Link
                      to={`/notices/${notice.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold transition-colors"
                    >
                      <span>{t('বিস্তারিত', 'Details')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200/90 px-4 py-3 text-sm">
              <span className="text-xs text-[#617187] tabular-nums">
                {t(
                  `পৃষ্ঠা ${num(safePage)} / ${num(totalPages)}`,
                  `Page ${safePage} of ${totalPages}`
                )}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-[#102B50] disabled:opacity-40 hover:border-[#1F5FAF] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{t('পূর্ববর্তী', 'Previous')}</span>
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-[#102B50] disabled:opacity-40 hover:border-[#1F5FAF] transition-colors"
                >
                  <span>{t('পরবর্তী', 'Next')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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
