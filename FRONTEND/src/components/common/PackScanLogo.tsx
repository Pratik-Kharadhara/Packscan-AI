import React from 'react';

interface PackScanLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  layout?: 'horizontal' | 'vertical';
  inverted?: boolean;
  className?: string;
}

export const PackScanLogo: React.FC<PackScanLogoProps> = ({
  size = 'md',
  showWordmark = true,
  layout = 'horizontal',
  inverted = false,
  className = '',
}) => {
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-sm font-black',
    md: 'text-lg font-black',
    lg: 'text-2xl font-black',
    xl: 'text-3xl font-black',
  };

  return (
    <div
      className={`inline-flex items-center ${
        layout === 'vertical' ? 'flex-col text-center gap-2' : 'flex-row gap-2.5'
      } ${className}`}
    >
      {/* High-fidelity Vector Pouch + Magnifier SVG Emblem */}
      <div className={`${iconDimensions[size]} shrink-0 relative flex items-center justify-center`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          {/* Pouch drop shadow/underlayer */}
          <path
            d="M26 18 L30 14 L34 18 L38 14 L42 18 L46 14 L50 18 L54 14 L58 18 L62 14 L66 18 L70 14 L74 18 L72 82 L68 86 L64 82 L60 86 L56 82 L52 86 L48 82 L44 86 L40 82 L36 86 L32 82 L28 86 L26 82 Z"
            fill="#E5E7EB"
          />

          {/* Main White Pouch Body */}
          <path
            d="M26 20 L30 16 L34 20 L38 16 L42 20 L46 16 L50 20 L54 16 L58 20 L62 16 L66 20 L70 16 L74 20 L72 80 L68 84 L64 80 L60 84 L56 80 L52 84 L48 80 L44 84 L40 80 L36 84 L32 80 L28 84 L26 80 Z"
            fill={inverted ? '#FFFFFF' : '#FFFFFF'}
            stroke="#1F2937"
            strokeWidth="3.2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Green Branding Diagonal Fold/Band on Right Side */}
          <path
            d="M52 20 L74 20 L72 80 L48 80 C48 65, 62 48, 52 20 Z"
            fill="#166534"
            stroke="#1F2937"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Statutory Vegetarian Green Mark (Green square with inner circle) */}
          <rect
            x="32"
            y="66"
            width="8"
            height="8"
            rx="1"
            fill="white"
            stroke="#15803D"
            strokeWidth="1.2"
          />
          <circle cx="36" cy="70" r="2.2" fill="#15803D" />

          {/* Package details lines */}
          <line x1="32" y1="36" x2="42" y2="36" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="32" y1="42" x2="42" y2="42" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="32" y1="48" x2="39" y2="48" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="32" y1="54" x2="41" y2="54" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />

          {/* Magnifying Glass Lens Outer Rim */}
          <circle
            cx="58"
            cy="48"
            r="19"
            fill="#FFFFFF"
            stroke="#1F2937"
            strokeWidth="4"
          />

          {/* Lens Glass Subtle Shading */}
          <circle
            cx="58"
            cy="48"
            r="16"
            fill="#F7F8F5"
            opacity="0.9"
          />

          {/* Text Lines inside Magnifier */}
          <line x1="46" y1="42" x2="56" y2="42" stroke="#1F2937" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="46" y1="48" x2="54" y2="48" stroke="#1F2937" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="46" y1="54" x2="55" y2="54" stroke="#1F2937" strokeWidth="2.2" strokeLinecap="round" />

          {/* Compliance Checkmark Badge in Lens */}
          <circle cx="66" cy="48" r="7.5" fill="#15803D" />
          <path
            d="M62.5 48 L65 50.5 L69.5 45.5"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Magnifying Glass Handle */}
          <path
            d="M72 61.5 L84 76"
            stroke="#1F2937"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          <path
            d="M73 63 L83 75"
            stroke="#166534"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Official PackScan.Ai Wordmark */}
      {showWordmark && (
        <div className="leading-none select-none">
          <div className={`${textSizes[size]} tracking-tight flex items-baseline`}>
            <span className={inverted ? 'text-white' : 'text-[#1F2937]'}>PackScan</span>
            <span className="text-[#166534]">.Ai</span>
          </div>
          {size !== 'sm' && (
            <p
              className={`text-[9px] font-semibold uppercase tracking-wider mt-0.5 ${
                inverted ? 'text-stone-400' : 'text-stone-500'
              }`}
            >
              Legal Metrology Compliance
            </p>
          )}
        </div>
      )}
    </div>
  );
};
