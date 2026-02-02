import { create } from 'zustand';
import { VideoEditorModalState } from '../canvas-overlays/types';

interface VideoEditorStore {
    videoEditorModalStates: VideoEditorModalState[];
    selectedId: string | null;
    selectedIds: string[];

    // Actions
    setVideoEditorModalStates: (states: VideoEditorModalState[] | ((prev: VideoEditorModalState[]) => VideoEditorModalState[])) => void;
    setSelectedId: (id: string | null) => void;
    setSelectedIds: (ids: string[]) => void;
    clearVideoEditorSelection: () => void;
}

export const useVideoEditorStore = create<VideoEditorStore>((set) => ({
    videoEditorModalStates: [],
    selectedId: null,
    selectedIds: [],

    setVideoEditorModalStates: (states) =>
        set((state) => ({
            videoEditorModalStates: typeof states === 'function' ? states(state.videoEditorModalStates) : states
        })),

    setSelectedId: (id) => set({ selectedId: id }),
    setSelectedIds: (ids) => set({ selectedIds: ids }),

    clearVideoEditorSelection: () => set({ selectedId: null, selectedIds: [] }),
}));

// Selectors for better performance
export const useVideoEditorModalStates = () => useVideoEditorStore((state) => state.videoEditorModalStates);
export const useSelectedVideoEditorId = () => useVideoEditorStore((state) => state.selectedId);
export const useSelectedVideoEditorIds = () => useVideoEditorStore((state) => state.selectedIds);

export const useVideoEditorSelection = () => {
    const selectedId = useSelectedVideoEditorId();
    const selectedIds = useSelectedVideoEditorIds();
    const setSelectedId = useVideoEditorStore((state) => state.setSelectedId);
    const setSelectedIds = useVideoEditorStore((state) => state.setSelectedIds);
    const clearSelection = useVideoEditorStore((state) => state.clearVideoEditorSelection);

    return {
        selectedId,
        selectedIds,
        setSelectedId,
        setSelectedIds,
        clearSelection,
    };
};
