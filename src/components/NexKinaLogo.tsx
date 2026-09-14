import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const NexKinaLogo: React.FC<LogoProps> = ({
  className = '',
  showText = true,
  showTagline = true,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: { svg: 'w-8 h-8', text: 'text-sm', sub: 'text-[7px]' },
    md: { svg: 'w-10 h-10', text: 'text-base', sub: 'text-[9px]' },
    lg: { svg: 'w-14 h-14', text: 'text-xl', sub: 'text-[11px]' },
    xl: { svg: 'w-24 h-24', text: 'text-3xl', sub: 'text-xs' }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* SVG Icon */}
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${currentSize.svg} shrink-0`}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="nk-green-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00A86B" />
            <stop offset="100%" stopColor="#004B23" />
          </linearGradient>
          <linearGradient id="nk-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE000" />
            <stop offset="100%" stopColor="#795900" />
          </linearGradient>
          <linearGradient id="nk-fiat-silver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
          <linearGradient id="nk-mountain-dark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#002D15" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#001F0E" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Outer subtle glow circle */}
        <circle cx="256" cy="256" r="240" fill="#090d12" stroke="#1e293b" strokeWidth="4" />

        {/* Left Green Column of N */}
        <path
          d="M110 90 H 220 L 220 422 H 110 Z"
          fill="url(#nk-green-grad)"
        />

        {/* Mountain Silhouette on Green Column */}
        <path
          d="M110 320 L 150 240 L 190 280 L 220 220 L 220 422 H 110 Z"
          fill="url(#nk-mountain-dark)"
        />

        {/* Gold Diagonal and Right Column of N */}
        <path
          d="M220 90 L 330 310 L 330 90 H 402 L 402 422 H 302 L 195 200 L 195 422 H 110 L 220 90 Z"
          fill="url(#nk-gold-grad)"
        />

        {/* Bird of Paradise Silhouette in Right/Diagonal Stem */}
        {/* Drawn elegantly inside the gold area */}
        <path
          d="M 330 180 
             C 335 150, 360 130, 380 140 
             C 375 145, 365 155, 360 170 
             C 355 185, 350 205, 355 220 
             C 350 225, 340 225, 335 220 
             C 330 215, 328 195, 330 180 Z"
          fill="#090D12"
        />
        {/* Feathers of Bird of Paradise */}
        <path
          d="M 360 170 
             C 375 160, 395 165, 400 185 
             C 390 180, 375 180, 365 185 Z"
          fill="#090D12"
        />
        <path
          d="M 358 190 
             C 380 185, 405 195, 410 215 
             C 395 205, 375 205, 362 200 Z"
          fill="#090D12"
        />
        <path
          d="M 355 210 
             C 375 210, 400 230, 402 250 
             C 390 235, 370 230, 358 220 Z"
          fill="#090D12"
        />

        {/* Southern Cross Constellation Stars (Gold Stars on Dark Background or Gold/Yellow accents) */}
        {/* Star 1: Alpha Crucis (Bottom) */}
        <polygon points="360,370 363,375 369,375 364,379 366,385 360,381 354,385 356,379 351,375 357,375" fill="#FFE000" />
        {/* Star 2: Beta Crucis (Left) */}
        <polygon points="310,320 313,325 319,325 314,329 316,335 310,331 304,335 306,329 301,325 307,325" fill="#FFE000" />
        {/* Star 3: Gamma Crucis (Top) */}
        <polygon points="360,270 363,275 369,275 364,279 366,285 360,281 354,285 356,279 351,275 357,275" fill="#FFE000" />
        {/* Star 4: Delta Crucis (Right) */}
        <polygon points="410,310 413,315 419,315 414,319 416,325 410,321 404,325 406,319 401,315 407,315" fill="#FFE000" />
        {/* Star 5: Epsilon Crucis (Small intermediate star) */}
        <polygon points="385,340 387,343 391,343 388,346 389,350 385,347 381,350 382,346 379,343 383,343" fill="#FFE000" />
      </svg>

      {/* Brand Text Elements */}
      {showText && (
        <div className="flex flex-col">
          <div className={`${currentSize.text} font-black tracking-tight flex items-center leading-none`}>
            <span className="text-white">Nex</span>
            <span className="text-[#FFCE00]">Kina</span>
          </div>
          {showTagline && (
            <div className={`${currentSize.sub} font-semibold text-slate-400 tracking-wider uppercase mt-0.5 leading-none`}>
              TRADE <span className="text-[#008751] font-extrabold">|</span> PAY <span className="text-[#008751] font-extrabold">|</span> GROW
            </div>
          )}
        </div>
      )}
    </div>
  );
};
