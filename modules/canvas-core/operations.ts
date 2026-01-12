import { CanvasNode } from './document';

export type Operation =
    | { type: "ADD_NODE"; node: CanvasNode }
    | { type: "UPDATE_NODE"; id: string; patch: Partial<CanvasNode> }
    | { type: "DELETE_NODE"; id: string }
    | { type: "SET_NODES"; nodes: Record<string, CanvasNode> }; // Bulk set for loading/sync
