import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
  glow?: boolean;
}

export function Card({
  className,
  bordered = true,
  glow = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-[#0F172A] rounded-xl text-slate-100 shadow-sm transition-all',
          bordered && 'border border-[#1E293B]',
          glow && 'hover:border-[#D4AF37]/40 hover:shadow-lg hover:shadow-[#D4AF37]/5',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={twMerge(clsx('p-5 border-b border-[#1E293B]', className))} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={twMerge(clsx('text-base font-semibold text-white tracking-tight', className))} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={twMerge(clsx('text-xs text-slate-400 mt-1', className))} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={twMerge(clsx('p-5', className))} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={twMerge(clsx('p-5 pt-0 border-t border-[#1E293B] mt-5', className))} {...props}>
      {children}
    </div>
  );
}
