import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CanvasDocument, CanvasNode, NodeType } from './document';
import { HistoryManager } from './history';
import { Command, AddNodeCommand, UpdateNodeCommand, DeleteNodeCommand, MoveNodeCommand } from './commands';
import { applyOperation } from './reducer';
import { saveSnapshot, loadSnapshot } from './persistence';
import { nodeFromItem, itemFromNode, imageToNode, nodeToImage } from './adapters';
import {
    CanvasAppState, CanvasAppSetters,
    ImageGenerator, VideoGenerator, VideoEditorGenerator, MusicGenerator,
    UpscaleGenerator, MultiangleCameraGenerator, RemoveBgGenerator,
    EraseGenerator, ExpandGenerator, VectorizeGenerator,
    NextSceneGenerator, CompareGenerator, StoryboardGenerator,
    ScriptFrameGenerator, SceneFrameGenerator, TextGenerator, Connector
} from '@/modules/canvas-app/types';
import { ImageUpload } from '@/core/types/canvas';
import { CanvasTextState } from '@/modules/canvas-overlays/types';
import { GroupContainerState } from '@/core/types/groupContainer';


export function useCanvasStore(projectId: string | null) {
    // Core State
    const [doc, setDoc] = useState<CanvasDocument>({
        id: 'default',
        version: 0,
        nodes: {},
        createdAt: Date.now(),
        updatedAt: Date.now()
    });

    const docRef = useRef(doc);
    useEffect(() => { docRef.current = doc; }, [doc]);

    const historyRef = useRef(new HistoryManager());
    const [historyVersion, setHistoryVersion] = useState(0);

    // Initialization
    useEffect(() => {
        if (!projectId) return;
        const loaded = loadSnapshot();
        if (loaded) {
            setDoc(loaded);
        } else {
            setDoc(prev => ({ ...prev, id: projectId }));
        }
    }, [projectId]);

    // Persistence Auto-Save
    useEffect(() => {
        if (doc.version > 0) {
            saveSnapshot(doc);
        }
    }, [doc]);

    // Command Executor
    const execute = useCallback((cmd: Command) => {
        // Use ref to get latest doc without dependency cycle
        const nextDoc = historyRef.current.execute(cmd, docRef.current);
        setDoc(nextDoc);
        setHistoryVersion(v => v + 1);
    }, []);

    const undo = useCallback(() => {
        const nextDoc = historyRef.current.undo(docRef.current);
        setDoc(nextDoc);
        setHistoryVersion(v => v + 1);
    }, []);

    const redo = useCallback(() => {
        const nextDoc = historyRef.current.redo(docRef.current);
        setDoc(nextDoc);
        setHistoryVersion(v => v + 1);
    }, []);

    const nodesArray = useMemo(() => Object.values(doc.nodes), [doc.nodes]);

    const images = useMemo(() => nodesArray
        .filter(n => ['image', 'video', 'text', 'model3d'].includes(n.type))
        .map(n => nodeToImage(n)), [nodesArray]);

    const imageGenerators = useMemo(() => nodesArray.filter(n => n.type === 'image-generator').map(n => itemFromNode<ImageGenerator>(n)), [nodesArray]);
    const videoGenerators = useMemo(() => nodesArray.filter(n => n.type === 'video-generator').map(n => itemFromNode<VideoGenerator>(n)), [nodesArray]);
    const videoEditorGenerators = useMemo(() => nodesArray.filter(n => n.type === 'video-editor-plugin').map(n => itemFromNode<VideoEditorGenerator>(n)), [nodesArray]);
    const musicGenerators = useMemo(() => nodesArray.filter(n => n.type === 'music-generator').map(n => itemFromNode<MusicGenerator>(n)), [nodesArray]);
    const upscaleGenerators = useMemo(() => nodesArray.filter(n => n.type === 'upscale-plugin').map(n => itemFromNode<UpscaleGenerator>(n)), [nodesArray]);
    const multiangleCameraGenerators = useMemo(() => nodesArray.filter(n => n.type === 'multiangle-camera-plugin').map(n => itemFromNode<MultiangleCameraGenerator>(n)), [nodesArray]);
    const removeBgGenerators = useMemo(() => nodesArray.filter(n => n.type === 'removebg-plugin').map(n => itemFromNode<RemoveBgGenerator>(n)), [nodesArray]);
    const eraseGenerators = useMemo(() => nodesArray.filter(n => n.type === 'erase-plugin').map(n => itemFromNode<EraseGenerator>(n)), [nodesArray]);
    const expandGenerators = useMemo(() => nodesArray.filter(n => n.type === 'expand-plugin').map(n => itemFromNode<ExpandGenerator>(n)), [nodesArray]);
    const vectorizeGenerators = useMemo(() => nodesArray.filter(n => n.type === 'vectorize-plugin').map(n => itemFromNode<VectorizeGenerator>(n)), [nodesArray]);
    const nextSceneGenerators = useMemo(() => nodesArray.filter(n => n.type === 'next-scene-plugin').map(n => itemFromNode<NextSceneGenerator>(n)), [nodesArray]);
    const storyboardGenerators = useMemo(() => nodesArray.filter(n => n.type === 'storyboard-plugin').map(n => itemFromNode<StoryboardGenerator>(n)), [nodesArray]);
    const scriptFrameGenerators = useMemo(() => nodesArray.filter(n => n.type === 'script-frame').map(n => itemFromNode<ScriptFrameGenerator>(n)), [nodesArray]);
    const sceneFrameGenerators = useMemo(() => nodesArray.filter(n => n.type === 'scene-frame').map(n => itemFromNode<SceneFrameGenerator>(n)), [nodesArray]);
    const compareGenerators = useMemo(() => nodesArray.filter(n => n.type === 'compare-plugin').map(n => itemFromNode<CompareGenerator>(n)), [nodesArray]);
    const textGenerators = useMemo(() => nodesArray.filter(n => n.type === 'text-generator').map(n => itemFromNode<TextGenerator>(n)), [nodesArray]);
    const canvasTextStates = useMemo(() => nodesArray.filter(n => n.type === 'canvas-text').map(n => itemFromNode<CanvasTextState>(n)), [nodesArray]);
    const richTextStates = useMemo(() => nodesArray.filter(n => n.type === 'rich-text').map(n => itemFromNode<CanvasTextState>(n)), [nodesArray]);
    const groupContainerStates = useMemo(() => nodesArray.filter(n => n.type === 'group').map(n => itemFromNode<GroupContainerState>(n)), [nodesArray]);
    const connectors = useMemo(() => nodesArray.filter(n => n.type === 'connector').map(n => itemFromNode<Connector>(n)), [nodesArray]);

    const [generationQueue, setGenerationQueue] = useState<any[]>([]);

    // --- Compatible Setters ---
    // Make createSetter depend on execute (which is stable now)
    const createSetter = useCallback(<T extends { id?: string, elementId?: string }>(type: NodeType, currentList: T[]) => {
        return (action: React.SetStateAction<T[]>) => {
            let newList: T[];
            if (typeof action === 'function') {
                newList = (action as (prev: T[]) => T[])(currentList);
            } else {
                newList = action;
            }

            const currentIds = new Set(currentList.map(i => i.id || i.elementId || ''));
            const newMap = new Map(newList.map(i => [i.id || i.elementId || '', i]));
            const newIds = new Set(newMap.keys());

            // 1. Deletions
            currentList.forEach(item => {
                const id = item.id || item.elementId || '';
                if (!newIds.has(id)) {
                    execute(new DeleteNodeCommand(id));
                }
            });

            // 2. Additions & Updates
            newList.forEach(item => {
                const id = item.id || item.elementId || '';
                const oldItem = currentList.find(i => (i.id || i.elementId) === id);

                if (!oldItem) {
                    let node = (type === 'image' || type === 'model3d')
                        ? imageToNode(item as any)
                        : nodeFromItem(item, type);

                    if (!node.width) node.width = 400;
                    if (!node.height) node.height = 400;

                    execute(new AddNodeCommand(node));
                } else {
                    if (oldItem === item) return;

                    let newNode = (type === 'image' || type === 'model3d')
                        ? imageToNode(item as any)
                        : nodeFromItem(item, type);

                    if (!newNode.width) newNode.width = (oldItem as any).width || 400;
                    if (!newNode.height) newNode.height = (oldItem as any).height || 400;

                    const oldNode = (type === 'image' || type === 'model3d')
                        ? imageToNode(oldItem as any)
                        : nodeFromItem(oldItem, type);

                    execute(new UpdateNodeCommand(id, oldNode, newNode));
                }
            });
        };
    }, [execute]); // Depend only on execute

    return {
        images,
        imageGenerators,
        videoGenerators,
        videoEditorGenerators,
        musicGenerators,
        upscaleGenerators,
        multiangleCameraGenerators,
        removeBgGenerators,
        eraseGenerators,
        expandGenerators,
        vectorizeGenerators,
        nextSceneGenerators,
        compareGenerators,
        storyboardGenerators,
        scriptFrameGenerators,
        sceneFrameGenerators,
        textGenerators,
        canvasTextStates,
        richTextStates,
        groupContainerStates,
        connectors,
        generationQueue,
        showImageGenerationModal: false,

        setImages: createSetter('image', images),
        setImageGenerators: createSetter('image-generator', imageGenerators),
        setVideoGenerators: createSetter('video-generator', videoGenerators),
        setVideoEditorGenerators: createSetter('video-editor-plugin', videoEditorGenerators),
        setMusicGenerators: createSetter('music-generator', musicGenerators),
        setUpscaleGenerators: createSetter('upscale-plugin', upscaleGenerators),
        setMultiangleCameraGenerators: createSetter('multiangle-camera-plugin', multiangleCameraGenerators),
        setRemoveBgGenerators: createSetter('removebg-plugin', removeBgGenerators),
        setEraseGenerators: createSetter('erase-plugin', eraseGenerators),
        setExpandGenerators: createSetter('expand-plugin', expandGenerators),
        setVectorizeGenerators: createSetter('vectorize-plugin', vectorizeGenerators),
        setCompareGenerators: createSetter('compare-plugin', compareGenerators),
        setNextSceneGenerators: createSetter('next-scene-plugin', nextSceneGenerators),
        setStoryboardGenerators: createSetter('storyboard-plugin', storyboardGenerators),
        setScriptFrameGenerators: createSetter('script-frame', scriptFrameGenerators),
        setSceneFrameGenerators: createSetter('scene-frame', sceneFrameGenerators),
        setTextGenerators: createSetter('text-generator', textGenerators),
        setCanvasTextStates: createSetter('canvas-text', canvasTextStates),
        setRichTextStates: createSetter('rich-text', richTextStates),
        setGroupContainerStates: createSetter('group', groupContainerStates),
        setConnectors: createSetter('connector', connectors),

        setGenerationQueue,
        setShowImageGenerationModal: () => { },

        doc,
        execute,
        undo,
        redo,
        canUndo: historyRef.current.undoStack.length > 0,
        canRedo: historyRef.current.redoStack.length > 0,
    };
}
