import React, { useState } from 'react';
import {
  AlertCircle,
  Download,
  ExternalLink,
  Eye,
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Presentation,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { CloudDocumentRecord, CloudFileType } from '../../types/cloud';
import { CLOUD_DOCUMENT_CATEGORIES, CLOUD_SUPPORTED_CLASSES } from '../../data/cloudCenterSeedData';
import { inspectGoogleDriveUrl } from '../../utils/googleDriveUtils';

interface CloudDocumentCardProps {
  document: CloudDocumentRecord;
  onPreview: (doc: CloudDocumentRecord) => void;
}

function getFileTypeVisual(fileType: CloudFileType) {
  switch (fileType) {
    case 'PDF':
      return {
        Icon: FileText,
        iconBoxClass: 'bg-red-50 text-red-700 border-red-200/80',
        label: 'PDF',
      };
    case 'DOC':
    case 'DOCX':
      return {
        Icon: FileText,
        iconBoxClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
        label: fileType,
      };
    case 'XLS':
    case 'XLSX':
      return {
        Icon: FileSpreadsheet,
        iconBoxClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        label: fileType,
      };
    case 'PPT':
    case 'PPTX':
      return {
        Icon: Presentation,
        iconBoxClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
        label: fileType,
      };
    case 'JPG':
    case 'PNG':
      return {
        Icon: FileImage,
        iconBoxClass: 'bg-cyan-50 text-cyan-800 border-cyan-200/80',
        label: fileType,
      };
    case 'ZIP':
      return {
        Icon: FileArchive,
        iconBoxClass: 'bg-slate-100 text-slate-700 border-slate-300/80',
        label: 'ZIP',
      };
    default:
      return {
        Icon: File,
        iconBoxClass: 'bg-slate-100 text-[#102B50] border-slate-200',
        label: 'FILE',
      };
  }
}

export const CloudDocumentCard: React.FC<CloudDocumentCardProps> = ({ document, onPreview }) => {
  const { lang, t, num } = useLanguage();
  const [downloadNotice, setDownloadNotice] = useState<'none' | 'direct_opened' | 'fallback_opened' | 'invalid'>('none');

  const resolution = inspectGoogleDriveUrl(document.driveUrl, document.fileType);
  const { Icon, iconBoxClass, label } = getFileTypeVisual(document.fileType);

  const categoryMeta = CLOUD_DOCUMENT_CATEGORIES.find((c) => c.key === document.category);
  const classMeta = document.className
    ? CLOUD_SUPPORTED_CLASSES.find((c) => c.nameEn === document.className)
    : undefined;

  const displayTitle = document.titleBn ? t(document.titleBn, document.title) : document.title;
  const displayDesc = document.descriptionBn
    ? t(document.descriptionBn, document.description)
    : document.description;

  const formattedDate = (() => {
    try {
      const dt = new Date(document.createdAtIso);
      if (Number.isNaN(dt.getTime())) return document.createdAtIso.slice(0, 10);
      return dt.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return document.createdAtIso.slice(0, 10);
    }
  })();

  const primaryDownloadHref = resolution.canDirectDownload
    ? resolution.directDownloadUrl
    : resolution.fallbackViewUrl;

  const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!resolution.isValid || !primaryDownloadHref) {
      e.preventDefault();
      setDownloadNotice('invalid');
      return;
    }

    if (resolution.canDirectDownload) {
      setDownloadNotice('direct_opened');
    } else {
      setDownloadNotice('fallback_opened');
    }
  };

  return (
    <article className="bg-white rounded-xl border border-slate-200/90 hover:border-[#1F5FAF]/45 p-4 sm:p-5 transition-colors flex flex-col justify-between h-full">
      <div>
        {/* Top Row: File Type Indicator + Unboxed Metadata */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-12 rounded-lg border flex flex-col items-center justify-center shrink-0 ${iconBoxClass}`}
            aria-label={`File type ${document.fileType}`}
          >
            <Icon className="w-4 h-4" />
            <span className="mt-0.5 text-[10px] font-bold tracking-tight leading-none">
              {label}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[#617187] tabular-nums">
              <span className="font-semibold text-[#1F5FAF]">
                {categoryMeta ? t(categoryMeta.labelBn, categoryMeta.labelEn) : document.category}
              </span>
              {document.className && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#17263C] font-medium">
                    {classMeta ? t(classMeta.nameBn, classMeta.nameEn) : document.className}
                  </span>
                </>
              )}
              {document.subject && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{document.subject}</span>
                </>
              )}
              {document.academicYear && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{num(document.academicYear)}</span>
                </>
              )}
            </div>

            <h3 className="mt-1 text-sm sm:text-[15.5px] font-bold text-[#102B50] leading-snug line-clamp-2">
              {displayTitle}
            </h3>
          </div>
        </div>

        {/* Short Description */}
        <p className="mt-3 text-xs sm:text-[13.5px] text-[#617187] leading-relaxed line-clamp-2">
          {displayDesc}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
        {/* File Information Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#617187] tabular-nums">
          <div className="flex items-center gap-1.5">
            <span>{t('প্রকাশ:', 'Published:')}</span>
            <time dateTime={document.createdAtIso} className="text-[#17263C] font-medium">
              {formattedDate}
            </time>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-medium text-[#17263C]">{document.fileType}</span>
            {document.fileSize && (
              <>
                <span aria-hidden="true">·</span>
                <span>{document.fileSize}</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={primaryDownloadHref || '#invalid-drive-link'}
            target={resolution.isValid && primaryDownloadHref ? '_blank' : undefined}
            rel={resolution.isValid && primaryDownloadHref ? 'noopener noreferrer' : undefined}
            onClick={handleDownloadClick}
            className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs sm:text-[13px] font-semibold transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>{t('ডাউনলোড', 'Download')}</span>
          </a>

          {resolution.canEmbedPreview ? (
            <button
              type="button"
              onClick={() => onPreview(document)}
              className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 hover:border-[#1F5FAF] bg-[#F6F8FC] hover:bg-white text-[#102B50] hover:text-[#1F5FAF] text-xs sm:text-[13px] font-semibold transition-colors whitespace-nowrap"
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span>{t('প্রিভিউ', 'Preview')}</span>
            </button>
          ) : resolution.isValid && resolution.fallbackViewUrl ? (
            <a
              href={resolution.fallbackViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 hover:border-[#1F5FAF] bg-[#F6F8FC] hover:bg-white text-[#102B50] hover:text-[#1F5FAF] text-xs sm:text-[13px] font-semibold transition-colors whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>{t('ড্রাইভে খুলুন', 'Open in Drive')}</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setDownloadNotice('invalid')}
              className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-slate-400 text-xs font-medium cursor-not-allowed whitespace-nowrap"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{t('লিংক ত্রুটি', 'Link Error')}</span>
            </button>
          )}
        </div>

        {/* Honest Google Drive Handoff / Fallback / Error Feedback */}
        {downloadNotice === 'direct_opened' && resolution.fallbackViewUrl && (
          <div className="p-2.5 rounded-lg bg-[#F6F8FC] border border-slate-200 text-[11.5px] text-[#17263C] leading-relaxed">
            <span>
              {t(
                'গুগল ড্রাইভ ডাউনলোড লিংক খোলা হয়েছে। অ্যাক্সেস সীমাবদ্ধ বা ডাউনলোড না হলে ',
                'Google Drive download link opened. If restricted or blocked, '
              )}
            </span>
            <a
              href={resolution.fallbackViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#1F5FAF] hover:underline inline-flex items-center gap-1"
            >
              <span>{t('গুগল ড্রাইভ ফাইল পেজ খুলুন', 'open Google Drive file page')}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>.</span>
          </div>
        )}

        {downloadNotice === 'fallback_opened' && (
          <div className="p-2.5 rounded-lg bg-[#F6F8FC] border border-slate-200 text-[11.5px] text-[#617187] leading-relaxed">
            {t(
              'এই লিংকে সরাসরি একক ফাইল ডাউনলোড প্রযোজ্য নয়; গুগল ড্রাইভ পেজ খোলা হয়েছে।',
              'Direct single-file download is unavailable for this link; opened Google Drive page instead.'
            )}
          </div>
        )}

        {downloadNotice === 'invalid' && (
          <div
            role="alert"
            className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-[11.5px] text-red-700 leading-relaxed flex items-start gap-2"
          >
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              {t(
                resolution.errorMessageBn ||
                  'ডকুমেন্ট লিংকটি সঠিক নয় বা অ্যাক্সেস অনুমোদিত নয়। অনুগ্রহ করে বিদ্যালয় অফিসে যোগাযোগ করুন।',
                resolution.errorMessageEn ||
                  'This Google Drive link is invalid or inaccessible. Please verify sharing permissions with the school office.'
              )}
            </span>
          </div>
        )}
      </div>
    </article>
  );
};
