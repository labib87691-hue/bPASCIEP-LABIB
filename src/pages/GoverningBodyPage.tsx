import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { SeoHead } from '../components/common/SeoHead';
import { PageHeader } from '../components/common/PageHeader';
import { SmartImage } from '../components/common/SmartImage';

export const GoverningBodyPage: React.FC = () => {
  const { t, num } = useLanguage();
  const { governingBody } = usePublicData();

  return (
    <>
      <SeoHead
        title={t('গভর্নিং বডি', 'Governing Body Members')}
        description={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড-এর গভর্নিং বডির সম্মানিত চেয়ারম্যান ও সদস্যবৃন্দের তালিকা।',
          'Verified Governing Body members and designations of BEPZA Public School and College, Ishwardi EPZ.'
        )}
      />

      <PageHeader
        titleBn="গভর্নিং বডি"
        titleEn="Governing Body"
        subtitleBn="বেপজা কর্তৃপক্ষ, ঈশ্বরদী ইপিজেড প্রশাসন এবং ইপিজেড শিল্পপ্রতিষ্ঠানের প্রতিনিধিদের সমন্বয়ে গঠিত পরিচালনা পর্ষদ।"
        subtitleEn="Institutional Governing Board comprising BEPZA leadership, Ishwardi EPZ administration, and enterprise representatives."
        breadcrumbs={[
          { labelBn: 'প্রশাসন', labelEn: 'Administration', to: '/administration' },
          { labelBn: 'গভর্নিং বডি', labelEn: 'Governing Body' },
        ]}
      />

      <section className="py-10 sm:py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {governingBody.map((member, index) => (
              <article
                key={member.id}
                className="bg-white rounded-xl border border-slate-200/90 p-5 flex items-start gap-4 h-full"
              >
                <SmartImage
                  src={member.photoUrl || undefined}
                  alt={member.name}
                  fallbackType="person"
                  fallbackLabel={member.name}
                  className="w-16 h-20 sm:w-20 sm:h-24 aspect-[4/5] rounded-lg border border-slate-200 bg-[#F6F8FC] shrink-0"
                  imgClassName="w-full h-full object-cover object-top"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-[#617187] tabular-nums">
                    <span>{num(`0${index + 1}`)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#1F5FAF] truncate">
                      {t(member.boardRoleBn, member.boardRoleEn)}
                    </span>
                  </div>
                  <h2 className="mt-1 text-base sm:text-lg font-bold text-[#102B50] leading-snug">
                    {t(member.nameBn, member.name)}
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#617187] leading-relaxed">
                    {t(member.designationBn, member.designationEn)}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-[#617187]">
              {t(
                'প্রশাসনিক কর্মকর্তাদের বাণী ও দায়িত্ব সম্পর্কে জানতে প্রশাসন পাতায় যান।',
                'Visit the Administration page to read official messages from the Chairman, Executive Director, and Principal.'
              )}
            </p>
            <Link
              to="/administration"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <span>{t('প্রশাসন ও বাণী', 'Administration & Messages')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};
