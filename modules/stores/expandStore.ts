import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface ExpandModalState {
    id: string;
    x: number;
    y: number;
    expandedImageUrl?: string | null;
    sourceImageUrl?: string | null;
    localExpandedImageUrl?: string | null;
    frameWidth?: number;
    frameHeight?: number;
    isExpanding?: boolean;
    isExpanded?: boolean;
    model?: string;
}

interface ExpandStoreState {
    expandModalStates: ExpandModalState[];
    selectedExpandModalId: string | null;
    selectedExpandModalIds: string[];

    // Actions
    setExpandModalStates: (states: ExpandModalState[] | ((prev: ExpandModalState[]) => ExpandModalState[])) => void;
    addExpandModal: (modal: ExpandModalState) => void;
    updateExpandModal: (id: string, updates: Partial<ExpandModalState>) => void;
    removeExpandModal: (id: string) => void;

    // Selection Actions
    setSelectedExpandModalId: (id: string | null) => void;
    setSelectedExpandModalIds: (ids: string[]) => void;
    clearExpandSelection: () => void;
}

export const useExpandStore = create<ExpandStoreState>()(
    devtools((set) => ({
        expandModalStates: [],
        selectedExpandModalId: null,
        selectedExpandModalIds: [],

        setExpandModalStates: (states) =>
            set((state) => ({
                expandModalStates: typeof states === 'function' ? states(state.expandModalStates) : states,
            }), false, 'setExpandModalStates'),

        addExpandModal: (modal) =>
            set((state) => ({
                expandModalStates: [...state.expandModalStates, modal],
            }), false, 'addExpandModal'),

        updateExpandModal: (id, updates) =>
            set((state) => ({
                expandModalStates: state.expandModalStates.map((m) =>
                    m.id === id ? { ...m, ...updates } : m
                ),
            }), false, 'updateExpandModal'),

        removeExpandModal: (id) =>
            set((state) => ({
                expandModalStates: state.expandModalStates.filter((m) => m.id !== id),
                selectedExpandModalId: state.selectedExpandModalId === id ? null : state.selectedExpandModalId,
                selectedExpandModalIds: state.selectedExpandModalIds.filter((mId) => mId !== id),
            }), false, 'removeExpandModal'),

        setSelectedExpandModalId: (id) =>
            set({ selectedExpandModalId: id }, false, 'setSelectedExpandModalId'),

        setSelectedExpandModalIds: (ids) =>
            set({ selectedExpandModalIds: ids }, false, 'setSelectedExpandModalIds'),

        clearExpandSelection: () =>
            set({ selectedExpandModalId: null, selectedExpandModalIds: [] }, false, 'clearExpandSelection'),
    }), {
        name: 'ExpandStore',
    })
);

// Selectors
export const useExpandModalStates = () => useExpandStore((state) => state.expandModalStates);
export const useSelectedExpandModalId = () => useExpandStore((state) => state.selectedExpandModalId);
export const useSelectedExpandModalIds = () => useExpandStore((state) => state.selectedExpandModalIds);

export const useExpandSelection = () => {
    const selectedId = useSelectedExpandModalId();
    const selectedIds = useSelectedExpandModalIds();
    const setSelectedId = useExpandStore(state => state.setSelectedExpandModalId);
    const setSelectedIds = useExpandStore(state => state.setSelectedExpandModalIds);
    const clearSelection = useExpandStore(state => state.clearExpandSelection);

    return {
        selectedId,
        selectedIds,
        setSelectedId,
        setSelectedIds,
        clearSelection
    };
};
