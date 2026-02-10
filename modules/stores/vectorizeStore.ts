import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface VectorizeModalState {
    id: string;
    x: number;
    y: number;
    vectorizedImageUrl?: string | null;
    sourceImageUrl?: string | null;
    localVectorizedImageUrl?: string | null;
    mode?: string;
    frameWidth?: number;
    frameHeight?: number;
    isVectorizing?: boolean;
    isExpanded?: boolean;
}

interface VectorizeStoreState {
    vectorizeModalStates: VectorizeModalState[];
    selectedVectorizeModalId: string | null;
    selectedVectorizeModalIds: string[];

    // Actions
    setVectorizeModalStates: (states: VectorizeModalState[] | ((prev: VectorizeModalState[]) => VectorizeModalState[])) => void;
    addVectorizeModal: (modal: VectorizeModalState) => void;
    updateVectorizeModal: (id: string, updates: Partial<VectorizeModalState>) => void;
    removeVectorizeModal: (id: string) => void;

    // Selection Actions
    setSelectedVectorizeModalId: (id: string | null) => void;
    setSelectedVectorizeModalIds: (ids: string[]) => void;
    clearVectorizeSelection: () => void;
}

export const useVectorizeStore = create<VectorizeStoreState>()(
    devtools((set) => ({
        vectorizeModalStates: [],
        selectedVectorizeModalId: null,
        selectedVectorizeModalIds: [],

        setVectorizeModalStates: (states) =>
            set((state) => ({
                vectorizeModalStates: typeof states === 'function' ? states(state.vectorizeModalStates) : states,
            }), false, 'setVectorizeModalStates'),

        addVectorizeModal: (modal) =>
            set((state) => ({
                vectorizeModalStates: [...state.vectorizeModalStates, modal],
            }), false, 'addVectorizeModal'),

        updateVectorizeModal: (id, updates) =>
            set((state) => ({
                vectorizeModalStates: state.vectorizeModalStates.map((m) =>
                    m.id === id ? { ...m, ...updates } : m
                ),
            }), false, 'updateVectorizeModal'),

        removeVectorizeModal: (id) =>
            set((state) => ({
                vectorizeModalStates: state.vectorizeModalStates.filter((m) => m.id !== id),
                selectedVectorizeModalId: state.selectedVectorizeModalId === id ? null : state.selectedVectorizeModalId,
                selectedVectorizeModalIds: state.selectedVectorizeModalIds.filter((mId) => mId !== id),
            }), false, 'removeVectorizeModal'),

        setSelectedVectorizeModalId: (id) =>
            set({ selectedVectorizeModalId: id }, false, 'setSelectedVectorizeModalId'),

        setSelectedVectorizeModalIds: (ids) =>
            set({ selectedVectorizeModalIds: ids }, false, 'setSelectedVectorizeModalIds'),

        clearVectorizeSelection: () =>
            set({ selectedVectorizeModalId: null, selectedVectorizeModalIds: [] }, false, 'clearVectorizeSelection'),
    }), {
        name: 'VectorizeStore',
    })
);

// Selectors
export const useVectorizeModalStates = () => useVectorizeStore((state) => state.vectorizeModalStates);
export const useSelectedVectorizeModalId = () => useVectorizeStore((state) => state.selectedVectorizeModalId);
export const useSelectedVectorizeModalIds = () => useVectorizeStore((state) => state.selectedVectorizeModalIds);

export const useVectorizeSelection = () => {
    const selectedId = useSelectedVectorizeModalId();
    const selectedIds = useSelectedVectorizeModalIds();
    const setSelectedId = useVectorizeStore(state => state.setSelectedVectorizeModalId);
    const setSelectedIds = useVectorizeStore(state => state.setSelectedVectorizeModalIds);
    const clearSelection = useVectorizeStore(state => state.clearVectorizeSelection);

    return {
        selectedId,
        selectedIds,
        setSelectedId,
        setSelectedIds,
        clearSelection
    };
};
