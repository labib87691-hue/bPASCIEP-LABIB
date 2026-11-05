import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarClock,
  ClipboardCheck,
  Eye,
  GraduationCap,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { SeoHead } from '../components/common/SeoHead';
import { PageHeader } from '../components/common/PageHeader';
import { SmartImage } from '../components/common/SmartImage';
import { DocumentPreviewModal } from '../components/common/DocumentPreviewModal';

export const AcademicOverviewPage: React.FC = () => {
  const { t, num } = useLanguage();
  const { classes } = usePublicData();
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string; type: 'pdf' | 'image' } | null>(null);

  const academicModules = [
    {
      titleBn: 'শ্রেণিসমূহ (নার্সারি – ১০ম শ্রেণি)',
      titleEn: 'Classes (Nursery to Class 10)',
      descBn: 'প্রাক-প্রাথমিক, প্রাথমিক, নিম্ন মাধ্যমিক ও মাধ্যমিক শাখার বিষয় কাঠামো ও বিবরণ।',
      descEn: 'Explore curriculum structure and subject lists from Pre-Primary to SSC.',
      to: '/academic/classes',
      icon: GraduationCap,
    },
    {
      titleBn: 'ক্লাস রুটিন (১ম – ১০ম শ্রেণি)',
      titleEn: 'Class Routine',
      descBn: 'সকল শ্রেণির অনুমোদিত দৈনিক পাঠদানের সময়সূচি পিডিএফ আকারে দেখুন ও ডাউনলোড করুন।',
      descEn: 'View and download official daily class timetables for Classes 1 through 10.',
      to: '/academic/class-routine',
      icon: CalendarClock,
    },
    {
      titleBn: 'পরীক্ষার রুটিন ও মূল্যায়ন ব্যবস্থা',
      titleEn: 'Examination Routine',
      descBn: '১ম মধ্যপর্ব, অর্ধ-বার্ষিক, ২য় মধ্যপর্ব, প্রাক-নির্বাচনী, নির্বাচনী ও বার্ষিক পরীক্ষার সূচি।',
      descEn: 'Term examination schedules, SSC question patterns, and assessment guidelines.',
      to: '/academic/exam-routine',
      icon: ClipboardCheck,
    },
    {
      titleBn: 'সিলেবাস ও কোর্স প্ল্যান',
      titleEn: 'Syllabus & Course Plan',
      descBn: 'শ্রেণিভিত্তিক সিলেবাস, ৬ষ্ঠ–৮ম শ্রেণির বিষয় কাঠামো এবং এসএসসি মানবণ্টন।',
      descEn: 'Download verified syllabi, subject structures, and SSC marks distribution.',
      to: '/academic/syllabus',
      icon: BookOpen,
    },
    {
      titleBn: 'একাডেমিক ক্যালেন্ডার',
      titleEn: 'Academic Calendar',
      descBn: 'শিক্ষাবর্ষের পরীক্ষা, সহশিক্ষা অনুষ্ঠান ও জাতীয় দিবস উদযাপনের বাৎসরিক পরিকল্পনা।',
      descEn: 'Annual academic calendar covering terms, examinations, and campus events.',
      to: '/academic/calendar',
      icon: Calendar,
    },
  ];

  return (
    <>
      <SeoHead
        title={t('একাডেমিক কার্যক্রম ও রিসোর্স', 'Academic Overview & Curriculum')}
        description={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড-এর নার্সারি থেকে দশম শ্রেণি পর্যন্ত একাডেমিক কার্যক্রম, ক্লাস রুটিন, সিলেবাস, ইউনিফর্ম ও ফি তথ্য।',
          'Academic overview, class levels (Nursery–Class 10), class routines, exam schedules, syllabi, uniform guidelines, and fees at BPSC, Ishwardi EPZ.'
        )}
      />

      <PageHeader
        titleBn="একাডেমিক কার্যক্রম ও পাঠ্যক্রম"
        titleEn="Academic Overview"
        subtitleBn="জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB) এবং রাজশাহী শিক্ষা বোর্ডের নির্দেশনা অনুসারে নার্সারি থেকে দশম শ্রেণি পর্যন্ত সুবিন্যস্ত পাঠদান।"
        subtitleEn="Comprehensive Pre-Primary, Primary, and Secondary academic programs aligned with NCTB and Rajshahi Education Board."
        breadcrumbs={[{ labelBn: 'একাডেমিক', labelEn: 'Academic' }]}
      />

      {/* Academic Navigation Hub */}
      <section className="py-10 sm:py-14 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {academicModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.to}
                  to={mod.to}
                  className="group h-full bg-white rounded-xl border border-slate-200/90 hover:border-[#1F5FAF]/45 p-5 sm:p-6 flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="w-11 h-11 rounded-lg bg-[#102B50]/[0.07] group-hover:bg-[#1F5FAF] text-[#102B50] group-hover:text-white flex items-center justify-center transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="mt-4 text-lg font-bold text-[#102B50] group-hover:text-[#1F5FAF] transition-colors">
                      {t(mod.titleBn, mod.titleEn)}
                    </h2>
                    <p className="mt-2 text-sm text-[#617187] leading-relaxed">
                      {t(mod.descBn, mod.descEn)}
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#1F5FAF]">
                    <span>{t('বিস্তারিত দেখুন', 'Explore Section')}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Academic Sections Summary (Nursery to Class 10) */}
      <section className="py-10 sm:py-14 lg:py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold text-[#1F5FAF] tracking-wide">
                {t('একাডেমিক স্তরসমূহ', 'Class Structure')}
              </p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-[#102B50]">
                {t(`মোট ${num(classes.length)}টি একাডেমিক স্তরে পাঠদান`, `${classes.length} Academic Levels Offered`)}
              </h2>
            </div>
            <Link
              to="/academic/classes"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F5FAF] hover:text-[#102B50]"
            >
              <span>{t('শ্রেণিভিত্তিক বিষয় তালিকা', 'View Detailed Class Directory')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {classes.map((cls) => (
              <Link
                key={cls.id}
                to="/academic/classes"
                className="p-4 rounded-xl bg-[#F6F8FC] hover:bg-white border border-slate-200/90 hover:border-[#1F5FAF]/40 transition-colors text-center"
              >
                <div className="text-sm sm:text-base font-bold text-[#102B50]">
                  {t(cls.nameBn, cls.nameEn)}
                </div>
                <div className="mt-1 text-[11px] text-[#617187] truncate">
                  {t(cls.sectionGroupBn, cls.sectionGroupEn)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Verified School Uniform & Fees Reference (from bpsciepz.edu.bd/academic/uniform & /academic/fees) */}
      <section className="py-10 sm:py-14 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Uniform Card */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-7 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-[#1F5FAF] tracking-wide">
                  {t('নির্ধারিত পোশাক বিধি', 'Official Dress Code')}
                </p>
                <h3 className="mt-1.5 text-xl font-bold text-[#102B50]">
                  {t('শিক্ষার্থীদের অফিসিয়াল ইউনিফর্ম', 'Student Uniform Guidelines')}
                </h3>
                <p className="mt-2 text-sm text-[#617187] leading-relaxed">
                  {t(
                    'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড-এর শিক্ষার্থীদের নির্ধারিত ইউনিফর্মের অফিসিয়াল নমুনা চিত্র নিচে প্রদর্শিত হলো।',
                    'Official student uniform specification published by BEPZA Public School and College, Ishwardi EPZ.'
                  )}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3.5 sm:gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewDoc({
                        title: t('ইউনিফর্ম নির্দেশিকা - ১', 'Official Uniform Guide — 1'),
                        url: '/assets/campus/uniform-1.jpg',
                        type: 'image',
                      })
                    }
                    className="group relative rounded-lg overflow-hidden border border-slate-200 aspect-[3/4] bg-[#F6F8FC]"
                  >
                    <SmartImage
                      src="/assets/campus/uniform-1.jpg"
                      alt="Official School Uniform 1"
                      className="w-full h-full"
                      imgClassName="w-full h-full object-cover object-top"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewDoc({
                        title: t('ইউনিফর্ম নির্দেশিকা - ২', 'Official Uniform Guide — 2'),
                        url: '/assets/campus/uniform-2.jpg',
                        type: 'image',
                      })
                    }
                    className="group relative rounded-lg overflow-hidden border border-slate-200 aspect-[3/4] bg-[#F6F8FC]"
                  >
                    <SmartImage
                      src="/assets/campus/uniform-2.jpg"
                      alt="Official School Uniform 2"
                      className="w-full h-full"
                      imgClassName="w-full h-full object-cover object-top"
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Fees Chart Card */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-7 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-[#1F5FAF] tracking-wide">
                  {t('টিউশন ও একাডেমিক ফি', 'Official Fee Structure')}
                </p>
                <h3 className="mt-1.5 text-xl font-bold text-[#102B50]">
                  {t('অনুমোদিত একাডেমিক ফি চার্ট', 'Approved Fees Schedule')}
                </h3>
                <p className="mt-2 text-sm text-[#617187] leading-relaxed">
                  {t(
                    'বেপজা ও ইপিজেড কর্মীদের সন্তান এবং সাধারণ কোটার শিক্ষার্থীদের জন্য প্রযোজ্য অফিসিয়াল ফি কাঠামো দেখুন বা ডাউনলোড করুন।',
                    'Inspect or download the official BPSC fee schedule applicable across classes and guardian categories.'
                  )}
                </p>

                <div className="mt-5 rounded-lg overflow-hidden border border-slate-200 bg-[#F6F8FC] aspect-[16/10]">
                  <SmartImage
                    src="/assets/campus/fees-chart.jpg"
                    alt="Official Fees Schedule Chart"
                    className="w-full h-full"
                    imgClassName="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewDoc({
                      title: t('অফিসিয়াল ফি চার্ট', 'Official BPSC Fees Schedule'),
                      url: '/assets/campus/fees-chart.jpg',
                      type: 'image',
                    })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs sm:text-sm font-semibold transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>{t('বড় করে দেখুন', 'Preview Full Chart')}</span>
                </button>
                <Link
                  to="/admission"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-[#102B50] hover:text-[#1F5FAF] text-xs sm:text-sm font-semibold transition-colors"
                >
                  <span>{t('ভর্তি পাতায় যান', 'Admission Details')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
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
