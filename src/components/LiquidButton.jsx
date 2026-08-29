import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * LiquidButton Component (animate-ui style)
 * Fluid liquid fill hover animation with spring physics and glowing state
 */
export default function LiquidButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  variant = 'primary', // 'primary' (blue) | 'secondary' | 'whatsapp' | 'ghost'
  icon = null,
  size = 'md', // 'sm' | 'md' | 'lg'
}) {
  const [isHovered, setIsHovered] = useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'whatsapp':
        return {
          base: 'bg-[#10B981] text-white border-transparent shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_28px_rgba(16,185,129,0.45)]',
          liquid: 'bg-gradient-to-t from-[#059669] to-[#34D399]',
        };
      case 'secondary':
        return {
          base: 'bg-sky-50 text-[#0284C7] border border-sky-200 hover:border-sky-300 shadow-xs hover:shadow-md',
          liquid: 'bg-gradient-to-t from-sky-100 to-sky-50',
        };
      case 'ghost':
        return {
          base: 'bg-transparent text-slate-600 hover:text-slate-900 border-none shadow-none',
          liquid: 'bg-slate-100',
        };
      case 'primary':
      default:
        return {
          base: 'bg-[#0284C7] text-white border-transparent shadow-[0_10px_25px_rgba(2,132,199,0.32)] hover:shadow-[0_14px_32px_rgba(2,132,199,0.45)]',
          liquid: 'bg-gradient-to-t from-[#0369A1] via-[#0284C7] to-[#38BDF8]',
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: disabled ? 1 : 1.015 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      className={`relative overflow-hidden group select-none font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors duration-200 ${vStyles.base} ${disabled ? 'opacity-55 cursor-not-allowed' : ''} ${className}`}
    >
      {/* Liquid Rising Wave Layer */}
      <motion.div
        aria-hidden="true"
        className={`absolute inset-0 z-0 pointer-events-none rounded-xl ${vStyles.liquid}`}
        initial={{ y: '100%' }}
        animate={{ y: isHovered && !disabled ? '0%' : '100%' }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Fluid Bubble Animation Overlays */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none opacity-25"
        animate={isHovered ? {
          backgroundPosition: ['0% 0%', '100% 100%'],
          opacity: [0.2, 0.4, 0.2],
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 60%)',
          backgroundSize: '120% 120%',
        }}
      />

      {/* Top Glass Shimmer */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/35 z-10 pointer-events-none" />

      {/* Button Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            {children}
            {icon && <span className="transition-transform duration-200 group-hover:translate-x-1">{icon}</span>}
          </>
        )}
      </span>
    </motion.button>
  );
}
