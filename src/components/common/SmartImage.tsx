import React, { useState } from 'react';
import { Building2, User } from 'lucide-react';

interface SmartImageProps {
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallbackType?: 'person' | 'campus';
  fallbackLabel?: string;
  eager?: boolean;
}

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  className = '',
  imgClassName = 'w-full h-full object-cover',
  fallbackType = 'campus',
  fallbackLabel,
  eager = false,
}) => {
  const [hasError, setHasError] = useState(false);

  const initials = fallbackLabel
    ? fallbackLabel
        .replace(/^(Mr\.|Mrs\.|Md\.|Md|Most\.|Mst\.|Major General)\s+/i, '')
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('')
    : '';

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#102B50]/[0.06] text-[#102B50] select-none overflow-hidden ${className}`}
        role="img"
        aria-label={alt}
      >
        {fallbackType === 'person' ? (
          <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
            <div className="w-14 h-14 rounded-full bg-[#102B50]/10 flex items-center justify-center text-[#102B50] font-semibold text-base tracking-wide">
              {initials || <User className="w-6 h-6 text-[#102B50]/70" />}
            </div>
            {fallbackLabel && (
              <span className="text-xs text-[#617187] max-w-[16ch] truncate">{fallbackLabel}</span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
            <Building2 className="w-8 h-8 text-[#1F5FAF]/70" />
            <span className="text-xs text-[#617187] line-clamp-2 max-w-[24ch]">{alt}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-[#102B50]/[0.04] ${className}`}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setHasError(true)}
        className={imgClassName}
      />
    </div>
  );
};
