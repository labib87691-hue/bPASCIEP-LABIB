import React, { useEffect } from 'react';
import { Download, X, FileText } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fileUrl: string;
  fileType?: 'pdf' | 'image';
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  fileUrl,
  fileType,
}) => {
  const { t } = useLanguage();

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !fileUrl) return null;

  const isPdf = fileType === 'pdf' || fileUrl.toLowerCase().endsWith('.pdf');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#102B50]/75 backdrop-blur-xs p-2.5 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-5xl h-[86dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2.5 sm:gap-4 px-3.5 sm:px-5 py-3 border-b border-slate-200 bg-[#F6F8FC]">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#1F5FAF] shrink-0" />
            <h3 className="text-xs sm:text-base font-semibold text-[#17263C] truncate">
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <a
              href={fileUrl}
              download
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs font-medium text-white bg-[#1F5FAF] hover:bg-[#102B50] rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden min-[400px]:inline">
                {t('ডাউনলোড করুন', 'Download')}
              </span>
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('বন্ধ করুন', 'Close')}
              className="p-2 rounded-lg text-[#617187] hover:text-[#17263C] hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-100 overflow-auto flex items-center justify-center">
          {isPdf ? (
            <iframe
              src={fileUrl}
              title={title}
              className="w-full h-full border-0 bg-white"
            />
          ) : (
            <div className="p-3 sm:p-4 max-h-full overflow-auto">
              <img
                src={fileUrl}
                alt={title}
                referrerPolicy="no-referrer"
                className="max-w-full h-auto mx-auto rounded-lg shadow-xs"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
