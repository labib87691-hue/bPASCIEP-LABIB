import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface BreadcrumbItem {
  labelBn: string;
  labelEn: string;
  to?: string;
}

interface PageHeaderProps {
  titleBn: string;
  titleEn: string;
  subtitleBn?: string;
  subtitleEn?: string;
  breadcrumbs: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  titleBn,
  titleEn,
  subtitleBn,
  subtitleEn,
  breadcrumbs,
  actions,
}) => {
  const { t } = useLanguage();

  return (
    <section className="bg-[#102B50] text-white border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9 lg:py-11">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs text-slate-300 mb-3"
        >
          <Link to="/" className="hover:text-white transition-colors whitespace-nowrap">
            {t('প্রচ্ছদ', 'Home')}
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="hover:text-white transition-colors whitespace-nowrap"
                >
                  {t(crumb.labelBn, crumb.labelEn)}
                </Link>
              ) : (
                <span className="text-white/90 font-medium truncate max-w-[210px] sm:max-w-[320px]">
                  {t(crumb.labelBn, crumb.labelEn)}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 sm:gap-6">
          <div className="max-w-3xl">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-[1.28]">
              {t(titleBn, titleEn)}
            </h1>
            {(subtitleBn || subtitleEn) && (
              <p className="mt-2 text-xs sm:text-sm lg:text-base text-slate-200/90 leading-relaxed max-w-2xl">
                {t(subtitleBn || '', subtitleEn || '')}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0 self-start md:self-auto">{actions}</div>}
        </div>
      </div>
    </section>
  );
};
