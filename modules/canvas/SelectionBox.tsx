'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Rect, Group, Transformer } from 'react-konva';
import { Html } from 'react-konva-utils';
import { Group as GroupIcon, LayoutGrid } from 'lucide-react';
import Konva from 'konva';
import { RichTextToolbar } from './RichText/RichTextToolbar';
import { getClientRect, SELECTION_COLOR } from '@/core/canvas/canvasHelpers';
import { ImageUpload } from '@/core/types/canvas';
import { ScriptFrameModalState, SceneFrameModalState } from '@/modules/canvas-overlays/types';
import { getComponentDimensions } from './utils/getComponentDimensions';
import { CanvasItemsData } from './types';

const GRID_GAP = 10; // Minimal gap between components
const GRID_PADDING = 8; // Minimal equal padding on all sides (left, right, top, bottom)
const GRID_ITEM_MIN_SIZE = 80;
const ARRANGE_ANIMATION_DURATION = 420;
const BUTTON_OVERFLOW_PADDING = 72;

interface SelectedComponent {
  type: 'image' | 'text' | 'imageModal' | 'videoModal' | 'videoEditorModal' | 'imageEditorModal' | 'musicModal' | 'upscaleModal' | 'multiangleCameraModal' | 'removeBgModal' | 'eraseModal' | 'expandModal' | 'vectorizeModal' | 'nextSceneModal' | 'compareModal' | 'storyboardModal' | 'scriptFrameModal' | 'sceneFrameModal';
  id: number | string;
  key: string;
  width: number;
  height: number;
  x: number;
  y: number;
}

type ArrangeTarget = SelectedComponent & {
  from: { x: number; y: number };
  to: { x: number; y: number };
};

interface SelectionBoxProps {
  selectionBox: { startX: number; startY: number; currentX: number; currentY: number } | null;
  selectionTightRect: { x: number; y: number; width: number; height: number } | null;
  isSelecting: boolean;
  isDragSelection: boolean;
  selectedImageIndices: number[];
  selectedImageModalIds: string[];
  selectedVideoModalIds: string[];
  selectedVideoEditorModalIds: string[];
  selectedImageEditorModalIds: string[];
  selectedMusicModalIds: string[];
  selectedTextInputIds: string[];
  images: ImageUpload[];
  selectionDragOriginRef: React.MutableRefObject<{ x: number; y: number } | null>;
  setSelectionTightRect: (rect: { x: number; y: number; width: number; height: number } | null) => void;
  setIsDragSelection?: (value: boolean) => void;
  handleImageUpdateWithGroup: (index: number, updates: Partial<ImageUpload>) => void;
  setTextInputStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; autoFocusInput?: boolean }>>>;
  setImageModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number }>>>;
  setVideoModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number }>>>;
  videoEditorModalStates: Array<{ id: string; x: number; y: number }>;
  setVideoEditorModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number }>>>;
  imageEditorModalStates: Array<{ id: string; x: number; y: number }>;
  setImageEditorModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number }>>>;
  setMusicModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number }>>>;
  textInputStates: Array<{ id: string; x: number; y: number; autoFocusInput?: boolean }>;
  imageModalStates: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number }>;
  videoModalStates: Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number }>;
  musicModalStates: Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number }>;
  setSelectedImageIndices: React.Dispatch<React.SetStateAction<number[]>>;
  setSelectedTextInputIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedImageModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedVideoModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedVideoEditorModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedImageEditorModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedMusicModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  onPersistImageModalMove?: (id: string, updates: Partial<{ x: number; y: number; isGenerating?: boolean }>) => void | Promise<void>;
  onPersistVideoModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistVideoEditorModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistImageEditorModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistMusicModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistTextModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onImageUpdate?: (index: number, updates: Partial<ImageUpload>) => void;
  selectedUpscaleModalIds: string[];
  selectedMultiangleCameraModalIds: string[];
  selectedRemoveBgModalIds: string[];
  selectedEraseModalIds: string[];
  selectedExpandModalIds: string[];
  selectedVectorizeModalIds: string[];
  selectedNextSceneModalIds: string[];
  selectedCompareModalIds: string[];
  selectedStoryboardModalIds: string[];
  selectedScriptFrameModalIds: string[];
  selectedSceneFrameModalIds: string[];
  upscaleModalStates: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>;
  multiangleCameraModalStates: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>;
  removeBgModalStates: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>;
  eraseModalStates: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>;
  expandModalStates: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>;
  vectorizeModalStates: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>;
  nextSceneModalStates: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>;
  compareModalStates: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number; width?: number; height?: number; scale?: number; isExpanded?: boolean }>;
  storyboardModalStates: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>;
  scriptFrameModalStates: ScriptFrameModalState[];
  sceneFrameModalStates: SceneFrameModalState[];
  setUpscaleModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>>>;
  setMultiangleCameraModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>>>;
  setRemoveBgModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>>>;
  setEraseModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>>>;
  setExpandModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>>>;
  setVectorizeModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>>>;
  setNextSceneModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>>>;
  setCompareModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number; width?: number; height?: number; scale?: number; isExpanded?: boolean }>>>;
  setStoryboardModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>>>;
  setScriptFrameModalStates: React.Dispatch<React.SetStateAction<ScriptFrameModalState[]>>;
  setSceneFrameModalStates: React.Dispatch<React.SetStateAction<SceneFrameModalState[]>>;
  setSelectedUpscaleModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedMultiangleCameraModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedRemoveBgModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedEraseModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedExpandModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedVectorizeModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedNextSceneModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedCompareModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedStoryboardModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedScriptFrameModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedSceneFrameModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  onPersistUpscaleModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistMultiangleCameraModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistRemoveBgModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistEraseModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistExpandModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistVectorizeModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistNextSceneModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistCompareModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistStoryboardModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistScriptFrameModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistSceneFrameModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onCreateGroup?: () => void;
  isGroupSelected?: boolean;
  onUngroup?: () => void;
  selectedCanvasTextIds?: string[];
  effectiveCanvasTextStates?: any[];
  selectedGroupIds?: string[];
  selectedRichTextIds?: string[];
  setSelectedRichTextIds?: (ids: string[]) => void;
  richTextStates?: any[];
  setRichTextStates?: React.Dispatch<React.SetStateAction<any[]>>;
  onPersistRichTextMove?: (id: string, updates: Partial<{ x: number; y: number; width: number; fontSize: number }>) => void | Promise<void>;
  // Canvas scale for UI scaling
  scale?: number;
  setCanvasTextStates?: React.Dispatch<React.SetStateAction<any[]>>;
  layerRef?: React.RefObject<Konva.Layer>;
  selectionTransformerRect?: { x: number; y: number; width: number; height: number } | null;
  setSelectionTransformerRect?: (rect: { x: number; y: number; width: number; height: number } | null) => void;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({
  selectionBox,
  selectionTightRect,
  isSelecting,
  isDragSelection,
  selectedImageIndices,
  selectedImageModalIds,
  selectedVideoModalIds,
  selectedVideoEditorModalIds,
  selectedImageEditorModalIds,
  selectedMusicModalIds,
  selectedTextInputIds,
  images,
  selectionDragOriginRef,
  setSelectionTightRect,
  setIsDragSelection,
  handleImageUpdateWithGroup,
  setTextInputStates,
  setImageModalStates,
  setVideoModalStates,
  videoEditorModalStates,
  setVideoEditorModalStates,
  imageEditorModalStates,
  setImageEditorModalStates,
  setMusicModalStates,
  textInputStates,
  imageModalStates,
  videoModalStates,
  musicModalStates,
  setSelectedImageIndices,
  setSelectedTextInputIds,
  setSelectedImageModalIds,
  setSelectedVideoModalIds,
  setSelectedVideoEditorModalIds,
  setSelectedImageEditorModalIds,
  setSelectedMusicModalIds,
  onPersistImageModalMove,
  onPersistVideoModalMove,
  onPersistVideoEditorModalMove,
  onPersistImageEditorModalMove,
  onPersistMusicModalMove,
  onPersistTextModalMove,
  onImageUpdate,
  selectedUpscaleModalIds,
  selectedMultiangleCameraModalIds,
  selectedRemoveBgModalIds,
  selectedEraseModalIds,
  selectedExpandModalIds,
  selectedVectorizeModalIds,
  selectedNextSceneModalIds = [],
  selectedCompareModalIds = [],
  selectedStoryboardModalIds,
  selectedScriptFrameModalIds,
  selectedSceneFrameModalIds,
  upscaleModalStates,
  multiangleCameraModalStates,
  removeBgModalStates,
  eraseModalStates,
  expandModalStates,
  vectorizeModalStates,
  nextSceneModalStates = [],
  compareModalStates = [],
  storyboardModalStates,
  scriptFrameModalStates,
  sceneFrameModalStates,
  setUpscaleModalStates,
  setMultiangleCameraModalStates,
  setRemoveBgModalStates,
  setEraseModalStates,
  setExpandModalStates,
  setVectorizeModalStates,
  setNextSceneModalStates,
  setCompareModalStates,
  setStoryboardModalStates,
  setScriptFrameModalStates,
  setSceneFrameModalStates,
  setSelectedUpscaleModalIds,
  setSelectedMultiangleCameraModalIds,
  setSelectedRemoveBgModalIds,
  setSelectedEraseModalIds,
  setSelectedExpandModalIds,
  setSelectedVectorizeModalIds,
  setSelectedNextSceneModalIds,
  setSelectedCompareModalIds,
  setSelectedStoryboardModalIds,
  setSelectedScriptFrameModalIds,
  setSelectedSceneFrameModalIds,
  onPersistUpscaleModalMove,
  onPersistMultiangleCameraModalMove,
  onPersistRemoveBgModalMove,
  onPersistEraseModalMove,
  onPersistExpandModalMove,
  onPersistVectorizeModalMove,
  onPersistNextSceneModalMove,
  onPersistCompareModalMove,
  onPersistStoryboardModalMove,
  onPersistScriptFrameModalMove,
  onPersistSceneFrameModalMove,
  onCreateGroup,
  isGroupSelected,
  onUngroup,
  effectiveCanvasTextStates = [],
  richTextStates = [],
  selectedCanvasTextIds = [],
  selectedGroupIds = [],
  selectedRichTextIds = [],
  setSelectedRichTextIds,
  setRichTextStates,
  onPersistRichTextMove,
  scale = 1,
  setCanvasTextStates,
  layerRef,
  selectionTransformerRect,
  setSelectionTransformerRect,
}) => {
  // Calculate UI scale based on canvas scale (inverse scaling)
  const MAX_UI_SCALE = 1.5; // Reduced from 3 to prevent huge UI elements
  const inverseScale = 1 / Math.max(scale, 0.001);
  const uiScale = Math.min(inverseScale, MAX_UI_SCALE);
  // Remove htmlScale calculation, use uiScale directly for CSS transform to counteract zoom

  // Store original positions of all components when drag starts
  const originalPositionsRef = React.useRef<{
    images: Map<number, { x: number; y: number; width: number; height: number }>;
    textInputs: Map<string, { x: number; y: number; width: number; height: number }>;
    imageModals: Map<string, { x: number; y: number; width: number; height: number }>;
    videoModals: Map<string, { x: number; y: number; width: number; height: number }>;
    videoEditorModals: Map<string, { x: number; y: number; width: number; height: number }>;
    imageEditorModals: Map<string, { x: number; y: number; width: number; height: number }>;
    musicModals: Map<string, { x: number; y: number; width: number; height: number }>;
    upscaleModals: Map<string, { x: number; y: number; width: number; height: number }>;
    multiangleCameraModals: Map<string, { x: number; y: number; width: number; height: number }>;
    removeBgModals: Map<string, { x: number; y: number; width: number; height: number }>;
    eraseModals: Map<string, { x: number; y: number; width: number; height: number }>;
    expandModals: Map<string, { x: number; y: number; width: number; height: number }>;
    vectorizeModals: Map<string, { x: number; y: number; width: number; height: number }>;
    nextSceneModals: Map<string, { x: number; y: number; width: number; height: number }>;
    compareModals: Map<string, { x: number; y: number; width: number; height: number }>;
    storyboardModals: Map<string, { x: number; y: number; width: number; height: number }>;
    scriptFrameModals: Map<string, { x: number; y: number; width: number; height: number }>;
    sceneFrameModals: Map<string, { x: number; y: number; width: number; height: number }>;
    richTexts: Map<string, { x: number; y: number; width: number; height: number; fontSize: number }>;
  } | null>(null);

  // Store original tight rect position
  const originalTightRectRef = React.useRef<{ x: number; y: number } | null>(null);

  // Ref for the selection box group (for Transformer)
  const selectionGroupRef = React.useRef<Konva.Group>(null);
  const smartSelectRectRef = React.useRef<Konva.Rect>(null);

  const arrangeStateRef = useRef<{ selectionKey: string; order: string[]; bounds?: { minX: number; minY: number; maxX: number; maxY: number } } | null>(null);
  const arrangeAnimationFrameRef = useRef<number | null>(null);
  const dragMoveRafRef = useRef<number | null>(null);
  const pendingDragDeltaRef = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    return () => {
      if (arrangeAnimationFrameRef.current) {
        cancelAnimationFrame(arrangeAnimationFrameRef.current);
        arrangeAnimationFrameRef.current = null;
      }
      if (dragMoveRafRef.current) {
        cancelAnimationFrame(dragMoveRafRef.current);
        dragMoveRafRef.current = null;
      }
    };
  }, []);

  // Calculate total number of selected items
  // Note: selectedCanvasTextIds is not passed to this component, so it's not included in the count
  // This is intentional as canvas text uses a different selection system
  const totalSelected = selectedImageIndices.length +
    selectedImageModalIds.length +
    selectedVideoModalIds.length +
    selectedVideoEditorModalIds.length +
    selectedImageEditorModalIds.length +
    selectedMusicModalIds.length +
    selectedTextInputIds.length +
    selectedUpscaleModalIds.length +
    selectedMultiangleCameraModalIds.length +
    selectedRemoveBgModalIds.length +
    selectedEraseModalIds.length +
    selectedExpandModalIds.length +
    selectedVectorizeModalIds.length +
    selectedNextSceneModalIds.length +
    selectedCompareModalIds.length +
    selectedStoryboardModalIds.length +
    selectedScriptFrameModalIds.length +
    selectedSceneFrameModalIds.length +
    selectedCanvasTextIds.length +
    selectedRichTextIds.length +
    selectedGroupIds.length;

  const isOnlyRichText = selectedRichTextIds.length > 0 && selectedRichTextIds.length === totalSelected;
  const hasRichText = selectedRichTextIds.length > 0;
  const hasCanvasText = selectedCanvasTextIds.length > 0;

  const isOnlyText = (hasRichText || hasCanvasText) &&
    (selectedRichTextIds.length + selectedCanvasTextIds.length === totalSelected);

  const handleMultiTextChange = (updates: any) => {
    if (setRichTextStates && selectedRichTextIds.length > 0) {
      setRichTextStates(prev => prev.map(t =>
        selectedRichTextIds.includes(t.id) ? { ...t, ...updates } : t
      ));
    }
    if (setCanvasTextStates && selectedCanvasTextIds.length > 0) {
      setCanvasTextStates(prev => prev.map(t =>
        selectedCanvasTextIds.includes(t.id) ? { ...t, ...updates } : t
      ));
    }
  };

  const transformerRef = React.useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (!transformerRef.current || !layerRef?.current) return;

    // Determine nodes to attach to the collective transformer
    let nodesToTransform: Konva.Node[] = [];

    // 1. Text Items (CanvasText) - EXCLUDE RichText
    if (selectedCanvasTextIds.length > 0) {
      const selectedTextNodes = layerRef.current.find((node: Konva.Node) => {
        return node.getAttr('data-type') === 'text' && selectedCanvasTextIds.includes(String(node.id()));
      });
      nodesToTransform = [...nodesToTransform, ...selectedTextNodes];
    }

    // 2. Groups
    if (selectedGroupIds.length > 0) {
      const selectedGroupNodes = layerRef.current.find((node: Konva.Node) => {
        return node.name().startsWith('group-container-') && selectedGroupIds.includes(node.name().replace('group-container-', ''));
      });
      nodesToTransform = [...nodesToTransform, ...selectedGroupNodes];
    }

    // 3. Collective Selection Logic
    if (totalSelected > 1) {
      if (!hasRichText) {
        // No RichText -> use the selection group for performance/legacy scaling
        if (selectionGroupRef.current) {
          nodesToTransform = [selectionGroupRef.current];
        }
      } else {
        // Mixed or purely RichText -> attach to components INDIVIDUALLY
        // We've already added CanvasText and Groups above.
        // We also need to add Images, Modals, and RichText

        const others = layerRef.current.find((node: Konva.Node) => {
          const id = String(node.id());
          const name = node.name();

          // Exclude background only (RichText is now included)
          if (name === 'background-rect') return false;

          // Rich Text
          if (name === 'rich-text-node' && selectedRichTextIds.includes(id)) return true;

          // Check if it's in our selection IDs
          if (name.startsWith('canvas-image-')) {
            const idx = parseInt(name.replace('canvas-image-', ''));
            return selectedImageIndices.includes(idx);
          }

          // Modals
          if (selectedImageModalIds.includes(id)) return true;
          if (selectedVideoModalIds.includes(id)) return true;

          return false;
        });
        nodesToTransform = [...nodesToTransform, ...others];
      }
    }

    transformerRef.current.nodes(nodesToTransform);
    transformerRef.current.getLayer()?.batchDraw();
  }, [totalSelected, selectionTransformerRect, selectedRichTextIds, selectedCanvasTextIds, isOnlyText, hasRichText, hasCanvasText, selectionGroupRef.current, isOnlyRichText, selectedImageIndices, selectedImageModalIds, selectedVideoModalIds]);

  // Handle Transform End for Normalization (prevent text scaling distortion)
  const handleTransformEnd = () => {
    if (transformerRef.current) {
      const nodes = transformerRef.current.nodes();
      const updatesRichText: any[] = [];
      const updatesCanvasText: any[] = [];

      nodes.forEach(node => {
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // Only normalize if it's a text node (double check safety)
        if (node.getAttr('data-type') === 'text') {
          // Update width/fontSize based on scale
          // User requested: node.width(node.width() * scaleX); node.scaleX(1);

          // We need to sync with state.
          const newWidth = node.width() * scaleX;
          // Actually for Text, usually we scale font size or width.
          // User prompt: "node.width(node.width() * scaleX)"

          node.width(newWidth);
          node.scaleX(1);
          node.scaleY(1);

          // Identify which state to update
          const id = String(node.id());
          if (selectedRichTextIds.includes(id)) {
            // For RichText, we might want to update font size or just width? 
            // RichTextNode transform handler updates width.
            // Let's update width.
            updatesRichText.push({ id, width: newWidth, rotation: node.rotation(), x: node.x(), y: node.y() });
          } else if (selectedCanvasTextIds.includes(id)) {
            // CanvasText
            updatesCanvasText.push({ id, width: newWidth, rotation: node.rotation(), x: node.x(), y: node.y() });
          }
        }
      });

      // Batch update states
      if (updatesRichText.length > 0 && setRichTextStates) {
        setRichTextStates(prev => prev.map(t => {
          const update = updatesRichText.find(u => u.id === t.id);
          return update ? { ...t, ...update } : t;
        }));
      }
      if (updatesCanvasText.length > 0 && setCanvasTextStates) {
        setCanvasTextStates(prev => prev.map(t => {
          const update = updatesCanvasText.find(u => u.id === t.id);
          return update ? { ...t, ...update } : t;
        }));
      }
    }
  };


  // Keyboard handler for "G" key to trigger arrange
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if "G" key is pressed (case-insensitive)
      if (e.key.toLowerCase() !== 'g' || e.repeat) {
        return;
      }

      // Don't trigger if user is typing in an input/textarea/select
      const target = e.target as Element | null;
      const isTyping = target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;
      if (isTyping) {
        return;
      }

      // Only trigger if there's a selection
      if (!selectionTightRect) {
        return;
      }

      // Check if there are at least 2 components selected
      if (totalSelected < 2) {
        return;
      }


      // Prevent default behavior and trigger arrange
      e.preventDefault();
      triggerArrange(selectionTightRect);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectionTightRect, totalSelected, selectedImageIndices, selectedImageModalIds, selectedVideoModalIds, selectedMusicModalIds, selectedTextInputIds]);

  const buildSelectionKey = () => {
    const serializeNumbers = (values: number[]) => values.slice().sort((a, b) => a - b).join(',');
    const serializeStrings = (values: string[]) => values.slice().sort().join(',');
    return [
      `img:${serializeNumbers(selectedImageIndices)}`,
      `text:${serializeStrings(selectedTextInputIds)}`,
      `imgModal:${serializeStrings(selectedImageModalIds)}`,
      `vidModal:${serializeStrings(selectedVideoModalIds)}`,
      `vidEditorModal:${serializeStrings(selectedVideoEditorModalIds)}`,
      `imgEditorModal:${serializeStrings(selectedImageEditorModalIds)}`,
      `musicModal:${serializeStrings(selectedMusicModalIds)}`,
      `upscaleModal:${serializeStrings(selectedUpscaleModalIds)}`,
      `multiangleModal:${serializeStrings(selectedMultiangleCameraModalIds)}`,
      `removeBgModal:${serializeStrings(selectedRemoveBgModalIds)}`,
      `eraseModal:${serializeStrings(selectedEraseModalIds)}`,
      `expandModal:${serializeStrings(selectedExpandModalIds)}`,
      `vectorizeModal:${serializeStrings(selectedVectorizeModalIds)}`,
      `nextSceneModal:${serializeStrings(selectedNextSceneModalIds)}`,
      `compareModal:${serializeStrings(selectedCompareModalIds)}`,
      `storyboardModal:${serializeStrings(selectedStoryboardModalIds)}`,
      `scriptFrameModal:${serializeStrings(selectedScriptFrameModalIds)}`,
      `sceneFrameModal:${serializeStrings(selectedSceneFrameModalIds)}`,
      `canvasText:${serializeStrings(selectedCanvasTextIds)}`,
      `richText:${serializeStrings(selectedRichTextIds)}`,
    ].join('|');
  };

  const collectSelectedComponents = (): SelectedComponent[] => {
    const components: SelectedComponent[] = [];
    const canvasData: CanvasItemsData = {
      images,
      canvasTextStates: effectiveCanvasTextStates,
      textInputStates,
      imageModalStates,
      videoModalStates,
      imageEditorModalStates,
      musicModalStates,
      upscaleModalStates,
      multiangleCameraModalStates,
      removeBgModalStates,
      eraseModalStates,
      expandModalStates,
      vectorizeModalStates,
      nextSceneModalStates,
      compareModalStates,
      storyboardModalStates,
      scriptFrameModalStates,
      sceneFrameModalStates,
      videoEditorModalStates,
    } as any;

    selectedImageIndices.forEach((idx) => {
      const img = images[idx];
      if (!img) return;
      components.push({
        type: 'image',
        id: idx,
        key: `image-${idx}`,
        width: img.width || GRID_ITEM_MIN_SIZE,
        height: img.height || GRID_ITEM_MIN_SIZE,
        x: img.x || 0,
        y: img.y || 0,
      });
    });

    selectedTextInputIds.forEach((id) => {
      const text = textInputStates.find((t) => t.id === id);
      if (!text) return;
      components.push({
        type: 'text',
        id,
        key: `text-${id}`,
        width: 400,
        height: 140,
        x: text.x || 0,
        y: text.y || 0,
      });
    });

    selectedImageModalIds.forEach((id) => {
      const modal = imageModalStates.find((m) => m.id === id);
      if (!modal) return;
      const { width, height } = getComponentDimensions('imageModal', id, canvasData);
      components.push({
        type: 'imageModal',
        id,
        key: `imgModal-${id}`,
        width,
        height,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedVideoModalIds.forEach((id) => {
      const modal = videoModalStates.find((m) => m.id === id);
      if (!modal) return;
      const { width, height } = getComponentDimensions('videoModal', id, canvasData);
      components.push({
        type: 'videoModal',
        id,
        key: `videoModal-${id}`,
        width,
        height,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedVideoEditorModalIds.forEach((id) => {
      const modal = videoEditorModalStates.find((m) => m.id === id);
      if (!modal) return;
      const { width, height } = getComponentDimensions('videoEditorModal', id, canvasData);
      components.push({
        type: 'videoEditorModal',
        id,
        key: `videoEditorModal-${id}`,
        width,
        height,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedImageEditorModalIds.forEach((id) => {
      const modal = imageEditorModalStates.find((m) => m.id === id);
      if (!modal) return;
      const { width, height } = getComponentDimensions('imageEditorModal', id, canvasData);
      components.push({
        type: 'imageEditorModal',
        id,
        key: `imageEditorModal-${id}`,
        width,
        height,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedMusicModalIds.forEach((id) => {
      const modal = musicModalStates.find((m) => m.id === id);
      if (!modal) return;
      const { width, height } = getComponentDimensions('musicModal', id, canvasData);
      components.push({
        type: 'musicModal',
        id,
        key: `musicModal-${id}`,
        width,
        height,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedUpscaleModalIds.forEach((id) => {
      const modal = upscaleModalStates.find((m) => m.id === id);
      if (!modal) return;
      const { width, height } = getComponentDimensions('upscaleModal', id, canvasData);
      components.push({
        type: 'upscaleModal',
        id,
        key: `upscaleModal-${id}`,
        width,
        height,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedMultiangleCameraModalIds.forEach((id) => {
      const modal = multiangleCameraModalStates.find((m) => m.id === id);
      if (!modal) return;
      const { width, height } = getComponentDimensions('multiangleCameraModal', id, canvasData);
      components.push({
        type: 'multiangleCameraModal',
        id,
        key: `multiangleCameraModal-${id}`,
        width,
        height,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedRemoveBgModalIds.forEach((id) => {
      const modal = removeBgModalStates.find((m) => m.id === id);
      if (!modal) return;
      const { width, height } = getComponentDimensions('removeBgModal', id, canvasData);
      components.push({
        type: 'removeBgModal',
        id,
        key: `removeBgModal-${id}`,
        width,
        height,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedEraseModalIds.forEach((id) => {
      const modal = eraseModalStates.find((m) => m.id === id);
      if (!modal) return;
      const { width, height } = getComponentDimensions('eraseModal', id, canvasData);
      components.push({
        type: 'eraseModal',
        id,
        key: `eraseModal-${id}`,
        width,
        height,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedExpandModalIds.forEach((id) => {
      const modal = expandModalStates.find((m) => m.id === id);
      if (!modal) return;
      const { width, height } = getComponentDimensions('expandModal', id, canvasData);
      components.push({
        type: 'expandModal',
        id,
        key: `expandModal-${id}`,
        width,
        height,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedVectorizeModalIds.forEach((id) => {
      const modal = vectorizeModalStates.find((m) => m.id === id);
      if (!modal) return;
      components.push({
        type: 'vectorizeModal',
        id,
        key: `vectorizeModal-${id}`,
        width: modal.frameWidth || 600,
        height: modal.frameHeight || 400,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedNextSceneModalIds.forEach((id) => {
      const modal = nextSceneModalStates.find((m) => m.id === id);
      if (!modal) return;
      components.push({
        type: 'nextSceneModal',
        id,
        key: `nextSceneModal-${id}`,
        width: modal.frameWidth || 600,
        height: modal.frameHeight || 400,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedCompareModalIds.forEach((id) => {
      const modal = compareModalStates.find((m) => m.id === id);
      if (!modal) return;
      // Compare modal can be 100x100 when collapsed or 500x600 when expanded
      const width = modal.isExpanded ? (modal.width || 500) : 100;
      const height = modal.isExpanded ? (modal.height || 600) : 100;
      components.push({
        type: 'compareModal',
        id,
        key: `compareModal-${id}`,
        width,
        height,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedStoryboardModalIds.forEach((id) => {
      const modal = storyboardModalStates.find((m) => m.id === id);
      if (!modal) return;
      components.push({
        type: 'storyboardModal',
        id,
        key: `storyboardModal-${id}`,
        width: modal.frameWidth || 400,
        height: modal.frameHeight || 500,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedScriptFrameModalIds.forEach((id) => {
      const modal = scriptFrameModalStates.find((m) => m.id === id);
      if (!modal) return;
      components.push({
        type: 'scriptFrameModal',
        id,
        key: `scriptFrameModal-${id}`,
        width: modal.frameWidth || 360,
        height: modal.frameHeight || 260,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedSceneFrameModalIds.forEach((id) => {
      const modal = sceneFrameModalStates.find((m) => m.id === id);
      if (!modal) return;
      components.push({
        type: 'sceneFrameModal',
        id,
        key: `sceneFrameModal-${id}`,
        width: modal.frameWidth || 350,
        height: modal.frameHeight || 300,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedCanvasTextIds.forEach((id) => {
      const text = effectiveCanvasTextStates.find((t: any) => t.id === id);
      if (!text) return;
      components.push({
        type: 'text' as any, // Reusing 'text'
        id,
        key: `canvasText-${id}`,
        width: text.width || 200,
        height: text.height || 100,
        x: text.x || 0,
        y: text.y || 0,
      });
    });

    selectedRichTextIds.forEach((id) => {
      const text = richTextStates.find((t: any) => t.id === id);
      if (!text) return;
      components.push({
        type: 'text' as any, // Reusing 'text'
        id,
        key: `richText-${id}`,
        width: text.width || 200,
        height: text.height || 100,
        x: text.x || 0,
        y: text.y || 0,
      });
    });

    return components;
  };

  const computeGridDimensions = (count: number) => {
    if (count <= 0) {
      return { cols: 1, rows: 1 };
    }
    const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
    const rows = Math.max(1, Math.ceil(count / cols));
    return { cols, rows };
  };

  const cancelArrangeAnimation = () => {
    if (arrangeAnimationFrameRef.current) {
      cancelAnimationFrame(arrangeAnimationFrameRef.current);
      arrangeAnimationFrameRef.current = null;
    }
  };

  const applyAnimatedPositions = (targets: ArrangeTarget[], progress: number) => {
    const imageUpdates: Array<{ index: number; x: number; y: number }> = [];
    const textUpdates = new Map<string, { x: number; y: number }>();
    const imageModalUpdates = new Map<string, { x: number; y: number }>();
    const videoModalUpdates = new Map<string, { x: number; y: number }>();
    const musicModalUpdates = new Map<string, { x: number; y: number }>();
    const upscaleModalUpdates = new Map<string, { x: number; y: number }>();
    const removeBgModalUpdates = new Map<string, { x: number; y: number }>();
    const eraseModalUpdates = new Map<string, { x: number; y: number }>();
    const expandModalUpdates = new Map<string, { x: number; y: number }>();
    const vectorizeModalUpdates = new Map<string, { x: number; y: number }>();
    const storyboardModalUpdates = new Map<string, { x: number; y: number }>();
    const scriptFrameModalUpdates = new Map<string, { x: number; y: number }>();
    const sceneFrameModalUpdates = new Map<string, { x: number; y: number }>();

    targets.forEach((target) => {
      const currentX = target.from.x + (target.to.x - target.from.x) * progress;
      const currentY = target.from.y + (target.to.y - target.from.y) * progress;

      switch (target.type) {
        case 'image':
          imageUpdates.push({ index: target.id as number, x: currentX, y: currentY });
          break;
        case 'text':
          textUpdates.set(target.id as string, { x: currentX, y: currentY });
          break;
        case 'imageModal':
          imageModalUpdates.set(target.id as string, { x: currentX, y: currentY });
          break;
        case 'videoModal':
          videoModalUpdates.set(target.id as string, { x: currentX, y: currentY });
          break;
        case 'videoEditorModal':
          // VideoEditor modals are handled in the drag handlers, not in arrange
          break;
        case 'musicModal':
          musicModalUpdates.set(target.id as string, { x: currentX, y: currentY });
          break;
        case 'upscaleModal':
          upscaleModalUpdates.set(target.id as string, { x: currentX, y: currentY });
          break;
        case 'removeBgModal':
          removeBgModalUpdates.set(target.id as string, { x: currentX, y: currentY });
          break;
        case 'eraseModal':
          eraseModalUpdates.set(target.id as string, { x: currentX, y: currentY });
          break;
        case 'expandModal':
          expandModalUpdates.set(target.id as string, { x: currentX, y: currentY });
          break;
        case 'vectorizeModal':
          vectorizeModalUpdates.set(target.id as string, { x: currentX, y: currentY });
          break;
        case 'storyboardModal':
          storyboardModalUpdates.set(target.id as string, { x: currentX, y: currentY });
          break;
        case 'scriptFrameModal':
          scriptFrameModalUpdates.set(target.id as string, { x: currentX, y: currentY });
          break;
        case 'sceneFrameModal':
          sceneFrameModalUpdates.set(target.id as string, { x: currentX, y: currentY });
          break;
      }
    });

    if (imageUpdates.length) {
      imageUpdates.forEach(({ index, x, y }) => {
        handleImageUpdateWithGroup(index, { x, y });
      });
    }

    if (textUpdates.size) {
      setTextInputStates((prev) =>
        prev.map((text) => {
          const update = textUpdates.get(text.id);
          return update ? { ...text, ...update } : text;
        })
      );
    }

    if (imageModalUpdates.size) {
      setImageModalStates((prev) =>
        prev.map((modal) => {
          const update = imageModalUpdates.get(modal.id);
          return update ? { ...modal, ...update } : modal;
        })
      );
    }

    if (videoModalUpdates.size) {
      setVideoModalStates((prev) =>
        prev.map((modal) => {
          const update = videoModalUpdates.get(modal.id);
          return update ? { ...modal, ...update } : modal;
        })
      );
    }

    if (musicModalUpdates.size) {
      setMusicModalStates((prev) =>
        prev.map((modal) => {
          const update = musicModalUpdates.get(modal.id);
          return update ? { ...modal, ...update } : modal;
        })
      );
    }

    if (upscaleModalUpdates.size) {
      setUpscaleModalStates((prev) =>
        prev.map((modal) => {
          const update = upscaleModalUpdates.get(modal.id);
          return update ? { ...modal, ...update } : modal;
        })
      );
    }

    if (removeBgModalUpdates.size) {
      setRemoveBgModalStates((prev) =>
        prev.map((modal) => {
          const update = removeBgModalUpdates.get(modal.id);
          return update ? { ...modal, ...update } : modal;
        })
      );
    }

    if (eraseModalUpdates.size) {
      setEraseModalStates((prev) =>
        prev.map((modal) => {
          const update = eraseModalUpdates.get(modal.id);
          return update ? { ...modal, ...update } : modal;
        })
      );
    }

    if (expandModalUpdates.size) {
      setExpandModalStates((prev) =>
        prev.map((modal) => {
          const update = expandModalUpdates.get(modal.id);
          return update ? { ...modal, ...update } : modal;
        })
      );
    }

    if (vectorizeModalUpdates.size) {
      setVectorizeModalStates((prev) =>
        prev.map((modal) => {
          const update = vectorizeModalUpdates.get(modal.id);
          return update ? { ...modal, ...update } : modal;
        })
      );
    }

    if (storyboardModalUpdates.size) {
      setStoryboardModalStates((prev) =>
        prev.map((modal) => {
          const update = storyboardModalUpdates.get(modal.id);
          return update ? { ...modal, ...update } : modal;
        })
      );
    }

    if (setRichTextStates && richTextStates.length > 0) {
      const richTextUpdates = new Map<string, { x: number; y: number }>();
      targets.forEach((target) => {
        if (target.key.startsWith('richText-')) {
          const currentX = target.from.x + (target.to.x - target.from.x) * progress;
          const currentY = target.from.y + (target.to.y - target.from.y) * progress;
          richTextUpdates.set(target.id as string, { x: currentX, y: currentY });
        }
      });

      if (richTextUpdates.size > 0) {
        setRichTextStates((prev) =>
          prev.map((text) => {
            const update = richTextUpdates.get(text.id);
            return update ? { ...text, ...update } : text;
          })
        );
      }
    }

    if (scriptFrameModalUpdates.size) {
      setScriptFrameModalStates((prev) =>
        prev.map((modal) => {
          const update = scriptFrameModalUpdates.get(modal.id);
          return update ? { ...modal, ...update } : modal;
        })
      );
    }

    if (sceneFrameModalUpdates.size) {
      setSceneFrameModalStates((prev) =>
        prev.map((modal) => {
          const update = sceneFrameModalUpdates.get(modal.id);
          return update ? { ...modal, ...update } : modal;
        })
      );
    }
  };

  const persistFinalPositions = (targets: ArrangeTarget[]) => {
    if (onPersistImageModalMove) {
      targets
        .filter((t) => t.type === 'imageModal')
        .forEach((target) => {
          Promise.resolve(
            onPersistImageModalMove(target.id as string, { x: target.to.x, y: target.to.y })
          ).catch(console.error);
        });
    }
    if (onPersistVideoModalMove) {
      targets
        .filter((t) => t.type === 'videoModal')
        .forEach((target) => {
          Promise.resolve(
            onPersistVideoModalMove(target.id as string, { x: target.to.x, y: target.to.y })
          ).catch(console.error);
        });
    }
    if (onPersistMusicModalMove) {
      targets
        .filter((t) => t.type === 'musicModal')
        .forEach((target) => {
          Promise.resolve(
            onPersistMusicModalMove(target.id as string, { x: target.to.x, y: target.to.y })
          ).catch(console.error);
        });
    }
    if (onPersistUpscaleModalMove) {
      targets
        .filter((t) => t.type === 'upscaleModal')
        .forEach((target) => {
          Promise.resolve(
            onPersistUpscaleModalMove(target.id as string, { x: target.to.x, y: target.to.y })
          ).catch(console.error);
        });
    }
    if (onPersistRemoveBgModalMove) {
      targets
        .filter((t) => t.type === 'removeBgModal')
        .forEach((target) => {
          Promise.resolve(
            onPersistRemoveBgModalMove(target.id as string, { x: target.to.x, y: target.to.y })
          ).catch(console.error);
        });
    }
    if (onPersistEraseModalMove) {
      targets
        .filter((t) => t.type === 'eraseModal')
        .forEach((target) => {
          Promise.resolve(
            onPersistEraseModalMove(target.id as string, { x: target.to.x, y: target.to.y })
          ).catch(console.error);
        });
    }
    if (onPersistExpandModalMove) {
      targets
        .filter((t) => t.type === 'expandModal')
        .forEach((target) => {
          Promise.resolve(
            onPersistExpandModalMove(target.id as string, { x: target.to.x, y: target.to.y })
          ).catch(console.error);
        });
    }
    if (onPersistVectorizeModalMove) {
      targets
        .filter((t) => t.type === 'vectorizeModal')
        .forEach((target) => {
          Promise.resolve(
            onPersistVectorizeModalMove(target.id as string, { x: target.to.x, y: target.to.y })
          ).catch(console.error);
        });
    }
    if (onPersistStoryboardModalMove) {
      targets
        .filter((t) => t.type === 'storyboardModal')
        .forEach((target) => {
          Promise.resolve(
            onPersistStoryboardModalMove(target.id as string, { x: target.to.x, y: target.to.y })
          ).catch(console.error);
        });
    }
    if (onPersistScriptFrameModalMove) {
      targets
        .filter((t) => t.type === 'scriptFrameModal')
        .forEach((target) => {
          Promise.resolve(
            onPersistScriptFrameModalMove(target.id as string, { x: target.to.x, y: target.to.y })
          ).catch(console.error);
        });
    }
    if (onPersistSceneFrameModalMove) {
      targets
        .filter((t) => t.type === 'sceneFrameModal')
        .forEach((target) => {
          Promise.resolve(
            onPersistSceneFrameModalMove(target.id as string, { x: target.to.x, y: target.to.y })
          ).catch(console.error);
        });
    }
    if (onPersistTextModalMove) {
      targets
        .filter((t) => t.type === 'text' && !t.key.startsWith('richText-'))
        .forEach((target) => {
          Promise.resolve(
            onPersistTextModalMove(target.id as string, { x: target.to.x, y: target.to.y })
          ).catch(console.error);
        });
    }

    if (onPersistRichTextMove) {
      targets
        .filter((t: any) => t.key.startsWith('richText-'))
        .forEach((target) => {
          Promise.resolve(
            onPersistRichTextMove(target.id as string, { x: target.to.x, y: target.to.y })
          ).catch(console.error);
        });
    }
  };

  const updateSelectionBoundsFromTargets = (targets: ArrangeTarget[]) => {
    if (!targets.length) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    targets.forEach((target) => {
      const client = getClientRect({ x: target.to.x, y: target.to.y, width: target.width, height: target.height });
      minX = Math.min(minX, client.x);
      minY = Math.min(minY, client.y);
      maxX = Math.max(maxX, client.x + client.width);
      maxY = Math.max(maxY, client.y + client.height);
    });

    if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
      // Add equal padding on all sides, plus extra space on top for buttons
      setSelectionTightRect({
        x: minX - GRID_PADDING,
        y: minY - BUTTON_OVERFLOW_PADDING,
        width: Math.max(1, maxX - minX + GRID_PADDING * 2),
        height: Math.max(1, maxY - minY + BUTTON_OVERFLOW_PADDING + GRID_PADDING),
      });
      if (setIsDragSelection) {
        setIsDragSelection(true);
      }
    }
  };

  const animateArrangeTargets = (targets: ArrangeTarget[]) => {
    cancelArrangeAnimation();
    if (!targets.length) return;

    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / ARRANGE_ANIMATION_DURATION);
      const eased = 1 - Math.pow(1 - progress, 3);
      applyAnimatedPositions(targets, eased);

      if (progress < 1) {
        arrangeAnimationFrameRef.current = requestAnimationFrame(animate);
      } else {
        arrangeAnimationFrameRef.current = null;
        applyAnimatedPositions(targets, 1);
        persistFinalPositions(targets);
      }
    };

    arrangeAnimationFrameRef.current = requestAnimationFrame(animate);
  };

  const triggerArrange = (rect: { x: number; y: number; width: number; height: number }) => {
    const components = collectSelectedComponents();
    if (components.length < 2) {
      return;
    }

    const selectionKey = buildSelectionKey();
    const componentMap = new Map(components.map((comp) => [comp.key, comp]));

    const order = arrangeStateRef.current?.order || Array.from(componentMap.keys());
    const orderedComponents: SelectedComponent[] = order
      .map((key) => componentMap.get(key))
      .filter((comp): comp is SelectedComponent => Boolean(comp));

    // Check if this is a new selection (first time arranging these components)
    const isNewSelection = !arrangeStateRef.current || arrangeStateRef.current.selectionKey !== selectionKey;

    let bounds: { minX: number; minY: number; maxX: number; maxY: number };

    // Calculate grid dimensions
    const { cols, rows } = computeGridDimensions(orderedComponents.length);
    const gap = GRID_GAP;
    const padding = GRID_PADDING;

    if (isNewSelection) {
      // First click: Calculate minimal bounds based on component sizes, not scattered positions
      // Find the center point of all components
      let centerX = 0, centerY = 0;
      orderedComponents.forEach((comp) => {
        centerX += comp.x + comp.width / 2;
        centerY += comp.y + comp.height / 2;
      });
      centerX /= orderedComponents.length;
      centerY /= orderedComponents.length;

      // Calculate the minimal grid size needed based on component dimensions
      let maxComponentWidth = 0, maxComponentHeight = 0;
      orderedComponents.forEach((comp) => {
        maxComponentWidth = Math.max(maxComponentWidth, comp.width);
        maxComponentHeight = Math.max(maxComponentHeight, comp.height);
      });

      // Calculate minimal grid dimensions
      const cellWidth = maxComponentWidth;
      const cellHeight = maxComponentHeight;
      const gridWidth = cellWidth * cols + gap * (cols - 1);
      const gridHeight = cellHeight * rows + gap * (rows - 1);

      // Center the grid at the components' center point
      const gridStartX = centerX - gridWidth / 2;
      const gridStartY = centerY - gridHeight / 2;

      bounds = {
        minX: gridStartX - padding,
        minY: gridStartY - padding,
        maxX: gridStartX + gridWidth + padding,
        maxY: gridStartY + gridHeight + padding,
      };

      // Store the bounds and order for this selection
      arrangeStateRef.current = {
        selectionKey,
        order: Array.from(componentMap.keys()),
        bounds,
      };
    } else {
      // Subsequent clicks: Use stored bounds (don't reduce spacing further)
      // Just shuffle the order
      if (arrangeStateRef.current && arrangeStateRef.current.order.length > 1) {
        const rotated = arrangeStateRef.current.order.shift();
        if (rotated && arrangeStateRef.current) {
          arrangeStateRef.current.order.push(rotated);
        }
      }

      // Use stored bounds from first arrangement
      bounds = (arrangeStateRef.current?.bounds) || { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    // Use stored bounds to create a compact arrangement area
    const tightWidth = bounds.maxX - bounds.minX - padding * 2;
    const tightHeight = bounds.maxY - bounds.minY - padding * 2;

    // Calculate grid dimensions based on tight bounds
    const availableWidth = Math.max(tightWidth - gap * (cols - 1), GRID_ITEM_MIN_SIZE * cols);
    const availableHeight = Math.max(tightHeight - gap * (rows - 1), GRID_ITEM_MIN_SIZE * rows);
    const cellWidth = Math.max(GRID_ITEM_MIN_SIZE, availableWidth / cols);
    const cellHeight = Math.max(GRID_ITEM_MIN_SIZE, availableHeight / rows);

    // Position grid starting from the stored bounds with minimal padding
    const startX = bounds.minX + padding;
    const startY = bounds.minY + padding;

    const targets: ArrangeTarget[] = orderedComponents.map((component, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const toX = startX + col * (cellWidth + gap) + (cellWidth - component.width) / 2;
      const toY = startY + row * (cellHeight + gap); // Align to top of row, no vertical centering
      return {
        ...component,
        from: { x: component.x, y: component.y },
        to: { x: toX, y: toY },
      };
    });

    animateArrangeTargets(targets);
    updateSelectionBoundsFromTargets(targets);
  };


  // Ensure smart select appears on top of all components - update continuously during drag
  useEffect(() => {
    if (!isSelecting || !smartSelectRectRef.current) return;
    
    let rafId: number;
    const updateZIndex = () => {
      if (smartSelectRectRef.current && isSelecting) {
        smartSelectRectRef.current.moveToTop();
        const layer = smartSelectRectRef.current.getLayer();
        if (layer) {
          layer.batchDraw();
        }
      }
      if (isSelecting) {
        rafId = requestAnimationFrame(updateZIndex);
      }
    };
    
    rafId = requestAnimationFrame(updateZIndex);
    
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isSelecting, selectionBox]);

  // Show SelectionBox if:
  // 1. There's a selection rect AND it's a drag selection with 2+ components, OR
  // 2. There's a selection rect AND a group is selected (for group dragging and ungroup button)
  if (selectionTightRect) {
    // After selection completes, show tight rect with toolbar and allow dragging to move all
    return (
      <>
        <Group
          ref={selectionGroupRef}
          x={selectionTightRect.x}
          y={selectionTightRect.y}
          draggable
          onDragStart={(e) => {
            selectionDragOriginRef.current = { x: selectionTightRect.x, y: selectionTightRect.y };
            originalTightRectRef.current = { x: selectionTightRect.x, y: selectionTightRect.y };

            // Store original positions of all components
            const originalPositions = {
              images: new Map<number, { x: number; y: number; width: number; height: number }>(),
              textInputs: new Map<string, { x: number; y: number; width: number; height: number }>(),
              imageModals: new Map<string, { x: number; y: number; width: number; height: number }>(),
              videoModals: new Map<string, { x: number; y: number; width: number; height: number }>(),
              videoEditorModals: new Map<string, { x: number; y: number; width: number; height: number }>(),
              imageEditorModals: new Map<string, { x: number; y: number; width: number; height: number }>(),
              musicModals: new Map<string, { x: number; y: number; width: number; height: number }>(),
              upscaleModals: new Map<string, { x: number; y: number; width: number; height: number }>(),
              multiangleCameraModals: new Map<string, { x: number; y: number; width: number; height: number }>(),
              removeBgModals: new Map<string, { x: number; y: number; width: number; height: number }>(),
              eraseModals: new Map<string, { x: number; y: number; width: number; height: number }>(),
              expandModals: new Map<string, { x: number; y: number; width: number; height: number }>(),
              vectorizeModals: new Map<string, { x: number; y: number; width: number; height: number }>(),
              nextSceneModals: new Map<string, { x: number; y: number; width: number; height: number }>(),
              compareModals: new Map<string, { x: number; y: number; width: number; height: number }>(),
              storyboardModals: new Map<string, { x: number; y: number; width: number; height: number }>(),
              scriptFrameModals: new Map<string, { x: number; y: number; width: number; height: number }>(),
              sceneFrameModals: new Map<string, { x: number; y: number; width: number; height: number }>(),
              richTexts: new Map<string, { x: number; y: number; width: number; height: number; fontSize: number }>(),
            };

            const canvasData: CanvasItemsData = {
              images,
              canvasTextStates: effectiveCanvasTextStates,
              textInputStates,
              richTextStates,
              imageModalStates,
              videoModalStates,
              musicModalStates,
              upscaleModalStates,
              multiangleCameraModalStates,
              removeBgModals: removeBgModalStates,
              eraseModals: eraseModalStates,
              expandModals: expandModalStates,
              vectorizeModals: vectorizeModalStates,
              nextSceneModalStates,
              compareModals: compareModalStates,
              storyboardModalStates,
              scriptFrameModals: scriptFrameModalStates,
              sceneFrameModals: sceneFrameModalStates,
              videoEditorModalStates,
              imageEditorModalStates,
            } as any;

            // Store original image positions
            selectedImageIndices.forEach(idx => {
              const it = images[idx];
              if (it) {
                originalPositions.images.set(idx, {
                  x: it.x || 0,
                  y: it.y || 0,
                  width: it.width || 100,
                  height: it.height || 100
                });
              }
            });

            // Store original text input positions
            selectedTextInputIds.forEach(textId => {
              const textState = textInputStates.find(t => t.id === textId);
              if (textState) {
                originalPositions.textInputs.set(textId, { x: textState.x, y: textState.y, width: 400, height: 140 });
              }
            });

            // Store original rich text positions
            selectedRichTextIds.forEach(textId => {
              const textState = richTextStates.find(t => t.id === textId);
              if (textState) {
                originalPositions.richTexts.set(textId, {
                  x: textState.x,
                  y: textState.y,
                  width: textState.width || 200,
                  height: 100, // height is dynamic but we store a base
                  fontSize: textState.fontSize || 20
                });
              }
            });

            // Store original image modal positions
            selectedImageModalIds.forEach(modalId => {
              const modalState = imageModalStates.find(m => m.id === modalId);
              if (modalState) {
                const { width, height } = getComponentDimensions('imageModal', modalId, canvasData);
                originalPositions.imageModals.set(modalId, { x: modalState.x, y: modalState.y, width, height });
              }
            });

            // Store original video modal positions
            selectedVideoModalIds.forEach(modalId => {
              const modalState = videoModalStates.find(m => m.id === modalId);
              if (modalState) {
                const { width, height } = getComponentDimensions('videoModal', modalId, canvasData);
                originalPositions.videoModals.set(modalId, { x: modalState.x, y: modalState.y, width, height });
              }
            });

            // Store original video editor modal positions
            selectedVideoEditorModalIds.forEach(modalId => {
              const modalState = videoEditorModalStates.find(m => m.id === modalId);
              if (modalState) {
                originalPositions.videoEditorModals.set(modalId, { x: modalState.x, y: modalState.y, width: 100, height: 120 });
              }
            });

            // Store original image editor modal positions
            selectedImageEditorModalIds.forEach(modalId => {
              const modalState = imageEditorModalStates.find(m => m.id === modalId);
              if (modalState) {
                const { width, height } = getComponentDimensions('imageEditorModal', modalId, canvasData);
                originalPositions.imageEditorModals.set(modalId, { x: modalState.x, y: modalState.y, width, height });
              }
            });

            // Store original music modal positions
            selectedMusicModalIds.forEach(modalId => {
              const modalState = musicModalStates.find(m => m.id === modalId);
              if (modalState) {
                const { width, height } = getComponentDimensions('musicModal', modalId, canvasData);
                originalPositions.musicModals.set(modalId, { x: modalState.x, y: modalState.y, width, height });
              }
            });

            // Store original upscale modal positions
            selectedUpscaleModalIds.forEach(modalId => {
              const modalState = upscaleModalStates.find(m => m.id === modalId);
              if (modalState) {
                const { width, height } = getComponentDimensions('upscaleModal', modalId, canvasData);
                originalPositions.upscaleModals.set(modalId, { x: modalState.x, y: modalState.y, width, height });
              }
            });

            // Store original multiangle camera modal positions
            selectedMultiangleCameraModalIds.forEach(modalId => {
              const modalState = multiangleCameraModalStates.find(m => m.id === modalId);
              if (modalState) {
                const { width, height } = getComponentDimensions('multiangleCameraModal', modalId, canvasData);
                originalPositions.multiangleCameraModals.set(modalId, { x: modalState.x, y: modalState.y, width, height });
              }
            });

            // Store original remove bg modal positions
            selectedRemoveBgModalIds.forEach(modalId => {
              const modalState = removeBgModalStates.find(m => m.id === modalId);
              if (modalState) {
                const { width, height } = getComponentDimensions('removeBgModal', modalId, canvasData);
                originalPositions.removeBgModals.set(modalId, { x: modalState.x, y: modalState.y, width, height });
              }
            });

            // Store original erase modal positions
            selectedEraseModalIds.forEach(modalId => {
              const modalState = eraseModalStates.find(m => m.id === modalId);
              if (modalState) {
                const { width, height } = getComponentDimensions('eraseModal', modalId, canvasData);
                originalPositions.eraseModals.set(modalId, { x: modalState.x, y: modalState.y, width, height });
              }
            });

            // Store original expand modal positions
            selectedExpandModalIds.forEach(modalId => {
              const modalState = expandModalStates.find(m => m.id === modalId);
              if (modalState) {
                const { width, height } = getComponentDimensions('expandModal', modalId, canvasData);
                originalPositions.expandModals.set(modalId, { x: modalState.x, y: modalState.y, width, height });
              }
            });

            // Store original vectorize modal positions
            selectedVectorizeModalIds.forEach(modalId => {
              const modalState = vectorizeModalStates.find(m => m.id === modalId);
              if (modalState) {
                const { width, height } = getComponentDimensions('vectorizeModal', modalId, canvasData);
                originalPositions.vectorizeModals.set(modalId, { x: modalState.x, y: modalState.y, width, height });
              }
            });

            // Store original next scene modal positions
            selectedNextSceneModalIds.forEach(modalId => {
              const modalState = nextSceneModalStates.find(m => m.id === modalId);
              if (modalState) {
                const { width, height } = getComponentDimensions('nextSceneModal', modalId, canvasData);
                originalPositions.nextSceneModals.set(modalId, { x: modalState.x, y: modalState.y, width, height });
              }
            });

            // Store original compare modal positions
            selectedCompareModalIds.forEach(modalId => {
              const modalState = compareModalStates.find(m => m.id === modalId);
              if (modalState) {
                originalPositions.compareModals.set(modalId, {
                  x: modalState.x,
                  y: modalState.y,
                  width: modalState.isExpanded ? (modalState.width || 500) : 100,
                  height: modalState.isExpanded ? (modalState.height || 600) : 100
                });
              }
            });

            // Store original storyboard modal positions
            selectedStoryboardModalIds.forEach(modalId => {
              const modalState = storyboardModalStates.find(m => m.id === modalId);
              if (modalState) {
                originalPositions.storyboardModals.set(modalId, {
                  x: modalState.x,
                  y: modalState.y,
                  width: modalState.frameWidth || 400,
                  height: modalState.frameHeight || 500
                });
              }
            });

            // Store original script frame modal positions
            selectedScriptFrameModalIds.forEach(modalId => {
              const modalState = scriptFrameModalStates.find(m => m.id === modalId);
              if (modalState) {
                originalPositions.scriptFrameModals.set(modalId, {
                  x: modalState.x,
                  y: modalState.y,
                  width: modalState.frameWidth || 360,
                  height: modalState.frameHeight || 260
                });
              }
            });

            // Store original scene frame modal positions
            selectedSceneFrameModalIds.forEach(modalId => {
              const modalState = sceneFrameModalStates.find(m => m.id === modalId);
              if (modalState) {
                originalPositions.sceneFrameModals.set(modalId, {
                  x: modalState.x,
                  y: modalState.y,
                  width: modalState.frameWidth || 350,
                  height: modalState.frameHeight || 300
                });
              }
            });

            originalPositionsRef.current = originalPositions;
          }}
          onTransform={(e) => {
            const node = e.target as Konva.Group;
            const originalPositions = originalPositionsRef.current;
            const origin = originalTightRectRef.current;
            if (!originalPositions || !origin) return;

            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            const groupX = node.x();
            const groupY = node.y();

            // Proportional scale factor for font size
            const fontScale = Math.sqrt(scaleX * scaleY);

            // Update Rich Texts
            selectedRichTextIds.forEach(id => {
              const orig = originalPositions.richTexts.get(id);
              if (orig && setRichTextStates) {
                const relX = orig.x - origin.x;
                const relY = orig.y - origin.y;
                setRichTextStates(prev => prev.map(t => t.id === id ? {
                  ...t,
                  x: groupX + relX * scaleX,
                  y: groupY + relY * scaleY,
                  width: orig.width * scaleX,
                  fontSize: Math.round(orig.fontSize * fontScale)
                } : t));
              }
            });

            // Update Images
            selectedImageIndices.forEach(idx => {
              const orig = originalPositions.images.get(idx);
              if (orig) {
                const relX = orig.x - origin.x;
                const relY = orig.y - origin.y;
                handleImageUpdateWithGroup(idx, {
                  x: groupX + relX * scaleX,
                  y: groupY + relY * scaleY,
                  width: orig.width * scaleX,
                  height: orig.height * scaleY
                });
              }
            });

            // For other components, just update position for now
            const updateOtherPositions = (ids: string[], originalMap: Map<string, any>, stateSetter: any) => {
              ids.forEach(id => {
                const orig = originalMap.get(id);
                if (orig) {
                  const relX = orig.x - origin.x;
                  const relY = orig.y - origin.y;
                  stateSetter((prev: any[]) => prev.map(s => s.id === id ? {
                    ...s,
                    x: groupX + relX * scaleX,
                    y: groupY + relY * scaleY
                  } : s));
                }
              });
            };

            updateOtherPositions(selectedTextInputIds, originalPositions.textInputs, setTextInputStates);
            updateOtherPositions(selectedImageModalIds, originalPositions.imageModals, setImageModalStates);
            updateOtherPositions(selectedVideoModalIds, originalPositions.videoModals, setVideoModalStates);
            updateOtherPositions(selectedVideoEditorModalIds, originalPositions.videoEditorModals, setVideoEditorModalStates);
            updateOtherPositions(selectedMusicModalIds, originalPositions.musicModals, setMusicModalStates);

            // Sync Tight Rect
            if (selectionTightRect) {
              setSelectionTightRect({
                ...selectionTightRect,
                x: groupX,
                y: groupY,
                width: selectionTightRect.width * scaleX,
                height: selectionTightRect.height * scaleY
              } as any);
            }
          }}
          onTransformEnd={(e) => {
            const node = e.target as Konva.Group;
            const originalPositions = originalPositionsRef.current;
            const origin = originalTightRectRef.current;
            if (!originalPositions || !origin) return;

            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            const groupX = node.x();
            const groupY = node.y();
            const fontScale = Math.sqrt(scaleX * scaleY);

            // Reset scale for node
            node.scaleX(1);
            node.scaleY(1);

            // Persist final values
            selectedRichTextIds.forEach(id => {
              const orig = originalPositions.richTexts.get(id);
              if (orig && onPersistRichTextMove) {
                const relX = orig.x - origin.x;
                const relY = orig.y - origin.y;
                onPersistRichTextMove(id, {
                  x: groupX + relX * scaleX,
                  y: groupY + relY * scaleY,
                  width: orig.width * scaleX,
                  fontSize: Math.round(orig.fontSize * fontScale)
                } as any);
              }
            });

            selectedImageIndices.forEach(idx => {
              const orig = originalPositions.images.get(idx);
              if (orig && onImageUpdate) {
                const relX = orig.x - origin.x;
                const relY = orig.y - origin.y;
                onImageUpdate(idx, {
                  x: groupX + relX * scaleX,
                  y: groupY + relY * scaleY,
                  width: orig.width * scaleX,
                  height: orig.height * scaleY
                });
              }
            });

            // Final sync after scale reset
            if (selectionTightRect) {
              setSelectionTightRect({
                ...selectionTightRect,
                x: groupX,
                y: groupY,
                width: selectionTightRect.width * scaleX,
                height: selectionTightRect.height * scaleY
              });
            }

            originalPositionsRef.current = null;
          }}
          onDragMove={(e) => {
            const origin = selectionDragOriginRef.current;
            const originalPositions = originalPositionsRef.current;
            const node = e.target as Konva.Group;
            if (!origin || !node || !originalPositions) return;

            const newX = node.x();
            const newY = node.y();
            const deltaX = newX - origin.x;
            const deltaY = newY - origin.y;

            // Throttle drag-move updates to at most once per animation frame.
            // Doing dozens of setState(map()) calls per pointer event makes dragging feel "stuck".
            pendingDragDeltaRef.current = { dx: deltaX, dy: deltaY };
            if (dragMoveRafRef.current) return;

            dragMoveRafRef.current = requestAnimationFrame(() => {
              dragMoveRafRef.current = null;
              const pending = pendingDragDeltaRef.current;
              if (!pending) return;
              pendingDragDeltaRef.current = null;

              const dx = pending.dx;
              const dy = pending.dy;

              // Move all selected images by delta (from original positions)
              selectedImageIndices.forEach(idx => {
                const originalPos = originalPositions.images.get(idx);
                if (originalPos) {
                  handleImageUpdateWithGroup(idx, { x: originalPos.x + dx, y: originalPos.y + dy });
                }
              });

              // Move all selected text inputs by delta (from original positions)
              if (setTextInputStates) {
                const ids = new Set(selectedTextInputIds);
                setTextInputStates((prev) =>
                  prev.map((textState) => {
                    if (!ids.has(textState.id)) return textState;
                    const originalPos = originalPositions.textInputs.get(textState.id);
                    if (!originalPos) return textState;
                    return { ...textState, x: originalPos.x + dx, y: originalPos.y + dy };
                  })
                );
              }

              // Move all selected rich text nodes by delta
              if (setRichTextStates) {
                const ids = new Set(selectedRichTextIds);
                setRichTextStates((prev) =>
                  prev.map((textState) => {
                    if (!ids.has(textState.id)) return textState;
                    const originalPos = originalPositions.richTexts.get(textState.id);
                    if (!originalPos) return textState;
                    return { ...textState, x: originalPos.x + dx, y: originalPos.y + dy };
                  })
                );
              }

              // Move selected image modals by delta
              if (setImageModalStates) {
                const ids = new Set(selectedImageModalIds);
                setImageModalStates((prev) =>
                  prev.map((modalState) => {
                    if (!ids.has(modalState.id)) return modalState;
                    const originalPos = originalPositions.imageModals.get(modalState.id);
                    if (!originalPos) return modalState;
                    return { ...modalState, x: originalPos.x + dx, y: originalPos.y + dy };
                  })
                );
              }

              // Move selected video modals by delta
              if (setVideoModalStates) {
                const ids = new Set(selectedVideoModalIds);
                setVideoModalStates((prev) =>
                  prev.map((modalState) => {
                    if (!ids.has(modalState.id)) return modalState;
                    const originalPos = originalPositions.videoModals.get(modalState.id);
                    if (!originalPos) return modalState;
                    return { ...modalState, x: originalPos.x + dx, y: originalPos.y + dy };
                  })
                );
              }
            });

            // Move all selected video editor modals by delta in real-time (from original positions)
            selectedVideoEditorModalIds.forEach(modalId => {
              const originalPos = originalPositions.videoEditorModals.get(modalId);
              if (originalPos) {
                setVideoEditorModalStates((prev) =>
                  prev.map((modalState) =>
                    modalState.id === modalId
                      ? { ...modalState, x: originalPos.x + deltaX, y: originalPos.y + deltaY }
                      : modalState
                  )
                );
              }
            });

            // Move all selected image editor modals by delta in real-time (from original positions)
            selectedImageEditorModalIds.forEach(modalId => {
              const originalPos = originalPositions.imageEditorModals.get(modalId);
              if (originalPos) {
                setImageEditorModalStates((prev) =>
                  prev.map((modalState) =>
                    modalState.id === modalId
                      ? { ...modalState, x: originalPos.x + deltaX, y: originalPos.y + deltaY }
                      : modalState
                  )
                );
              }
            });

            // Move all selected music modals by delta in real-time (from original positions)
            selectedMusicModalIds.forEach(modalId => {
              const originalPos = originalPositions.musicModals.get(modalId);
              if (originalPos) {
                setMusicModalStates((prev) =>
                  prev.map((modalState) =>
                    modalState.id === modalId
                      ? { ...modalState, x: originalPos.x + deltaX, y: originalPos.y + deltaY }
                      : modalState
                  )
                );
              }
            });

            // Move all selected upscale modals by delta in real-time
            selectedUpscaleModalIds.forEach(modalId => {
              const originalPos = originalPositions.upscaleModals.get(modalId);
              if (originalPos) {
                setUpscaleModalStates((prev) =>
                  prev.map((modalState) =>
                    modalState.id === modalId
                      ? { ...modalState, x: originalPos.x + deltaX, y: originalPos.y + deltaY }
                      : modalState
                  )
                );
              }
            });

            // Move all selected multiangle camera modals by delta in real-time
            selectedMultiangleCameraModalIds.forEach(modalId => {
              const originalPos = originalPositions.multiangleCameraModals.get(modalId);
              if (originalPos) {
                setMultiangleCameraModalStates((prev) =>
                  prev.map((modalState) =>
                    modalState.id === modalId
                      ? { ...modalState, x: originalPos.x + deltaX, y: originalPos.y + deltaY }
                      : modalState
                  )
                );
              }
            });

            // Move all selected remove bg modals by delta in real-time
            selectedRemoveBgModalIds.forEach(modalId => {
              const originalPos = originalPositions.removeBgModals.get(modalId);
              if (originalPos) {
                setRemoveBgModalStates((prev) =>
                  prev.map((modalState) =>
                    modalState.id === modalId
                      ? { ...modalState, x: originalPos.x + deltaX, y: originalPos.y + deltaY }
                      : modalState
                  )
                );
              }
            });

            // Move all selected erase modals by delta in real-time
            selectedEraseModalIds.forEach(modalId => {
              const originalPos = originalPositions.eraseModals.get(modalId);
              if (originalPos) {
                setEraseModalStates((prev) =>
                  prev.map((modalState) =>
                    modalState.id === modalId
                      ? { ...modalState, x: originalPos.x + deltaX, y: originalPos.y + deltaY }
                      : modalState
                  )
                );
              }
            });

            // Move all selected expand modals by delta in real-time
            selectedExpandModalIds.forEach(modalId => {
              const originalPos = originalPositions.expandModals.get(modalId);
              if (originalPos) {
                setExpandModalStates((prev) =>
                  prev.map((modalState) =>
                    modalState.id === modalId
                      ? { ...modalState, x: originalPos.x + deltaX, y: originalPos.y + deltaY }
                      : modalState
                  )
                );
              }
            });

            // Move all selected vectorize modals by delta in real-time
            selectedVectorizeModalIds.forEach(modalId => {
              const originalPos = originalPositions.vectorizeModals.get(modalId);
              if (originalPos) {
                setVectorizeModalStates((prev) =>
                  prev.map((modalState) =>
                    modalState.id === modalId
                      ? { ...modalState, x: originalPos.x + deltaX, y: originalPos.y + deltaY }
                      : modalState
                  )
                );
              }
            });

            // Move all selected next scene modals by delta in real-time (from original positions)
            selectedNextSceneModalIds.forEach(modalId => {
              const originalPos = originalPositions.nextSceneModals.get(modalId);
              if (originalPos) {
                const newX = originalPos.x + deltaX;
                const newY = originalPos.y + deltaY;
                setNextSceneModalStates((prev) =>
                  prev.map((modalState) =>
                    modalState.id === modalId
                      ? { ...modalState, x: newX, y: newY }
                      : modalState
                  )
                );
              }
            });

            // Move all selected compare modals by delta in real-time (from original positions)
            selectedCompareModalIds.forEach(modalId => {
              const originalPos = originalPositions.compareModals.get(modalId);
              if (originalPos) {
                const newX = originalPos.x + deltaX;
                const newY = originalPos.y + deltaY;
                setCompareModalStates((prev) =>
                  prev.map((modalState) =>
                    modalState.id === modalId
                      ? { ...modalState, x: newX, y: newY }
                      : modalState
                  )
                );
              }
            });

            // Move all selected storyboard modals by delta in real-time
            selectedStoryboardModalIds.forEach(modalId => {
              const originalPos = originalPositions.storyboardModals.get(modalId);
              if (originalPos) {
                setStoryboardModalStates((prev) =>
                  prev.map((modalState) =>
                    modalState.id === modalId
                      ? { ...modalState, x: originalPos.x + deltaX, y: originalPos.y + deltaY }
                      : modalState
                  )
                );
              }
            });

            // Move all selected script frame modals by delta in real-time
            selectedScriptFrameModalIds.forEach(modalId => {
              const originalPos = originalPositions.scriptFrameModals.get(modalId);
              if (originalPos) {
                setScriptFrameModalStates((prev) =>
                  prev.map((modalState) =>
                    modalState.id === modalId
                      ? { ...modalState, x: originalPos.x + deltaX, y: originalPos.y + deltaY }
                      : modalState
                  )
                );
              }
            });

            // Move all selected scene frame modals by delta in real-time
            selectedSceneFrameModalIds.forEach(modalId => {
              const originalPos = originalPositions.sceneFrameModals.get(modalId);
              if (originalPos) {
                setSceneFrameModalStates((prev) =>
                  prev.map((modalState) =>
                    modalState.id === modalId
                      ? { ...modalState, x: originalPos.x + deltaX, y: originalPos.y + deltaY }
                      : modalState
                  )
                );
              }
            });

            // Update tight rect position during drag so selection box moves with components
            // Calculate from original tight rect position to avoid accumulation errors
            const originalTightRect = originalTightRectRef.current;
            if (selectionTightRect && originalTightRect) {
              const newRectX = originalTightRect.x + deltaX;
              const newRectY = originalTightRect.y + deltaY;
              setSelectionTightRect({ ...selectionTightRect, x: newRectX, y: newRectY });
              // Don't update origin - keep it at the original position for consistent delta calculation
            }
          }}
          onDragEnd={(e) => {
            const origin = selectionDragOriginRef.current;
            const originalPositions = originalPositionsRef.current;
            const originalTightRect = originalTightRectRef.current;
            const node = e.target as Konva.Group;
            if (!origin || !node || !originalPositions || !originalTightRect) return;

            const newX = node.x();
            const newY = node.y();
            const deltaX = newX - origin.x;
            const deltaY = newY - origin.y;

            // Components have already been moved during drag, so we just need to ensure final positions are correct
            // and sync the tight rect with the node position
            if (selectionTightRect) {
              // The tight rect should already be at the correct position from onDragMove
              // Just ensure the node position matches the tight rect
              node.position({ x: selectionTightRect.x, y: selectionTightRect.y });
              selectionDragOriginRef.current = { x: selectionTightRect.x, y: selectionTightRect.y };
            }

            // Persist final positions using ORIGINAL POSITIONS + DELTA to ensure accuracy
            // Do not rely on React state which might be stale or not yet updated
            // Persist final positions for image generator modals
            if (onPersistImageModalMove) {
              selectedImageModalIds.forEach((modalId) => {
                const originalPos = originalPositions.imageModals.get(modalId);
                if (originalPos) {
                  Promise.resolve(onPersistImageModalMove(modalId, { x: originalPos.x + deltaX, y: originalPos.y + deltaY })).catch(console.error);
                }
              });
            }

            // Persist final positions for video generator modals
            if (onPersistVideoModalMove) {
              selectedVideoModalIds.forEach((modalId) => {
                const originalPos = originalPositions.videoModals.get(modalId);
                if (originalPos) {
                  Promise.resolve(onPersistVideoModalMove(modalId, { x: originalPos.x + deltaX, y: originalPos.y + deltaY })).catch(console.error);
                }
              });
            }

            // Persist final positions for video editor modals
            if (onPersistVideoEditorModalMove) {
              selectedVideoEditorModalIds.forEach((modalId) => {
                const originalPos = originalPositions.videoEditorModals.get(modalId);
                if (originalPos) {
                  Promise.resolve(onPersistVideoEditorModalMove(modalId, { x: originalPos.x + deltaX, y: originalPos.y + deltaY })).catch(console.error);
                }
              });
            }

            // Persist final positions for image editor modals
            if (onPersistImageEditorModalMove) {
              selectedImageEditorModalIds.forEach((modalId) => {
                const originalPos = originalPositions.imageEditorModals.get(modalId);
                if (originalPos) {
                  Promise.resolve(onPersistImageEditorModalMove(modalId, { x: originalPos.x + deltaX, y: originalPos.y + deltaY })).catch(console.error);
                }
              });
            }

            // Persist final positions for music generator modals
            if (onPersistMusicModalMove) {
              selectedMusicModalIds.forEach((modalId) => {
                const originalPos = originalPositions.musicModals.get(modalId);
                if (originalPos) {
                  Promise.resolve(onPersistMusicModalMove(modalId, { x: originalPos.x + deltaX, y: originalPos.y + deltaY })).catch(console.error);
                }
              });
            }
            // Persist final positions for upscale modals
            if (onPersistUpscaleModalMove) {
              selectedUpscaleModalIds.forEach((modalId) => {
                const originalPos = originalPositions.upscaleModals.get(modalId);
                if (originalPos) {
                  Promise.resolve(onPersistUpscaleModalMove(modalId, { x: originalPos.x + deltaX, y: originalPos.y + deltaY })).catch(console.error);
                }
              });
            }
            // Persist final positions for multiangle camera modals
            if (onPersistMultiangleCameraModalMove) {
              selectedMultiangleCameraModalIds.forEach((modalId) => {
                const originalPos = originalPositions.multiangleCameraModals.get(modalId);
                if (originalPos) {
                  Promise.resolve(onPersistMultiangleCameraModalMove(modalId, { x: originalPos.x + deltaX, y: originalPos.y + deltaY })).catch(console.error);
                }
              });
            }
            // Persist final positions for remove bg modals
            if (onPersistRemoveBgModalMove) {
              selectedRemoveBgModalIds.forEach((modalId) => {
                const originalPos = originalPositions.removeBgModals.get(modalId);
                if (originalPos) {
                  Promise.resolve(onPersistRemoveBgModalMove(modalId, { x: originalPos.x + deltaX, y: originalPos.y + deltaY })).catch(console.error);
                }
              });
            }
            // Persist final positions for erase modals
            if (onPersistEraseModalMove) {
              selectedEraseModalIds.forEach((modalId) => {
                const originalPos = originalPositions.eraseModals.get(modalId);
                if (originalPos) {
                  Promise.resolve(onPersistEraseModalMove(modalId, { x: originalPos.x + deltaX, y: originalPos.y + deltaY })).catch(console.error);
                }
              });
            }
            // Persist final positions for expand modals
            if (onPersistExpandModalMove) {
              selectedExpandModalIds.forEach((modalId) => {
                const originalPos = originalPositions.expandModals.get(modalId);
                if (originalPos) {
                  Promise.resolve(onPersistExpandModalMove(modalId, { x: originalPos.x + deltaX, y: originalPos.y + deltaY })).catch(console.error);
                }
              });
            }
            // Persist final positions for vectorize modals
            if (onPersistVectorizeModalMove) {
              selectedVectorizeModalIds.forEach((modalId) => {
                const originalPos = originalPositions.vectorizeModals.get(modalId);
                if (originalPos) {
                  Promise.resolve(onPersistVectorizeModalMove(modalId, { x: originalPos.x + deltaX, y: originalPos.y + deltaY })).catch(console.error);
                }
              });
            }
            // Persist final positions for next scene modals
            if (onPersistNextSceneModalMove) {
              selectedNextSceneModalIds.forEach((modalId) => {
                const originalPos = originalPositions.nextSceneModals.get(modalId);
                if (originalPos) {
                  Promise.resolve(onPersistNextSceneModalMove(modalId, { x: originalPos.x + deltaX, y: originalPos.y + deltaY })).catch(console.error);
                }
              });
            }
            // Persist final positions for compare modals
            if (onPersistCompareModalMove) {
              selectedCompareModalIds.forEach((modalId) => {
                const originalPos = originalPositions.compareModals.get(modalId);
                if (originalPos) {
                  Promise.resolve(onPersistCompareModalMove(modalId, { x: originalPos.x + deltaX, y: originalPos.y + deltaY })).catch(console.error);
                }
              });
            }
            // Persist final positions for storyboard modals
            if (onPersistStoryboardModalMove) {
              selectedStoryboardModalIds.forEach((modalId) => {
                const originalPos = originalPositions.storyboardModals.get(modalId);
                if (originalPos) {
                  Promise.resolve(onPersistStoryboardModalMove(modalId, { x: originalPos.x + deltaX, y: originalPos.y + deltaY })).catch(console.error);
                }
              });
            }
            // Persist final positions for script frame modals
            if (onPersistScriptFrameModalMove) {
              selectedScriptFrameModalIds.forEach((modalId) => {
                const originalPos = originalPositions.scriptFrameModals.get(modalId);
                if (originalPos) {
                  Promise.resolve(onPersistScriptFrameModalMove(modalId, { x: originalPos.x + deltaX, y: originalPos.y + deltaY })).catch(console.error);
                }
              });
            }
            // Persist final positions for scene frame modals
            if (onPersistSceneFrameModalMove) {
              selectedSceneFrameModalIds.forEach((modalId) => {
                const originalPos = originalPositions.sceneFrameModals.get(modalId);
                if (originalPos) {
                  Promise.resolve(onPersistSceneFrameModalMove(modalId, { x: originalPos.x + deltaX, y: originalPos.y + deltaY })).catch(console.error);
                }
              });
            }

            // Persist final positions for rich text nodes
            if (onPersistRichTextMove) {
              selectedRichTextIds.forEach((textId) => {
                const originalPos = originalPositions.richTexts.get(textId);
                if (originalPos) {
                  Promise.resolve(onPersistRichTextMove(textId, { x: originalPos.x + deltaX, y: originalPos.y + deltaY })).catch(console.error);
                }
              });
            }

            // Persist final positions for text inputs
            if (onPersistTextModalMove) {
              selectedTextInputIds.forEach((textId) => {
                const originalPos = originalPositions.textInputs.get(textId);
                if (originalPos) {
                  Promise.resolve(onPersistTextModalMove(textId, { x: originalPos.x + deltaX, y: originalPos.y + deltaY })).catch(console.error);
                }
              });
            }

            // Persist final positions for images
            if (onImageUpdate) {
              selectedImageIndices.forEach((idx) => {
                const originalPos = originalPositions.images.get(idx);
                if (originalPos) {
                  onImageUpdate(idx, { x: originalPos.x + deltaX, y: originalPos.y + deltaY });
                }
              });
            }

            // Clear original positions
            originalPositionsRef.current = null;
            originalTightRectRef.current = null;
          }}
        >
          {/* Transparent hit area to allow dragging from anywhere in the selection */}
          <Rect
            name="selection-box-bg"
            x={0}
            y={0}
            width={selectionTightRect.width}
            height={selectionTightRect.height}
            fill="transparent"
            stroke="transparent"
            onClick={(e) => {
              e.cancelBubble = true;
            }}
            onTap={(e) => {
              e.cancelBubble = true;
            }}
          />

          {/* Smart selection rectangle is now rendered in Canvas.tsx as background layer */}
          {/* Floating Toolbar for Selection Actions using Html overlay */}
          {(totalSelected >= 2 || !isGroupSelected) && !isOnlyText && (
            <Html
              divProps={{
                style: {
                  pointerEvents: 'none',
                }
              }}
            >
              <div style={{ pointerEvents: 'auto' }}>
                <style>
                  {`
                  .selection-toolbar {
                      position: absolute;
                      display: flex;
                      align-items: center;
                      gap: 4px;
                      background: rgba(26, 26, 26, 0.95);
                      backdrop-filter: blur(10px);
                      -webkit-backdrop-filter: blur(10px);
                      border: 1px solid rgba(255, 255, 255, 0.1);
                      border-radius: 8px;
                      padding: 6px 8px;
                      z-index: 1000;
                      box-shadow: 
                          0 4px 6px -1px rgba(0, 0, 0, 0.1),
                          0 2px 4px -1px rgba(0, 0, 0, 0.06);
                      transform: translate(-50%, -100%) scale(${Math.min(uiScale, 1.2)});
                      transform-origin: bottom center;
                      left: ${selectionTightRect.width / 2}px;
                      top: -40px;
                      max-width: ${Math.min(selectionTightRect.width * 0.9, 300)}px;
                      animation: fadeIn 0.15s ease-out;
                  }
                  @keyframes fadeIn {
                      from { opacity: 0; transform: translate(-50%, -90%) scale(${Math.min(uiScale, 1.2)}); }
                      to { opacity: 1; transform: translate(-50%, -100%) scale(${Math.min(uiScale, 1.2)}); }
                  }
                  .toolbar-btn {
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      width: 28px;
                      height: 28px;
                      border-radius: 6px;
                      border: 1px solid transparent;
                      background: transparent;
                      color: #a1a1aa;
                      cursor: pointer;
                      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                      font-size: 12px;
                  }
                  .toolbar-btn:hover {
                      background: rgba(255, 255, 255, 0.1);
                      color: #fff;
                      border-color: rgba(255, 255, 255, 0.1);
                  }
                  .toolbar-divider {
                      width: 1px;
                      height: 16px;
                      background: rgba(255, 255, 255, 0.15);
                      margin: 0 2px;
                  }
                  `}
                </style>

                <div className="selection-toolbar" onMouseDown={(e) => e.stopPropagation()}>
                  {/* Group Button - Only if not already a group */}
                  {!isGroupSelected && (
                    <button
                      className="toolbar-btn"
                      onClick={() => onCreateGroup?.()}
                      title="Group Selection"
                    >
                      <GroupIcon size={16} />
                    </button>
                  )}

                  {/* Divider if we have multiple buttons */}
                  {!isGroupSelected && totalSelected >= 2 && <div className="toolbar-divider" />}

                  {/* Arrange Button - Only if 2+ items selected */}
                  {totalSelected >= 2 && (
                    <button
                      className="toolbar-btn"
                      onClick={() => {
                        if (selectionTightRect) {
                          triggerArrange(selectionTightRect);
                        }
                      }}
                      title="Arrange Grid"
                    >
                      <LayoutGrid size={16} />
                    </button>
                  )}
                </div>
              </div>
            </Html>
          )}

          {/* Multi-Text Toolbar */}
          {isOnlyText && totalSelected > 1 && (
            <Html
              divProps={{
                style: {
                  pointerEvents: 'none',
                  zIndex: 2000,
                }
              }}
            >
              <div style={{ pointerEvents: 'auto' }}>
                <RichTextToolbar
                  fontFamily={(richTextStates.find(t => selectedRichTextIds.includes(t.id))?.fontFamily) ||
                    (effectiveCanvasTextStates.find(t => selectedCanvasTextIds.includes(t.id))?.fontFamily) || 'Inter'}
                  fontSize={(richTextStates.find(t => selectedRichTextIds.includes(t.id))?.fontSize) ||
                    (effectiveCanvasTextStates.find(t => selectedCanvasTextIds.includes(t.id))?.fontSize) || 20}
                  fill={(richTextStates.find(t => selectedRichTextIds.includes(t.id))?.fill) ||
                    (effectiveCanvasTextStates.find(t => selectedCanvasTextIds.includes(t.id))?.color) || 'white'}
                  align={(richTextStates.find(t => selectedRichTextIds.includes(t.id))?.align) ||
                    (effectiveCanvasTextStates.find(t => selectedCanvasTextIds.includes(t.id))?.textAlign) || 'left'}
                  onChange={handleMultiTextChange}
                  position={{
                    x: Math.min(selectionTightRect.width / 2, selectionTightRect.width - 150),
                    y: Math.max(-60, -selectionTightRect.height - 10) // Ensure it doesn't go too far up
                  }}
                />
              </div>
            </Html>
          )}

          {/* Blue background that moves with the group - matching smart select */}
          <Rect
            x={0}
            y={0}
            width={selectionTightRect.width}
            height={selectionTightRect.height}
            fill="rgba(59, 130, 246, 0.1)" // Same color and opacity as smart select
            listening={false}
          />
          
          {/* Selection border - dashed rectangle that moves with the group - matching smart select */}
          <Rect
            x={0}
            y={0}
            width={selectionTightRect.width}
            height={selectionTightRect.height}
            fill="transparent"
            stroke="rgba(76, 131, 255, 0.6)" // Same color and opacity as smart select
            strokeWidth={2}
            dash={[4, 4]}
            listening={false}
            globalCompositeOperation="source-over"
          />
        </Group>

        {(totalSelected > 1) && selectionTransformerRect && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={false} // User wants to remove handles, so rotation is definitely out
            resizeEnabled={false} // User said "remove 6 scale squares", implying no resizing
            enabledAnchors={[]} // Remove all scale handles
            boundBoxFunc={(oldBox: { x: number; y: number; width: number; height: number; rotation: number }, newBox: { x: number; y: number; width: number; height: number; rotation: number }) => {
              return oldBox; // Prevent any resizing logic just in case
            }}
            borderStroke="transparent" // Hide Transformer border since we have border in Group
            borderStrokeWidth={0}
            borderDash={[]}
            padding={4}
            onTransformEnd={handleTransformEnd}
          />
        )}
      </>
    );
  }

  if (isSelecting && selectionBox) {
    // While dragging, show live marquee box (should appear on top of all components)
    return (
      <Rect
        ref={smartSelectRectRef}
        x={Math.min(selectionBox.startX, selectionBox.currentX)}
        y={Math.min(selectionBox.startY, selectionBox.currentY)}
        width={Math.max(1, Math.abs(selectionBox.currentX - selectionBox.startX))}
        height={Math.max(1, Math.abs(selectionBox.currentY - selectionBox.startY))}
        fill={isOnlyText ? "transparent" : "rgba(59, 130, 246, 0.1)"}
        stroke={isOnlyText ? "transparent" : "rgba(76, 131, 255, 0.6)"}
        strokeWidth={2}
        dash={[4, 4]}
        listening={false}
        globalCompositeOperation="source-over"
        cornerRadius={0}
      />
    );
  }



  return null;
};

