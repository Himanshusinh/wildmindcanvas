import { CanvasDocument } from './document';

export interface Snapshot {
    document: CanvasDocument;
    createdAt: number;
}

// Debounce timer
let saveTimeout: NodeJS.Timeout | null = null;
const SAVE_DELAY = 50; // 50ms debounce for responsive but non-blocking saves

// Store timeout per projectId to prevent cross-project interference
const saveTimeouts = new Map<string, NodeJS.Timeout>();

export function saveSnapshot(doc: CanvasDocument, projectId: string | null) {
    if (typeof window === 'undefined') return;
    if (!projectId) return; // Don't save if no projectId

    // Clear existing timer for this project
    const existingTimeout = saveTimeouts.get(projectId);
    if (existingTimeout) {
        clearTimeout(existingTimeout);
    }

    // Set new timer for this project
    const timeout = setTimeout(() => {
        console.log('[Persistence] Saving snapshot (Debounced):', projectId, 'Nodes:', Object.keys(doc.nodes).length, 'Version:', doc.version);
        try {
            // Use project-specific key
            const key = `canvas:snapshot:${projectId}`;
            localStorage.setItem(
                key,
                JSON.stringify({
                    document: doc,
                    createdAt: Date.now(),
                })
            );
            saveTimeouts.delete(projectId);
        } catch (e) {
            console.error('[Persistence] Failed to save snapshot:', e);
            saveTimeouts.delete(projectId);
        }
    }, SAVE_DELAY);
    
    saveTimeouts.set(projectId, timeout);
}

export function loadSnapshot(projectId: string | null): CanvasDocument | null {
    if (typeof window === 'undefined') return null;
    if (!projectId) return null; // Don't load if no projectId

    // Use project-specific key
    const key = `canvas:snapshot:${projectId}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
        console.log('[Persistence] No snapshot found for project:', projectId);
        return null;
    }
    try {
        const doc = JSON.parse(raw).document;
        console.log('[Persistence] Loaded snapshot for project:', projectId, 'Nodes:', Object.keys(doc.nodes).length, 'Version:', doc.version);
        return doc;
    } catch (e) {
        console.error("Failed to parse snapshot", e);
        return null;
    }
}
