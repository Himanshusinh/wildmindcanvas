import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface StoryboardModalState {
    id: string;
    x: number;
    y: number;
    frameWidth?: number;
    frameHeight?: number;
    scriptText?: string | null;
    characterNamesMap?: Record<number, string>;
    propsNamesMap?: Record<number, string>;
    backgroundNamesMap?: Record<number, string>;
    namedImages?: {
        characters?: Record<string, string>;
        backgrounds?: Record<string, string>;
        props?: Record<string, string>;
    };
    stitchedImageUrl?: string;
    isExpanded?: boolean;
}

interface StoryboardStoreState {
    storyboardModalStates: StoryboardModalState[];
    selectedStoryboardModalId: string | null;
    selectedStoryboardModalIds: string[];

    // Actions
    setStoryboardModalStates: (states: StoryboardModalState[] | ((prev: StoryboardModalState[]) => StoryboardModalState[])) => void;
    addStoryboardModal: (modal: StoryboardModalState) => void;
    updateStoryboardModal: (id: string, updates: Partial<StoryboardModalState>) => void;
    removeStoryboardModal: (id: string) => void;

    // Selection Actions
    setSelectedStoryboardModalId: (id: string | null) => void;
    setSelectedStoryboardModalIds: (ids: string[]) => void;
    clearStoryboardSelection: () => void;
}

export const useStoryboardStore = create<StoryboardStoreState>()(
    devtools((set) => ({
        storyboardModalStates: [],
        selectedStoryboardModalId: null,
        selectedStoryboardModalIds: [],

        setStoryboardModalStates: (states) =>
            set((state) => ({
                storyboardModalStates: typeof states === 'function' ? states(state.storyboardModalStates) : states,
            }), false, 'setStoryboardModalStates'),

        addStoryboardModal: (modal) =>
            set((state) => ({
                storyboardModalStates: [...state.storyboardModalStates, modal],
            }), false, 'addStoryboardModal'),

        updateStoryboardModal: (id, updates) =>
            set((state) => ({
                storyboardModalStates: state.storyboardModalStates.map((m) =>
                    m.id === id ? { ...m, ...updates } : m
                ),
            }), false, 'updateStoryboardModal'),

        removeStoryboardModal: (id) =>
            set((state) => ({
                storyboardModalStates: state.storyboardModalStates.filter((m) => m.id !== id),
                selectedStoryboardModalId: state.selectedStoryboardModalId === id ? null : state.selectedStoryboardModalId,
                selectedStoryboardModalIds: state.selectedStoryboardModalIds.filter((mId) => mId !== id),
            }), false, 'removeStoryboardModal'),

        setSelectedStoryboardModalId: (id) =>
            set({ selectedStoryboardModalId: id }, false, 'setSelectedStoryboardModalId'),

        setSelectedStoryboardModalIds: (ids) =>
            set({ selectedStoryboardModalIds: ids }, false, 'setSelectedStoryboardModalIds'),

        clearStoryboardSelection: () =>
            set({ selectedStoryboardModalId: null, selectedStoryboardModalIds: [] }, false, 'clearStoryboardSelection'),
    }), {
        name: 'StoryboardStore',
    })
);

// Selectors
export const useStoryboardModalStates = () => useStoryboardStore((state) => state.storyboardModalStates);
export const useSelectedStoryboardModalId = () => useStoryboardStore((state) => state.selectedStoryboardModalId);
export const useSelectedStoryboardModalIds = () => useStoryboardStore((state) => state.selectedStoryboardModalIds);

export const useStoryboardSelection = () => {
    const selectedId = useSelectedStoryboardModalId();
    const selectedIds = useSelectedStoryboardModalIds();
    const setSelectedId = useStoryboardStore(state => state.setSelectedStoryboardModalId);
    const setSelectedIds = useStoryboardStore(state => state.setSelectedStoryboardModalIds);
    const clearSelection = useStoryboardStore(state => state.clearStoryboardSelection);

    return {
        selectedId,
        selectedIds,
        setSelectedId,
        setSelectedIds,
        clearSelection
    };
};
