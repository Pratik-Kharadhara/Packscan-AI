/**
 * PillNav - A premium, GSAP-powered navigation component.
 * Features:
 * - Rising circle background animation on hover
 * - Rotating logo animation
 * - Responsive mobile menu with GSAP transitions
 * - Support for both React Router Link and standard anchor tags / state navigation
 * - Customizable colors and easing
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link, useInRouterContext } from 'react-router-dom';
import { gsap } from 'gsap';
import { Menu, X } from 'lucide-react';

export type PillNavItem = {
  label: string;
  href: string;
  ariaLabel?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
};

export interface PillNavProps {
  /** Logo icon component or source URL (image or SVG) */
  logo: React.ReactNode | string;
  /** Alt text for the logo */
  logoAlt?: string;
  /** Navigation items array */
  items: PillNavItem[];
  /** The current active href for highlighting */
  activeHref?: string;
  /** Optional extra class names for the nav container */
  className?: string;
  /** GSAP easing function */
  ease?: string;
  /** The base background color of the nav pills and logo container */
  baseColor?: string;
  /** The color of the pill when not hovered */
  pillColor?: string;
  /** Text color when the pill is hovered */
  hoveredPillTextColor?: string;
  /** Default text color for the pills */
  pillTextColor?: string;
  /** Callback for mobile menu toggle */
  onMobileMenuClick?: () => void;
  /** Whether to play an entrance animation on mount */
  initialLoadAnimation?: boolean;
  /** Direct page select callback */
  onSelect?: (href: string) => void;
}

// Helper wrapper to handle Link conditionally based on Router context
const SafeLink: React.FC<{
  to: string;
  className?: string;
  style?: React.CSSProperties;
  role?: string;
  'aria-label'?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}> = ({ to, children, ...props }) => {
  let hasRouter = false;
  try {
    hasRouter = useInRouterContext();
  } catch {
    hasRouter = false;
  }

  if (hasRouter) {
    return (
      <Link to={to} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <a href={to} {...props}>
      {children}
    </a>
  );
};

export const PillNav: React.FC<PillNavProps> = ({
  logo,
  logoAlt = 'Logo',
  items,
  activeHref,
  className = '',
  ease = 'power3.out',
  baseColor = '#166534',
  pillColor = '#FFFFFF',
  hoveredPillTextColor = '#FFFFFF',
  pillTextColor = '#1F2937',
  onMobileMenuClick,
  initialLoadAnimation = true,
  onSelect,
}) => {
  const resolvedPillTextColor = pillTextColor;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const circleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const tlRefs = useRef<Array<gsap.core.Timeline | null>>([]);
  const activeTweenRefs = useRef<Array<gsap.core.Tween | null>>([]);
  const logoImgRef = useRef<HTMLDivElement | HTMLImageElement | null>(null);
  const logoTweenRef = useRef<gsap.core.Tween | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const navItemsRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLAnchorElement | HTMLDivElement | null>(null);

  const renderLogo = () => {
    if (typeof logo === 'string') {
      return (
        <img
          src={logo}
          alt={logoAlt}
          ref={logoImgRef as React.RefObject<HTMLImageElement>}
          className="w-5 h-5 object-contain pointer-events-none"
        />
      );
    }
    return (
      <div ref={logoImgRef as React.RefObject<HTMLDivElement>} className="flex items-center justify-center pointer-events-none">
        {logo}
      </div>
    );
  };

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach((circle, index) => {
        if (!circle?.parentElement) return;

        const pill = circle.parentElement as HTMLElement;
        const rect = pill.getBoundingClientRect();
        const { width: w, height: h } = rect;

        // Calculate the radius for the expanding circle to cover the pill
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`,
        });

        const label = pill.querySelector<HTMLElement>('.pill-label');
        const white = pill.querySelector<HTMLElement>('.pill-label-hover');

        if (label) gsap.set(label, { y: 0 });
        if (white) gsap.set(white, { y: h + 12, opacity: 0 });

        tlRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });

        tl.to(
          circle,
          {
            scale: 1.25,
            xPercent: -50,
            duration: 0.6,
            ease,
            overwrite: 'auto',
          },
          0
        );

        if (label) {
          tl.to(
            label,
            {
              y: -(h + 8),
              duration: 0.5,
              ease,
              overwrite: 'auto',
            },
            0
          );
        }

        if (white) {
          gsap.set(white, { y: Math.ceil(h + 16), opacity: 0 });
          tl.to(
            white,
            {
              y: 0,
              opacity: 1,
              duration: 0.5,
              ease,
              overwrite: 'auto',
            },
            0
          );
        }

        tlRefs.current[index] = tl;
      });
    };

    layout();

    const onResize = () => layout();
    window.addEventListener('resize', onResize);

    if (document.fonts) {
      document.fonts.ready.then(layout).catch(() => {});
    }

    // Initial load animation
    if (initialLoadAnimation) {
      const logoEl = logoRef.current;
      const navItemsEl = navItemsRef.current;

      if (logoEl) {
        gsap.set(logoEl, { scale: 0, opacity: 0 });
        gsap.to(logoEl, {
          scale: 1,
          opacity: 1,
          duration: 0.7,
          ease: 'back.out(1.7)',
        });
      }

      if (navItemsEl) {
        const listItems = navItemsEl.querySelectorAll('li');
        gsap.set(listItems, { opacity: 0, y: 15 });
        gsap.to(listItems, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.04,
          ease: 'power2.out',
          delay: 0.15,
        });
      }
    }

    return () => window.removeEventListener('resize', onResize);
  }, [items, ease, initialLoadAnimation]);

  const handleEnter = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), {
      duration: 0.35,
      ease,
      overwrite: 'auto',
    });
  };

  const handleLeave = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, {
      duration: 0.3,
      ease,
      overwrite: 'auto',
    });
  };

  const handleLogoEnter = () => {
    const el = logoImgRef.current;
    if (!el) return;
    logoTweenRef.current?.kill();
    logoTweenRef.current = gsap.to(el, {
      rotate: 360,
      duration: 0.8,
      ease: 'elastic.out(1, 0.5)',
      overwrite: 'auto',
      onComplete: () => gsap.set(el, { rotate: 0 }),
    });
  };

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);

    const menu = mobileMenuRef.current;
    if (menu) {
      if (newState) {
        gsap.set(menu, { display: 'block', opacity: 0, y: 15 });
        gsap.to(menu, {
          opacity: 1,
          y: 0,
          duration: 0.35,
          ease: 'power3.out',
        });
      } else {
        gsap.to(menu, {
          opacity: 0,
          y: 15,
          duration: 0.25,
          ease: 'power3.in',
          onComplete: () => {
            gsap.set(menu, { display: 'none' });
          },
        });
      }
    }
    onMobileMenuClick?.();
  };

  const isExternalLink = (href: string) =>
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#');

  const isRouterLink = (href?: string) => href && !isExternalLink(href);

  const handleClick = (e: React.MouseEvent, item: PillNavItem) => {
    if (item.onClick) {
      e.preventDefault();
      item.onClick();
    } else if (onSelect) {
      e.preventDefault();
      onSelect(item.href);
    }
  };

  const cssVars = {
    '--base': baseColor,
    '--pill-bg': pillColor,
    '--hover-text': hoveredPillTextColor,
    '--pill-text': resolvedPillTextColor,
    '--nav-h': '46px',
    '--logo-size': '38px',
    '--pill-pad-x': '16px',
    '--pill-gap': '5px',
  } as React.CSSProperties;

  return (
    <div
      ref={containerRef}
      className={`relative z-[1000] w-full max-w-4xl mx-auto ${className}`}
      style={cssVars}
      id="pill-nav-dock-container"
    >
      <nav
        className="w-full flex items-center justify-between md:justify-center p-1.5 gap-2"
        aria-label="Quick Navigation Dock"
      >
        {/* Logo Section */}
        <div
          ref={(el) => {
            logoRef.current = el;
          }}
          onMouseEnter={handleLogoEnter}
          className="flex-shrink-0"
        >
          {isRouterLink(items[0]?.href) ? (
            <SafeLink
              to={items[0].href}
              onClick={(e) => items[0] && handleClick(e, items[0])}
              className="flex items-center justify-center rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-sm"
              style={{
                width: 'var(--nav-h)',
                height: 'var(--nav-h)',
                background: 'var(--base)',
                color: 'var(--pill-bg)',
              }}
            >
              {renderLogo()}
            </SafeLink>
          ) : (
            <a
              href={items[0]?.href || '#'}
              onClick={(e) => items[0] && handleClick(e, items[0])}
              className="flex items-center justify-center rounded-full overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-sm"
              style={{
                width: 'var(--nav-h)',
                height: 'var(--nav-h)',
                background: 'var(--base)',
                color: 'var(--pill-bg)',
              }}
            >
              {renderLogo()}
            </a>
          )}
        </div>

        {/* Desktop Menu Pills */}
        <div
          ref={navItemsRef}
          className="hidden md:flex items-center rounded-full px-1.5 shadow-lg border border-[#166534]/20"
          style={{
            height: 'var(--nav-h)',
            background: 'var(--base)',
          }}
        >
          <ul
            role="menubar"
            className="list-none flex items-stretch m-0 p-0 h-full"
            style={{ gap: 'var(--pill-gap)' }}
          >
            {items.map((item, i) => {
              const isActive = activeHref === item.href;

              const pillStyle: React.CSSProperties = {
                background: isActive ? '#F0FDF4' : 'var(--pill-bg)',
                color: isActive ? '#166534' : 'var(--pill-text)',
                paddingLeft: 'var(--pill-pad-x)',
                paddingRight: 'var(--pill-pad-x)',
              };

              const PillContent = (
                <>
                  <span
                    className="hover-circle absolute left-1/2 bottom-0 rounded-full z-[1] block pointer-events-none"
                    style={{
                      background: '#14532D',
                      willChange: 'transform',
                    }}
                    aria-hidden="true"
                    ref={(el) => {
                      circleRefs.current[i] = el;
                    }}
                  />
                  <span className="label-stack relative inline-flex items-center gap-1.5 leading-none z-[2] overflow-hidden py-1">
                    <span
                      className="pill-label relative z-[2] inline-flex items-center gap-1.5 font-bold"
                      style={{ willChange: 'transform' }}
                    >
                      {item.icon && <span className="shrink-0">{item.icon}</span>}
                      <span>{item.label}</span>
                    </span>
                    <span
                      className="pill-label-hover absolute left-0 top-1 z-[3] inline-flex items-center justify-center gap-1.5 w-full text-center font-bold"
                      style={{
                        color: 'var(--hover-text)',
                        willChange: 'transform, opacity',
                      }}
                      aria-hidden="true"
                    >
                      {item.icon && <span className="shrink-0">{item.icon}</span>}
                      <span>{item.label}</span>
                    </span>
                  </span>
                  {isActive && (
                    <span
                      className="absolute left-1/2 bottom-1 -translate-x-1/2 w-1.5 h-1.5 rounded-full z-[4] bg-[#166534]"
                      aria-hidden="true"
                    />
                  )}
                </>
              );

              const basePillClasses =
                'relative overflow-hidden inline-flex items-center justify-center h-[calc(var(--nav-h)-10px)] self-center no-underline rounded-full box-border font-semibold text-xs tracking-normal cursor-pointer transition-colors duration-200 hover:z-10 shadow-xs select-none';

              return (
                <li key={item.href} role="none" className="flex items-center">
                  {isRouterLink(item.href) ? (
                    <SafeLink
                      role="menuitem"
                      to={item.href}
                      className={basePillClasses}
                      style={pillStyle}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                      onClick={(e) => handleClick(e, item)}
                    >
                      {PillContent}
                    </SafeLink>
                  ) : (
                    <a
                      role="menuitem"
                      href={item.href}
                      className={basePillClasses}
                      style={pillStyle}
                      aria-label={item.ariaLabel || item.label}
                      onMouseEnter={() => handleEnter(i)}
                      onMouseLeave={() => handleLeave(i)}
                      onClick={(e) => handleClick(e, item)}
                    >
                      {PillContent}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Mobile Hamburger */}
        <button
          ref={hamburgerRef}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
          className="md:hidden flex items-center justify-center rounded-full transition-transform active:scale-90 shadow-md border border-white/20"
          style={{
            width: 'var(--nav-h)',
            height: 'var(--nav-h)',
            background: 'var(--base)',
            color: 'var(--pill-bg)',
          }}
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown (animates upward from dock) */}
      <div
        ref={mobileMenuRef}
        className="md:hidden absolute bottom-full left-2 right-2 mb-2 rounded-2xl overflow-hidden shadow-2xl z-[999] hidden border border-[#166534]/30"
        style={{
          background: 'var(--base)',
        }}
      >
        <ul className="list-none m-0 p-2 flex flex-col gap-1">
          {items.map((item) => {
            const isActive = activeHref === item.href;
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={`flex items-center justify-between py-2.5 px-4 text-xs font-semibold tracking-wide rounded-xl transition-all ${
                    isActive
                      ? 'bg-white text-[#166534]'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={(e) => {
                    handleClick(e, item);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span className="flex items-center gap-2">
                    {item.icon && <span className="shrink-0">{item.icon}</span>}
                    <span>{item.label}</span>
                  </span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#166534]" />}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default PillNav;
