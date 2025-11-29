import { useState, useEffect, useCallback } from 'react';
import Konva from 'konva';
import { Connection, ActiveDrag, ImageModalState } from './types';
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
  removeBgModalStates?: any[];
  eraseModalStates?: any[];
  replaceModalStates?: any[];
  expandModalStates?: any[];
  vectorizeModalStates?: any[];
  storyboardModalStates?: any[];
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
  removeBgModalStates,
  eraseModalStates,
  replaceModalStates,
  expandModalStates,
  vectorizeModalStates,
  storyboardModalStates,
  sceneFrameModalStates,
}: UseConnectionManagerProps) {
  const [localConnections, setLocalConnections] = useState<Connection[]>([]);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [dimmedFrameId, setDimmedFrameId] = useState<string | null>(null);
  const [componentMenu, setComponentMenu] = useState<{ x: number; y: number; canvasX: number; canvasY: number; sourceNodeId?: string; connectionColor?: string } | null>(null);
  const [componentMenuSearch, setComponentMenuSearch] = useState('');

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
      image: ['image', 'video', 'upscale', 'removebg', 'erase', 'replace', 'expand', 'vectorize', 'storyboard'],
      video: ['video'],
      music: ['video'],
    };

    if (!allowedMap[fromType] || !allowedMap[fromType].includes(toType)) {
      return false;
    }

    // Additional validation for media connections:
    // Check if source is media (Library Image or Uploaded Image)
    const fromModal = imageModalStates.find(m => m.id === fromId);
    const isFromMedia = fromModal && (
      fromModal.model === 'Library Image' ||
      fromModal.model === 'Uploaded Image' ||
      (!fromModal.model && fromModal.generatedImageUrl && !fromModal.prompt)
    );

    // Check if target is image generation modal
    const toModal = imageModalStates.find(m => m.id === toId);
    const isToImageGeneration = toType === 'image' && toModal;
    const isToMedia = toModal && (
      toModal.model === 'Library Image' ||
      toModal.model === 'Uploaded Image' ||
      (!toModal.model && toModal.generatedImageUrl && !toModal.prompt)
    );

    // Block: Image generation cannot connect to media
    if (fromType === 'image' && fromModal && !isFromMedia && isToMedia) {
      return false;
    }

    // Block: Media cannot connect to image generation that already has an image
    if (isFromMedia && isToImageGeneration && toModal && toModal.generatedImageUrl) {
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
      if (!activeDrag) return;
      if (!side || !side.startsWith('receive')) return;
      if (id === activeDrag.from) { // ignore self
        setActiveDrag(null);
        try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) { }
        return;
      }

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

      const allowedMap: Record<string, string[]> = {
        text: ['image', 'video', 'music', 'storyboard'],
        image: ['image', 'video', 'upscale', 'removebg', 'erase', 'replace', 'expand', 'vectorize', 'storyboard'],
        video: ['video'],
        music: ['video'],
      };

      if (!fromType || !toType || !allowedMap[fromType] || !allowedMap[fromType].includes(toType)) {
        // Not an allowed connection — cancel drag and exit without creating it
        setActiveDrag(null);
        try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) { }
        return;
      }

      // Additional validation for media connections:
      // 1. Media can only connect to empty image generation modals
      // 2. Image generation modals cannot connect to media

      // Check if source is media (Library Image or Uploaded Image)
      const fromModal = imageModalStates.find(m => m.id === activeDrag.from);
      const isFromMedia = fromModal && (
        fromModal.model === 'Library Image' ||
        fromModal.model === 'Uploaded Image' ||
        (!fromModal.model && fromModal.generatedImageUrl && !fromModal.prompt) // Fallback: has image but no prompt = uploaded
      );

      // Check if target is image generation modal
      const toModal = imageModalStates.find(m => m.id === id);
      const isToImageGeneration = toType === 'image' && toModal;
      const isToMedia = toModal && (
        toModal.model === 'Library Image' ||
        toModal.model === 'Uploaded Image' ||
        (!toModal.model && toModal.generatedImageUrl && !toModal.prompt) // Fallback: has image but no prompt = uploaded
      );

      // Block: Image generation cannot connect to media
      if (fromType === 'image' && fromModal && !isFromMedia && isToMedia) {
        setActiveDrag(null);
        try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) { }
        return;
      }

      // Block: Media cannot connect to image generation that already has an image
      if (isFromMedia && isToImageGeneration && toModal && toModal.generatedImageUrl) {
        setActiveDrag(null);
        try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) { }
        return;
      }

      // Determine the specific target anchor (side)
      // We need to find the specific receive node we dropped on, similar to handleMove
      let targetSide = 'receive';
      const receiveNodes = Array.from(document.querySelectorAll('[data-node-side^="receive"]'));
      let minDistance = Infinity;
      let closestNodeId = null;

      // If we dropped on a specific node ID, try to find the closest receive point for that ID
      // or just find the closest receive point overall if ID matches
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

        if (distance < minDistance) {
          minDistance = distance;
          closestNodeId = nodeId;
          targetSide = node.getAttribute('data-node-side') || 'receive';
        }
      }

      // Add connection if not duplicate
      const fromCenter = computeNodeCenter(activeDrag.from, 'send', stageRef, position, scale, textInputStates, imageModalStates, videoModalStates, musicModalStates, upscaleModalStates, removeBgModalStates, eraseModalStates, replaceModalStates, expandModalStates, vectorizeModalStates, storyboardModalStates, sceneFrameModalStates);
      const toCenter = computeNodeCenter(id, targetSide, stageRef, position, scale, textInputStates, imageModalStates, videoModalStates, musicModalStates, upscaleModalStates, removeBgModalStates, eraseModalStates, replaceModalStates, expandModalStates, vectorizeModalStates, storyboardModalStates, sceneFrameModalStates);
      const connectorId = `connector-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      // Include toAnchor in the connection
      const newConn: Connection = {
        id: connectorId,
        from: activeDrag.from,
        to: id,
        color: activeDrag.color,
        fromX: fromCenter?.x,
        fromY: fromCenter?.y,
        toX: toCenter?.x,
        toY: toCenter?.y,
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

        // Clear dimming after successful connection
        if (dimmedFrameId === id) {
          try {
            window.dispatchEvent(new CustomEvent('canvas-frame-dim', { detail: { frameId: id, dimmed: false } }));
          } catch (err) { }
          setDimmedFrameId(null);
        }
      }
      setActiveDrag(null);
      try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) { }
    };
    const handleMove = (e: MouseEvent) => {
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
    const handleUp = (e?: MouseEvent) => {
      if (activeDrag) {
        // Check if we're releasing in empty space (not on a node)
        // If so, show component creation menu
        if (e) {
          const mouseX = e.clientX;
          const mouseY = e.clientY;

          // Check if we're near any receive node
          const receiveNodes = Array.from(document.querySelectorAll('[data-node-side^="receive"]'));
          let nearNode = false;
          const proximityThreshold = 60;

          for (const node of receiveNodes) {
            const rect = node.getBoundingClientRect();
            const nodeCenterX = rect.left + rect.width / 2;
            const nodeCenterY = rect.top + rect.height / 2;
            const distance = Math.sqrt(
              Math.pow(mouseX - nodeCenterX, 2) + Math.pow(mouseY - nodeCenterY, 2)
            );
            if (distance < proximityThreshold) {
              nearNode = true;
              break;
            }
          }

          // If not near any node, show component creation menu
          if (!nearNode) {
            // Convert screen coordinates to canvas coordinates
            const stage = stageRef.current;
            if (stage) {
              const stageBox = stage.container().getBoundingClientRect();
              const canvasX = (mouseX - stageBox.left - position.x) / scale;
              const canvasY = (mouseY - stageBox.top - position.y) / scale;
              setComponentMenu({ x: mouseX, y: mouseY, canvasX, canvasY, sourceNodeId: activeDrag.from, connectionColor: activeDrag.color });
            }
          }
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
      }
    };
    window.addEventListener('canvas-node-start', handleStart as any);
    window.addEventListener('canvas-node-complete', handleComplete as any);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp as any);
    return () => {
      window.removeEventListener('canvas-node-start', handleStart as any);
      window.removeEventListener('canvas-node-complete', handleComplete as any);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      document.body.style.cursor = ''; // Reset cursor on cleanup
    };
  }, [activeDrag, effectiveConnections, imageModalStates, onConnectionsChange, onPersistConnectorCreate, checkConnectionValidity, dimmedFrameId, stageRef, position, scale, textInputStates, videoModalStates, musicModalStates, upscaleModalStates, removeBgModalStates, eraseModalStates, replaceModalStates, vectorizeModalStates, storyboardModalStates, sceneFrameModalStates]);

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

