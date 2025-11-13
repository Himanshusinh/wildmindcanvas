/**
 * OpManager - Manages Canvas operations with optimistic updates and undo/redo
 * 
 * This module handles:
 * - Optimistic updates (apply ops locally before server confirms)
 * - Undo/redo stack management
 * - Op synchronization with server
 * - Conflict resolution
 */

import { appendOp, getOps, getSnapshot, CanvasOp } from './canvasApi';

export interface OpState {
  op: CanvasOp;
  applied: boolean;
  confirmed: boolean;
  opIndex?: number;
  timestamp: number;
}

export interface UndoRedoState {
  undoStack: OpState[];
  redoStack: OpState[];
  currentIndex: number;
}

export class OpManager {
  private projectId: string;
  private optimisticOps: Map<string, OpState> = new Map(); // requestId -> OpState
  private undoRedoState: UndoRedoState = {
    undoStack: [],
    redoStack: [],
    currentIndex: -1,
  };
  private lastOpIndex: number = -1;
  private isReplaying: boolean = false;
  private onOpApplied?: (op: CanvasOp, isOptimistic: boolean) => void;
  private onOpConfirmed?: (op: CanvasOp, opIndex: number) => void;
  private onOpRejected?: (op: CanvasOp, error: Error) => void;

  constructor(
    projectId: string,
    callbacks?: {
      onOpApplied?: (op: CanvasOp, isOptimistic: boolean) => void;
      onOpConfirmed?: (op: CanvasOp, opIndex: number) => void;
      onOpRejected?: (op: CanvasOp, error: Error) => void;
    }
  ) {
    this.projectId = projectId;
    this.onOpApplied = callbacks?.onOpApplied;
    this.onOpConfirmed = callbacks?.onOpConfirmed;
    this.onOpRejected = callbacks?.onOpRejected;
  }

  /**
   * Initialize OpManager by loading snapshot and replaying ops
   */
  async initialize(): Promise<void> {
    try {
      const { snapshot, ops, fromOp } = await getSnapshot(this.projectId);
      
      // Set last op index
      this.lastOpIndex = fromOp;

      // Apply snapshot (if exists)
      if (snapshot && snapshot.elements) {
        // Notify that snapshot should be applied
        // The caller should handle applying the snapshot to their state
        this.onOpApplied?.({ type: 'create', data: snapshot.elements } as CanvasOp, false);
      }

      // Replay ops after snapshot
      if (ops && ops.length > 0) {
        this.isReplaying = true;
        for (const op of ops) {
          await this.applyOp(op, false);
          if ((op as any).opIndex) {
            this.lastOpIndex = Math.max(this.lastOpIndex, (op as any).opIndex);
          }
        }
        this.isReplaying = false;
      }
    } catch (error) {
      console.error('Failed to initialize OpManager:', error);
      throw error;
    }
  }

  /**
   * Append a new operation (optimistic update)
   */
  async appendOp(op: CanvasOp): Promise<void> {
    // Generate requestId if not provided
    if (!op.requestId) {
      op.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Set client timestamp
    op.clientTs = Date.now();

    // Apply optimistically
    const opState: OpState = {
      op,
      applied: true,
      confirmed: false,
      timestamp: Date.now(),
    };

    this.optimisticOps.set(op.requestId, opState);
    await this.applyOp(op, true);

    // Add to undo stack (if not replaying)
    if (!this.isReplaying && op.type !== 'select') {
      this.undoRedoState.undoStack.push(opState);
      this.undoRedoState.redoStack = []; // Clear redo stack on new op
      this.undoRedoState.currentIndex = this.undoRedoState.undoStack.length - 1;
    }

    // Send to server
    try {
      const result = await appendOp(this.projectId, op);
      opState.confirmed = true;
      opState.opIndex = result.opIndex;
      this.lastOpIndex = Math.max(this.lastOpIndex, result.opIndex);

      // Remove from optimistic ops
      this.optimisticOps.delete(op.requestId);

      this.onOpConfirmed?.(op, result.opIndex);
    } catch (error: any) {
      // Op rejected by server - rollback
      console.error('Op rejected by server:', error);
      this.optimisticOps.delete(op.requestId);
      
      // Remove from undo stack
      const index = this.undoRedoState.undoStack.findIndex(s => s.op.requestId === op.requestId);
      if (index >= 0) {
        this.undoRedoState.undoStack.splice(index, 1);
        this.undoRedoState.currentIndex = this.undoRedoState.undoStack.length - 1;
      }

      // Apply inverse to rollback
      if (op.inverse) {
        await this.applyOp(op.inverse, false);
      }

      this.onOpRejected?.(op, error);
    }
  }

  /**
   * Apply an operation (optimistic or confirmed)
   */
  private async applyOp(op: CanvasOp, isOptimistic: boolean): Promise<void> {
    this.onOpApplied?.(op, isOptimistic);
  }

  /**
   * Undo last operation
   */
  async undo(): Promise<boolean> {
    if (this.undoRedoState.currentIndex < 0) {
      return false; // Nothing to undo
    }

    const opState = this.undoRedoState.undoStack[this.undoRedoState.currentIndex];
    
    // If op has inverse, apply it
    if (opState.op.inverse) {
      await this.applyOp(opState.op.inverse, false);
      
      // Move to redo stack
      this.undoRedoState.redoStack.push(opState);
      this.undoRedoState.undoStack.pop();
      this.undoRedoState.currentIndex--;

      // If op was confirmed, send inverse to server
      if (opState.confirmed && opState.opIndex !== undefined) {
        try {
          await appendOp(this.projectId, opState.op.inverse);
        } catch (error) {
          console.error('Failed to send undo op to server:', error);
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Redo last undone operation
   */
  async redo(): Promise<boolean> {
    if (this.undoRedoState.redoStack.length === 0) {
      return false; // Nothing to redo
    }

    const opState = this.undoRedoState.redoStack.pop()!;
    
    // Re-apply the op
    await this.applyOp(opState.op, false);
    
    // Move back to undo stack
    this.undoRedoState.undoStack.push(opState);
    this.undoRedoState.currentIndex = this.undoRedoState.undoStack.length - 1;

    // If op was confirmed, send to server again
    if (opState.confirmed && opState.opIndex !== undefined) {
      try {
        await appendOp(this.projectId, opState.op);
      } catch (error) {
        console.error('Failed to send redo op to server:', error);
      }
    }

    return true;
  }

  /**
   * Sync with server (fetch new ops)
   */
  async sync(): Promise<void> {
    try {
      const ops = await getOps(this.projectId, this.lastOpIndex + 1, 100);
      
      if (ops.length > 0) {
        this.isReplaying = true;
        for (const op of ops) {
          // Skip ops we already have optimistically
          if (!this.optimisticOps.has(op.requestId)) {
            await this.applyOp(op, false);
            if ((op as any).opIndex) {
              this.lastOpIndex = Math.max(this.lastOpIndex, (op as any).opIndex);
            }
          }
        }
        this.isReplaying = false;
      }
    } catch (error) {
      console.error('Failed to sync ops:', error);
    }
  }

  /**
   * Get current undo/redo state
   */
  getUndoRedoState(): { canUndo: boolean; canRedo: boolean } {
    return {
      canUndo: this.undoRedoState.currentIndex >= 0,
      canRedo: this.undoRedoState.redoStack.length > 0,
    };
  }

  /**
   * Get pending optimistic ops
   */
  getPendingOps(): OpState[] {
    return Array.from(this.optimisticOps.values()).filter(s => !s.confirmed);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.optimisticOps.clear();
    this.undoRedoState = {
      undoStack: [],
      redoStack: [],
      currentIndex: -1,
    };
  }
}

