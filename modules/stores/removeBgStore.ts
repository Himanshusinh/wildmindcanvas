import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface RemoveBgModalState {
    id: string;
    x: number;
    y: number;
    removedBgImageUrl?: string | null;
    sourceImageUrl?: string | null;
    localRemovedBgImageUrl?: string | null;
    frameWidth?: number;
    frameHeight?: number;
    isRemovingBg?: boolean;
    isExpanded?: boolean;
    model?: string;
    backgroundType?: string;
    scaleValue?: number;
}

interface RemoveBgStoreState {
    removeBgModalStates: RemoveBgModalState[];
    selectedRemoveBgModalId: string | null;
    selectedRemoveBgModalIds: string[];

    setRemoveBgModalStates: (states: RemoveBgModalState[] | ((prev: RemoveBgModalState[]) => RemoveBgModalState[])) => void;
    addRemoveBgModal: (modal: RemoveBgModalState) => void;
    updateRemoveBgModal: (id: string, updates: Partial<RemoveBgModalState>) => void;
    removeRemoveBgModal: (id: string) => void;

    setSelectedRemoveBgModalId: (id: string | null) => void;
    setSelectedRemoveBgModalIds: (ids: string[] | ((prev: string[]) => string[])) => void;
    clearRemoveBgSelection: () => void;
    removeRemoveBgModals: (ids: string[]) => void;
}

export const useRemoveBgStore = create<RemoveBgStoreState>()(
    devtools((set) => ({
        removeBgModalStates: [],
        selectedRemoveBgModalId: null,
        selectedRemoveBgModalIds: [],

        setRemoveBgModalStates: (states) =>
            set((state) => ({
                removeBgModalStates: typeof states === 'function' ? states(state.removeBgModalStates) : states,
            }), false, 'setRemoveBgModalStates'),

        addRemoveBgModal: (modal) =>
            set((state) => ({
                removeBgModalStates: [...state.removeBgModalStates, modal],
            }), false, 'addRemoveBgModal'),

        updateRemoveBgModal: (id, updates) =>
            set((state) => ({
                removeBgModalStates: state.removeBgModalStates.map((modal) =>
                    modal.id === id ? { ...modal, ...updates } : modal
                ),
            }), false, 'updateRemoveBgModal'),

        removeRemoveBgModal: (id) =>
            set((state) => ({
                removeBgModalStates: state.removeBgModalStates.filter((modal) => modal.id !== id),
                selectedRemoveBgModalId: state.selectedRemoveBgModalId === id ? null : state.selectedRemoveBgModalId,
                selectedRemoveBgModalIds: state.selectedRemoveBgModalIds.filter((selectedId) => selectedId !== id),
            }), false, 'removeRemoveBgModal'),

        setSelectedRemoveBgModalId: (id) =>
            set({ selectedRemoveBgModalId: id }, false, 'setSelectedRemoveBgModalId'),

        setSelectedRemoveBgModalIds: (ids) =>
            set((state) => ({
                selectedRemoveBgModalIds: typeof ids === 'function' ? ids(state.selectedRemoveBgModalIds) : ids,
            }), false, 'setSelectedRemoveBgModalIds'),

        clearRemoveBgSelection: () =>
            set({
                selectedRemoveBgModalId: null,
                selectedRemoveBgModalIds: [],
            }, false, 'clearRemoveBgSelection'),

        removeRemoveBgModals: (ids) => {
            const idsSet = new Set(ids);
            set((state) => ({
                removeBgModalStates: state.removeBgModalStates.filter((modal) => !idsSet.has(modal.id)),
                // Clear selections for removed modals
                selectedRemoveBgModalId: idsSet.has(state.selectedRemoveBgModalId || '') ? null : state.selectedRemoveBgModalId,
                selectedRemoveBgModalIds: state.selectedRemoveBgModalIds.filter((selectedId) => !idsSet.has(selectedId)),
            }), false, 'removeRemoveBgModals');
        },
    }),
        {
            name: 'RemoveBgStore',
        })
);

// Selectors
export const useRemoveBgModalStates = () => useRemoveBgStore((state) => state.removeBgModalStates);
export const useSelectedRemoveBgModalId = () => useRemoveBgStore((state) => state.selectedRemoveBgModalId);
export const useSelectedRemoveBgModalIds = () => useRemoveBgStore((state) => state.selectedRemoveBgModalIds);

export const useRemoveBgSelection = () => {
    const selectedId = useSelectedRemoveBgModalId();
    const selectedIds = useSelectedRemoveBgModalIds();
    const setSelectedId = useRemoveBgStore(state => state.setSelectedRemoveBgModalId);
    const setSelectedIds = useRemoveBgStore(state => state.setSelectedRemoveBgModalIds);
    const clearSelection = useRemoveBgStore(state => state.clearRemoveBgSelection);

    return {
        selectedId,
        selectedIds,
        setSelectedId,
        setSelectedIds,
        clearSelection
    };
};
