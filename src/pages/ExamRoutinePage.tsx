import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck2, Download, Eye, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { SeoHead } from '../components/common/SeoHead';
import { PageHeader } from '../components/common/PageHeader';
import { DocumentPreviewModal } from '../components/common/DocumentPreviewModal';

export const ExamRoutinePage: React.FC = () => {
  const { t, num } = useLanguage();
  const { academicResources, notices } = usePublicData();
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    url: string;
    type?: 'pdf' | 'image';
  } | null>(null);

  const examItems = useMemo(
    () => academicResources.filter((r) => r.resourceType === 'exam_routine'),
    [academicResources]
  );

  const recentExamNotices = useMemo(
    () => notices.filter((n) => n.category === 'examination').slice(0, 5),
    [notices]
  );

  return (
    <>
      <SeoHead
        title={t('পরীক্ষার রুটিন ও মূল্যায়ন সূচি', 'Examination Routine & Assessment Schedule')}
        description={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড-এর মধ্যপর্ব, অর্ধ-বার্ষিক, বার্ষিক ও নির্বাচনী পরীক্ষার সময়সূচি এবং মানবণ্টন।',
          'Official schedule for Mid-Term, Half-Yearly, Pre-Test, Test, and Yearly Final examinations at BPSC, Ishwardi EPZ.'
        )}
      />

      <PageHeader
        titleBn="পরীক্ষার রুটিন ও মূল্যায়ন সূচি"
        titleEn="Examination Routine & Assessment Schedule"
        subtitleBn="মধ্যপর্ব, অর্ধ-বার্ষিক, প্রাক-নির্বাচনী, নির্বাচনী ও বার্ষিক চূড়ান্ত পরীক্ষার সময়সূচি এবং প্রশ্নপত্রের মানবণ্টন।"
        subtitleEn="Institutional examination cycles, marks distribution guidelines, and official examination notices from Nursery to Class 10."
        breadcrumbs={[
          { labelBn: 'একাডেমিক', labelEn: 'Academic', to: '/academic' },
          { labelBn: 'পরীক্ষার রুটিন', labelEn: 'Exam Routine' },
        ]}
      />

      <section className="py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Exam Schedules & Guides Table */}
          <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#102B50]">
                  {t('বার্ষিক পরীক্ষা পর্ব ও মানবণ্টন নির্দেশিকা', 'Annual Examination Cycles & Assessment Guides')}
                </h2>
                <p className="text-xs sm:text-sm text-[#617187] mt-1">
                  {t(
                    'প্রত্যেক পর্বের বিস্তারিত বিষয়ভিত্তিক সময়সূচি পরীক্ষার পূর্বে নোটিশ বোর্ডে প্রকাশ করা হয়।',
                    'Detailed subject-wise timetables for each term are published via the official Notice Board prior to commencement.'
                  )}
                </p>
              </div>
              <Link
                to="/notices?category=examination"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs sm:text-sm font-semibold transition-colors self-start sm:self-auto shrink-0"
              >
                <span>{t('পরীক্ষা সংক্রান্ত নোটিশ দেখুন', 'View Examination Notices')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {examItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-5 sm:p-6 hover:bg-[#F6F8FC]/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-medium text-[#617187] tabular-nums">
                      <span className="text-[#1F5FAF] font-semibold">
                        {num(String(idx + 1).padStart(2, '0'))}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{t(item.classNameBn, item.classNameEn)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{num(item.publishDate)}</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[#102B50]">
                      {t(item.titleBn, item.titleEn)}
                    </h3>

                    {(item.statusNoteBn || item.statusNoteEn) && (
                      <p className="text-sm text-[#617187] leading-relaxed">
                        {t(item.statusNoteBn || '', item.statusNoteEn || '')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {item.fileUrl ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDoc({
                              title: t(item.titleBn, item.titleEn),
                              url: item.fileUrl!,
                              type: item.fileType,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50] hover:text-[#1F5FAF] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t('অনলাইনে দেখুন', 'Preview PDF')}</span>
                        </button>
                        <a
                          href={item.fileUrl}
                          download
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{t('ডাউনলোড', 'Download')}</span>
                        </a>
                      </>
                    ) : (
                      <Link
                        to="/notices?category=examination"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50] hover:text-[#1F5FAF] transition-colors"
                      >
                        <CalendarCheck2 className="w-3.5 h-3.5 text-[#17A9C6]" />
                        <span>{t('নোটিশ বোর্ডে বিজ্ঞপ্তি দেখুন', 'Check Notice Board')}</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Published Examination Notices */}
          <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#1F5FAF]" />
                <h2 className="text-base sm:text-lg font-bold text-[#102B50]">
                  {t('সাম্প্রতিক পরীক্ষা ও ফলাফল সংক্রান্ত বিজ্ঞপ্তি', 'Recent Examination & Evaluation Notices')}
                </h2>
              </div>
              <Link
                to="/notices?category=examination"
                className="text-xs sm:text-sm font-semibold text-[#1F5FAF] hover:text-[#102B50] transition-colors"
              >
                {t('সবগুলো দেখুন', 'View all')}
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentExamNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-4 sm:p-5 hover:bg-[#F6F8FC]/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <p className="text-xs text-[#617187] tabular-nums">
                      {num(notice.publishDate)} · {t('পরীক্ষা ও মূল্যায়ন', 'Examination')}
                    </p>
                    <Link
                      to={`/notices/${notice.id}`}
                      className="text-sm sm:text-base font-semibold text-[#102B50] hover:text-[#1F5FAF] transition-colors block"
                    >
                      {t(notice.titleBn, notice.titleEn)}
                    </Link>
                  </div>
                  <Link
                    to={`/notices/${notice.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F5FAF] hover:text-[#102B50] shrink-0"
                  >
                    <span>{t('বিস্তারিত', 'Read Notice')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
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
