'use client';

import { useEffect, useRef } from 'react';
import { ImageUpload } from '@/types/canvas';

interface UseKeyboardShortcutsProps {
  // Undo/Redo
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  // Space key (panning)
  setIsSpacePressed: (pressed: boolean) => void;
  applyStageCursorWrapper: (cursor: string, force?: boolean) => void;

  // Shift key (crosshair)
  setIsShiftPressed: (pressed: boolean) => void;

  // Pin toggle
  selectedImageIndices: number[];
  selectedImageModalIds: string[];
  selectedVideoModalIds: string[];
  selectedMusicModalIds: string[];
  selectedTextInputIds: string[];
  selectedCanvasTextIds?: string[];

  // Component creation
  lastCreateTimesRef: React.MutableRefObject<{ text?: number; image?: number; video?: number; music?: number; canvasText?: number }>;
  viewportSize: { width: number; height: number };
  position: { x: number; y: number };
  scale: number;
  findAvailablePositionNearWrapper: (x: number, y: number) => { x: number; y: number };
  setTextInputStates: React.Dispatch<React.SetStateAction<any[]>>;
  setImageModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  setVideoModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  setMusicModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  onPersistTextModalCreate?: (modal: any) => void | Promise<void>;
  onPersistImageModalCreate?: (modal: any) => void | Promise<void>;
  onPersistVideoModalCreate?: (modal: any) => void | Promise<void>;
  onPersistMusicModalCreate?: (modal: any) => void | Promise<void>;

  // Delete handlers
  selectionRectCoords: any;
  setSelectionRectCoords: (coords: any) => void;
  selectionBox: any;
  setSelectionBox: (box: any) => void;
  setIsSelecting: (selecting: boolean) => void;
  selectionTightRect: any;
  setSelectionTightRect: (rect: any) => void;
  setIsDragSelection: (drag: boolean) => void;

  // Canvas Text deletion
  selectedCanvasTextId?: string | null;
  effectiveSetCanvasTextStates?: React.Dispatch<React.SetStateAction<any[]>>;
  effectiveSetSelectedCanvasTextId?: (id: string | null) => void;
  setSelectedCanvasTextIds?: (ids: string[]) => void;
  onPersistCanvasTextDelete?: (id: string) => void | Promise<void>;

  // Image deletion
  selectedImageIndex: number | null;
  onImageDelete?: (index: number) => void;
  setSelectedImageIndex: (index: number | null) => void;
  setSelectedImageIndices: (indices: number[]) => void;
  selectedImageModalId: string | null;
  setSelectedImageModalId: (id: string | null) => void;
  setSelectedImageModalIds: (ids: string[]) => void;
  onPersistImageModalDelete?: (id: string) => void | Promise<void>;

  // Video deletion
  selectedVideoModalId: string | null;
  setSelectedVideoModalId: (id: string | null) => void;
  setSelectedVideoModalIds: (ids: string[]) => void;
  onPersistVideoModalDelete?: (id: string) => void | Promise<void>;

  // Video Editor deletion
  selectedVideoEditorModalIds: string[];
  selectedVideoEditorModalId: string | null;
  videoEditorModalStates: any[];
  setVideoEditorModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedVideoEditorModalId: (id: string | null) => void;
  setSelectedVideoEditorModalIds: (ids: string[]) => void;
  onPersistVideoEditorModalDelete?: (id: string) => void | Promise<void>;

  // Music deletion
  selectedMusicModalId: string | null;
  setSelectedMusicModalId: (id: string | null) => void;
  setSelectedMusicModalIds: (ids: string[]) => void;
  onPersistMusicModalDelete?: (id: string) => void | Promise<void>;

  // Text input deletion
  selectedTextInputId: string | null;
  setSelectedTextInputId: (id: string | null) => void;
  setSelectedTextInputIds: (ids: string[]) => void;
  onPersistTextModalDelete?: (id: string) => void | Promise<void>;

  // Other modal deletions
  selectedUpscaleModalIds: string[];
  selectedUpscaleModalId: string | null;
  upscaleModalStates: any[];
  setUpscaleModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedUpscaleModalId: (id: string | null) => void;
  setSelectedUpscaleModalIds: (ids: string[]) => void;
  onPersistUpscaleModalDelete?: (id: string) => void | Promise<void>;

  selectedMultiangleCameraModalIds: string[];
  selectedMultiangleCameraModalId: string | null;
  multiangleCameraModalStates: any[];
  setMultiangleCameraModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedMultiangleCameraModalId: (id: string | null) => void;
  setSelectedMultiangleCameraModalIds: (ids: string[]) => void;
  onPersistMultiangleCameraModalDelete?: (id: string) => void | Promise<void>;

  selectedRemoveBgModalIds: string[];
  selectedRemoveBgModalId: string | null;
  removeBgModalStates: any[];
  setRemoveBgModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedRemoveBgModalId: (id: string | null) => void;
  setSelectedRemoveBgModalIds: (ids: string[]) => void;
  onPersistRemoveBgModalDelete?: (id: string) => void | Promise<void>;

  selectedEraseModalIds: string[];
  selectedEraseModalId: string | null;
  eraseModalStates: any[];
  setEraseModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedEraseModalId: (id: string | null) => void;
  setSelectedEraseModalIds: (ids: string[]) => void;
  onPersistEraseModalDelete?: (id: string) => void | Promise<void>;

  selectedVectorizeModalIds: string[];
  selectedVectorizeModalId: string | null;
  vectorizeModalStates: any[];
  setVectorizeModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedVectorizeModalId: (id: string | null) => void;
  setSelectedVectorizeModalIds: (ids: string[]) => void;
  onPersistVectorizeModalDelete?: (id: string) => void | Promise<void>;

  selectedExpandModalIds: string[];
  selectedExpandModalId: string | null;
  expandModalStates: any[];
  setExpandModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedExpandModalId: (id: string | null) => void;
  setSelectedExpandModalIds: (ids: string[]) => void;
  onPersistExpandModalDelete?: (id: string) => void | Promise<void>;

  selectedStoryboardModalIds: string[];
  selectedStoryboardModalId: string | null;
  storyboardModalStates: any[];
  setStoryboardModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedStoryboardModalId: (id: string | null) => void;
  setSelectedStoryboardModalIds: (ids: string[]) => void;
  onPersistStoryboardModalDelete?: (id: string) => void | Promise<void>;

  selectedScriptFrameModalIds: string[];
  selectedScriptFrameModalId: string | null;
  handleDeleteScriptFrame: (id: string) => void;
  setSelectedScriptFrameModalId: (id: string | null) => void;
  setSelectedScriptFrameModalIds: (ids: string[]) => void;

  selectedSceneFrameModalIds: string[];
  selectedSceneFrameModalId: string | null;
  handleDeleteSceneFrame: (id: string) => void;
  setSelectedSceneFrameModalId: (id: string | null) => void;
  setSelectedSceneFrameModalIds: (ids: string[]) => void;

  selectedCompareModalIds: string[];
  selectedCompareModalId: string | null;
  compareModalStates: any[];
  setCompareModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedCompareModalId: (id: string | null) => void;
  setSelectedCompareModalIds: (ids: string[]) => void;
  onPersistCompareModalDelete?: (id: string) => void | Promise<void>;

  // Select All
  images: ImageUpload[];
  textInputStates: any[];
  imageModalStates: any[];
  videoModalStates: any[];
  musicModalStates: any[];

  // Zoom to selection
  setScale: (scale: number) => void;
  setPosition: (pos: { x: number; y: number }) => void;
  updateViewportCenter: (pos: { x: number; y: number }, scale: number) => void;

  // Key up handler
  isPanning: boolean;
  stageRef: React.RefObject<any>;
  selectedTool: string | undefined;
}

export const useKeyboardShortcuts = (props: UseKeyboardShortcutsProps) => {
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    setIsSpacePressed,
    applyStageCursorWrapper,
    setIsShiftPressed,
    selectedImageIndices,
    selectedImageModalIds,
    selectedVideoModalIds,
    selectedMusicModalIds,
    selectedTextInputIds,
    selectedCanvasTextIds = [],
    lastCreateTimesRef,
    viewportSize,
    position,
    scale,
    findAvailablePositionNearWrapper,
    setTextInputStates,
    setImageModalStates,
    setVideoModalStates,
    setMusicModalStates,
    onPersistTextModalCreate,
    onPersistImageModalCreate,
    onPersistVideoModalCreate,
    onPersistMusicModalCreate,
    selectionRectCoords,
    setSelectionRectCoords,
    selectionBox,
    setSelectionBox,
    setIsSelecting,
    selectionTightRect,
    setSelectionTightRect,
    setIsDragSelection,
    selectedCanvasTextId,
    effectiveSetCanvasTextStates,
    effectiveSetSelectedCanvasTextId,
    setSelectedCanvasTextIds,
    onPersistCanvasTextDelete,
    selectedImageIndex,
    onImageDelete,
    setSelectedImageIndex,
    setSelectedImageIndices,
    selectedImageModalId,
    setSelectedImageModalId,
    setSelectedImageModalIds,
    onPersistImageModalDelete,
    selectedVideoModalId,
    setSelectedVideoModalId,
    setSelectedVideoModalIds,
    onPersistVideoModalDelete,
    selectedVideoEditorModalIds,
    selectedVideoEditorModalId,
    videoEditorModalStates,
    setVideoEditorModalStates,
    setSelectedVideoEditorModalId,
    setSelectedVideoEditorModalIds,
    onPersistVideoEditorModalDelete,
    selectedMusicModalId,
    setSelectedMusicModalId,
    setSelectedMusicModalIds,
    onPersistMusicModalDelete,
    selectedTextInputId,
    setSelectedTextInputId,
    setSelectedTextInputIds,
    onPersistTextModalDelete,
    selectedUpscaleModalIds,
    selectedUpscaleModalId,
    upscaleModalStates,
    setUpscaleModalStates,
    setSelectedUpscaleModalId,
    setSelectedUpscaleModalIds,
    onPersistUpscaleModalDelete,
    selectedRemoveBgModalIds,
    selectedRemoveBgModalId,
    removeBgModalStates,
    setRemoveBgModalStates,
    setSelectedRemoveBgModalId,
    setSelectedRemoveBgModalIds,
    onPersistRemoveBgModalDelete,
    selectedEraseModalIds,
    selectedEraseModalId,
    eraseModalStates,
    setEraseModalStates,
    setSelectedEraseModalId,
    setSelectedEraseModalIds,
    onPersistEraseModalDelete,
    selectedVectorizeModalIds,
    selectedVectorizeModalId,
    vectorizeModalStates,
    setVectorizeModalStates,
    setSelectedVectorizeModalId,
    setSelectedVectorizeModalIds,
    onPersistVectorizeModalDelete,
    selectedExpandModalIds,
    selectedExpandModalId,
    expandModalStates,
    setExpandModalStates,
    setSelectedExpandModalId,
    setSelectedExpandModalIds,
    onPersistExpandModalDelete,
    selectedStoryboardModalIds,
    selectedStoryboardModalId,
    storyboardModalStates,
    setStoryboardModalStates,
    setSelectedStoryboardModalId,
    setSelectedStoryboardModalIds,
    onPersistStoryboardModalDelete,
    selectedScriptFrameModalIds,
    selectedScriptFrameModalId,
    handleDeleteScriptFrame,
    setSelectedScriptFrameModalId,
    setSelectedScriptFrameModalIds,
    selectedSceneFrameModalIds,
    selectedSceneFrameModalId,
    handleDeleteSceneFrame,
    setSelectedSceneFrameModalId,
    setSelectedSceneFrameModalIds,
    selectedCompareModalIds,
    selectedCompareModalId,
    compareModalStates,
    setCompareModalStates,
    setSelectedCompareModalId,
    setSelectedCompareModalIds,
    onPersistCompareModalDelete,
    images,
    textInputStates,
    imageModalStates,
    videoModalStates,
    musicModalStates,
    setScale,
    setPosition,
    updateViewportCenter,
    isPanning,
    stageRef,
    selectedTool,
  } = props;

  const handleKeyDown = (e: KeyboardEvent) => {
    // Undo/Redo
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        if (canRedo) redo();
      } else {
        if (canUndo) undo();
      }
      return;
    }
    // Redo alternative (Ctrl+Y)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      if (canRedo) redo();
      return;
    }

    if (e.code === 'Space' && !e.repeat) {
      setIsSpacePressed(true);
      applyStageCursorWrapper('grab', true);
    }

    if (e.shiftKey) {
      setIsShiftPressed(true);
      // Force crosshair while Shift is pressed
      applyStageCursorWrapper('crosshair', true);
    }

    // Pin/Unpin shortcut: P key
    if (e.key.toLowerCase() === 'p' && !e.repeat) {
      try {
        const target = e.target as Element | null;
        const isInputElement = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
        const isContentEditable = target?.hasAttribute('contenteditable') ||
          (target?.getAttribute('contenteditable') === 'true') ||
          (target?.closest && target.closest('[contenteditable="true"]') !== null);
        const isTyping = isInputElement || isContentEditable;
        
        // Don't trigger if user is typing
        if (isTyping) return;
        
        e.preventDefault();
        
        // Check if there are any selected components
        const hasSelection = selectedImageIndices.length > 0 ||
          selectedImageModalIds.length > 0 ||
          selectedVideoModalIds.length > 0 ||
          selectedMusicModalIds.length > 0 ||
          selectedTextInputIds.length > 0 ||
          (selectedCanvasTextIds && selectedCanvasTextIds.length > 0);
        
        if (hasSelection) {
          // Dispatch custom event to toggle pin for selected components
          // Components will listen to this event and check if they're selected
          window.dispatchEvent(new CustomEvent('canvas-toggle-pin', {
            detail: {
              selectedImageIndices,
              selectedImageModalIds,
              selectedVideoModalIds,
              selectedMusicModalIds,
              selectedTextInputIds,
              selectedCanvasTextIds: selectedCanvasTextIds || [],
            }
          }));
        }
      } catch (err) {
        // ignore errors
      }
      return;
    }

    // Quick-create shortcuts (keyboard): t = text, i = image, v = video, m = music
    // Only trigger when keyboard focus is not inside an input/textarea/select/contentEditable
    try {
      const target = e.target as Element | null;
      const isInputElement = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
      // Check if target is contentEditable or inside a contentEditable element
      const isContentEditable = target?.hasAttribute('contenteditable') ||
        (target?.getAttribute('contenteditable') === 'true') ||
        (target?.closest && target.closest('[contenteditable="true"]') !== null);
      const isTyping = isInputElement || isContentEditable;
      if (!e.repeat && !isTyping) {
        // Text input shortcut
        if (e.key === 't') {
          e.preventDefault();
          const now = Date.now();
          const last = lastCreateTimesRef.current.text || 0;
          if (now - last >= 200) {
            lastCreateTimesRef.current.text = now;
            const canvasX = (viewportSize.width / 2 - position.x) / scale;
            const canvasY = (viewportSize.height / 2 - position.y) / scale;
            const pos = findAvailablePositionNearWrapper(canvasX, canvasY);
            const newId = `text-${Date.now()}-${Math.random()}`;
            const newModal = { id: newId, x: pos.x, y: pos.y, autoFocusInput: true };
            setTextInputStates(prev => [...prev, newModal]);
            if (onPersistTextModalCreate) {
              Promise.resolve(onPersistTextModalCreate(newModal)).catch(console.error);
            }
          }
          return;
        }

        // Image modal shortcut
        if (e.key === 'i') {
          e.preventDefault();
          const now = Date.now();
          const last = lastCreateTimesRef.current.image || 0;
          if (now - last >= 200) {
            lastCreateTimesRef.current.image = now;
            const canvasX = (viewportSize.width / 2 - position.x) / scale;
            const canvasY = (viewportSize.height / 2 - position.y) / scale;
            const pos = findAvailablePositionNearWrapper(canvasX, canvasY);
            const newId = `img-${Date.now()}-${Math.random()}`;
            const newModal = { id: newId, x: pos.x, y: pos.y };
            setImageModalStates(prev => [...prev, newModal]);
            if (onPersistImageModalCreate) {
              Promise.resolve(onPersistImageModalCreate(newModal)).catch(console.error);
            }
          }
          return;
        }

        // Video modal shortcut
        if (e.key === 'v') {
          e.preventDefault();
          const now = Date.now();
          const last = lastCreateTimesRef.current.video || 0;
          if (now - last >= 200) {
            lastCreateTimesRef.current.video = now;
            const canvasX = (viewportSize.width / 2 - position.x) / scale;
            const canvasY = (viewportSize.height / 2 - position.y) / scale;
            const pos = findAvailablePositionNearWrapper(canvasX, canvasY);
            const newId = `video-${Date.now()}-${Math.random()}`;
            const newModal = { id: newId, x: pos.x, y: pos.y };
            setVideoModalStates(prev => [...prev, newModal]);
            if (onPersistVideoModalCreate) {
              Promise.resolve(onPersistVideoModalCreate(newModal)).catch(console.error);
            }
          }
          return;
        }

        // Music modal shortcut
        if (e.key === 'm') {
          e.preventDefault();
          const now = Date.now();
          const last = lastCreateTimesRef.current.music || 0;
          if (now - last >= 200) {
            lastCreateTimesRef.current.music = now;
            const canvasX = (viewportSize.width / 2 - position.x) / scale;
            const canvasY = (viewportSize.height / 2 - position.y) / scale;
            const pos = findAvailablePositionNearWrapper(canvasX, canvasY);
            const newId = `music-${Date.now()}-${Math.random()}`;
            const newModal = { id: newId, x: pos.x, y: pos.y };
            setMusicModalStates(prev => [...prev, newModal]);
            if (onPersistMusicModalCreate) {
              Promise.resolve(onPersistMusicModalCreate(newModal)).catch(console.error);
            }
          }
          return;
        }

        // Delete shortcut
        if (e.key === 'Delete' || e.key === 'Backspace') {
          // Prevent browser back navigation for Backspace
          if (e.key === 'Backspace') {
            // We already checked !isTyping, so it's safe to prevent default here to avoid navigation
            e.preventDefault();
          }

          // Clear the blue selection rectangle if it's visible
          if (selectionRectCoords) {
            setSelectionRectCoords(null);
          }
          // Also clear selection box if it exists
          if (selectionBox) {
            setSelectionBox(null);
            setIsSelecting(false);
          }
          // Clear smart selection (selectionTightRect) if it exists
          if (selectionTightRect) {
            setSelectionTightRect(null);
            setIsDragSelection(false);
          }

          let hasDeletions = false;

          // 1. Canvas Text (Local & Persisted)
          const textIdsToDelete = [...(selectedCanvasTextIds || [])];
          if (selectedCanvasTextId) textIdsToDelete.push(selectedCanvasTextId);

          if (textIdsToDelete.length > 0) {
            hasDeletions = true;
            if (effectiveSetCanvasTextStates) {
              effectiveSetCanvasTextStates(prev => prev.filter(t => !textIdsToDelete.includes(t.id)));
            }
            if (effectiveSetSelectedCanvasTextId) {
              effectiveSetSelectedCanvasTextId(null);
            }
            if (setSelectedCanvasTextIds) {
              setSelectedCanvasTextIds([]);
            }
            textIdsToDelete.forEach(id => {
              if (onPersistCanvasTextDelete) Promise.resolve(onPersistCanvasTextDelete(id)).catch(console.error);
            });
          }

          // 2. Images (Indices & Modals)
          // Images (CanvasImage)
          const imageIndicesToDelete = [...selectedImageIndices];
          if (selectedImageIndex !== null) imageIndicesToDelete.push(selectedImageIndex);

          if (imageIndicesToDelete.length > 0) {
            hasDeletions = true; 
            // Sort descending to delete without shifting indices
            const sortedIndices = [...new Set(imageIndicesToDelete)].sort((a, b) => b - a);
            sortedIndices.forEach(index => {
              if (onImageDelete) onImageDelete(index);
            });
            setSelectedImageIndex(null);
            setSelectedImageIndices([]);
          }

          // Image Modals
          const imageModalIdsToDelete = [...selectedImageModalIds];
          if (selectedImageModalId) imageModalIdsToDelete.push(selectedImageModalId);

          if (imageModalIdsToDelete.length > 0) {
            hasDeletions = true;
            setImageModalStates(prev => prev.filter(m => !imageModalIdsToDelete.includes(m.id)));
            setSelectedImageModalId(null);
            setSelectedImageModalIds([]);
            imageModalIdsToDelete.forEach(id => {
              if (onPersistImageModalDelete) Promise.resolve(onPersistImageModalDelete(id)).catch(console.error);
            });
          }

          // 3. Video Modals
          const videoModalIdsToDelete = [...selectedVideoModalIds];
          if (selectedVideoModalId) videoModalIdsToDelete.push(selectedVideoModalId);

          if (videoModalIdsToDelete.length > 0) {
            hasDeletions = true;
            setVideoModalStates(prev => prev.filter(m => !videoModalIdsToDelete.includes(m.id)));
            setSelectedVideoModalId(null);
            setSelectedVideoModalIds([]);
            videoModalIdsToDelete.forEach(id => {
              if (onPersistVideoModalDelete) Promise.resolve(onPersistVideoModalDelete(id)).catch(console.error);
            });
          }

          // 4. Video Editor Modals
          if (selectedVideoEditorModalIds.length > 0) {
            hasDeletions = true;
            selectedVideoEditorModalIds.forEach(id => {
              if (onPersistVideoEditorModalDelete) {
                Promise.resolve(onPersistVideoEditorModalDelete(id)).catch(console.error);
              }
            });
            setVideoEditorModalStates(prev => prev.filter(m => !selectedVideoEditorModalIds.includes(m.id)));
            setSelectedVideoEditorModalId(null);
            setSelectedVideoEditorModalIds([]);
          }

          // 5. Music Modals
          const musicModalIdsToDelete = [...selectedMusicModalIds];
          if (selectedMusicModalId) musicModalIdsToDelete.push(selectedMusicModalId);

          if (musicModalIdsToDelete.length > 0) {
            hasDeletions = true;
            setMusicModalStates(prev => prev.filter(m => !musicModalIdsToDelete.includes(m.id)));
            setSelectedMusicModalId(null);
            setSelectedMusicModalIds([]);
            musicModalIdsToDelete.forEach(id => {
              if (onPersistMusicModalDelete) Promise.resolve(onPersistMusicModalDelete(id)).catch(console.error);
            });
          }

          // 6. Text Input Modals
          const textInputIdsToDelete = [...selectedTextInputIds];
          if (selectedTextInputId) textInputIdsToDelete.push(selectedTextInputId);

          if (textInputIdsToDelete.length > 0) {
            hasDeletions = true;
            setTextInputStates(prev => prev.filter(t => !textInputIdsToDelete.includes(t.id)));
            setSelectedTextInputId(null);
            setSelectedTextInputIds([]);
            textInputIdsToDelete.forEach(id => {
              if (onPersistTextModalDelete) Promise.resolve(onPersistTextModalDelete(id)).catch(console.error);
            });
          }

          // 7. Other modals (upscale, multiangle camera, removebg, erase, vectorize, expand, storyboard, script frame, scene frame, compare)
          if (selectedUpscaleModalIds.length > 0) {
            hasDeletions = true;
            selectedUpscaleModalIds.forEach(id => onPersistUpscaleModalDelete && Promise.resolve(onPersistUpscaleModalDelete(id)).catch(console.error));
            setUpscaleModalStates(prev => prev.filter(m => !selectedUpscaleModalIds.includes(m.id)));
            setSelectedUpscaleModalId(null);
            setSelectedUpscaleModalIds([]);
          }
          if (selectedMultiangleCameraModalIds.length > 0) {
            hasDeletions = true;
            selectedMultiangleCameraModalIds.forEach(id => onPersistMultiangleCameraModalDelete && Promise.resolve(onPersistMultiangleCameraModalDelete(id)).catch(console.error));
            setMultiangleCameraModalStates(prev => prev.filter(m => !selectedMultiangleCameraModalIds.includes(m.id)));
            setSelectedMultiangleCameraModalId(null);
            setSelectedMultiangleCameraModalIds([]);
          }
          if (selectedRemoveBgModalIds.length > 0) {
            hasDeletions = true;
            selectedRemoveBgModalIds.forEach(id => onPersistRemoveBgModalDelete && Promise.resolve(onPersistRemoveBgModalDelete(id)).catch(console.error));
            setRemoveBgModalStates(prev => prev.filter(m => !selectedRemoveBgModalIds.includes(m.id)));
            setSelectedRemoveBgModalId(null);
            setSelectedRemoveBgModalIds([]);
          }
          if (selectedEraseModalIds.length > 0) {
            hasDeletions = true;
            selectedEraseModalIds.forEach(id => {
              if (onPersistEraseModalDelete) {
                Promise.resolve(onPersistEraseModalDelete(id)).catch(console.error);
              }
            });
            setEraseModalStates(prev => prev.filter(m => !selectedEraseModalIds.includes(m.id)));
            setSelectedEraseModalId(null);
            setSelectedEraseModalIds([]);
          }
          if (selectedVectorizeModalIds.length > 0) {
            hasDeletions = true;
            selectedVectorizeModalIds.forEach(id => onPersistVectorizeModalDelete && Promise.resolve(onPersistVectorizeModalDelete(id)).catch(console.error));
            setVectorizeModalStates(prev => prev.filter(m => !selectedVectorizeModalIds.includes(m.id)));
            setSelectedVectorizeModalId(null);
            setSelectedVectorizeModalIds([]);
          }
          if (selectedExpandModalIds.length > 0) {
            hasDeletions = true;
            selectedExpandModalIds.forEach(id => {
              if (onPersistExpandModalDelete) {
                Promise.resolve(onPersistExpandModalDelete(id)).catch(console.error);
              }
            });
            setExpandModalStates(prev => prev.filter(m => !selectedExpandModalIds.includes(m.id)));
            setSelectedExpandModalId(null);
            setSelectedExpandModalIds([]);
          }
          if (selectedStoryboardModalIds.length > 0) {
            hasDeletions = true;
            selectedStoryboardModalIds.forEach(id => onPersistStoryboardModalDelete && Promise.resolve(onPersistStoryboardModalDelete(id)).catch(console.error));
            setStoryboardModalStates(prev => prev.filter(m => !selectedStoryboardModalIds.includes(m.id)));
            setSelectedStoryboardModalId(null);
            setSelectedStoryboardModalIds([]);
          }
          if (selectedScriptFrameModalIds.length > 0) {
            hasDeletions = true;
            selectedScriptFrameModalIds.forEach(id => handleDeleteScriptFrame(id));
            setSelectedScriptFrameModalId(null);
            setSelectedScriptFrameModalIds([]);
          }
          if (selectedSceneFrameModalIds.length > 0) {
            hasDeletions = true;
            selectedSceneFrameModalIds.forEach(id => handleDeleteSceneFrame(id));
            setSelectedSceneFrameModalId(null);
            setSelectedSceneFrameModalIds([]);
          }
          if (selectedCompareModalIds.length > 0) {
            hasDeletions = true;
            selectedCompareModalIds.forEach(id => onPersistCompareModalDelete && Promise.resolve(onPersistCompareModalDelete(id)).catch(console.error));
            setCompareModalStates(prev => prev.filter(m => !selectedCompareModalIds.includes(m.id)));
            setSelectedCompareModalId(null);
            setSelectedCompareModalIds([]);
          }

          // Clear selection box and tight rect when Delete is pressed
          setSelectionBox(null);
          setSelectionTightRect(null);
          setIsDragSelection(false);
        }
      }

      // Handle Ctrl/Cmd + A = Select All components on canvas
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.repeat) {
        // Avoid when typing in inputs
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();

        // Select all canvas images (exclude 3D models if present)
        const allImageIndices: number[] = [];
        images.forEach((img, idx) => {
          if (!img) return;
          if (img.type === 'model3d') return;
          allImageIndices.push(idx);
        });

        // Select all text ids
        const allTextIds = textInputStates.map(t => t.id);

        // Select all modals
        const allImageModalIds = imageModalStates.map(m => m.id);
        const allVideoModalIds = videoModalStates.map(m => m.id);
        const allMusicModalIds = musicModalStates.map(m => m.id);

        setSelectedImageIndices(allImageIndices);
        setSelectedImageIndex(allImageIndices.length > 0 ? allImageIndices[0] : null);
        setSelectedTextInputIds(allTextIds);
        setSelectedTextInputId(allTextIds.length > 0 ? allTextIds[0] : null);
        setSelectedImageModalIds(allImageModalIds);
        setSelectedImageModalId(allImageModalIds.length > 0 ? allImageModalIds[0] : null);
        setSelectedVideoModalIds(allVideoModalIds);
        setSelectedVideoModalId(allVideoModalIds.length > 0 ? allVideoModalIds[0] : null);
        setSelectedMusicModalIds(allMusicModalIds);
        setSelectedMusicModalId(allMusicModalIds.length > 0 ? allMusicModalIds[0] : null);

        // Compute tight bounding rect around all selected components so selection visuals show
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let any = false;

        allImageIndices.forEach(idx => {
          const img = images[idx];
          if (!img) return;
          const ix = img.x || 0;
          const iy = img.y || 0;
          const iw = img.width || 0;
          const ih = img.height || 0;
          minX = Math.min(minX, ix);
          minY = Math.min(minY, iy);
          maxX = Math.max(maxX, ix + iw);
          maxY = Math.max(maxY, iy + ih);
          any = true;
        });

        allTextIds.forEach(id => {
          const t = textInputStates.find(tt => tt.id === id);
          if (!t) return;
          minX = Math.min(minX, t.x);
          minY = Math.min(minY, t.y);
          maxX = Math.max(maxX, t.x + 300);
          maxY = Math.max(maxY, t.y + 100);
          any = true;
        });

        allImageModalIds.forEach(id => {
          const m = imageModalStates.find(mm => mm.id === id);
          if (!m) return;
          const width = m.frameWidth ?? 600;
          const height = m.frameHeight ?? 400;
          minX = Math.min(minX, m.x);
          minY = Math.min(minY, m.y);
          maxX = Math.max(maxX, m.x + width);
          maxY = Math.max(maxY, m.y + height);
          any = true;
        });

        allVideoModalIds.forEach(id => {
          const m = videoModalStates.find(mm => mm.id === id);
          if (!m) return;
          const width = m.frameWidth ?? 600;
          const height = m.frameHeight ?? 400;
          minX = Math.min(minX, m.x);
          minY = Math.min(minY, m.y);
          maxX = Math.max(maxX, m.x + width);
          maxY = Math.max(maxY, m.y + height);
          any = true;
        });

        allMusicModalIds.forEach(id => {
          const m = musicModalStates.find(mm => mm.id === id);
          if (!m) return;
          const width = m.frameWidth ?? 600;
          const height = m.frameHeight ?? 300;
          minX = Math.min(minX, m.x);
          minY = Math.min(minY, m.y);
          maxX = Math.max(maxX, m.x + width);
          maxY = Math.max(maxY, m.y + height);
          any = true;
        });

        if (any) {
          const width = maxX - minX;
          const height = maxY - minY;
          setSelectionTightRect({
            x: minX,
            y: minY,
            width: Math.max(1, width),
            height: Math.max(1, height)
          });
          setIsDragSelection(true);
        } else {
          setSelectionTightRect(null);
          setIsDragSelection(false);
        }
        return;
      }

      // Handle 'z' to zoom to selection or to all components
      // Do not trigger on Cmd+Z / Ctrl+Z (reserved for undo)
      if (e.key === 'z' && !e.repeat && !e.metaKey && !e.ctrlKey) {
        // Avoid when typing in inputs
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();

        // Helper: compute bounding rect from selection or all components
        const computeSelectionBounds = (): { x: number; y: number; width: number; height: number } | null => {
          // If there's a tight selection rect (computed from marquee), use it
          if (selectionTightRect) return selectionTightRect;

          // If explicit selected ids exist, compute bounds across selected items
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          let found = false;

          // Selected canvas images
          if (selectedImageIndices.length > 0) {
            selectedImageIndices.forEach(idx => {
              const img = images[idx];
              if (!img) return;
              const ix = img.x || 0;
              const iy = img.y || 0;
              const iw = img.width || 0;
              const ih = img.height || 0;
              minX = Math.min(minX, ix);
              minY = Math.min(minY, iy);
              maxX = Math.max(maxX, ix + iw);
              maxY = Math.max(maxY, iy + ih);
              found = true;
            });
          }

          // Selected text inputs
          if (selectedTextInputIds.length > 0) {
            selectedTextInputIds.forEach(id => {
              const t = textInputStates.find(tt => tt.id === id);
              if (!t) return;
              minX = Math.min(minX, t.x);
              minY = Math.min(minY, t.y);
              maxX = Math.max(maxX, t.x + 300);
              maxY = Math.max(maxY, t.y + 100);
              found = true;
            });
          }

          // Selected image modals
          if (selectedImageModalIds.length > 0) {
            selectedImageModalIds.forEach(id => {
              const m = imageModalStates.find(mm => mm.id === id);
              if (!m) return;
              const width = m.frameWidth ?? 600;
              const height = m.frameHeight ?? 400;
              minX = Math.min(minX, m.x);
              minY = Math.min(minY, m.y);
              maxX = Math.max(maxX, m.x + width);
              maxY = Math.max(maxY, m.y + height);
              found = true;
            });
          }

          // Selected video modals
          if (selectedVideoModalIds.length > 0) {
            selectedVideoModalIds.forEach(id => {
              const m = videoModalStates.find(mm => mm.id === id);
              if (!m) return;
              const width = m.frameWidth ?? 600;
              const height = m.frameHeight ?? 400;
              minX = Math.min(minX, m.x);
              minY = Math.min(minY, m.y);
              maxX = Math.max(maxX, m.x + width);
              maxY = Math.max(maxY, m.y + height);
              found = true;
            });
          }

          // Selected music modals
          if (selectedMusicModalIds.length > 0) {
            selectedMusicModalIds.forEach(id => {
              const m = musicModalStates.find(mm => mm.id === id);
              if (!m) return;
              const width = m.frameWidth ?? 600;
              const height = m.frameHeight ?? 300;
              minX = Math.min(minX, m.x);
              minY = Math.min(minY, m.y);
              maxX = Math.max(maxX, m.x + width);
              maxY = Math.max(maxY, m.y + height);
              found = true;
            });
          }

          if (found) {
            const width = maxX - minX;
            const height = maxY - minY;
            return {
              x: minX,
              y: minY,
              width: Math.max(1, width),
              height: Math.max(1, height)
            };
          }

          // Nothing selected
          return null;
        };

        const zoomToRect = (rect: { x: number; y: number; width: number; height: number } | null) => {
          if (!rect) return;
          // Add small padding around rect (in canvas space) so components are not flush to edges
          const padding = Math.max(20, Math.min(rect.width, rect.height) * 0.04);
          const targetWidth = rect.width + padding * 2;
          const targetHeight = rect.height + padding * 2;

          // Compute scale to fit target into viewport
          const scaleX = viewportSize.width / targetWidth;
          const scaleY = viewportSize.height / targetHeight;
          // Use a tiny margin multiplier to ensure fit but keep components large on screen
          const newScale = Math.max(0.1, Math.min(5, Math.min(scaleX, scaleY) * 0.995));

          // Center rect in viewport
          const rectCenterX = rect.x + rect.width / 2;
          const rectCenterY = rect.y + rect.height / 2;
          const newPos = {
            x: viewportSize.width / 2 - rectCenterX * newScale,
            y: viewportSize.height / 2 - rectCenterY * newScale,
          };

          setScale(newScale);
          setPosition(newPos);
          // Update callback after state settles
          setTimeout(() => updateViewportCenter(newPos, newScale), 0);
        };

        // First try selection bounds
        const selBounds = computeSelectionBounds();
        if (selBounds) {
          zoomToRect(selBounds);
          return;
        }

        // No selection: compute bounding box for all components present
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let any = false;

        // Canvas images
        images.forEach(img => {
          if (!img) return;
          const ix = img.x || 0;
          const iy = img.y || 0;
          const iw = img.width || 0;
          const ih = img.height || 0;
          minX = Math.min(minX, ix);
          minY = Math.min(minY, iy);
          maxX = Math.max(maxX, ix + iw);
          maxY = Math.max(maxY, iy + ih);
          any = true;
        });

        // Text inputs
        textInputStates.forEach(t => {
          minX = Math.min(minX, t.x);
          minY = Math.min(minY, t.y);
          maxX = Math.max(maxX, t.x + 300);
          maxY = Math.max(maxY, t.y + 100);
          any = true;
        });

        // Image modals
        imageModalStates.forEach(m => {
          minX = Math.min(minX, m.x);
          minY = Math.min(minY, m.y);
          maxX = Math.max(maxX, m.x + 600);
          maxY = Math.max(maxY, m.y + 400);
          any = true;
        });

        // Video modals
        videoModalStates.forEach(m => {
          minX = Math.min(minX, m.x);
          minY = Math.min(minY, m.y);
          maxX = Math.max(maxX, m.x + 600);
          maxY = Math.max(maxY, m.y + 400);
          any = true;
        });

        // Music modals
        musicModalStates.forEach(m => {
          minX = Math.min(minX, m.x);
          minY = Math.min(minY, m.y);
          maxX = Math.max(maxX, m.x + 600);
          maxY = Math.max(maxY, m.y + 300);
          any = true;
        });

        if (any) {
          const allRect = { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
          zoomToRect(allRect);
        }
      }
    } catch (err) {
      // ignore errors
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    const { selectedTool } = props;
    if (e.code === 'Space') {
      setIsSpacePressed(false);
      const stage = stageRef.current;
      if (stage && !isPanning) {
        if (selectedTool === 'text') {
          applyStageCursorWrapper('text');
        } else if (selectedTool === 'cursor') {
          applyStageCursorWrapper('default');
        } else if (selectedTool === 'move') {
          applyStageCursorWrapper('grab');
        } else {
          // Non-persistent tools should show pointer by default
          applyStageCursorWrapper('pointer');
        }
      }
    }

    if (!e.shiftKey) {
      setIsShiftPressed(false);
      const stage = stageRef.current;
      if (stage && !isPanning) {
        if (selectedTool === 'cursor') {
          applyStageCursorWrapper('default');
        } else if (selectedTool === 'move') {
          applyStageCursorWrapper('grab');
        } else if (selectedTool === 'text') {
          applyStageCursorWrapper('text');
        } else {
          applyStageCursorWrapper('pointer');
        }
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    canUndo,
    canRedo,
    undo,
    redo,
    setIsSpacePressed,
    applyStageCursorWrapper,
    setIsShiftPressed,
    selectedImageIndices,
    selectedImageModalIds,
    selectedVideoModalIds,
    selectedMusicModalIds,
    selectedTextInputIds,
    selectedCanvasTextIds,
    lastCreateTimesRef,
    viewportSize,
    position,
    scale,
    findAvailablePositionNearWrapper,
    setTextInputStates,
    setImageModalStates,
    setVideoModalStates,
    setMusicModalStates,
    onPersistTextModalCreate,
    onPersistImageModalCreate,
    onPersistVideoModalCreate,
    onPersistMusicModalCreate,
    selectionRectCoords,
    setSelectionRectCoords,
    selectionBox,
    setSelectionBox,
    setIsSelecting,
    selectionTightRect,
    setSelectionTightRect,
    setIsDragSelection,
    selectedCanvasTextId,
    effectiveSetCanvasTextStates,
    effectiveSetSelectedCanvasTextId,
    setSelectedCanvasTextIds,
    onPersistCanvasTextDelete,
    selectedImageIndex,
    onImageDelete,
    setSelectedImageIndex,
    setSelectedImageIndices,
    selectedImageModalId,
    setSelectedImageModalId,
    setSelectedImageModalIds,
    onPersistImageModalDelete,
    selectedVideoModalId,
    setSelectedVideoModalId,
    setSelectedVideoModalIds,
    onPersistVideoModalDelete,
    selectedVideoEditorModalIds,
    selectedVideoEditorModalId,
    videoEditorModalStates,
    setVideoEditorModalStates,
    setSelectedVideoEditorModalId,
    setSelectedVideoEditorModalIds,
    onPersistVideoEditorModalDelete,
    selectedMusicModalId,
    setSelectedMusicModalId,
    setSelectedMusicModalIds,
    onPersistMusicModalDelete,
    selectedTextInputId,
    setSelectedTextInputId,
    setSelectedTextInputIds,
    onPersistTextModalDelete,
    selectedUpscaleModalIds,
    selectedUpscaleModalId,
    upscaleModalStates,
    setUpscaleModalStates,
    setSelectedUpscaleModalId,
    setSelectedUpscaleModalIds,
    onPersistUpscaleModalDelete,
    selectedRemoveBgModalIds,
    selectedRemoveBgModalId,
    removeBgModalStates,
    setRemoveBgModalStates,
    setSelectedRemoveBgModalId,
    setSelectedRemoveBgModalIds,
    onPersistRemoveBgModalDelete,
    selectedEraseModalIds,
    selectedEraseModalId,
    eraseModalStates,
    setEraseModalStates,
    setSelectedEraseModalId,
    setSelectedEraseModalIds,
    onPersistEraseModalDelete,
    selectedVectorizeModalIds,
    selectedVectorizeModalId,
    vectorizeModalStates,
    setVectorizeModalStates,
    setSelectedVectorizeModalId,
    setSelectedVectorizeModalIds,
    onPersistVectorizeModalDelete,
    selectedExpandModalIds,
    selectedExpandModalId,
    expandModalStates,
    setExpandModalStates,
    setSelectedExpandModalId,
    setSelectedExpandModalIds,
    onPersistExpandModalDelete,
    selectedStoryboardModalIds,
    selectedStoryboardModalId,
    storyboardModalStates,
    setStoryboardModalStates,
    setSelectedStoryboardModalId,
    setSelectedStoryboardModalIds,
    onPersistStoryboardModalDelete,
    selectedScriptFrameModalIds,
    selectedScriptFrameModalId,
    handleDeleteScriptFrame,
    setSelectedScriptFrameModalId,
    setSelectedScriptFrameModalIds,
    selectedSceneFrameModalIds,
    selectedSceneFrameModalId,
    handleDeleteSceneFrame,
    setSelectedSceneFrameModalId,
    setSelectedSceneFrameModalIds,
    selectedCompareModalIds,
    selectedCompareModalId,
    compareModalStates,
    setCompareModalStates,
    setSelectedCompareModalId,
    setSelectedCompareModalIds,
    onPersistCompareModalDelete,
    images,
    textInputStates,
    imageModalStates,
    videoModalStates,
    musicModalStates,
    setScale,
    setPosition,
    updateViewportCenter,
    isPanning,
    stageRef,
    selectedTool,
  ]);
};
