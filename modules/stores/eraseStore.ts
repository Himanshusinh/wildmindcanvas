import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface EraseModalState {
    id: string;
    x: number;
    y: number;
    erasedImageUrl?: string | null;
    sourceImageUrl?: string | null;
    localErasedImageUrl?: string | null;
    frameWidth?: number;
    frameHeight?: number;
    isErasing?: boolean;
    isExpanded?: boolean;
    model?: string;
}

interface EraseStoreState {
    eraseModalStates: EraseModalState[];
    selectedEraseModalId: string | null;
    selectedEraseModalIds: string[];

    setEraseModalStates: (states: EraseModalState[] | ((prev: EraseModalState[]) => EraseModalState[])) => void;
    addEraseModal: (modal: EraseModalState) => void;
    updateEraseModal: (id: string, updates: Partial<EraseModalState>) => void;
    removeEraseModal: (id: string) => void;

    setSelectedEraseModalId: (id: string | null) => void;
    setSelectedEraseModalIds: (ids: string[] | ((prev: string[]) => string[])) => void;
    clearEraseSelection: () => void;
    removeEraseModals: (ids: string[]) => void;
}

export const useEraseStore = create<EraseStoreState>()(
    devtools((set) => ({
        eraseModalStates: [],
        selectedEraseModalId: null,
        selectedEraseModalIds: [],

        setEraseModalStates: (states) =>
            set((state) => ({
                eraseModalStates: typeof states === 'function' ? states(state.eraseModalStates) : states,
            }), false, 'setEraseModalStates'),

        addEraseModal: (modal) =>
            set((state) => ({
                eraseModalStates: [...state.eraseModalStates, modal],
            }), false, 'addEraseModal'),

        updateEraseModal: (id, updates) =>
            set((state) => ({
                eraseModalStates: state.eraseModalStates.map((modal) =>
                    modal.id === id ? { ...modal, ...updates } : modal
                ),
            }), false, 'updateEraseModal'),

        removeEraseModal: (id) =>
            set((state) => ({
                eraseModalStates: state.eraseModalStates.filter((modal) => modal.id !== id),
                selectedEraseModalId: state.selectedEraseModalId === id ? null : state.selectedEraseModalId,
                selectedEraseModalIds: state.selectedEraseModalIds.filter((selectedId) => selectedId !== id),
            }), false, 'removeEraseModal'),

        setSelectedEraseModalId: (id) =>
            set({ selectedEraseModalId: id }, false, 'setSelectedEraseModalId'),

        setSelectedEraseModalIds: (ids) =>
            set((state) => ({
                selectedEraseModalIds: typeof ids === 'function' ? ids(state.selectedEraseModalIds) : ids,
            }), false, 'setSelectedEraseModalIds'),

        clearEraseSelection: () =>
            set({
                selectedEraseModalId: null,
                selectedEraseModalIds: [],
            }, false, 'clearEraseSelection'),

        removeEraseModals: (ids) => {
            const idsSet = new Set(ids);
            set((state) => ({
                eraseModalStates: state.eraseModalStates.filter((modal) => !idsSet.has(modal.id)),
                // Clear selections for removed modals
                selectedEraseModalId: idsSet.has(state.selectedEraseModalId || '') ? null : state.selectedEraseModalId,
                selectedEraseModalIds: state.selectedEraseModalIds.filter((selectedId) => !idsSet.has(selectedId)),
            }), false, 'removeEraseModals');
        },
    }),
        {
            name: 'EraseStore',
        })
);

// Selectors
export const useEraseModalStates = () => useEraseStore((state) => state.eraseModalStates);
export const useSelectedEraseModalId = () => useEraseStore((state) => state.selectedEraseModalId);
export const useSelectedEraseModalIds = () => useEraseStore((state) => state.selectedEraseModalIds);

export const useEraseSelection = () => {
    const selectedId = useSelectedEraseModalId();
    const selectedIds = useSelectedEraseModalIds();
    const setSelectedId = useEraseStore(state => state.setSelectedEraseModalId);
    const setSelectedIds = useEraseStore(state => state.setSelectedEraseModalIds);
    const clearSelection = useEraseStore(state => state.clearEraseSelection);

    return {
        selectedId,
        selectedIds,
        setSelectedId,
        setSelectedIds,
        clearSelection
    };
};
