import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Phone, Search, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { SeoHead } from '../components/common/SeoHead';
import { PageHeader } from '../components/common/PageHeader';
import { SmartImage } from '../components/common/SmartImage';
import { TeacherProfile } from '../types/school';

const DEPARTMENTS: Array<{
  key: 'all' | TeacherProfile['department'];
  bn: string;
  en: string;
}> = [
  { key: 'all', bn: 'সকল বিভাগ', en: 'All Departments' },
  { key: 'Science', bn: 'বিজ্ঞান', en: 'Science' },
  { key: 'Mathematics', bn: 'গণিত', en: 'Mathematics' },
  { key: 'Language & Literature', bn: 'ইংরেজি ও সাহিত্য', en: 'Language & Literature' },
  {
    key: 'Humanities & Social Science',
    bn: 'মানবিক ও সামাজিক বিজ্ঞান',
    en: 'Humanities & Social Science',
  },
  { key: 'Business Studies', bn: 'ব্যবসায় শিক্ষা', en: 'Business Studies' },
  { key: 'Arts, ICT & Co-Curricular', bn: 'চারুকলা, ক্রীড়া ও সহশিক্ষা', en: 'Arts & Co-Curricular' },
];

export const TeachersPage: React.FC = () => {
  const { t, num } = useLanguage();
  const { teachers, staff } = usePublicData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<'all' | TeacherProfile['department']>('all');
  const [activeTab, setActiveTab] = useState<'teachers' | 'staff'>('teachers');

  const filteredTeachers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return teachers.filter((teacher) => {
      const deptMatch = selectedDept === 'all' || teacher.department === selectedDept;
      if (!deptMatch) return false;
      if (!q) return true;
      return (
        teacher.name.toLowerCase().includes(q) ||
        teacher.nameBn.toLowerCase().includes(q) ||
        teacher.subjectEn.toLowerCase().includes(q) ||
        teacher.subjectBn.toLowerCase().includes(q) ||
        teacher.designationEn.toLowerCase().includes(q) ||
        teacher.qualification.toLowerCase().includes(q)
      );
    });
  }, [teachers, searchQuery, selectedDept]);

  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.nameBn.toLowerCase().includes(q) ||
        s.designationEn.toLowerCase().includes(q) ||
        s.designationBn.toLowerCase().includes(q)
    );
  }, [staff, searchQuery]);

  return (
    <>
      <SeoHead
        title={t('শিক্ষক ও কর্মচারী ডিরেক্টরি', 'Teachers & Staff Directory')}
        description={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড-এর ২৪ জন শিক্ষক ও ৫ জন কর্মকর্তা-কর্মচারীর পূর্ণাঙ্গ তালিকা ও শিক্ষাগত যোগ্যতা।',
          'Complete directory of verified faculty members and administrative staff at BEPZA Public School and College, Ishwardi EPZ.'
        )}
      />

      <PageHeader
        titleBn="শিক্ষক ও কর্মচারী ডিরেক্টরি"
        titleEn="Teachers & Staff Directory"
        subtitleBn="দেশের স্বনামধন্য বিশ্ববিদ্যালয় ও কলেজ থেকে উচ্চশিক্ষাপ্রাপ্ত অভিজ্ঞ শিক্ষকমণ্ডলী এবং নিবেদিতপ্রাণ সহায়ক কর্মীবৃন্দ।"
        subtitleEn="Qualified educators and dedicated administrative & support staff serving BPSC, Ishwardi EPZ."
        breadcrumbs={[{ labelBn: 'শিক্ষক ও কর্মচারী', labelEn: 'Teachers & Staff' }]}
      />

      <section className="py-10 sm:py-12 lg:py-16 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Interactive Controls Bar */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 mb-6 sm:mb-8 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
              {/* Segmented Toggle: Teachers vs Staff */}
              <div className="grid grid-cols-2 sm:inline-flex items-center gap-1 p-1 bg-[#F6F8FC] rounded-lg border border-slate-200/70 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('teachers')}
                  className={`min-h-[38px] px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap tabular-nums ${
                    activeTab === 'teachers'
                      ? 'bg-[#102B50] text-white shadow-2xs'
                      : 'text-[#617187] hover:text-[#102B50]'
                  }`}
                >
                  {t(`শিক্ষকমণ্ডলী (${num(teachers.length)})`, `Teachers (${teachers.length})`)}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('staff')}
                  className={`min-h-[38px] px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap tabular-nums ${
                    activeTab === 'staff'
                      ? 'bg-[#102B50] text-white shadow-2xs'
                      : 'text-[#617187] hover:text-[#102B50]'
                  }`}
                >
                  {t(`কর্মচারীবৃন্দ (${num(staff.length)})`, `Support Staff (${staff.length})`)}
                </button>
              </div>

              {/* Search Input */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-[#617187] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(
                    'নাম, বিষয় বা যোগ্যতা দিয়ে খুঁজুন...',
                    'Search by name, subject, or degree...'
                  )}
                  className="w-full min-h-[42px] pl-10 pr-9 py-2 text-sm rounded-lg border border-slate-200 bg-[#F6F8FC] focus:bg-white focus:border-[#1F5FAF] focus:outline-none text-[#17263C]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label={t('মুছুন', 'Clear search')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#617187] hover:text-[#102B50]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Department Filter Tabs */}
            {activeTab === 'teachers' && (
              <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100">
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept.key}
                    type="button"
                    onClick={() => setSelectedDept(dept.key)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      selectedDept === dept.key
                        ? 'bg-[#1F5FAF] text-white'
                        : 'bg-[#F6F8FC] text-[#617187] hover:text-[#102B50] hover:bg-slate-200/60'
                    }`}
                  >
                    {t(dept.bn, dept.en)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Teachers Grid — Compact, consistent height cards with 4:5 portrait thumbnails */}
          {activeTab === 'teachers' ? (
            filteredTeachers.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
                <p className="text-base font-semibold text-[#102B50]">
                  {t(
                    'অনুসন্ধান অনুযায়ী কোনো শিক্ষক পাওয়া যায়নি।',
                    'No teachers matched your search filter.'
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDept('all');
                  }}
                  className="mt-4 px-4 py-2 rounded-lg bg-[#102B50] text-white text-xs font-semibold hover:bg-[#1F5FAF] transition-colors"
                >
                  {t('ফিল্টার রিসেট করুন', 'Reset Filters')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTeachers.map((teacher) => (
                  <article
                    key={teacher.id}
                    className="bg-white rounded-xl border border-slate-200/90 hover:border-[#1F5FAF]/45 p-4 flex flex-col justify-between transition-colors h-full"
                  >
                    <div>
                      <div className="flex items-start gap-3.5">
                        <Link to={`/teachers/${teacher.id}`} className="shrink-0">
                          <SmartImage
                            src={teacher.photoUrl}
                            alt={teacher.name}
                            fallbackType="person"
                            fallbackLabel={teacher.name}
                            className="w-16 h-20 sm:w-[72px] sm:h-[90px] aspect-[4/5] rounded-lg border border-slate-200 bg-[#F6F8FC]"
                            imgClassName="w-full h-full object-cover object-top"
                          />
                        </Link>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#617187] tabular-nums">
                            <span>#{num(String(teacher.serial).padStart(2, '0'))}</span>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#1F5FAF] font-medium truncate">
                              {t(teacher.subjectBn, teacher.subjectEn)}
                            </span>
                          </div>

                          <h2 className="mt-1 text-sm sm:text-base font-bold text-[#102B50] leading-snug line-clamp-2">
                            <Link
                              to={`/teachers/${teacher.id}`}
                              className="hover:text-[#1F5FAF] transition-colors"
                            >
                              {t(teacher.nameBn, teacher.name)}
                            </Link>
                          </h2>

                          <p className="mt-0.5 text-xs font-medium text-[#17263C] line-clamp-2">
                            {t(teacher.designationBn, teacher.designationEn)}
                          </p>
                        </div>
                      </div>

                      {teacher.qualification && (
                        <p className="mt-3 text-xs text-[#617187] line-clamp-2 leading-relaxed">
                          {teacher.qualification}
                        </p>
                      )}
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Link
                        to={`/teachers/${teacher.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F5FAF] hover:text-[#102B50] transition-colors"
                      >
                        <span>{t('পূর্ণ প্রোফাইল', 'View Profile')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      {teacher.publicPhone && (
                        <a
                          href={`tel:${teacher.publicPhone}`}
                          aria-label={`Call ${teacher.name}`}
                          className="p-1.5 rounded-md text-[#617187] hover:text-[#1F5FAF] hover:bg-[#F6F8FC]"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : (
            /* Staff Grid — Compact, proportional 4:5 portrait cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStaff.map((member) => (
                <article
                  key={member.id}
                  className="bg-white rounded-xl border border-slate-200/90 p-4 flex flex-col justify-between h-full"
                >
                  <div className="flex items-start gap-3.5">
                    <SmartImage
                      src={member.photoUrl}
                      alt={member.name}
                      fallbackType="person"
                      fallbackLabel={member.name}
                      className="w-16 h-20 sm:w-[72px] sm:h-[90px] aspect-[4/5] rounded-lg border border-slate-200 bg-[#F6F8FC] shrink-0"
                      imgClassName="w-full h-full object-cover object-top"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] sm:text-xs text-[#617187] tabular-nums">
                        #{num(String(member.serial).padStart(2, '0'))} ·{' '}
                        {t('অফিস ও সহায়ক স্টাফ', 'Support Staff')}
                      </div>
                      <h2 className="mt-1 text-sm sm:text-base font-bold text-[#102B50] leading-snug">
                        {t(member.nameBn, member.name)}
                      </h2>
                      <p className="mt-0.5 text-xs font-medium text-[#1F5FAF]">
                        {t(member.designationBn, member.designationEn)}
                      </p>
                    </div>
                  </div>

                  {(member.publicPhone || member.publicEmail) && (
                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 space-y-1 text-xs text-[#617187] tabular-nums">
                      {member.publicPhone && (
                        <a
                          href={`tel:${member.publicPhone}`}
                          className="flex items-center gap-2 hover:text-[#102B50]"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#1F5FAF] shrink-0" />
                          <span>{num(member.publicPhone)}</span>
                        </a>
                      )}
                      {member.publicEmail && (
                        <a
                          href={`mailto:${member.publicEmail}`}
                          className="flex items-center gap-2 hover:text-[#102B50] break-all"
                        >
                          <Mail className="w-3.5 h-3.5 text-[#1F5FAF] shrink-0" />
                          <span>{member.publicEmail}</span>
                        </a>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};
