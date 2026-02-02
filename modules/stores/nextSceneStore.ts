import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface NextSceneModalState {
    id: string;
    x: number;
    y: number;
    nextSceneImageUrl?: string | null;
    sourceImageUrl?: string | null;
    localNextSceneImageUrl?: string | null;
    mode?: string;
    frameWidth?: number;
    frameHeight?: number;
    isProcessing?: boolean;
    isExpanded?: boolean;
    prompt?: string;
    aspectRatio?: string;
    loraScale?: number;
}

interface NextSceneStoreState {
    nextSceneModalStates: NextSceneModalState[];
    selectedNextSceneModalId: string | null;
    selectedNextSceneModalIds: string[];

    // Actions
    setNextSceneModalStates: (states: NextSceneModalState[] | ((prev: NextSceneModalState[]) => NextSceneModalState[])) => void;
    addNextSceneModal: (modal: NextSceneModalState) => void;
    updateNextSceneModal: (id: string, updates: Partial<NextSceneModalState>) => void;
    removeNextSceneModal: (id: string) => void;

    // Selection Actions
    setSelectedNextSceneModalId: (id: string | null) => void;
    setSelectedNextSceneModalIds: (ids: string[]) => void;
    clearNextSceneSelection: () => void;
}

export const useNextSceneStore = create<NextSceneStoreState>()(
    devtools((set) => ({
        nextSceneModalStates: [],
        selectedNextSceneModalId: null,
        selectedNextSceneModalIds: [],

        setNextSceneModalStates: (states) =>
            set((state) => ({
                nextSceneModalStates: typeof states === 'function' ? states(state.nextSceneModalStates) : states,
            }), false, 'setNextSceneModalStates'),

        addNextSceneModal: (modal) =>
            set((state) => ({
                nextSceneModalStates: [...state.nextSceneModalStates, modal],
            }), false, 'addNextSceneModal'),

        updateNextSceneModal: (id, updates) =>
            set((state) => ({
                nextSceneModalStates: state.nextSceneModalStates.map((m) =>
                    m.id === id ? { ...m, ...updates } : m
                ),
            }), false, 'updateNextSceneModal'),

        removeNextSceneModal: (id) =>
            set((state) => ({
                nextSceneModalStates: state.nextSceneModalStates.filter((m) => m.id !== id),
                selectedNextSceneModalId: state.selectedNextSceneModalId === id ? null : state.selectedNextSceneModalId,
                selectedNextSceneModalIds: state.selectedNextSceneModalIds.filter((mId) => mId !== id),
            }), false, 'removeNextSceneModal'),

        setSelectedNextSceneModalId: (id) =>
            set({ selectedNextSceneModalId: id }, false, 'setSelectedNextSceneModalId'),

        setSelectedNextSceneModalIds: (ids) =>
            set({ selectedNextSceneModalIds: ids }, false, 'setSelectedNextSceneModalIds'),

        clearNextSceneSelection: () =>
            set({ selectedNextSceneModalId: null, selectedNextSceneModalIds: [] }, false, 'clearNextSceneSelection'),
    }), {
        name: 'NextSceneStore',
    })
);

// Selectors
export const useNextSceneModalStates = () => useNextSceneStore((state) => state.nextSceneModalStates);
export const useSelectedNextSceneModalId = () => useNextSceneStore((state) => state.selectedNextSceneModalId);
export const useSelectedNextSceneModalIds = () => useNextSceneStore((state) => state.selectedNextSceneModalIds);

export const useNextSceneSelection = () => {
    const selectedId = useSelectedNextSceneModalId();
    const selectedIds = useSelectedNextSceneModalIds();
    const setSelectedId = useNextSceneStore(state => state.setSelectedNextSceneModalId);
    const setSelectedIds = useNextSceneStore(state => state.setSelectedNextSceneModalIds);
    const clearSelection = useNextSceneStore(state => state.clearNextSceneSelection);

    return {
        selectedId,
        selectedIds,
        setSelectedId,
        setSelectedIds,
        clearSelection
    };
};
