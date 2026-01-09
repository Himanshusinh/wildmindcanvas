import { CanvasDocument } from './document';

export interface Snapshot {
    document: CanvasDocument;
    createdAt: number;
}

// Debounce timer
let saveTimeout: NodeJS.Timeout | null = null;
const SAVE_DELAY = 50; // 50ms debounce for responsive but non-blocking saves

export function saveSnapshot(doc: CanvasDocument) {
    if (typeof window === 'undefined') return;

    // Clear existing timer
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }

    // Set new timer
    saveTimeout = setTimeout(() => {
        console.log('[Persistence] Saving snapshot (Debounced):', doc.id, 'Nodes:', Object.keys(doc.nodes).length, 'Version:', doc.version);
        try {
            localStorage.setItem(
                "canvas:snapshot",
                JSON.stringify({
                    document: doc,
                    createdAt: Date.now(),
                })
            );
        } catch (e) {
            console.error('[Persistence] Failed to save snapshot:', e);
        }
    }, SAVE_DELAY);
}

export function loadSnapshot(): CanvasDocument | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem("canvas:snapshot");
    if (!raw) {
        console.log('[Persistence] No snapshot found');
        return null;
    }
    try {
        const doc = JSON.parse(raw).document;
        console.log('[Persistence] Loaded snapshot:', doc.id, 'Nodes:', Object.keys(doc.nodes).length, 'Version:', doc.version);
        return doc;
    } catch (e) {
        console.error("Failed to parse snapshot", e);
        return null;
    }
}
