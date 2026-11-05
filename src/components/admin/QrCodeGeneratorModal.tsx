import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, QrCode, X } from 'lucide-react';

interface QrCodeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUrl?: string;
  initialLabel?: string;
}

interface QrPreset {
  id: string;
  label: string;
  path: string;
}

const PORTAL_PRESETS: QrPreset[] = [
  { id: 'home', label: 'Main Public Website', path: '/' },
  { id: 'cloud', label: 'BPSC Cloud Document Center', path: '/cloud' },
  { id: 'result', label: 'Student Result Portal', path: '/result' },
  { id: 'holidays', label: 'Official Holiday List (Cloud)', path: '/cloud?category=Holiday+List' },
  { id: 'admission', label: 'Admission Information', path: '/admission' },
];

export const QrCodeGeneratorModal: React.FC<QrCodeGeneratorModalProps> = ({
  isOpen,
  onClose,
  initialUrl,
  initialLabel,
}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bpsciepz.edu.bd';
  const [targetUrl, setTargetUrl] = useState<string>(initialUrl || `${origin}/cloud`);
  const [qrTitle, setQrTitle] = useState<string>(
    initialLabel || 'BPSC Cloud Document Center'
  );
  const [pngDataUrl, setPngDataUrl] = useState<string>('');
  const [svgMarkup, setSvgMarkup] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    if (initialUrl) setTargetUrl(initialUrl);
    if (initialLabel) setQrTitle(initialLabel);
  }, [initialUrl, initialLabel]);

  useEffect(() => {
    if (!isOpen) return;
    const clean = targetUrl.trim();
    if (!clean) {
      setPngDataUrl('');
      setSvgMarkup('');
      return;
    }

    let cancelled = false;
    setGenError(null);

    Promise.all([
      QRCode.toDataURL(clean, {
        width: 512,
        margin: 2,
        color: { dark: '#102B50', light: '#FFFFFF' },
      }),
      QRCode.toString(clean, {
        type: 'svg',
        margin: 2,
        color: { dark: '#102B50', light: '#FFFFFF' },
      }),
    ])
      .then(([png, svg]) => {
        if (cancelled) return;
        setPngDataUrl(png);
        setSvgMarkup(svg);
      })
      .catch(() => {
        if (!cancelled) setGenError('Unable to generate QR code for this URL.');
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, targetUrl]);

  if (!isOpen) return null;

  const safeSlug = qrTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'bpsc-qr';

  const handleDownloadPng = () => {
    if (!pngDataUrl) return;
    const link = document.createElement('a');
    link.href = pngDataUrl;
    link.download = `${safeSlug}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSvg = () => {
    if (!svgMarkup) return;
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeSlug}-qr.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#102B50]/65 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Institutional QR Code Generator"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#102B50]/[0.08] text-[#102B50] flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#102B50]">
                Institutional QR Code Generator
              </h2>
              <p className="text-xs text-[#617187]">
                Generate downloadable PNG & vector SVG QR codes for notices, boards & circulars
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR Generator"
            className="p-1.5 rounded-lg text-[#617187] hover:text-[#102B50] hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[82dvh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-[#102B50] mb-1.5">
              Quick Institutional Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PORTAL_PRESETS.map((preset) => {
                const full = `${origin}${preset.path}`;
                const active = targetUrl === full;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setTargetUrl(full);
                      setQrTitle(preset.label);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-[#102B50] text-white border-[#102B50]'
                        : 'bg-[#F6F8FC] text-[#17263C] border-slate-200 hover:border-[#1F5FAF]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#102B50] mb-1">
                QR Label / Filename
              </label>
              <input
                type="text"
                value={qrTitle}
                onChange={(e) => setQrTitle(e.target.value)}
                placeholder="e.g., Annual Exam Result Portal"
                className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm text-[#17263C] focus:border-[#1F5FAF] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#102B50] mb-1">
                Target Public URL or Document Link
              </label>
              <div className="flex gap-1.5">
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 text-sm text-[#17263C] focus:border-[#1F5FAF] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  title="Copy URL"
                  className="px-3 rounded-lg border border-slate-200 hover:border-[#1F5FAF] text-[#102B50] flex items-center justify-center"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {genError ? (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {genError}
            </div>
          ) : (
            <div className="bg-[#F6F8FC] rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center gap-5">
              <div className="w-44 h-44 bg-white rounded-xl border border-slate-200 p-2.5 flex items-center justify-center shrink-0">
                {pngDataUrl ? (
                  <img
                    src={pngDataUrl}
                    alt={`QR code for ${qrTitle}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-[#617187]">Enter URL</span>
                )}
              </div>

              <div className="flex-1 space-y-3 text-center sm:text-left min-w-0 w-full">
                <div>
                  <div className="text-sm font-bold text-[#102B50] truncate">{qrTitle}</div>
                  <div className="text-xs text-[#617187] break-all mt-0.5 line-clamp-2">
                    {targetUrl}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    type="button"
                    disabled={!pngDataUrl}
                    onClick={handleDownloadPng}
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PNG (512px)</span>
                  </button>

                  <button
                    type="button"
                    disabled={!svgMarkup}
                    onClick={handleDownloadSvg}
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg border border-slate-200 bg-white hover:border-[#1F5FAF] disabled:opacity-50 text-[#102B50] text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Print SVG</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
