import { useState, useEffect, useCallback, useRef } from 'react';
import Konva from 'konva';
import { Connection, ActiveDrag, ImageModalState, ComponentMenu, NextSceneModalState } from './types';
import { getComponentType, computeNodeCenter } from './utils';

interface UseConnectionManagerProps {
  connections: Connection[];
  onConnectionsChange?: (connections: Connection[]) => void;
  onPersistConnectorCreate?: (connector: Connection) => void | Promise<void>;
  onPersistConnectorDelete?: (connectorId: string) => void | Promise<void>;
  imageModalStates: ImageModalState[];
  stageRef: React.RefObject<Konva.Stage | null>;
  position: { x: number; y: number };
  scale: number;
  textInputStates: any[];
  videoModalStates: any[];
  musicModalStates: any[];
  upscaleModalStates?: any[];
  multiangleCameraModalStates?: any[];
  removeBgModalStates?: any[];
  eraseModalStates?: any[];
  expandModalStates?: any[];
  vectorizeModalStates?: any[];
  nextSceneModalStates?: NextSceneModalState[];
  storyboardModalStates?: any[];
  scriptFrameModalStates?: any[];
  sceneFrameModalStates?: any[];
}

export function useConnectionManager({
  connections,
  onConnectionsChange,
  onPersistConnectorCreate,
  onPersistConnectorDelete,
  imageModalStates,
  stageRef,
  position,
  scale,
  textInputStates,
  videoModalStates,
  musicModalStates,
  upscaleModalStates,
  multiangleCameraModalStates,
  removeBgModalStates,
  eraseModalStates,
  expandModalStates,
  vectorizeModalStates,
  nextSceneModalStates,
  storyboardModalStates,
  scriptFrameModalStates,
  sceneFrameModalStates,
}: UseConnectionManagerProps) {
  const [localConnections, setLocalConnections] = useState<Connection[]>([]);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [dimmedFrameId, setDimmedFrameId] = useState<string | null>(null);
  const [componentMenu, setComponentMenu] = useState<ComponentMenu | null>(null);
  const [componentMenuSearch, setComponentMenuSearch] = useState('');
  const processingConnectionRef = useRef(false);

  const effectiveConnections = connections ?? localConnections;

  const checkConnectionValidity = useCallback((fromId: string, toId: string, toSide?: string): boolean => {
    if (fromId === toId) return false; // Can't connect to self

    const fromType = getComponentType(fromId);
    const toType = getComponentType(toId);

    if (!fromType || !toType) return false;

    // Storyboard specific validation
    if (toType === 'storyboard') {
      // If connecting to specific receive nodes (character, background, prompt)
      if (toSide && toSide.startsWith('receive-')) {
        // Only allow image connections (generated or media)
        return fromType === 'image';
      }
      // If connecting to main node (receive)
      if (toSide === 'receive') {
        // Only allow text connections
        return fromType === 'text';
      }
    }

    // Check basic allowed connections
      const allowedMap: Record<string, string[]> = {
        text: ['image', 'video', 'music', 'storyboard'],
        image: ['image', 'video', 'upscale', 'multianglecamera', 'removebg', 'erase', 'expand', 'vectorize', 'nextscene', 'storyboard'],
        video: ['video'],
        music: ['video'],
        nextscene: ['image', 'video', 'upscale', 'multianglecamera', 'removebg', 'erase', 'expand', 'vectorize', 'nextscene', 'storyboard'],
      };

    if (!allowedMap[fromType] || !allowedMap[fromType].includes(toType)) {
      return false;
    }

    // Additional validation for media connections:
    // Check if source is media (Library Image or Uploaded Image)
    // Use the same logic as ImageUploadModal to determine if it's media
    const PLUGIN_MODELS = ['Upscale', 'Remove BG', 'Vectorize', 'Expand', 'Erase'];
    const GENERATION_MODELS = [
      'Google Nano Banana', 'Google nano banana pro', 'Flux 2 pro', 'Seedream v4',
      'Imagen 4 Ultra', 'Imagen 4', 'Imagen 4 Fast', 'Flux Kontext Max', 'Flux Kontext Pro',
      'Flux Pro 1.1 Ultra', 'Flux Pro 1.1', 'Seedream v4 4K'
    ];
    
    const fromModal = imageModalStates.find(m => m.id === fromId);
    const isFromMedia = fromModal && (
      fromModal.model === 'Library Image' ||
      fromModal.model === 'Uploaded Image' ||
      PLUGIN_MODELS.includes(fromModal.model || '') ||
      (!GENERATION_MODELS.includes(fromModal.model || '') && fromModal.generatedImageUrl && !fromModal.prompt)
    );

    // Check if target is image generation modal (not a plugin)
    const toModal = imageModalStates.find(m => m.id === toId);
    const isToImageGeneration = toType === 'image' && toModal;
    const isToPlugin = ['upscale', 'multianglecamera', 'removebg', 'erase', 'expand', 'vectorize', 'nextscene'].includes(toType);
    const isToMedia = toModal && (
      toModal.model === 'Library Image' ||
      toModal.model === 'Uploaded Image' ||
      PLUGIN_MODELS.includes(toModal.model || '') ||
      (!GENERATION_MODELS.includes(toModal.model || '') && toModal.generatedImageUrl && !toModal.prompt)
    );

    // Block: Image generation cannot connect to media (but allow to plugins)
    if (fromType === 'image' && fromModal && !isFromMedia && isToMedia && !isToPlugin) {
      return false;
    }

    // Block: Media cannot connect to image generation that already has an image
    // BUT: Allow image-to-image connections when both are image generation (not media)
    // AND: Always allow connections to plugins (they can accept any image)
    if (isFromMedia && isToImageGeneration && toModal && toModal.generatedImageUrl && !isToPlugin) {
      return false;
    }

    return true;
  }, [imageModalStates]);

  // Event listeners for node drag lifecycle
  useEffect(() => {
    const handleStart = (e: Event) => {
      const ce = e as CustomEvent;
      const { id, side, color, startX, startY } = ce.detail || {};
      if (side !== 'send') return; // only start from send side
      setActiveDrag({ from: id, color, startX, startY, currentX: startX, currentY: startY });
      // Notify nodes that a drag has started so they can remain visible
      try {
        window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: true, from: id } }));
      } catch (err) {
        // ignore
      }
    };
    const handleComplete = (e: Event) => {
      const ce = e as CustomEvent;
      const { id, side } = ce.detail || {};
      if (!activeDrag) {
        // If activeDrag is null, connection might have been handled already
        return;
      }
      if (!side || !side.startsWith('receive')) {
        return;
      }
      if (id === activeDrag.from) { // ignore self
        setActiveDrag(null);
        try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) { }
        return;
      }
      
      // Mark that we're processing this connection to prevent handleUp from interfering
      processingConnectionRef.current = true;

      // Determine component types for both ends and enforce allowed connections
      const fromType = getComponentType(activeDrag.from);
      const toType = getComponentType(id);

      // Storyboard specific validation
      if (toType === 'storyboard') {
        // If connecting to specific receive nodes (character, background, prompt)
        if (side && side.startsWith('receive-')) {
          // Only allow image connections (generated or media)
          if (fromType !== 'image') {
            setActiveDrag(null);
            try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) { }
            return;
          }
        }
        // If connecting to main node (receive)
        else if (side === 'receive') {
          // Only allow text connections
          if (fromType !== 'text') {
            setActiveDrag(null);
            try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) { }
            return;
          }
        }
      }

      // CRITICAL FIX: Prevent text connections from triggering on image-specific receive nodes
      // This prevents duplicate connections when connecting text to storyboard
      if (fromType === 'text' && toType === 'storyboard' && side && side.startsWith('receive-') && side !== 'receive') {
        // Text is trying to connect to an image-specific node (receive-character, receive-background, receive-props)
        // Ignore this event - only the main 'receive' node should handle text connections
        setActiveDrag(null);
        try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) { }
        return;
      }

      const allowedMap: Record<string, string[]> = {
        text: ['image', 'video', 'music', 'storyboard'],
        image: ['image', 'video', 'upscale', 'multianglecamera', 'removebg', 'erase', 'expand', 'vectorize', 'nextscene', 'storyboard'],
        video: ['video'],
        music: ['video'],
        nextscene: ['image', 'video', 'upscale', 'multianglecamera', 'removebg', 'erase', 'expand', 'vectorize', 'nextscene', 'storyboard'],
      };

      if (!fromType || !toType || !allowedMap[fromType] || !allowedMap[fromType].includes(toType)) {
        // Not an allowed connection — cancel drag and exit without creating it
        setActiveDrag(null);
        try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) { }
        return;
      }

      // Use the same logic as ImageUploadModal to determine if it's media
      const PLUGIN_MODELS = ['Upscale', 'Remove BG', 'Vectorize', 'Expand', 'Erase'];
      const GENERATION_MODELS = [
        'Google Nano Banana', 'Google nano banana pro', 'Flux 2 pro', 'Seedream v4',
        'Imagen 4 Ultra', 'Imagen 4', 'Imagen 4 Fast', 'Flux Kontext Max', 'Flux Kontext Pro',
        'Flux Pro 1.1 Ultra', 'Flux Pro 1.1', 'Seedream v4 4K'
      ];
      
      const fromModal = imageModalStates.find(m => m.id === activeDrag.from);
      const isFromMedia = fromModal && (
        fromModal.model === 'Library Image' ||
        fromModal.model === 'Uploaded Image' ||
        PLUGIN_MODELS.includes(fromModal.model || '') ||
        (!GENERATION_MODELS.includes(fromModal.model || '') && fromModal.generatedImageUrl && !fromModal.prompt)
      );

      // Check if target is image generation modal (not a plugin)
      const toModal = imageModalStates.find(m => m.id === id);
      const isToImageGeneration = toType === 'image' && toModal;
      const isToPlugin = ['upscale', 'multianglecamera', 'removebg', 'erase', 'expand', 'vectorize', 'nextscene'].includes(toType);
      const isToMedia = toModal && (
        toModal.model === 'Library Image' ||
        toModal.model === 'Uploaded Image' ||
        PLUGIN_MODELS.includes(toModal.model || '') ||
        (!GENERATION_MODELS.includes(toModal.model || '') && toModal.generatedImageUrl && !toModal.prompt)
      );

      // Block: Image generation cannot connect to media (but allow to plugins)
      if (fromType === 'image' && fromModal && !isFromMedia && isToMedia && !isToPlugin) {
        setActiveDrag(null);
        try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) { }
        return;
      }

      // Block: Media cannot connect to image generation that already has an image
      // BUT: Allow image-to-image connections when both are image generation (not media)
      // AND: Always allow connections to plugins (they can accept any image)
      if (isFromMedia && isToImageGeneration && toModal && toModal.generatedImageUrl && !isToPlugin) {
        setActiveDrag(null);
        try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) { }
        return;
      }

      // Determine the specific target anchor (side)
      // When dropping directly on a receive node, the event provides the id and side
      // We should trust that and use it directly, but also verify by finding the closest node
      let targetSide = side || 'receive';
      const receiveNodes = Array.from(document.querySelectorAll('[data-node-side^="receive"]'));
      let minDistance = Infinity;
      let closestNodeId = null;
      const PROXIMITY_THRESHOLD = 150; // pixels - increased threshold for better connection detection

      // Try to find the receive node that was actually dropped on
      // This helps when the event id might not match exactly or for proximity-based drops
      for (const node of receiveNodes) {
        const nodeId = node.getAttribute('data-node-id');
        if (nodeId !== id) continue; // Only look at nodes belonging to the target component

        const rect = node.getBoundingClientRect();
        const nodeCenterX = rect.left + rect.width / 2;
        const nodeCenterY = rect.top + rect.height / 2;

        // We use the last known mouse position from activeDrag (currentX, currentY)
        // activeDrag.currentX/Y are client coordinates
        const distance = Math.sqrt(
          Math.pow(activeDrag.currentX - nodeCenterX, 2) + Math.pow(activeDrag.currentY - nodeCenterY, 2)
        );

        if (distance < minDistance && distance < PROXIMITY_THRESHOLD) {
          minDistance = distance;
          closestNodeId = nodeId;
          const nodeSide = node.getAttribute('data-node-side') || 'receive';
          // If we found a close node, use its side (this is more accurate than the event side)
          targetSide = nodeSide;
        }
      }

      // If we didn't find a close node by proximity but the event was triggered from a receive node,
      // trust the event's side (this handles direct drops on nodes where proximity might fail)
      if (minDistance === Infinity && side && side.startsWith('receive')) {
        targetSide = side;
      }

      // Add connection if not duplicate
      // Always create connection if we have valid from/to and validation passed
      const fromCenter = computeNodeCenter(activeDrag.from, 'send', stageRef, position, scale, textInputStates, imageModalStates, videoModalStates, musicModalStates, upscaleModalStates, multiangleCameraModalStates, removeBgModalStates, eraseModalStates, expandModalStates, vectorizeModalStates, nextSceneModalStates, storyboardModalStates, scriptFrameModalStates, sceneFrameModalStates);
      const toCenter = computeNodeCenter(id, targetSide, stageRef, position, scale, textInputStates, imageModalStates, videoModalStates, musicModalStates, upscaleModalStates, multiangleCameraModalStates, removeBgModalStates, eraseModalStates, expandModalStates, vectorizeModalStates, nextSceneModalStates, storyboardModalStates, scriptFrameModalStates, sceneFrameModalStates);
      
      // If we couldn't compute centers, try to get them from the actual DOM nodes
      let finalFromCenter = fromCenter;
      let finalToCenter = toCenter;
      
      if (!finalFromCenter) {
        const fromNode = document.querySelector(`[data-node-id="${activeDrag.from}"][data-node-side="send"]`);
        if (fromNode) {
          const rect = fromNode.getBoundingClientRect();
          finalFromCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }
      }
      
      if (!finalToCenter) {
        const toNode = document.querySelector(`[data-node-id="${id}"][data-node-side="${targetSide}"]`);
        if (toNode) {
          const rect = toNode.getBoundingClientRect();
          finalToCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }
      }
      
      // Only proceed if we have both centers
      // If we can't compute centers, try one more time with a small delay (DOM might not be ready)
      if (!finalFromCenter || !finalToCenter) {
        // Retry once after a brief delay to allow DOM to update
        setTimeout(() => {
          if (!activeDrag) return; // Connection might have been created already
          
          const retryFromCenter = computeNodeCenter(activeDrag.from, 'send', stageRef, position, scale, textInputStates, imageModalStates, videoModalStates, musicModalStates, upscaleModalStates, multiangleCameraModalStates, removeBgModalStates, eraseModalStates, expandModalStates, vectorizeModalStates, nextSceneModalStates, storyboardModalStates, scriptFrameModalStates, sceneFrameModalStates);
          const retryToCenter = computeNodeCenter(id, targetSide, stageRef, position, scale, textInputStates, imageModalStates, videoModalStates, musicModalStates, upscaleModalStates, multiangleCameraModalStates, removeBgModalStates, eraseModalStates, expandModalStates, vectorizeModalStates, nextSceneModalStates, storyboardModalStates, scriptFrameModalStates, sceneFrameModalStates);
          
          let retryFinalFromCenter = retryFromCenter;
          let retryFinalToCenter = retryToCenter;
          
          if (!retryFinalFromCenter) {
            const fromNode = document.querySelector(`[data-node-id="${activeDrag.from}"][data-node-side="send"]`);
            if (fromNode) {
              const rect = fromNode.getBoundingClientRect();
              retryFinalFromCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            }
          }
          
          if (!retryFinalToCenter) {
            const toNode = document.querySelector(`[data-node-id="${id}"][data-node-side="${targetSide}"]`);
            if (toNode) {
              const rect = toNode.getBoundingClientRect();
              retryFinalToCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            }
          }
          
          if (retryFinalFromCenter && retryFinalToCenter) {
            const connectorId = `connector-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
            const newConn: Connection = {
              id: connectorId,
              from: activeDrag.from,
              to: id,
              color: activeDrag.color,
              fromX: retryFinalFromCenter.x,
              fromY: retryFinalFromCenter.y,
              toX: retryFinalToCenter.x,
              toY: retryFinalToCenter.y,
              toAnchor: targetSide
            };
            
            const exists = effectiveConnections.find((c: any) => c.from === activeDrag.from && c.to === id && c.toAnchor === targetSide);
            if (!exists) {
              if (onConnectionsChange) {
                try { onConnectionsChange([...effectiveConnections, newConn]); } catch (e) { console.warn('onConnectionsChange failed', e); }
              } else {
                setLocalConnections(prev => [...prev, newConn]);
              }
              
              if (onPersistConnectorCreate) {
                try { Promise.resolve(onPersistConnectorCreate(newConn)).catch(console.error); } catch (e) { console.error('onPersistConnectorCreate failed', e); }
              }
            }
            
            processingConnectionRef.current = false;
            setActiveDrag(null);
            try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) { }
          } else {
            console.warn('[useConnectionManager] Could not compute node centers after retry', {
              from: activeDrag.from,
              to: id,
              fromCenter: retryFinalFromCenter,
              toCenter: retryFinalToCenter
            });
            processingConnectionRef.current = false;
            setActiveDrag(null);
            try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) { }
          }
        }, 50);
        processingConnectionRef.current = true; // Mark as processing before the retry
        return; // Exit early, will retry in setTimeout
      }
      
      const connectorId = `connector-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      // Include toAnchor in the connection
      const newConn: Connection = {
        id: connectorId,
        from: activeDrag.from,
        to: id,
        color: activeDrag.color,
        fromX: finalFromCenter.x,
        fromY: finalFromCenter.y,
        toX: finalToCenter.x,
        toY: finalToCenter.y,
        toAnchor: targetSide
      };

      const exists = effectiveConnections.find((c: any) => c.from === activeDrag.from && c.to === id && c.toAnchor === targetSide);
      if (!exists) {
        if (onConnectionsChange) {
          try { onConnectionsChange([...effectiveConnections, newConn]); } catch (e) { console.warn('onConnectionsChange failed', e); }
        } else {
          setLocalConnections(prev => [...prev, newConn]);
        }

        // Persist connector via parent handler if provided
        if (onPersistConnectorCreate) {
          try { Promise.resolve(onPersistConnectorCreate(newConn)).catch(console.error); } catch (e) { console.error('onPersistConnectorCreate failed', e); }
        }

        // Clear dimming after successful connection for both source and target
        // Clear target dimming
        if (dimmedFrameId === id) {
          try {
            window.dispatchEvent(new CustomEvent('canvas-frame-dim', { detail: { frameId: id, dimmed: false } }));
          } catch (err) { }
          setDimmedFrameId(null);
        }
        // Also clear source dimming if it was dimmed
        if (dimmedFrameId === activeDrag.from) {
          try {
            window.dispatchEvent(new CustomEvent('canvas-frame-dim', { detail: { frameId: activeDrag.from, dimmed: false } }));
          } catch (err) { }
        }
      } else {
        // Connection already exists, but still clear the drag state
        processingConnectionRef.current = false;
        setActiveDrag(null);
        try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) { }
        return; // Exit early if connection already exists
      }
      processingConnectionRef.current = false;
      setActiveDrag(null);
      try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) { }
    };
    const handleMove = (e: MouseEvent | PointerEvent) => {
      if (!activeDrag) return;
      setActiveDrag(d => d ? { ...d, currentX: e.clientX, currentY: e.clientY } : d);

      // Check for nearby receive nodes and update cursor based on validity
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const proximityThreshold = 60; // pixels

      type NearestNode = {
        id: string;
        side: string;
        distance: number;
      };

      let nearestNode: NearestNode | null = null;

      // Find all receive nodes and check distance
      const receiveNodes = Array.from(document.querySelectorAll('[data-node-side^="receive"]'));
      for (const node of receiveNodes) {
        const nodeId = node.getAttribute('data-node-id');
        const nodeSide = node.getAttribute('data-node-side') || 'receive';
        if (!nodeId) continue;

        const rect = node.getBoundingClientRect();
        const nodeCenterX = rect.left + rect.width / 2;
        const nodeCenterY = rect.top + rect.height / 2;

        const distance = Math.sqrt(
          Math.pow(mouseX - nodeCenterX, 2) + Math.pow(mouseY - nodeCenterY, 2)
        );

        if (distance < proximityThreshold) {
          if (!nearestNode || distance < nearestNode.distance) {
            nearestNode = { id: nodeId, side: nodeSide, distance };
          }
        }
      }

      // Update cursor and dim frame based on nearest node validity
      if (nearestNode !== null) {
        const nodeId = nearestNode.id;
        const nodeSide = nearestNode.side;
        const isValid = checkConnectionValidity(activeDrag.from, nodeId, nodeSide);
        document.body.style.cursor = isValid ? 'pointer' : 'not-allowed';

        // Dim the frame if connection is not allowed
        if (!isValid) {
          setDimmedFrameId(nodeId);
          // Dispatch event for modal to listen
          try {
            window.dispatchEvent(new CustomEvent('canvas-frame-dim', { detail: { frameId: nodeId, dimmed: true } }));
          } catch (err) { }
        } else {
          setDimmedFrameId(null);
          // Dispatch event to clear dim
          try {
            window.dispatchEvent(new CustomEvent('canvas-frame-dim', { detail: { frameId: nodeId, dimmed: false } }));
          } catch (err) { }
        }
      } else {
        document.body.style.cursor = 'default';
        // Clear dim when not near any node
        if (dimmedFrameId) {
          try {
            window.dispatchEvent(new CustomEvent('canvas-frame-dim', { detail: { frameId: dimmedFrameId, dimmed: false } }));
          } catch (err) { }
          setDimmedFrameId(null);
        }
      }
    };
    const handleUp = (e?: MouseEvent | PointerEvent) => {
      if (!activeDrag) return;
      
      if (!e) {
        // No event data, just clean up
        setActiveDrag(null);
        document.body.style.cursor = '';
        if (dimmedFrameId) {
          try {
            window.dispatchEvent(new CustomEvent('canvas-frame-dim', { detail: { frameId: dimmedFrameId, dimmed: false } }));
          } catch (err) { }
          setDimmedFrameId(null);
        }
        try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) { }
        return;
      }
      
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      // Check if we're near any receive node (fallback for when pointer capture prevents node's onPointerUp from firing)
      const receiveNodes = Array.from(document.querySelectorAll('[data-node-side^="receive"]'));
      let nearestNode: { id: string; side: string; distance: number } | null = null;
      const proximityThreshold = 100; // pixels

      for (const node of receiveNodes) {
        const nodeId = node.getAttribute('data-node-id');
        const nodeSide = node.getAttribute('data-node-side') || 'receive';
        if (!nodeId) continue;

        const rect = node.getBoundingClientRect();
        const nodeCenterX = rect.left + rect.width / 2;
        const nodeCenterY = rect.top + rect.height / 2;
        const distance = Math.sqrt(
          Math.pow(mouseX - nodeCenterX, 2) + Math.pow(mouseY - nodeCenterY, 2)
        );
        
        if (distance < proximityThreshold) {
          if (!nearestNode || distance < nearestNode.distance) {
            nearestNode = { id: nodeId, side: nodeSide, distance };
          }
        }
      }
      
      // If we found a nearby receive node, try to connect to it
      if (nearestNode && nearestNode.id !== activeDrag.from) {
        // Use the same validation logic as handleComplete
        const isValid = checkConnectionValidity(activeDrag.from, nearestNode.id, nearestNode.side);
        
        if (isValid) {
          // Manually trigger the connection by dispatching canvas-node-complete
          // This ensures the connection is created even if the node's onPointerUp didn't fire
          // handleComplete will process this event and perform all validation
          try {
            window.dispatchEvent(new CustomEvent('canvas-node-complete', { 
              detail: { 
                id: nearestNode.id, 
                side: nearestNode.side 
              } 
            }));
          } catch (err) {
            console.warn('Failed to dispatch canvas-node-complete', err);
          }
          
          // Give handleComplete time to process
          setTimeout(() => {
            if (activeDrag && !processingConnectionRef.current) {
              setActiveDrag(null);
              document.body.style.cursor = '';
              if (dimmedFrameId) {
                try {
                  window.dispatchEvent(new CustomEvent('canvas-frame-dim', { detail: { frameId: dimmedFrameId, dimmed: false } }));
                } catch (err) { }
                setDimmedFrameId(null);
              }
              try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) { }
            }
          }, 100);
          return;
        }
      }
      
      // Check if pointer was directly on a receive node element
      const target = e.target as HTMLElement;
      const receiveNode = target.closest('[data-node-side^="receive"]');
      
      if (receiveNode || processingConnectionRef.current) {
        // If dropping on a node or connection is being processed, give handleComplete time to process
        // handleComplete will clear activeDrag when connection is created
        setTimeout(() => {
          // Only clean up if activeDrag still exists and connection processing is done
          if (activeDrag && !processingConnectionRef.current) {
            setActiveDrag(null);
            document.body.style.cursor = '';
            if (dimmedFrameId) {
              try {
                window.dispatchEvent(new CustomEvent('canvas-frame-dim', { detail: { frameId: dimmedFrameId, dimmed: false } }));
              } catch (err) { }
              setDimmedFrameId(null);
            }
            try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) { }
          }
        }, 150);
        return; // Exit early to let handleComplete handle it
      }

      // Not near any node - show component creation menu
      const stage = stageRef.current;
      if (stage) {
        const stageBox = stage.container().getBoundingClientRect();
        const canvasX = (mouseX - stageBox.left - position.x) / scale;
        const canvasY = (mouseY - stageBox.top - position.y) / scale;
        setComponentMenu({
          x: mouseX,
          y: mouseY,
          canvasX,
          canvasY,
          sourceNodeId: activeDrag.from,
          sourceNodeType: getComponentType(activeDrag.from) || undefined,
          connectionColor: activeDrag.color
        });
      }

      setActiveDrag(null);
      document.body.style.cursor = ''; // Reset cursor
      // Clear dimmed frame
      if (dimmedFrameId) {
        try {
          window.dispatchEvent(new CustomEvent('canvas-frame-dim', { detail: { frameId: dimmedFrameId, dimmed: false } }));
        } catch (err) { }
        setDimmedFrameId(null);
      }
      try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) { }
    };
    window.addEventListener('canvas-node-start', handleStart as any);
    window.addEventListener('canvas-node-complete', handleComplete as any);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('pointermove', handleMove as any, { passive: true } as any);
    // Use bubbling phase (not capture) so node's onPointerUp can fire first
    // The node's onPointerUp will dispatch canvas-node-complete, which handleComplete processes
    // Then handleUp will run to clean up if no connection was made
    // Use a longer delay to ensure handleComplete has time to process
    window.addEventListener('mouseup', handleUp as any, false);
    window.addEventListener('pointerup', handleUp as any, false);
    window.addEventListener('pointercancel', handleUp as any, false);
    return () => {
      window.removeEventListener('canvas-node-start', handleStart as any);
      window.removeEventListener('canvas-node-complete', handleComplete as any);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('pointermove', handleMove as any);
      window.removeEventListener('mouseup', handleUp as any, false);
      window.removeEventListener('pointerup', handleUp as any, false);
      window.removeEventListener('pointercancel', handleUp as any, false);
      document.body.style.cursor = ''; // Reset cursor on cleanup
    };
  }, [activeDrag, effectiveConnections, imageModalStates, onConnectionsChange, onPersistConnectorCreate, checkConnectionValidity, dimmedFrameId, stageRef, position, scale, textInputStates, videoModalStates, musicModalStates, upscaleModalStates, multiangleCameraModalStates, removeBgModalStates, eraseModalStates, vectorizeModalStates, storyboardModalStates, sceneFrameModalStates]);

  // Handle connection deletion
  const handleDeleteConnection = useCallback((connectionId: string) => {
    const connectionToDelete = effectiveConnections.find(c => (c.id || `${c.from}-${c.to}`) === connectionId);
    if (!connectionToDelete) return;

    // Remove connection from state
    if (onConnectionsChange) {
      try {
        onConnectionsChange(effectiveConnections.filter(c => (c.id || `${c.from}-${c.to}`) !== connectionId));
      } catch (e) {
        console.warn('onConnectionsChange failed', e);
      }
    } else {
      setLocalConnections(prev => prev.filter(c => (c.id || `${c.from}-${c.to}`) !== connectionId));
    }

    // Persist deletion via parent handler if provided
    if (onPersistConnectorDelete && connectionToDelete.id) {
      try {
        Promise.resolve(onPersistConnectorDelete(connectionToDelete.id)).catch(console.error);
      } catch (e) {
        console.error('onPersistConnectorDelete failed', e);
      }
    }

    // Clear selection
    setSelectedConnectionId(null);
  }, [effectiveConnections, onConnectionsChange, onPersistConnectorDelete]);

  // Handle keyboard delete key for selected connection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle delete if a connection is selected and no input is focused
      if (selectedConnectionId && (e.key === 'Delete' || e.key === 'Backspace')) {
        const activeElement = document.activeElement as HTMLElement | null;
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement.isContentEditable === true)
        );

        if (!isInputFocused) {
          e.preventDefault();
          handleDeleteConnection(selectedConnectionId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedConnectionId, handleDeleteConnection]);

  // Deselect connection when clicking on canvas or modals (but not on connection lines)
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | SVGElement;
      // Don't deselect if clicking on a connection path, circle, or g element
      if (target && (target.tagName === 'path' || target.tagName === 'circle' || target.tagName === 'g')) {
        // Check if it's within our connection SVG
        const svg = (target as any).closest?.('svg');
        if (svg) {
          return; // Don't deselect if clicking on connection SVG elements
        }
      }
      // Deselect if clicking elsewhere
      setSelectedConnectionId(null);
    };

    if (selectedConnectionId) {
      document.addEventListener('click', handleDocumentClick);
      return () => document.removeEventListener('click', handleDocumentClick);
    }
  }, [selectedConnectionId]);

  // Handle node hover during drag to show cursor feedback for invalid connections
  useEffect(() => {
    if (!activeDrag) {
      // Clear all validity states when not dragging
      document.querySelectorAll('[data-node-side^="receive"]').forEach(node => {
        (node as HTMLElement).style.cursor = 'pointer';
        node.removeAttribute('data-connection-invalid');
      });
      return;
    }

    const handleNodeHover = (e: Event) => {
      const ce = e as CustomEvent;
      const { nodeId } = ce.detail || {};
      if (!nodeId) return;

      // Try to find specific receive node first, or any receive node for this ID
      let nodeElement = document.querySelector(`[data-node-id="${nodeId}"][data-node-side^="receive"]`) as HTMLElement | null;
      if (!nodeElement) return;

      const side = nodeElement.getAttribute('data-node-side') || 'receive';

      // Check if connection would be valid
      const isValid = checkConnectionValidity(activeDrag.from, nodeId, side);

      if (isValid) {
        nodeElement.style.cursor = 'pointer';
        nodeElement.removeAttribute('data-connection-invalid');
      } else {
        nodeElement.style.cursor = 'not-allowed';
        nodeElement.setAttribute('data-connection-invalid', 'true');
      }
    };

    const handleNodeLeave = (e: Event) => {
      const ce = e as CustomEvent;
      const { nodeId } = ce.detail || {};
      if (!nodeId) return;

      const nodeElement = document.querySelector(`[data-node-id="${nodeId}"][data-node-side^="receive"]`) as HTMLElement | null;
      if (nodeElement) {
        nodeElement.style.cursor = 'pointer';
        nodeElement.removeAttribute('data-connection-invalid');
      }
    };

    // Listen for hover events on receive nodes
    window.addEventListener('canvas-node-hover', handleNodeHover as any);
    window.addEventListener('canvas-node-leave', handleNodeLeave as any);

    return () => {
      window.removeEventListener('canvas-node-hover', handleNodeHover as any);
      window.removeEventListener('canvas-node-leave', handleNodeLeave as any);
      // Clear validity states when drag ends
      document.querySelectorAll('[data-node-side^="receive"]').forEach(node => {
        (node as HTMLElement).style.cursor = 'pointer';
        node.removeAttribute('data-connection-invalid');
      });
    };
  }, [activeDrag, checkConnectionValidity]);

  return {
    activeDrag,
    selectedConnectionId,
    setSelectedConnectionId,
    componentMenu,
    setComponentMenu,
    componentMenuSearch,
    setComponentMenuSearch,
    handleDeleteConnection,
  };
}

