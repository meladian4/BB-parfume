'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#090D16] active:scale-[0.98] select-none';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 h-8 gap-1.5',
    md: 'text-sm px-4 py-2 h-10 gap-2',
    lg: 'text-base px-6 py-3 h-12 gap-2.5 font-semibold',
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-[#D4AF37] to-[#E5C365] text-[#090D16] font-semibold hover:brightness-105 shadow-sm shadow-[#D4AF37]/20 focus:ring-[#D4AF37]',
    gold:
      'bg-gradient-to-r from-[#D4AF37] to-[#E5C365] text-[#090D16] font-semibold hover:brightness-105 shadow-sm shadow-[#D4AF37]/20 focus:ring-[#D4AF37]',
    secondary:
      'bg-[#162036] text-[#F8FAFC] border border-[#1E293B] hover:bg-[#1E293B] hover:border-slate-700 focus:ring-slate-500',
    outline:
      'bg-transparent border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 focus:ring-[#D4AF37]',
    danger:
      'bg-rose-600/90 hover:bg-rose-600 text-white shadow-sm shadow-rose-900/30 focus:ring-rose-500',
    ghost:
      'bg-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 focus:ring-slate-500',
  };

  return (
    <button
      className={twMerge(
        clsx(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          (disabled || isLoading) && 'opacity-50 cursor-not-allowed pointer-events-none active:scale-100',
          className
        )
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Memuat...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
