'use client';

import { useEffect, useState } from 'react';

export function useCanvasFrameDim(id?: string) {
  const [isDimmed, setIsDimmed] = useState(false);

  useEffect(() => {
    if (!id) return;
    const handleDim = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.frameId === id) {
        setIsDimmed(ce.detail?.dimmed === true);
      }
    };
    window.addEventListener('canvas-frame-dim' as any, handleDim as any);
    return () => window.removeEventListener('canvas-frame-dim' as any, handleDim as any);
  }, [id]);

  return { isDimmed, setIsDimmed };
}

