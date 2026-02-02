import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface MultiangleCameraModalState {
    id: string;
    x: number;
    y: number;
    sourceImageUrl?: string | null;
    isExpanded?: boolean;
}

interface MultiangleCameraStoreState {
    multiangleCameraModalStates: MultiangleCameraModalState[];
    selectedMultiangleCameraModalId: string | null;
    selectedMultiangleCameraModalIds: string[];

    setMultiangleCameraModalStates: (states: MultiangleCameraModalState[] | ((prev: MultiangleCameraModalState[]) => MultiangleCameraModalState[])) => void;
    addMultiangleCameraModal: (modal: MultiangleCameraModalState) => void;
    updateMultiangleCameraModal: (id: string, updates: Partial<MultiangleCameraModalState>) => void;
    removeMultiangleCameraModal: (id: string) => void;

    setSelectedMultiangleCameraModalId: (id: string | null) => void;
    setSelectedMultiangleCameraModalIds: (ids: string[] | ((prev: string[]) => string[])) => void;
    clearMultiangleCameraSelection: () => void;
    removeMultiangleCameraModals: (ids: string[]) => void;
}

export const useMultiangleCameraStore = create<MultiangleCameraStoreState>()(
    devtools((set) => ({
        multiangleCameraModalStates: [],
        selectedMultiangleCameraModalId: null,
        selectedMultiangleCameraModalIds: [],

        setMultiangleCameraModalStates: (states) =>
            set((state) => ({
                multiangleCameraModalStates: typeof states === 'function' ? states(state.multiangleCameraModalStates) : states,
            }), false, 'setMultiangleCameraModalStates'),

        addMultiangleCameraModal: (modal) =>
            set((state) => ({
                multiangleCameraModalStates: [...state.multiangleCameraModalStates, modal],
            }), false, 'addMultiangleCameraModal'),

        updateMultiangleCameraModal: (id, updates) =>
            set((state) => ({
                multiangleCameraModalStates: state.multiangleCameraModalStates.map((modal) =>
                    modal.id === id ? { ...modal, ...updates } : modal
                ),
            }), false, 'updateMultiangleCameraModal'),

        removeMultiangleCameraModal: (id) =>
            set((state) => ({
                multiangleCameraModalStates: state.multiangleCameraModalStates.filter((modal) => modal.id !== id),
                selectedMultiangleCameraModalId: state.selectedMultiangleCameraModalId === id ? null : state.selectedMultiangleCameraModalId,
                selectedMultiangleCameraModalIds: state.selectedMultiangleCameraModalIds.filter((selectedId) => selectedId !== id),
            }), false, 'removeMultiangleCameraModal'),

        setSelectedMultiangleCameraModalId: (id) =>
            set({ selectedMultiangleCameraModalId: id }, false, 'setSelectedMultiangleCameraModalId'),

        setSelectedMultiangleCameraModalIds: (ids) =>
            set((state) => ({
                selectedMultiangleCameraModalIds: typeof ids === 'function' ? ids(state.selectedMultiangleCameraModalIds) : ids,
            }), false, 'setSelectedMultiangleCameraModalIds'),

        clearMultiangleCameraSelection: () =>
            set({
                selectedMultiangleCameraModalId: null,
                selectedMultiangleCameraModalIds: [],
            }, false, 'clearMultiangleCameraSelection'),

        removeMultiangleCameraModals: (ids) => {
            const idsSet = new Set(ids);
            set((state) => ({
                multiangleCameraModalStates: state.multiangleCameraModalStates.filter((modal) => !idsSet.has(modal.id)),
                selectedMultiangleCameraModalId: idsSet.has(state.selectedMultiangleCameraModalId || '') ? null : state.selectedMultiangleCameraModalId,
                selectedMultiangleCameraModalIds: state.selectedMultiangleCameraModalIds.filter((selectedId) => !idsSet.has(selectedId)),
            }), false, 'removeMultiangleCameraModals');
        },
    }),
        {
            name: 'MultiangleCameraStore',
        })
);

// Selectors
export const useMultiangleCameraModalStates = () => useMultiangleCameraStore((state) => state.multiangleCameraModalStates);
export const useSelectedMultiangleCameraModalId = () => useMultiangleCameraStore((state) => state.selectedMultiangleCameraModalId);
export const useSelectedMultiangleCameraModalIds = () => useMultiangleCameraStore((state) => state.selectedMultiangleCameraModalIds);

export const useMultiangleCameraSelection = () => {
    const selectedId = useSelectedMultiangleCameraModalId();
    const selectedIds = useSelectedMultiangleCameraModalIds();
    const setSelectedId = useMultiangleCameraStore(state => state.setSelectedMultiangleCameraModalId);
    const setSelectedIds = useMultiangleCameraStore(state => state.setSelectedMultiangleCameraModalIds);
    const clearSelection = useMultiangleCameraStore(state => state.clearMultiangleCameraSelection);

    return {
        selectedId,
        selectedIds,
        setSelectedId,
        setSelectedIds,
        clearSelection
    };
};
