import React, { useRef, useState } from 'react';

/**
 * BorderGlow Component (React Bits)
 * Glows only the slim border around the card on hover with cursor tracking.
 * The card interior remains completely solid and unaffected.
 */
export default function BorderGlow({
  children,
  className = '',
  glowColor = '#0284C7',
  secondaryGlow = '#38BDF8',
  glowSize = 200,
  borderRadius = '24px',
  borderWidth = 1.5,
}) {
  const containerRef = useRef(null);
  const [cursorPos, setCursorPos] = useState({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setCursorPos({ x: -1000, y: -1000 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative transition-all duration-300 w-full max-w-full box-border ${className}`}
      style={{
        borderRadius: borderRadius,
        padding: `${borderWidth}px`,
        boxSizing: 'border-box',
        boxShadow: isHovered
          ? '0 20px 50px rgba(0, 0, 0, 0.10), 0 0 12px rgba(2, 132, 199, 0.18)'
          : '0 20px 45px rgba(0, 0, 0, 0.07), 0 2px 10px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Dynamic Cursor Border Glow Track (Slim border perimeter) */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-0 overflow-hidden"
        style={{
          borderRadius: borderRadius,
          opacity: isHovered ? 1 : 0.35,
          background: isHovered
            ? `radial-gradient(${glowSize}px circle at ${cursorPos.x}px ${cursorPos.y}px, ${glowColor} 0%, ${secondaryGlow} 50%, #E0F2FE 85%, #E2E8F0 100%)`
            : 'linear-gradient(135deg, #E2E8F0 0%, #F1F5F9 50%, #E2E8F0 100%)',
        }}
      />

      {/* Solid Pure White Card Layer (Completely opaque, never changes) */}
      <div
        className="relative z-10 w-full h-full bg-white transition-all overflow-hidden box-border"
        style={{
          borderRadius: `calc(${borderRadius} - ${borderWidth}px)`,
          backgroundColor: '#FFFFFF',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
    </div>
  );
}
