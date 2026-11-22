'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationContextType {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
  closeMobile: () => void;
  isDesktopCollapsed: boolean;
  setIsDesktopCollapsed: (collapsed: boolean) => void;
  toggleDesktop: () => void;
}

const NavigationContext = createContext<NavigationContextType>({
  isMobileOpen: false,
  setIsMobileOpen: () => {},
  toggleMobile: () => {},
  closeMobile: () => {},
  isDesktopCollapsed: false,
  setIsDesktopCollapsed: () => {},
  toggleDesktop: () => {},
});

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const pathname = usePathname();

  // Otomatis tutup drawer di mobile saat user berpindah halaman
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Kunci scroll body saat mobile drawer terbuka
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isMobileOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [isMobileOpen]);

  return (
    <NavigationContext.Provider
      value={{
        isMobileOpen,
        setIsMobileOpen,
        toggleMobile: () => setIsMobileOpen((prev) => !prev),
        closeMobile: () => setIsMobileOpen(false),
        isDesktopCollapsed,
        setIsDesktopCollapsed,
        toggleDesktop: () => setIsDesktopCollapsed((prev) => !prev),
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    return {
      isMobileOpen: false,
      setIsMobileOpen: () => {},
      toggleMobile: () => {},
      closeMobile: () => {},
      isDesktopCollapsed: false,
      setIsDesktopCollapsed: () => {},
      toggleDesktop: () => {},
    };
  }
  return ctx;
}
