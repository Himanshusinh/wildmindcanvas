import { CanvasNode, NodeType } from './document';
import { ImageUpload } from '@/core/types/canvas';
import {
    ImageGenerator, VideoGenerator, VideoEditorGenerator, MusicGenerator,
    UpscaleGenerator, MultiangleCameraGenerator, RemoveBgGenerator,
    EraseGenerator, ExpandGenerator, VectorizeGenerator,
    NextSceneGenerator, CompareGenerator, StoryboardGenerator,
    ScriptFrameGenerator, SceneFrameGenerator, TextGenerator, Connector
} from '@/modules/canvas-app/types';

// Generic Adapter Helper
export const nodeFromItem = (item: any, type: NodeType): CanvasNode => {
    const { id, elementId, x, y, width, height, rotation, zIndex, ...rest } = item;
    return {
        id: id || elementId,
        type,
        x: x || 0,
        y: y || 0,
        width: width || 0,
        height: height || 0,
        rotation: rotation || 0,
        zIndex: zIndex || 0,
        props: rest
    };
};

export const itemFromNode = <T>(node: CanvasNode): T => {
    return {
        id: node.id,
        elementId: node.id,
        type: node.type,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        rotation: node.rotation,
        zIndex: node.zIndex,
        ...node.props
    } as unknown as T;
};

// Specific Adapters (if needed for special mapping)
export const imageToNode = (img: ImageUpload): CanvasNode => {
    const { elementId, type, x, y, width, height, ...props } = img;
    return {
        id: elementId || '',
        type: type as NodeType,
        x: x || 0,
        y: y || 0,
        width: width || 0,
        height: height || 0,
        rotation: 0,
        zIndex: 0, // Default
        props
    };
};

export const nodeToImage = (node: CanvasNode): ImageUpload => {
    return {
        elementId: node.id,
        type: node.type as any,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        ...node.props
    } as ImageUpload;
};
