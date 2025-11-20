'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TextInput } from '@/components/TextInput';
import { ImageUploadModal } from '@/components/ImageUploadModal';
import { VideoUploadModal } from '@/components/VideoUploadModal';
import { getReplicateQueueStatus, getReplicateQueueResult, getFalQueueStatus, getFalQueueResult, getMiniMaxVideoStatus, getMiniMaxVideoFile } from '@/lib/api';
import { MusicUploadModal } from '@/components/MusicUploadModal';
import Konva from 'konva';
import { ImageUpload } from '@/types/canvas';

interface ModalOverlaysProps {
  textInputStates: Array<{ id: string; x: number; y: number; value?: string; autoFocusInput?: boolean }>;
  imageModalStates: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null; generatedImageUrls?: string[]; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; imageCount?: number; isGenerating?: boolean }>;
  videoModalStates: Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null; duration?: number; resolution?: string; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>;
  musicModalStates: Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number }>;
  selectedTextInputId: string | null;
  selectedTextInputIds: string[];
  selectedImageModalId: string | null;
  selectedImageModalIds: string[];
  selectedVideoModalId: string | null;
  selectedVideoModalIds: string[];
  selectedMusicModalId: string | null;
  selectedMusicModalIds: string[];
  clearAllSelections: () => void;
  setTextInputStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; value?: string; autoFocusInput?: boolean }>>>;
  setSelectedTextInputId: (id: string | null) => void;
  setSelectedTextInputIds: (ids: string[]) => void;
  setSelectedImageIndices: React.Dispatch<React.SetStateAction<number[]>>;
  setImageModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>>>;
  setSelectedImageModalId: (id: string | null) => void;
  setSelectedImageModalIds: (ids: string[]) => void;
  setVideoModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null; duration?: number; resolution?: string; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>>>;
  setSelectedVideoModalId: (id: string | null) => void;
  setSelectedVideoModalIds: (ids: string[]) => void;
  setMusicModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>>>;
  setSelectedMusicModalId: (id: string | null) => void;
  setSelectedMusicModalIds: (ids: string[]) => void;
  setSelectionTightRect?: (rect: { x: number; y: number; width: number; height: number } | null) => void;
  setIsDragSelection?: (value: boolean) => void;
  images?: ImageUpload[];
  onTextCreate?: (text: string, x: number, y: number) => void;
  onImageSelect?: (file: File) => void;
  onImageGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string, modalId?: string, imageCount?: number, sourceImageUrl?: string) => Promise<{ url: string; images?: Array<{ url: string }> } | null>;
  onVideoSelect?: (file: File) => void;
  onVideoGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string, duration: number, resolution?: string, modalId?: string, firstFrameUrl?: string, lastFrameUrl?: string) => Promise<{ generationId?: string; taskId?: string; provider?: string } | null>;
  onMusicSelect?: (file: File) => void;
  onMusicGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string) => Promise<string | null>;
  generatedVideoUrl?: string | null;
  generatedMusicUrl?: string | null;
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
  onAddImageToCanvas?: (url: string) => void;
  // Persistence callbacks for image generator modals
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
  onPersistImageModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>) => void | Promise<void>;
  onPersistImageModalDelete?: (id: string) => void | Promise<void>;
  // Persistence callbacks for video generator modals
  onPersistVideoModalCreate?: (modal: { id: string; x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; duration?: number }) => void | Promise<void>;
  onPersistVideoModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; duration?: number }>) => void | Promise<void>;
  onPersistVideoModalDelete?: (id: string) => void | Promise<void>;
  // Persistence callbacks for music generator modals
  onPersistMusicModalCreate?: (modal: { id: string; x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
  onPersistMusicModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>) => void | Promise<void>;
  onPersistMusicModalDelete?: (id: string) => void | Promise<void>;
  // Text generator persistence callbacks
  onPersistTextModalCreate?: (modal: { id: string; x: number; y: number; value?: string; autoFocusInput?: boolean }) => void | Promise<void>;
  onPersistTextModalMove?: (id: string, updates: Partial<{ x: number; y: number; value?: string }>) => void | Promise<void>;
  onPersistTextModalDelete?: (id: string) => void | Promise<void>;
  // Connector (node-to-node) persistence
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }>;
  onConnectionsChange?: (connections: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }>) => void;
  onPersistConnectorCreate?: (connector: { id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }) => void | Promise<void>;
  onPersistConnectorDelete?: (connectorId: string) => void | Promise<void>;
}

export const ModalOverlays: React.FC<ModalOverlaysProps> = ({
  textInputStates,
  imageModalStates,
  videoModalStates,
  musicModalStates,
  selectedTextInputId,
  selectedTextInputIds,
  selectedImageModalId,
  selectedImageModalIds,
  selectedVideoModalId,
  selectedVideoModalIds,
  selectedMusicModalId,
  selectedMusicModalIds,
  clearAllSelections,
  setTextInputStates,
  setSelectedTextInputId,
  setSelectedTextInputIds,
  setSelectedImageIndices,
  setImageModalStates,
  setSelectedImageModalId,
  setSelectedImageModalIds,
  setVideoModalStates,
  setSelectedVideoModalId,
  setSelectedVideoModalIds,
  setMusicModalStates,
  setSelectedMusicModalId,
  setSelectedMusicModalIds,
  setSelectionTightRect,
  setIsDragSelection,
  images = [],
  onTextCreate,
  onImageSelect,
  onImageGenerate,
  onVideoSelect,
  onVideoGenerate,
  onMusicSelect,
  onMusicGenerate,
  generatedVideoUrl,
  generatedMusicUrl,
  stageRef,
  scale,
  position,
  onAddImageToCanvas,
  onPersistImageModalCreate,
  onPersistImageModalMove,
  onPersistImageModalDelete,
  onPersistVideoModalCreate,
  onPersistVideoModalMove,
  onPersistVideoModalDelete,
  onPersistMusicModalCreate,
  onPersistMusicModalMove,
  onPersistMusicModalDelete,
  onPersistTextModalCreate,
  onPersistTextModalMove,
  onPersistTextModalDelete,
  connections: externalConnections,
  onConnectionsChange,
  onPersistConnectorCreate,
  onPersistConnectorDelete,
}) => {
  // Connection state (supports controlled or uncontrolled usage)
  const [localConnections, setLocalConnections] = useState<Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }>>([]);
  const connections = externalConnections ?? localConnections;
  const [activeDrag, setActiveDrag] = useState<null | { from: string; color: string; startX: number; startY: number; currentX: number; currentY: number }>(null);
  const [viewportUpdateKey, setViewportUpdateKey] = useState(0);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  
  // Force recalculation when viewport changes
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setViewportUpdateKey(prev => prev + 1);
    });
    return () => cancelAnimationFrame(rafId);
  }, [position.x, position.y, scale]);

  // Determine modal/component type for a given overlay/node id. Reads
  // `data-modal-component` from overlay or nearest ancestor and returns a
  // lowercase string like 'text' | 'image' | 'video' | 'music'.
  const getComponentType = (id?: string | null): string | null => {
    if (!id) return null;
    const overlay = document.querySelector(`[data-overlay-id="${id}"]`) as HTMLElement | null;
    if (overlay) {
      const attr = overlay.getAttribute('data-modal-component') || (overlay.dataset as any).modalComponent;
      if (attr) return String(attr).toLowerCase();
    }
    const frameEl = document.querySelector(`[data-frame-id="${id}-frame"]`) as HTMLElement | null;
    if (frameEl) {
      const comp = frameEl.closest('[data-modal-component]') as HTMLElement | null;
      if (comp) return (comp.getAttribute('data-modal-component') || (comp.dataset as any).modalComponent || '').toLowerCase() || null;
    }
    const nodeEl = document.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null;
    if (nodeEl) {
      // First check if the node itself has data-component-type (for canvas images)
      const componentType = nodeEl.getAttribute('data-component-type');
      if (componentType) return componentType.toLowerCase();
      // Otherwise check for modal component in ancestor
      const comp = nodeEl.closest('[data-modal-component]') as HTMLElement | null;
      if (comp) return (comp.getAttribute('data-modal-component') || (comp.dataset as any).modalComponent || '').toLowerCase() || null;
    }
    // Check if this is a canvas image (uploaded image) by looking for the node element
    // Canvas images have IDs like "canvas-image-{index}" or "element-{timestamp}-{random}"
    if (id.startsWith('canvas-image-') || id.startsWith('element-')) {
      // Try to find the node element to get its component type
      const canvasNodeEl = document.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null;
      if (canvasNodeEl) {
        const componentType = canvasNodeEl.getAttribute('data-component-type');
        if (componentType) return componentType.toLowerCase();
      }
      // Fallback: assume 'image' for canvas images
      return 'image';
    }
    return null;
  };

  // Helper function to check if a connection would be valid
  const checkConnectionValidity = useCallback((fromId: string, toId: string): boolean => {
    if (fromId === toId) return false; // Can't connect to self

    const fromType = getComponentType(fromId);
    const toType = getComponentType(toId);
    
    if (!fromType || !toType) return false;

    // Check basic allowed connections
    const allowedMap: Record<string, string[]> = {
      text: ['image', 'video', 'music'],
      image: ['image', 'video'],
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
      if (side !== 'receive') return;
      if (id === activeDrag.from) { // ignore self
        setActiveDrag(null);
        try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) {}
        return;
      }

      // Determine component types for both ends and enforce allowed connections
      const fromType = getComponentType(activeDrag.from);
      const toType = getComponentType(id);
      const allowedMap: Record<string, string[]> = {
        text: ['image', 'video', 'music'],
        image: ['image', 'video'],
        video: ['video'],
        music: ['video'],
      };

      if (!fromType || !toType || !allowedMap[fromType] || !allowedMap[fromType].includes(toType)) {
        // Not an allowed connection — cancel drag and exit without creating it
        setActiveDrag(null);
        try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) {}
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
        try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) {}
        return;
      }

      // Block: Media cannot connect to image generation that already has an image
      if (isFromMedia && isToImageGeneration && toModal && toModal.generatedImageUrl) {
        setActiveDrag(null);
        try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) {}
        return;
      }

      // Add connection if not duplicate
      const fromCenter = computeNodeCenter(activeDrag.from, 'send');
      const toCenter = computeNodeCenter(id, 'receive');
      const connectorId = `connector-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const newConn = { id: connectorId, from: activeDrag.from, to: id, color: activeDrag.color, fromX: fromCenter?.x, fromY: fromCenter?.y, toX: toCenter?.x, toY: toCenter?.y };
      const exists = connections.find((c: any) => c.from === activeDrag.from && c.to === id);
      if (!exists) {
        if (onConnectionsChange) {
          try { onConnectionsChange([...connections, newConn]); } catch (e) { console.warn('onConnectionsChange failed', e); }
        } else {
          setLocalConnections(prev => [...prev, newConn]);
        }

        // Persist connector via parent handler if provided
        if (onPersistConnectorCreate) {
          try { Promise.resolve(onPersistConnectorCreate(newConn)).catch(console.error); } catch (e) { console.error('onPersistConnectorCreate failed', e); }
        }
      }
      setActiveDrag(null);
      try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) {}
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
        distance: number;
      };
      
      let nearestNode: NearestNode | null = null;
      
      // Find all receive nodes and check distance
      const receiveNodes = Array.from(document.querySelectorAll('[data-node-side="receive"]'));
      for (const node of receiveNodes) {
        const nodeId = node.getAttribute('data-node-id');
        if (!nodeId) continue;
        
        const rect = node.getBoundingClientRect();
        const nodeCenterX = rect.left + rect.width / 2;
        const nodeCenterY = rect.top + rect.height / 2;
        
        const distance = Math.sqrt(
          Math.pow(mouseX - nodeCenterX, 2) + Math.pow(mouseY - nodeCenterY, 2)
        );
        
        if (distance < proximityThreshold) {
          if (!nearestNode || distance < nearestNode.distance) {
            nearestNode = { id: nodeId, distance };
          }
        }
      }
      
      // Update cursor based on nearest node validity
      if (nearestNode !== null) {
        const nodeId = nearestNode.id;
        const isValid = checkConnectionValidity(activeDrag.from, nodeId);
        document.body.style.cursor = isValid ? 'pointer' : 'not-allowed';
      } else {
        document.body.style.cursor = 'default';
      }
    };
    const handleUp = () => {
      if (activeDrag) {
        setActiveDrag(null);
        document.body.style.cursor = ''; // Reset cursor
        try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) {}
      }
    };
    window.addEventListener('canvas-node-start', handleStart as any);
    window.addEventListener('canvas-node-complete', handleComplete as any);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('canvas-node-start', handleStart as any);
      window.removeEventListener('canvas-node-complete', handleComplete as any);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      document.body.style.cursor = ''; // Reset cursor on cleanup
    };
  }, [activeDrag, connections, imageModalStates, onConnectionsChange, onPersistConnectorCreate, checkConnectionValidity]);

  // Handle connection deletion
  const handleDeleteConnection = useCallback((connectionId: string) => {
    const connectionToDelete = connections.find(c => (c.id || `${c.from}-${c.to}`) === connectionId);
    if (!connectionToDelete) return;

    // Remove connection from state
    if (onConnectionsChange) {
      try {
        onConnectionsChange(connections.filter(c => (c.id || `${c.from}-${c.to}`) !== connectionId));
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
  }, [connections, onConnectionsChange, onPersistConnectorDelete]);

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
      document.querySelectorAll('[data-node-side="receive"]').forEach(node => {
        (node as HTMLElement).style.cursor = 'pointer';
        node.removeAttribute('data-connection-invalid');
      });
      return;
    }

    const handleNodeHover = (e: Event) => {
      const ce = e as CustomEvent;
      const { nodeId } = ce.detail || {};
      if (!nodeId) return;

      const nodeElement = document.querySelector(`[data-node-id="${nodeId}"][data-node-side="receive"]`) as HTMLElement | null;
      if (!nodeElement) return;

      // Check if connection would be valid
      const isValid = checkConnectionValidity(activeDrag.from, nodeId);
      
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

      const nodeElement = document.querySelector(`[data-node-id="${nodeId}"][data-node-side="receive"]`) as HTMLElement | null;
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
      document.querySelectorAll('[data-node-side="receive"]').forEach(node => {
        (node as HTMLElement).style.cursor = 'pointer';
        node.removeAttribute('data-connection-invalid');
      });
    };
  }, [activeDrag, checkConnectionValidity]);

  // Compute line endpoints. Prefer anchoring to the inner frame element (if present),
  // then to the overlay container, falling back to the small node center.
  const computeNodeCenter = (id: string, side: 'send' | 'receive'): { x: number; y: number } | null => {
    if (!id) return null;
    // Prefer frame element (set via data-frame-id on inner frame)
    const frameEl = document.querySelector(`[data-frame-id="${id}-frame"]`);
    if (frameEl) {
      const rect = frameEl.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      if (side === 'send') return { x: Math.round(rect.right), y: Math.round(centerY) };
      return { x: Math.round(rect.left), y: Math.round(centerY) };
    }

    // Next prefer the overlay container
    const overlay = document.querySelector(`[data-overlay-id="${id}"]`);
    if (overlay) {
      const rect = overlay.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      if (side === 'send') return { x: Math.round(rect.right), y: Math.round(centerY) };
      return { x: Math.round(rect.left), y: Math.round(centerY) };
    }

    // Fallback: use the small node element position (circle center)
    const el = document.querySelector(`[data-node-id="${id}"][data-node-side="${side}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      return { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) };
    }

    // If DOM elements are not present (or during transforms), try computing from stage transform
    try {
      const stage = stageRef?.current as any;
      if (stage && typeof stage.container === 'function') {
        const containerRect = stage.container().getBoundingClientRect();
        // Try to find modal state by id to get its canvas coords and size
        const findModal = () => {
          const t = textInputStates.find(t => t.id === id);
          if (t) return { x: t.x, y: t.y, width: 300, height: 100 };
          const im = imageModalStates.find(m => m.id === id);
          if (im) return { x: im.x, y: im.y, width: (im as any).frameWidth || 600, height: (im as any).frameHeight || 400 };
          const vm = videoModalStates.find(m => m.id === id);
          if (vm) return { x: vm.x, y: vm.y, width: (vm as any).frameWidth || 600, height: (vm as any).frameHeight || 338 };
          const mm = musicModalStates.find(m => m.id === id);
          if (mm) return { x: mm.x, y: mm.y, width: (mm as any).frameWidth || 600, height: (mm as any).frameHeight || 300 };
          return null;
        };
        const modal = findModal();
        if (modal) {
          const centerX = Math.round(containerRect.left + position.x + (modal.x * scale) + ((modal.width * scale) / 2));
          const centerY = Math.round(containerRect.top + position.y + (modal.y * scale) + ((modal.height * scale) / 2));
          if (side === 'send') return { x: Math.round(centerX + (modal.width * scale) / 2), y: centerY };
          return { x: Math.round(centerX - (modal.width * scale) / 2), y: centerY };
        }
      }
    } catch (err) {
      // ignore and fallbacki
    }
    return null;
  };

  // Memoize connection lines to recalculate when viewport changes
  const connectionLines = useMemo(() => {
    // Define computeNodeCenter inside useMemo to ensure it uses latest values
    const computeNodeCenter = (id: string, side: 'send' | 'receive'): { x: number; y: number } | null => {
      if (!id) return null;
      // Prefer frame element (set via data-frame-id on inner frame)
      const frameEl = document.querySelector(`[data-frame-id="${id}-frame"]`);
      if (frameEl) {
        const rect = frameEl.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        if (side === 'send') return { x: Math.round(rect.right), y: Math.round(centerY) };
        return { x: Math.round(rect.left), y: Math.round(centerY) };
      }

      // Next prefer the overlay container
      const overlay = document.querySelector(`[data-overlay-id="${id}"]`);
      if (overlay) {
        const rect = overlay.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        if (side === 'send') return { x: Math.round(rect.right), y: Math.round(centerY) };
        return { x: Math.round(rect.left), y: Math.round(centerY) };
      }

      // Fallback: use the small node element position (circle center)
      const el = document.querySelector(`[data-node-id="${id}"][data-node-side="${side}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        return { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) };
      }

      // If DOM elements are not present (or during transforms), try computing from stage transform
      try {
        const stage = stageRef?.current as any;
        if (stage && typeof stage.container === 'function') {
          const containerRect = stage.container().getBoundingClientRect();
          // Try to find modal state by id to get its canvas coords and size
          const findModal = () => {
            const t = textInputStates.find(t => t.id === id);
            if (t) return { x: t.x, y: t.y, width: 300, height: 100 };
            const im = imageModalStates.find(m => m.id === id);
            if (im) return { x: im.x, y: im.y, width: (im as any).frameWidth || 600, height: (im as any).frameHeight || 400 };
            const vm = videoModalStates.find(m => m.id === id);
            if (vm) return { x: vm.x, y: vm.y, width: (vm as any).frameWidth || 600, height: (vm as any).frameHeight || 338 };
            const mm = musicModalStates.find(m => m.id === id);
            if (mm) return { x: mm.x, y: mm.y, width: (mm as any).frameWidth || 600, height: (mm as any).frameHeight || 300 };
            return null;
          };
          const modal = findModal();
          if (modal) {
            const centerX = Math.round(containerRect.left + position.x + (modal.x * scale) + ((modal.width * scale) / 2));
            const centerY = Math.round(containerRect.top + position.y + (modal.y * scale) + ((modal.height * scale) / 2));
            if (side === 'send') return { x: Math.round(centerX + (modal.width * scale) / 2), y: centerY };
            return { x: Math.round(centerX - (modal.width * scale) / 2), y: centerY };
          }
        }
      } catch (err) {
        // ignore and fallback
      }
      return null;
    };

    // Filter out duplicates and compute connection lines
    const seen = new Set<string>();
    return connections
      .map(conn => {
        // Create a unique key for deduplication
        const uniqueKey = `${conn.from}-${conn.to}`;
        
        // Skip if we've already seen this connection
        if (seen.has(uniqueKey)) {
          return null;
        }
        seen.add(uniqueKey);
        
    const fromCenter = computeNodeCenter(conn.from, 'send');
    const toCenter = computeNodeCenter(conn.to, 'receive');
    if (!fromCenter || !toCenter) return null;
    return { ...conn, fromX: fromCenter.x, fromY: fromCenter.y, toX: toCenter.x, toY: toCenter.y };
      })
      .filter(Boolean) as Array<{ id?: string; from: string; to: string; color: string; fromX: number; fromY: number; toX: number; toY: number }>;
  }, [connections, position.x, position.y, scale, textInputStates, imageModalStates, videoModalStates, musicModalStates, viewportUpdateKey, stageRef]);

  // Compute bounding rect for a node/modal to place the run icon just outside
  const computeNodeBounds = (id: string): DOMRect | null => {
    if (!id) return null;
    const frameEl = document.querySelector(`[data-frame-id="${id}-frame"]`) as HTMLElement | null;
    if (frameEl) return frameEl.getBoundingClientRect();
    const overlay = document.querySelector(`[data-overlay-id="${id}"]`) as HTMLElement | null;
    if (overlay) return overlay.getBoundingClientRect();
    const nodeEl = document.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null;
    if (nodeEl) return nodeEl.getBoundingClientRect();
    return null;
  };

  

  // Compute stroke size mapping from canvas scale so lines get thicker when zoomed in
  const effectiveScale = typeof scale === 'number' && !isNaN(scale) ? scale : 1;
  const computeStrokeForScale = (base = 2) => {
    // Multiply base by current scale, clamp to a reasonable range
    const raw = base * effectiveScale;
    return Math.max(0.5, Math.min(8, Math.round(raw * 10) / 10));
  };

  const computeCircleRadiusForScale = (base = 3) => {
    const raw = base * effectiveScale;
    return Math.max(1, Math.min(8, Math.round(raw * 10) / 10));
  };

  return (
    <>
      {/* SVG overlay for connection lines */}
      <svg
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 1999 }}
      >
        {connectionLines.map((line, index) => {
          const connectionId = line.id || `conn-${line.from}-${line.to}-${index}`;
          const isSelected = selectedConnectionId === connectionId;
          const strokeColor = isSelected ? '#1e3a5f' : '#437eb5'; // Darker when selected
          // When selected, use exactly 1px (not scaled). Otherwise use scaled width
          const strokeWidth = isSelected ? 1 : computeStrokeForScale(2);
          
          return (
            <g key={connectionId}>
              <path
                d={`M ${line.fromX} ${line.fromY} C ${(line.fromX + line.toX) / 2} ${line.fromY}, ${(line.fromX + line.toX) / 2} ${line.toY}, ${line.toX} ${line.toY}`}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                style={{ 
                  filter: isSelected ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.18))',
                  pointerEvents: 'auto', // Make path clickable
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedConnectionId(connectionId);
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.stroke = '#2a4d73';
                    e.currentTarget.style.strokeWidth = String(computeStrokeForScale(2.2));
                  } else {
                    // Keep selected state (darker, 1px)
                    e.currentTarget.style.stroke = '#1e3a5f';
                    e.currentTarget.style.strokeWidth = '1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.stroke = '#437eb5';
                    e.currentTarget.style.strokeWidth = String(computeStrokeForScale(2));
                  } else {
                    // Keep selected state
                    e.currentTarget.style.stroke = '#1e3a5f';
                    e.currentTarget.style.strokeWidth = '1';
                  }
                }}
              />
              <circle 
                cx={line.fromX} 
                cy={line.fromY} 
                r={computeCircleRadiusForScale(3)} 
                fill={strokeColor} 
                vectorEffect="non-scaling-stroke"
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedConnectionId(connectionId);
                }}
              />
              <circle 
                cx={line.toX} 
                cy={line.toY} 
                r={computeCircleRadiusForScale(3)} 
                fill={strokeColor} 
                vectorEffect="non-scaling-stroke"
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedConnectionId(connectionId);
                }}
              />
            </g>
          );
        })}
        {activeDrag && (
          <path
            d={`M ${activeDrag.startX} ${activeDrag.startY} C ${(activeDrag.startX + activeDrag.currentX) / 2} ${activeDrag.startY}, ${(activeDrag.startX + activeDrag.currentX) / 2} ${activeDrag.currentY}, ${activeDrag.currentX} ${activeDrag.currentY}`}
            stroke="#437eb5"
            strokeWidth={computeStrokeForScale(1.6)}
            vectorEffect="non-scaling-stroke"
            fill="none"
            strokeDasharray="6 4"
          />
        )}
      </svg>
      
      {/* Text Input Overlays */}
      {textInputStates.map((textState) => (
        <TextInput
          key={textState.id}
          id={textState.id}
          x={textState.x}
          y={textState.y}
          autoFocusInput={(textState as any).autoFocusInput}
          isSelected={selectedTextInputId === textState.id || selectedTextInputIds.includes(textState.id)}
          onConfirm={(text) => {
            if (onTextCreate) {
              onTextCreate(text, textState.x, textState.y);
            }
            if (onPersistTextModalDelete) {
              Promise.resolve(onPersistTextModalDelete(textState.id)).catch(console.error);
            }
            setTextInputStates(prev => prev.filter(t => t.id !== textState.id));
            setSelectedTextInputId(null);
          }}
          onCancel={() => {
            if (onPersistTextModalDelete) {
              Promise.resolve(onPersistTextModalDelete(textState.id)).catch(console.error);
            }
            setTextInputStates(prev => prev.filter(t => t.id !== textState.id));
            setSelectedTextInputId(null);
          }}
          onPositionChange={(newX, newY) => {
            setTextInputStates(prev => prev.map(t => 
              t.id === textState.id ? { ...t, x: newX, y: newY } : t
            ));
            if (onPersistTextModalMove) {
              Promise.resolve(onPersistTextModalMove(textState.id, { x: newX, y: newY })).catch(console.error);
            }
          }}
          onSelect={() => {
            // Clear all other selections first
            clearAllSelections();
            // Then set this text input as selected
            setSelectedTextInputId(textState.id);
            setSelectedTextInputIds([textState.id]);
          }}
          onDelete={() => {
            if (onPersistTextModalDelete) {
              Promise.resolve(onPersistTextModalDelete(textState.id)).catch(console.error);
            }
            setTextInputStates(prev => prev.filter(t => t.id !== textState.id));
            setSelectedTextInputId(null);
          }}
          onDuplicate={() => {
            // Create a duplicate of the text input to the right
            const duplicated = {
              id: `text-${Date.now()}-${Math.random()}`,
              x: textState.x + 300 + 50, // 300px width + 50px spacing
              y: textState.y, // Same Y position
              value: textState.value || ''
            };
            setTextInputStates(prev => [...prev, duplicated]);
          }}
          onValueChange={(val) => {
            setTextInputStates(prev => prev.map(t => t.id === textState.id ? { ...t, value: val } : t));
            if (onPersistTextModalMove) {
              Promise.resolve(onPersistTextModalMove(textState.id, { value: val })).catch(console.error);
            }
          }}
          stageRef={stageRef}
          scale={scale}
          position={position}
        />
      ))}
      {/* Image Upload Modal Overlays */}
      {imageModalStates.map((modalState) => (
        <ImageUploadModal
          key={modalState.id}
          isOpen={true}
          id={modalState.id}
          onClose={() => {
            setImageModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedImageModalId(null);
            if (onPersistImageModalDelete) {
              Promise.resolve(onPersistImageModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onGenerate={async (prompt, model, frame, aspectRatio) => {
            if (onImageGenerate) {
              try {
                const imageCount = (modalState as any).imageCount || 1;
                const result = await onImageGenerate(prompt, model, frame, aspectRatio, modalState.id, imageCount);
                if (result) {
                  // Extract image URLs
                  const imageUrls = result.images && result.images.length > 0 
                    ? result.images.map(img => img.url)
                    : result.url 
                      ? [result.url]
                      : [];
                  
                  // Keep the modal visible and show the generated image(s) inside the frame
                  setImageModalStates(prev => prev.map(m => m.id === modalState.id ? { 
                    ...m, 
                    generatedImageUrl: imageUrls[0] || null,
                    generatedImageUrls: imageUrls,
                  } : m));
                  if (onPersistImageModalMove) {
                    // Compute frame size: width fixed 600, height based on aspect ratio (min 400)
                    const [w, h] = aspectRatio.split(':').map(Number);
                    const frameWidth = 600;
                    const ar = w && h ? (w / h) : 1;
                    const rawHeight = ar ? Math.round(frameWidth / ar) : 600;
                    const frameHeight = Math.max(400, rawHeight);
                    Promise.resolve(onPersistImageModalMove(modalState.id, {
                      generatedImageUrl: imageUrls[0] || null,
                      generatedImageUrls: imageUrls,
                      model,
                      frame,
                      aspectRatio,
                      frameWidth,
                      frameHeight,
                      prompt,
                    } as any)).catch(console.error);
                  }
                }
              } catch (error) {
                console.error('Error generating image:', error);
                // Error is already handled in the modal component
              }
            }
          }}
          generatedImageUrl={modalState.generatedImageUrl}
          generatedImageUrls={(modalState as any).generatedImageUrls}
          isGenerating={(modalState as any).isGenerating}
          initialModel={(modalState as any).model}
          initialFrame={(modalState as any).frame}
          initialAspectRatio={(modalState as any).aspectRatio}
          initialPrompt={(modalState as any).prompt}
          onOptionsChange={(opts) => {
            // Update local state to keep UI in sync
            setImageModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, ...opts, frameWidth: opts.frameWidth ?? m.frameWidth, frameHeight: opts.frameHeight ?? m.frameHeight, model: opts.model ?? m.model, frame: opts.frame ?? m.frame, aspectRatio: opts.aspectRatio ?? m.aspectRatio, prompt: opts.prompt ?? m.prompt } : m));
            // Persist to parent (which will broadcast + snapshot)
            if (onPersistImageModalMove) {
              Promise.resolve(onPersistImageModalMove(modalState.id, opts as any)).catch(console.error);
            }
          }}
          onAddToCanvas={onAddImageToCanvas}
          onSelect={() => {
            // Clear all other selections first
            clearAllSelections();
            // Then set this modal as selected
            setSelectedImageModalId(modalState.id);
            setSelectedImageModalIds([modalState.id]);
          }}
          onDelete={() => {
            setImageModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedImageModalId(null);
            if (onPersistImageModalDelete) {
              Promise.resolve(onPersistImageModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onDownload={async () => {
            // Download the generated image if available
            if (modalState.generatedImageUrl) {
              try {
                // Fetch the image to handle CORS issues
                const response = await fetch(modalState.generatedImageUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `generated-image-${modalState.id}-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              } catch (error) {
                console.error('Failed to download image:', error);
                // Fallback: try direct download
                const link = document.createElement('a');
                link.href = modalState.generatedImageUrl!;
                link.download = `generated-image-${modalState.id}-${Date.now()}.png`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            }
          }}
          onDuplicate={() => {
            // Create a duplicate of the image modal to the right
            const duplicated = {
              id: `image-modal-${Date.now()}`,
              x: modalState.x + 600 + 50, // 600px width + 50px spacing
              y: modalState.y, // Same Y position
              generatedImageUrl: modalState.generatedImageUrl,
            };
            setImageModalStates(prev => [...prev, duplicated]);
            if (onPersistImageModalCreate) {
              Promise.resolve(onPersistImageModalCreate(duplicated)).catch(console.error);
            }
          }}
          isSelected={selectedImageModalId === modalState.id || selectedImageModalIds.includes(modalState.id)}
          x={modalState.x}
          y={modalState.y}
          onPositionChange={(newX, newY) => {
            setImageModalStates(prev => prev.map(m => 
              m.id === modalState.id ? { ...m, x: newX, y: newY } : m
            ));
          }}
          onPositionCommit={(finalX, finalY) => {
            if (onPersistImageModalMove) {
              Promise.resolve(onPersistImageModalMove(modalState.id, { x: finalX, y: finalY })).catch(console.error);
            }
          }}
          stageRef={stageRef}
          scale={scale}
          position={position}
          onPersistImageModalCreate={onPersistImageModalCreate}
          onImageGenerate={onImageGenerate}
          initialCount={(modalState as any).imageCount}
          onUpdateModalState={(modalId, updates) => {
            setImageModalStates(prev => prev.map(m => m.id === modalId ? { ...m, ...updates } : m));
            if (onPersistImageModalMove) {
              Promise.resolve(onPersistImageModalMove(modalId, updates)).catch(console.error);
            }
          }}
          connections={connections}
          imageModalStates={imageModalStates}
          images={images}
        />
      ))}
      {/* Video Upload Modal Overlays */}
      {videoModalStates.map((modalState) => (
        <VideoUploadModal
          key={modalState.id}
          isOpen={true}
          id={modalState.id}
          onClose={() => {
            setVideoModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedVideoModalId(null);
            if (onPersistVideoModalDelete) {
              Promise.resolve(onPersistVideoModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onGenerate={async (prompt, model, frame, aspectRatio, duration, resolution, firstFrameUrl, lastFrameUrl) => {
            if (!onVideoGenerate) return null;
            try {
              // Submit generation (returns taskId + generationId + provider)
              const submitRes = await onVideoGenerate(prompt, model, frame, aspectRatio, duration || modalState.duration || 5, resolution || modalState.resolution, modalState.id, firstFrameUrl, lastFrameUrl);
              const taskId = submitRes?.taskId;
              const generationId = submitRes?.generationId;
              const provider = submitRes?.provider || 'replicate'; // Default to replicate for backward compatibility
              
              if (onPersistVideoModalMove) {
                const [w, h] = aspectRatio.split(':').map(Number);
                const frameWidth = 600;
                const ar = w && h ? (w / h) : 16/9;
                const rawHeight = ar ? Math.round(frameWidth / ar) : 338;
                const frameHeight = Math.max(400, rawHeight);
                Promise.resolve(onPersistVideoModalMove(modalState.id, {
                  model,
                  frame,
                  aspectRatio,
                  prompt,
                  duration: duration || modalState.duration || 5,
                  resolution: resolution || modalState.resolution,
                  frameWidth,
                  frameHeight,
                  taskId,
                  generationId,
                  provider,
                  status: 'submitted',
                } as any)).catch(console.error);
              }
              // Optimistic state update with tracking fields
              setVideoModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, model, frame, aspectRatio, prompt, duration: duration || modalState.duration || 5, resolution: resolution || modalState.resolution, taskId, generationId, provider } : m));
              if (!taskId) return null;
              
              // Determine which service to poll based on provider or model
              const isFalModel = provider === 'fal' || model?.toLowerCase().includes('sora') || model?.toLowerCase().includes('veo') || model?.toLowerCase().includes('ltx');
              const isMiniMaxModel = provider === 'minimax' || model?.toLowerCase().includes('minimax') || model?.toLowerCase().includes('hailuo');
              
              // Poll for completion
              const pollIntervalMs = 3000;
              const maxAttempts = 600; // ~30 minutes max
              for (let attempt = 0; attempt < maxAttempts; attempt++) {
                try {
                  let statusData: any;
                  let statusVal: string;
                  
                  // Use appropriate polling endpoint based on provider
                  if (isFalModel) {
                    statusData = await getFalQueueStatus(taskId);
                    statusVal = String(statusData?.status || '').toLowerCase();
                  } else if (isMiniMaxModel) {
                    statusData = await getMiniMaxVideoStatus(taskId);
                    // MiniMax status structure: result.status or base_resp.status_code
                    // Check result.status_code (0 = success, 1 = processing)
                    const resultStatusCode = statusData?.result?.status_code;
                    const baseRespCode = statusData?.base_resp?.status_code;
                    const resultStatus = statusData?.result?.status || statusData?.status;
                    
                    // MiniMax: 0 = success, 1 = processing, other = error
                    // Also check if file_id exists (indicates completion)
                    const hasFileId = !!(statusData?.result?.file_id || statusData?.file_id);
                    
                    if (hasFileId || resultStatusCode === 0 || baseRespCode === 0 || resultStatus === 'SUCCESS' || resultStatus === 'success') {
                      statusVal = 'completed';
                    } else if (resultStatusCode === 1 || baseRespCode === 1 || resultStatus === 'PROCESSING' || resultStatus === 'processing') {
                      statusVal = 'processing';
                    } else {
                      statusVal = 'failed';
                    }
                  } else {
                    // Default to Replicate
                    statusData = await getReplicateQueueStatus(taskId);
                    statusVal = String(statusData?.status || '').toLowerCase();
                  }
                  
                  if (statusVal === 'completed' || statusVal === 'succeeded' || statusVal === 'success') {
                    // Fetch result via appropriate helper
                    let resultData: any;
                    let videoUrl: string | null = null;
                    
                    if (isFalModel) {
                      resultData = await getFalQueueResult(taskId);
                    } else if (isMiniMaxModel) {
                      // MiniMax: get file_id from status response and fetch file
                      const fileId = statusData?.result?.file_id || statusData?.file_id;
                      if (fileId && generationId) {
                        resultData = await getMiniMaxVideoFile(fileId, generationId);
                        // MiniMax file response structure: processVideoFile returns videos array
                        if (resultData?.videos && Array.isArray(resultData.videos) && resultData.videos[0]?.url) {
                          videoUrl = resultData.videos[0].url;
                        } else {
                          videoUrl = resultData?.download_url || resultData?.url || resultData?.result?.download_url || resultData?.file?.url;
                        }
                      }
                    } else {
                      resultData = await getReplicateQueueResult(taskId);
                    }
                    
                    // Determine URL from known shapes (for non-MiniMax)
                    if (!videoUrl) {
                    if (Array.isArray(resultData?.videos) && resultData.videos[0]?.url) {
                      videoUrl = resultData.videos[0].url;
                    } else if (resultData?.video?.url) {
                      videoUrl = resultData.video.url;
                    } else if (typeof resultData?.output === 'string' && resultData.output.startsWith('http')) {
                      videoUrl = resultData.output;
                    } else if (Array.isArray(resultData?.output) && typeof resultData.output[0] === 'string') {
                      videoUrl = resultData.output[0];
                      } else if (resultData?.data?.video?.url) {
                        videoUrl = resultData.data.video.url;
                    }
                    }
                    
                    if (videoUrl) {
                      setVideoModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, generatedVideoUrl: videoUrl } : m));
                      if (onPersistVideoModalMove) {
                        Promise.resolve(onPersistVideoModalMove(modalState.id, {
                          generatedVideoUrl: videoUrl,
                          status: 'completed',
                        } as any)).catch(console.error);
                      }
                      break;
                    }
                    // If result doesn't include URL yet, continue polling briefly
                  } else if (statusVal === 'failed' || statusVal === 'error') {
                    console.error('[Canvas Video Poll] generation failed', { taskId, status: statusVal, provider });
                    if (onPersistVideoModalMove) {
                      Promise.resolve(onPersistVideoModalMove(modalState.id, { status: 'failed' } as any)).catch(console.error);
                    }
                    break;
                  }
                } catch (pollErr: any) {
                  // Handle 404 - prediction not found, stop polling
                  if (pollErr?.status === 404 || pollErr?.isNotFound) {
                    console.error('[Canvas Video Poll] Prediction not found (404)', { taskId, provider, error: pollErr?.message });
                    if (onPersistVideoModalMove) {
                      Promise.resolve(onPersistVideoModalMove(modalState.id, { 
                        status: 'failed',
                        error: pollErr?.message || 'Prediction not found. The prediction may have been deleted or expired.'
                      } as any)).catch(console.error);
                    }
                    break; // Stop polling
                  }
                  console.warn('[Canvas Video Poll] status check error', pollErr, { provider, taskId });
                }
                await new Promise(r => setTimeout(r, pollIntervalMs));
              }
            } catch (e) {
              console.error('Error generating video:', e);
              if (onPersistVideoModalMove) {
                Promise.resolve(onPersistVideoModalMove(modalState.id, { status: 'error' } as any)).catch(console.error);
              }
            }
            return null;
          }}
          generatedVideoUrl={modalState.generatedVideoUrl}
          initialModel={modalState.model}
          initialFrame={modalState.frame}
          initialAspectRatio={modalState.aspectRatio}
          initialDuration={modalState.duration || 5}
          initialResolution={modalState.resolution}
          initialPrompt={modalState.prompt}
          onOptionsChange={(opts) => {
            setVideoModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, ...opts, duration: (opts as any).duration ?? m.duration, resolution: (opts as any).resolution ?? m.resolution, frameWidth: opts.frameWidth ?? m.frameWidth, frameHeight: opts.frameHeight ?? m.frameHeight, model: opts.model ?? m.model, frame: opts.frame ?? m.frame, aspectRatio: opts.aspectRatio ?? m.aspectRatio, prompt: opts.prompt ?? m.prompt } : m));
            if (onPersistVideoModalMove) {
              Promise.resolve(onPersistVideoModalMove(modalState.id, opts as any)).catch(console.error);
            }
          }}
          connections={connections}
          imageModalStates={imageModalStates}
          images={images}
          onSelect={() => {
            // Clear all other selections first
            clearAllSelections();
            // Then set this modal as selected
            setSelectedVideoModalId(modalState.id);
            setSelectedVideoModalIds([modalState.id]);
            // Context menu removed - icons are now shown at top-right corner of modal
          }}
          onDelete={() => {
            setVideoModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedVideoModalId(null);
            if (onPersistVideoModalDelete) {
              Promise.resolve(onPersistVideoModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onDownload={async () => {
            // Download the generated video if available
            if (modalState.generatedVideoUrl) {
              try {
                // Fetch the video to handle CORS issues
                const response = await fetch(modalState.generatedVideoUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `generated-video-${modalState.id}-${Date.now()}.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              } catch (error) {
                console.error('Failed to download video:', error);
                // Fallback: try direct download
                const link = document.createElement('a');
                link.href = modalState.generatedVideoUrl!;
                link.download = `generated-video-${modalState.id}-${Date.now()}.mp4`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            }
          }}
          onDuplicate={() => {
            // Create a duplicate of the video modal to the right
            const duplicated = {
              id: `video-modal-${Date.now()}`,
              x: modalState.x + 600 + 50, // 600px width + 50px spacing
              y: modalState.y, // Same Y position
              generatedVideoUrl: modalState.generatedVideoUrl,
            };
            setVideoModalStates(prev => [...prev, duplicated]);
            if (onPersistVideoModalCreate) {
              Promise.resolve(onPersistVideoModalCreate(duplicated)).catch(console.error);
            }
          }}
          isSelected={selectedVideoModalId === modalState.id || selectedVideoModalIds.includes(modalState.id)}
          x={modalState.x}
          y={modalState.y}
          onPositionChange={(newX, newY) => {
            setVideoModalStates(prev => prev.map(m => 
              m.id === modalState.id ? { ...m, x: newX, y: newY } : m
            ));
          }}
          onPositionCommit={(finalX, finalY) => {
            if (onPersistVideoModalMove) {
              Promise.resolve(onPersistVideoModalMove(modalState.id, { x: finalX, y: finalY })).catch(console.error);
            }
          }}
          stageRef={stageRef}
          scale={scale}
          position={position}
        />
      ))}
      {/* Music Upload Modal Overlays */}
      {musicModalStates.map((modalState) => (
        <MusicUploadModal
          key={modalState.id}
          isOpen={true}
          id={modalState.id}
          onClose={() => {
            setMusicModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedMusicModalId(null);
            if (onPersistMusicModalDelete) {
              Promise.resolve(onPersistMusicModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onMusicSelect={onMusicSelect}
          onGenerate={async (prompt, model, frame, aspectRatio) => {
            if (!onMusicGenerate) return null;
            try {
              const url = await onMusicGenerate(prompt, model, frame, aspectRatio);
              if (url) {
                setMusicModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, generatedMusicUrl: url } : m));
                if (onPersistMusicModalMove) {
                  const frameWidth = 600;
                  const frameHeight = 300;
                  Promise.resolve(onPersistMusicModalMove(modalState.id, {
                    generatedMusicUrl: url,
                    model,
                    frame,
                    aspectRatio,
                    frameWidth,
                    frameHeight,
                  })).catch(console.error);
                }
              }
            } catch (err) {
              console.error('[ModalOverlays] music generation failed', err);
            }
            return null;
          }}
          generatedMusicUrl={modalState.generatedMusicUrl}
          onSelect={() => {
            clearAllSelections();
            setSelectedMusicModalId(modalState.id);
            setSelectedMusicModalIds([modalState.id]);
          }}
          onDelete={() => {
            setMusicModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedMusicModalId(null);
            if (onPersistMusicModalDelete) {
              Promise.resolve(onPersistMusicModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onDuplicate={() => {
            const duplicated = {
              id: `music-modal-${Date.now()}`,
              x: modalState.x + 600 + 50,
              y: modalState.y,
              generatedMusicUrl: modalState.generatedMusicUrl,
            };
            setMusicModalStates(prev => [...prev, duplicated]);
            if (onPersistMusicModalCreate) {
              Promise.resolve(onPersistMusicModalCreate(duplicated)).catch(console.error);
            }
          }}
          isSelected={selectedMusicModalId === modalState.id || selectedMusicModalIds.includes(modalState.id)}
          x={modalState.x}
          y={modalState.y}
          onPositionChange={(newX, newY) => {
            setMusicModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, x: newX, y: newY } : m));
          }}
          onPositionCommit={(finalX, finalY) => {
            if (onPersistMusicModalMove) {
              Promise.resolve(onPersistMusicModalMove(modalState.id, { x: finalX, y: finalY })).catch(console.error);
            }
          }}
          stageRef={stageRef}
          scale={scale}
          position={position}
        />
      ))}
    </>
  );
};

