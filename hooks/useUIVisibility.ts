import { useState, useEffect } from 'react';

/**
 * Custom hook for managing UI visibility (TAB key toggle)
 */
export function useUIVisibility() {
  const [isUIHidden, setIsUIHidden] = useState(false);

  // Handle TAB key to toggle UI visibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle TAB when not typing in an input/textarea
      if (e.key === 'Tab' && e.target instanceof HTMLElement) {
        const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;
        if (!isInput) {
          e.preventDefault();
          setIsUIHidden(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return { isUIHidden, setIsUIHidden };
}

