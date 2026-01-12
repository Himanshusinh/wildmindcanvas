import { Command } from './commands';
import { CanvasDocument } from './document';

export class HistoryManager {
    undoStack: Command[] = [];
    redoStack: Command[] = [];

    execute(cmd: Command, doc: CanvasDocument): CanvasDocument {
        const next = cmd.do(doc);
        this.undoStack.push(cmd);
        this.redoStack = [];
        return next;
    }

    undo(doc: CanvasDocument): CanvasDocument {
        const cmd = this.undoStack.pop();
        if (!cmd) return doc;
        this.redoStack.push(cmd);
        return cmd.undo(doc);
    }

    redo(doc: CanvasDocument): CanvasDocument {
        const cmd = this.redoStack.pop();
        if (!cmd) return doc;
        this.undoStack.push(cmd);
        return cmd.do(doc);
    }
}
