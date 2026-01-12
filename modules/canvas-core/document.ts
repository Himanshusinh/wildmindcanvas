export type NodeType =
    | "image"
    | "video"
    | "audio"
    | "text"
    | "plugin"
    | "music"
    | "model3d"
    | "connector"
    | "group"
    | "canvas-text"
    | "rich-text"
    | "image-generator"
    | "video-generator"
    | "video-editor-plugin"
    | "image-editor-plugin"
    | "music-generator"
    | "upscale-plugin"
    | "multiangle-camera-plugin"
    | "removebg-plugin"
    | "erase-plugin"
    | "expand-plugin"
    | "vectorize-plugin"
    | "next-scene-plugin"
    | "storyboard-plugin"
    | "script-frame"
    | "scene-frame"
    | "compare-plugin"
    | "text-generator";

export interface CanvasNode {
    id: string;
    type: NodeType;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    zIndex: number;
    props: Record<string, any>;
}

export interface CanvasDocument {
    id: string;
    version: number;
    nodes: Record<string, CanvasNode>;
    createdAt: number;
    updatedAt: number;
}
