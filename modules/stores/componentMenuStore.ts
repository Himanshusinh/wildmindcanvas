import { create } from 'zustand';

export interface ComponentMenuState {
    isOpen: boolean;
    position: { x: number; y: number; canvasX: number; canvasY: number };
    sourceNodeId: string | null;
    sourceNodeType: string | null;
    connectionColor?: string;
    search: string;
}

interface ComponentMenuActions {
    openMenu: (params: {
        x: number;
        y: number;
        canvasX: number;
        canvasY: number;
        sourceNodeId: string;
        sourceNodeType: string;
        connectionColor?: string;
    }) => void;
    closeMenu: () => void;
    setSearch: (search: string) => void;
}

export const useComponentMenuStore = create<ComponentMenuState & ComponentMenuActions>((set) => ({
    isOpen: false,
    position: { x: 0, y: 0, canvasX: 0, canvasY: 0 },
    sourceNodeId: null,
    sourceNodeType: null,
    search: '',
    openMenu: (params) => set({
        isOpen: true,
        position: { x: params.x, y: params.y, canvasX: params.canvasX, canvasY: params.canvasY },
        sourceNodeId: params.sourceNodeId,
        sourceNodeType: params.sourceNodeType,
        connectionColor: params.connectionColor,
        search: '',
    }),
    closeMenu: () => set({ isOpen: false, sourceNodeId: null, sourceNodeType: null, search: '' }),
    setSearch: (search) => set({ search }),
}));
