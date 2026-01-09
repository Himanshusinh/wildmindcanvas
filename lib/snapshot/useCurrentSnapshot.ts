import { useState, useCallback } from "react";
import { setCurrentSnapshot } from "@/core/api/canvasApi";
import { CanvasSnapshot, CanvasElement } from "./currentSnapshot";

export function useCurrentSnapshot(initial: CanvasSnapshot, projectId: string | null) {
    const [snapshot, setSnapshot] = useState<CanvasSnapshot>(initial);

    const saveSnapshot = useCallback(async (next: CanvasSnapshot) => {
        setSnapshot(next);

        if (!projectId) return;

        try {
            await setCurrentSnapshot(projectId, {
                elements: next.elements,
                metadata: next.metadata
            });
        } catch (e) {
            console.error("Failed to save snapshot", e);
        }
    }, [projectId]);

    const createElement = useCallback((element: CanvasElement) => {
        saveSnapshot({
            ...snapshot,
            elements: {
                ...snapshot.elements,
                [element.id]: element,
            },
            metadata: {
                ...snapshot.metadata,
                updatedAt: Date.now(),
            },
        });
    }, [snapshot, saveSnapshot]);

    const updateElement = useCallback((id: string, patch: Partial<CanvasElement>) => {
        const existing = snapshot.elements[id];
        if (!existing) return;

        saveSnapshot({
            ...snapshot,
            elements: {
                ...snapshot.elements,
                [id]: { ...existing, ...patch },
            },
            metadata: {
                ...snapshot.metadata,
                updatedAt: Date.now(),
            },
        });
    }, [snapshot, saveSnapshot]);

    const deleteElement = useCallback((id: string) => {
        const { [id]: _, ...rest } = snapshot.elements;

        saveSnapshot({
            ...snapshot,
            elements: rest,
            metadata: {
                ...snapshot.metadata,
                updatedAt: Date.now(),
            },
        });
    }, [snapshot, saveSnapshot]);

    const loadSnapshot = useCallback((data: CanvasSnapshot | ((prev: CanvasSnapshot) => CanvasSnapshot)) => {
        setSnapshot((prev) => {
            const nextSnapshot = typeof data === 'function' ? data(prev) : data;
            return nextSnapshot;
        });
        // We don't save here - this is for hydration/sync
    }, []);

    return {
        snapshot,
        createElement,
        updateElement,
        deleteElement,
        loadSnapshot,
        saveSnapshot,
    };
}
