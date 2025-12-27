'use client';

import { useEffect, useState } from 'react';

/**
 * Returns whether the current document is using the dark theme.
 * Initializes synchronously to avoid flash-of-light-theme before the MutationObserver runs.
 */
export function useIsDarkTheme() {
  const getInitial = () => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  };

  const [isDark, setIsDark] = useState<boolean>(getInitial);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

