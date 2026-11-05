import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Bell, Search, Users, X, Compass } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { usePublicData } from '../../context/PublicDataContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchHit {
  id: string;
  categoryBn: string;
  categoryEn: string;
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  subtitleEn: string;
  to: string;
  type: 'page' | 'notice' | 'teacher' | 'academic';
}

const STATIC_PAGE_INDEX: Omit<SearchHit, 'type'>[] = [
  {
    id: 'p-about',
    categoryBn: 'পাতা',
    categoryEn: 'Page',
    titleBn: 'প্রতিষ্ঠান পরিচিতি ও ইতিহাস',
    titleEn: 'About BPSC, History, Mission & Vision',
    subtitleBn: 'বেপজা পাবলিক স্কুল এন্ড কলেজ, ঈশ্বরদী ইপিজেড (EIIN: 140336)',
    subtitleEn: 'Institutional profile, establishment history, mission & vision',
    to: '/about',
  },
  {
    id: 'p-admin',
    categoryBn: 'প্রশাসন',
    categoryEn: 'Administration',
    titleBn: 'প্রশাসন ও বাণীসমূহ',
    titleEn: 'Administration & Leadership Messages',
    subtitleBn: 'নির্বাহী চেয়ারম্যান, নির্বাহী পরিচালক ও অধ্যক্ষের বাণী',
    subtitleEn: 'Executive Chairman, Executive Director & Principal messages',
    to: '/administration',
  },
  {
    id: 'p-gb',
    categoryBn: 'গভর্নিং বডি',
    categoryEn: 'Governing Body',
    titleBn: 'গভর্নিং বডি সদস্যবৃন্দ',
    titleEn: 'Governing Body Members',
    subtitleBn: 'বেপজা ও ইপিজেড প্রতিনিধি সমন্বয়ে গঠিত পরিচালনা পর্ষদ',
    subtitleEn: 'Board leadership and IEPZ enterprise representatives',
    to: '/governing-body',
  },
  {
    id: 'p-routine',
    categoryBn: 'বিপিএসসি ক্লাউড',
    categoryEn: 'BPSC Cloud',
    titleBn: 'ক্লাস রুটিন (বিপিএসসি ক্লাউড)',
    titleEn: 'Class Routine (BPSC Cloud)',
    subtitleBn: 'সকল শ্রেণির পিডিএফ ক্লাস রুটিন দেখুন ও ডাউনলোড করুন',
    subtitleEn: 'View and download official PDF class timetables in BPSC Cloud',
    to: '/cloud?category=Class+Routine',
  },
  {
    id: 'p-exam-routine',
    categoryBn: 'বিপিএসসি ক্লাউড',
    categoryEn: 'BPSC Cloud',
    titleBn: 'পরীক্ষার রুটিন ও মূল্যায়ন সূচি (বিপিএসসি ক্লাউড)',
    titleEn: 'Exam Routine & Assessment Schedule (BPSC Cloud)',
    subtitleBn: 'মধ্যপর্ব, অর্ধ-বার্ষিক, নির্বাচনী ও বার্ষিক পরীক্ষার সূচি',
    subtitleEn: 'Mid-term, half-yearly, pre-test, test, and annual exam schedules',
    to: '/cloud?category=Exam+Routine',
  },
  {
    id: 'p-syllabus',
    categoryBn: 'বিপিএসসি ক্লাউড',
    categoryEn: 'BPSC Cloud',
    titleBn: 'পাঠ্যক্রম, সিলেবাস ও মানবণ্টন (বিপিএসসি ক্লাউড)',
    titleEn: 'Syllabus & Study Materials (BPSC Cloud)',
    subtitleBn: 'শ্রেণিভিত্তিক সিলেবাস, প্রশ্নপত্র ও ফরমসমূহ',
    subtitleEn: 'Official syllabi, model questions, and forms in BPSC Cloud',
    to: '/cloud?category=Syllabus',
  },
  {
    id: 'p-holidays',
    categoryBn: 'বিপিএসসি ক্লাউড',
    categoryEn: 'BPSC Cloud',
    titleBn: 'ছুটির তালিকা ও বর্ষপঞ্জি (বিপিএসসি ক্লাউড)',
    titleEn: 'Holiday List & Academic Calendar (BPSC Cloud)',
    subtitleBn: 'জাতীয় ও প্রাতিষ্ঠানিক ছুটির সময়সূচি',
    subtitleEn: 'Official institutional holiday schedule and calendar',
    to: '/cloud?category=Holiday+List',
  },
  {
    id: 'p-admission',
    categoryBn: 'ভর্তি',
    categoryEn: 'Admission',
    titleBn: 'ভর্তি বিজ্ঞপ্তি, ফি চার্ট ও নিয়মাবলি',
    titleEn: 'Admission Circular, Fees & Guidelines',
    subtitleBn: 'নার্সারি থেকে নবম শ্রেণিতে শূন্য আসনে ভর্তি তথ্য',
    subtitleEn: 'Nursery to Class 9 vacant seat admission details & fees',
    to: '/admission',
  },
  {
    id: 'p-transport',
    categoryBn: 'পরিবহন',
    categoryEn: 'Transport',
    titleBn: 'স্কুল পরিবহন ব্যবস্থা',
    titleEn: 'School Transport Service',
    subtitleBn: 'ঈশ্বরদী ইপিজেড ও পার্শ্ববর্তী এলাকায় শিক্ষার্থী পরিবহন',
    subtitleEn: 'Student transport vehicles and campus boarding safety',
    to: '/transport',
  },
  {
    id: 'p-facilities',
    categoryBn: 'সুযোগ-সুবিধা',
    categoryEn: 'Facilities',
    titleBn: 'ক্যাম্পাস সুযোগ-সুবিধা',
    titleEn: 'Campus Facilities & Environment',
    subtitleBn: 'একাডেমিক ভবন, বিজ্ঞান চর্চা, আইসিটি ও সহশিক্ষা পরিবেশ',
    subtitleEn: 'Classrooms, science practice, ICT, sports & EPZ security',
    to: '/facilities',
  },
  {
    id: 'p-result',
    categoryBn: 'ফলাফল পোর্টাল',
    categoryEn: 'Result Portal',
    titleBn: 'অনলাইন পরীক্ষার ফলাফল পোর্টাল',
    titleEn: 'Student Examination Result Portal',
    subtitleBn: 'নার্সারি থেকে ১০ম শ্রেণি পর্যন্ত রোল ভিত্তিক ফলাফল ও প্রিন্টযোগ্য মার্কশিট',
    subtitleEn: 'Search published examination results & download A4 marksheets (Nursery – Class 10)',
    to: '/result',
  },
  {
    id: 'p-cloud',
    categoryBn: 'বিপিএসসি ক্লাউড',
    categoryEn: 'BPSC Cloud',
    titleBn: 'BPSC Cloud Document Center (বিপিএসসি ক্লাউড)',
    titleEn: 'BPSC Cloud Document Center',
    subtitleBn: 'রুটিন, সিলেবাস, ফরম, প্রশ্নপত্র ও প্রাতিষ্ঠানিক গুগল ড্রাইভ ডকুমেন্ট সংগ্রহশালা',
    subtitleEn: 'Access resources, notices, routines, forms & institutional documents in one place',
    to: '/cloud',
  },
  {
    id: 'p-contact',
    categoryBn: 'যোগাযোগ',
    categoryEn: 'Contact',
    titleBn: 'যোগাযোগ ও মানচিত্র',
    titleEn: 'Contact Us & Campus Location Map',
    subtitleBn: '০১৭১৩৫৬৪৫৬২ · ঈশ্বরদী ইপিজেড, পাকশী, পাবনা',
    subtitleEn: '01713564562 · Ishwardi EPZ, Paksey, Pabna',
    to: '/contact',
  },
];

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { notices, teachers, academicResources } = usePublicData();
  const [queryText, setQueryText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQueryText('');
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const allItems = useMemo<SearchHit[]>(() => {
    const pages: SearchHit[] = STATIC_PAGE_INDEX.map((p) => ({ ...p, type: 'page' }));
    const noticeHits: SearchHit[] = notices.map((n) => ({
      id: `n-${n.id}`,
      categoryBn: 'নোটিশ',
      categoryEn: 'Notice',
      titleBn: n.titleBn,
      titleEn: n.titleEn,
      subtitleBn: `${n.publishDate} · ${n.summaryBn}`,
      subtitleEn: `${n.publishDate} · ${n.summaryEn}`,
      to: `/notices/${n.id}`,
      type: 'notice',
    }));
    const teacherHits: SearchHit[] = teachers.map((tr) => ({
      id: `t-${tr.id}`,
      categoryBn: 'শিক্ষক',
      categoryEn: 'Teacher',
      titleBn: `${tr.nameBn} (${tr.name})`,
      titleEn: tr.name,
      subtitleBn: `${tr.designationBn} · ${tr.subjectBn}`,
      subtitleEn: `${tr.designationEn} · ${tr.subjectEn}`,
      to: `/teachers/${tr.id}`,
      type: 'teacher',
    }));
    const resourceHits: SearchHit[] = academicResources.map((r) => ({
      id: `r-${r.id}`,
      categoryBn: 'বিপিএসসি ক্লাউড',
      categoryEn: 'BPSC Cloud',
      titleBn: r.titleBn,
      titleEn: r.titleEn,
      subtitleBn: `${r.classNameBn} · ${r.publishDate}`,
      subtitleEn: `${r.classNameEn} · ${r.publishDate}`,
      to:
        r.resourceType === 'class_routine'
          ? '/cloud?category=Class+Routine'
          : r.resourceType === 'exam_routine'
          ? '/cloud?category=Exam+Routine'
          : '/cloud?category=Syllabus',
      type: 'academic',
    }));
    return [...pages, ...noticeHits, ...teacherHits, ...resourceHits];
  }, [notices, teachers, academicResources]);

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return allItems.slice(0, 8);
    return allItems
      .filter(
        (item) =>
          item.titleBn.toLowerCase().includes(q) ||
          item.titleEn.toLowerCase().includes(q) ||
          item.subtitleBn.toLowerCase().includes(q) ||
          item.subtitleEn.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [allItems, queryText]);

  if (!isOpen) return null;

  const handleSelect = (to: string) => {
    onClose();
    navigate(to);
  };

  const renderIcon = (type: SearchHit['type']) => {
    switch (type) {
      case 'notice':
        return <Bell className="w-4 h-4 text-[#1F5FAF]" />;
      case 'teacher':
        return <Users className="w-4 h-4 text-[#1F5FAF]" />;
      case 'academic':
        return <BookOpen className="w-4 h-4 text-[#1F5FAF]" />;
      default:
        return <Compass className="w-4 h-4 text-[#1F5FAF]" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#102B50]/65 backdrop-blur-xs pt-14 sm:pt-20 px-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('ওয়েবসাইট অনুসন্ধান', 'Search Website')}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200">
          <Search className="w-5 h-5 text-[#617187] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder={t(
              'নোটিশ, শিক্ষক, রুটিন, সিলেবাস বা তথ্য খুঁজুন...',
              'Search notices, teachers, routines, syllabus, or pages...'
            )}
            className="flex-1 text-sm sm:text-base text-[#17263C] placeholder:text-[#617187] focus:outline-none bg-transparent"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={t('বন্ধ করুন', 'Close')}
            className="p-1.5 rounded-lg text-[#617187] hover:text-[#17263C] hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-12 px-6 text-center">
              <p className="text-sm font-medium text-[#17263C]">
                {t('কোনো ফলাফল পাওয়া যায়নি', 'No matching results found')}
              </p>
              <p className="mt-1 text-xs text-[#617187]">
                {t(
                  'ভিন্ন শব্দ ব্যবহার করে আবার চেষ্টা করুন (যেমন: ভর্তি, রুটিন, গণিত, সোহেল)।',
                  'Try searching with another keyword such as admission, routine, math, or notice.'
                )}
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.to)}
                className="w-full text-left px-4 py-3.5 hover:bg-[#F6F8FC] flex items-center justify-between gap-4 transition-colors group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-[#F6F8FC] group-hover:bg-white border border-slate-200/80 flex items-center justify-center shrink-0">
                    {renderIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-[#617187] mb-0.5">
                      {t(item.categoryBn, item.categoryEn)}
                    </div>
                    <div className="text-sm font-semibold text-[#17263C] truncate group-hover:text-[#1F5FAF]">
                      {t(item.titleBn, item.titleEn)}
                    </div>
                    <div className="text-xs text-[#617187] truncate mt-0.5">
                      {t(item.subtitleBn, item.subtitleEn)}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1F5FAF] shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
