/**
 * MagnificationDock Component
 * 
 * A premium macOS-inspired dock component enhanced with PillNav GSAP animations:
 * - Rising circle background animation on hover (calculated geometry & fluid flood effect)
 * - Vertical translation stack for default & hovered icons (turns crisp white)
 * - Rotating logo animation on hover (elastic 360° spin)
 * - Spring physics magnification on cursor proximity
 * - Floating tooltips with spring reveal
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence,
} from 'motion/react';
import { gsap } from 'gsap';

export type DockItemData = {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick: () => void;
  className?: string;
  active?: boolean;
};

export type DockProps = {
  items: DockItemData[];
  logo?: React.ReactNode;
  logoAlt?: string;
  onLogoClick?: () => void;
  className?: string;
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  dockHeight?: number;
  magnification?: number;
  spring?: SpringOptions;
  baseColor?: string;
  pillColor?: string;
  hoveredColor?: string;
  ease?: string;
  initialLoadAnimation?: boolean;
};

type DockItemProps = {
  key?: React.Key;
  item: DockItemData;
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  baseItemSize: number;
  magnification: number;
  baseColor?: string;
  hoveredColor?: string;
  ease?: string;
};

function DockItem({
  item,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
  baseColor = '#166534',
  hoveredColor = '#FFFFFF',
  ease = 'power3.out',
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLSpanElement>(null);
  const defaultContentRef = useRef<HTMLDivElement>(null);
  const hoverContentRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const activeTweenRef = useRef<gsap.core.Tween | null>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize,
    };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );
  const size = useSpring(targetSize, spring);

  useEffect(() => {
    const layout = () => {
      const circle = circleRef.current;
      const pill = ref.current;
      if (!circle || !pill) return;

      const w = baseItemSize;
      const h = baseItemSize;

      // Calculate the radius for the expanding circle to cover the pill (PillNav geometry)
      const R = ((w * w) / 4 + h * h) / (2 * h);
      const D = Math.ceil(2 * R) + 4;
      const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 2;
      const originY = D - delta;

      circle.style.width = `${D}px`;
      circle.style.height = `${D}px`;
      circle.style.bottom = `-${delta}px`;

      gsap.set(circle, {
        xPercent: -50,
        scale: 0,
        transformOrigin: `50% ${originY}px`,
      });

      const defaultEl = defaultContentRef.current;
      const hoverEl = hoverContentRef.current;

      if (defaultEl) gsap.set(defaultEl, { y: 0, opacity: 1 });
      if (hoverEl) gsap.set(hoverEl, { y: h + 10, opacity: 0 });

      tlRef.current?.kill();
      const tl = gsap.timeline({ paused: true });

      // Circle rises up from the bottom to flood the pill
      tl.to(
        circle,
        {
          scale: 1.35,
          xPercent: -50,
          duration: 0.65,
          ease,
          overwrite: 'auto',
        },
        0
      );

      // Default icon translates upwards and fades
      if (defaultEl) {
        tl.to(
          defaultEl,
          {
            y: -(h + 8),
            opacity: 0,
            duration: 0.5,
            ease,
            overwrite: 'auto',
          },
          0
        );
      }

      // Hover icon translates in from below in crisp white
      if (hoverEl) {
        tl.to(
          hoverEl,
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

      tlRef.current = tl;
    };

    layout();

    const onResize = () => layout();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      tlRef.current?.kill();
      activeTweenRef.current?.kill();
    };
  }, [baseItemSize, ease]);

  const handleMouseEnter = () => {
    isHovered.set(1);
    const tl = tlRef.current;
    if (!tl) return;
    activeTweenRef.current?.kill();
    activeTweenRef.current = tl.tweenTo(tl.duration(), {
      duration: 0.35,
      ease,
      overwrite: 'auto',
    });
  };

  const handleMouseLeave = () => {
    isHovered.set(0);
    const tl = tlRef.current;
    if (!tl) return;
    activeTweenRef.current?.kill();
    activeTweenRef.current = tl.tweenTo(0, {
      duration: 0.28,
      ease,
      overwrite: 'auto',
    });
  };

  return (
    <motion.div
      ref={ref}
      style={{
        width: size,
        height: size,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      onClick={item.onClick}
      className={`dock-pill-item relative inline-flex items-center justify-center rounded-full bg-white border border-[#D1D5DB] shadow-md hover:border-[#166534] hover:shadow-lg cursor-pointer select-none overflow-hidden ${item.className || ''}`}
      tabIndex={0}
      role="button"
      aria-label={typeof item.label === 'string' ? item.label : 'Navigation item'}
      aria-haspopup="true"
    >
      {/* PillNav Rising Circle Background */}
      <span
        ref={circleRef}
        className="hover-circle absolute left-1/2 bottom-0 rounded-full z-[1] block pointer-events-none"
        style={{
          background: baseColor,
          willChange: 'transform',
        }}
        aria-hidden="true"
      />

      {/* Normal State: Default icon */}
      <div
        ref={defaultContentRef}
        className="pill-dock-default relative z-[2] flex items-center justify-center text-[#1F2937] transition-colors pointer-events-none select-none"
        style={{ willChange: 'transform, opacity' }}
      >
        {item.icon}
      </div>

      {/* Hover State: White icon rising into view */}
      <div
        ref={hoverContentRef}
        className="pill-dock-hover absolute inset-0 z-[3] flex items-center justify-center text-white pointer-events-none select-none [&_svg]:stroke-white [&_svg]:text-white"
        style={{
          color: hoveredColor,
          willChange: 'transform, opacity',
        }}
        aria-hidden="true"
      >
        {item.icon}
      </div>

      {/* Active Dot Indicator */}
      {item.active && (
        <span
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#166534] z-[4]"
          aria-hidden="true"
        />
      )}

      {/* Floating Tooltip Label */}
      <DockLabel isHovered={isHovered}>{item.label}</DockLabel>
    </motion.div>
  );
}

type DockLabelProps = {
  className?: string;
  children: React.ReactNode;
  isHovered?: MotionValue<number>;
};

function DockLabel({ children, className = '', isHovered }: DockLabelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    const unsubscribe = isHovered.on('change', (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.18 }}
          className={`${className} absolute -top-9 left-1/2 w-fit whitespace-nowrap rounded-lg border border-[#D1D5DB] bg-[#1F2937] px-2.5 py-1 text-xs font-semibold text-white shadow-xl pointer-events-none z-30`}
          role="tooltip"
          style={{ x: '-50%' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function MagnificationDock({
  items,
  logo,
  logoAlt = 'Dock Logo',
  onLogoClick,
  className = '',
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 68,
  distance = 180,
  panelHeight = 60,
  dockHeight = 240,
  baseItemSize = 46,
  baseColor = '#166534',
  hoveredColor = '#FFFFFF',
  ease = 'power3.out',
  initialLoadAnimation = true,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);
  const itemsContainerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const logoTweenRef = useRef<gsap.core.Tween | null>(null);

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + magnification / 2 + 4),
    [dockHeight, magnification]
  );
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  // PillNav Rotating Logo interaction on mouse enter
  const handleLogoEnter = () => {
    const el = logoRef.current;
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

  // Initial load animation for dock items
  useEffect(() => {
    if (!initialLoadAnimation) return;

    if (itemsContainerRef.current) {
      const dockPills = itemsContainerRef.current.querySelectorAll('.dock-pill-item');
      if (dockPills.length > 0) {
        gsap.set(dockPills, { opacity: 0, y: 15, scale: 0.88 });
        gsap.to(dockPills, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.05,
          ease: 'power2.out',
          delay: 0.1,
        });
      }
    }

    if (logoRef.current) {
      gsap.set(logoRef.current, { scale: 0, opacity: 0 });
      gsap.to(logoRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.7,
        ease: 'back.out(1.7)',
      });
    }
  }, [initialLoadAnimation]);

  return (
    <motion.div
      style={{ height, scrollbarWidth: 'none' }}
      className="flex max-w-full items-center justify-center"
    >
      <motion.div
        ref={itemsContainerRef}
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={`${className} flex items-end w-fit gap-2 sm:gap-3 rounded-full border border-[#D1D5DB] bg-white/90 backdrop-blur-md pb-2 px-3 sm:px-4 shadow-[0_12px_32px_rgba(0,0,0,0.08)]`}
        style={{ height: panelHeight }}
        role="toolbar"
        aria-label="Quick Navigation Dock"
      >
        {/* Optional PillNav Rotating Logo on the left of the dock */}
        {logo && (
          <div
            ref={logoRef}
            onMouseEnter={handleLogoEnter}
            onClick={onLogoClick}
            className="flex items-center justify-center self-center shrink-0 w-9 h-9 rounded-full bg-[#166534] text-white shadow-sm cursor-pointer transition-transform hover:scale-105 active:scale-95 mr-1"
            title={logoAlt}
            role="button"
            tabIndex={0}
          >
            {logo}
          </div>
        )}

        {/* PillNav GSAP Animated Dock Items */}
        {items.map((item, index) => (
          <DockItem
            key={index}
            item={item}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
            baseColor={baseColor}
            hoveredColor={hoveredColor}
            ease={ease}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

export default MagnificationDock;
