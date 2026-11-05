import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Copy, GraduationCap, Mail, Phone } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { SeoHead } from '../components/common/SeoHead';
import { PageHeader } from '../components/common/PageHeader';
import { SmartImage } from '../components/common/SmartImage';

export const TeacherDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, num } = useLanguage();
  const { teachers } = usePublicData();
  const [copiedField, setCopiedField] = useState<'phone' | 'email' | null>(null);

  const teacher = teachers.find((item) => item.id === id);

  if (!teacher) {
    return (
      <div className="py-20 px-4 text-center max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-[#102B50]">
          {t('শিক্ষকের প্রোফাইল পাওয়া যায়নি', 'Teacher Profile Not Found')}
        </h1>
        <p className="mt-2 text-sm text-[#617187]">
          {t(
            'অনুরোধকৃত শিক্ষক প্রোফাইলটি ডিরেক্টরিতে বিদ্যমান নেই।',
            'The requested faculty profile could not be found in the official directory.'
          )}
        </p>
        <Link
          to="/teachers"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#102B50] text-white text-sm font-semibold hover:bg-[#1F5FAF]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('শিক্ষক তালিকায় ফিরে যান', 'Back to Teacher Directory')}</span>
        </Link>
      </div>
    );
  }

  const colleagues = teachers
    .filter((tr) => tr.department === teacher.department && tr.id !== teacher.id)
    .slice(0, 4);

  const handleCopy = async (value: string, field: 'phone' | 'email') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <>
      <SeoHead
        title={`${t(teacher.nameBn, teacher.name)} — ${t(teacher.designationBn, teacher.designationEn)}`}
        description={`${teacher.name} (${teacher.designationEn}, ${teacher.subjectEn}) at BEPZA Public School and College, Ishwardi EPZ. ${teacher.qualification}`}
      />

      <PageHeader
        titleBn={teacher.nameBn}
        titleEn={teacher.name}
        subtitleBn={`${teacher.designationBn} · ${teacher.departmentBn}`}
        subtitleEn={`${teacher.designationEn} · ${teacher.department}`}
        breadcrumbs={[
          { labelBn: 'শিক্ষক ও কর্মচারী', labelEn: 'Teachers & Staff', to: '/teachers' },
          { labelBn: teacher.nameBn, labelEn: teacher.name },
        ]}
      />

      <section className="py-10 sm:py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-5">
            <Link
              to="/teachers"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1F5FAF] hover:text-[#102B50] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('সকল শিক্ষকের তালিকায় ফিরে যান', 'Back to All Teachers')}</span>
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-7 lg:p-9">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              <div className="lg:col-span-3 flex justify-center sm:justify-start">
                <SmartImage
                  src={teacher.photoUrl}
                  alt={teacher.name}
                  fallbackType="person"
                  fallbackLabel={teacher.name}
                  className="w-32 sm:w-40 lg:w-44 aspect-[4/5] rounded-xl border border-slate-200 bg-[#F6F8FC]"
                  imgClassName="w-full h-full object-cover object-top"
                  eager
                />
              </div>

              <div className="lg:col-span-9 space-y-5">
                <div className="text-center sm:text-left">
                  <div className="text-xs text-[#617187] tabular-nums">
                    {t('ক্রমিক নং', 'Faculty Serial')} #{num(String(teacher.serial).padStart(2, '0'))}{' '}
                    ·{' '}
                    <span className="font-semibold text-[#1F5FAF]">
                      {t(teacher.departmentBn, teacher.department)}
                    </span>
                  </div>
                  <h2 className="mt-1 text-xl sm:text-2xl lg:text-3xl font-bold text-[#102B50]">
                    {t(teacher.nameBn, teacher.name)}
                  </h2>
                  {teacher.nameBn !== teacher.name && (
                    <p className="text-sm text-[#617187] mt-0.5">{teacher.name}</p>
                  )}
                  <p className="mt-1.5 text-sm sm:text-base font-semibold text-[#17263C]">
                    {t(teacher.designationBn, teacher.designationEn)}
                  </p>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-sm">
                  <div>
                    <dt className="text-xs text-[#617187]">{t('পাঠদানের বিষয়', 'Subject')}</dt>
                    <dd className="mt-1 font-semibold text-[#102B50]">
                      {t(teacher.subjectBn, teacher.subjectEn)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs text-[#617187]">{t('বিভাগ', 'Department')}</dt>
                    <dd className="mt-1 font-semibold text-[#102B50]">
                      {t(teacher.departmentBn, teacher.department)}
                    </dd>
                  </div>

                  {teacher.qualification && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-[#617187] flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-[#1F5FAF]" />
                        <span>{t('শিক্ষাগত যোগ্যতা', 'Educational Qualification')}</span>
                      </dt>
                      <dd className="mt-1.5 text-[#17263C] leading-relaxed bg-[#F6F8FC] p-3.5 sm:p-4 rounded-lg border border-slate-200/80">
                        {teacher.qualification}
                      </dd>
                    </div>
                  )}
                </dl>

                {/* Verified Official Contact Details */}
                {(teacher.publicPhone || teacher.publicEmail) && (
                  <div className="pt-4 border-t border-slate-200">
                    <h3 className="text-xs font-semibold text-[#617187] mb-3">
                      {t('দাপ্তরিক যোগাযোগ', 'Official Contact Information')}
                    </h3>
                    <div className="flex flex-wrap gap-2.5 sm:gap-3">
                      {teacher.publicPhone && (
                        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-[#F6F8FC] overflow-hidden max-w-full">
                          <a
                            href={`tel:${teacher.publicPhone}`}
                            className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium text-[#102B50] hover:text-[#1F5FAF] tabular-nums"
                          >
                            <Phone className="w-4 h-4 text-[#1F5FAF] shrink-0" />
                            <span>{num(teacher.publicPhone)}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(teacher.publicPhone, 'phone')}
                            aria-label="Copy phone number"
                            className="px-2.5 py-2 border-l border-slate-200 text-[#617187] hover:text-[#102B50] hover:bg-slate-200/50 transition-colors"
                          >
                            {copiedField === 'phone' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {teacher.publicEmail && (
                        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-[#F6F8FC] overflow-hidden max-w-full">
                          <a
                            href={`mailto:${teacher.publicEmail}`}
                            className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium text-[#102B50] hover:text-[#1F5FAF] min-w-0"
                          >
                            <Mail className="w-4 h-4 text-[#1F5FAF] shrink-0" />
                            <span className="truncate">{teacher.publicEmail}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(teacher.publicEmail, 'email')}
                            aria-label="Copy email address"
                            className="px-2.5 py-2 border-l border-slate-200 text-[#617187] hover:text-[#102B50] hover:bg-slate-200/50 transition-colors shrink-0"
                          >
                            {copiedField === 'email' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colleagues in the Same Department */}
          {colleagues.length > 0 && (
            <div className="mt-10">
              <h3 className="text-base sm:text-lg font-bold text-[#102B50] mb-4">
                {t('একই বিভাগের অন্যান্য শিক্ষকবৃন্দ', 'Other Faculty in This Department')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {colleagues.map((col) => (
                  <Link
                    key={col.id}
                    to={`/teachers/${col.id}`}
                    className="group bg-white rounded-xl border border-slate-200/90 hover:border-[#1F5FAF]/40 p-3.5 flex items-center gap-3 transition-colors"
                  >
                    <SmartImage
                      src={col.photoUrl}
                      alt={col.name}
                      fallbackType="person"
                      fallbackLabel={col.name}
                      className="w-12 h-14 aspect-[4/5] rounded-lg shrink-0"
                      imgClassName="w-full h-full object-cover object-top"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-[#102B50] group-hover:text-[#1F5FAF] truncate">
                        {t(col.nameBn, col.name)}
                      </h4>
                      <p className="text-xs text-[#617187] truncate">
                        {t(col.subjectBn, col.subjectEn)}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1F5FAF] shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};
