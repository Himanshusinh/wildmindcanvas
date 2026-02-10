'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ImageModalState } from '@/modules/canvas-overlays/types';

/**
 * Image Store State Interface
 * Manages all image generation modal states and selections
 */
interface ImageStoreState {
  // Image Modal States
  imageModalStates: ImageModalState[];

  // Selection State
  selectedImageModalId: string | null;
  selectedImageModalIds: string[];

  // Actions
  setImageModalStates: (states: ImageModalState[] | ((prev: ImageModalState[]) => ImageModalState[])) => void;
  addImageModal: (modal: ImageModalState) => void;
  updateImageModal: (id: string, updates: Partial<ImageModalState>) => void;
  removeImageModal: (id: string) => void;

  // Selection Actions
  setSelectedImageModalId: (id: string | null) => void;
  setSelectedImageModalIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  clearImageSelection: () => void;

  // Bulk Operations
  removeImageModals: (ids: string[]) => void;
}

/**
 * Image Store
 * Centralized state management for image generation modals
 * 
 * Benefits:
 * - Selective subscriptions (components only re-render when their selected state changes)
 * - No prop drilling
 * - Centralized state updates
 * - Easy to test and debug
 */
export const useImageStore = create<ImageStoreState>()(
  devtools(
    (set, get) => ({
      // Initial State
      imageModalStates: [],
      selectedImageModalId: null,
      selectedImageModalIds: [],

      // Set image modal states (supports both direct array and updater function)
      setImageModalStates: (states) => {
        set((state) => ({
          imageModalStates: typeof states === 'function' ? states(state.imageModalStates) : states,
        }), false, 'setImageModalStates');
      },

      // Add a new image modal
      addImageModal: (modal) => {
        // Enforce defaults if missing
        const modalWithDefaults = {
          frameWidth: 600,
          frameHeight: 600, // Default 1:1
          aspectRatio: '1:1',
          ...modal,
        };
        set((state) => ({
          imageModalStates: [...state.imageModalStates, modalWithDefaults],
        }), false, 'addImageModal');
      },

      // Update an existing image modal
      updateImageModal: (id, updates) => {
        set((state) => ({
          imageModalStates: state.imageModalStates.map((modal) =>
            modal.id === id ? { ...modal, ...updates } : modal
          ),
        }), false, 'updateImageModal');
      },

      // Remove a single image modal
      removeImageModal: (id) => {
        set((state) => ({
          imageModalStates: state.imageModalStates.filter((modal) => modal.id !== id),
          // Clear selection if the removed modal was selected
          selectedImageModalId: state.selectedImageModalId === id ? null : state.selectedImageModalId,
          selectedImageModalIds: state.selectedImageModalIds.filter((selectedId) => selectedId !== id),
        }), false, 'removeImageModal');
      },

      // Set selected image modal ID
      setSelectedImageModalId: (id) => {
        set({ selectedImageModalId: id }, false, 'setSelectedImageModalId');
      },

      // Set selected image modal IDs (supports both direct array and updater function)
      setSelectedImageModalIds: (ids) => {
        set((state) => ({
          selectedImageModalIds: typeof ids === 'function' ? ids(state.selectedImageModalIds) : ids,
        }), false, 'setSelectedImageModalIds');
      },

      // Clear all image selections
      clearImageSelection: () => {
        set({
          selectedImageModalId: null,
          selectedImageModalIds: [],
        }, false, 'clearImageSelection');
      },

      // Remove multiple image modals
      removeImageModals: (ids) => {
        const idsSet = new Set(ids);
        set((state) => ({
          imageModalStates: state.imageModalStates.filter((modal) => !idsSet.has(modal.id)),
          // Clear selections for removed modals
          selectedImageModalId: idsSet.has(state.selectedImageModalId || '') ? null : state.selectedImageModalId,
          selectedImageModalIds: state.selectedImageModalIds.filter((selectedId) => !idsSet.has(selectedId)),
        }), false, 'removeImageModals');
      },
    }),
    {
      name: 'ImageStore', // Name for Redux DevTools
    }
  )
);

/**
 * Selector Hooks for Optimized Re-renders
 * Components can use these to subscribe only to the state they need
 */

// Get all image modal states
export const useImageModalStates = () => useImageStore((state) => state.imageModalStates);

// Get a specific image modal by ID
export const useImageModal = (id: string) =>
  useImageStore((state) => state.imageModalStates.find((modal) => modal.id === id));

// Get selection state (using separate selectors to prevent infinite loops)
// Note: Using separate hooks is more efficient than returning an object
export const useImageSelection = () => {
  const selectedId = useSelectedImageModalId();
  const selectedIds = useSelectedImageModalIds();
  return { selectedId, selectedIds };
};

// Get only selected IDs (for components that only care about selection)
export const useSelectedImageModalIds = () =>
  useImageStore((state) => state.selectedImageModalIds);

// Get only selected ID (single selection)
export const useSelectedImageModalId = () =>
  useImageStore((state) => state.selectedImageModalId);
