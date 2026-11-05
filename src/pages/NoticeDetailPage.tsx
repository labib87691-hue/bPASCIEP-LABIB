import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Copy, Download, Eye, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { NoticeCategory } from '../types/school';
import { SeoHead } from '../components/common/SeoHead';
import { PageHeader } from '../components/common/PageHeader';
import { DocumentPreviewModal } from '../components/common/DocumentPreviewModal';

export const NoticeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, num } = useLanguage();
  const { notices, settings } = usePublicData();
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const notice = useMemo(() => notices.find((n) => n.id === id), [notices, id]);

  const relatedNotices = useMemo(
    () => notices.filter((n) => n.id !== id).slice(0, 4),
    [notices, id]
  );

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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard API may be unavailable in restricted contexts
    }
  };

  if (!notice) {
    return (
      <>
        <SeoHead
          title={t('বিজ্ঞপ্তি পাওয়া যায়নি', 'Notice Not Found')}
          description={t(
            'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড — বিজ্ঞপ্তি পাওয়া যায়নি।',
            'Requested notice was not found on BEPZA Public School and College, Ishwardi EPZ.'
          )}
        />
        <section className="py-20 bg-[#F6F8FC]">
          <div className="max-w-xl mx-auto px-4 text-center space-y-4">
            <h1 className="text-2xl font-bold text-[#102B50]">
              {t('কাঙ্ক্ষিত বিজ্ঞপ্তিটি পাওয়া যায়নি', 'Requested Notice Not Found')}
            </h1>
            <p className="text-sm text-[#617187]">
              {t(
                'বিজ্ঞপ্তিটি সরানো হয়েছে অথবা লিংকটি সঠিক নয়। সকল অফিসিয়াল বিজ্ঞপ্তি দেখতে নোটিশ বোর্ডে ফিরে যান।',
                'This notice may have been archived or the URL is invalid. Return to the Notice Board for all active circulars.'
              )}
            </p>
            <Link
              to="/notices"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-sm font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('নোটিশ বোর্ডে ফিরে যান', 'Back to Notice Board')}</span>
            </Link>
          </div>
        </section>
      </>
    );
  }

  const isPdf =
    notice.attachmentType === 'pdf' ||
    Boolean(notice.attachmentUrl?.toLowerCase().endsWith('.pdf'));

  return (
    <>
      <SeoHead
        title={t(notice.titleBn, notice.titleEn)}
        description={t(notice.summaryBn, notice.summaryEn)}
      />

      <PageHeader
        titleBn={notice.titleBn}
        titleEn={notice.titleEn}
        subtitleBn={`${t('প্রকাশের তারিখ:', 'Published:')} ${num(notice.publishDate)} · ${categoryLabel(notice.category)}`}
        subtitleEn={`Published: ${notice.publishDate} · ${categoryLabel(notice.category)}`}
        breadcrumbs={[
          { labelBn: 'নোটিশ বোর্ড', labelEn: 'Notices', to: '/notices' },
          { labelBn: `বিজ্ঞপ্তি #${num(notice.serial)}`, labelEn: `Notice #${notice.serial}` },
        ]}
      />

      <section className="py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Notice Body */}
          <div className="lg:col-span-8 space-y-6">
            <article className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="text-xs text-[#617187] tabular-nums">
                  <span className="font-semibold text-[#102B50]">
                    {t(settings.schoolNameBn, settings.schoolNameEn)}
                  </span>
                  <span className="mx-2" aria-hidden="true">
                    ·
                  </span>
                  <span>EIIN {num(settings.eiin)}</span>
                  <span className="mx-2" aria-hidden="true">
                    ·
                  </span>
                  <time dateTime={notice.publishDate}>{num(notice.publishDate)}</time>
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50] transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t('লিংক কপি হয়েছে', 'Link Copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t('লিংক কপি করুন', 'Copy Link')}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-4 text-[#17263C] leading-relaxed text-sm sm:text-base">
                <p className="font-medium text-[#102B50]">
                  {t(notice.summaryBn, notice.summaryEn)}
                </p>
                <p>{t(notice.detailsBn, notice.detailsEn)}</p>
              </div>

              {/* Official Attachment Section */}
              {notice.attachmentUrl && (
                <div className="pt-6 border-t border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F6F8FC] rounded-xl p-4 border border-slate-200/80">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-[#1F5FAF] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#102B50] truncate">
                          {t('সংযুক্ত অফিসিয়াল ডকুমেন্ট', 'Attached Official Circular')}
                        </p>
                        <p className="text-xs text-[#617187]">
                          {isPdf
                            ? t('পিডিএফ ডকুমেন্ট (PDF)', 'PDF Document')
                            : t('অফিসিয়াল বিজ্ঞপ্তি ইমেজ (JPG)', 'Official Circular Image')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t('পূর্ণ পর্দায় দেখুন', 'Full Preview')}</span>
                      </button>
                      <a
                        href={notice.attachmentUrl}
                        download
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t('ডাউনলোড করুন', 'Download')}</span>
                      </a>
                    </div>
                  </div>

                  {/* Inline Attachment Viewer */}
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
                    {isPdf ? (
                      <iframe
                        src={notice.attachmentUrl}
                        title={t(notice.titleBn, notice.titleEn)}
                        className="w-full h-[360px] sm:h-[520px] border-0 bg-white"
                      />
                    ) : (
                      <img
                        src={notice.attachmentUrl}
                        alt={t(notice.titleBn, notice.titleEn)}
                        referrerPolicy="no-referrer"
                        className="w-full h-auto object-contain max-h-[720px] mx-auto bg-white"
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to="/notices"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F5FAF] hover:text-[#102B50] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('সকল নোটিশ তালিকায় ফিরুন', 'Back to All Notices')}</span>
                </Link>
              </div>
            </article>
          </div>

          {/* Sidebar: Recent Notices */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6">
              <h2 className="text-base font-bold text-[#102B50] pb-3 border-b border-slate-200">
                {t('অন্যান্য সাম্প্রতিক নোটিশ', 'Other Recent Notices')}
              </h2>
              <div className="divide-y divide-slate-100 mt-2">
                {relatedNotices.map((rel) => (
                  <div key={rel.id} className="py-3.5 space-y-1">
                    <p className="text-xs text-[#617187] tabular-nums">
                      {num(rel.publishDate)} · {categoryLabel(rel.category)}
                    </p>
                    <Link
                      to={`/notices/${rel.id}`}
                      className="text-sm font-semibold text-[#17263C] hover:text-[#1F5FAF] transition-colors block leading-snug"
                    >
                      {t(rel.titleBn, rel.titleEn)}
                    </Link>
                  </div>
                ))}
              </div>
              <Link
                to="/notices"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F5FAF] hover:text-[#102B50]"
              >
                <span>{t('সম্পূর্ণ নোটিশ আর্কাইভ', 'Complete Notice Archive')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {notice.attachmentUrl && (
        <DocumentPreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          title={t(notice.titleBn, notice.titleEn)}
          fileUrl={notice.attachmentUrl}
          fileType={notice.attachmentType}
        />
      )}
    </>
  );
};
