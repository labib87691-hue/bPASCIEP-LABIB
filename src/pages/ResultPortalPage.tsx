import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Eraser,
  FileCheck2,
  FlaskConical,
  Info,
  Loader2,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { SeoHead } from '../components/common/SeoHead';
import { ResultMarksheet } from '../components/result/ResultMarksheet';
import { SUPPORTED_RESULT_CLASSES } from '../data/resultPortalSeedData';
import {
  loadResultPortalCatalog,
  ResultPortalCatalog,
  searchPublishedStudentResult,
} from '../services/resultPortalService';
import {
  ResultMarksheetBundle,
  ResultSearchErrorCode,
} from '../types/result';

interface DemoQuickScenario {
  labelBn: string;
  labelEn: string;
  noteBn: string;
  noteEn: string;
  academicYearId: string;
  examId: string;
  classCode: string;
  rollNumber: string;
}

const DEMO_TEST_SCENARIOS: DemoQuickScenario[] = [
  {
    labelBn: '১০ম শ্রেণি বিজ্ঞান (ব্যবহারিক + ৪র্থ বিষয় GPA 5.00)',
    labelEn: 'Class 10 Science (Practical + 4th Subject Bonus)',
    noteBn: 'রোল ১০১ · প্রাক-নির্বাচনী ২০২৬',
    noteEn: 'Roll 101 · Pre-Test 2026',
    academicYearId: '2026',
    examId: 'exam_2026_pre_test',
    classCode: 'class-10',
    rollNumber: '101',
  },
  {
    labelBn: '৫ম শ্রেণি প্রাথমিক (GPA 5.00 + মেধাক্রম)',
    labelEn: 'Class 5 Primary (GPA 5.00 + Merit Position)',
    noteBn: 'রোল ১০১ · অর্ধ-বার্ষিক ২০২৬',
    noteEn: 'Roll 101 · Half-Yearly 2026',
    academicYearId: '2026',
    examId: 'exam_2026_half_yearly',
    classCode: 'class-5',
    rollNumber: '101',
  },
  {
    labelBn: 'নার্সারি (শতকরা ও গ্রেড বিধি — GPA ব্যতীত)',
    labelEn: 'Nursery (Percentage & Grade Rule — No GPA)',
    noteBn: 'রোল ১০১ · অর্ধ-বার্ষিক ২০২৬',
    noteEn: 'Roll 101 · Half-Yearly 2026',
    academicYearId: '2026',
    examId: 'exam_2026_half_yearly',
    classCode: 'nursery',
    rollNumber: '101',
  },
  {
    labelBn: '৮ম শ্রেণি (১০০ ও ৫০ নম্বরের সমন্বিত বিষয়)',
    labelEn: 'Class 8 Junior (Mixed 100 & 50 Mark Subjects)',
    noteBn: 'রোল ১০১ · ১ম মধ্যপর্ব ২০২৬',
    noteEn: 'Roll 101 · 1st Mid-Term 2026',
    academicYearId: '2026',
    examId: 'exam_2026_mid_1',
    classCode: 'class-8',
    rollNumber: '101',
  },
  {
    labelBn: '১০ম শ্রেণি অংশভিত্তিক ফেল যাচাই (MCQ < পাস নম্বর)',
    labelEn: 'Class 10 Component Fail Check (MCQ < Pass)',
    noteBn: 'রোল ১০২ · প্রাক-নির্বাচনী ২০২৬',
    noteEn: 'Roll 102 · Pre-Test 2026',
    academicYearId: '2026',
    examId: 'exam_2026_pre_test',
    classCode: 'class-10',
    rollNumber: '102',
  },
  {
    labelBn: 'অপ্রকাশিত ফলাফল সুরক্ষা যাচাই (৯ম শ্রেণি বার্ষিক)',
    labelEn: 'Unpublished Result Protection Check (Class 9 Annual)',
    noteBn: 'রোল ১০১ · বার্ষিক ২০২৬ (গোপনীয়)',
    noteEn: 'Roll 101 · Annual 2026 (Blocked)',
    academicYearId: '2026',
    examId: 'exam_2026_annual',
    classCode: 'class-9',
    rollNumber: '101',
  },
];

export const ResultPortalPage: React.FC = () => {
  const { t, num } = useLanguage();
  const { settings } = usePublicData();

  const [catalog, setCatalog] = useState<ResultPortalCatalog | null>(null);
  const [catalogLoading, setCatalogLoading] = useState<boolean>(true);

  const [academicYearId, setAcademicYearId] = useState<string>('2026');
  const [examId, setExamId] = useState<string>('');
  const [classCode, setClassCode] = useState<string>('');
  const [rollNumber, setRollNumber] = useState<string>('');

  const [searching, setSearching] = useState<boolean>(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [errorState, setErrorState] = useState<{
    code: ResultSearchErrorCode;
    messageBn: string;
    messageEn: string;
  } | null>(null);

  const [activeBundle, setActiveBundle] = useState<ResultMarksheetBundle | null>(null);
  const [sandboxOpen, setSandboxOpen] = useState<boolean>(false);

  const marksheetAnchorRef = useRef<HTMLDivElement | null>(null);
  const rollInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;
    loadResultPortalCatalog()
      .then((loaded) => {
        if (!mounted) return;
        setCatalog(loaded);
        const currentYear =
          loaded.academicYears.find((y) => y.isCurrent) || loaded.academicYears[0];
        if (currentYear) {
          setAcademicYearId(currentYear.id);
        }
      })
      .finally(() => {
        if (mounted) setCatalogLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const examinationsForYear = useMemo(() => {
    if (!catalog) return [];
    return catalog.examinations.filter(
      (ex) => ex.academicYearId === academicYearId && ex.isActive
    );
  }, [catalog, academicYearId]);

  // Reset examId only if it doesn't belong to the newly chosen academic year
  useEffect(() => {
    if (!examId) return;
    const stillValid = examinationsForYear.some((ex) => ex.id === examId);
    if (!stillValid) {
      setExamId('');
    }
  }, [academicYearId, examinationsForYear, examId]);

  const executeSearch = async (queryValues: {
    academicYearId: string;
    examId: string;
    classCode: string;
    rollNumber: string;
  }) => {
    setErrorState(null);
    setMissingFields([]);
    setSearching(true);

    try {
      const outcome = await searchPublishedStudentResult(queryValues, catalog || undefined);
      if (!outcome.ok) {
        setActiveBundle(null);
        setMissingFields(outcome.missingFields || []);
        setErrorState({
          code: outcome.errorCode,
          messageBn: outcome.messageBn,
          messageEn: outcome.messageEn,
        });
        return;
      }

      setActiveBundle(outcome.data);
      window.setTimeout(() => {
        marksheetAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSearch({
      academicYearId,
      examId,
      classCode,
      rollNumber,
    });
  };

  const handleClear = () => {
    const defaultYear =
      catalog?.academicYears.find((y) => y.isCurrent)?.id ||
      catalog?.academicYears[0]?.id ||
      '2026';
    setAcademicYearId(defaultYear);
    setExamId('');
    setClassCode('');
    setRollNumber('');
    setMissingFields([]);
    setErrorState(null);
    setActiveBundle(null);
  };

  const handleSearchAnother = () => {
    setActiveBundle(null);
    setErrorState(null);
    setRollNumber('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.setTimeout(() => {
      rollInputRef.current?.focus();
    }, 200);
  };

  const handleApplyScenario = async (scenario: DemoQuickScenario) => {
    setAcademicYearId(scenario.academicYearId);
    setExamId(scenario.examId);
    setClassCode(scenario.classCode);
    setRollNumber(scenario.rollNumber);
    await executeSearch({
      academicYearId: scenario.academicYearId,
      examId: scenario.examId,
      classCode: scenario.classCode,
      rollNumber: scenario.rollNumber,
    });
  };

  return (
    <>
      <SeoHead
        title={t('অনলাইন পরীক্ষার ফলাফল পোর্টাল', 'Student Examination Result Portal')}
        description={t(
          'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড (EIIN: ১৪০৩৩৬)-এর নার্সারি থেকে দশম শ্রেণি পর্যন্ত প্রকাশিত পরীক্ষার ফলাফল ও প্রিন্টযোগ্য মার্কশিট অনুসন্ধান পোর্টাল।',
          'Official Examination Result Portal of BEPZA Public School and College (BPSC), Ishwardi EPZ. Search published results and download A4 printable marksheets for Nursery to Class 10.'
        )}
      />

      {/* Branded Institutional Portal Banner (Hidden when printing marksheet) */}
      <section className="no-print bg-[#102B50] text-white border-b border-white/10 py-7 sm:py-9 lg:py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                src="/assets/branding/logo.jpeg"
                alt="BEPZA Public School and College Logo"
                referrerPolicy="no-referrer"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white/25 bg-white shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#17A9C6] tracking-wide tabular-nums">
                  {t(settings.schoolNameBn, settings.schoolNameEn)} · EIIN: {num(settings.eiin)}
                </p>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight mt-0.5">
                  {t('অনলাইন পরীক্ষার ফলাফল পোর্টাল', 'Student Examination Result Portal')}
                </h1>
                <p className="text-xs sm:text-sm text-slate-200 mt-1">
                  {t(
                    'নার্সারি থেকে ১০ম শ্রেণি পর্যন্ত আনুষ্ঠানিকভাবে প্রকাশিত পরীক্ষার ফলাফল ও মার্কশিট অনুসন্ধান করুন।',
                    'Search officially published examination results and printable A4 academic marksheets (Nursery – Class 10).'
                  )}
                </p>
              </div>
            </div>

            <div className="shrink-0 self-start sm:self-center">
              <Link
                to="/notices?category=examination"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/25 bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-[#17A9C6]" />
                <span>{t('পরীক্ষার নোটিশসমূহ', 'Exam Notices')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Portal Workspace */}
      <section className="py-8 sm:py-10 lg:py-12 print:py-0 bg-[#F6F8FC] print:bg-white">
        <div className="max-w-5xl print:max-w-none mx-auto px-4 sm:px-6 lg:px-8 print:px-0 space-y-6">
          {/* Student Result Search Form Card (Hidden when printing) */}
          <div className="no-print bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="px-4 sm:px-6 py-4 bg-[#F6F8FC] border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#1F5FAF]" />
                <h2 className="text-sm sm:text-base font-bold text-[#102B50]">
                  {t('শিক্ষার্থীর ফলাফল অনুসন্ধান ফরম', 'Student Result Search Form')}
                </h2>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-[#617187]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#17A9C6]" />
                <span>
                  {t('শুধুমাত্র প্রকাশিত ফলাফল প্রদর্শিত হয়', 'Published results only')}
                </span>
              </span>
            </div>

            <form onSubmit={handleSubmit} noValidate className="p-4 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Academic Year Selector */}
                <div>
                  <label
                    htmlFor="result-academic-year"
                    className="block text-xs font-semibold text-[#102B50] mb-1.5"
                  >
                    {t('শিক্ষাবর্ষ', 'Academic Year')} <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="result-academic-year"
                    value={academicYearId}
                    disabled={catalogLoading || searching}
                    onChange={(e) => {
                      setAcademicYearId(e.target.value);
                      setMissingFields((prev) => prev.filter((f) => f !== 'academicYearId'));
                    }}
                    className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border text-sm text-[#17263C] bg-[#F6F8FC] focus:bg-white focus:border-[#1F5FAF] focus:outline-none transition-colors ${
                      missingFields.includes('academicYearId')
                        ? 'border-rose-400 bg-rose-50/40'
                        : 'border-slate-200'
                    }`}
                  >
                    <option value="">
                      {t('শিক্ষাবর্ষ নির্বাচন করুন', 'Select Academic Year')}
                    </option>
                    {(catalog?.academicYears || []).map((yr) => (
                      <option key={yr.id} value={yr.id}>
                        {t(yr.labelBn, yr.labelEn)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Examination Selector */}
                <div>
                  <label
                    htmlFor="result-examination"
                    className="block text-xs font-semibold text-[#102B50] mb-1.5"
                  >
                    {t('পরীক্ষার নাম', 'Examination')} <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="result-examination"
                    value={examId}
                    disabled={catalogLoading || searching || !academicYearId}
                    onChange={(e) => {
                      setExamId(e.target.value);
                      setMissingFields((prev) => prev.filter((f) => f !== 'examId'));
                    }}
                    className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border text-sm text-[#17263C] bg-[#F6F8FC] focus:bg-white focus:border-[#1F5FAF] focus:outline-none transition-colors ${
                      missingFields.includes('examId')
                        ? 'border-rose-400 bg-rose-50/40'
                        : 'border-slate-200'
                    }`}
                  >
                    <option value="">
                      {t('পরীক্ষা নির্বাচন করুন', 'Select Examination')}
                    </option>
                    {examinationsForYear.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {t(ex.nameBn, ex.nameEn)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Class Selector (Nursery to Class 10) */}
                <div>
                  <label
                    htmlFor="result-class"
                    className="block text-xs font-semibold text-[#102B50] mb-1.5"
                  >
                    {t('শ্রেণি', 'Class')} <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="result-class"
                    value={classCode}
                    disabled={searching}
                    onChange={(e) => {
                      setClassCode(e.target.value);
                      setMissingFields((prev) => prev.filter((f) => f !== 'classCode'));
                    }}
                    className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border text-sm text-[#17263C] bg-[#F6F8FC] focus:bg-white focus:border-[#1F5FAF] focus:outline-none transition-colors ${
                      missingFields.includes('classCode')
                        ? 'border-rose-400 bg-rose-50/40'
                        : 'border-slate-200'
                    }`}
                  >
                    <option value="">{t('শ্রেণি নির্বাচন করুন', 'Select Class')}</option>
                    {SUPPORTED_RESULT_CLASSES.map((cls) => (
                      <option key={cls.classCode} value={cls.classCode}>
                        {t(`${cls.nameBn} (${cls.nameEn})`, cls.nameEn)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Student Roll Number Field */}
                <div>
                  <label
                    htmlFor="result-roll"
                    className="block text-xs font-semibold text-[#102B50] mb-1.5"
                  >
                    {t('রোল নম্বর', 'Student Roll Number')}{' '}
                    <span className="text-rose-600">*</span>
                  </label>
                  <input
                    ref={rollInputRef}
                    id="result-roll"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={rollNumber}
                    disabled={searching}
                    onChange={(e) => {
                      setRollNumber(e.target.value);
                      setMissingFields((prev) => prev.filter((f) => f !== 'rollNumber'));
                    }}
                    placeholder={t('যেমন: ১০১ বা 101', 'e.g., 101')}
                    className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-lg border text-sm text-[#17263C] bg-[#F6F8FC] placeholder:text-[#617187]/70 focus:bg-white focus:border-[#1F5FAF] focus:outline-none tabular-nums transition-colors ${
                      missingFields.includes('rollNumber') || errorState?.code === 'INVALID_ROLL'
                        ? 'border-rose-400 bg-rose-50/40'
                        : 'border-slate-200'
                    }`}
                  />
                </div>
              </div>

              {/* Validation & Search Status Alert */}
              {errorState && (
                <div
                  role="alert"
                  className={`rounded-lg border px-4 py-3.5 flex items-start gap-3 text-xs sm:text-sm ${
                    errorState.code === 'NOT_PUBLISHED'
                      ? 'border-amber-300 bg-amber-50 text-amber-950'
                      : 'border-rose-200 bg-rose-50 text-rose-900'
                  }`}
                >
                  {errorState.code === 'NOT_PUBLISHED' ? (
                    <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <p className="font-semibold">
                      {errorState.code === 'EMPTY_FIELDS' &&
                        t('প্রয়োজনীয় তথ্য পূরণ করুন', 'Required Fields Missing')}
                      {errorState.code === 'INVALID_ROLL' &&
                        t('অবৈধ রোল নম্বর', 'Invalid Roll Number')}
                      {errorState.code === 'EXAM_NOT_FOUND' &&
                        t('পরীক্ষা প্রযোজ্য নয় বা পাওয়া যায়নি', 'Examination Not Applicable')}
                      {errorState.code === 'NOT_PUBLISHED' &&
                        t('ফলাফল এখনো প্রকাশিত হয়নি', 'Results Not Yet Published')}
                      {errorState.code === 'RESULT_NOT_FOUND' &&
                        t('কোনো ফলাফল পাওয়া যায়নি', 'No Result Found')}
                      {errorState.code === 'SYSTEM_ERROR' &&
                        t('সার্ভার সংযোগ ত্রুটি', 'Connection Issue')}
                    </p>
                    <p className="leading-relaxed">
                      {t(errorState.messageBn, errorState.messageEn)}
                    </p>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-[#617187]">
                  {t(
                    'বাংলা (১০১) অথবা ইংরেজি (101) যেকোনো অঙ্কে রোল নম্বর প্রদান করা যাবে।',
                    'Accepts both English (101) and Bengali (১০১) numerals.'
                  )}
                </p>

                <div className="grid grid-cols-2 sm:flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={searching}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-[#F6F8FC] hover:bg-slate-100 text-xs sm:text-sm font-semibold text-[#17263C] transition-colors cursor-pointer"
                  >
                    <Eraser className="w-4 h-4 text-[#617187] shrink-0" />
                    <span>{t('মুছে ফেলুন', 'Clear')}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={searching || catalogLoading}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] disabled:opacity-65 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                  >
                    {searching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        <span>{t('অনুসন্ধান চলছে...', 'Searching...')}</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 shrink-0" />
                        <span>{t('ফলাফল খুঁজুন', 'Search Result')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Loading State Skeleton */}
          {searching && (
            <div className="no-print bg-white rounded-xl border border-slate-200/90 p-8 text-center space-y-3">
              <Loader2 className="w-7 h-7 text-[#1F5FAF] animate-spin mx-auto" />
              <p className="text-sm font-semibold text-[#102B50]">
                {t(
                  'প্রকাশিত ডাটাবেস থেকে মার্কশিট যাচাই করা হচ্ছে...',
                  'Verifying published result record...'
                )}
              </p>
            </div>
          )}

          {/* Marksheet Display Area */}
          {activeBundle && !searching && (
            <div ref={marksheetAnchorRef} className="scroll-mt-20">
              <ResultMarksheet
                bundle={activeBundle}
                onSearchAnother={handleSearchAnother}
              />
            </div>
          )}

          {/* Empty State Guidance & Clearly Labeled Demo Verification Sandbox */}
          {!activeBundle && !searching && (
            <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Institutional Instructions */}
              <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 space-y-3">
                <div className="flex items-center gap-2 text-[#102B50]">
                  <Info className="w-4 h-4 text-[#1F5FAF] shrink-0" />
                  <h3 className="text-sm sm:text-base font-bold">
                    {t('ফলাফল অনুসন্ধানের নির্দেশনাবলি', 'How to Check Your Examination Result')}
                  </h3>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-[#617187] leading-relaxed">
                  <li>
                    {t(
                      'তালিকা থেকে সঠিক শিক্ষাবর্ষ এবং সংশ্লিষ্ট পরীক্ষার নাম নির্বাচন করুন।',
                      'Select the appropriate Academic Year and Examination from the dropdown menus.'
                    )}
                  </li>
                  <li>
                    {t(
                      'শিক্ষার্থীর শ্রেণি (নার্সারি থেকে ১০ম শ্রেণি) নির্বাচন করে নির্ধারিত রোল নম্বর লিখুন।',
                      'Choose the student class (Nursery through Class 10) and enter the assigned Roll Number.'
                    )}
                  </li>
                  <li>
                    {t(
                      '"ফলাফল খুঁজুন" বাটনে ক্লিক করলে প্রকাশিত পূর্ণাঙ্গ মার্কশিট প্রদর্শিত হবে, যা A4 আকারে প্রিন্ট বা পিডিএফ ডাউনলোড করা যাবে।',
                      'Click "Search Result" to view the official marksheet, print in A4 format, or save as PDF.'
                    )}
                  </li>
                </ol>
              </div>

              {/* Clearly Labeled System Verification Demo Records */}
              <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-[#102B50]">
                      <FlaskConical className="w-4 h-4 text-[#17A9C6] shrink-0" />
                      <h3 className="text-sm font-bold">
                        {t(
                          'সিস্টেম পরীক্ষণ নমুনা (Demo Test Data)',
                          'System Verification Sandbox'
                        )}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSandboxOpen((prev) => !prev)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F5FAF] hover:text-[#102B50] cursor-pointer"
                    >
                      <span>{sandboxOpen ? t('সংক্ষিপ্ত করুন', 'Hide') : t('নমুনা দেখুন', 'View Samples')}</span>
                      {sandboxOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs text-[#617187] leading-relaxed">
                    {t(
                      'পোর্টালের গ্রেডিং বিধি, ঐচ্ছিক বিষয়, ব্যবহারিক নম্বর, অপ্রকাশিত ফলাফল সুরক্ষা এবং A4 প্রিন্ট/পিডিএফ যাচাইয়ের জন্য চিহ্নিত ডামি রেকর্ড।',
                      'Clearly identified dummy test records for verifying grading rules, practicals, 4th-subject bonus, unpublished protection, and A4 PDF output.'
                    )}
                  </p>
                </div>

                {sandboxOpen && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    {DEMO_TEST_SCENARIOS.map((sc) => (
                      <button
                        key={`${sc.examId}_${sc.classCode}_${sc.rollNumber}`}
                        type="button"
                        onClick={() => handleApplyScenario(sc)}
                        className="w-full text-left p-2.5 rounded-lg border border-slate-200/90 hover:border-[#1F5FAF] bg-[#F6F8FC] hover:bg-white transition-colors cursor-pointer"
                      >
                        <div className="text-xs font-semibold text-[#102B50]">
                          {t(sc.labelBn, sc.labelEn)}
                        </div>
                        <div className="text-[11px] text-[#617187] mt-0.5 tabular-nums">
                          {t(sc.noteBn, sc.noteEn)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};
