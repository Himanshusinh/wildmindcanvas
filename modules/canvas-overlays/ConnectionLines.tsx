'use client';

import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ReactFlow,
  useReactFlow,
  Background,
  Controls,
  Edge,
  Node,
  ReactFlowProvider,
  Handle,
  Position,
  MarkerType,
  BaseEdge,
  getBezierPath,
  EdgeProps,
  EdgeLabelRenderer,
  Panel,
  MiniMap,
  EdgeToolbar,
  EdgeTypes
} from '@xyflow/react';
import { getComponentConfig } from './ComponentConfig';
import { Scissors } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import './ConnectionLines.css';
import { Connection, ActiveDrag } from './types';
import {
  useImageModalStates,
  useVideoModalStates,
  useMusicModalStates,
  useTextModalStates,
  useUpscaleModalStates,
  useRemoveBgModalStates,
  useMultiangleCameraModalStates,
  useEraseModalStates,
  useExpandModalStates,
  useVectorizeModalStates,
  useNextSceneModalStates,
  useStoryboardModalStates,
  useCompareModalStates,
  useImageEditorModalStates,
  useVideoEditorModalStates,
  useSelectedImageModalIds,
  useSelectedVideoModalIds,
  useSelectedMusicModalIds,
  useSelectedTextModalIds,
  useImageStore,
  useVideoStore,
  useMusicStore,
  useTextStore
} from '@/modules/stores';
import { getComponentType } from './utils';
import { useComponentMenuStore } from '@/modules/stores/componentMenuStore';


// --- Configuration ---
const handleStyle = {
  width: 24,
  height: 24,
  backgroundColor: '#fff',
  border: '2px solid #777',
  borderRadius: '50%',
  zIndex: 100,
  pointerEvents: 'auto' as const,
  cursor: 'crosshair !important' as any,
};

// --- Ghost Node Component ---
const GhostNode = React.memo(({ data, isConnectable }: any) => {
  const { id, type, isHovered, isSelected, isValidTarget, isHandleHovered, isConnecting, isSource, hasConnections, checkConnectionValidity } = data;

  // Use store actions with selectors to prevent unnecessary re-renders of the GhostNode
  const updateImageModal = useImageStore(s => s.updateImageModal);
  const updateVideoModal = useVideoStore(s => s.updateVideoModal);
  const updateMusicModal = useMusicStore(s => s.updateMusicModal);
  const updateTextModal = useTextStore(s => s.updateTextModal);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const syncHover = useCallback((hovered: boolean) => {
    if (!id) return;
    const updates = { isHandleHovered: hovered };
    switch (type) {
      case 'image': updateImageModal(id, updates); break;
      case 'video': updateVideoModal(id, updates); break;
      case 'music': updateMusicModal(id, updates); break;
      case 'text': updateTextModal(id, updates); break;
    }
  }, [id, type, updateImageModal, updateVideoModal, updateMusicModal, updateTextModal]);

  const requestHoverState = useCallback((next: boolean) => {
    if (next) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      syncHover(true);
    } else {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = setTimeout(() => {
        syncHover(false);
        hoverTimeoutRef.current = null;
      }, 150);
    }
  }, [syncHover]);



  const isPlugin = !['text', 'image', 'video', 'music'].includes(type);
  const showHandles = isPlugin || isHovered || isSelected || (isConnecting && (isValidTarget || isSource)) || isHandleHovered || hasConnections;

  if (!showHandles) {
    return (
      <div
        style={{ width: '100%', height: '100%', pointerEvents: 'none', position: 'absolute', top: 0, left: 0 }}
        onMouseEnter={() => syncHover(true)}
      />
    );
  }

  const useOffset = ['image', 'video', 'music', 'text'].includes(type);
  const rightHandleTop = useOffset ? '20%' : '50%';
  const leftHandleTop = useOffset ? '80%' : '50%';

  return (
    <div
      data-node-id={id}
      data-component-type={type}
      style={{ width: '100%', height: '100%', pointerEvents: 'none', position: 'relative' }}
    >
      <div
        style={{ position: 'absolute', right: -24, top: rightHandleTop, transform: 'translateY(-50%)', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'all', cursor: 'crosshair !important' } as any}
        onMouseEnter={() => requestHoverState(true)}
        onMouseLeave={() => requestHoverState(false)}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Handle
          type="source"
          position={Position.Right}
          style={{ ...handleStyle, right: 0, zIndex: 9999 }}
          id="send"
          isConnectable={isConnectable}
          isValidConnection={(connection) => checkConnectionValidity(connection.source, connection.target)}
        />
      </div>
      <div
        style={{ position: 'absolute', left: -24, top: leftHandleTop, transform: 'translateY(-50%)', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'all', cursor: 'crosshair !important' } as any}
        onMouseEnter={() => requestHoverState(true)}
        onMouseLeave={() => requestHoverState(false)}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Handle
          type="target"
          position={Position.Left}
          style={{ ...handleStyle, left: 0, zIndex: 9999 }}
          id="receive"
          isConnectable={isConnectable}
          isValidConnection={(connection) => checkConnectionValidity(connection.source, connection.target)}
        />
      </div>
    </div>
  );
});

// --- Scissors Edge Component ---
const ScissorsEdge = (props: EdgeProps) => {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected } = props;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition
  });

  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ ...props.style, strokeWidth: isHovered || selected ? 4 : 2 }}
        markerStart={props.markerStart}
        markerEnd={props.markerEnd}
        interactionWidth={props.interactionWidth}
      />
      <g
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ pointerEvents: 'all' }}
      >
        {/* Transparent thick path for easier hovering */}
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={20}
        />
        <EdgeToolbar
          edgeId={id}
          x={labelX}
          y={labelY}
          isVisible={isHovered || selected}
          style={{ pointerEvents: 'all' }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              (data as any)?.onDelete?.(id);
            }}
            style={{
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              color: '#ff4d4f',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            className="scissors-delete-btn"
            title="Delete Connection"
          >
            <Scissors size={16} />
          </button>
        </EdgeToolbar>
      </g>
    </>
  );
};

const nodeTypes = { ghost: GhostNode };
const edgeTypes: EdgeTypes = { scissors: ScissorsEdge };

const getMiniMapNodeColor = (node: any) => {
  return '#3b82f6'; // Single consistent blue color for all nodes
};

// --- Context Menu ---
const ConnectionContextMenu = ({ id, top, left, onDelete }: any) => (
  <div style={{ top, left, position: 'absolute', zIndex: 10000, background: 'white', border: '1px solid #ccc', padding: 5, borderRadius: 4, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
    <p style={{ margin: '0.2em 0.5em', fontSize: '12px', color: '#666' }}>Connection: {id}</p>
    {onDelete && (
      <button
        onClick={onDelete}
        style={{ width: '100%', textAlign: 'left', padding: '4px 8px', background: 'none', border: 'none', cursor: 'pointer', color: 'red' }}
      >
        Delete
      </button>
    )}
  </div>
);

interface ConnectionLinesProps {
  connections: Connection[];
  activeDrag: ActiveDrag | null;
  selectedConnectionId: string | null;
  onSelectConnection: (id: string | null) => void;
  onDeleteConnection?: (id: string) => void;
  onPersistConnectorCreate?: (conn: any) => void;
  onPersistConnectorDelete?: (id: string) => void;
  stageRef: React.RefObject<any>;
  position: { x: number; y: number };
  scale: number;
  viewportUpdateKey: number;
  isInteracting?: boolean;
  scriptFrameModalStates?: any[];
  sceneFrameModalStates?: any[];
}

const MIN_DISTANCE = 150;

const ConnectionLinesContent: React.FC<ConnectionLinesProps> = ({
  connections,
  selectedConnectionId,
  onSelectConnection,
  onDeleteConnection,
  onPersistConnectorCreate,
  onPersistConnectorDelete,
  position,
  scale,
  viewportUpdateKey,
  isInteracting,
  scriptFrameModalStates = [],
  sceneFrameModalStates = [],
}) => {
  const openMenu = useComponentMenuStore(s => s.openMenu);
  const { setViewport, screenToFlowPosition, getNode } = useReactFlow(); // Get setViewport from internal context
  const [isMiniMapVisible, setIsMiniMapVisible] = useState(false);

  // Sync React Flow viewport with main canvas position/scale
  useEffect(() => {
    setViewport({ x: position.x, y: position.y, zoom: scale });
  }, [position.x, position.y, scale, setViewport]);

  const [menu, setMenu] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const connectionMadeRef = useRef(false);
  const miniMapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // UseReactFlow must be used inside ReactFlowProvider
  // UseReactFlow hooks consolidated above

  // Dynamic MiniMap Visibility: Show on move/zoom, hide after inactivity
  useEffect(() => {
    // Show MiniMap
    setIsMiniMapVisible(true);

    // Clear existing timeout
    if (miniMapTimeoutRef.current) {
      clearTimeout(miniMapTimeoutRef.current);
    }

    // Set hide timeout
    miniMapTimeoutRef.current = setTimeout(() => {
      setIsMiniMapVisible(false);
      miniMapTimeoutRef.current = null;
    }, 2000); // Hide after 2 seconds of inactivity

    return () => {
      if (miniMapTimeoutRef.current) {
        clearTimeout(miniMapTimeoutRef.current);
      }
    };
  }, [position.x, position.y, scale, viewportUpdateKey]);

  // Sync Konva viewport to React Flow
  useEffect(() => {
    setViewport({ x: position.x, y: position.y, zoom: scale });
  }, [position.x, position.y, scale, setViewport, viewportUpdateKey]);

  // Store Selectors
  const imageModalStates = useImageModalStates();
  const videoModalStates = useVideoModalStates();
  const musicModalStates = useMusicModalStates();
  const textInputStates = useTextModalStates();
  const upscaleModalStates = useUpscaleModalStates();
  const removeBgModalStates = useRemoveBgModalStates();
  const multiangleCameraModalStates = useMultiangleCameraModalStates();
  const eraseModalStates = useEraseModalStates();
  const expandModalStates = useExpandModalStates();
  const vectorizeModalStates = useVectorizeModalStates();
  const nextSceneModalStates = useNextSceneModalStates();
  const storyboardModalStates = useStoryboardModalStates();
  const compareModalStates = useCompareModalStates();
  const imageEditorModalStates = useImageEditorModalStates();
  const videoEditorModalStates = useVideoEditorModalStates();

  const selectedImageIds = useSelectedImageModalIds();
  const selectedVideoIds = useSelectedVideoModalIds();
  const selectedMusicIds = useSelectedMusicModalIds();
  const selectedTextIds = useSelectedTextModalIds();

  const allSelectedIdsSet = useMemo(() => new Set([
    ...selectedImageIds,
    ...selectedVideoIds,
    ...selectedMusicIds,
    ...selectedTextIds
  ]), [selectedImageIds, selectedVideoIds, selectedMusicIds, selectedTextIds]);

  // Identify all nodes that are currently generating/processing to trigger edge animation
  const generatingIds = useMemo(() => {
    const ids = new Set<string>();

    imageModalStates.forEach(m => { if (m.isGenerating || m.isProcessing) ids.add(m.id); });
    videoModalStates.forEach(m => { if (m.status === 'processing' || m.status === 'generating' || (m.taskId && !m.generatedVideoUrl)) ids.add(m.id); });
    musicModalStates.forEach(m => { if (m.isGenerating) ids.add(m.id); });
    upscaleModalStates.forEach(m => { if (m.isUpscaling) ids.add(m.id); });
    removeBgModalStates.forEach(m => { if (m.isRemovingBg) ids.add(m.id); });
    eraseModalStates.forEach(m => { if (m.isErasing) ids.add(m.id); });
    expandModalStates.forEach(m => { if (m.isExpanding) ids.add(m.id); });
    vectorizeModalStates.forEach(m => { if (m.isVectorizing) ids.add(m.id); });
    nextSceneModalStates.forEach(m => { if (m.isProcessing) ids.add(m.id); });
    scriptFrameModalStates.forEach(m => { if (m.isLoading) ids.add(m.id); });

    return ids;
  }, [
    imageModalStates, videoModalStates, musicModalStates, upscaleModalStates,
    removeBgModalStates, eraseModalStates, expandModalStates, vectorizeModalStates,
    nextSceneModalStates, scriptFrameModalStates
  ]);

  // Sync Viewport
  useEffect(() => {
    setViewport({ x: position.x, y: position.y, zoom: scale });
  }, [position.x, position.y, scale, setViewport, viewportUpdateKey]);

  const checkConnectionValidity = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return false;
    const fromType = getComponentType(fromId);
    const toType = getComponentType(toId);
    if (!fromType || !toType) return false;

    const allowedMap: Record<string, string[]> = {
      text: ['image', 'video', 'music', 'storyboard'],
      image: ['image', 'media-image', 'video', 'media-video', 'upscale', 'multianglecamera', 'removebg', 'erase', 'expand', 'vectorize', 'nextscene', 'storyboard'],
      video: ['video', 'media-video'],
      music: ['video', 'media-video'],
      nextscene: ['image', 'media-image', 'video', 'media-video', 'upscale', 'multianglecamera', 'removebg', 'erase', 'expand', 'vectorize', 'nextscene', 'storyboard'],
      upscale: ['image', 'media-image', 'video', 'media-video'],
      removebg: ['image', 'media-image', 'video', 'media-video'],
      multianglecamera: ['image', 'media-image', 'video', 'media-video'],
      erase: ['image', 'media-image', 'video', 'media-video'],
      expand: ['image', 'media-image', 'video', 'media-video'],
      vectorize: ['image', 'media-image', 'video', 'media-video'],
      storyboard: ['sceneframe'],
    };

    const isValid = allowedMap[fromType]?.includes(toType) || false;
    console.log(`[ConnectionLines] Validity Check: ${fromId}(${fromType}) -> ${toId}(${toType}) = ${isValid}`);
    return isValid;
  }, []);

  const nodes: Node[] = useMemo(() => {
    const connectedNodeIds = new Set<string>();
    connections.forEach(conn => {
      connectedNodeIds.add(conn.from);
      connectedNodeIds.add(conn.to);
    });

    const allNodes: Node[] = [];
    const add = (states: any[], _ignoredWidth: number, _ignoredHeight: number, typeLabel: string, yOffset = 0) => {
      // Get config for this component type
      const config = getComponentConfig(typeLabel);

      // Determine dimensions:
      // 1. If it's a plugin (has iconSize > 0), use the icon size for the ghost node handles
      //    This ensures handles align with the visual icon, even if the "frame" state is larger (for popup).
      // 2. Otherwise, use state frame dimensions or config defaults.
      const isPlugin = config.iconSize > 0;

      states.forEach(state => {
        let nodeWidth: number;
        let nodeHeight: number;

        if (isPlugin) {
          nodeWidth = config.iconSize;
          nodeHeight = config.iconSize;
        } else {
          nodeWidth = state.frameWidth || config.defaultWidth;
          nodeHeight = state.frameHeight || config.defaultHeight;
        }

        allNodes.push({
          id: state.id,
          type: 'ghost',
          position: { x: state.x, y: state.y + yOffset },
          width: nodeWidth,
          height: nodeHeight,
          style: {
            width: nodeWidth,
            height: nodeHeight,
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            pointerEvents: isConnecting ? 'auto' : 'none'
          },
          data: {
            id: state.id,
            type: typeLabel,
            isHovered: !!state.isHovered,
            isHandleHovered: !!state.isHandleHovered,
            isSelected: allSelectedIdsSet.has(state.id),
            isConnecting,
            isSource: connectingSourceId === state.id,
            hasConnections: connectedNodeIds.has(state.id),
            isValidTarget: connectingSourceId ? checkConnectionValidity(connectingSourceId, state.id) : false,
            checkConnectionValidity
          },
          draggable: false,
          connectable: true,
        });
      });
    };

    add(textInputStates, 400, 400, 'text');
    add(imageModalStates, 600, 600, 'image');
    add(videoModalStates, 600, 338, 'video');
    add(musicModalStates, 600, 300, 'music');
    add(upscaleModalStates, 110, 110, 'upscale', 25);
    add(removeBgModalStates, 110, 110, 'removebg', 25);
    add(multiangleCameraModalStates, 110, 110, 'multiangle-camera', 25);
    add(eraseModalStates, 110, 110, 'erase', 25);
    add(expandModalStates, 110, 110, 'expand', 25);
    add(vectorizeModalStates, 110, 110, 'vectorize', 25);
    add(nextSceneModalStates, 110, 110, 'next-scene', 25);
    add(storyboardModalStates, 110, 110, 'storyboard', 25);
    add(compareModalStates, 110, 110, 'compare', 25);
    add(imageEditorModalStates, 110, 110, 'image-editor', 25);
    add(videoEditorModalStates, 110, 110, 'video-editor', 25);
    add(scriptFrameModalStates, 600, 400, 'scriptframe');
    add(sceneFrameModalStates, 600, 400, 'sceneframe');

    return allNodes;
  }, [
    textInputStates, imageModalStates, videoModalStates, musicModalStates,
    upscaleModalStates, removeBgModalStates, multiangleCameraModalStates,
    eraseModalStates, expandModalStates, vectorizeModalStates,
    nextSceneModalStates, storyboardModalStates, compareModalStates,
    imageEditorModalStates, videoEditorModalStates, scriptFrameModalStates,
    sceneFrameModalStates, viewportUpdateKey,
    allSelectedIdsSet, isConnecting, connectingSourceId, checkConnectionValidity,
    connections // Added connections to dependencies
  ]);

  const renderedEdges = useMemo(() => {
    return connections.map((conn, index) => {
      const edgeId = conn.id || `edge-${index}`;
      const isSelected = selectedConnectionId === edgeId;
      const isGenerating = generatingIds.has(conn.from) || generatingIds.has(conn.to);

      return {
        id: edgeId,
        source: conn.from,
        target: conn.to,
        sourceHandle: 'send',
        targetHandle: 'receive',
        type: 'scissors',
        animated: isGenerating,
        selected: isSelected,
        style: {
          stroke: isGenerating ? '#437eb5' : (isSelected ? '#94a3b8' : (conn.color || '#437eb5')),
          strokeWidth: isSelected ? 4 : 2,
          strokeDasharray: (isGenerating || isSelected) ? '6 4' : undefined,
          animation: isGenerating
            ? 'marching-ants 0.5s linear infinite'
            : (isSelected ? 'marching-ants 1s linear infinite' : undefined),
          transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
        },
        data: { onDelete: onDeleteConnection }
      };
    });
  }, [connections, selectedConnectionId, onDeleteConnection, generatingIds]);

  const onConnect = useCallback((params: any) => {
    console.log('[ConnectionLines] onConnect triggered:', params);
    if (checkConnectionValidity(params.source, params.target)) {
      onPersistConnectorCreate?.({
        from: params.source,
        to: params.target,
        color: '#3b82f6',
        fromAnchor: 'send',
        toAnchor: 'receive',
      });
    }
  }, [onPersistConnectorCreate, checkConnectionValidity]);

  const connectingSourceIdRef = useRef<string | null>(null);

  const onConnectStart = useCallback((_: any, { nodeId }: any) => {
    console.log('[ConnectionLines] onConnectStart:', nodeId);
    setConnectingSourceId(nodeId);
    connectingSourceIdRef.current = nodeId;
    setIsConnecting(true);
  }, []);

  const onConnectEnd = useCallback((event: any, connectionState: any) => {
    const sourceId = connectingSourceIdRef.current;

    // Check if the connection is valid (handled by React Flow)
    // If not valid, it means it was dropped on the pane or an invalid target
    if (!connectionState?.isValid && sourceId) {
      // It was a drop without connection. Trigger the menu.
      const clientX = event.clientX || (event.changedTouches && event.changedTouches[0]?.clientX);
      const clientY = event.clientY || (event.changedTouches && event.changedTouches[0]?.clientY);

      if (clientX && clientY) {
        const sourceNode = getNode(sourceId);
        const sourceNodeType = (sourceNode?.data?.type as string) || getComponentType(sourceId) || 'image';

        // Since this ReactFlow instance is an overlay with identity transform (0,0,1),
        // screenToFlowPosition just returns screen coordinates.
        // We need to calculate the actual world coordinates based on the main canvas's position and scale.
        const worldX = (clientX - position.x) / scale;
        const worldY = (clientY - position.y) / scale;

        openMenu({
          sourceNodeId: sourceId,
          sourceNodeType,
          canvasX: worldX,
          canvasY: worldY,
          x: clientX,
          y: clientY,
        });
      }
    }

    setIsConnecting(false);
    setConnectingSourceId(null);
    connectingSourceIdRef.current = null;
  }, [getNode, openMenu, position.x, position.y, scale]);


  return (
    <div
      ref={ref}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        // CRITICAL FIX: allow pointer events when connecting so we can catch the drop on the pane
        pointerEvents: isConnecting ? 'all' : 'none',
        zIndex: 0
      }}
    >
      <div style={{ width: '100%', height: '100%', pointerEvents: isConnecting ? 'all' : 'none' }}>
        <ReactFlow
          nodes={nodes}
          edges={renderedEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          panOnDrag={false}
          zoomOnScroll={false}
          panOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          nodesDraggable={false}
          nodesConnectable={true}
          elementsSelectable={true}
          proOptions={{ hideAttribution: true }}

          onEdgeClick={(e, edge) => {
            e.stopPropagation();
            onSelectConnection(edge.id);
          }}
          onEdgeContextMenu={(e, edge) => {
            e.preventDefault();
            e.stopPropagation();
            setMenu({ id: edge.id, top: e.clientY, left: e.clientX });
          }}
          onPaneClick={() => setMenu(null)}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          style={{ width: '100%', height: '100%', background: 'transparent' }}
        >
          {typeof document !== 'undefined' && createPortal(
            <MiniMap
              position="bottom-right"
              nodeColor={getMiniMapNodeColor}
              nodeStrokeColor="#4C83FF"
              nodeStrokeWidth={2}
              nodeBorderRadius={8}
              maskColor="rgba(255, 255, 255, 0.25)"
              bgColor="#0f0f14"
              style={{
                backgroundColor: '#0f0f14',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                margin: '24px',
                padding: 0,
                boxShadow: '0 12px 48px -12px rgba(0, 0, 0, 0.5)',
                width: 250,
                height: 150,
                overflow: 'hidden',
                zIndex: 9999,
                opacity: isMiniMapVisible ? 1 : 0,
                pointerEvents: isMiniMapVisible ? 'all' : 'none',
                transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isMiniMapVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
              }}
              pannable
              zoomable
            />,
            document.body
          )}
          <style>{`
            .react-flow { background: transparent !important; }
            .react-flow__panel { background: transparent !important; }
            .react-flow__viewport .react-flow__node { background: transparent !important; border: none !important; box-shadow: none !important; pointer-events: ${isConnecting ? 'auto' : 'none'} !important; }
            .react-flow__minimap { pointer-events: all !important; }
            .react-flow__minimap-mask { pointer-events: none !important; }
            .react-flow__edge { pointer-events: all !important; cursor: pointer; }
            .react-flow__edge-path { cursor: pointer; }
            .react-flow__handle { pointer-events: all !important; cursor: crosshair; }
            .react-flow__pane { pointer-events: ${isConnecting ? 'all' : 'none'} !important; background: transparent !important; }
            .scissors-delete-btn:hover { background: #ff4d4f !important; color: white !important; transform: scale(1.1); }
          `}</style>
          {menu && <ConnectionContextMenu {...menu} onDelete={() => {
            onDeleteConnection?.(menu.id);
            setMenu(null);
          }} />}
        </ReactFlow>
      </div>
      <style>{`
        .react-flow__edge-path.animated {
          stroke-dasharray: 6 4;
          animation: marching-ants 1s linear infinite;
        }

        @keyframes marching-ants {
          from {
            stroke-dashoffset: 20;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};

export const ConnectionLines = (props: ConnectionLinesProps) => (
  <ReactFlowProvider>
    <ConnectionLinesContent {...props} />
  </ReactFlowProvider>
);
