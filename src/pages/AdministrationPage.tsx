import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Phone, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { SeoHead } from '../components/common/SeoHead';
import { PageHeader } from '../components/common/PageHeader';
import { SmartImage } from '../components/common/SmartImage';

export const AdministrationPage: React.FC = () => {
  const { t, num } = useLanguage();
  const { administration, teachers } = usePublicData();

  const assistantHead = teachers.find((tr) => tr.serial === 1);
  const coordinators = teachers.filter((tr) => Boolean(tr.coordinatorRoleEn));

  return (
    <>
      <SeoHead
        title={t('প্রশাসন ও বাণীসমূহ', 'Administration & Leadership Messages')}
        description={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড-এর নির্বাহী চেয়ারম্যান, নির্বাহী পরিচালক, অধ্যক্ষ (ভারপ্রাপ্ত) এবং প্রশাসনিক কর্মকর্তাদের তথ্য ও বাণী।',
          'Executive Chairman, Executive Director, Principal (Incharge), GRS Focal Point, and academic coordinators of BEPZA Public School and College, Ishwardi EPZ.'
        )}
      />

      <PageHeader
        titleBn="প্রশাসন ও বাণীসমূহ"
        titleEn="Administration & Official Messages"
        subtitleBn="বেপজা এবং ঈশ্বরদী ইপিজেড প্রশাসনের প্রত্যক্ষ তত্ত্বাবধানে পরিচালিত প্রাতিষ্ঠানিক নেতৃত্ব।"
        subtitleEn="Institutional leadership and official messages from BEPZA, Ishwardi EPZ, and BPSC Administration."
        breadcrumbs={[{ labelBn: 'প্রশাসন', labelEn: 'Administration' }]}
        actions={
          <Link
            to="/governing-body"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
          >
            <span>{t('গভর্নিং বডি দেখুন', 'View Governing Body')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />

      {/* Full Messages from Executive Chairman, Executive Director, Principal */}
      <section className="py-10 sm:py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          {administration.map((leader) => (
            <article
              key={leader.id}
              id={leader.id}
              className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-7 lg:p-9 scroll-mt-24"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                <div className="lg:col-span-4 flex flex-row sm:flex-col items-start gap-4 sm:gap-0">
                  <SmartImage
                    src={leader.photoUrl}
                    alt={leader.name}
                    fallbackType="person"
                    fallbackLabel={leader.name}
                    className="w-24 sm:w-36 lg:w-44 aspect-[4/5] rounded-xl border border-slate-200 shrink-0"
                    imgClassName="w-full h-full object-cover object-top"
                  />
                  <div className="sm:mt-4 min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#1F5FAF]">
                      {t(leader.designationBn, leader.designationEn)}
                    </p>
                    <h2 className="mt-1 text-base sm:text-xl font-bold text-[#102B50] leading-snug">
                      {t(leader.nameBn, leader.name)}
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-[#617187]">
                      {t(leader.organizationBn, leader.organizationEn)}
                    </p>

                    {(leader.phone || leader.email) && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-[#617187] tabular-nums">
                        {leader.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-[#1F5FAF] shrink-0" />
                            <a href={`tel:${leader.phone}`} className="hover:text-[#102B50]">
                              {num(leader.phone)}
                            </a>
                          </div>
                        )}
                        {leader.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-[#1F5FAF] shrink-0" />
                            <a
                              href={`mailto:${leader.email}`}
                              className="hover:text-[#102B50] break-all"
                            >
                              {leader.email}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-8">
                  <div className="pb-3 mb-4 border-b border-slate-200">
                    <span className="text-xs font-semibold text-[#617187] tracking-wide">
                      {t('আনুষ্ঠানিক বাণী', 'Official Message')}
                    </span>
                  </div>
                  <div className="space-y-3.5 text-sm sm:text-base text-[#17263C] leading-relaxed max-w-prose">
                    {t(leader.messageBn, leader.messageEn)
                      .split('\n\n')
                      .map((para, idx) => (
                        <p key={idx}>{para}</p>
                      ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Academic Administration & Official GRS Focal Point */}
      <section className="py-10 sm:py-12 lg:py-16 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <p className="text-xs font-semibold text-[#1F5FAF] tracking-wide">
              {t('একাডেমিক সমন্বয় ও অভিযোগ প্রতিকার', 'Academic Supervision & GRS')}
            </p>
            <h2 className="mt-1 text-xl sm:text-2xl lg:text-3xl font-bold text-[#102B50]">
              {t(
                'অন্যান্য যাচাইকৃত প্রশাসনিক দায়িত্বপ্রাপ্ত কর্মকর্তাবৃন্দ',
                'Verified Administrative & Section Leads'
              )}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* GRS Focal Point */}
            <div className="p-5 rounded-xl bg-[#F6F8FC] border border-slate-200/90 flex flex-col justify-between h-full">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#102B50]/10 text-[#102B50] flex items-center justify-center mb-3.5">
                  <ShieldCheck className="w-5 h-5 text-[#1F5FAF]" />
                </div>
                <div className="text-xs font-semibold text-[#1F5FAF]">
                  {t('অভিযোগ প্রতিকার ফোকাল পয়েন্ট (GRS)', 'GRS Focal Point')}
                </div>
                <h3 className="mt-1 text-sm sm:text-base font-bold text-[#102B50]">
                  {t('অলোক কুমার অধিকারী', 'Alok Kumar Adhikary')}
                </h3>
                <p className="mt-1 text-xs text-[#617187]">
                  {t(
                    'অধ্যক্ষ (ভারপ্রাপ্ত), বিপিএসসি, ঈশ্বরদী ইপিজেড',
                    'Principal (Incharge), BPSC, IEPZ'
                  )}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/70 text-xs text-[#617187] space-y-1 tabular-nums">
                <div>{num('01713564562')}</div>
                <div className="break-all">alokadhikary.bepza@gmail.com</div>
              </div>
            </div>

            {/* Assistant Head Teacher */}
            {assistantHead && (
              <Link
                to={`/teachers/${assistantHead.id}`}
                className="group p-5 rounded-xl bg-[#F6F8FC] hover:bg-white border border-slate-200/90 hover:border-[#1F5FAF]/40 transition-colors flex flex-col justify-between h-full"
              >
                <div className="flex items-start gap-3.5">
                  <SmartImage
                    src={assistantHead.photoUrl}
                    alt={assistantHead.name}
                    fallbackType="person"
                    fallbackLabel={assistantHead.name}
                    className="w-14 h-[70px] aspect-[4/5] rounded-lg border border-slate-200 shrink-0"
                    imgClassName="w-full h-full object-cover object-top"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#1F5FAF]">
                      {t(assistantHead.designationBn, assistantHead.designationEn)}
                    </div>
                    <h3 className="mt-0.5 text-sm sm:text-base font-bold text-[#102B50] group-hover:text-[#1F5FAF]">
                      {t(assistantHead.nameBn, assistantHead.name)}
                    </h3>
                    <p className="mt-1 text-xs text-[#617187] line-clamp-2">
                      {assistantHead.qualification}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/70 text-xs text-[#617187] tabular-nums">
                  {num(assistantHead.publicPhone)}
                </div>
              </Link>
            )}

            {/* Academic Coordinators */}
            {coordinators.map((coord) => (
              <Link
                key={coord.id}
                to={`/teachers/${coord.id}`}
                className="group p-5 rounded-xl bg-[#F6F8FC] hover:bg-white border border-slate-200/90 hover:border-[#1F5FAF]/40 transition-colors flex flex-col justify-between h-full"
              >
                <div className="flex items-start gap-3.5">
                  <SmartImage
                    src={coord.photoUrl}
                    alt={coord.name}
                    fallbackType="person"
                    fallbackLabel={coord.name}
                    className="w-14 h-[70px] aspect-[4/5] rounded-lg border border-slate-200 shrink-0"
                    imgClassName="w-full h-full object-cover object-top"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#1F5FAF]">
                      {t(
                        coord.coordinatorRoleBn || coord.designationBn,
                        coord.coordinatorRoleEn || coord.designationEn
                      )}
                    </div>
                    <h3 className="mt-0.5 text-sm sm:text-base font-bold text-[#102B50] group-hover:text-[#1F5FAF]">
                      {t(coord.nameBn, coord.name)}
                    </h3>
                    <p className="mt-1 text-xs text-[#617187] line-clamp-2">
                      {coord.qualification}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/70 text-xs text-[#617187] tabular-nums">
                  {num(coord.publicPhone)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
