import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { submitContactInquiry } from '../services/publicContentService';
import { ContactInquiryInput } from '../types/school';
import { SeoHead } from '../components/common/SeoHead';
import { PageHeader } from '../components/common/PageHeader';

export const ContactPage: React.FC = () => {
  const { t, num } = useLanguage();
  const { settings, administration, teachers } = usePublicData();

  const principal = administration.find((a) => a.roleKey === 'principal');
  const assistantHead = teachers.find((tr) => tr.serial === 1);

  const [form, setForm] = useState<ContactInquiryInput>({
    senderName: '',
    senderEmail: '',
    senderPhone: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const errorMessageForCode = (code: string): string => {
    switch (code) {
      case 'VALIDATION_NAME':
        return t(
          'অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন (কমপক্ষে ২ অক্ষর)।',
          'Please enter your full name (at least 2 characters).'
        );
      case 'VALIDATION_EMAIL':
        return t(
          'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা প্রদান করুন।',
          'Please enter a valid email address.'
        );
      case 'VALIDATION_PHONE':
        return t(
          'অনুগ্রহ করে একটি সঠিক মোবাইল বা টেলিফোন নম্বর লিখুন।',
          'Please enter a valid contact phone number.'
        );
      case 'VALIDATION_SUBJECT':
        return t(
          'অনুগ্রহ করে বার্তার বিষয় উল্লেখ করুন (কমপক্ষে ৩ অক্ষর)।',
          'Please specify a subject (at least 3 characters).'
        );
      case 'VALIDATION_MESSAGE':
        return t(
          'অনুগ্রহ করে বিস্তারিত বার্তা লিখুন (কমপক্ষে ১০ অক্ষর)।',
          'Please write a detailed message (at least 10 characters).'
        );
      default:
        return t(
          'বার্তা প্রেরণে ত্রুটি ঘটেছে। অনুগ্রহ করে সরাসরি প্রদত্ত ফোন নম্বরে যোগাযোগ করুন।',
          'Unable to submit your message right now. Please reach out directly via our official phone numbers.'
        );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    setSubmitting(true);

    try {
      const result = await submitContactInquiry(form);
      setSubmittedRef(result.referenceId);
      setForm({
        senderName: '',
        senderEmail: '',
        senderPhone: '',
        subject: '',
        message: '',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'UNKNOWN';
      setFieldError(errorMessageForCode(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead
        title={t('যোগাযোগ ও অবস্থান', 'Contact & Campus Location')}
        description={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড, পাকশী, পাবনা — অফিসিয়াল ঠিকানা, ফোন নম্বর, ইমেইল, অভিযোগ প্রতিকার (GRS) ফোকাল পয়েন্ট ও অনলাইন যোগাযোগ ফরম।',
          'Official address, phone numbers, email addresses, GRS Focal Point, Google Map location, and online inquiry form for BEPZA Public School and College, Ishwardi EPZ.'
        )}
      />

      <PageHeader
        titleBn="যোগাযোগ ও অবস্থান"
        titleEn="Contact & Campus Location"
        subtitleBn="বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড, পাকশী, পাবনা — প্রশাসনিক যোগাযোগ ও অনলাইন অনুসন্ধান।"
        subtitleEn="Reach our administrative office, Principal & GRS Focal Point, or submit an official online inquiry."
        breadcrumbs={[{ labelBn: 'যোগাযোগ', labelEn: 'Contact' }]}
      />

      <section className="py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Verified Contact Directory */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200/90 p-6 space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-[#102B50]">
                    {t('প্রাতিষ্ঠানিক যোগাযোগের ঠিকানা', 'Official Institutional Address')}
                  </h2>
                  <p className="text-xs text-[#617187] mt-0.5 tabular-nums">
                    EIIN: {num(settings.eiin)} · {t('স্থাপিত:', 'Est.')} {num(settings.establishedYear)}
                  </p>
                </div>

                <div className="space-y-4 text-sm text-[#17263C]">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#1F5FAF] shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-[#102B50]">
                        {t(settings.schoolNameBn, settings.schoolNameEn)}
                      </p>
                      <p className="text-[#617187] mt-0.5">
                        {t(settings.addressBn, settings.addressEn)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-[#1F5FAF] shrink-0 mt-1" />
                    <div className="space-y-1 tabular-nums">
                      <a
                        href={`tel:${settings.phonePrimary}`}
                        className="block font-semibold text-[#102B50] hover:text-[#1F5FAF]"
                      >
                        {num(settings.phonePrimary)}{' '}
                        <span className="text-xs font-normal text-[#617187]">
                          ({t('অধ্যক্ষ - ভারপ্রাপ্ত', 'Principal Incharge')})
                        </span>
                      </a>
                      <a
                        href={`tel:${settings.phoneSecondary}`}
                        className="block font-semibold text-[#102B50] hover:text-[#1F5FAF]"
                      >
                        {num(settings.phoneSecondary)}{' '}
                        <span className="text-xs font-normal text-[#617187]">
                          ({t('সহকারী প্রধান শিক্ষক', 'Assistant Head Teacher')})
                        </span>
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-[#1F5FAF] shrink-0 mt-1" />
                    <div className="space-y-1 break-all">
                      <a
                        href={`mailto:${settings.emailPrimary}`}
                        className="block font-medium text-[#102B50] hover:text-[#1F5FAF]"
                      >
                        {settings.emailPrimary}
                      </a>
                      <a
                        href={`mailto:${settings.emailSecondary}`}
                        className="block font-medium text-[#102B50] hover:text-[#1F5FAF]"
                      >
                        {settings.emailSecondary}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-[#1F5FAF] shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-[#102B50]">
                        {t('অফিস সময়সূচি', 'Administrative Office Hours')}
                      </p>
                      <p className="text-xs sm:text-sm text-[#617187]">
                        {t(
                          'রবিবার – বৃহস্পতিবার (সরকারি ছুটির দিন ব্যতীত একাডেমিক সময়সূচি অনুযায়ী)',
                          'Sunday – Thursday (Regular academic hours, excluding government holidays)'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Focal Persons */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-6 space-y-4">
                <h3 className="text-base font-bold text-[#102B50]">
                  {t(
                    'প্রধান প্রশাসনিক ও অভিযোগ প্রতিকার (GRS) ফোকাল পয়েন্ট',
                    'Key Contacts & GRS Focal Point'
                  )}
                </h3>

                {principal && (
                  <div className="p-4 rounded-xl bg-[#F6F8FC] border border-slate-200/80 space-y-1">
                    <p className="text-xs font-semibold text-[#1F5FAF]">
                      {t(
                        'অধ্যক্ষ (ভারপ্রাপ্ত) ও অভিযোগ প্রতিকার ফোকাল পয়েন্ট',
                        'Principal (Incharge) & GRS Focal Point'
                      )}
                    </p>
                    <p className="text-sm font-bold text-[#102B50]">
                      {t(principal.nameBn, principal.name)}
                    </p>
                    <p className="text-xs text-[#617187] tabular-nums">
                      {num(settings.phonePrimary)} · {settings.emailPrimary}
                    </p>
                  </div>
                )}

                {assistantHead && (
                  <div className="p-4 rounded-xl bg-[#F6F8FC] border border-slate-200/80 space-y-1">
                    <p className="text-xs font-semibold text-[#1F5FAF]">
                      {t(assistantHead.designationBn, assistantHead.designationEn)}
                    </p>
                    <p className="text-sm font-bold text-[#102B50]">
                      {t(assistantHead.nameBn, assistantHead.name)}
                    </p>
                    <p className="text-xs text-[#617187] tabular-nums">
                      {num(assistantHead.publicPhone)} · {assistantHead.publicEmail}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Validated Online Inquiry Form */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8">
              <div className="pb-5 border-b border-slate-200">
                <h2 className="text-lg sm:text-xl font-bold text-[#102B50]">
                  {t('অনলাইন অনুসন্ধান ও যোগাযোগ ফরম', 'Send an Official Inquiry')}
                </h2>
                <p className="text-xs sm:text-sm text-[#617187] mt-1">
                  {t(
                    'ভর্তি, একাডেমিক তথ্য বা প্রশাসনিক যেকোনো বিষয়ে আপনার জিজ্ঞাসা নিচের ফরমে প্রেরণ করুন।',
                    'Submit admission, academic, or administrative questions directly to the BPSC office.'
                  )}
                </p>
              </div>

              {submittedRef ? (
                <div className="py-10 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#102B50]">
                    {t(
                      'আপনার বার্তা সফলভাবে গৃহীত হয়েছে',
                      'Your Inquiry Has Been Recorded'
                    )}
                  </h3>
                  <p className="text-sm text-[#617187] max-w-md mx-auto leading-relaxed">
                    {t(
                      'ধন্যবাদ। বিদ্যালয় প্রশাসন আপনার বার্তাটি পর্যালোচনা করে প্রদত্ত ইমেইল বা ফোন নম্বরে যোগাযোগ করবে।',
                      'Thank you for contacting BEPZA Public School and College, Ishwardi EPZ. Our administrative office will review your message.'
                    )}
                  </p>
                  <p className="text-xs font-mono text-[#1F5FAF] bg-[#F6F8FC] inline-block px-3 py-1.5 rounded-lg border border-slate-200">
                    {t('রেফারেন্স আইডি:', 'Reference ID:')} {submittedRef}
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={() => setSubmittedRef(null)}
                      className="mt-2 inline-flex items-center px-4 py-2 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-xs font-semibold text-[#102B50]"
                    >
                      {t('নতুন বার্তা পাঠান', 'Send Another Inquiry')}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                  {fieldError && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5"
                    >
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{fieldError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="senderName"
                        className="block text-xs font-semibold text-[#102B50] mb-1.5"
                      >
                        {t('আপনার পূর্ণ নাম *', 'Full Name *')}
                      </label>
                      <input
                        id="senderName"
                        type="text"
                        required
                        maxLength={120}
                        value={form.senderName}
                        onChange={(e) => setForm({ ...form, senderName: e.target.value })}
                        placeholder={t('নাম লিখুন', 'Enter your full name')}
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-[#F6F8FC] focus:bg-white focus:border-[#1F5FAF] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="senderPhone"
                        className="block text-xs font-semibold text-[#102B50] mb-1.5"
                      >
                        {t('মোবাইল নম্বর *', 'Phone Number *')}
                      </label>
                      <input
                        id="senderPhone"
                        type="tel"
                        required
                        maxLength={30}
                        value={form.senderPhone}
                        onChange={(e) => setForm({ ...form, senderPhone: e.target.value })}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-[#F6F8FC] focus:bg-white focus:border-[#1F5FAF] focus:outline-none tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="senderEmail"
                        className="block text-xs font-semibold text-[#102B50] mb-1.5"
                      >
                        {t('ইমেইল ঠিকানা *', 'Email Address *')}
                      </label>
                      <input
                        id="senderEmail"
                        type="email"
                        required
                        maxLength={160}
                        value={form.senderEmail}
                        onChange={(e) => setForm({ ...form, senderEmail: e.target.value })}
                        placeholder="name@example.com"
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-[#F6F8FC] focus:bg-white focus:border-[#1F5FAF] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-xs font-semibold text-[#102B50] mb-1.5"
                      >
                        {t('বিষয় *', 'Subject *')}
                      </label>
                      <input
                        id="subject"
                        type="text"
                        required
                        maxLength={200}
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        placeholder={t('যেমন: ভর্তি সংক্রান্ত তথ্য', 'e.g., Admission Inquiry')}
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-[#F6F8FC] focus:bg-white focus:border-[#1F5FAF] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-xs font-semibold text-[#102B50] mb-1.5"
                    >
                      {t('বিস্তারিত বার্তা *', 'Message *')}
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      required
                      maxLength={3000}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder={t(
                        'আপনার জিজ্ঞাসা বা মতামত বিস্তারিত লিখুন...',
                        'Write your inquiry in detail...'
                      )}
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-[#F6F8FC] focus:bg-white focus:border-[#1F5FAF] focus:outline-none resize-y"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t('প্রেরণ করা হচ্ছে...', 'Submitting...')}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>{t('বার্তা প্রেরণ করুন', 'Submit Inquiry')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Embedded Campus Location Map */}
          <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#102B50]">
                  {t('ক্যাম্পাস মানচিত্র (ঈশ্বরদী ইপিজেড, পাকশী, পাবনা)', 'Campus Map — Ishwardi EPZ, Paksey, Pabna')}
                </h2>
                <p className="text-xs text-[#617187]">
                  {t(settings.addressBn, settings.addressEn)}
                </p>
              </div>
            </div>
            <div className="w-full h-[260px] sm:h-[360px] bg-slate-100">
              <iframe
                src={settings.mapEmbedUrl}
                title={t('বেপজা পাবলিক স্কুল এন্ড কলেজ মানচিত্র', 'BPSC Ishwardi EPZ Map')}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
