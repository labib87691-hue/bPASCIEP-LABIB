import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Cloud, ExternalLink, Lock, Mail, MapPin, Phone } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePublicData } from '../../context/PublicDataContext';
import { OFFICIAL_EXTERNAL_LINKS } from '../../data/verifiedSchoolData';

export const Footer: React.FC = () => {
  const { t, num } = useLanguage();
  const { settings } = usePublicData();
  const currentYear = new Date().getFullYear();
  const logoSrc = settings.logoUrl?.trim() || '/assets/branding/logo.jpeg';

  return (
    <footer className="bg-[#102B50] text-slate-200 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Column 1: School Identity & Contact */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={logoSrc}
                alt="BPSC Official Logo"
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-11 h-11 rounded-full object-cover border border-white/20 bg-white shrink-0"
              />
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-white leading-snug">
                  {t(settings.schoolNameBn, settings.schoolNameEn)}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5 tabular-nums">
                  EIIN: {num(settings.eiin)} · {t('স্থাপিত:', 'Est.')} {num(settings.establishedYear)}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {settings.footerTaglineBn || settings.footerTaglineEn
                ? t(
                    settings.footerTaglineBn || settings.footerTaglineEn || '',
                    settings.footerTaglineEn || settings.footerTaglineBn || ''
                  )
                : t(
                    'বাংলাদেশ রপ্তানি প্রক্রিয়াকরণ এলাকা কর্তৃপক্ষ (বেপজা) পরিচালিত ঈশ্বরদী ইপিজেড-এর একটি আধুনিক ও মানসম্মত শিক্ষাপ্রতিষ্ঠান।',
                    'An educational institution operated under Bangladesh Export Processing Zones Authority (BEPZA) providing modern quality education at Ishwardi EPZ.'
                  )}
            </p>

            <div className="space-y-2.5 pt-1 text-xs sm:text-sm text-slate-200">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#17A9C6] mt-0.5 shrink-0" />
                <span>{t(settings.addressBn, settings.addressEn)}</span>
              </div>
              <div className="flex items-center gap-2.5 tabular-nums">
                <Phone className="w-4 h-4 text-[#17A9C6] shrink-0" />
                <div>
                  <a href={`tel:${settings.phonePrimary}`} className="hover:text-white transition-colors">
                    {num(settings.phonePrimary)}
                  </a>
                  {settings.phoneSecondary && (
                    <>
                      <span className="mx-1.5 text-white/40">,</span>
                      <a href={`tel:${settings.phoneSecondary}`} className="hover:text-white transition-colors">
                        {num(settings.phoneSecondary)}
                      </a>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#17A9C6] mt-0.5 shrink-0" />
                <div className="space-y-0.5 break-all">
                  <a href={`mailto:${settings.emailPrimary}`} className="block hover:text-white transition-colors">
                    {settings.emailPrimary}
                  </a>
                  {settings.emailSecondary && (
                    <a href={`mailto:${settings.emailSecondary}`} className="block hover:text-white transition-colors">
                      {settings.emailSecondary}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Institutional Navigation */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-semibold text-white tracking-wide">
              {t('প্রাতিষ্ঠানিক লিংক', 'Institution')}
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  {t('পরিচিতি ও ইতিহাস', 'About Us')}
                </Link>
              </li>
              <li>
                <Link to="/administration" className="hover:text-white transition-colors">
                  {t('প্রশাসন ও বাণী', 'Administration')}
                </Link>
              </li>
              <li>
                <Link to="/governing-body" className="hover:text-white transition-colors">
                  {t('গভর্নিং বডি', 'Governing Body')}
                </Link>
              </li>
              <li>
                <Link to="/teachers" className="hover:text-white transition-colors">
                  {t('শিক্ষক ও স্টাফ', 'Teachers & Staff')}
                </Link>
              </li>
              <li>
                <Link to="/facilities" className="hover:text-white transition-colors">
                  {t('সুযোগ-সুবিধা', 'Facilities')}
                </Link>
              </li>
              <li>
                <Link to="/transport" className="hover:text-white transition-colors">
                  {t('পরিবহন ব্যবস্থা', 'Transport')}
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-white transition-colors">
                  {t('গ্যালারি', 'Gallery')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Portals & Centralized Cloud Resources (No Academic menu) */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-sm font-semibold text-white tracking-wide">
              {t('ডিজিটাল পোর্টাল ও সেবা', 'Portals & Services')}
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              <li>
                <Link
                  to="/cloud"
                  className="inline-flex items-center gap-1.5 text-[#17A9C6] hover:text-white font-medium transition-colors"
                >
                  <Cloud className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('বিপিএসসি ক্লাউড (সকল রিসোর্স)', 'BPSC Cloud')}</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/result"
                  className="inline-flex items-center gap-1.5 text-[#17A9C6] hover:text-white font-medium transition-colors"
                >
                  <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('অনলাইন ফলাফল পোর্টাল', 'Result Portal')}</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/cloud?category=Class+Routine"
                  className="hover:text-white transition-colors"
                >
                  {t('ক্লাস ও পরীক্ষার রুটিন (ক্লাউড)', 'Routines & Schedules (Cloud)')}
                </Link>
              </li>
              <li>
                <Link
                  to="/cloud?category=Holiday+List"
                  className="hover:text-white transition-colors"
                >
                  {t('ছুটির তালিকা ও বর্ষপঞ্জি', 'Holiday List & Calendar')}
                </Link>
              </li>
              <li>
                <Link to="/notices" className="hover:text-white transition-colors">
                  {t('নোটিশ ও অফিস আদেশ', 'Notices & Orders')}
                </Link>
              </li>
              <li>
                <Link to="/news" className="hover:text-white transition-colors">
                  {t('সংবাদ ও অনুষ্ঠানসমূহ', 'News & Events')}
                </Link>
              </li>
              <li>
                <Link to="/admission" className="hover:text-white transition-colors">
                  {t('ভর্তি তথ্য', 'Admission')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Official Education Links & Social */}
          <div className="sm:col-span-2 lg:col-span-3 space-y-3">
            <h3 className="text-sm font-semibold text-white tracking-wide">
              {t('গুরুত্বপূর্ণ সরকারি লিংক', 'Featured Official Links')}
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              {OFFICIAL_EXTERNAL_LINKS.map((item) => (
                <li key={item.url}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1.5 hover:text-white transition-colors"
                  >
                    <span>{t(item.titleBn, item.titleEn)}</span>
                    <ExternalLink className="w-3 h-3 mt-1 shrink-0 opacity-75" />
                  </a>
                </li>
              ))}
            </ul>

            <div className="pt-3 border-t border-white/10 space-y-2">
              {settings.facebookUrl && (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-medium text-white hover:text-[#17A9C6] transition-colors"
                >
                  <span>{t('অফিসিয়াল ফেসবুক পেজ অনুসরণ করুন', 'Follow Official Facebook Page')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {settings.youtubeUrl && (
                <div>
                  <a
                    href={settings.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    <span>{t('অফিসিয়াল ইউটিউব চ্যানেল', 'Official YouTube Channel')}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Legal */}
        <div className="mt-9 sm:mt-12 pt-5 sm:pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3.5 text-xs text-slate-400">
          <p className="text-center sm:text-left">
            © {num(currentYear)} {t(settings.schoolNameBn, settings.schoolNameEn)}.{' '}
            {t('সর্বস্বত্ব সংরক্ষিত।', 'All Rights Reserved.')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">
              {t('গোপনীয়তা নীতি', 'Privacy Policy')}
            </Link>
            <Link to="/contact" className="hover:text-white transition-colors">
              {t('যোগাযোগ', 'Contact')}
            </Link>
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Sitemap
            </a>
            <Link
              to="/teacher/login"
              className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            >
              <Lock className="w-3 h-3" />
              <span>{t('শিক্ষক পোর্টাল', 'Teacher Portal')}</span>
            </Link>
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            >
              <Lock className="w-3 h-3" />
              <span>{t('অ্যাডমিন পোর্টাল', 'Admin Portal')}</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
