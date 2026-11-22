'use client';

import React from 'react';
import Image from 'next/image';

interface BBLogoProps {
  variant?: 'gold' | 'white' | 'black';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showText?: boolean;
  subtitle?: string;
  withContainer?: boolean;
}

const sizeMap = {
  xs: { img: 18, container: 'w-6 h-6 rounded-md', text: 'text-xs', sub: 'text-[9px]' },
  sm: { img: 24, container: 'w-8 h-8 rounded-lg', text: 'text-sm', sub: 'text-[10px]' },
  md: { img: 34, container: 'w-11 h-11 rounded-xl', text: 'text-base', sub: 'text-xs' },
  lg: { img: 48, container: 'w-14 h-14 rounded-2xl', text: 'text-xl', sub: 'text-xs' },
  xl: { img: 64, container: 'w-20 h-20 rounded-2xl', text: 'text-2xl', sub: 'text-sm' },
  '2xl': { img: 84, container: 'w-24 h-24 rounded-3xl', text: 'text-3xl', sub: 'text-sm' },
};

export function BBLogo({
  variant = 'gold',
  size = 'md',
  className = '',
  showText = false,
  subtitle,
  withContainer = false,
}: BBLogoProps) {
  const config = sizeMap[size] || sizeMap.md;

  const src =
    variant === 'black'
      ? '/logo-black.png'
      : variant === 'white'
      ? '/logo-white.png'
      : '/logo-gold.png';

  const logoImg = (
    <div
      className={`relative flex items-center justify-center shrink-0 ${
        withContainer
          ? `${config.container} bg-gradient-to-b from-[#1E293B] to-[#0A0F1D] border border-[#D4AF37]/30 shadow-md shadow-[#D4AF37]/10 p-1`
          : ''
      }`}
    >
      <Image
        src={src}
        alt="BB Parfum Logo"
        width={config.img}
        height={config.img}
        className="object-contain drop-shadow-sm select-none"
        priority
      />
    </div>
  );

  if (!showText) {
    return <div className={`inline-flex items-center ${className}`}>{logoImg}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {logoImg}
      <div className="flex flex-col text-left">
        <div className={`font-extrabold tracking-wider text-white ${config.text} leading-none flex items-center gap-1.5`}>
          <span>BB PARFUM</span>
          <span className="text-[#D4AF37] font-light">PREMIUM</span>
        </div>
        {subtitle && (
          <span className={`text-slate-400 font-medium ${config.sub} tracking-normal mt-0.5`}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
