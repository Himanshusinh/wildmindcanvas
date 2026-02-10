import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface ImageEditorModalState {
    id: string;
    x: number;
    y: number;
}

interface ImageEditorStoreState {
    imageEditorModalStates: ImageEditorModalState[];
    selectedImageEditorModalId: string | null;
    selectedImageEditorModalIds: string[];

    // Actions
    setImageEditorModalStates: (states: ImageEditorModalState[] | ((prev: ImageEditorModalState[]) => ImageEditorModalState[])) => void;
    addImageEditorModal: (modal: ImageEditorModalState) => void;
    updateImageEditorModal: (id: string, updates: Partial<ImageEditorModalState>) => void;
    removeImageEditorModal: (id: string) => void;

    // Selection Actions
    setSelectedImageEditorModalId: (id: string | null) => void;
    setSelectedImageEditorModalIds: (ids: string[]) => void;
    clearImageEditorSelection: () => void;
}

export const useImageEditorStore = create<ImageEditorStoreState>()(
    devtools((set) => ({
        imageEditorModalStates: [],
        selectedImageEditorModalId: null,
        selectedImageEditorModalIds: [],

        setImageEditorModalStates: (states) =>
            set((state) => ({
                imageEditorModalStates: typeof states === 'function' ? states(state.imageEditorModalStates) : states,
            }), false, 'setImageEditorModalStates'),

        addImageEditorModal: (modal) =>
            set((state) => ({
                imageEditorModalStates: [...state.imageEditorModalStates, modal],
            }), false, 'addImageEditorModal'),

        updateImageEditorModal: (id, updates) =>
            set((state) => ({
                imageEditorModalStates: state.imageEditorModalStates.map((m) =>
                    m.id === id ? { ...m, ...updates } : m
                ),
            }), false, 'updateImageEditorModal'),

        removeImageEditorModal: (id) =>
            set((state) => ({
                imageEditorModalStates: state.imageEditorModalStates.filter((m) => m.id !== id),
                selectedImageEditorModalId: state.selectedImageEditorModalId === id ? null : state.selectedImageEditorModalId,
                selectedImageEditorModalIds: state.selectedImageEditorModalIds.filter((mId) => mId !== id),
            }), false, 'removeImageEditorModal'),

        setSelectedImageEditorModalId: (id) =>
            set({ selectedImageEditorModalId: id }, false, 'setSelectedImageEditorModalId'),

        setSelectedImageEditorModalIds: (ids) =>
            set({ selectedImageEditorModalIds: ids }, false, 'setSelectedImageEditorModalIds'),

        clearImageEditorSelection: () =>
            set({ selectedImageEditorModalId: null, selectedImageEditorModalIds: [] }, false, 'clearImageEditorSelection'),
    }), {
        name: 'ImageEditorStore',
    })
);

// Selectors
export const useImageEditorModalStates = () => useImageEditorStore((state) => state.imageEditorModalStates);
export const useSelectedImageEditorModalId = () => useImageEditorStore((state) => state.selectedImageEditorModalId);
export const useSelectedImageEditorModalIds = () => useImageEditorStore((state) => state.selectedImageEditorModalIds);

export const useImageEditorSelection = () => {
    const selectedId = useSelectedImageEditorModalId();
    const selectedIds = useSelectedImageEditorModalIds();
    const setSelectedId = useImageEditorStore(state => state.setSelectedImageEditorModalId);
    const setSelectedIds = useImageEditorStore(state => state.setSelectedImageEditorModalIds);
    const clearSelection = useImageEditorStore(state => state.clearImageEditorSelection);

    return {
        selectedId,
        selectedIds,
        setSelectedId,
        setSelectedIds,
        clearSelection
    };
};
