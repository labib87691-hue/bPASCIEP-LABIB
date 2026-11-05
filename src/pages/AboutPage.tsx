import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { SeoHead } from '../components/common/SeoHead';
import { PageHeader } from '../components/common/PageHeader';
import { SmartImage } from '../components/common/SmartImage';

export const AboutPage: React.FC = () => {
  const { t, num } = useLanguage();
  const { settings } = usePublicData();

  const missionPoints = [
    {
      bn: 'মানসম্মত ও যুগোপযোগী শিক্ষা প্রদান নিশ্চিত করা (Provide Quality Education)।',
      en: 'Provide Quality Education.',
    },
    {
      bn: 'মানবসম্পদ উন্নয়নের লক্ষ্যে দক্ষ ও আলোকিত নাগরিক তৈরি করা (Education for Human Resource Development)।',
      en: 'Education for Human Resource Development.',
    },
    {
      bn: 'সমসাময়িক ও আধুনিক শিক্ষা ব্যবস্থাকে গতিশীল করা (Boost up Contemporary Education System)।',
      en: 'Boost up Contemporary Education System.',
    },
    {
      bn: 'ডিজিটাল শিক্ষা ব্যবস্থার কার্যকর বাস্তবায়ন (Implementation of Digital Education System)।',
      en: 'Implementation of Digital Education System.',
    },
  ];

  const coreValues = [
    {
      titleBn: 'সুস্পষ্ট জ্ঞান ও মৌলিক ভিত্তি',
      titleEn: 'Fundamental Academic Clarity',
      descBn:
        'বন্ধুত্বপূর্ণ পরিবেশে শিক্ষার্থীদের মৌলিক ব্যাকরণ, গাণিতিক যুক্তি ও বৈজ্ঞানিক তত্ত্বের সুস্পষ্ট অনুধাবনে সহায়তা করা।',
      descEn:
        'Educating students in foundational grammar, scientific concepts, and clear analytical understanding.',
    },
    {
      titleBn: 'নৈতিক চরিত্র ও আত্মবিশ্বাস',
      titleEn: 'Moral Character & Self-Confidence',
      descBn:
        'কার্যকর যোগাযোগ দক্ষতা, সততা, দেশপ্রেম, শৃঙ্খলা এবং আত্মবিশ্বাসী ব্যক্তিত্ব গঠনে ধারাবাহিক পরিচর্যা।',
      descEn:
        'Emphasizing effective communication, ethical conduct, discipline, and personal self-confidence.',
    },
    {
      titleBn: 'উদ্যোক্তা মানসিকতা ও উদ্ভাবন',
      titleEn: 'Entrepreneurship & Scientific Inquiry',
      descBn:
        'বিজ্ঞান প্রজেক্ট, স্টার্টআপ আইডিয়া ও সৃজনশীল সহশিক্ষা কার্যক্রমের মাধ্যমে ভবিষ্যৎ নেতৃত্বের বিকাশ।',
      descEn:
        'Encouraging student innovation, science projects, and entrepreneurial problem-solving.',
    },
    {
      titleBn: 'অভিভাবক-শিক্ষক অংশীদারিত্ব',
      titleEn: 'Guardian-Teacher Partnership',
      descBn:
        'অভিভাবকদের মতামতকে সর্বোচ্চ গুরুত্ব দিয়ে শ্রেণি শিক্ষকদের নিয়মিত যোগাযোগ ও অভিভাবক সমাবেশ আয়োজন।',
      descEn:
        'Valuing guardian perspectives through regular parent-teacher consultations and open communication.',
    },
  ];

  return (
    <>
      <SeoHead
        title={t('আমাদের সম্পর্কে ও ইতিহাস', 'About BPSC, History, Mission & Vision')}
        description={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড-এর প্রতিষ্ঠার ইতিহাস (১২ নভেম্বর ২০১৯), লক্ষ্য, উদ্দেশ্য ও একাডেমিক পরিবেশ।',
          'Institutional introduction, establishment history (12 November 2019), mission, vision, values, and academic environment of BPSC, Ishwardi EPZ.'
        )}
      />

      <PageHeader
        titleBn="প্রতিষ্ঠান পরিচিতি ও ইতিহাস"
        titleEn="About BEPZA Public School and College"
        subtitleBn="মানসম্মত শিক্ষা, মানবসম্পদ উন্নয়ন এবং ডিজিটাল শিক্ষা বাস্তবায়নে নিবেদিত ঈশ্বরদী ইপিজেড-এর গৌরবময় বিদ্যাপীঠ।"
        subtitleEn="Established under BEPZA at Ishwardi Export Processing Zone, Paksey, Pabna (EIIN: 140336)."
        breadcrumbs={[{ labelBn: 'আমাদের সম্পর্কে', labelEn: 'About Us' }]}
      />

      {/* Institutional Introduction & History */}
      <section className="py-10 sm:py-14 lg:py-16 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-7 space-y-5">
              <p className="text-xs font-semibold text-[#1F5FAF] tracking-wide">
                {t('প্রতিষ্ঠার পটভূমি ও ইতিহাস', 'Establishment & Institutional History')}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#102B50] leading-tight">
                {t(
                  'বেপজা গভর্নিং বোর্ডের দূরদর্শী উদ্যোগ থেকে আধুনিক শিক্ষাপ্রতিষ্ঠান',
                  'From Visionary BEPZA Initiative to Leading Educational Institution'
                )}
              </h2>
              <p className="text-sm sm:text-base text-[#17263C] leading-relaxed">
                {t(
                  '১২ নভেম্বর ২০১৯ তারিখে অনুষ্ঠিত বাংলাদেশ রপ্তানি প্রক্রিয়াকরণ এলাকা কর্তৃপক্ষ (বেপজা)-এর ৩৪তম গভর্নিং বোর্ড সভায় ঈশ্বরদী রপ্তানি প্রক্রিয়াকরণ এলাকার (IEPZ) অব্যবহৃত NARI প্রজেক্টের প্রশিক্ষণ কেন্দ্র ও ডরমিটরি অবকাঠামোকে একটি মানসম্মত শিক্ষাপ্রতিষ্ঠান হিসেবে ব্যবহারের ঐতিহাসিক ও দূরদর্শী সিদ্ধান্ত গৃহীত হয়।',
                  'The 34th Governing Board meeting of BEPZA dated 12 November, 2019 took a visionary decision to utilize the unused infrastructure of the NARI Project training center and dormitory inside Ishwardi Export Processing Zone as an educational institute.'
                )}
              </p>
              <p className="text-sm sm:text-base text-[#617187] leading-relaxed">
                {t(
                  'এর মূল লক্ষ্য ছিল ঈশ্বরদী অঞ্চলের শিক্ষানুরাগী জনগোষ্ঠীর জন্য মানসম্মত শিক্ষার সুযোগ সৃষ্টি করা এবং ঈশ্বরদী ইপিজেড-এ কর্মরত শিল্পপ্রতিষ্ঠানসমূহের শ্রমিক, কর্মচারী ও কর্মকর্তাদের সন্তানদের জন্য আধুনিক শিক্ষার দ্বার উন্মোচন করা। ২ ফেব্রুয়ারি ২০২০ তারিখে আনুষ্ঠানিক উদ্বোধনের মধ্য দিয়ে প্রতিষ্ঠানটির একাডেমিক যাত্রা গতিশীল হয়।',
                  "Its founding purpose is to provide quality education for the people of the Ishwardi area and expand educational access for the children of workers and employees serving in IEPZ enterprises. Following formal inauguration on February 2, 2020, the institution has grown into one of Pabna's respected centers of learning."
                )}
              </p>

              {/* Key Institutional Facts */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-200 tabular-nums">
                <div>
                  <span className="text-xs text-[#617187] block">EIIN</span>
                  <span className="text-base font-bold text-[#102B50]">{num(settings.eiin)}</span>
                </div>
                <div>
                  <span className="text-xs text-[#617187] block">
                    {t('প্রতিষ্ঠা সিদ্ধান্ত', 'Board Decision')}
                  </span>
                  <span className="text-base font-bold text-[#102B50]">
                    {t('১২ নভেম্বর ২০১৯', '12 Nov 2019')}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-[#617187] block">
                    {t('একাডেমিক স্তর', 'Academic Scope')}
                  </span>
                  <span className="text-base font-bold text-[#102B50]">
                    {t('নার্সারি – ১০ম শ্রেণি', 'Nursery – Class 10')}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-3.5">
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-[#F6F8FC] p-2">
                <SmartImage
                  src="/assets/campus/campus-building-3.jpeg"
                  alt="BEPZA Public School and College Campus Building"
                  className="w-full aspect-[4/3] rounded-lg"
                  imgClassName="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <SmartImage
                  src="/assets/campus/campus-building-1.jpeg"
                  alt="BPSC Academic Courtyard"
                  className="w-full aspect-[4/3] rounded-xl border border-slate-200"
                  imgClassName="w-full h-full object-cover"
                />
                <SmartImage
                  src="/assets/campus/campus-grounds-1.jpg"
                  alt="BPSC Green Grounds"
                  className="w-full aspect-[4/3] rounded-xl border border-slate-200"
                  imgClassName="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision & Objectives */}
      <section className="py-10 sm:py-14 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Vision Card */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-7 sm:p-8 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-[#1F5FAF] tracking-wide">
                  {t('আমাদের রূপকল্প (Vision)', 'Institutional Vision')}
                </p>
                <h3 className="mt-2 text-xl sm:text-2xl font-bold text-[#102B50] leading-snug">
                  {t(
                    'বাংলাদেশের উত্তরাঞ্চলের একটি আদর্শ আবাসিক শিক্ষাপ্রতিষ্ঠানে পরিণত হওয়া।',
                    'To become a model Residential Educational Institute of northern areas of Bangladesh.'
                  )}
                </h3>
                <p className="mt-4 text-sm text-[#617187] leading-relaxed">
                  {t(
                    'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড কেবল পরীক্ষার ফলাফলেই সীমাবদ্ধ নয়; বরং শৃঙ্খলা, নৈতিকতা, বিজ্ঞানমনস্কতা ও মানবিক মূল্যবোধসম্পন্ন ভবিষ্যৎ প্রজন্ম গড়ে তোলার দীর্ঘমেয়াদি লক্ষ্য নিয়ে এগিয়ে চলেছে।',
                    'BPSC aspires to set a regional benchmark across northern Bangladesh by uniting disciplined academic excellence with holistic character formation.'
                  )}
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-slate-100 text-xs text-[#617187]">
                {t(
                  'সূত্র: অফিসিয়াল ভিশন স্টেটমেন্ট, বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড',
                  'Source: Official Vision Statement, BEPZA Public School and College, IEPZ'
                )}
              </div>
            </div>

            {/* Mission Card */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-7 sm:p-8">
              <p className="text-xs font-semibold text-[#1F5FAF] tracking-wide">
                {t('আমাদের অভিলক্ষ্য ও উদ্দেশ্য (Mission & Objectives)', 'Mission & Core Objectives')}
              </p>
              <h3 className="mt-2 text-xl sm:text-2xl font-bold text-[#102B50]">
                {t('চারটি সুনির্দিষ্ট স্তম্ভে আমাদের শিক্ষা কার্যক্রম', 'Four Founding Pillars of BPSC')}
              </h3>

              <ul className="mt-5 space-y-3.5">
                {missionPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#17263C]">
                    <CheckCircle2 className="w-5 h-5 text-[#17A9C6] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{t(pt.bn, pt.en)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Values & Academic Environment */}
      <section className="py-10 sm:py-14 lg:py-16 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-8">
            <p className="text-xs font-semibold text-[#1F5FAF] tracking-wide">
              {t('মূল্যবোধ ও শিক্ষার পরিবেশ', 'Values & Academic Environment')}
            </p>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold text-[#102B50]">
              {t(
                'প্রাকৃতিক সৌন্দর্যমণ্ডিত ক্যাম্পাসে আনন্দময় ও নিবিড় পাঠদান',
                'Institutional Values & Learning Atmosphere'
              )}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#617187] leading-relaxed">
              {t(
                'ক্যাম্পাসের মনোরম প্রাকৃতিক পরিবেশ, আধুনিক শিক্ষা উপকরণ, নিয়মিত খেলাধুলা এবং প্রাণবন্ত সহশিক্ষা কার্যক্রম শিক্ষার্থীদের মানসিক চাপ ও একঘেয়েমি থেকে মুক্ত রেখে পাঠে মনোযোগী করে তোলে।',
                'Modern educational facilities and the scenic natural beauty of the Ishwardi EPZ campus inspire students to learn with curiosity, confidence, and joy.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {coreValues.map((val, idx) => (
              <div
                key={idx}
                className="h-full p-5 sm:p-6 rounded-xl bg-[#F6F8FC] border border-slate-200/80"
              >
                <div className="text-xs font-semibold text-[#1F5FAF] tabular-nums">
                  {num(`0${idx + 1}`)}.
                </div>
                <h3 className="mt-1.5 text-lg font-bold text-[#102B50]">
                  {t(val.titleBn, val.titleEn)}
                </h3>
                <p className="mt-2 text-sm text-[#617187] leading-relaxed">
                  {t(val.descBn, val.descEn)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-[#617187]">
              {t(
                'আমাদের প্রশাসন, গভর্নিং বডি ও শিক্ষকবৃন্দ সম্পর্কে আরও জানুন।',
                'Learn more about our institutional leadership, governing board, and faculty.'
              )}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/administration"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs sm:text-sm font-semibold transition-colors"
              >
                <span>{t('প্রশাসন দেখুন', 'Administration')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/teachers"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-[#102B50] hover:text-[#1F5FAF] text-xs sm:text-sm font-semibold transition-colors"
              >
                <span>{t('শিক্ষক ডিরেক্টরি', 'Teacher Directory')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
