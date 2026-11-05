import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Cloud,
  FileSpreadsheet,
  Mail,
  MapPin,
  Phone,
  X,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { SeoHead } from '../components/common/SeoHead';
import { SmartImage } from '../components/common/SmartImage';
import { NoticeCategory } from '../types/school';

export const HomePage: React.FC = () => {
  const { t, num } = useLanguage();
  const {
    settings,
    siteContent,
    banners,
    administration,
    notices,
    teachers,
    facilities,
    newsEvents,
    gallery,
  } = usePublicData();

  const [heroIndex, setHeroIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % banners.length);
    }, 6500);
    return () => window.clearInterval(id);
  }, [banners.length]);

  useEffect(() => {
    if (!lightboxImage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxImage]);

  const currentBanner = banners[heroIndex] || banners[0];
  const welcomeBlock = siteContent.find((b) => b.sectionKey === 'home_welcome' && b.isPublished);
  const aboutBlock = siteContent.find((b) => b.sectionKey === 'about_overview' && b.isPublished);

  const categoryLabel = (cat: NoticeCategory) => {
    switch (cat) {
      case 'examination':
        return t('পরীক্ষা সংক্রান্ত', 'Examination');
      case 'admission':
        return t('ভর্তি বিজ্ঞপ্তি', 'Admission');
      case 'recruitment':
        return t('নিয়োগ বিজ্ঞপ্তি', 'Recruitment');
      case 'academic':
        return t('নোটিশ ও আদেশ', 'Official Circular');
      default:
        return t('সাধারণ নোটিশ', 'General');
    }
  };

  // Phase 4 Rule: Homepage quick-access links strictly limited to BPSC Cloud & Result Portal
  const portalQuickLinks = [
    {
      titleBn: 'বিপিএসসি ক্লাউড ডকুমেন্ট সেন্টার',
      titleEn: 'BPSC Cloud',
      descBn:
        'ক্লাস রুটিন, পরীক্ষার সূচি, সিলেবাস, ফরম, ছুটির তালিকা ও অফিসিয়াল ডকুমেন্টসমূহ এক জায়গায় দেখুন ও ডাউনলোড করুন।',
      descEn:
        'Central library for class routines, exam schedules, syllabi, forms, holiday lists, and official institutional documents.',
      to: '/cloud',
      icon: Cloud,
      ctaBn: 'বিপিএসসি ক্লাউড খুলুন',
      ctaEn: 'Open BPSC Cloud',
    },
    {
      titleBn: 'অনলাইন পরীক্ষার ফলাফল পোর্টাল',
      titleEn: 'Result Portal',
      descBn:
        'শিক্ষাবর্ষ, পরীক্ষা, শ্রেণি এবং রোল নম্বর দিয়ে প্রকাশিত ফলাফল অনুসন্ধান করুন এবং প্রিন্টযোগ্য মার্কশিট ডাউনলোড করুন।',
      descEn:
        'Search published examination results by academic year, exam, class, and roll number with printable A4 marksheets.',
      to: '/result',
      icon: BarChart3,
      ctaBn: 'ফলাফল অনুসন্ধান করুন',
      ctaEn: 'Check Student Result',
    },
  ];

  return (
    <>
      <SeoHead
        title={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড',
          'Official Public Website — Ishwardi EPZ, Pabna'
        )}
        description={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড, পাকশী, পাবনা (EIIN: ১৪০৩৩৬)-এর অফিসিয়াল ওয়েবসাইট। প্রতিষ্ঠান পরিচিতি, প্রশাসন, বিপিএসসি ক্লাউড, ফলাফল ও ভর্তি তথ্য দেখুন।',
          'Official website of BEPZA Public School and College (BPSC), Ishwardi EPZ, Paksey, Pabna (EIIN: 140336). Explore institutional profile, administration, BPSC Cloud, results, and admission updates.'
        )}
      />

      {/* 1. HERO & SCHOOL WELCOME */}
      <section className="relative bg-[#102B50] overflow-hidden">
        <div className="relative min-h-[340px] sm:min-h-[390px] lg:min-h-[430px] flex items-center">
          {currentBanner && (
            <div className="absolute inset-0">
              <img
                src={currentBanner.imageUrl}
                alt={t(currentBanner.titleBn, currentBanner.titleEn)}
                referrerPolicy="no-referrer"
                fetchPriority="high"
                className="w-full h-full object-cover object-center transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#102B50]/94 via-[#102B50]/82 to-[#102B50]/50" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#102B50]/88 via-transparent to-transparent" />
            </div>
          )}

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9 sm:py-12 lg:py-15 w-full">
            <div className="max-w-2xl lg:max-w-3xl">
              <p className="text-xs sm:text-sm font-medium text-[#17A9C6] tracking-wide mb-2.5 tabular-nums">
                {t(
                  `বেপজা পরিচালিত শিক্ষাপ্রতিষ্ঠান · EIIN: ${num(settings.eiin)} · স্থাপিত: ${num(settings.establishedYear)}`,
                  `Operated under BEPZA · EIIN: ${settings.eiin} · Established: ${settings.establishedYear}`
                )}
              </p>

              <h1 className="text-2xl sm:text-3xl lg:text-[40px] font-bold text-white leading-[1.24] tracking-tight">
                {currentBanner
                  ? t(currentBanner.titleBn, currentBanner.titleEn)
                  : welcomeBlock
                  ? t(welcomeBlock.titleBn, welcomeBlock.titleEn)
                  : t(settings.schoolNameBn, settings.schoolNameEn)}
              </h1>

              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl line-clamp-3 sm:line-clamp-none">
                {currentBanner
                  ? t(currentBanner.subtitleBn, currentBanner.subtitleEn)
                  : welcomeBlock
                  ? t(welcomeBlock.bodyBn, welcomeBlock.bodyEn)
                  : t(
                      'ঈশ্বরদী ইপিজেড, পাকশী, পাবনায় অবস্থিত মানসম্মত শিক্ষা, নৈতিক মূল্যবোধ ও সহশিক্ষা কার্যক্রমের নির্ভরযোগ্য বিদ্যাপীঠ।',
                      'Committed to discipline, moral character, and contemporary education at Ishwardi EPZ, Paksey, Pabna.'
                    )}
              </p>

              <div className="mt-6 sm:mt-7 grid grid-cols-1 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3">
                <Link
                  to="/about"
                  className="min-[420px]:col-span-2 inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#17A9C6] hover:bg-[#1496b0] text-[#102B50] font-semibold text-sm transition-colors whitespace-nowrap"
                >
                  <span>{t('আমাদের প্রতিষ্ঠান জানুন', 'Explore Our School')}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </Link>

                <Link
                  to="/cloud"
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 sm:px-5 py-2.5 rounded-lg bg-white text-[#102B50] hover:bg-slate-100 font-semibold text-sm transition-colors whitespace-nowrap"
                >
                  <Cloud className="w-4 h-4 text-[#1F5FAF] shrink-0" />
                  <span>{t('বিপিএসসি ক্লাউড', 'BPSC Cloud')}</span>
                </Link>

                <Link
                  to="/result"
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 sm:px-5 py-2.5 rounded-lg border border-white/35 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors whitespace-nowrap"
                >
                  <BarChart3 className="w-4 h-4 text-[#17A9C6] shrink-0" />
                  <span>{t('ফলাফল পোর্টাল', 'Result Portal')}</span>
                </Link>
              </div>

              {banners.length > 1 && (
                <div className="mt-6 sm:mt-8 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setHeroIndex((prev) => (prev - 1 + banners.length) % banners.length)
                    }
                    aria-label={t('পূর্ববর্তী স্লাইড', 'Previous banner')}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-white/25 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1.5">
                    {banners.map((b, idx) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setHeroIndex(idx)}
                        aria-label={`${t('স্লাইড', 'Slide')} ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === heroIndex
                            ? 'w-6 bg-[#17A9C6]'
                            : 'w-2 bg-white/40 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setHeroIndex((prev) => (prev + 1) % banners.length)}
                    aria-label={t('পরবর্তী স্লাইড', 'Next banner')}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-white/25 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. SCHOOL HIGHLIGHTS */}
      <section className="bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            <div className="p-4 sm:p-5 rounded-xl bg-[#F6F8FC] border border-slate-200/80 flex flex-col justify-between h-full">
              <div className="text-xs font-medium text-[#617187]">
                {t('মোট শিক্ষার্থী', 'Total Students')}
              </div>
              <div className="mt-1.5 text-sm sm:text-lg font-bold text-[#102B50] tabular-nums leading-snug">
                {settings.totalStudents
                  ? num(settings.totalStudents)
                  : t('অ্যাডমিন নির্ধারিত', 'Admin-Configured')}
              </div>
              <div className="mt-1 text-[11px] sm:text-xs text-[#617187]">
                {t('নার্সারি – ১০ম শ্রেণি', 'Nursery – Class 10')}
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[#F6F8FC] border border-slate-200/80 flex flex-col justify-between h-full">
              <div className="text-xs font-medium text-[#617187]">
                {t('মোট শিক্ষকবৃন্দ', 'Total Teachers')}
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-[#102B50] tabular-nums">
                {num(teachers.length || settings.totalTeachers)}
              </div>
              <div className="mt-1 text-[11px] sm:text-xs text-[#617187]">
                {t(
                  `সহায়ক কর্মী: ${num(settings.totalStaff)} জন`,
                  `Plus ${settings.totalStaff} support staff`
                )}
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[#F6F8FC] border border-slate-200/80 flex flex-col justify-between h-full">
              <div className="text-xs font-medium text-[#617187]">
                {t('পাঠদান শ্রেণি', 'Classes Offered')}
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-[#102B50] tabular-nums">
                {num(settings.totalClasses)}
              </div>
              <div className="mt-1 text-[11px] sm:text-xs text-[#617187]">
                {t('নার্সারি ও ১ম – ১০ম শ্রেণি', 'Nursery & Classes 1–10')}
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-[#F6F8FC] border border-slate-200/80 flex flex-col justify-between h-full">
              <div className="text-xs font-medium text-[#617187]">
                {t('প্রতিষ্ঠা ও EIIN', 'Established & EIIN')}
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-bold text-[#102B50] tabular-nums">
                {num(settings.establishedYear)}
              </div>
              <div className="mt-1 text-[11px] sm:text-xs text-[#617187] tabular-nums">
                EIIN: {num(settings.eiin)} · {t('পাকশী, পাবনা', 'Paksey, Pabna')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMPACT PORTAL QUICK ACCESS — ONLY BPSC Cloud & Result Portal */}
      <section className="py-8 sm:py-10 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {portalQuickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group p-5 sm:p-6 rounded-xl bg-[#F6F8FC] hover:bg-white border border-slate-200/90 hover:border-[#1F5FAF]/45 transition-all flex flex-col justify-between h-full"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#102B50] group-hover:bg-[#1F5FAF] text-white flex items-center justify-center transition-colors shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base sm:text-lg font-bold text-[#102B50] group-hover:text-[#1F5FAF] transition-colors leading-snug">
                        {t(item.titleBn, item.titleEn)}
                      </h2>
                      <p className="mt-1.5 text-xs sm:text-sm text-[#617187] leading-relaxed">
                        {t(item.descBn, item.descEn)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs sm:text-sm font-semibold text-[#1F5FAF]">
                    <span>{t(item.ctaBn, item.ctaEn)}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. ABOUT THE INSTITUTION */}
      <section className="py-10 sm:py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-semibold text-[#1F5FAF] tracking-wide">
                {t('প্রতিষ্ঠান পরিচিতি', 'About the Institution')}
              </p>
              <h2 className="mt-1.5 text-xl sm:text-2xl lg:text-3xl font-bold text-[#102B50] leading-[1.28]">
                {aboutBlock
                  ? t(aboutBlock.titleBn, aboutBlock.titleEn)
                  : t(settings.schoolNameBn, settings.schoolNameEn)}
              </h2>
              <p className="mt-3.5 text-sm sm:text-base text-[#17263C] leading-relaxed">
                {aboutBlock
                  ? t(aboutBlock.bodyBn, aboutBlock.bodyEn)
                  : t(
                      '১২ নভেম্বর ২০১৯ তারিখে অনুষ্ঠিত বাংলাদেশ রপ্তানি প্রক্রিয়াকরণ এলাকা কর্তৃপক্ষ (বেপজা)-এর ৩৪তম গভর্নিং বোর্ড সভার দূরদর্শী সিদ্ধান্তের আলোকে ঈশ্বরদী ইপিজেড-এ NARI প্রজেক্টের প্রশিক্ষণ কেন্দ্র ও ডরমিটরি অবকাঠামোকে একটি আধুনিক শিক্ষাপ্রতিষ্ঠানে রূপান্তর করা হয়। পরবর্তীতে ২ ফেব্রুয়ারি ২০২০ তারিখে আনুষ্ঠানিকভাবে পাঠদান কার্যক্রম উদ্বোধন করা হয়।',
                      'Following the visionary decision of the 34th Governing Board meeting of BEPZA dated 12 November, 2019, the NARI Project training center and dormitory infrastructure inside Ishwardi Export Processing Zone was transformed into BEPZA Public School and College to expand quality educational opportunities for children of IEPZ workers, officials, and surrounding Ishwardi communities.'
                    )}
              </p>
              {welcomeBlock && (
                <p className="mt-2.5 text-sm text-[#617187] leading-relaxed">
                  {t(welcomeBlock.bodyBn, welcomeBlock.bodyEn)}
                </p>
              )}

              <dl className="mt-5 pt-5 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs sm:text-sm">
                <div className="col-span-2 sm:col-span-1">
                  <dt className="text-[#617187]">{t('অবস্থান', 'Location')}</dt>
                  <dd className="font-semibold text-[#17263C] mt-0.5">
                    {t('ঈশ্বরদী ইপিজেড, পাকশী, পাবনা', 'Ishwardi EPZ, Paksey, Pabna')}
                  </dd>
                </div>
                <div className="tabular-nums">
                  <dt className="text-[#617187]">{t('প্রতিষ্ঠা সাল', 'Established')}</dt>
                  <dd className="font-semibold text-[#17263C] mt-0.5">
                    {num(settings.establishedYear)}
                  </dd>
                </div>
                <div className="tabular-nums">
                  <dt className="text-[#617187]">EIIN</dt>
                  <dd className="font-semibold text-[#17263C] mt-0.5">{num(settings.eiin)}</dd>
                </div>
              </dl>

              <div className="mt-6">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 min-h-[42px] px-5 py-2.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-sm font-medium transition-colors whitespace-nowrap"
                >
                  <span>{t('বিস্তারিত পড়ুন', 'Read More')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-white p-1.5 sm:p-2">
                <SmartImage
                  src="/assets/campus/campus-main.jpg"
                  alt="BEPZA Public School and College Ishwardi EPZ Campus"
                  className="w-full aspect-[16/10] rounded-lg"
                  imgClassName="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ADMINISTRATION INTRODUCTION */}
      <section className="py-10 sm:py-12 lg:py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
            <div>
              <p className="text-xs font-semibold text-[#1F5FAF] tracking-wide">
                {t('নেতৃত্ব ও দিকনির্দেশনা', 'Leadership & Governance')}
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl lg:text-3xl font-bold text-[#102B50]">
                {t('প্রশাসনিক বাণীসমূহ', 'Messages from Administration')}
              </h2>
            </div>
            <Link
              to="/administration"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1F5FAF] hover:text-[#102B50] transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <span>{t('সকল বাণী বিস্তারিত দেখুন', 'Read Full Messages')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {administration.slice(0, 3).map((leader) => (
              <article
                key={leader.id}
                className="bg-[#F6F8FC] rounded-xl border border-slate-200/90 p-5 flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-start gap-3.5">
                    <SmartImage
                      src={leader.photoUrl}
                      alt={leader.name}
                      fallbackType="person"
                      fallbackLabel={leader.name}
                      className="w-16 h-20 sm:w-[68px] sm:h-[85px] aspect-[4/5] rounded-lg border border-slate-200 bg-white shrink-0"
                      imgClassName="w-full h-full object-cover object-top"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#1F5FAF]">
                        {t(leader.designationBn, leader.designationEn)}
                      </p>
                      <h3 className="mt-0.5 text-sm sm:text-base font-bold text-[#102B50] leading-snug">
                        {t(leader.nameBn, leader.name)}
                      </h3>
                      <p className="mt-0.5 text-xs text-[#617187] leading-snug">
                        {t(leader.organizationBn, leader.organizationEn)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-xs sm:text-sm text-[#17263C] leading-relaxed line-clamp-4">
                    {t(leader.messageBn, leader.messageEn)}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/70">
                  <Link
                    to={`/administration#${leader.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F5FAF] hover:text-[#102B50] transition-colors"
                  >
                    <span>{t('সম্পূর্ণ বাণী পড়ুন', 'Read Complete Message')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 6. NEWS & EVENTS */}
      <section className="py-10 sm:py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
            <div>
              <p className="text-xs font-semibold text-[#1F5FAF] tracking-wide">
                {t('সহশিক্ষা, অর্জন ও অনুষ্ঠান', 'Activities & Achievements')}
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl lg:text-3xl font-bold text-[#102B50]">
                {t('সংবাদ ও সাম্প্রতিক আয়োজন', 'News & Events')}
              </h2>
            </div>
            <Link
              to="/news"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1F5FAF] hover:text-[#102B50] transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <span>{t('সকল সংবাদ ও অনুষ্ঠান', 'All News & Events')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
            {newsEvents[0] && (
              <Link
                to="/news"
                className="lg:col-span-7 group bg-white rounded-xl border border-slate-200/90 hover:border-[#1F5FAF]/40 overflow-hidden flex flex-col transition-colors"
              >
                <SmartImage
                  src={newsEvents[0].imageUrl}
                  alt={t(newsEvents[0].titleBn, newsEvents[0].titleEn)}
                  className="w-full aspect-[16/9] max-h-[280px] sm:max-h-[320px]"
                  imgClassName="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                />
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#617187] tabular-nums">
                      <span className="font-semibold text-[#1F5FAF]">
                        {t(newsEvents[0].categoryBn, newsEvents[0].categoryEn)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{num(newsEvents[0].publishDate)}</span>
                    </div>
                    <h3 className="mt-2 text-base sm:text-xl font-bold text-[#102B50] group-hover:text-[#1F5FAF] transition-colors leading-snug">
                      {t(newsEvents[0].titleBn, newsEvents[0].titleEn)}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-[#617187] leading-relaxed line-clamp-3">
                      {t(newsEvents[0].summaryBn, newsEvents[0].summaryEn)}
                    </p>
                  </div>
                </div>
              </Link>
            )}

            <div className="lg:col-span-5 flex flex-col justify-between gap-3.5">
              {newsEvents.slice(1, 4).map((ev) => (
                <Link
                  key={ev.id}
                  to="/news"
                  className="group p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/90 hover:border-[#1F5FAF]/40 transition-colors flex gap-3.5 items-center flex-1"
                >
                  <SmartImage
                    src={ev.imageUrl}
                    alt={t(ev.titleBn, ev.titleEn)}
                    className="w-20 h-20 sm:w-24 sm:h-24 aspect-square rounded-lg shrink-0"
                    imgClassName="w-full h-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-[#617187] tabular-nums truncate">
                      <span className="text-[#1F5FAF] font-medium">
                        {t(ev.categoryBn, ev.categoryEn)}
                      </span>{' '}
                      · {num(ev.publishDate)}
                    </div>
                    <h3 className="mt-1 text-sm sm:text-[15px] font-bold text-[#102B50] group-hover:text-[#1F5FAF] line-clamp-2 leading-snug">
                      {t(ev.titleBn, ev.titleEn)}
                    </h3>
                    <p className="mt-1 text-xs text-[#617187] line-clamp-2 leading-relaxed">
                      {t(ev.summaryBn, ev.summaryEn)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. LATEST INSTITUTIONAL UPDATES */}
      <section className="py-10 sm:py-12 lg:py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
            <div>
              <p className="text-xs font-semibold text-[#1F5FAF] tracking-wide">
                {t('অফিস আদেশ ও বিজ্ঞপ্তি', 'Institutional Circulars & Updates')}
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl lg:text-3xl font-bold text-[#102B50]">
                {t('সর্বশেষ প্রাতিষ্ঠানিক আপডেট', 'Latest Institutional Updates')}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <Link
                to="/notices"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-xs sm:text-sm font-semibold text-[#102B50] hover:text-[#1F5FAF] transition-colors whitespace-nowrap"
              >
                <span>{t('সকল নোটিশ দেখুন', 'View All Notices')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/cloud"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F6F8FC] border border-slate-200 hover:border-[#1F5FAF] text-xs sm:text-sm font-semibold text-[#1F5FAF] transition-colors whitespace-nowrap"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>{t('ক্লাউড আর্কাইভ', 'BPSC Cloud')}</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notices.slice(0, 4).map((notice) => (
              <article
                key={notice.id}
                className="p-4 sm:p-5 rounded-xl bg-[#F6F8FC] hover:bg-white border border-slate-200/90 hover:border-[#1F5FAF]/40 transition-colors flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#617187] tabular-nums">
                    <span className="font-medium text-[#1F5FAF]">
                      {categoryLabel(notice.category)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={notice.publishDate}>{num(notice.publishDate)}</time>
                    {notice.attachmentUrl && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{t('সংযুক্তি যুক্ত', 'Attachment')}</span>
                      </>
                    )}
                  </div>

                  <h3 className="mt-1.5 text-sm sm:text-base font-semibold text-[#17263C] leading-snug">
                    <Link
                      to={`/notices/${notice.id}`}
                      className="hover:text-[#1F5FAF] transition-colors"
                    >
                      {t(notice.titleBn, notice.titleEn)}
                    </Link>
                  </h3>

                  <p className="mt-1.5 text-xs sm:text-sm text-[#617187] line-clamp-2 leading-relaxed">
                    {t(notice.summaryBn, notice.summaryEn)}
                  </p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-200/70 flex items-center justify-between gap-3">
                  <Link
                    to={`/notices/${notice.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#102B50] hover:text-[#1F5FAF] transition-colors"
                  >
                    <span>{t('বিস্তারিত দেখুন', 'Read More')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  {notice.attachmentUrl && (
                    <a
                      href={notice.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#1F5FAF] hover:underline"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>{t('সংযুক্তি খুলুন', 'Open Attachment')}</span>
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 8. TEACHERS PREVIEW */}
      <section className="py-10 sm:py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
            <div>
              <p className="text-xs font-semibold text-[#1F5FAF] tracking-wide">
                {t('আমাদের শিক্ষকমণ্ডলী', 'Dedicated Faculty')}
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl lg:text-3xl font-bold text-[#102B50]">
                {t('অভিজ্ঞ ও নিবেদিতপ্রাণ শিক্ষকবৃন্দ', 'Meet Our Teachers')}
              </h2>
            </div>
            <Link
              to="/teachers"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs sm:text-sm font-medium transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <span>{t('সকল শিক্ষক দেখুন', 'View All Teachers')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {teachers.slice(0, 8).map((teacher) => (
              <Link
                key={teacher.id}
                to={`/teachers/${teacher.id}`}
                className="group bg-white rounded-xl border border-slate-200/90 hover:border-[#1F5FAF]/45 p-4 transition-all flex flex-col justify-between h-full"
              >
                <div className="flex items-start gap-3.5">
                  <SmartImage
                    src={teacher.photoUrl}
                    alt={teacher.name}
                    fallbackType="person"
                    fallbackLabel={teacher.name}
                    className="w-16 h-20 sm:w-[68px] sm:h-[85px] aspect-[4/5] rounded-lg border border-slate-200 bg-[#F6F8FC] shrink-0"
                    imgClassName="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-200"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] sm:text-xs font-medium text-[#1F5FAF] truncate">
                      {t(teacher.subjectBn, teacher.subjectEn)}
                    </div>
                    <h3 className="mt-0.5 text-sm sm:text-[15px] font-bold text-[#102B50] group-hover:text-[#1F5FAF] transition-colors leading-snug line-clamp-2">
                      {t(teacher.nameBn, teacher.name)}
                    </h3>
                    <p className="mt-0.5 text-xs text-[#617187] line-clamp-2 leading-snug">
                      {t(teacher.designationBn, teacher.designationEn)}
                    </p>
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[#617187] truncate">
                    {teacher.qualification || t(teacher.departmentBn, teacher.department)}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#1F5FAF] shrink-0">
                    <span>{t('প্রোফাইল', 'Profile')}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 9. CAMPUS FACILITIES */}
      <section className="py-10 sm:py-12 lg:py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
            <div>
              <p className="text-xs font-semibold text-[#1F5FAF] tracking-wide">
                {t('ক্যাম্পাস অবকাঠামো ও পরিবেশ', 'Infrastructure & Student Care')}
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl lg:text-3xl font-bold text-[#102B50]">
                {t('আমাদের সুযোগ-সুবিধাসমূহ', 'Campus Facilities')}
              </h2>
            </div>
            <Link
              to="/facilities"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1F5FAF] hover:text-[#102B50] transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <span>{t('বিস্তারিত দেখুন', 'Explore All Facilities')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {facilities.slice(0, 3).map((fac) => (
              <div
                key={fac.id}
                className="bg-[#F6F8FC] rounded-xl border border-slate-200/90 overflow-hidden flex flex-col h-full"
              >
                <SmartImage
                  src={fac.imageUrl}
                  alt={t(fac.titleBn, fac.titleEn)}
                  className="w-full aspect-[16/10]"
                  imgClassName="w-full h-full object-cover"
                />
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#102B50] leading-snug">
                      {t(fac.titleBn, fac.titleEn)}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-[#617187] leading-relaxed line-clamp-3">
                      {t(fac.descriptionBn, fac.descriptionEn)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. GALLERY PREVIEW */}
      <section className="py-10 sm:py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
            <div>
              <p className="text-xs font-semibold text-[#1F5FAF] tracking-wide">
                {t('আলোকচিত্র আর্কাইভ', 'Campus Moments')}
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl lg:text-3xl font-bold text-[#102B50]">
                {t('ফটো গ্যালারি', 'Photo Gallery')}
              </h2>
            </div>
            <Link
              to="/gallery"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:border-[#1F5FAF] text-xs sm:text-sm font-semibold text-[#102B50] hover:text-[#1F5FAF] transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <span>{t('সম্পূর্ণ গ্যালারি দেখুন', 'Open Full Gallery')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {gallery.slice(0, 8).map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() =>
                  setLightboxImage({
                    url: photo.imageUrl,
                    title: t(photo.titleBn, photo.titleEn),
                  })
                }
                className="group relative rounded-xl overflow-hidden border border-slate-200 bg-white aspect-[4/3] text-left focus-visible:outline-2 focus-visible:outline-[#1F5FAF]"
              >
                <SmartImage
                  src={photo.imageUrl}
                  alt={t(photo.titleBn, photo.titleEn)}
                  className="w-full h-full"
                  imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-2.5 sm:p-3">
                  <p className="text-[11px] sm:text-xs font-medium text-white line-clamp-1">
                    {t(photo.titleBn, photo.titleEn)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 11. CONTACT SECTION */}
      <section className="py-10 sm:py-12 lg:py-16 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            <div className="lg:col-span-5 flex flex-col justify-between bg-[#F6F8FC] rounded-xl border border-slate-200/90 p-5 sm:p-7">
              <div>
                <p className="text-xs font-semibold text-[#1F5FAF] tracking-wide">
                  {t('যোগাযোগ ও অবস্থান', 'Reach Our Campus')}
                </p>
                <h2 className="mt-1 text-xl sm:text-2xl font-bold text-[#102B50]">
                  {t('আমাদের সাথে যোগাযোগ করুন', 'Contact Information')}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-[#617187] leading-relaxed">
                  {t(
                    'ভর্তি, ফলাফল বা দাপ্তরিক যেকোনো প্রয়োজনে অফিস চলাকালীন সময়ে আমাদের সাথে যোগাযোগ করুন।',
                    'Reach out during school office hours for admission inquiries, official records, or guardian appointments.'
                  )}
                </p>

                <div className="mt-5 space-y-3.5 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#1F5FAF] mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-[#102B50] text-xs sm:text-sm">
                        {t('ঠিকানা', 'Campus Address')}
                      </div>
                      <div className="text-xs sm:text-sm text-[#617187] mt-0.5">
                        {t(settings.addressBn, settings.addressEn)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 tabular-nums">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-[#1F5FAF] mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-[#102B50] text-xs sm:text-sm">
                        {t('মোবাইল নম্বর', 'Mobile')}
                      </div>
                      <div className="text-xs sm:text-sm text-[#617187] mt-0.5 space-x-2">
                        <a href={`tel:${settings.phonePrimary}`} className="hover:text-[#1F5FAF]">
                          {num(settings.phonePrimary)}
                        </a>
                        {settings.phoneSecondary && (
                          <>
                            <span>,</span>
                            <a
                              href={`tel:${settings.phoneSecondary}`}
                              className="hover:text-[#1F5FAF]"
                            >
                              {num(settings.phoneSecondary)}
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-[#1F5FAF] mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-[#102B50] text-xs sm:text-sm">
                        {t('ইমেইল', 'Official Email')}
                      </div>
                      <div className="text-xs sm:text-sm text-[#617187] mt-0.5 break-all space-y-0.5">
                        <a
                          href={`mailto:${settings.emailPrimary}`}
                          className="block hover:text-[#1F5FAF]"
                        >
                          {settings.emailPrimary}
                        </a>
                        {settings.emailSecondary && (
                          <a
                            href={`mailto:${settings.emailSecondary}`}
                            className="block hover:text-[#1F5FAF]"
                          >
                            {settings.emailSecondary}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 w-full min-h-[44px] px-5 py-2.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-sm font-semibold transition-colors"
                >
                  <span>{t('অনলাইনে বার্তা পাঠান', 'Send Us a Message')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 h-[260px] sm:h-[320px] lg:h-auto lg:min-h-[340px] rounded-xl overflow-hidden border border-slate-200 bg-[#F6F8FC]">
              <iframe
                src={settings.mapEmbedUrl}
                title="BEPZA Public School and College Ishwardi EPZ Map"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal for Homepage Gallery Preview */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-[#102B50]/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="max-w-4xl w-full bg-white rounded-xl overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
              <p className="text-xs sm:text-sm font-semibold text-[#102B50] truncate">
                {lightboxImage.title}
              </p>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                aria-label={t('বন্ধ করুন', 'Close')}
                className="p-1.5 rounded-lg text-[#617187] hover:text-[#102B50] hover:bg-slate-100 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-950 flex items-center justify-center max-h-[78dvh] overflow-hidden">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                referrerPolicy="no-referrer"
                className="max-h-[78dvh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
