import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  X,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { CloudDocumentRecord } from '../../types/cloud';
import { CLOUD_DOCUMENT_CATEGORIES, CLOUD_SUPPORTED_CLASSES } from '../../data/cloudCenterSeedData';
import { inspectGoogleDriveUrl } from '../../utils/googleDriveUtils';

interface CloudPreviewModalProps {
  document: CloudDocumentRecord | null;
  onClose: () => void;
}

export const CloudPreviewModal: React.FC<CloudPreviewModalProps> = ({ document, onClose }) => {
  const { t, num } = useLanguage();
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    setIframeLoaded(false);
  }, [document?.id]);

  useEffect(() => {
    if (!document) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [document, onClose]);

  if (!document) return null;

  const resolution = inspectGoogleDriveUrl(document.driveUrl, document.fileType);
  const categoryMeta = CLOUD_DOCUMENT_CATEGORIES.find((c) => c.key === document.category);
  const classMeta = document.className
    ? CLOUD_SUPPORTED_CLASSES.find((c) => c.nameEn === document.className)
    : undefined;

  const displayTitle = document.titleBn
    ? t(document.titleBn, document.title)
    : document.title;

  const targetDownloadHref = resolution.canDirectDownload
    ? resolution.directDownloadUrl
    : resolution.fallbackViewUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#102B50]/75 backdrop-blur-xs p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t('ডকুমেন্ট প্রিভিউ', 'Document Preview')}
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-start justify-between gap-4 bg-[#F6F8FC]">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#617187] tabular-nums">
              <span className="font-semibold text-[#1F5FAF]">
                {categoryMeta ? t(categoryMeta.labelBn, categoryMeta.labelEn) : document.category}
              </span>
              <span aria-hidden="true">·</span>
              <span>{document.fileType}</span>
              {document.className && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{classMeta ? t(classMeta.nameBn, classMeta.nameEn) : document.className}</span>
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
            <h3 className="mt-1 text-sm sm:text-base lg:text-lg font-bold text-[#102B50] leading-snug line-clamp-2">
              {displayTitle}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('প্রিভিউ বন্ধ করুন', 'Close preview')}
            className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[#17263C] flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview Viewport */}
        <div className="flex-1 min-h-[320px] sm:min-h-[480px] bg-slate-100 relative flex flex-col">
          {!resolution.isValid ? (
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10 text-center">
              <div className="max-w-md space-y-3">
                <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-[#102B50]">
                  {t('গুগল ড্রাইভ লিংকটি কার্যকর নয়', 'Invalid Google Drive Link')}
                </h4>
                <p className="text-xs sm:text-sm text-[#617187] leading-relaxed">
                  {t(
                    resolution.errorMessageBn ||
                      'ডকুমেন্টটির লিংক সঠিক নয় বা অসম্পূর্ণ। অনুগ্রহ করে বিদ্যালয় অফিসের সাথে যোগাযোগ করুন।',
                    resolution.errorMessageEn ||
                      'The stored Google Drive URL could not be validated. Please contact the school administration.'
                  )}
                </p>
              </div>
            </div>
          ) : resolution.canEmbedPreview && resolution.embedPreviewUrl ? (
            <div className="relative flex-1 min-h-[340px] sm:min-h-[500px]">
              {!iframeLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100 text-[#617187] z-10">
                  <Loader2 className="w-6 h-6 text-[#1F5FAF] animate-spin" />
                  <p className="text-xs sm:text-sm font-medium">
                    {t(
                      'গুগল ড্রাইভ প্রিভিউ লোড হচ্ছে...',
                      'Loading Google Drive document preview...'
                    )}
                  </p>
                </div>
              )}
              <iframe
                src={resolution.embedPreviewUrl}
                title={displayTitle}
                onLoad={() => setIframeLoaded(true)}
                className="w-full h-full min-h-[340px] sm:min-h-[500px] border-0 bg-white"
                allow="autoplay"
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10 text-center bg-white">
              <div className="max-w-md space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#102B50]/[0.07] text-[#1F5FAF] flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-base sm:text-lg font-bold text-[#102B50]">
                    {t(
                      'এই ফাইল ফরম্যাটের সরাসরি ইন-অ্যাপ প্রিভিউ উপলব্ধ নয়',
                      'Embedded Preview Unavailable for This Format'
                    )}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#617187] leading-relaxed">
                    {t(
                      `${document.fileType} ফরম্যাট বা শেয়ার্ড ফোল্ডার সরাসরি ব্রাউজার ফ্রেমে প্রিভিউ করা যায় না। নিচের বাটনে ক্লিক করে গুগল ড্রাইভে খুলুন অথবা ডাউনলোড করুন।`,
                      `Direct embedded preview is not supported for ${document.fileType} files or shared folders. You can open the item directly in Google Drive or proceed to download.`
                    )}
                  </p>
                </div>
                {resolution.fallbackViewUrl && (
                  <div className="pt-1">
                    <a
                      href={resolution.fallbackViewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-xs sm:text-sm font-semibold transition-colors"
                    >
                      <span>{t('গুগল ড্রাইভে খুলুন', 'Open in Google Drive')}</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Sharing Note + Open in Drive + Download */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[11px] sm:text-xs text-[#617187] leading-relaxed">
            {t(
              'নোট: ফাইলটি গুগল ড্রাইভে সংরক্ষিত। প্রিভিউ লোড না হলে বা অ্যাক্সেস সীমাবদ্ধ থাকলে "Open in Google Drive" ব্যবহার করুন।',
              'Hosted externally on Google Drive. If embedded preview is restricted by file sharing settings, use Open in Google Drive.'
            )}
          </p>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {resolution.isValid && resolution.fallbackViewUrl && (
              <a
                href={resolution.fallbackViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-xs sm:text-sm font-semibold text-[#102B50] hover:text-[#1F5FAF] transition-colors whitespace-nowrap"
              >
                <span>{t('গুগল ড্রাইভে খুলুন', 'Open in Google Drive')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {resolution.isValid && targetDownloadHref && (
              <a
                href={targetDownloadHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#1F5FAF] hover:bg-[#102B50] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  {resolution.canDirectDownload
                    ? t('ডাউনলোড লিংক খুলুন', 'Download via Drive')
                    : t('ড্রাইভ পেজে দেখুন', 'Open Drive File')}
                </span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
