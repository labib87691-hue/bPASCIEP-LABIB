import React, { useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Download,
  Loader2,
  Printer,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePublicData } from '../../context/PublicDataContext';
import {
  GradingRuleRecord,
  ResultMarksheetBundle,
  ResultSubjectMarkRecord,
  StudentResultRecord,
} from '../../types/result';

interface ResultMarksheetProps {
  bundle: ResultMarksheetBundle;
  onSearchAnother: () => void;
}

function formatOrdinalEn(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

interface MarksheetDocumentSheetProps {
  result: StudentResultRecord;
  subjects: ResultSubjectMarkRecord[];
  gradingRule: GradingRuleRecord;
  schoolNameBn: string;
  schoolNameEn: string;
  addressBn: string;
  addressEn: string;
  eiin: string;
  forceDesktopTable?: boolean;
}

const MarksheetDocumentSheet: React.FC<MarksheetDocumentSheetProps> = ({
  result,
  subjects,
  gradingRule,
  schoolNameBn,
  schoolNameEn,
  addressBn,
  addressEn,
  eiin,
  forceDesktopTable = false,
}) => {
  const { t, num } = useLanguage();

  const hasComponentBreakdown = useMemo(
    () =>
      subjects.some(
        (s) =>
          s.hasComponents &&
          (s.writtenMarks != null || s.mcqMarks != null || s.practicalMarks != null)
      ),
    [subjects]
  );

  const isPassed = result.finalStatus === 'PASS';

  const studentDisplayName = result.studentNameBn
    ? t(result.studentNameBn, result.studentNameEn)
    : result.studentNameEn;

  const groupDisplay =
    result.groupNameBn || result.groupNameEn
      ? t(result.groupNameBn || result.groupNameEn || '', result.groupNameEn || result.groupNameBn || '')
      : null;

  const publishedDisplay =
    result.publishedDateLabelBn || result.publishedDateLabelEn
      ? t(
          result.publishedDateLabelBn || result.publishedDateLabelEn || '',
          result.publishedDateLabelEn || result.publishedDateLabelBn || ''
        )
      : null;

  return (
    <div className="bg-white text-[#17263C] border border-slate-300 rounded-xl print:rounded-none print:border-slate-400 p-4 sm:p-7 lg:p-8 print:p-5 space-y-5 print:space-y-4">
      {/* Demo Verification Notice (Only shown on dummy verification records; never on real student records) */}
      {result.isDemoRecord && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 flex items-start gap-2.5 text-xs text-amber-950">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">
              {t(
                'পরীক্ষণমূলক ডামি রেকর্ড (Demo Test Data): ',
                'Sample Verification Record (Demo Test Data): '
              )}
            </span>
            <span>
              {t(
                'ফলাফল পোর্টালের গণনা ও প্রিন্ট যাচাইয়ের জন্য সুস্পষ্টভাবে চিহ্নিত নমুনা তথ্য। এটি কোনো প্রকৃত শিক্ষার্থীর অফিসিয়াল সনদ নয়।',
                'Clearly identified dummy record provided strictly for testing Result Portal search, grading rules, and A4 print/PDF output.'
              )}
            </span>
          </div>
        </div>
      )}

      {/* Institutional Header */}
      <div className="border-b-2 border-[#102B50] pb-4 print:pb-3.5">
        <div className="flex flex-col sm:flex-row print:flex-row items-center sm:items-start print:items-center justify-between gap-4 text-center sm:text-left print:text-left">
          <div className="flex flex-col sm:flex-row print:flex-row items-center gap-3.5">
            <img
              src="/assets/branding/logo.jpeg"
              alt="BEPZA Public School and College Official Crest"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border border-slate-200 bg-white shrink-0"
            />
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#102B50] leading-tight">
                {t(schoolNameBn, schoolNameEn)}
              </h2>
              <p className="text-xs sm:text-sm text-[#617187] mt-0.5">
                {t(addressBn, addressEn)}
              </p>
              <p className="text-xs font-semibold text-[#1F5FAF] mt-0.5 tabular-nums">
                EIIN: {num(eiin)} · {t('বেপজা পরিচালিত শিক্ষাপ্রতিষ্ঠান', 'Operated under BEPZA')}
              </p>
            </div>
          </div>

          <div className="shrink-0 sm:text-right print:text-right">
            <div className="inline-block px-3.5 py-1.5 rounded-lg bg-[#102B50] text-white text-xs sm:text-sm font-bold tracking-wide">
              {t('একাডেমিক ট্রান্সক্রিপ্ট / মার্কশিট', 'ACADEMIC MARKSHEET')}
            </div>
            <p className="text-xs font-semibold text-[#102B50] mt-1.5">
              {t(result.examNameBn, result.examNameEn)}
            </p>
            <p className="text-[11px] text-[#617187] tabular-nums">
              {t(result.academicYearLabelBn, result.academicYearLabelEn)}
            </p>
          </div>
        </div>
      </div>

      {/* Student Metadata Grid (Only displays available verified fields — never invents missing fields) */}
      <div className="bg-[#F6F8FC] print:bg-slate-50 rounded-lg border border-slate-200/90 p-3.5 sm:p-4">
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 gap-x-6 gap-y-2.5 text-xs sm:text-sm">
          <div className="sm:col-span-2 lg:col-span-2 print:col-span-2 flex flex-wrap items-baseline gap-1.5">
            <dt className="text-[#617187] font-medium shrink-0">
              {t('শিক্ষার্থীর নাম:', 'Student Name:')}
            </dt>
            <dd className="font-bold text-[#102B50] text-sm sm:text-base">{studentDisplayName}</dd>
          </div>

          <div className="flex items-baseline gap-1.5 tabular-nums">
            <dt className="text-[#617187] font-medium shrink-0">
              {t('রোল নম্বর:', 'Roll Number:')}
            </dt>
            <dd className="font-bold text-[#102B50]">{num(result.rollNumber)}</dd>
          </div>

          <div className="flex items-baseline gap-1.5">
            <dt className="text-[#617187] font-medium shrink-0">{t('শ্রেণি:', 'Class:')}</dt>
            <dd className="font-semibold text-[#17263C]">
              {t(result.classNameBn, result.classNameEn)}
            </dd>
          </div>

          {result.section && (
            <div className="flex items-baseline gap-1.5">
              <dt className="text-[#617187] font-medium shrink-0">{t('শাখা:', 'Section:')}</dt>
              <dd className="font-semibold text-[#17263C]">{result.section}</dd>
            </div>
          )}

          {groupDisplay && (
            <div className="flex items-baseline gap-1.5">
              <dt className="text-[#617187] font-medium shrink-0">{t('বিভাগ:', 'Group:')}</dt>
              <dd className="font-semibold text-[#17263C]">{groupDisplay}</dd>
            </div>
          )}

          {result.studentCode && (
            <div className="flex items-baseline gap-1.5 tabular-nums">
              <dt className="text-[#617187] font-medium shrink-0">
                {t('শিক্ষার্থী আইডি:', 'Student ID:')}
              </dt>
              <dd className="font-semibold text-[#17263C]">{result.studentCode}</dd>
            </div>
          )}

          <div className="flex items-baseline gap-1.5 tabular-nums">
            <dt className="text-[#617187] font-medium shrink-0">
              {t('শিক্ষাবর্ষ:', 'Academic Year:')}
            </dt>
            <dd className="font-semibold text-[#17263C]">
              {t(result.academicYearLabelBn, result.academicYearLabelEn)}
            </dd>
          </div>

          {publishedDisplay && (
            <div className="flex items-baseline gap-1.5 tabular-nums">
              <dt className="text-[#617187] font-medium shrink-0">
                {t('প্রকাশের তারিখ:', 'Published On:')}
              </dt>
              <dd className="font-semibold text-[#17263C]">{num(publishedDisplay)}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Summary Highlights Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-2.5 sm:gap-3 tabular-nums">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <span className="block text-[11px] text-[#617187] font-medium">
            {t('চূড়ান্ত ফলাফল', 'Final Result')}
          </span>
          <div className="mt-1 flex items-center gap-1.5">
            {isPassed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span
              className={`text-sm sm:text-base font-bold ${
                isPassed ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {isPassed ? t('উত্তীর্ণ (PASSED)', 'PASSED') : t('অকৃতকার্য (FAILED)', 'FAILED')}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <span className="block text-[11px] text-[#617187] font-medium">
            {t('মোট প্রাপ্ত নম্বর', 'Total Marks')}
          </span>
          <span className="mt-1 block text-sm sm:text-base font-bold text-[#102B50]">
            {num(result.obtainedTotalMarks)} / {num(result.totalFullMarks)}
          </span>
        </div>

        {result.calculateGpa && result.gpa !== null ? (
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <span className="block text-[11px] text-[#617187] font-medium">
              {t(`জিপিএ (${num(result.maxGpa.toFixed(2))} স্কেলে)`, `GPA (Scale ${result.maxGpa.toFixed(2)})`)}
            </span>
            <span className="mt-1 block text-sm sm:text-base font-bold text-[#1F5FAF]">
              {num(result.gpa.toFixed(2))}{' '}
              <span className="text-xs font-semibold text-[#102B50]">({result.letterGrade})</span>
            </span>
            {result.gpaWithoutOptional != null && (
              <span className="block text-[10px] text-[#617187] mt-0.5">
                {t('৪র্থ বিষয় ব্যতীত:', 'Without 4th Sub:')}{' '}
                {num(result.gpaWithoutOptional.toFixed(2))}
              </span>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <span className="block text-[11px] text-[#617187] font-medium">
              {t('অর্জিত গ্রেড', 'Overall Grade')}
            </span>
            <span className="mt-1 block text-sm sm:text-base font-bold text-[#1F5FAF]">
              {result.letterGrade}
            </span>
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-white p-3">
          {result.showPosition && result.position != null ? (
            <>
              <span className="block text-[11px] text-[#617187] font-medium">
                {t('মেধাক্রম ও শতকরা হার', 'Merit Position & %')}
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#17A9C6] shrink-0" />
                <span className="text-sm sm:text-base font-bold text-[#102B50]">
                  {t(`${num(result.position)}তম`, formatOrdinalEn(result.position))}
                  {result.calculatePercentage && result.percentage !== null
                    ? ` · ${num(result.percentage.toFixed(2))}%`
                    : ''}
                </span>
              </div>
            </>
          ) : (
            <>
              <span className="block text-[11px] text-[#617187] font-medium">
                {t('শতকরা নম্বর (%)', 'Percentage / Average')}
              </span>
              <span className="mt-1 block text-sm sm:text-base font-bold text-[#102B50]">
                {result.calculatePercentage && result.percentage !== null
                  ? `${num(result.percentage.toFixed(2))}%`
                  : '—'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Subject-Wise Marks Breakdown */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <h3 className="text-xs sm:text-sm font-bold text-[#102B50] tracking-wide">
            {t('বিষয়ভিত্তিক প্রাপ্ত নম্বরের বিবরণী', 'Subject-Wise Marks Statement')}
          </h3>
          <span className="text-[11px] text-[#617187]">
            {t(gradingRule.nameBn, gradingRule.nameEn)}
          </span>
        </div>

        {/* Mobile Stacked Subject Cards (Hidden on md+, print, and A4 PDF export) */}
        {!forceDesktopTable && (
          <div className="md:hidden print:hidden divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
            {subjects.map((sub, idx) => (
              <div
                key={sub.id}
                className={`p-3.5 space-y-2 ${
                  !sub.isPassed && !sub.isOptional ? 'bg-rose-50/40' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[11px] text-[#617187] tabular-nums">
                      #{num(String(idx + 1).padStart(2, '0'))} · {sub.subjectCode}
                      {sub.isOptional ? ` · ${t('ঐচ্ছিক বিষয়', 'Optional')}` : ''}
                    </span>
                    <h4 className="text-sm font-bold text-[#102B50] leading-snug">
                      {t(sub.subjectNameBn, sub.subjectNameEn)}
                    </h4>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                        sub.letterGrade === 'F'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-[#102B50]/[0.08] text-[#102B50]'
                      }`}
                    >
                      {sub.letterGrade}
                      {result.calculateGpa ? ` (${num(sub.gradePoint.toFixed(2))})` : ''}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#617187] tabular-nums pt-1 border-t border-slate-100">
                  <div>
                    {t('পূর্ণমান:', 'Full Marks:')}{' '}
                    <strong className="text-[#17263C]">{num(sub.fullMarks)}</strong>
                  </div>
                  <div className="text-right">
                    {t('প্রাপ্ত নম্বর:', 'Obtained:')}{' '}
                    <strong className="text-[#102B50]">
                      {sub.isAbsent ? t('অনুপস্থিত', 'Absent') : num(sub.obtainedMarks)}
                    </strong>
                  </div>
                </div>

                {sub.hasComponents &&
                  (sub.writtenMarks != null ||
                    sub.mcqMarks != null ||
                    sub.practicalMarks != null) && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#617187] tabular-nums">
                      {sub.writtenMarks != null && (
                        <span>
                          {t('লিখিত:', 'CQ:')} {num(sub.writtenMarks)}
                          {sub.writtenFullMarks ? `/${num(sub.writtenFullMarks)}` : ''}
                        </span>
                      )}
                      {sub.mcqMarks != null && (
                        <span>
                          {t('MCQ:', 'MCQ:')} {num(sub.mcqMarks)}
                          {sub.mcqFullMarks ? `/${num(sub.mcqFullMarks)}` : ''}
                        </span>
                      )}
                      {sub.hasPractical && sub.practicalMarks != null && (
                        <span>
                          {t('ব্যবহারিক:', 'Practical:')} {num(sub.practicalMarks)}
                          {sub.practicalFullMarks ? `/${num(sub.practicalFullMarks)}` : ''}
                        </span>
                      )}
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}

        {/* Full Institutional Table (Shown on md+, Print, and A4 PDF Export) */}
        <div
          className={`${
            forceDesktopTable ? 'block' : 'hidden md:block print:block'
          } overflow-x-auto border border-slate-300 rounded-lg print:rounded-none`}
        >
          <table className="w-full text-left border-collapse text-xs sm:text-[13px] print:text-[11.5px] tabular-nums">
            <thead>
              <tr className="bg-[#102B50] text-white">
                <th className="py-2.5 px-3 font-semibold w-10 text-center">
                  {t('ক্রম', 'SL')}
                </th>
                <th className="py-2.5 px-3 font-semibold">{t('বিষয়ের নাম ও কোড', 'Subject')}</th>
                <th className="py-2.5 px-3 font-semibold text-center">
                  {t('পূর্ণমান', 'Full Marks')}
                </th>
                {hasComponentBreakdown && (
                  <th className="py-2.5 px-3 font-semibold text-center">
                    {t('অংশভিত্তিক নম্বর (লিখিত / MCQ / ব্যবহারিক)', 'Component Breakdown')}
                  </th>
                )}
                <th className="py-2.5 px-3 font-semibold text-center">
                  {t('প্রাপ্ত নম্বর', 'Obtained')}
                </th>
                <th className="py-2.5 px-3 font-semibold text-center">
                  {t('লেটার গ্রেড', 'Grade')}
                </th>
                {result.calculateGpa && (
                  <th className="py-2.5 px-3 font-semibold text-center">
                    {t('গ্রেড পয়েন্ট', 'GP')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {subjects.map((sub, idx) => {
                const components: string[] = [];
                if (sub.writtenMarks != null) {
                  components.push(`${t('লিখিত', 'CQ')}: ${num(sub.writtenMarks)}`);
                }
                if (sub.mcqMarks != null) {
                  components.push(`MCQ: ${num(sub.mcqMarks)}`);
                }
                if (sub.hasPractical && sub.practicalMarks != null) {
                  components.push(`${t('ব্যবহারিক', 'Prac')}: ${num(sub.practicalMarks)}`);
                }

                return (
                  <tr
                    key={sub.id}
                    className={
                      !sub.isPassed && !sub.isOptional
                        ? 'bg-rose-50/60'
                        : idx % 2 === 1
                        ? 'bg-[#F6F8FC]/60'
                        : 'bg-white'
                    }
                  >
                    <td className="py-2.5 px-3 text-center text-[#617187] font-medium">
                      {num(String(idx + 1).padStart(2, '0'))}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-[#102B50]">
                        {t(sub.subjectNameBn, sub.subjectNameEn)}
                      </div>
                      <div className="text-[11px] text-[#617187]">
                        {t('কোড:', 'Code:')} {sub.subjectCode}
                        {sub.isOptional && (
                          <span className="ml-2 text-[#1F5FAF] font-medium">
                            ({t('ঐচ্ছিক / ৪র্থ বিষয়', 'Optional 4th Subject')})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium text-[#17263C]">
                      {num(sub.fullMarks)}
                    </td>
                    {hasComponentBreakdown && (
                      <td className="py-2.5 px-3 text-center text-xs text-[#617187]">
                        {components.length > 0 ? components.join(' · ') : '—'}
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-center font-bold text-[#102B50]">
                      {sub.isAbsent ? t('অনুপস্থিত', 'Absent') : num(sub.obtainedMarks)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-center font-bold ${
                        sub.letterGrade === 'F' ? 'text-rose-700' : 'text-[#102B50]'
                      }`}
                    >
                      {sub.letterGrade}
                    </td>
                    {result.calculateGpa && (
                      <td className="py-2.5 px-3 text-center font-semibold text-[#17263C]">
                        {num(sub.gradePoint.toFixed(2))}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#F6F8FC] border-t-2 border-slate-300 font-bold text-[#102B50]">
                <td colSpan={2} className="py-2.5 px-3 text-right">
                  {t('সর্বমোট নম্বর (Total Marks):', 'Grand Total:')}
                </td>
                <td className="py-2.5 px-3 text-center">{num(result.totalFullMarks)}</td>
                {hasComponentBreakdown && <td className="py-2.5 px-3 text-center">—</td>}
                <td className="py-2.5 px-3 text-center">{num(result.obtainedTotalMarks)}</td>
                <td className="py-2.5 px-3 text-center">{result.letterGrade}</td>
                {result.calculateGpa && (
                  <td className="py-2.5 px-3 text-center">
                    {result.gpa !== null ? num(result.gpa.toFixed(2)) : '—'}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Grading Scale Legend */}
      <div className="pt-1">
        <p className="text-[11px] font-semibold text-[#617187] mb-1.5">
          {t('প্রযোজ্য গ্রেডিং মানদণ্ড:', 'Applicable Grading Scale:')}
        </p>
        <div className="flex flex-wrap gap-1.5 text-[11px] text-[#17263C] tabular-nums">
          {gradingRule.gradeScale.map((band) => (
            <span
              key={band.letterGrade}
              className="px-2 py-1 rounded border border-slate-200 bg-[#F6F8FC]"
            >
              <strong>{band.letterGrade}</strong>: {num(band.minPercentage)}–
              {num(band.maxPercentage)}%
              {result.calculateGpa ? ` (${num(band.gradePoint.toFixed(2))})` : ''}
            </span>
          ))}
        </div>
      </div>

      {/* Official Signatures Row (Styled for A4 Print & PDF) */}
      <div className="pt-8 print:pt-10 grid grid-cols-3 gap-4 text-center text-[11px] sm:text-xs text-[#617187]">
        <div className="border-t border-slate-300 pt-2">
          <p className="font-semibold text-[#102B50]">
            {t('শ্রেণি শিক্ষক', 'Class Teacher')}
          </p>
        </div>
        <div className="border-t border-slate-300 pt-2">
          <p className="font-semibold text-[#102B50]">
            {t('পরীক্ষা নিয়ন্ত্রক', 'Controller of Examinations')}
          </p>
        </div>
        <div className="border-t border-slate-300 pt-2">
          <p className="font-semibold text-[#102B50]">
            {t('অধ্যক্ষ', 'Principal')}
          </p>
          <p className="text-[10px] text-[#617187]">BPSC, Ishwardi EPZ</p>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[#617187]">
        <span>
          {t(
            'বেপজা পাবলিক স্কুল এন্ড কলেজ অনলাইন ফলাফল পোর্টাল থেকে কম্পিউটার জেনারেটেড ট্রান্সক্রিপ্ট।',
            'Computer-generated academic marksheet issued via BPSC Official Result Portal.'
          )}
        </span>
        <span className="tabular-nums">bpsciepz.edu.bd/result</span>
      </div>
    </div>
  );
};

export const ResultMarksheet: React.FC<ResultMarksheetProps> = ({
  bundle,
  onSearchAnother,
}) => {
  const { t } = useLanguage();
  const { settings } = usePublicData();
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const a4ExportRef = useRef<HTMLDivElement | null>(null);

  const { result, subjects, gradingRule } = bundle;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!a4ExportRef.current || isDownloading) return;
    setIsDownloading(true);
    setPdfError(null);

    try {
      const dataUrl = await toPng(a4ExportRef.current, {
        quality: 0.98,
        pixelRatio: 2.2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidthMm = 210;
      const pageHeightMm = 297;
      const marginMm = 10;
      const printableWidthMm = pageWidthMm - marginMm * 2;
      const maxPrintableHeightMm = pageHeightMm - marginMm * 2;

      const imgProps = pdf.getImageProperties(dataUrl);
      let renderWidthMm = printableWidthMm;
      let renderHeightMm = (imgProps.height * renderWidthMm) / imgProps.width;

      if (renderHeightMm > maxPrintableHeightMm) {
        const scale = maxPrintableHeightMm / renderHeightMm;
        renderHeightMm = maxPrintableHeightMm;
        renderWidthMm = renderWidthMm * scale;
      }

      const xOffset = (pageWidthMm - renderWidthMm) / 2;
      pdf.addImage(
        dataUrl,
        'PNG',
        xOffset,
        marginMm,
        renderWidthMm,
        renderHeightMm,
        undefined,
        'FAST'
      );

      const safeFileName = `BPSC_Marksheet_${result.academicYearId}_${result.classCode}_Roll_${result.rollNumber}.pdf`;
      pdf.save(safeFileName);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setPdfError(
        t(
          'পিডিএফ তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে "মার্কশিট প্রিন্ট করুন" বাটনে ক্লিক করে Save as PDF নির্বাচন করুন।',
          'Could not generate PDF directly. Please click "Print Marksheet" and select "Save as PDF".'
        )
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar (Hidden when printing) */}
      <div className="no-print bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs sm:text-sm text-[#17263C] font-medium">
          {t(
            'মার্কশিটটি A4 কাগজে প্রিন্ট অথবা পিডিএফ হিসেবে সংরক্ষণ করতে পারবেন।',
            'Ready for A4 printing or direct PDF download.'
          )}
        </div>

        <div className="grid grid-cols-1 min-[420px]:grid-cols-3 sm:flex sm:flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>{t('মার্কশিট প্রিন্ট করুন', 'Print Marksheet')}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 rounded-lg bg-[#1F5FAF] hover:bg-[#184c8f] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <Download className="w-4 h-4 shrink-0" />
            )}
            <span>
              {isDownloading
                ? t('পিডিএফ তৈরি হচ্ছে...', 'Generating PDF...')
                : t('পিডিএফ ডাউনলোড', 'Download PDF')}
            </span>
          </button>

          <button
            type="button"
            onClick={onSearchAnother}
            className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 rounded-lg border border-slate-200 hover:border-[#102B50] bg-[#F6F8FC] hover:bg-white text-[#102B50] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>{t('অন্য ফলাফল খুঁজুন', 'Search Another Result')}</span>
          </button>
        </div>
      </div>

      {pdfError && (
        <div className="no-print rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs sm:text-sm text-rose-800">
          {pdfError}
        </div>
      )}

      {/* Interactive & Print-Ready On-Screen Marksheet */}
      <div id="bpsciepz-printable-marksheet">
        <MarksheetDocumentSheet
          result={result}
          subjects={subjects}
          gradingRule={gradingRule}
          schoolNameBn={settings.schoolNameBn}
          schoolNameEn={settings.schoolNameEn}
          addressBn={settings.addressBn}
          addressEn={settings.addressEn}
          eiin={settings.eiin}
        />
      </div>

      {/* Dedicated Fixed-Width A4 Export Surface so Mobile PDF Downloads Render True A4 Proportions */}
      <div
        className="no-print fixed left-0 top-0 w-0 h-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div ref={a4ExportRef} className="w-[794px] bg-white p-6">
          <MarksheetDocumentSheet
            result={result}
            subjects={subjects}
            gradingRule={gradingRule}
            schoolNameBn={settings.schoolNameBn}
            schoolNameEn={settings.schoolNameEn}
            addressBn={settings.addressBn}
            addressEn={settings.addressEn}
            eiin={settings.eiin}
            forceDesktopTable
          />
        </div>
      </div>
    </div>
  );
};
