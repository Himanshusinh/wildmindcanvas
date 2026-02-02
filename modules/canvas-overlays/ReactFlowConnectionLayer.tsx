'use client';

import React, { useMemo, useEffect, useCallback } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    Node,
    Edge,
    useReactFlow,
    useNodesState,
    useEdgesState,
    Background,
    Controls,
    MiniMap,
    ConnectionMode,
    NodeChange,
    applyNodeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Connection, ActiveDrag } from './types';
import Konva from 'konva';
import { ImageNode } from './nodes/ImageNode';
import { useImageStore } from '@/modules/stores';

// Define custom node types
const nodeTypes = {
    image: ImageNode,
};

// We'll define the CSS variables in a style tag to override default React Flow theming
// matching the wildmind aesthetics
const THEME_STYLES = `
  .react-flow {
    --xy-edge-stroke-default: #4C83FF;
    --xy-edge-stroke-width-default: 2;
    --xy-edge-stroke-selected-default: #4C83FF;
    
    /* Connection line styling */
    --xy-connectionline-stroke-default: #4C83FF;
    --xy-connectionline-stroke-width-default: 2;
  }

  /* Custom styling for selected edges to match the dashed look */
  .react-flow__edge.selected .react-flow__edge-path {
    stroke-width: 3 !important;
    stroke-dasharray: 5 5;
  }

  /* Animations for generating edges */
  .react-flow__edge.animated .react-flow__edge-path {
    animation: dashdraw 0.5s linear infinite;
    stroke-dasharray: 5;
  }
`;

interface ReactFlowConnectionLayerProps {
    connections: Connection[];
    activeDrag: ActiveDrag | null;
    selectedConnectionId: string | null;
    onSelectConnection: (id: string | null) => void;
    onDeleteConnection?: (id: string) => void;
    stageRef: React.RefObject<Konva.Stage | null>;
    position: { x: number; y: number };
    scale: number;
    textInputStates: any[];
    imageModalStates: any[];
    videoModalStates: any[];
    musicModalStates: any[];
    upscaleModalStates?: any[];
    multiangleCameraModalStates?: any[];
    removeBgModalStates?: any[];
    eraseModalStates?: any[];
    expandModalStates?: any[];
    vectorizeModalStates?: any[];
    nextSceneModalStates?: any[];
    storyboardModalStates?: any[];
    scriptFrameModalStates?: any[];
    sceneFrameModalStates?: any[];
    viewportUpdateKey: number;
    isInteracting?: boolean;
    // Props needed for ImageModal
    onImageGenerate?: any;
    onAddImageToCanvas?: any;
    onPersistImageModalCreate?: any;
    onPersistImageModalMove?: any;
    onPersistImageModalDelete?: any;
    onPersistConnectorCreate?: any;
    clearAllSelections?: any;
    images?: any[];
    isChatOpen?: boolean;
    selectedIds?: string[];
    selectionOrder?: any;
    isComponentDraggable?: (id: string) => boolean;
}

const ReactFlowInner: React.FC<ReactFlowConnectionLayerProps & { initialNodes: Node[]; initialEdges: Edge[] }> = ({
    initialNodes,
    initialEdges,
    position,
    scale,
    onSelectConnection,
    selectedConnectionId,
    onPersistImageModalMove,
}) => {
    const { setViewport } = useReactFlow();
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const updateImageModal = useImageStore(state => state.updateImageModal);

    // Sync props to internal state
    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    // Sync viewport with canvas position
    useEffect(() => {
        setViewport({ x: position.x, y: position.y, zoom: scale }, { duration: 0 });
    }, [position.x, position.y, scale, setViewport]);

    // Handle node changes (position updates from dragging)
    const handleNodesChange = useCallback(
        (changes: NodeChange[]) => {
            onNodesChange(changes);

            // Handle position changes to sync back to store
            changes.forEach((change) => {
                if (change.type === 'position' && change.position) {
                    if (change.id.startsWith('image-')) {
                        // Update local store immediately for responsiveness
                        updateImageModal(change.id, { x: change.position.x, y: change.position.y });

                        // Persist to backend (debounced or onDragStop ideally, but direct here for now)
                        if (!change.dragging && onPersistImageModalMove) {
                            onPersistImageModalMove(change.id, { x: change.position.x, y: change.position.y });
                        }
                    }
                }
            });
        },
        [onNodesChange, updateImageModal, onPersistImageModalMove]
    );

    const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
        if (node.type === 'image' && onPersistImageModalMove) {
            onPersistImageModalMove(node.id, { x: node.position.x, y: node.position.y });
        }
    }, [onPersistImageModalMove]);

    return (
        <>
            <style>{THEME_STYLES}</style>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDragStop={onNodeDragStop}
                nodeTypes={nodeTypes}
                // Enable loose connection mode to allow any handle to connect to any handle
                connectionMode={ConnectionMode.Loose}

                // Enable interactions
                nodesDraggable={true}
                nodesConnectable={true}
                elementsSelectable={true}

                // Synced viewport means we disable React Flow's native panning/zooming
                // The user pans/zooms via the Konva canvas (wrapper), and we sync that here
                zoomOnScroll={false}
                panOnScroll={false}
                zoomOnDoubleClick={false}
                panOnDrag={false}
                preventScrolling={false}

                proOptions={{ hideAttribution: true }}
                fitView={false}
                onEdgeClick={(event, edge) => {
                    event.stopPropagation();
                    onSelectConnection(edge.selected ? null : edge.id);
                }}
                onPaneClick={() => {
                    onSelectConnection(null);
                }}
            >
                <Background />
            </ReactFlow>
        </>
    );
};

export const ReactFlowConnectionLayer: React.FC<ReactFlowConnectionLayerProps> = (props) => {
    const {
        connections,
        activeDrag,
        selectedConnectionId,
        imageModalStates,
        // ... other states
        videoModalStates,
        musicModalStates,
        upscaleModalStates,
        removeBgModalStates,
        eraseModalStates,
        expandModalStates,
        vectorizeModalStates,
        nextSceneModalStates,
        scriptFrameModalStates,
        textInputStates,
        storyboardModalStates,
        sceneFrameModalStates,
        // Props to pass down
        onImageGenerate,
        onAddImageToCanvas,
        onPersistImageModalCreate,
        onPersistImageModalMove,
        onPersistImageModalDelete,
        onPersistConnectorCreate,
        clearAllSelections
    } = props;

    // Track which nodes are generating (for animation)
    const generatingNodeIds = useMemo(() => {
        const ids = new Set<string>();
        imageModalStates?.forEach(modal => {
            if (modal?.id && modal.isGenerating) ids.add(modal.id);
        });
        // ... other generation logic
        return ids;
    }, [imageModalStates]);

    // Create nodes from all modal states
    const nodes: Node[] = useMemo(() => {
        const allNodes: Node[] = [];

        // --- Image Nodes ---
        imageModalStates.forEach(modal => {
            allNodes.push({
                id: modal.id,
                type: 'image', // Use our custom node
                position: { x: modal.x, y: modal.y },
                data: {
                    modalProps: {
                        ...modal, // Pass all modal state properties
                        // Pass actions/callbacks
                        onGenerate: onImageGenerate, // fix prop mapping
                        onImageGenerate,
                        onAddToCanvas: onAddImageToCanvas,
                        onPersistImageModalCreate,
                        onPersistImageModalMove,
                        onPersistImageModalDelete,
                        onPersistConnectorCreate,
                        clearAllSelections,
                        // Pass context refs
                        stageRef: props.stageRef,
                        scale: props.scale,
                        position: props.position,
                    }
                },
                style: {
                    // Ensure it has dimensions, though ImageUploadModal usually sets its own size
                    width: modal.frameWidth || 600,
                    height: modal.frameHeight || 600,
                }
            });
        });

        // --- Other Nodes (Placeholder for now, keep invisible anchors until migrated) ---
        const addInvisibleNode = (id: string, x: number, y: number) => {
            if (!allNodes.find(n => n.id === id)) {
                allNodes.push({
                    id,
                    position: { x, y },
                    data: { label: '' },
                    style: { opacity: 0, width: 1, height: 1, padding: 0, border: 'none', pointerEvents: 'none' },
                    type: 'default',
                });
            }
        };

        [
            ...videoModalStates,
            ...musicModalStates,
            ...(upscaleModalStates || []),
            ...(removeBgModalStates || []),
            ...(eraseModalStates || []),
            ...(expandModalStates || []),
            ...(vectorizeModalStates || []),
            ...(nextSceneModalStates || []),
            ...(scriptFrameModalStates || []),
            ...(textInputStates || []),
            ...(storyboardModalStates || []),
            ...(sceneFrameModalStates || []),
        ].forEach(modal => {
            if (modal?.id && modal.x !== undefined && modal.y !== undefined) {
                addInvisibleNode(modal.id, modal.x, modal.y);
            }
        });

        // Add drag target node
        if (activeDrag) {
            addInvisibleNode('drag-target', activeDrag.currentX, activeDrag.currentY);
        }

        return allNodes;
    }, [
        imageModalStates,
        // ... deps
        videoModalStates,
        musicModalStates,
        upscaleModalStates,
        removeBgModalStates,
        eraseModalStates,
        expandModalStates,
        vectorizeModalStates,
        nextSceneModalStates,
        scriptFrameModalStates,
        textInputStates,
        storyboardModalStates,
        sceneFrameModalStates,
        activeDrag,
        // callbacks
        onImageGenerate, onAddImageToCanvas, onPersistImageModalCreate, onPersistImageModalMove, onPersistImageModalDelete, onPersistConnectorCreate, clearAllSelections, props.stageRef, props.scale, props.position
    ]);

    // Convert connections to React Flow edges
    const edges: Edge[] = useMemo(() => {
        const allEdges: Edge[] = connections.map((conn, index) => {
            const edgeId = conn.id || `conn-${conn.from}-${conn.to}-${index}`;
            const isSelected = selectedConnectionId === edgeId;
            const isGenerating = generatingNodeIds.has(conn.to);

            return {
                id: edgeId,
                source: conn.from,
                target: conn.to,
                type: 'default',
                animated: isGenerating,
                selected: isSelected,
            };
        });

        if (activeDrag) {
            allEdges.push({
                id: 'active-drag',
                source: activeDrag.from,
                target: 'drag-target',
                type: 'default',
                animated: true,
                style: { strokeDasharray: '5 5' },
            });
        }

        return allEdges;
    }, [connections, generatingNodeIds, selectedConnectionId, activeDrag]);

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'auto', // Important: must be auto to interact with nodes
                zIndex: 1000,
            }}
        >
            <ReactFlowProvider>
                <ReactFlowInner {...props} initialNodes={nodes} initialEdges={edges} />
            </ReactFlowProvider>
        </div>
    );
};
