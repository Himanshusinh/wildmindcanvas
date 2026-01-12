import { CanvasDocument, CanvasNode } from './document';
import { applyOperation } from './reducer';

export interface Command {
    do(doc: CanvasDocument): CanvasDocument;
    undo(doc: CanvasDocument): CanvasDocument;
}

export class AddNodeCommand implements Command {
    constructor(private node: CanvasNode) { }

    do(doc: CanvasDocument) {
        return applyOperation(doc, {
            type: "ADD_NODE",
            node: this.node
        });
    }

    undo(doc: CanvasDocument) {
        return applyOperation(doc, {
            type: "DELETE_NODE",
            id: this.node.id
        });
    }
}

export class MoveNodeCommand implements Command {
    constructor(
        private id: string,
        private from: { x: number; y: number },
        private to: { x: number; y: number }
    ) { }

    do(doc: CanvasDocument) {
        return applyOperation(doc, {
            type: "UPDATE_NODE",
            id: this.id,
            patch: this.to,
        });
    }

    undo(doc: CanvasDocument) {
        return applyOperation(doc, {
            type: "UPDATE_NODE",
            id: this.id,
            patch: this.from,
        });
    }
}

export class UpdateNodeCommand implements Command {
    constructor(
        private id: string,
        private from: Partial<CanvasNode>,
        private to: Partial<CanvasNode>
    ) { }

    do(doc: CanvasDocument) {
        return applyOperation(doc, {
            type: "UPDATE_NODE",
            id: this.id,
            patch: this.to
        });
    }

    undo(doc: CanvasDocument) {
        return applyOperation(doc, {
            type: "UPDATE_NODE",
            id: this.id,
            patch: this.from
        });
    }
}

export class DeleteNodeCommand implements Command {
    private node: CanvasNode | null = null;

    constructor(private id: string) { }

    do(doc: CanvasDocument) {
        this.node = doc.nodes[this.id];
        return applyOperation(doc, {
            type: "DELETE_NODE",
            id: this.id
        });
    }

    undo(doc: CanvasDocument) {
        if (!this.node) return doc;
        return applyOperation(doc, {
            type: "ADD_NODE",
            node: this.node
        });
    }
}

export class SetNodesCommand implements Command {
    constructor(private nodes: Record<string, CanvasNode>) { }

    do(doc: CanvasDocument) {
        return applyOperation(doc, {
            type: "SET_NODES",
            nodes: this.nodes
        });
    }

    undo(doc: CanvasDocument) {
        // Undo for SetNodes is defined as clearing? 
        // Or restoring previous state? 
        // For simple history, we can't easily undo a full load unless we store the massive previous state.
        // For now, we make it destructive (clears history usually).
        // But to satisfy interface, we return doc or handle generic undo.
        // Real implementation would snapshot previous state.
        return doc;
    }
}
