import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Download, Eye, FileText, Phone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { SeoHead } from '../components/common/SeoHead';
import { PageHeader } from '../components/common/PageHeader';
import { SmartImage } from '../components/common/SmartImage';
import { DocumentPreviewModal } from '../components/common/DocumentPreviewModal';

export const AdmissionPage: React.FC = () => {
  const { t, num } = useLanguage();
  const { notices, settings } = usePublicData();
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    url: string;
    type?: 'pdf' | 'image';
  } | null>(null);

  const admissionNotices = useMemo(
    () => notices.filter((n) => n.category === 'admission'),
    [notices]
  );

  const admissionSteps = [
    {
      step: '01',
      titleBn: 'ভর্তি বিজ্ঞপ্তি ও আসন যাচাই',
      titleEn: 'Review Official Admission Circular',
      descBn:
        'নার্সারি থেকে নবম শ্রেণিতে শূন্য আসনের বিপরীতে প্রকাশিত ভর্তি বিজ্ঞপ্তি থেকে বয়স ও যোগ্যতা যাচাই করুন।',
      descEn:
        'Check eligibility criteria, vacant class seats (Nursery to Class 9), and quota rules in the published circular.',
    },
    {
      step: '02',
      titleBn: 'ভর্তি ফরম সংগ্রহ ও জমাদান',
      titleEn: 'Collect & Submit Application Form',
      descBn:
        'নির্ধারিত সময়ের মধ্যে (২০২৬ শিক্ষাবর্ষের বিজ্ঞপ্তি অনুযায়ী ১৬-১১-২০২৫ হতে ১৫-১২-২০২৫) বিদ্যালয় অফিস থেকে ফরম সংগ্রহ ও প্রয়োজনীয় কাগজপত্রসহ জমা দিন।',
      descEn:
        'Collect and submit the official application form with required documents at the campus office within announced dates (16-11-2025 to 15-12-2025 for Session 2026).',
    },
    {
      step: '03',
      titleBn: 'ভর্তি পরীক্ষা / লটারি ও ফলাফল',
      titleEn: 'Admission Assessment & Result List',
      descBn:
        'বিজ্ঞপ্তিতে উল্লিখিত সূচি অনুযায়ী ভর্তি মূল্যায়ন ও মেধাতালিকা / অপেক্ষমান তালিকা নোটিশ বোর্ড ও ওয়েবসাইটে প্রকাশ করা হয়।',
      descEn:
        'Participate in the scheduled admission test/assessment. Selected and waiting lists are published on the Notice Board.',
    },
    {
      step: '04',
      titleBn: 'সনদ যাচাই ও চূড়ান্ত ভর্তি সম্পন্ন',
      titleEn: 'Document Verification & Enrollment',
      descBn:
        'জন্ম নিবন্ধন সনদ, পূর্ববর্তী শ্রেণির ছাড়পত্র/প্রত্যয়নপত্র, ছবি ও নির্ধারিত ফি জমাদান সাপেক্ষে ভর্তি চূড়ান্ত করুন।',
      descEn:
        'Complete enrollment by submitting birth registration, transfer certificate (where applicable), photographs, and prescribed fees.',
    },
  ];

  return (
    <>
      <SeoHead
        title={t('ভর্তি তথ্য, ফি কাঠামো ও ইউনিফর্ম', 'Admission Information, Fees & Uniform')}
        description={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড-এ নার্সারি থেকে নবম শ্রেণিতে ভর্তির নিয়মাবলি, ভর্তি বিজ্ঞপ্তি ২০২৬, বেতন ও ফি চার্ট এবং নির্ধারিত ইউনিফর্ম।',
          'Official admission circular, admission test results, tuition & fee chart, and student uniform guidelines for BEPZA Public School and College, Ishwardi EPZ.'
        )}
      />

      <PageHeader
        titleBn="ভর্তি তথ্য ও নির্দেশিকা"
        titleEn="Admission Information & Guidelines"
        subtitleBn="নার্সারি থেকে নবম শ্রেণিতে ভর্তির অফিসিয়াল বিজ্ঞপ্তি, ফলাফল, ফি চার্ট এবং নির্ধারিত ইউনিফর্ম সংক্রান্ত প্রামাণ্য তথ্য।"
        subtitleEn="Official admission circulars, merit & waiting lists, verified fee structure chart, and uniform specifications."
        breadcrumbs={[{ labelBn: 'ভর্তি তথ্য', labelEn: 'Admission' }]}
      />

      <section className="py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Featured 2026 Admission Circular Banner Card */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-3xl">
              <p className="text-xs font-semibold text-[#1F5FAF] tabular-nums">
                {t('শিক্ষাবর্ষ ২০২৬ · অফিসিয়াল ভর্তি বিজ্ঞপ্তি', 'Academic Session 2026 · Official Circular')}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-[#102B50]">
                {t(
                  'নার্সারি থেকে নবম শ্রেণিতে শূন্য আসনে শিক্ষার্থী ভর্তি বিজ্ঞপ্তি — ২০২৬',
                  'Admission Circular 2026 for Vacant Seats (Nursery to Class 9)'
                )}
              </h2>
              <p className="text-sm text-[#617187] leading-relaxed">
                {t(
                  'বেপজা ও ঈশ্বরদী ইপিজেড শিল্পপ্রতিষ্ঠানে কর্মরত কর্মকর্তা-কর্মচারী ও শ্রমিকদের সন্তানসহ স্থানীয় শিক্ষার্থীদের ভর্তির যোগ্যতা, ফরম বিতরণ (১৬-১১-২০২৫ হতে ১৫-১২-২০২৫) ও ভর্তি পরীক্ষার বিস্তারিত নিয়মাবলি অফিসিয়াল পিডিএফ বিজ্ঞপ্তিতে দেখুন।',
                  'Inspect official eligibility rules for children of BEPZA/EPZ officials, workers, and local residents, along with form distribution dates (16-11-2025 to 15-12-2025) in the official PDF circular.'
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setPreviewDoc({
                    title: t(
                      'ভর্তি বিজ্ঞপ্তি ২০২৬ (নার্সারি – ৯ম শ্রেণি)',
                      'Admission Circular 2026 (Nursery – Class 9)'
                    ),
                    url: '/assets/documents/admission-2026-notice.pdf',
                    type: 'pdf',
                  })
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-sm font-semibold text-[#102B50] hover:text-[#1F5FAF] transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>{t('বিজ্ঞপ্তি দেখুন', 'Preview Circular')}</span>
              </button>
              <a
                href="/assets/documents/admission-2026-notice.pdf"
                download
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-sm font-semibold transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{t('পিডিএফ ডাউনলোড', 'Download PDF')}</span>
              </a>
            </div>
          </div>

          {/* 4-Step Admission Process */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#102B50] mb-5">
              {t('ভর্তি প্রক্রিয়ার ধাপসমূহ', 'Step-by-Step Admission Procedure')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {admissionSteps.map((item) => (
                <div
                  key={item.step}
                  className="bg-white rounded-xl border border-slate-200/90 p-5 space-y-2.5"
                >
                  <span className="text-xs font-bold text-[#17A9C6] tabular-nums">
                    {t('ধাপ', 'STEP')} {num(item.step)}
                  </span>
                  <h3 className="text-base font-bold text-[#102B50]">
                    {t(item.titleBn, item.titleEn)}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#617187] leading-relaxed">
                    {t(item.descBn, item.descEn)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Published Admission Notices, Results & Waiting Lists */}
          <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#1F5FAF]" />
                <h2 className="text-lg font-bold text-[#102B50]">
                  {t(
                    'প্রকাশিত ভর্তি বিজ্ঞপ্তি, ফলাফল ও অপেক্ষমান তালিকা',
                    'Published Admission Circulars, Results & Waiting Lists'
                  )}
                </h2>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {admissionNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-5 sm:p-6 hover:bg-[#F6F8FC]/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1 max-w-2xl">
                    <p className="text-xs text-[#617187] tabular-nums">
                      {num(notice.publishDate)} · {t('ভর্তি শাখা', 'Admission Desk')}
                    </p>
                    <Link
                      to={`/notices/${notice.id}`}
                      className="text-sm sm:text-base font-bold text-[#102B50] hover:text-[#1F5FAF] transition-colors block"
                    >
                      {t(notice.titleBn, notice.titleEn)}
                    </Link>
                    <p className="text-xs sm:text-sm text-[#617187]">
                      {t(notice.summaryBn, notice.summaryEn)}
                    </p>
                  </div>

                  {notice.attachmentUrl && (
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewDoc({
                            title: t(notice.titleBn, notice.titleEn),
                            url: notice.attachmentUrl!,
                            type: notice.attachmentType,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50] hover:text-[#1F5FAF] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t('দেখুন', 'Preview')}</span>
                      </button>
                      <a
                        href={notice.attachmentUrl}
                        download
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs font-semibold transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t('ডাউনলোড', 'Download')}</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Official Tuition & Fees Chart + Official Student Uniform */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Official Fees Chart */}
            <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#102B50]">
                    {t('অফিসিয়াল বেতন ও ফি কাঠামো চার্ট', 'Official Tuition & Fees Structure')}
                  </h2>
                  <p className="text-xs text-[#617187] mt-0.5">
                    {t(
                      'রেফারেন্স ওয়েবসাইটে প্রকাশিত অফিসিয়াল ফি তালিকা',
                      'Verified fee chart published by BPSC Administration'
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewDoc({
                      title: t('অফিসিয়াল বেতন ও ফি চার্ট', 'Official Tuition & Fees Chart'),
                      url: '/assets/campus/fees-chart.jpg',
                      type: 'image',
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50] shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t('বড় করে দেখুন', 'Zoom Chart')}</span>
                </button>
              </div>
              <div className="p-4 bg-[#F6F8FC]">
                <SmartImage
                  src="/assets/campus/fees-chart.jpg"
                  alt={t('বেপজা পাবলিক স্কুল এন্ড কলেজ ফি চার্ট', 'BPSC Fees Chart')}
                  className="w-full rounded-lg border border-slate-200"
                  imgClassName="w-full h-auto object-contain bg-white"
                />
              </div>
            </div>

            {/* Official Uniform Guide */}
            <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-200">
                <h2 className="text-lg font-bold text-[#102B50]">
                  {t('নির্ধারিত শিক্ষার্থী পোশাক (ইউনিফর্ম)', 'Official Student Uniform')}
                </h2>
                <p className="text-xs text-[#617187] mt-0.5">
                  {t(
                    'সকল শ্রেণির শিক্ষার্থীদের জন্য নির্ধারিত প্রাতিষ্ঠানিক ইউনিফর্মের নমুনা',
                    'Prescribed institutional dress code specifications for students'
                  )}
                </p>
              </div>

              <div className="p-4 sm:p-5 grid grid-cols-2 gap-3 sm:gap-4 bg-[#F6F8FC]">
                {[
                  {
                    url: '/assets/campus/uniform-1.jpg',
                    bn: 'ইউনিফর্ম নির্দেশিকা (১)',
                    en: 'Uniform Spec (1)',
                  },
                  {
                    url: '/assets/campus/uniform-2.jpg',
                    bn: 'ইউনিফর্ম নির্দেশিকা (২)',
                    en: 'Uniform Spec (2)',
                  },
                ].map((u) => (
                  <button
                    key={u.url}
                    type="button"
                    onClick={() =>
                      setPreviewDoc({
                        title: t(u.bn, u.en),
                        url: u.url,
                        type: 'image',
                      })
                    }
                    className="group bg-white rounded-lg border border-slate-200 overflow-hidden text-left hover:border-[#1F5FAF] transition-colors"
                  >
                    <SmartImage
                      src={u.url}
                      alt={t(u.bn, u.en)}
                      className="w-full aspect-[3/4]"
                      imgClassName="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                    />
                    <div className="p-2.5 sm:p-3 text-xs font-semibold text-[#102B50] flex items-center justify-between gap-1.5">
                      <span className="truncate">{t(u.bn, u.en)}</span>
                      <Eye className="w-3.5 h-3.5 text-[#1F5FAF] shrink-0" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-5 border-t border-slate-200 space-y-2.5 text-xs sm:text-sm text-[#17263C]">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#17A9C6] shrink-0 mt-0.5" />
                  <span>
                    {t(
                      'ভর্তি সংক্রান্ত সরাসরি তথ্যের জন্য অফিস চলাকালীন যোগাযোগ করুন:',
                      'For admission assistance during school hours, contact:'
                    )}{' '}
                    <strong className="tabular-nums">{num(settings.phonePrimary)}</strong>,{' '}
                    <strong className="tabular-nums">{num(settings.phoneSecondary)}</strong>
                  </span>
                </div>
              </div>
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
