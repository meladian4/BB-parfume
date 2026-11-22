import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'gold' | 'emerald' | 'blue' | 'rose' | 'slate' | 'amber';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'slate',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium tracking-wide',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  const variantStyles = {
    gold: 'bg-[#D4AF37]/15 text-[#E5C365] border border-[#D4AF37]/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    blue: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    slate: 'bg-slate-800 text-slate-300 border border-slate-700',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-full uppercase tracking-wider',
          sizeStyles[size],
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
}
