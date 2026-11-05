import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { SeoHead } from '../components/common/SeoHead';
import { PageHeader } from '../components/common/PageHeader';
import { SmartImage } from '../components/common/SmartImage';

export const FacilitiesPage: React.FC = () => {
  const { t, lang, num } = useLanguage();
  const { facilities } = usePublicData();

  return (
    <>
      <SeoHead
        title={t('সুযোগ-সুবিধা ও ক্যাম্পাস অবকাঠামো', 'Campus Facilities')}
        description={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড-এর নিরাপদ ইপিজেড ক্যাম্পাস, বিজ্ঞান চর্চা, ডিজিটাল শিক্ষা, পরিবহন ও সহশিক্ষা সুযোগ-সুবিধা।',
          'Explore verified campus facilities at BEPZA Public School and College, Ishwardi EPZ including spacious classrooms, science innovation, digital learning, and student transport.'
        )}
      />

      <PageHeader
        titleBn="প্রতিষ্ঠানের সুযোগ-সুবিধা"
        titleEn="Institutional Facilities & Learning Environment"
        subtitleBn="ঈশ্বরদী ইপিজেড সংরক্ষিত এলাকার নিরাপদ ও সবুজ পরিবেশে শিক্ষার্থীদের সার্বিক বিকাশে আমাদের অবকাঠামোগত ও একাডেমিক সুবিধাসমূহ।"
        subtitleEn="Verified academic, scientific, co-curricular, and transport infrastructure inside the secure Ishwardi EPZ campus."
        breadcrumbs={[{ labelBn: 'সুযোগ-সুবিধা', labelEn: 'Facilities' }]}
      />

      <section className="py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {facilities.map((fac, idx) => {
              const highlights = lang === 'bn' ? fac.highlightsBn : fac.highlightsEn;
              return (
                <article
                  key={fac.id}
                  className="bg-white rounded-xl border border-slate-200/90 overflow-hidden flex flex-col"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <SmartImage
                      src={fac.imageUrl}
                      alt={t(fac.titleBn, fac.titleEn)}
                      className="w-full h-full"
                      imgClassName="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>

                  <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-5">
                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold text-[#1F5FAF] tabular-nums">
                        {t('সুবিধা ক্রমিক', 'Facility')} {num(String(idx + 1).padStart(2, '0'))}
                      </p>
                      <h2 className="text-lg sm:text-xl font-bold text-[#102B50] leading-snug">
                        {t(fac.titleBn, fac.titleEn)}
                      </h2>
                      <p className="text-sm text-[#617187] leading-relaxed">
                        {t(fac.descriptionBn, fac.descriptionEn)}
                      </p>
                    </div>

                    <ul className="pt-4 border-t border-slate-100 space-y-2">
                      {highlights.map((pt) => (
                        <li key={pt} className="flex items-start gap-2.5 text-sm text-[#17263C]">
                          <CheckCircle2 className="w-4 h-4 text-[#17A9C6] shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Dedicated Transport & Admission Callout */}
          <div className="bg-[#102B50] text-white rounded-xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <h2 className="text-lg sm:text-xl font-bold">
                {t(
                  'শিক্ষার্থী পরিবহন সেবা ও ভর্তি সংক্রান্ত তথ্য জানতে চান?',
                  'Looking for Student Transport Routes or Admission Guidelines?'
                )}
              </h2>
              <p className="text-sm text-slate-200 leading-relaxed">
                {t(
                  'প্রতিষ্ঠানের নিজস্ব পরিবহন ব্যবস্থা এবং নার্সারি থেকে ৯ম শ্রেণিতে শূন্য আসনে ভর্তির নিয়মাবলি পৃথক পৃষ্ঠায় বিস্তারিত দেওয়া আছে।',
                  'Explore dedicated student bus & microbus transport details or inspect official admission circulars and fee charts.'
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/transport"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#17A9C6] hover:bg-[#1493ad] text-white text-sm font-semibold transition-colors"
              >
                <span>{t('পরিবহন তথ্য', 'Transport Details')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/admission"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition-colors"
              >
                <span>{t('ভর্তি তথ্য', 'Admission Info')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
