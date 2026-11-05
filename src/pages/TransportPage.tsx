import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bus, CheckCircle2, Phone, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { SeoHead } from '../components/common/SeoHead';
import { PageHeader } from '../components/common/PageHeader';
import { SmartImage } from '../components/common/SmartImage';

export const TransportPage: React.FC = () => {
  const { t, num } = useLanguage();
  const { transport, staff, settings } = usePublicData();

  const verifiedDriver = useMemo(
    () =>
      staff.find(
        (s) =>
          s.designationEn.toLowerCase().includes('driver') ||
          s.name.toLowerCase().includes('narayon')
      ),
    [staff]
  );

  const safetyGuidelines = [
    {
      bn: 'ঈশ্বরদী ইপিজেড-এর সংরক্ষিত নিরাপত্তা বেষ্টনীর ভেতরে সরাসরি বিদ্যালয় প্রাঙ্গণে ওঠানামা।',
      en: 'Direct student boarding and alighting inside the protected Ishwardi EPZ campus courtyard.',
    },
    {
      bn: 'প্রতিষ্ঠানের নিয়োগপ্রাপ্ত ও অভিজ্ঞ নিজস্ব চালকের মাধ্যমে সুশৃঙ্খল পরিবহন পরিচালনা।',
      en: 'Operated by officially appointed and experienced institutional transport personnel.',
    },
    {
      bn: 'রুট ও আসন প্রাপ্যতা সম্পর্কে জানতে বিদ্যালয় অফিস কক্ষে অথবা প্রদত্ত নম্বরে যোগাযোগ করুন।',
      en: 'Contact the school administration office for current route stops and seat registration.',
    },
  ];

  return (
    <>
      <SeoHead
        title={t('শিক্ষার্থী পরিবহন ব্যবস্থা', 'Student Transport Service')}
        description={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড-এর নিজস্ব বাস ও মাইক্রোবাস শিক্ষার্থী পরিবহন সেবা।',
          'Dedicated institutional bus and microbus transport service for students of BEPZA Public School and College, Ishwardi EPZ.'
        )}
      />

      <PageHeader
        titleBn="শিক্ষার্থী পরিবহন ব্যবস্থা"
        titleEn="Student Transport Service"
        subtitleBn="শিক্ষার্থীদের নিরাপদ, সময়ানুবর্তী ও স্বাচ্ছন্দ্যময় যাতায়াতের জন্য প্রতিষ্ঠানের নিজস্ব পরিবহন বহর।"
        subtitleEn="Safe, punctual, and supervised institutional bus and microbus fleet serving BPSC students."
        breadcrumbs={[{ labelBn: 'পরিবহন', labelEn: 'Transport' }]}
      />

      <section className="py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Authentic Transport Fleet Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {transport.map((item, idx) => (
              <article
                key={item.id}
                className="bg-white rounded-xl border border-slate-200/90 overflow-hidden flex flex-col"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <SmartImage
                    src={item.imageUrl}
                    alt={t(item.titleBn, item.titleEn)}
                    className="w-full h-full"
                    imgClassName="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 sm:p-6 flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#1F5FAF] tabular-nums">
                    <Bus className="w-3.5 h-3.5 text-[#17A9C6]" />
                    <span>
                      {t('পরিবহন ইউনিট', 'Fleet Record')} {num(String(idx + 1).padStart(2, '0'))}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[#102B50]">
                    {t(item.titleBn, item.titleEn)}
                  </h2>
                  <p className="text-sm text-[#617187] leading-relaxed">
                    {t(item.descriptionBn, item.descriptionEn)}
                  </p>
                </div>
              </article>
            ))}
          </div>

          {/* Safety Protocol & Verified Driver Info */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1F5FAF]">
                  <ShieldCheck className="w-4 h-4 text-[#17A9C6]" />
                  <span>{t('নিরাপত্তা ও পরিবহন নীতিমালা', 'Safety & Commute Guidelines')}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-[#102B50]">
                  {t(
                    'নিরাপদ ক্যাম্পাস যাতায়াত ব্যবস্থাপনা',
                    'Supervised Campus Commute Inside Ishwardi EPZ'
                  )}
                </h2>
                <ul className="space-y-3 pt-2">
                  {safetyGuidelines.map((rule) => (
                    <li
                      key={rule.en}
                      className="flex items-start gap-2.5 text-sm text-[#17263C] leading-relaxed"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#17A9C6] shrink-0 mt-0.5" />
                      <span>{t(rule.bn, rule.en)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
                <a
                  href={`tel:${settings.phonePrimary}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs sm:text-sm font-semibold transition-colors tabular-nums"
                >
                  <Phone className="w-4 h-4" />
                  <span>
                    {t('অফিসে যোগাযোগ:', 'Office Inquiry:')} {num(settings.phonePrimary)}
                  </span>
                </a>
                <Link
                  to="/contact"
                  className="text-xs sm:text-sm font-semibold text-[#1F5FAF] hover:text-[#102B50] transition-colors"
                >
                  {t('অনলাইনে পরিবহন তথ্য জানতে বার্তা পাঠান →', 'Send a transport inquiry online →')}
                </Link>
              </div>
            </div>

            {verifiedDriver && (
              <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8 flex flex-col justify-between space-y-5">
                <div>
                  <p className="text-xs font-semibold text-[#1F5FAF]">
                    {t('যাচাইকৃত পরিবহন কর্মী তথ্য', 'Verified Transport Staff')}
                  </p>
                  <h3 className="text-lg font-bold text-[#102B50] mt-1">
                    {t('দায়িত্বপ্রাপ্ত পরিবহন চালক', 'Institutional Vehicle Driver')}
                  </h3>
                </div>

                <div className="flex items-center gap-4 bg-[#F6F8FC] p-4 rounded-xl border border-slate-200/80">
                  <SmartImage
                    src={verifiedDriver.photoUrl}
                    alt={verifiedDriver.name}
                    fallbackType="person"
                    fallbackLabel={verifiedDriver.name}
                    className="w-16 h-20 sm:w-20 sm:h-24 aspect-[4/5] rounded-lg border border-slate-200 shrink-0"
                    imgClassName="w-full h-full object-cover object-top"
                  />
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-base font-bold text-[#102B50]">
                      {t(verifiedDriver.nameBn, verifiedDriver.name)}
                    </h4>
                    <p className="text-xs font-medium text-[#1F5FAF]">
                      {t(verifiedDriver.designationBn, verifiedDriver.designationEn)}
                    </p>
                    <p className="text-xs text-[#617187]">
                      {t(
                        'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড',
                        'BEPZA Public School and College, Ishwardi EPZ'
                      )}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[#617187] leading-relaxed">
                  {t(
                    'দ্রষ্টব্য: পরিবহন রুট ও মাসিক চার্জ সংক্রান্ত হালনাগাদ তথ্যের জন্য ভর্তি ও প্রশাসনিক শাখায় যোগাযোগ করার অনুরোধ করা হলো।',
                    'Note: Please consult the school administrative desk during office hours for current stoppages and monthly transport charges.'
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};
