import React, { useRef, useState, CSSProperties } from 'react';

export interface GlowCtaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  iconLeft?: React.ReactNode;
  showArrow?: boolean;
  variant?: 'primary' | 'dark' | 'emerald' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glowColor?: string;
  className?: string;
}

/**
 * Interactive Call-To-Action button featuring a custom right-arrow SVG icon
 * and a cursor-tracking glow effect driven in real-time by CSS variables
 * (--mouse-x and --mouse-y).
 * Ideal for hero sections, primary action banners, and onboarding prompts.
 */
export const GlowCtaButton: React.FC<GlowCtaButtonProps> = ({
  children = 'Start Inspection',
  iconLeft,
  showArrow = true,
  variant = 'primary',
  size = 'md',
  glowColor,
  className = '',
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
  disabled,
  ...rest
}) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Handle pointer coordinates and set CSS variables on the button element
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || disabled) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    buttonRef.current.style.setProperty('--mouse-x', `${x}px`);
    buttonRef.current.style.setProperty('--mouse-y', `${y}px`);

    if (onMouseMove) {
      onMouseMove(e);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      setIsHovered(true);
      if (buttonRef.current) {
        buttonRef.current.style.setProperty('--glow-opacity', '1');
      }
    }
    if (onMouseEnter) {
      onMouseEnter(e);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false);
    if (buttonRef.current) {
      buttonRef.current.style.setProperty('--glow-opacity', '0');
    }
    if (onMouseLeave) {
      onMouseLeave(e);
    }
  };

  // Size configurations
  const sizeClasses = {
    sm: 'text-xs px-4 py-2 gap-2 rounded-full',
    md: 'text-sm px-6 py-3 gap-2.5 rounded-full',
    lg: 'text-base px-7 py-3.5 gap-3 rounded-full',
  }[size];

  // Base theme classes
  const variantClasses = {
    primary:
      'bg-[#166534] hover:bg-[#14532D] text-white font-semibold shadow-md shadow-[#166534]/25 border border-[#22C55E]/30',
    dark:
      'bg-[#1F2937]/90 hover:bg-[#111827] text-white font-medium backdrop-blur-md border border-slate-700 shadow-md',
    emerald:
      'bg-[#65A30D] hover:bg-[#4D7C0F] text-white font-semibold shadow-md shadow-[#65A30D]/25 border border-[#84CC16]/30',
    ghost:
      'bg-white/10 hover:bg-white/20 text-white font-medium backdrop-blur-md border border-white/20',
  }[variant];

  // Dynamic glow color depending on variant
  const effectiveGlowColor =
    glowColor ||
    (variant === 'primary'
      ? 'rgba(134, 239, 172, 0.45)'
      : variant === 'dark'
      ? 'rgba(209, 213, 219, 0.25)'
      : 'rgba(163, 230, 53, 0.45)');

  const outerHaloColor =
    glowColor ||
    (variant === 'primary'
      ? 'rgba(34, 197, 94, 0.4)'
      : variant === 'dark'
      ? 'rgba(156, 163, 175, 0.2)'
      : 'rgba(101, 163, 13, 0.4)');

  return (
    <button
      ref={buttonRef}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative group inline-flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] select-none ${sizeClasses} ${variantClasses} ${
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
      } ${className}`}
      style={
        {
          '--mouse-x': '50%',
          '--mouse-y': '50%',
          '--glow-opacity': '0',
        } as CSSProperties
      }
      {...rest}
    >
      {/* 
        1. Exterior Atmospheric Ambient Glow Halo
        Diffuses outward around the cursor position
      */}
      <div
        aria-hidden="true"
        className="absolute -inset-1 rounded-[inherit] pointer-events-none transition-opacity duration-300 -z-10"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(130px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${outerHaloColor}, transparent 70%)`,
          filter: 'blur(8px)',
        }}
      />

      {/* 
        2. Surface Spotlight Reflection
        Real-time radial highlight following the cursor position exactly
      */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-200"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(110px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${effectiveGlowColor}, transparent 65%)`,
        }}
      />

      {/* 
        3. Subtle Shimmer Border Trace
      */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-[inherit] pointer-events-none border border-white/40 transition-opacity duration-200"
        style={{
          opacity: isHovered ? 1 : 0,
          maskImage: `radial-gradient(90px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black 40%, transparent 80%)`,
          WebkitMaskImage: `radial-gradient(90px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black 40%, transparent 80%)`,
        }}
      />

      {/* Button Content */}
      <span className="relative z-10 flex items-center gap-2">
        {iconLeft && <span className="shrink-0 transition-transform duration-200 group-hover:scale-105">{iconLeft}</span>}
        <span className="tracking-tight whitespace-nowrap">{children}</span>
      </span>

      {/* 
        4. Interactive Right-Arrow SVG Icon
        Animates forward on hover with smooth spring translation
      */}
      {showArrow && (
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 w-4 h-4 transition-transform duration-200 ease-out group-hover:translate-x-1 shrink-0"
        >
          {/* Arrow stem */}
          <path
            d="M3.33334 8H12.6667"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Arrow chevron */}
          <path
            d="M8.66667 4L12.6667 8L8.66667 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
};
