
export type CanvasElement = {
    id: string;
    type: string;
    x: number;
    y: number;
    width?: number; // legacy/optional, prefer bounds
    height?: number; // legacy/optional, prefer bounds
    rotation?: number;
    rotationX?: number;
    rotationY?: number;
    zoom?: number;
    bounds?: { width: number; height: number };
    meta: Record<string, any>; // Flexible meta for various generators
    // Add other common fields if necessary, but keep it minimal as per "State Contract"
}

export type CanvasSnapshot = {
    elements: Record<string, CanvasElement>;
    metadata: {
        version: "1.1";
        viewport?: { x: number; y: number; scale: number };
        updatedAt: number;
    };
};
