import React, { useRef, useState, useCallback } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'motion/react';

interface TiltedCardProps {
  imageSrc: string;
  altText?: string;
  captionText?: string;
  containerHeight?: string;
  containerWidth?: string;
  imageHeight?: string;
  imageWidth?: string;
  scaleOnHover?: number;
  rotateAmplitude?: number;
  showTooltip?: boolean;
  displayOverlayContent?: boolean;
  overlayContent?: React.ReactNode;
}

export const TiltedCard: React.FC<TiltedCardProps> = ({
  imageSrc,
  altText = 'Package Specimen',
  captionText,
  containerHeight = '440px',
  containerWidth = '100%',
  imageHeight = '380px',
  imageWidth = '280px',
  scaleOnHover = 1.08,
  rotateAmplitude = 16,
  showTooltip = true,
  displayOverlayContent = false,
  overlayContent,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Motion values for normalized cursor coordinates (-1 to 1)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics for rotation
  const springConfig = { damping: 20, stiffness: 160, mass: 0.8 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [-1, 1], [rotateAmplitude, -rotateAmplitude]);
  const rotateY = useTransform(smoothX, [-1, 1], [-rotateAmplitude, rotateAmplitude]);
  const glareX = useTransform(smoothX, [-1, 1], ['0%', '100%']);
  const glareY = useTransform(smoothY, [-1, 1], ['0%', '100%']);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setMousePos({ x, y });

      // Normalize to [-1, 1]
      const normX = (x / rect.width) * 2 - 1;
      const normY = (y / rect.height) * 2 - 1;
      mouseX.set(normX);
      mouseY.set(normY);
    },
    [mouseX, mouseY]
  );

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative flex items-center justify-center select-none"
      style={{
        width: containerWidth,
        height: containerHeight,
        perspective: '1000px',
      }}
    >
      {/* 3D Tilted Card Body */}
      <motion.div
        style={{
          width: imageWidth,
          height: imageHeight,
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          scale: isHovered ? scaleOnHover : 1,
        }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="relative rounded-2xl shadow-xl overflow-hidden bg-white border border-[#D1D5DB] cursor-grab active:cursor-grabbing"
      >
        {/* Package Image */}
        <img
          src={imageSrc}
          alt={altText}
          className="w-full h-full object-cover object-center pointer-events-none transition-transform duration-300"
        />

        {/* Dynamic Light Glare Overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 0.25 : 0,
            background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 60%)`,
          }}
        />

        {/* Overlay Content (Floating 30px out in 3D space) */}
        {displayOverlayContent && overlayContent && (
          <div
            className="absolute bottom-4 left-4 right-4 z-20"
            style={{
              transform: 'translateZ(30px)',
              transformStyle: 'preserve-3d',
            }}
          >
            {overlayContent}
          </div>
        )}
      </motion.div>

      {/* Cursor Following Tooltip */}
      {showTooltip && captionText && isHovered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className="absolute pointer-events-none z-30 px-3 py-1.5 rounded-lg bg-[#1F2937]/90 text-white text-[11px] font-mono shadow-md backdrop-blur-xs whitespace-nowrap"
          style={{
            left: `${mousePos.x + 16}px`,
            top: `${mousePos.y + 16}px`,
          }}
        >
          {captionText}
        </motion.div>
      )}
    </div>
  );
};
