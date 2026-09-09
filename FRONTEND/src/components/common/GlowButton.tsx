import React, { useRef } from 'react';
import { ArrowRight } from 'lucide-react';

export interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  showArrow?: boolean;
  variant?: 'primary' | 'secondary' | 'dark' | 'outline';
  glowColor?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * GlowButton - Interactive call-to-action button featuring a right-arrow SVG icon
 * and custom glow effect driven by CSS variables (--x, --y) for cursor position.
 * Ideal for hero sections or onboarding prompts.
 */
export const GlowButton: React.FC<GlowButtonProps> = ({
  children,
  icon,
  showArrow = true,
  variant = 'primary',
  glowColor = 'rgba(34, 197, 94, 0.45)', // Emerald/forest glow by default
  size = 'md',
  className = '',
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
  onClick,
  ...rest
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      buttonRef.current.style.setProperty('--mouse-x', `${x}px`);
      buttonRef.current.style.setProperty('--mouse-y', `${y}px`);
    }
    if (onMouseMove) onMouseMove(e);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      buttonRef.current.style.setProperty('--glow-opacity', '1');
    }
    if (onMouseEnter) onMouseEnter(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      buttonRef.current.style.setProperty('--glow-opacity', '0');
    }
    if (onMouseLeave) onMouseLeave(e);
  };

  // Base sizing
  const sizeClasses = {
    sm: 'px-4 py-2 text-xs rounded-xl gap-2',
    md: 'px-6 py-3 text-sm rounded-2xl gap-2.5',
    lg: 'px-8 py-4 text-base rounded-2xl gap-3 font-bold',
  }[size];

  // Variant themes
  const variantClasses = {
    primary:
      'bg-[#166534] text-white hover:bg-[#14532D] border border-[#22C55E]/30 shadow-[0_4px_16px_rgba(22,101,52,0.18)]',
    secondary:
      'bg-[#FFFFFF] text-[#1F2937] hover:bg-[#F9FAFB] border border-[#D1D5DB] shadow-xs',
    dark:
      'bg-[#1F2937] text-white hover:bg-[#111827] border border-stone-600 shadow-md',
    outline:
      'bg-transparent text-[#166534] hover:bg-[#F0FDF4] border-2 border-[#166534]',
  }[variant];

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`group relative isolate overflow-hidden inline-flex items-center justify-center font-bold transition-all duration-200 active:scale-[0.98] select-none ${sizeClasses} ${variantClasses} ${className}`}
      style={
        {
          '--mouse-x': '50%',
          '--mouse-y': '50%',
          '--glow-opacity': '0',
          '--glow-color': glowColor,
        } as React.CSSProperties
      }
      {...rest}
    >
      {/* Dynamic Cursor Glow Layer */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-300 ease-out z-0"
        style={{
          opacity: 'var(--glow-opacity)',
          background: `radial-gradient(130px circle at var(--mouse-x) var(--mouse-y), var(--glow-color), transparent 70%)`,
        }}
      />

      {/* Subtle border shine follower */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 ease-out z-0"
        style={{
          opacity: 'var(--glow-opacity)',
          background: `radial-gradient(90px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.25), transparent 80%)`,
        }}
      />

      {/* Content wrapper with relative z-index so text and icons stay sharp */}
      <span className="relative z-10 flex items-center gap-2">
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
      </span>

      {/* Right Arrow SVG Icon with smooth forward nudge on hover */}
      {showArrow && (
        <span className="relative z-10 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1">
          <ArrowRight className="w-4 h-4" />
        </span>
      )}
    </button>
  );
};

export default GlowButton;
