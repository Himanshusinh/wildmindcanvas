import { CanvasDocument } from './document';
import { Operation } from './operations';

export function applyOperation(
    doc: CanvasDocument,
    op: Operation
): CanvasDocument {
    const next = structuredClone(doc);
    next.version++;
    next.updatedAt = Date.now();

    switch (op.type) {
        case "ADD_NODE":
            next.nodes[op.node.id] = op.node;
            break;

        case "UPDATE_NODE":
            if (next.nodes[op.id]) {
                next.nodes[op.id] = {
                    ...next.nodes[op.id],
                    ...op.patch,
                };
            }
            break;

        case "DELETE_NODE":
            delete next.nodes[op.id];
            break;

        case "SET_NODES":
            next.nodes = op.nodes;
            break;
    }

    return next;
}
