import React from 'react';

interface PackScanLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  className?: string;
  variant?: 'full' | 'icon-only' | 'stacked';
  lightText?: boolean;
}

export const PackScanLogo: React.FC<PackScanLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  variant = 'full',
  lightText = false,
}) => {
  const iconDimensions = {
    sm: { width: 30, height: 30 },
    md: { width: 40, height: 40 },
    lg: { width: 54, height: 54 },
    xl: { width: 72, height: 72 },
    '2xl': { width: 110, height: 110 },
  };

  const textSizes = {
    sm: 'text-sm tracking-tight',
    md: 'text-[17px] tracking-tight',
    lg: 'text-2xl tracking-tight',
    xl: 'text-3xl tracking-tight',
    '2xl': 'text-5xl tracking-tight',
  };

  const { width, height } = iconDimensions[size];

  // SVG representation matching the user's provided logo wo bg.png
  const renderPouchIcon = () => (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-xs"
    >
      {/* 
        Serrated Crinkle Pouch Bag 
      */}
      <defs>
        <clipPath id="pouchClip">
          {/* Exact Pouch Outer Silhouette */}
          <path d="M 40 38 
                   L 46 26 L 54 38 L 62 26 L 70 38 L 78 26 L 86 38 L 94 26 L 102 38 L 110 26 L 118 38 L 126 26 L 134 38 L 140 26 L 146 38
                   Q 138 100, 146 162
                   L 140 174 L 134 162 L 126 174 L 118 162 L 110 174 L 102 162 L 94 174 L 86 162 L 78 174 L 70 162 L 62 174 L 54 162 L 46 174 L 40 162
                   Q 48 100, 40 38 Z" />
        </clipPath>
      </defs>

      {/* Outer Pouch Shadow & Contour */}
      <path
        d="M 40 38 
           L 46 26 L 54 38 L 62 26 L 70 38 L 78 26 L 86 38 L 94 26 L 102 38 L 110 26 L 118 38 L 126 26 L 134 38 L 140 26 L 146 38
           Q 138 100, 146 162
           L 140 174 L 134 162 L 126 174 L 118 162 L 110 174 L 102 162 L 94 174 L 86 162 L 78 174 L 70 162 L 62 174 L 54 162 L 46 174 L 40 162
           Q 48 100, 40 38 Z"
        fill="#0F2417"
        stroke="#0F2417"
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* Inside Pouch Body with Vertical Two-Tone Split */}
      <g clipPath="url(#pouchClip)">
        {/* Left Side: Soft Off-White / Cream */}
        <rect x="30" y="20" width="130" height="160" fill="#F4F2E8" />

        {/* Right Side: Rich Forest Green */}
        <path d="M 98 20 L 160 20 L 160 180 L 84 180 Q 94 100, 98 20 Z" fill="#1B6336" />

        {/* Top & Bottom Crimp Shading Folds */}
        <line x1="40" y1="46" x2="146" y2="46" stroke="#0F2417" strokeWidth="2.5" opacity="0.3" />
        <line x1="40" y1="154" x2="146" y2="154" stroke="#0F2417" strokeWidth="2.5" opacity="0.3" />

        {/* Pouch Left: Horizontal Label Text Lines */}
        <rect x="52" y="74" width="22" height="4" rx="2" fill="#0F2417" />
        <rect x="52" y="83" width="22" height="4" rx="2" fill="#0F2417" />
        <rect x="52" y="92" width="22" height="4" rx="2" fill="#0F2417" />
        <rect x="52" y="101" width="18" height="4" rx="2" fill="#0F2417" />

        {/* Veg Symbol on Bottom Left */}
        <g transform="translate(52, 122)">
          <rect width="18" height="18" rx="2" fill="#F4F2E8" stroke="#166534" strokeWidth="2" />
          <circle cx="9" cy="9" r="4.5" fill="#166534" />
        </g>
      </g>

      {/* Magnifying Glass Handle (extending down-right) */}
      <line
        x1="128"
        y1="118"
        x2="164"
        y2="154"
        stroke="#0F2417"
        strokeWidth="13"
        strokeLinecap="round"
      />
      {/* Inner highlight on handle */}
      <line
        x1="130"
        y1="120"
        x2="158"
        y2="148"
        stroke="#274834"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Magnifying Glass Outer Rim */}
      <circle cx="108" cy="98" r="38" fill="#F1F8F4" stroke="#0F2417" strokeWidth="9" />

      {/* Inside Magnifying Glass: Magnified Label Text Lines */}
      <rect x="84" y="86" width="22" height="4.5" rx="2.25" fill="#0F2417" />
      <rect x="84" y="96" width="22" height="4.5" rx="2.25" fill="#0F2417" />
      <rect x="84" y="106" width="18" height="4.5" rx="2.25" fill="#0F2417" />

      {/* Magnified Inspection Checkmark Badge */}
      <circle cx="124" cy="98" r="14" fill="#1B8746" stroke="#0F2417" strokeWidth="2.5" />
      <path
        d="M 118 98 L 122 102 L 130 94"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center select-none ${className}`}>{renderPouchIcon()}</div>;
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center select-none ${className}`}>
        {renderPouchIcon()}
        {showText && (
          <div className="mt-2 text-center">
            <span
              className={`font-black ${textSizes[size]} ${
                lightText ? 'text-white' : 'text-[#1F2937]'
              }`}
            >
              PackScan<span className={lightText ? 'text-[#86EFAC]' : 'text-[#166534]'}>.Ai</span>
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {renderPouchIcon()}
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-black ${textSizes[size]} ${
              lightText ? 'text-white' : 'text-[#1F2937]'
            }`}
          >
            PackScan<span className={lightText ? 'text-[#86EFAC]' : 'text-[#166534]'}>.Ai</span>
          </span>
          {size !== 'sm' && (
            <span className={`text-[9px] font-semibold tracking-wider uppercase mt-0.5 ${lightText ? 'text-slate-300' : 'text-slate-500'}`}>
              Legal Metrology Compliance
            </span>
          )}
        </div>
      )}
    </div>
  );
};
