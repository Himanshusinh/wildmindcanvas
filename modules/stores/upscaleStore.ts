'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { UpscaleModalState } from '@/modules/canvas-overlays/types';

/**
 * Upscale Store State Interface
 * Manages all upscale modal states and selections
 */
interface UpscaleStoreState {
    // Upscale Modal States
    upscaleModalStates: UpscaleModalState[];

    // Selection State
    selectedUpscaleModalId: string | null;
    selectedUpscaleModalIds: string[];

    // Actions
    setUpscaleModalStates: (states: UpscaleModalState[] | ((prev: UpscaleModalState[]) => UpscaleModalState[])) => void;
    addUpscaleModal: (modal: UpscaleModalState) => void;
    updateUpscaleModal: (id: string, updates: Partial<UpscaleModalState>) => void;
    removeUpscaleModal: (id: string) => void;

    // Selection Actions
    setSelectedUpscaleModalId: (id: string | null) => void;
    setSelectedUpscaleModalIds: (ids: string[] | ((prev: string[]) => string[])) => void;
    clearUpscaleSelection: () => void;

    // Bulk Operations
    removeUpscaleModals: (ids: string[]) => void;
}

/**
 * Upscale Store
 * Centralized state management for upscale modals
 */
export const useUpscaleStore = create<UpscaleStoreState>()(
    devtools(
        (set, get) => ({
            // Initial State
            upscaleModalStates: [],
            selectedUpscaleModalId: null,
            selectedUpscaleModalIds: [],

            // Set upscale modal states (supports both direct array and updater function)
            setUpscaleModalStates: (states) => {
                set((state) => ({
                    upscaleModalStates: typeof states === 'function' ? states(state.upscaleModalStates) : states,
                }), false, 'setUpscaleModalStates');
            },

            // Add a new upscale modal
            addUpscaleModal: (modal) => {
                set((state) => ({
                    upscaleModalStates: [...state.upscaleModalStates, modal],
                }), false, 'addUpscaleModal');
            },

            // Update an existing upscale modal
            updateUpscaleModal: (id, updates) => {
                set((state) => ({
                    upscaleModalStates: state.upscaleModalStates.map((modal) =>
                        modal.id === id ? { ...modal, ...updates } : modal
                    ),
                }), false, 'updateUpscaleModal');
            },

            // Remove a single upscale modal
            removeUpscaleModal: (id) => {
                set((state) => ({
                    upscaleModalStates: state.upscaleModalStates.filter((modal) => modal.id !== id),
                    // Clear selection if the removed modal was selected
                    selectedUpscaleModalId: state.selectedUpscaleModalId === id ? null : state.selectedUpscaleModalId,
                    selectedUpscaleModalIds: state.selectedUpscaleModalIds.filter((selectedId) => selectedId !== id),
                }), false, 'removeUpscaleModal');
            },

            // Set selected upscale modal ID
            setSelectedUpscaleModalId: (id) => {
                set({ selectedUpscaleModalId: id }, false, 'setSelectedUpscaleModalId');
            },

            // Set selected upscale modal IDs (supports both direct array and updater function)
            setSelectedUpscaleModalIds: (ids) => {
                set((state) => ({
                    selectedUpscaleModalIds: typeof ids === 'function' ? ids(state.selectedUpscaleModalIds) : ids,
                }), false, 'setSelectedUpscaleModalIds');
            },

            // Clear all upscale selections
            clearUpscaleSelection: () => {
                set({
                    selectedUpscaleModalId: null,
                    selectedUpscaleModalIds: [],
                }, false, 'clearUpscaleSelection');
            },

            // Remove multiple upscale modals
            removeUpscaleModals: (ids) => {
                const idsSet = new Set(ids);
                set((state) => ({
                    upscaleModalStates: state.upscaleModalStates.filter((modal) => !idsSet.has(modal.id)),
                    // Clear selections for removed modals
                    selectedUpscaleModalId: idsSet.has(state.selectedUpscaleModalId || '') ? null : state.selectedUpscaleModalId,
                    selectedUpscaleModalIds: state.selectedUpscaleModalIds.filter((selectedId) => !idsSet.has(selectedId)),
                }), false, 'removeUpscaleModals');
            },
        }),
        {
            name: 'UpscaleStore', // Name for Redux DevTools
        }
    )
);

/**
 * Selector Hooks for Optimized Re-renders
 * Components can use these to subscribe only to the state they need
 */

// Get all upscale modal states
export const useUpscaleModalStates = () => useUpscaleStore((state) => state.upscaleModalStates);

// Get a specific upscale modal by ID
export const useUpscaleModal = (id: string) =>
    useUpscaleStore((state) => state.upscaleModalStates.find((modal) => modal.id === id));

// Get selection state (using separate selectors to prevent infinite loops)
export const useUpscaleSelection = () => {
    const selectedId = useSelectedUpscaleModalId();
    const selectedIds = useSelectedUpscaleModalIds();
    const setSelectedId = useUpscaleStore(state => state.setSelectedUpscaleModalId);
    const setSelectedIds = useUpscaleStore(state => state.setSelectedUpscaleModalIds);
    const clearSelection = useUpscaleStore(state => state.clearUpscaleSelection);

    return { selectedId, selectedIds, setSelectedId, setSelectedIds, clearSelection };
};

// Get only selected IDs (for components that only care about selection)
export const useSelectedUpscaleModalIds = () =>
    useUpscaleStore((state) => state.selectedUpscaleModalIds);

// Get only selected ID (single selection)
export const useSelectedUpscaleModalId = () =>
    useUpscaleStore((state) => state.selectedUpscaleModalId);
