/**
 * React hook for managing Canvas operations with OpManager
 */

import { useEffect, useRef, useState } from 'react';
import { OpManager, OpState } from '@/lib/opManager';
import { CanvasOp } from '@/lib/canvasApi';

interface UseOpManagerOptions {
  projectId: string | null;
  onOpApplied?: (op: CanvasOp, isOptimistic: boolean) => void;
  enabled?: boolean;
}

export function useOpManager({ projectId, onOpApplied, enabled = true }: UseOpManagerOptions) {
  const opManagerRef = useRef<OpManager | null>(null);
  const onOpAppliedRef = useRef(onOpApplied);
  const initializingRef = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [pendingOps, setPendingOps] = useState<OpState[]>([]);

  // Keep callback ref up to date without triggering re-initialization
  useEffect(() => {
    onOpAppliedRef.current = onOpApplied;
  }, [onOpApplied]);

  // Initialize OpManager when projectId is available
  useEffect(() => {
    if (!projectId || !enabled) {
      opManagerRef.current?.destroy();
      opManagerRef.current = null;
      setIsInitialized(false);
      initializingRef.current = false;
      return;
    }

    // Prevent multiple simultaneous initializations
    if (initializingRef.current || opManagerRef.current) {
      return;
    }

    initializingRef.current = true;

    const opManager = new OpManager(projectId, { 
      onOpApplied: (op, isOptimistic) => {
        // Use ref to get latest callback without causing re-renders
        onOpAppliedRef.current?.(op, isOptimistic);
        // Update undo/redo state
        const state = opManager.getUndoRedoState();
        setCanUndo(state.canUndo);
        setCanRedo(state.canRedo);
        // Update pending ops
        setPendingOps(opManager.getPendingOps());
      },
      onOpConfirmed: (op, opIndex) => {
        const state = opManager.getUndoRedoState();
        setCanUndo(state.canUndo);
        setCanRedo(state.canRedo);
        setPendingOps(opManager.getPendingOps());
      },
      onOpRejected: (op, error) => {
        console.error('Op rejected:', error);
        setPendingOps(opManager.getPendingOps());
      },
      // Run in local-only mode: do not sync with server /ops
      serverSync: false,
    });

    opManagerRef.current = opManager;

    // Initialize (load snapshot and replay ops)
    // Sync interval will start only after initialization completes
    let syncInterval: NodeJS.Timeout | null = null;
    
    opManager.initialize().then(() => {
      setIsInitialized(true);
      initializingRef.current = false;
      const state = opManager.getUndoRedoState();
      setCanUndo(state.canUndo);
      setCanRedo(state.canRedo);
      
      // Start sync interval only after initialization is complete
      // This prevents excessive requests during initialization
      syncInterval = setInterval(() => {
        if (opManager && !(opManager as any).isReplaying) {
          opManager.sync().catch((error) => {
            console.error('Failed to sync ops:', error);
          });
        }
      }, 30000); // Sync every 30 seconds (reduced from 5 seconds)
    }).catch((error) => {
      console.error('Failed to initialize OpManager:', error);
      initializingRef.current = false;
    });

    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
      opManager.destroy();
      opManagerRef.current = null;
      setIsInitialized(false);
      initializingRef.current = false;
    };
  }, [projectId, enabled]); // Removed onOpApplied from dependencies

  // Append operation
  const appendOp = async (op: Omit<CanvasOp, 'id' | 'opIndex' | 'createdAt' | 'projectId' | 'actorUid' | 'requestId' | 'clientTs'>) => {
    if (!opManagerRef.current) {
      throw new Error('OpManager not initialized');
    }
    // OpManager will add requestId and clientTs automatically
    try {
      const kind = (op as any)?.type;
      const meta = (op as any)?.elementId || (op as any)?.elementIds?.length || '';
      console.log('[Ops] append', kind, meta);
    } catch {}
    await opManagerRef.current.appendOp(op as CanvasOp);
  };

  // Undo
  const undo = async () => {
    if (!opManagerRef.current) return false;
    console.log('[Ops] undo requested');
    const result = await opManagerRef.current.undo();
    const state = opManagerRef.current.getUndoRedoState();
    setCanUndo(state.canUndo);
    setCanRedo(state.canRedo);
    console.log('[Ops] undo result:', result, 'canUndo:', state.canUndo, 'canRedo:', state.canRedo);
    return result;
  };

  // Redo
  const redo = async () => {
    if (!opManagerRef.current) return false;
    console.log('[Ops] redo requested');
    const result = await opManagerRef.current.redo();
    const state = opManagerRef.current.getUndoRedoState();
    setCanUndo(state.canUndo);
    setCanRedo(state.canRedo);
    console.log('[Ops] redo result:', result, 'canUndo:', state.canUndo, 'canRedo:', state.canRedo);
    return result;
  };

  // Sync manually
  const sync = async () => {
    if (!opManagerRef.current) return;
    await opManagerRef.current.sync();
  };

  return {
    opManager: opManagerRef.current,
    isInitialized,
    canUndo,
    canRedo,
    pendingOps,
    appendOp,
    undo,
    redo,
    sync,
  };
}

