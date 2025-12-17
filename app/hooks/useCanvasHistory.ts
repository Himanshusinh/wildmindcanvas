import { useState, useRef, useCallback } from 'react';
import _ from 'lodash';

// Define the shape of our canvas state
// This should include ALL state that needs to be undoable
export interface CanvasHistoryState {
    images: any[];
    canvasTextStates: any[];
    textInputStates: any[];
    imageModalStates: any[];
    videoModalStates: any[];
    musicModalStates: any[];
    storyboardModalStates: any[];
    scriptFrameModalStates: any[];
    sceneFrameModalStates: any[];
    connections: any[];
    upscaleModalStates: any[];
    removeBgModalStates: any[];
    eraseModalStates: any[];
    expandModalStates: any[];
    vectorizeModalStates: any[];
    nextSceneModalStates: any[];
    videoEditorModalStates: any[];
}

export const useCanvasHistory = (
    initialState: CanvasHistoryState,
    onRestore: (state: CanvasHistoryState) => void
) => {
    // We use refs for history to mutable update without triggering re-renders of the hook itself
    // However, we need a refined approach:
    // When we Undo/Redo, we call onRestore which updates the PARENT state.
    // When the Parent state updates, we don't want to record that as a new history entry automatically.
    // Use an explicit "record" function.

    const historyRef = useRef<CanvasHistoryState[]>([_.cloneDeep(initialState)]);
    const indexRef = useRef<number>(0);

    // Limits history size to prevent memory issues
    const MAX_HISTORY = 50;

    const record = useCallback((newState: CanvasHistoryState) => {
        // If we are not at the end of history, discard future
        if (indexRef.current < historyRef.current.length - 1) {
            historyRef.current = historyRef.current.slice(0, indexRef.current + 1);
        }

        // Deep clone to ensure we store a snapshot, not a reference
        const snapshot = _.cloneDeep(newState);

        // Push new state
        historyRef.current.push(snapshot);

        // Limit size
        if (historyRef.current.length > MAX_HISTORY) {
            historyRef.current.shift();
        } else {
            indexRef.current += 1;
        }

        console.log(`[History] Recorded state. Index: ${indexRef.current}, Total: ${historyRef.current.length}`);
    }, []);

    const undo = useCallback(() => {
        if (indexRef.current > 0) {
            indexRef.current -= 1;
            const previousState = historyRef.current[indexRef.current];
            console.log(`[History] Undo to index: ${indexRef.current}`);
            // Restore state
            // Deep clone again on restore to protect history from subsequent mutations before next record
            onRestore(_.cloneDeep(previousState));
        }
    }, [onRestore]);

    const redo = useCallback(() => {
        if (indexRef.current < historyRef.current.length - 1) {
            indexRef.current += 1;
            const nextState = historyRef.current[indexRef.current];
            console.log(`[History] Redo to index: ${indexRef.current}`);
            onRestore(_.cloneDeep(nextState));
        }
    }, [onRestore]);

    return {
        record,
        undo,
        redo,
        canUndo: indexRef.current > 0,
        canRedo: indexRef.current < historyRef.current.length - 1
    };
};