'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { MusicModalState } from '@/modules/canvas-overlays/types';

/**
 * Music Store State Interface
 * Manages all music generation modal states and selections
 */
interface MusicStoreState {
    // Music Modal States
    musicModalStates: MusicModalState[];

    // Selection State
    selectedMusicModalId: string | null;
    selectedMusicModalIds: string[];

    // Actions
    setMusicModalStates: (states: MusicModalState[] | ((prev: MusicModalState[]) => MusicModalState[])) => void;
    addMusicModal: (modal: MusicModalState) => void;
    updateMusicModal: (id: string, updates: Partial<MusicModalState>) => void;
    removeMusicModal: (id: string) => void;

    // Selection Actions
    setSelectedMusicModalId: (id: string | null) => void;
    setSelectedMusicModalIds: (ids: string[] | ((prev: string[]) => string[])) => void;
    clearMusicSelection: () => void;

    // Bulk Operations
    removeMusicModals: (ids: string[]) => void;
}

/**
 * Music Store
 * Centralized state management for music generation modals
 * 
 * Benefits:
 * - Selective subscriptions (components only re-render when their selected state changes)
 * - No prop drilling
 * - Centralized state updates
 * - Easy to test and debug
 */
export const useMusicStore = create<MusicStoreState>()(
    devtools(
        (set, get) => ({
            // Initial State
            musicModalStates: [],
            selectedMusicModalId: null,
            selectedMusicModalIds: [],

            // Set music modal states (supports both direct array and updater function)
            setMusicModalStates: (states) => {
                set((state) => ({
                    musicModalStates: typeof states === 'function' ? states(state.musicModalStates) : states,
                }), false, 'setMusicModalStates');
            },

            // Add a new music modal
            addMusicModal: (modal) => {
                set((state) => ({
                    musicModalStates: [...state.musicModalStates, modal],
                }), false, 'addMusicModal');
            },

            // Update an existing music modal
            updateMusicModal: (id, updates) => {
                set((state) => ({
                    musicModalStates: state.musicModalStates.map((modal) =>
                        modal.id === id ? { ...modal, ...updates } : modal
                    ),
                }), false, 'updateMusicModal');
            },

            // Remove a single music modal
            removeMusicModal: (id) => {
                set((state) => ({
                    musicModalStates: state.musicModalStates.filter((modal) => modal.id !== id),
                    // Clear selection if the removed modal was selected
                    selectedMusicModalId: state.selectedMusicModalId === id ? null : state.selectedMusicModalId,
                    selectedMusicModalIds: state.selectedMusicModalIds.filter((selectedId) => selectedId !== id),
                }), false, 'removeMusicModal');
            },

            // Set selected music modal ID
            setSelectedMusicModalId: (id) => {
                set({ selectedMusicModalId: id }, false, 'setSelectedMusicModalId');
            },

            // Set selected music modal IDs (supports both direct array and updater function)
            setSelectedMusicModalIds: (ids) => {
                set((state) => ({
                    selectedMusicModalIds: typeof ids === 'function' ? ids(state.selectedMusicModalIds) : ids,
                }), false, 'setSelectedMusicModalIds');
            },

            // Clear all music selections
            clearMusicSelection: () => {
                set({
                    selectedMusicModalId: null,
                    selectedMusicModalIds: [],
                }, false, 'clearMusicSelection');
            },

            // Remove multiple music modals
            removeMusicModals: (ids) => {
                const idsSet = new Set(ids);
                set((state) => ({
                    musicModalStates: state.musicModalStates.filter((modal) => !idsSet.has(modal.id)),
                    // Clear selections for removed modals
                    selectedMusicModalId: idsSet.has(state.selectedMusicModalId || '') ? null : state.selectedMusicModalId,
                    selectedMusicModalIds: state.selectedMusicModalIds.filter((selectedId) => !idsSet.has(selectedId)),
                }), false, 'removeMusicModals');
            },
        }),
        {
            name: 'MusicStore', // Name for Redux DevTools
        }
    )
);

/**
 * Selector Hooks for Optimized Re-renders
 * Components can use these to subscribe only to the state they need
 */

// Get all music modal states
export const useMusicModalStates = () => useMusicStore((state) => state.musicModalStates);

// Get a specific music modal by ID
export const useMusicModal = (id: string) =>
    useMusicStore((state) => state.musicModalStates.find((modal) => modal.id === id));

// Get selection state (using separate selectors to prevent infinite loops)
export const useMusicSelection = () => {
    const selectedId = useSelectedMusicModalId();
    const selectedIds = useSelectedMusicModalIds();
    return { selectedId, selectedIds };
};

// Get only selected IDs (for components that only care about selection)
export const useSelectedMusicModalIds = () =>
    useMusicStore((state) => state.selectedMusicModalIds);

// Get only selected ID (single selection)
export const useSelectedMusicModalId = () =>
    useMusicStore((state) => state.selectedMusicModalId);
