'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { VideoModalState } from '@/modules/canvas-overlays/types';

/**
 * Video Store State Interface
 * Manages all video generation modal states and selections
 */
interface VideoStoreState {
  // Video Modal States
  videoModalStates: VideoModalState[];

  // Selection State
  selectedVideoModalId: string | null;
  selectedVideoModalIds: string[];

  // Actions
  setVideoModalStates: (states: VideoModalState[] | ((prev: VideoModalState[]) => VideoModalState[])) => void;
  addVideoModal: (modal: VideoModalState) => void;
  updateVideoModal: (id: string, updates: Partial<VideoModalState>) => void;
  removeVideoModal: (id: string) => void;

  // Selection Actions
  setSelectedVideoModalId: (id: string | null) => void;
  setSelectedVideoModalIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  clearVideoSelection: () => void;

  // Bulk Operations
  removeVideoModals: (ids: string[]) => void;
}

/**
 * Video Store
 * Centralized state management for video generation modals
 * 
 * Benefits:
 * - Selective subscriptions (components only re-render when their selected state changes)
 * - No prop drilling
 * - Centralized state updates
 * - Easy to test and debug
 */
export const useVideoStore = create<VideoStoreState>()(
  devtools(
    (set, get) => ({
      // Initial State
      videoModalStates: [],
      selectedVideoModalId: null,
      selectedVideoModalIds: [],

      // Set video modal states (supports both direct array and updater function)
      setVideoModalStates: (states) => {
        set((state) => ({
          videoModalStates: typeof states === 'function' ? states(state.videoModalStates) : states,
        }), false, 'setVideoModalStates');
      },

      // Add a new video modal
      addVideoModal: (modal) => {
        // Enforce defaults if missing
        const modalWithDefaults = {
          frameWidth: 600,
          frameHeight: 338, // Default 16:9
          aspectRatio: '16:9',
          ...modal,
        };
        set((state) => ({
          videoModalStates: [...state.videoModalStates, modalWithDefaults],
        }), false, 'addVideoModal');
      },

      // Update an existing video modal
      updateVideoModal: (id, updates) => {
        set((state) => ({
          videoModalStates: state.videoModalStates.map((modal) =>
            modal.id === id ? { ...modal, ...updates } : modal
          ),
        }), false, 'updateVideoModal');
      },

      // Remove a single video modal
      removeVideoModal: (id) => {
        set((state) => ({
          videoModalStates: state.videoModalStates.filter((modal) => modal.id !== id),
          // Clear selection if the removed modal was selected
          selectedVideoModalId: state.selectedVideoModalId === id ? null : state.selectedVideoModalId,
          selectedVideoModalIds: state.selectedVideoModalIds.filter((selectedId) => selectedId !== id),
        }), false, 'removeVideoModal');
      },

      // Set selected video modal ID
      setSelectedVideoModalId: (id) => {
        set({ selectedVideoModalId: id }, false, 'setSelectedVideoModalId');
      },

      // Set selected video modal IDs (supports both direct array and updater function)
      setSelectedVideoModalIds: (ids) => {
        set((state) => ({
          selectedVideoModalIds: typeof ids === 'function' ? ids(state.selectedVideoModalIds) : ids,
        }), false, 'setSelectedVideoModalIds');
      },

      // Clear all video selections
      clearVideoSelection: () => {
        set({
          selectedVideoModalId: null,
          selectedVideoModalIds: [],
        }, false, 'clearVideoSelection');
      },

      // Remove multiple video modals
      removeVideoModals: (ids) => {
        const idsSet = new Set(ids);
        set((state) => ({
          videoModalStates: state.videoModalStates.filter((modal) => !idsSet.has(modal.id)),
          // Clear selections for removed modals
          selectedVideoModalId: idsSet.has(state.selectedVideoModalId || '') ? null : state.selectedVideoModalId,
          selectedVideoModalIds: state.selectedVideoModalIds.filter((selectedId) => !idsSet.has(selectedId)),
        }), false, 'removeVideoModals');
      },
    }),
    {
      name: 'VideoStore', // Name for Redux DevTools
    }
  )
);

/**
 * Selector Hooks for Optimized Re-renders
 * Components can use these to subscribe only to the state they need
 */

// Get all video modal states
export const useVideoModalStates = () => useVideoStore((state) => state.videoModalStates);

// Get a specific video modal by ID
export const useVideoModal = (id: string) =>
  useVideoStore((state) => state.videoModalStates.find((modal) => modal.id === id));

// Get selection state (using separate selectors to prevent infinite loops)
export const useVideoSelection = () => {
  const selectedId = useSelectedVideoModalId();
  const selectedIds = useSelectedVideoModalIds();
  return { selectedId, selectedIds };
};

// Get only selected IDs (for components that only care about selection)
export const useSelectedVideoModalIds = () =>
  useVideoStore((state) => state.selectedVideoModalIds);

// Get only selected ID (single selection)
export const useSelectedVideoModalId = () =>
  useVideoStore((state) => state.selectedVideoModalId);
