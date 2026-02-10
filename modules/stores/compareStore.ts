import { create } from 'zustand';
import { CompareModalState } from '../canvas-overlays/types';

interface CompareStore {
    compareModalStates: CompareModalState[];
    selectedId: string | null;
    selectedIds: string[];

    // Actions
    setCompareModalStates: (states: CompareModalState[] | ((prev: CompareModalState[]) => CompareModalState[])) => void;
    setSelectedId: (id: string | null) => void;
    setSelectedIds: (ids: string[]) => void;
    clearCompareSelection: () => void;
}

export const useCompareStore = create<CompareStore>((set) => ({
    compareModalStates: [],
    selectedId: null,
    selectedIds: [],

    setCompareModalStates: (states) =>
        set((state) => ({
            compareModalStates: typeof states === 'function' ? states(state.compareModalStates) : states
        })),

    setSelectedId: (id) => set({ selectedId: id }),
    setSelectedIds: (ids) => set({ selectedIds: ids }),

    clearCompareSelection: () => set({ selectedId: null, selectedIds: [] }),
}));

// Selectors for better performance
export const useCompareModalStates = () => useCompareStore((state) => state.compareModalStates);
export const useSelectedCompareId = () => useCompareStore((state) => state.selectedId);
export const useSelectedCompareIds = () => useCompareStore((state) => state.selectedIds);

export const useCompareSelection = () => {
    const selectedId = useSelectedCompareId();
    const selectedIds = useSelectedCompareIds();
    const setSelectedId = useCompareStore((state) => state.setSelectedId);
    const setSelectedIds = useCompareStore((state) => state.setSelectedIds);
    const clearSelection = useCompareStore((state) => state.clearCompareSelection);

    return {
        selectedId,
        selectedIds,
        setSelectedId,
        setSelectedIds,
        clearSelection,
    };
};
