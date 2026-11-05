import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FolderOpen,
  Loader2,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePublicData } from '../context/PublicDataContext';
import { SeoHead } from '../components/common/SeoHead';
import {
  CloudDocumentCategory,
  CloudDocumentFilterState,
  CloudDocumentRecord,
  CloudSupportedClassName,
} from '../types/cloud';
import {
  ALL_CLOUD_CATEGORY_NAMES,
  ALL_CLOUD_CLASS_NAMES,
  CLOUD_DOCUMENT_CATEGORIES,
  CLOUD_SUPPORTED_CLASSES,
  DEFAULT_CLOUD_ACADEMIC_YEARS,
  STANDARD_CLOUD_SUBJECTS,
} from '../data/cloudCenterSeedData';
import {
  fetchPublishedCloudDocuments,
  filterCloudDocuments,
} from '../services/cloudDocumentService';
import { CloudDocumentCard } from '../components/cloud/CloudDocumentCard';
import { CloudPreviewModal } from '../components/cloud/CloudPreviewModal';
import { inspectGoogleDriveUrl } from '../utils/googleDriveUtils';

const SINGLE_CATEGORY_PAGE_SIZE = 6;
const GROUPED_INITIAL_LIMIT = 9;

export const CloudCenterPage: React.FC = () => {
  const { t, num } = useLanguage();
  const { settings, holidays } = usePublicData();
  const [searchParams, setSearchParams] = useSearchParams();

  const [allDocuments, setAllDocuments] = useState<CloudDocumentRecord[]>([]);
  const [dataSource, setDataSource] = useState<'firestore' | 'demo_sandbox'>('firestore');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize filter state from URL query parameters if provided
  const initialCategoryParam = searchParams.get('category');
  const initialCategory: CloudDocumentCategory | 'ALL' =
    initialCategoryParam &&
    ALL_CLOUD_CATEGORY_NAMES.includes(initialCategoryParam as CloudDocumentCategory)
      ? (initialCategoryParam as CloudDocumentCategory)
      : 'ALL';

  const initialClassParam = searchParams.get('class');
  const initialClass: CloudSupportedClassName | 'ALL' | 'GENERAL' =
    initialClassParam === 'GENERAL'
      ? 'GENERAL'
      : initialClassParam &&
        ALL_CLOUD_CLASS_NAMES.includes(initialClassParam as CloudSupportedClassName)
      ? (initialClassParam as CloudSupportedClassName)
      : 'ALL';

  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<CloudDocumentCategory | 'ALL'>(
    initialCategory
  );
  const [selectedClass, setSelectedClass] = useState<CloudSupportedClassName | 'ALL' | 'GENERAL'>(
    initialClass
  );
  const [selectedSubject, setSelectedSubject] = useState<string>(
    searchParams.get('subject') || 'ALL'
  );
  const [selectedYear, setSelectedYear] = useState<string>(searchParams.get('year') || 'ALL');

  const [visibleCount, setVisibleCount] = useState<number>(
    initialCategory === 'ALL' ? GROUPED_INITIAL_LIMIT : SINGLE_CATEGORY_PAGE_SIZE
  );
  const [previewDoc, setPreviewDoc] = useState<CloudDocumentRecord | null>(null);

  // Optional Link Diagnostic Drawer for testing Google Drive formats & invalid URL errors
  const [showLinkInspector, setShowLinkInspector] = useState<boolean>(false);
  const [testDriveUrlInput, setTestDriveUrlInput] = useState<string>('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);

    fetchPublishedCloudDocuments()
      .then((res) => {
        if (!active) return;
        setAllDocuments(res.documents);
        setDataSource(res.source);
      })
      .catch(() => {
        if (!active) return;
        setLoadError(
          t(
            'ক্লাউড ডকুমেন্ট লোড করতে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করুন।',
            'Unable to load Cloud Center documents right now. Please refresh the page.'
          )
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [t]);

  // Reset pagination when filters change & sync URL params cleanly
  useEffect(() => {
    setVisibleCount(
      selectedCategory === 'ALL' ? GROUPED_INITIAL_LIMIT : SINGLE_CATEGORY_PAGE_SIZE
    );

    const nextParams = new URLSearchParams();
    if (selectedCategory !== 'ALL') nextParams.set('category', selectedCategory);
    if (selectedClass !== 'ALL') nextParams.set('class', selectedClass);
    if (selectedSubject !== 'ALL') nextParams.set('subject', selectedSubject);
    if (selectedYear !== 'ALL') nextParams.set('year', selectedYear);
    if (searchQuery.trim()) nextParams.set('q', searchQuery.trim());
    setSearchParams(nextParams, { replace: true });
  }, [
    selectedCategory,
    selectedClass,
    selectedSubject,
    selectedYear,
    searchQuery,
    setSearchParams,
  ]);

  // Available Subjects (combining standard BPSC subjects + any custom subjects in Firestore)
  const subjectOptions = useMemo(() => {
    const map = new Map<string, { nameEn: string; nameBn: string }>();
    for (const s of STANDARD_CLOUD_SUBJECTS) {
      map.set(s.nameEn.toLowerCase(), s);
    }
    for (const docItem of allDocuments) {
      if (docItem.subject) {
        const key = docItem.subject.toLowerCase();
        if (!map.has(key)) {
          map.set(key, { nameEn: docItem.subject, nameBn: docItem.subject });
        }
      }
    }
    return Array.from(map.values());
  }, [allDocuments]);

  // Available Academic Years
  const yearOptions = useMemo(() => {
    const set = new Set<string>(DEFAULT_CLOUD_ACADEMIC_YEARS);
    for (const docItem of allDocuments) {
      if (docItem.academicYear) set.add(docItem.academicYear);
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [allDocuments]);

  // Count per category after applying non-category filters (search, class, subject, year)
  const categoryCounts = useMemo(() => {
    const baseFiltered = filterCloudDocuments(allDocuments, {
      searchQuery,
      category: 'ALL',
      className: selectedClass,
      subject: selectedSubject,
      academicYear: selectedYear,
    });

    const counts: Record<string, number> = { ALL: baseFiltered.length };
    for (const cat of CLOUD_DOCUMENT_CATEGORIES) {
      counts[cat.key] = baseFiltered.filter((d) => d.category === cat.key).length;
    }
    return counts;
  }, [allDocuments, searchQuery, selectedClass, selectedSubject, selectedYear]);

  // Final filtered documents
  const activeFilterState: CloudDocumentFilterState = useMemo(
    () => ({
      searchQuery,
      category: selectedCategory,
      className: selectedClass,
      subject: selectedSubject,
      academicYear: selectedYear,
    }),
    [searchQuery, selectedCategory, selectedClass, selectedSubject, selectedYear]
  );

  const matchingDocuments = useMemo(
    () => filterCloudDocuments(allDocuments, activeFilterState),
    [allDocuments, activeFilterState]
  );

  const paginatedDocuments = useMemo(
    () => matchingDocuments.slice(0, visibleCount),
    [matchingDocuments, visibleCount]
  );

  // Organized category sections when viewing across categories (never one unorganized flat dump)
  const groupedCategorySections = useMemo(() => {
    return CLOUD_DOCUMENT_CATEGORIES.map((categoryMeta) => {
      const allInCat = matchingDocuments.filter((d) => d.category === categoryMeta.key);
      const visibleInCat = paginatedDocuments.filter((d) => d.category === categoryMeta.key);
      return {
        categoryMeta,
        totalInCategory: allInCat.length,
        documents: visibleInCat,
      };
    }).filter((section) => section.documents.length > 0);
  }, [matchingDocuments, paginatedDocuments]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'ALL' ||
    selectedClass !== 'ALL' ||
    selectedSubject !== 'ALL' ||
    selectedYear !== 'ALL';

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedClass('ALL');
    setSelectedSubject('ALL');
    setSelectedYear('ALL');
  };

  const activeCategoryMeta =
    selectedCategory !== 'ALL'
      ? CLOUD_DOCUMENT_CATEGORIES.find((c) => c.key === selectedCategory)
      : undefined;

  const diagnosticResolution = useMemo(() => {
    if (!testDriveUrlInput.trim()) return null;
    return inspectGoogleDriveUrl(testDriveUrlInput, 'PDF');
  }, [testDriveUrlInput]);

  const showHolidaySchedulePanel =
    selectedCategory === 'ALL' ||
    selectedCategory === 'Holiday List' ||
    selectedCategory === 'Academic Calendar';

  const matchingHolidays = useMemo(() => {
    if (!showHolidaySchedulePanel) return [];
    const q = searchQuery.trim().toLowerCase();
    return holidays
      .filter((h) => h.isPublished)
      .filter((h) => {
        if (selectedYear !== 'ALL' && h.academicYear !== selectedYear) return false;
        if (
          selectedClass !== 'ALL' &&
          selectedClass !== 'GENERAL' &&
          h.applicableClass !== 'ALL' &&
          h.applicableClass !== selectedClass
        ) {
          return false;
        }
        if (q) {
          const hay = `${h.titleEn} ${h.titleBn} ${h.descriptionEn} ${h.descriptionBn} ${h.startDate}`.toLowerCase();
          return hay.includes(q);
        }
        return true;
      });
  }, [holidays, showHolidaySchedulePanel, selectedYear, selectedClass, searchQuery]);

  return (
    <>
      <SeoHead
        title={t(
          'BPSC Cloud Document Center — ক্লাউড ডকুমেন্ট সেন্টার',
          'BPSC Cloud Document Center — Academic Resources & Circulars'
        )}
        description="Access important academic resources, notices, routines, and institutional documents in one place — BEPZA Public School and College (BPSC), Ishwardi EPZ."
      />

      {/* Branded Institutional Header */}
      <section className="bg-[#102B50] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
          <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-300 flex items-center gap-2">
            <Link to="/" className="hover:text-white transition-colors">
              {t('প্রচ্ছদ', 'Home')}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#17A9C6] font-medium">
              {t('ক্লাউড সেন্টার', 'Cloud Center')}
            </span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 max-w-3xl">
              <img
                src="/assets/branding/logo.jpeg"
                alt="BEPZA Public School and College Official Crest"
                referrerPolicy="no-referrer"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white/25 bg-white shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs sm:text-[13px] font-medium text-[#17A9C6] tabular-nums">
                  {t(settings.schoolNameBn, settings.schoolNameEn)} · EIIN: {num(settings.eiin)}
                </p>
                <h1 className="mt-0.5 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-snug">
                  BPSC Cloud Document Center
                </h1>
                <p className="mt-1.5 text-xs sm:text-sm lg:text-[15px] text-slate-200 leading-relaxed">
                  {t(
                    'একই প্ল্যাটফর্মে গুরুত্বপূর্ণ একাডেমিক রিসোর্স, নোটিশ, রুটিন এবং প্রাতিষ্ঠানিক ডকুমেন্টসমূহ সহজে অনুসন্ধান ও ডাউনলোড করুন।',
                    'Access important academic resources, notices, routines, and institutional documents in one place.'
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                to="/result"
                className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg border border-white/25 bg-white/10 hover:bg-white/15 text-xs sm:text-sm font-semibold text-white transition-colors whitespace-nowrap"
              >
                <span>{t('ফলাফল পোর্টাল', 'Result Portal')}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#17A9C6]" />
              </Link>
              <Link
                to="/notices"
                className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg border border-white/25 bg-white/10 hover:bg-white/15 text-xs sm:text-sm font-semibold text-white transition-colors whitespace-nowrap"
              >
                <span>{t('নোটিশ বোর্ড', 'Notice Board')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Cloud Library Workspace */}
      <section className="py-7 sm:py-10 lg:py-12 bg-[#F6F8FC] min-h-[65vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Demo Verification Sandbox Notice (only shown when live Firestore has 0 published docs yet) */}
          {dataSource === 'demo_sandbox' && !loading && (
            <div className="bg-white rounded-xl border border-slate-200/90 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#617187]">
              <div className="flex items-start sm:items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#1F5FAF] mt-0.5 sm:mt-0 shrink-0" />
                <p className="leading-relaxed">
                  {t(
                    'সিস্টেম যাচাই মোড: বর্তমানে সকল ১২টি ক্যাটাগরি ও গুগল ড্রাইভ লিংক ফরম্যাট পরীক্ষার জন্য স্পষ্টভাবে চিহ্নিত [DEMO TEST] নমুনা ডকুমেন্ট প্রদর্শিত হচ্ছে। অ্যাডমিন প্যানেল (Phase 4) থেকে অফিসিয়াল ডকুমেন্ট প্রকাশিত হলে তা স্বয়ংক্রিয়ভাবে এখানে প্রদর্শিত হবে।',
                    'Verification Mode Active: Showing clearly labeled [DEMO TEST] sample entries across all 12 categories to verify search, filters, and Google Drive handling until official links are published via the Master Admin Panel.'
                  )}
                </p>
              </div>
              <span className="font-semibold text-[#102B50] whitespace-nowrap tabular-nums">
                {num(allDocuments.length)} {t('টি প্রকাশিত রেকর্ড', 'Published Items')}
              </span>
            </div>
          )}

          {/* Search & Multi-Filter Control Panel */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 space-y-4">
            {/* Search Input Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#617187] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(
                    'ডকুমেন্টের শিরোনাম, বিষয়, শ্রেণি, শিক্ষাবর্ষ বা বিবরণ লিখে খুঁজুন...',
                    'Search by document title, category, class, subject, academic year, or description...'
                  )}
                  aria-label={t('ডকুমেন্ট অনুসন্ধান করুন', 'Search cloud documents')}
                  className="w-full min-h-[44px] pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 bg-[#F6F8FC] focus:bg-white focus:border-[#1F5FAF] focus:outline-none text-sm text-[#17263C] placeholder:text-[#617187] transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label={t('অনুসন্ধান মুছুন', 'Clear search text')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#617187] hover:text-[#102B50] hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-lg border border-slate-200 hover:border-[#1F5FAF] bg-white text-xs sm:text-sm font-semibold text-[#102B50] hover:text-[#1F5FAF] transition-colors whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('ফিল্টার মুছুন', 'Clear Filters')}</span>
                </button>
              )}
            </div>

            {/* 4 Combinable Filter Selectors: Category, Class, Subject, Academic Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Document Category Filter */}
              <div>
                <label
                  htmlFor="cloud-filter-category"
                  className="block text-xs font-semibold text-[#102B50] mb-1"
                >
                  {t('ডকুমেন্ট ক্যাটাগরি', 'Document Category')}
                </label>
                <select
                  id="cloud-filter-category"
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(e.target.value as CloudDocumentCategory | 'ALL')
                  }
                  className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-[#1F5FAF] focus:outline-none text-xs sm:text-sm text-[#17263C]"
                >
                  <option value="ALL">
                    {t('সকল ক্যাটাগরি (বিভাগওয়ারী)', 'All Categories (Organized View)')}
                  </option>
                  {CLOUD_DOCUMENT_CATEGORIES.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {t(cat.labelBn, cat.labelEn)}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Class Filter (Nursery to Class 10 + General) */}
              <div>
                <label
                  htmlFor="cloud-filter-class"
                  className="block text-xs font-semibold text-[#102B50] mb-1"
                >
                  {t('শ্রেণি নির্বাচন', 'Class')}
                </label>
                <select
                  id="cloud-filter-class"
                  value={selectedClass}
                  onChange={(e) =>
                    setSelectedClass(
                      e.target.value as CloudSupportedClassName | 'ALL' | 'GENERAL'
                    )
                  }
                  className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-[#1F5FAF] focus:outline-none text-xs sm:text-sm text-[#17263C]"
                >
                  <option value="ALL">{t('সকল শ্রেণি', 'All Classes')}</option>
                  <option value="GENERAL">
                    {t('সকল শ্রেণি / সাধারণ প্রাতিষ্ঠানিক', 'General (Non-Class Specific)')}
                  </option>
                  {CLOUD_SUPPORTED_CLASSES.map((cls) => (
                    <option key={cls.nameEn} value={cls.nameEn}>
                      {t(cls.nameBn, cls.nameEn)}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Subject Filter */}
              <div>
                <label
                  htmlFor="cloud-filter-subject"
                  className="block text-xs font-semibold text-[#102B50] mb-1"
                >
                  {t('বিষয় নির্বাচন', 'Subject')}
                </label>
                <select
                  id="cloud-filter-subject"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-[#1F5FAF] focus:outline-none text-xs sm:text-sm text-[#17263C]"
                >
                  <option value="ALL">{t('সকল বিষয়', 'All Subjects')}</option>
                  {subjectOptions.map((sub) => (
                    <option key={sub.nameEn} value={sub.nameEn}>
                      {t(sub.nameBn, sub.nameEn)}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Academic Year Filter */}
              <div>
                <label
                  htmlFor="cloud-filter-year"
                  className="block text-xs font-semibold text-[#102B50] mb-1"
                >
                  {t('শিক্ষাবর্ষ', 'Academic Year')}
                </label>
                <select
                  id="cloud-filter-year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-[#1F5FAF] focus:outline-none text-xs sm:text-sm text-[#17263C]"
                >
                  <option value="ALL">{t('সকল শিক্ষাবর্ষ', 'All Academic Years')}</option>
                  {yearOptions.map((yr) => (
                    <option key={yr} value={yr}>
                      {num(yr)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filter Summary & Matching Count Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-[#617187] tabular-nums">
              <div>
                {loading ? (
                  <span>{t('ডকুমেন্ট তালিকা লোড হচ্ছে...', 'Loading published documents...')}</span>
                ) : (
                  <span>
                    {t('মোট প্রাসঙ্গিক ডকুমেন্ট পাওয়া গেছে:', 'Matching documents found:')}{' '}
                    <strong className="text-[#102B50] font-bold">
                      {num(matchingDocuments.length)}
                    </strong>
                    {matchingDocuments.length > paginatedDocuments.length && (
                      <>
                        {' '}
                        · {t('প্রদর্শিত:', 'Showing:')}{' '}
                        <strong className="text-[#17263C]">
                          {num(paginatedDocuments.length)}
                        </strong>
                      </>
                    )}
                  </span>
                )}
              </div>

              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[#1F5FAF]">
                  <span>{t('সক্রিয় ফিল্টার:', 'Active filters:')}</span>
                  {selectedCategory !== 'ALL' && <span>{selectedCategory}</span>}
                  {selectedClass !== 'ALL' && (
                    <span>· {selectedClass === 'GENERAL' ? 'General' : selectedClass}</span>
                  )}
                  {selectedSubject !== 'ALL' && <span>· {selectedSubject}</span>}
                  {selectedYear !== 'ALL' && <span>· {num(selectedYear)}</span>}
                  {searchQuery.trim() && <span>· &ldquo;{searchQuery.trim()}&rdquo;</span>}
                </div>
              )}
            </div>
          </div>

          {/* Mobile / Tablet Responsive Category Navigation Strip (360px - 1023px) */}
          <div className="lg:hidden bg-white rounded-xl border border-slate-200/90 p-3.5">
            <div className="text-xs font-semibold text-[#102B50] mb-2.5">
              {t('ক্যাটাগরি অনুযায়ী ব্রাউজ করুন (১২টি বিভাগ)', 'Browse by Category (12 Sections)')}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`min-h-[40px] px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between gap-1.5 transition-colors ${
                  selectedCategory === 'ALL'
                    ? 'bg-[#102B50] text-white font-semibold'
                    : 'bg-[#F6F8FC] text-[#17263C] hover:bg-slate-100'
                }`}
              >
                <span className="truncate">{t('সকল বিভাগ', 'All Sections')}</span>
                <span
                  className={`text-[11px] tabular-nums shrink-0 ${
                    selectedCategory === 'ALL' ? 'text-[#17A9C6]' : 'text-[#617187]'
                  }`}
                >
                  {num(categoryCounts.ALL || 0)}
                </span>
              </button>

              {CLOUD_DOCUMENT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.key;
                const count = categoryCounts[cat.key] || 0;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`min-h-[40px] px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between gap-1.5 transition-colors ${
                      isSelected
                        ? 'bg-[#1F5FAF] text-white font-semibold'
                        : 'bg-[#F6F8FC] text-[#17263C] hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{t(cat.labelBn, cat.labelEn)}</span>
                    <span
                      className={`text-[11px] tabular-nums shrink-0 ${
                        isSelected ? 'text-white/90' : 'text-[#617187]'
                      }`}
                    >
                      {num(count)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop 2-Column Layout: Left 12-Category Rail + Right Structured Document Views */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Desktop Category Navigation Sidebar */}
            <aside
              aria-label={t('ডকুমেন্ট ক্যাটাগরি নেভিগেশন', 'Document Categories')}
              className="hidden lg:block lg:col-span-3 bg-white rounded-xl border border-slate-200/90 p-3.5 sticky top-20"
            >
              <div className="px-2.5 pb-2.5 mb-2 border-b border-slate-100">
                <h2 className="text-xs font-bold text-[#102B50] tracking-wide">
                  {t('ডকুমেন্ট বিভাগসমূহ (১২)', 'Document Categories (12)')}
                </h2>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className={`w-full min-h-[40px] px-3 py-2 rounded-lg text-left text-[13px] flex items-center justify-between gap-2 transition-colors ${
                    selectedCategory === 'ALL'
                      ? 'bg-[#102B50] text-white font-semibold'
                      : 'text-[#17263C] hover:bg-[#F6F8FC] hover:text-[#1F5FAF] font-medium'
                  }`}
                >
                  <span className="truncate">
                    {t('সকল বিভাগ (সংগঠিত ভিউ)', 'All Categories')}
                  </span>
                  <span
                    className={`text-xs tabular-nums shrink-0 ${
                      selectedCategory === 'ALL' ? 'text-[#17A9C6]' : 'text-[#617187]'
                    }`}
                  >
                    {num(categoryCounts.ALL || 0)}
                  </span>
                </button>

                {CLOUD_DOCUMENT_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.key;
                  const count = categoryCounts[cat.key] || 0;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`w-full min-h-[38px] px-3 py-2 rounded-lg text-left text-[13px] flex items-center justify-between gap-2 transition-colors ${
                        isSelected
                          ? 'bg-[#1F5FAF]/[0.1] text-[#1F5FAF] font-semibold'
                          : 'text-[#17263C] hover:bg-[#F6F8FC] hover:text-[#1F5FAF] font-medium'
                      }`}
                    >
                      <span className="truncate">{t(cat.labelBn, cat.labelEn)}</span>
                      <span
                        className={`text-xs tabular-nums shrink-0 ${
                          isSelected ? 'text-[#1F5FAF] font-bold' : 'text-[#617187]'
                        }`}
                      >
                        {num(count)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Right Document Library Content Area */}
            <div className="lg:col-span-9 space-y-6">
              {/* Official Holiday & Institutional Calendar Schedule (Managed in /admin/holidays) */}
              {!loading && matchingHolidays.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#102B50]/[0.08] text-[#1F5FAF] flex items-center justify-center shrink-0">
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-[#102B50]">
                          {t(
                            'প্রকাশিত ছুটির তালিকা ও প্রাতিষ্ঠানিক সময়সূচি',
                            'Published Holiday & Institutional Schedule'
                          )}
                        </h2>
                        <p className="text-xs text-[#617187]">
                          {t(
                            'অ্যাডমিন প্যানেল থেকে হালনাগাদকৃত একক ও বহু-দিনের ছুটির তালিকা',
                            'Official single-day and multi-day holiday calendar entries'
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#102B50] tabular-nums">
                      {num(matchingHolidays.length)} {t('টি ছুটি', 'Scheduled Dates')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {matchingHolidays.slice(0, selectedCategory === 'ALL' ? 4 : 20).map((hol) => (
                      <div
                        key={hol.id}
                        className="p-3.5 rounded-lg bg-[#F6F8FC] border border-slate-200/80 flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
                            <span className="font-semibold text-[#1F5FAF]">
                              {hol.isMultiDay
                                ? `${num(hol.startDate)} → ${num(hol.endDate)}`
                                : num(hol.startDate)}
                            </span>
                            <span className="text-[#617187]">
                              {hol.applicableClass === 'ALL'
                                ? t('সকল শ্রেণি', 'All Classes')
                                : hol.applicableClass}
                            </span>
                          </div>
                          <h3 className="mt-1 text-sm font-bold text-[#102B50] leading-snug">
                            {t(hol.titleBn || hol.titleEn, hol.titleEn)}
                          </h3>
                          <p className="mt-1 text-xs text-[#617187] leading-relaxed line-clamp-2">
                            {t(hol.descriptionBn || hol.descriptionEn, hol.descriptionEn)}
                          </p>
                        </div>
                        {hol.driveUrl && (
                          <div className="pt-2 border-t border-slate-200/60">
                            <a
                              href={hol.driveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F5FAF] hover:underline"
                            >
                              <span>{t('অফিস আদেশ দেখুন', 'Open Circular')}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loading ? (
                <div className="bg-white rounded-xl border border-slate-200/90 py-16 px-6 flex flex-col items-center justify-center text-center gap-3">
                  <Loader2 className="w-7 h-7 text-[#1F5FAF] animate-spin" />
                  <p className="text-sm font-medium text-[#102B50]">
                    {t(
                      'প্রকাশিত ডকুমেন্টসমূহ লোড হচ্ছে...',
                      'Loading published documents from BPSC Cloud Center...'
                    )}
                  </p>
                </div>
              ) : loadError ? (
                <div
                  role="alert"
                  className="bg-white rounded-xl border border-red-200 p-6 sm:p-8 flex items-start gap-3.5 text-red-700"
                >
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <h2 className="text-base font-bold">{t('সংযোগ ত্রুটি', 'Connection Error')}</h2>
                    <p className="text-xs sm:text-sm leading-relaxed">{loadError}</p>
                  </div>
                </div>
              ) : matchingDocuments.length === 0 ? (
                /* Empty State */
                <div className="bg-white rounded-xl border border-slate-200/90 py-14 px-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#102B50]/[0.07] text-[#1F5FAF] flex items-center justify-center mx-auto">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1.5">
                    <h2 className="text-base sm:text-lg font-bold text-[#102B50]">
                      {t(
                        'আপনার অনুসন্ধান বা ফিল্টারের সাথে মিল রয়েছে এমন কোনো ডকুমেন্ট পাওয়া যায়নি',
                        'No Matching Published Documents Found'
                      )}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#617187] leading-relaxed">
                      {t(
                        'অনুগ্রহ করে ভিন্ন শব্দ, শ্রেণি, বিষয় বা শিক্ষাবর্ষ নির্বাচন করুন অথবা সকল ফিল্টার রিসেট করুন।',
                        'Try adjusting your search keywords, class, subject, or academic year filter, or clear all active filters to browse the full library.'
                      )}
                    </p>
                  </div>
                  {hasActiveFilters && (
                    <div>
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="inline-flex items-center justify-center gap-2 min-h-[42px] px-5 py-2.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs sm:text-sm font-semibold transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>{t('সকল ফিল্টার মুছুন', 'Clear All Filters')}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : selectedCategory !== 'ALL' && activeCategoryMeta ? (
                /* Dedicated Single-Category View */
                <div className="space-y-5">
                  <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-[#1F5FAF]">
                        {t('নির্বাচিত ডকুমেন্ট বিভাগ', 'Category Archive')}
                      </p>
                      <h2 className="mt-0.5 text-lg sm:text-xl font-bold text-[#102B50]">
                        {t(activeCategoryMeta.labelBn, activeCategoryMeta.labelEn)}
                      </h2>
                      <p className="mt-1 text-xs sm:text-sm text-[#617187]">
                        {t(activeCategoryMeta.descriptionBn, activeCategoryMeta.descriptionEn)}
                      </p>
                    </div>
                    <div className="text-xs font-semibold text-[#102B50] tabular-nums shrink-0">
                      {num(matchingDocuments.length)}{' '}
                      {t('টি ডকুমেন্ট', matchingDocuments.length === 1 ? 'Document' : 'Documents')}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paginatedDocuments.map((docItem) => (
                      <CloudDocumentCard
                        key={docItem.id}
                        document={docItem}
                        onPreview={setPreviewDoc}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                /* Organized Category-Grouped View (Never mixes all documents into one unorganized flat list) */
                <div className="space-y-8">
                  {groupedCategorySections.map(({ categoryMeta, totalInCategory, documents }) => (
                    <div key={categoryMeta.key} className="space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2.5 border-b border-slate-200">
                        <div>
                          <h2 className="text-base sm:text-lg font-bold text-[#102B50] flex items-center gap-2">
                            <span>
                              {String(categoryMeta.order).padStart(2, '0')}.{' '}
                              {t(categoryMeta.labelBn, categoryMeta.labelEn)}
                            </span>
                            <span className="text-xs font-normal text-[#617187] tabular-nums">
                              ({num(totalInCategory)})
                            </span>
                          </h2>
                          <p className="text-xs text-[#617187] mt-0.5">
                            {t(categoryMeta.descriptionBn, categoryMeta.descriptionEn)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedCategory(categoryMeta.key)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F5FAF] hover:text-[#102B50] transition-colors whitespace-nowrap self-start sm:self-auto"
                        >
                          <span>
                            {t('শুধু এই বিভাগ দেখুন', `Open ${categoryMeta.labelEn} View`)}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documents.map((docItem) => (
                          <CloudDocumentCard
                            key={docItem.id}
                            document={docItem}
                            onPreview={setPreviewDoc}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Load More Pagination */}
              {!loading && matchingDocuments.length > paginatedDocuments.length && (
                <div className="pt-2 flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((prev) =>
                        selectedCategory === 'ALL'
                          ? prev + GROUPED_INITIAL_LIMIT
                          : prev + SINGLE_CATEGORY_PAGE_SIZE
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 rounded-lg bg-white hover:bg-[#102B50] text-[#102B50] hover:text-white border border-slate-200 hover:border-[#102B50] text-xs sm:text-sm font-semibold transition-colors tabular-nums"
                  >
                    <span>
                      {t('আরো ডকুমেন্ট লোড করুন', 'Load More Documents')} (
                      {num(matchingDocuments.length - paginatedDocuments.length)}{' '}
                      {t('টি বাকি', 'remaining')})
                    </span>
                  </button>
                </div>
              )}

              {/* Collapsible Google Drive Link Validator & Access Help */}
              <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowLinkInspector((prev) => !prev)}
                  aria-expanded={showLinkInspector}
                  className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-[#F6F8FC] transition-colors"
                >
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-[#102B50]">
                      {t(
                        'গুগল ড্রাইভ ডাউনলোড সহায়িকা ও লিংক যাচাই টুল',
                        'Google Drive Access Guide & Link Format Verifier'
                      )}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#617187] mt-0.5">
                      {t(
                        'গুগল ড্রাইভ শেয়ারিং পারমিশন এবং সমর্থিত লিংক ফরম্যাটসমূহ যাচাই করুন',
                        'Verify supported Google Drive URL formats (/file/d/ID/view, /open?id=ID, /uc?id=ID) and sharing requirements'
                      )}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[#617187] shrink-0 transition-transform ${
                      showLinkInspector ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showLinkInspector && (
                  <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-slate-100 space-y-3.5 text-xs text-[#617187]">
                    <p className="leading-relaxed">
                      {t(
                        'বিপিএসসি ক্লাউড ডকুমেন্ট সেন্টারের সকল ফাইল বাহ্যিকভাবে Google Drive-এ সংরক্ষিত। সরাসরি ডাউনলোড বা প্রিভিউ কাজ করার জন্য ফাইলটির শেয়ারিং সেটিংস "Anyone with the link can view" হতে হবে।',
                        'Documents in BPSC Cloud Center are hosted externally on Google Drive. If a file owner restricts sharing permissions, direct download or embedded preview may require signing in or opening the file page on Google Drive.'
                      )}
                    </p>

                    <div className="space-y-2">
                      <label
                        htmlFor="drive-url-verifier"
                        className="block font-semibold text-[#102B50]"
                      >
                        {t(
                          'যেকোনো গুগল ড্রাইভ লিংক পরীক্ষা করুন:',
                          'Test a Google Drive URL format:'
                        )}
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          id="drive-url-verifier"
                          type="url"
                          value={testDriveUrlInput}
                          onChange={(e) => setTestDriveUrlInput(e.target.value)}
                          placeholder="https://drive.google.com/file/d/FILE_ID/view"
                          className="flex-1 min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 bg-[#F6F8FC] focus:bg-white focus:border-[#1F5FAF] focus:outline-none text-xs sm:text-sm text-[#17263C]"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setTestDriveUrlInput(
                                'https://drive.google.com/file/d/1BPSC2026DemoClass8MathSyllabus04/view'
                              )
                            }
                            className="min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-[#102B50] font-medium whitespace-nowrap"
                          >
                            {t('বৈধ নমুনা', 'Valid Sample')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setTestDriveUrlInput('https://example.com/not-drive.pdf')}
                            className="min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 hover:border-red-400 text-red-700 font-medium whitespace-nowrap"
                          >
                            {t('ত্রুটিপূর্ণ লিংক পরীক্ষা', 'Invalid Sample')}
                          </button>
                        </div>
                      </div>
                    </div>

                    {diagnosticResolution && (
                      <div
                        className={`p-3.5 rounded-lg border ${
                          diagnosticResolution.isValid
                            ? 'bg-emerald-50/60 border-emerald-200 text-[#17263C]'
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}
                      >
                        {diagnosticResolution.isValid ? (
                          <div className="space-y-1.5">
                            <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span>
                                {t('বৈধ গুগল ড্রাইভ লিংক শনাক্ত হয়েছে', 'Valid Google Drive URL Verified')}
                              </span>
                            </div>
                            {diagnosticResolution.fileId && (
                              <div className="tabular-nums break-all">
                                <strong>File ID:</strong> {diagnosticResolution.fileId}
                              </div>
                            )}
                            {diagnosticResolution.directDownloadUrl && (
                              <div className="break-all">
                                <strong>Direct Download URL:</strong>{' '}
                                {diagnosticResolution.directDownloadUrl}
                              </div>
                            )}
                            {diagnosticResolution.fallbackViewUrl && (
                              <div className="pt-1">
                                <a
                                  href={diagnosticResolution.fallbackViewUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-semibold text-[#1F5FAF] hover:underline"
                                >
                                  <span>{t('ফলব্যাক ড্রাইভ পেজ খুলুন', 'Open Fallback Drive Page')}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>
                              {t(
                                diagnosticResolution.errorMessageBn || 'লিংকটি বৈধ নয়।',
                                diagnosticResolution.errorMessageEn || 'Invalid Google Drive URL.'
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Embedded Document Preview Modal */}
      <CloudPreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
    </>
  );
};
