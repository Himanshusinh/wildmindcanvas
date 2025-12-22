'use client';

import { useCallback, useEffect, useState } from 'react';

type UpdateModalStateFn = (modalId: string, updates: { isExpanded?: boolean }) => void;

export function usePersistedPopupState(args: {
  isExpanded?: boolean;
  id?: string;
  onUpdateModalState?: UpdateModalStateFn;
  defaultOpen?: boolean;
}) {
  const { isExpanded, id, onUpdateModalState, defaultOpen = false } = args;
  const [isPopupOpen, setIsPopupOpen] = useState(Boolean(isExpanded ?? defaultOpen));

  // Sync prop changes to local state
  useEffect(() => {
    if (isExpanded !== undefined) setIsPopupOpen(isExpanded);
  }, [isExpanded]);

  const setAndPersist = useCallback(
    (next: boolean) => {
      setIsPopupOpen(next);
      if (id && onUpdateModalState) {
        try {
          onUpdateModalState(id, { isExpanded: next });
        } catch {}
      }
    },
    [id, onUpdateModalState],
  );

  const togglePopup = useCallback(() => {
    setAndPersist(!isPopupOpen);
  }, [isPopupOpen, setAndPersist]);

  return { isPopupOpen, setIsPopupOpen: setAndPersist, togglePopup };
}

