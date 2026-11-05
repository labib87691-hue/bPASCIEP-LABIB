import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { SeoHead } from '../components/common/SeoHead';
import { PageHeader } from '../components/common/PageHeader';

export const PrivacyPolicyPage: React.FC = () => {
  const { t, num } = useLanguage();
  const { settings } = usePublicData();

  const sections = [
    {
      titleBn: '১. তথ্যের উদ্দেশ্য ও পরিধি',
      titleEn: '1. Purpose & Institutional Scope',
      bodyBn:
        'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড-এর এই অফিসিয়াল ওয়েবসাইটটি শিক্ষার্থী, অভিভাবক, শিক্ষক ও সাধারণ দর্শনার্থীদের নিকট প্রাতিষ্ঠানিক বিজ্ঞপ্তি, একাডেমিক রুটিন, পাঠ্যক্রম ও ভর্তির প্রামাণ্য তথ্য পৌঁছে দেওয়ার জন্য পরিচালিত।',
      bodyEn:
        'This official website of BEPZA Public School and College (BPSC), Ishwardi EPZ provides students, guardians, educators, and prospective applicants with verified institutional notices, academic timetables, syllabi, and admission circulars.',
    },
    {
      titleBn: '২. যোগাযোগ ফরমে সংগৃহীত তথ্য',
      titleEn: '2. Information Submitted via Contact Inquiries',
      bodyBn:
        'দর্শনার্থী যখন যোগাযোগ পৃষ্ঠার অনলাইন ফরমের মাধ্যমে নাম, ইমেইল, ফোন নম্বর ও বার্তা প্রদান করেন, তখন উক্ত তথ্য শুধুমাত্র প্রশাসনিক উত্তর প্রদান ও দাপ্তরিক সেবার উদ্দেশ্যে সংরক্ষিত থাকে। জনসাধারণের জন্য উক্ত বার্তাগুলো উন্মুক্ত করা হয় না।',
      bodyEn:
        'When visitors submit their name, email address, phone number, and message through the Contact form, those records are stored strictly for administrative follow-up by authorized BPSC personnel and are never publicly listed.',
    },
    {
      titleBn: '৩. শিক্ষক ও প্রশাসনিক তথ্যের ব্যবহার',
      titleEn: '3. Public Directory & Official Documents',
      bodyBn:
        'ওয়েবসাইটে প্রকাশিত শিক্ষক-কর্মচারীবৃন্দের প্রাতিষ্ঠানিক পরিচিতি, অফিসিয়াল ফোন ও ইমেইল এবং পিডিএফ বিজ্ঞপ্তিসমূহ শুধুমাত্র একাডেমিক ও দাপ্তরিক যোগাযোগের জন্য প্রদত্ত। বাণিজ্যিক বা অননুমোদিত প্রচারণায় এসব তথ্য ব্যবহার নিষিদ্ধ।',
      bodyEn:
        'Published faculty profiles, official contact numbers, and downloadable PDF notices are provided solely for legitimate academic and institutional communication.',
    },
    {
      titleBn: '৪. বহিঃস্থ সরকারি ওয়েবসাইট লিংক',
      titleEn: '4. External Government Portals',
      bodyBn:
        'শিক্ষার্থী ও অভিভাবকদের সুবিধার্থে শিক্ষা মন্ত্রণালয়, রাজশাহী শিক্ষা বোর্ড, এনসিটিবি ও বেপজা-র অফিসিয়াল ওয়েবসাইটের লিংক সংযুক্ত রয়েছে। বহিঃস্থ ওয়েবসাইটসমূহ নিজস্ব নীতিমালা দ্বারা পরিচালিত।',
      bodyEn:
        'For convenience, this website links to official portals including the Ministry of Education, Rajshahi Education Board, NCTB, and BEPZA, each governed by its respective policies.',
    },
  ];

  return (
    <>
      <SeoHead
        title={t('গোপনীয়তা নীতি', 'Privacy Policy')}
        description={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড-এর ওয়েবসাইট ব্যবহার ও তথ্য সুরক্ষা নীতিমালা।',
          'Privacy and data protection policy for the official website of BEPZA Public School and College, Ishwardi EPZ.'
        )}
      />

      <PageHeader
        titleBn="গোপনীয়তা ও তথ্য সুরক্ষা নীতিমালা"
        titleEn="Privacy & Data Protection Policy"
        subtitleBn="প্রাতিষ্ঠানিক ওয়েবসাইট ব্যবহার এবং অনলাইন যোগাযোগ তথ্যের গোপনীয়তা সংক্রান্ত নির্দেশিকা।"
        subtitleEn="Guidelines governing public website usage and protection of submitted contact inquiries."
        breadcrumbs={[{ labelBn: 'গোপনীয়তা নীতি', labelEn: 'Privacy Policy' }]}
      />

      <section className="py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-10 space-y-8">
            {sections.map((sec) => (
              <div key={sec.titleEn} className="space-y-2">
                <h2 className="text-base sm:text-lg font-bold text-[#102B50]">
                  {t(sec.titleBn, sec.titleEn)}
                </h2>
                <p className="text-sm sm:text-base text-[#17263C] leading-relaxed">
                  {t(sec.bodyBn, sec.bodyEn)}
                </p>
              </div>
            ))}

            <div className="pt-6 border-t border-slate-200 text-xs sm:text-sm text-[#617187] space-y-1">
              <p className="font-semibold text-[#102B50]">
                {t(settings.schoolNameBn, settings.schoolNameEn)} (EIIN: {num(settings.eiin)})
              </p>
              <p>
                {t(settings.addressBn, settings.addressEn)} · {num(settings.phonePrimary)} ·{' '}
                {settings.emailPrimary}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
