'use client';

import { useEffect, useRef } from 'react';
import { ImageUpload } from '@/core/types/canvas';

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

  // Multiangle Camera deletion
  selectedMultiangleCameraModalIds: string[];
  selectedMultiangleCameraModalId: string | null;
  multiangleCameraModalStates: any[];
  setMultiangleCameraModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedMultiangleCameraModalId: (id: string | null) => void;
  setSelectedMultiangleCameraModalIds: (ids: string[]) => void;
  onPersistMultiangleCameraModalDelete?: (id: string) => void | Promise<void>;

  // RemoveBG deletion
  selectedRemoveBgModalIds: string[];
  selectedRemoveBgModalId: string | null;
  removeBgModalStates: any[];
  setRemoveBgModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedRemoveBgModalId: (id: string | null) => void;
  setSelectedRemoveBgModalIds: (ids: string[]) => void;
  onPersistRemoveBgModalDelete?: (id: string) => void | Promise<void>;

  // Erase deletion
  selectedEraseModalIds: string[];
  selectedEraseModalId: string | null;
  eraseModalStates: any[];
  setEraseModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedEraseModalId: (id: string | null) => void;
  setSelectedEraseModalIds: (ids: string[]) => void;
  onPersistEraseModalDelete?: (id: string) => void | Promise<void>;

  // Expand deletion
  selectedExpandModalIds: string[];
  selectedExpandModalId: string | null;
  expandModalStates: any[];
  setExpandModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedExpandModalId: (id: string | null) => void;
  setSelectedExpandModalIds: (ids: string[]) => void;
  onPersistExpandModalDelete?: (id: string) => void | Promise<void>;

  // Vectorize deletion
  selectedVectorizeModalIds: string[];
  selectedVectorizeModalId: string | null;
  vectorizeModalStates: any[];
  setVectorizeModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedVectorizeModalId: (id: string | null) => void;
  setSelectedVectorizeModalIds: (ids: string[]) => void;
  onPersistVectorizeModalDelete?: (id: string) => void | Promise<void>;

  // Next Scene deletion
  selectedNextSceneModalIds: string[];
  selectedNextSceneModalId: string | null;
  nextSceneModalStates: any[];
  setNextSceneModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedNextSceneModalId: (id: string | null) => void;
  setSelectedNextSceneModalIds: (ids: string[]) => void;
  onPersistNextSceneModalDelete?: (id: string) => void | Promise<void>;

  // Storyboard deletion
  selectedStoryboardModalIds: string[];
  selectedStoryboardModalId: string | null;
  storyboardModalStates: any[];
  setStoryboardModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedStoryboardModalId: (id: string | null) => void;
  setSelectedStoryboardModalIds: (ids: string[]) => void;
  onPersistStoryboardModalDelete?: (id: string) => void | Promise<void>;

  // Script Frame deletion
  selectedScriptFrameModalIds: string[];
  selectedScriptFrameModalId: string | null;
  scriptFrameModalStates: any[];
  setScriptFrameModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedScriptFrameModalId: (id: string | null) => void;
  setSelectedScriptFrameModalIds: (ids: string[]) => void;
  onPersistScriptFrameModalDelete?: (id: string) => void | Promise<void>;
  handleDeleteScriptFrame?: (id: string) => void;

  // Scene Frame deletion
  selectedSceneFrameModalIds: string[];
  selectedSceneFrameModalId: string | null;
  sceneFrameModalStates: any[];
  setSceneFrameModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedSceneFrameModalId: (id: string | null) => void;
  setSelectedSceneFrameModalIds: (ids: string[]) => void;
  onPersistSceneFrameModalDelete?: (id: string) => void | Promise<void>;
  handleDeleteSceneFrame?: (id: string) => void;

  // Compare deletion
  selectedCompareModalIds: string[];
  selectedCompareModalId: string | null;
  compareModalStates: any[];
  setCompareModalStates: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedCompareModalId: (id: string | null) => void;
  setSelectedCompareModalIds: (ids: string[]) => void;
  onPersistCompareModalDelete?: (id: string) => void | Promise<void>;



  // Group Deletion
  selectedGroupIds?: string[];
  groupContainerStates?: any[];
  setGroupContainerStates?: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedGroupIds?: (ids: string[]) => void;
  onPersistGroupDelete?: (group: any) => void | Promise<void>;

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
  onFitView?: () => void;
  onBulkDelete?: (elementIds: string[]) => void | Promise<void>;
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
    selectedMultiangleCameraModalIds = [],
    selectedMultiangleCameraModalId,
    multiangleCameraModalStates = [],
    setMultiangleCameraModalStates,
    setSelectedMultiangleCameraModalId,
    setSelectedMultiangleCameraModalIds,
    onPersistMultiangleCameraModalDelete,
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
    selectedNextSceneModalIds = [],
    selectedNextSceneModalId,
    nextSceneModalStates = [],
    setNextSceneModalStates,
    setSelectedNextSceneModalId,
    setSelectedNextSceneModalIds,
    onPersistNextSceneModalDelete,
    // Group Deletion
    selectedGroupIds,
    groupContainerStates,
    setGroupContainerStates,
    setSelectedGroupIds,
    onPersistGroupDelete,
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
    onFitView,
    onBulkDelete,
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
          selectedImageModalId !== null ||
          selectedVideoModalIds.length > 0 ||
          selectedVideoModalId !== null ||
          selectedMusicModalIds.length > 0 ||
          selectedMusicModalId !== null ||
          selectedTextInputIds.length > 0 ||
          selectedTextInputId !== null ||
          (selectedCanvasTextIds && selectedCanvasTextIds.length > 0) ||
          selectedCanvasTextId !== null;

        if (hasSelection) {
          // Dispatch custom event to toggle pin for selected components
          // Components will listen to this event and check if they're selected
          window.dispatchEvent(new CustomEvent('canvas-toggle-pin', {
            detail: {
              selectedImageIndices,
              selectedImageModalIds,
              selectedImageModalId,
              selectedVideoModalIds,
              selectedVideoModalId,
              selectedMusicModalIds,
              selectedMusicModalId,
              selectedTextInputIds,
              selectedTextInputId,
              selectedCanvasTextIds: selectedCanvasTextIds || [],
              selectedCanvasTextId,
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
        // Removed 't' keyboard shortcut for TextInput - only using Konva-based CanvasText

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

          // Clear selection visuals
          if (selectionRectCoords) setSelectionRectCoords(null);
          if (selectionBox) {
            setSelectionBox(null);
            setIsSelecting(false);
          }
          if (selectionTightRect) {
            setSelectionTightRect(null);
            setIsDragSelection(false);
          }

          const allIds: string[] = [];

          // 1. Canvas Text
          if (selectedCanvasTextId) allIds.push(selectedCanvasTextId);
          if (selectedCanvasTextIds) allIds.push(...selectedCanvasTextIds);

          // 2. Groups & Children
          if (selectedGroupIds) {
            allIds.push(...selectedGroupIds);
            selectedGroupIds.forEach(groupId => {
              const group = groupContainerStates?.find(g => g.id === groupId);
              if (group && group.children) {
                group.children.forEach((child: any) => {
                  if (child.id) allIds.push(child.id);
                });
              }
            });
          }

          // 3. Images
          const imageIndices = [...selectedImageIndices];
          if (selectedImageIndex !== null) imageIndices.push(selectedImageIndex);
          imageIndices.forEach(idx => {
            const img = images[idx];
            if (img && img.elementId) allIds.push(img.elementId);
          });

          // 4. Modals / Generators
          if (selectedImageModalId) allIds.push(selectedImageModalId);
          if (selectedImageModalIds) allIds.push(...selectedImageModalIds);
          if (selectedVideoModalId) allIds.push(selectedVideoModalId);
          if (selectedVideoModalIds) allIds.push(...selectedVideoModalIds);
          if (selectedVideoEditorModalId) allIds.push(selectedVideoEditorModalId);
          if (selectedVideoEditorModalIds) allIds.push(...selectedVideoEditorModalIds);
          if (selectedMusicModalId) allIds.push(selectedMusicModalId);
          if (selectedMusicModalIds) allIds.push(...selectedMusicModalIds);
          if (selectedTextInputId) allIds.push(selectedTextInputId);
          if (selectedTextInputIds) allIds.push(...selectedTextInputIds);
          if (selectedUpscaleModalId) allIds.push(selectedUpscaleModalId);
          if (selectedUpscaleModalIds) allIds.push(...selectedUpscaleModalIds);
          if (selectedMultiangleCameraModalId) allIds.push(selectedMultiangleCameraModalId);
          if (selectedMultiangleCameraModalIds) allIds.push(...selectedMultiangleCameraModalIds);
          if (selectedRemoveBgModalId) allIds.push(selectedRemoveBgModalId);
          if (selectedRemoveBgModalIds) allIds.push(...selectedRemoveBgModalIds);
          if (selectedEraseModalId) allIds.push(selectedEraseModalId);
          if (selectedEraseModalIds) allIds.push(...selectedEraseModalIds);
          if (selectedVectorizeModalId) allIds.push(selectedVectorizeModalId);
          if (selectedVectorizeModalIds) allIds.push(...selectedVectorizeModalIds);
          if (selectedExpandModalId) allIds.push(selectedExpandModalId);
          if (selectedExpandModalIds) allIds.push(...selectedExpandModalIds);
          if (selectedStoryboardModalId) allIds.push(selectedStoryboardModalId);
          if (selectedStoryboardModalIds) allIds.push(...selectedStoryboardModalIds);
          if (selectedScriptFrameModalId) allIds.push(selectedScriptFrameModalId);
          if (selectedScriptFrameModalIds) allIds.push(...selectedScriptFrameModalIds);
          if (selectedSceneFrameModalId) allIds.push(selectedSceneFrameModalId);
          if (selectedSceneFrameModalIds) allIds.push(...selectedSceneFrameModalIds);
          if (selectedNextSceneModalId) allIds.push(selectedNextSceneModalId);
          if (selectedNextSceneModalIds) allIds.push(...selectedNextSceneModalIds);
          if (selectedCompareModalId) allIds.push(selectedCompareModalId);
          if (selectedCompareModalIds) allIds.push(...selectedCompareModalIds);

          const uniqueIds = Array.from(new Set(allIds)).filter(id => !!id);

          if (uniqueIds.length > 0 && onBulkDelete) {
            console.log('[Keyboard] Triggering Bulk Delete for:', uniqueIds);
            onBulkDelete(uniqueIds);

            // Clear all local selection states
            setSelectedImageIndices([]);
            setSelectedImageIndex(null);
            setSelectedImageModalIds([]);
            setSelectedImageModalId(null);
            setSelectedVideoModalIds([]);
            setSelectedVideoModalId(null);
            setSelectedMusicModalIds([]);
            setSelectedMusicModalId(null);
            setSelectedTextInputIds([]);
            setSelectedTextInputId(null);
            setSelectedUpscaleModalIds([]);
            setSelectedUpscaleModalId(null);
            setSelectedMultiangleCameraModalIds([]);
            setSelectedMultiangleCameraModalId(null);
            setSelectedRemoveBgModalIds([]);
            setSelectedRemoveBgModalId(null);
            setSelectedEraseModalIds([]);
            setSelectedEraseModalId(null);
            setSelectedVectorizeModalIds([]);
            setSelectedVectorizeModalId(null);
            setSelectedExpandModalIds([]);
            setSelectedExpandModalId(null);
            setSelectedStoryboardModalIds([]);
            setSelectedStoryboardModalId(null);
            setSelectedScriptFrameModalIds([]);
            setSelectedScriptFrameModalId(null);
            setSelectedSceneFrameModalIds([]);
            setSelectedSceneFrameModalId(null);
            setSelectedNextSceneModalIds([]);
            setSelectedNextSceneModalId(null);
            setSelectedCompareModalIds([]);
            setSelectedCompareModalId(null);
            setSelectedVideoEditorModalIds([]);
            setSelectedVideoEditorModalId(null);

            if (setSelectedCanvasTextIds) setSelectedCanvasTextIds([]);
            if (effectiveSetSelectedCanvasTextId) effectiveSetSelectedCanvasTextId(null);
            if (setSelectedGroupIds) setSelectedGroupIds([]);
          }
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

        if (onFitView) {
          onFitView();
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
    selectedMultiangleCameraModalIds,
    selectedMultiangleCameraModalId,
    multiangleCameraModalStates,
    setMultiangleCameraModalStates,
    setSelectedMultiangleCameraModalId,
    setSelectedMultiangleCameraModalIds,
    onPersistMultiangleCameraModalDelete,
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
    onBulkDelete,
    selectedGroupIds,
    groupContainerStates,
    onFitView,
  ]);
};
