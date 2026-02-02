'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { TextModalState } from '@/modules/canvas-overlays/types';

/**
 * Text Store State Interface
 * Manages all text input modal states and selections
 */
interface TextStoreState {
    // Text Modal States
    textModalStates: TextModalState[];

    // Selection State
    selectedTextModalId: string | null;
    selectedTextModalIds: string[];

    // Actions
    setTextModalStates: (states: TextModalState[] | ((prev: TextModalState[]) => TextModalState[])) => void;
    addTextModal: (modal: TextModalState) => void;
    updateTextModal: (id: string, updates: Partial<TextModalState>) => void;
    removeTextModal: (id: string) => void;

    // Selection Actions
    setSelectedTextModalId: (id: string | null) => void;
    setSelectedTextModalIds: (ids: string[] | ((prev: string[]) => string[])) => void;
    clearTextSelection: () => void;
}

/**
 * Text Store
 * Centralized state management for text input modals
 */
export const useTextStore = create<TextStoreState>()(
    devtools(
        (set) => ({
            // Initial State
            textModalStates: [],
            selectedTextModalId: null,
            selectedTextModalIds: [],

            // Set text modal states (supports both direct array and updater function)
            setTextModalStates: (states) => {
                set((state) => ({
                    textModalStates: typeof states === 'function' ? states(state.textModalStates) : states,
                }), false, 'setTextModalStates');
            },

            // Add a new text modal
            addTextModal: (modal) => {
                set((state) => ({
                    textModalStates: [...state.textModalStates, modal],
                }), false, 'addTextModal');
            },

            // Update an existing text modal
            updateTextModal: (id, updates) => {
                set((state) => ({
                    textModalStates: state.textModalStates.map((modal) =>
                        modal.id === id ? { ...modal, ...updates } : modal
                    ),
                }), false, 'updateTextModal');
            },

            // Remove a single text modal
            removeTextModal: (id) => {
                set((state) => ({
                    textModalStates: state.textModalStates.filter((modal) => modal.id !== id),
                    // Clear selection if the removed modal was selected
                    selectedTextModalId: state.selectedTextModalId === id ? null : state.selectedTextModalId,
                    selectedTextModalIds: state.selectedTextModalIds.filter((selectedId) => selectedId !== id),
                }), false, 'removeTextModal');
            },

            // Set selected text modal ID
            setSelectedTextModalId: (id) => {
                set({ selectedTextModalId: id }, false, 'setSelectedTextModalId');
            },

            // Set selected text modal IDs
            setSelectedTextModalIds: (ids) => {
                set((state) => ({
                    selectedTextModalIds: typeof ids === 'function' ? ids(state.selectedTextModalIds) : ids,
                }), false, 'setSelectedTextModalIds');
            },

            // Clear all text selections
            clearTextSelection: () => {
                set({
                    selectedTextModalId: null,
                    selectedTextModalIds: [],
                }, false, 'clearTextSelection');
            },
        }),
        {
            name: 'TextStore',
        }
    )
);

/**
 * Selector Hooks for Optimized Re-renders
 */

// Get all text modal states
export const useTextModalStates = () => useTextStore((state) => state.textModalStates);

// Get a specific text modal by ID
export const useTextModal = (id: string) =>
    useTextStore((state) => state.textModalStates.find((modal) => modal.id === id));

// Get only selected IDs
export const useSelectedTextModalIds = () =>
    useTextStore((state) => state.selectedTextModalIds);

// Get only selected ID
export const useSelectedTextModalId = () =>
    useTextStore((state) => state.selectedTextModalId);

export const useTextSelection = () => {
    const selectedId = useSelectedTextModalId();
    const selectedIds = useSelectedTextModalIds();
    return { selectedId, selectedIds };
};
