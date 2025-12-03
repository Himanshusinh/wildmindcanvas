'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Rect, Group, Text, Transformer } from 'react-konva';
import Konva from 'konva';
import { ImageUpload } from '@/types/canvas';

const GRID_GAP = 10; // Minimal gap between components
const GRID_PADDING = 8; // Minimal equal padding on all sides (left, right, top, bottom)
const GRID_ITEM_MIN_SIZE = 80;
const ARRANGE_ANIMATION_DURATION = 420;
const BUTTON_OVERFLOW_PADDING = 72;

interface SelectedComponent {
  type: 'image' | 'text' | 'imageModal' | 'videoModal' | 'musicModal' | 'upscaleModal' | 'removeBgModal' | 'eraseModal' | 'expandModal' | 'vectorizeModal' | 'storyboardModal' | 'scriptFrameModal' | 'sceneFrameModal';
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
  setMusicModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number }>>>;
  textInputStates: Array<{ id: string; x: number; y: number; autoFocusInput?: boolean }>;
  imageModalStates: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number }>;
  videoModalStates: Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number }>;
  musicModalStates: Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number }>;
  setSelectedImageIndices: React.Dispatch<React.SetStateAction<number[]>>;
  setSelectedTextInputIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedImageModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedVideoModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedMusicModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  onPersistImageModalMove?: (id: string, updates: Partial<{ x: number; y: number; isGenerating?: boolean }>) => void | Promise<void>;
  onPersistVideoModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistMusicModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistTextModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onImageUpdate?: (index: number, updates: Partial<ImageUpload>) => void;
  selectedUpscaleModalIds: string[];
  selectedRemoveBgModalIds: string[];
  selectedEraseModalIds: string[];
  selectedExpandModalIds: string[];
  selectedVectorizeModalIds: string[];
  selectedStoryboardModalIds: string[];
  selectedScriptFrameModalIds: string[];
  selectedSceneFrameModalIds: string[];
  upscaleModalStates: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>;
  removeBgModalStates: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>;
  eraseModalStates: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>;
  expandModalStates: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>;
  vectorizeModalStates: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>;
  storyboardModalStates: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>;
  scriptFrameModalStates: Array<{ id: string; x: number; y: number; frameWidth: number; frameHeight: number }>;
  sceneFrameModalStates: Array<{ id: string; x: number; y: number; frameWidth: number; frameHeight: number }>;
  setUpscaleModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>>>;
  setRemoveBgModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>>>;
  setEraseModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>>>;
  setExpandModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>>>;
  setVectorizeModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>>>;
  setStoryboardModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }>>>;
  setScriptFrameModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; frameWidth: number; frameHeight: number }>>>;
  setSceneFrameModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; frameWidth: number; frameHeight: number }>>>;
  setSelectedUpscaleModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedRemoveBgModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedEraseModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedExpandModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedVectorizeModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedStoryboardModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedScriptFrameModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedSceneFrameModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  onPersistUpscaleModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistRemoveBgModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistEraseModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistExpandModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistVectorizeModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistStoryboardModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistScriptFrameModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistSceneFrameModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({
  selectionBox,
  selectionTightRect,
  isSelecting,
  isDragSelection,
  selectedImageIndices,
  selectedImageModalIds,
  selectedVideoModalIds,
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
  setMusicModalStates,
  textInputStates,
  imageModalStates,
  videoModalStates,
  musicModalStates,
  setSelectedImageIndices,
  setSelectedTextInputIds,
  setSelectedImageModalIds,
  setSelectedVideoModalIds,
  setSelectedMusicModalIds,
  onPersistImageModalMove,
  onPersistVideoModalMove,
  onPersistMusicModalMove,
  onPersistTextModalMove,
  onImageUpdate,
  selectedUpscaleModalIds,
  selectedRemoveBgModalIds,
  selectedEraseModalIds,
  selectedExpandModalIds,
  selectedVectorizeModalIds,
  selectedStoryboardModalIds,
  selectedScriptFrameModalIds,
  selectedSceneFrameModalIds,
  upscaleModalStates,
  removeBgModalStates,
  eraseModalStates,
  expandModalStates,
  vectorizeModalStates,
  storyboardModalStates,
  scriptFrameModalStates,
  sceneFrameModalStates,
  setUpscaleModalStates,
  setRemoveBgModalStates,
  setEraseModalStates,
  setExpandModalStates,
  setVectorizeModalStates,
  setStoryboardModalStates,
  setScriptFrameModalStates,
  setSceneFrameModalStates,
  setSelectedUpscaleModalIds,
  setSelectedRemoveBgModalIds,
  setSelectedEraseModalIds,
  setSelectedExpandModalIds,
  setSelectedVectorizeModalIds,
  setSelectedStoryboardModalIds,
  setSelectedScriptFrameModalIds,
  setSelectedSceneFrameModalIds,
  onPersistUpscaleModalMove,
  onPersistRemoveBgModalMove,
  onPersistEraseModalMove,
  onPersistExpandModalMove,
  onPersistVectorizeModalMove,
  onPersistStoryboardModalMove,
  onPersistScriptFrameModalMove,
  onPersistSceneFrameModalMove,
}) => {
  // Store original positions of all components when drag starts
  const originalPositionsRef = React.useRef<{
    images: Map<number, { x: number; y: number }>;
    textInputs: Map<string, { x: number; y: number }>;
    imageModals: Map<string, { x: number; y: number }>;
    videoModals: Map<string, { x: number; y: number }>;
    musicModals: Map<string, { x: number; y: number }>;
    upscaleModals: Map<string, { x: number; y: number }>;
    removeBgModals: Map<string, { x: number; y: number }>;
    eraseModals: Map<string, { x: number; y: number }>;
    expandModals: Map<string, { x: number; y: number }>;
    vectorizeModals: Map<string, { x: number; y: number }>;
    storyboardModals: Map<string, { x: number; y: number }>;
    scriptFrameModals: Map<string, { x: number; y: number }>;
    sceneFrameModals: Map<string, { x: number; y: number }>;
  } | null>(null);

  // Store original tight rect position
  const originalTightRectRef = React.useRef<{ x: number; y: number } | null>(null);

  // Ref for the selection box group (for Transformer)
  const selectionGroupRef = React.useRef<Konva.Group>(null);
  const transformerRef = React.useRef<Konva.Transformer>(null);

  const arrangeStateRef = useRef<{ selectionKey: string; order: string[]; bounds?: { minX: number; minY: number; maxX: number; maxY: number } } | null>(null);
  const arrangeAnimationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (arrangeAnimationFrameRef.current) {
        cancelAnimationFrame(arrangeAnimationFrameRef.current);
        arrangeAnimationFrameRef.current = null;
      }
    };
  }, []);

  // Calculate total number of selected items
  const totalSelected = selectedImageIndices.length +
    selectedImageModalIds.length +
    selectedVideoModalIds.length +
    selectedMusicModalIds.length +
    selectedTextInputIds.length +
    selectedUpscaleModalIds.length +
    selectedRemoveBgModalIds.length +
    selectedEraseModalIds.length +
    selectedExpandModalIds.length +
    selectedVectorizeModalIds.length +
    selectedStoryboardModalIds.length +
    selectedScriptFrameModalIds.length +
    selectedSceneFrameModalIds.length;


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
      `musicModal:${serializeStrings(selectedMusicModalIds)}`,
      `upscaleModal:${serializeStrings(selectedUpscaleModalIds)}`,
      `removeBgModal:${serializeStrings(selectedRemoveBgModalIds)}`,
      `eraseModal:${serializeStrings(selectedEraseModalIds)}`,
      `expandModal:${serializeStrings(selectedExpandModalIds)}`,
      `vectorizeModal:${serializeStrings(selectedVectorizeModalIds)}`,
      `storyboardModal:${serializeStrings(selectedStoryboardModalIds)}`,
      `scriptFrameModal:${serializeStrings(selectedScriptFrameModalIds)}`,
      `sceneFrameModal:${serializeStrings(selectedSceneFrameModalIds)}`,
    ].join('|');
  };

  const collectSelectedComponents = (): SelectedComponent[] => {
    const components: SelectedComponent[] = [];

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
        width: 600,
        height: 400,
        x: text.x || 0,
        y: text.y || 0,
      });
    });

    selectedImageModalIds.forEach((id) => {
      const modal = imageModalStates.find((m) => m.id === id);
      if (!modal) return;
      components.push({
        type: 'imageModal',
        id,
        key: `imgModal-${id}`,
        width: modal.frameWidth || 600,
        height: modal.frameHeight || 400,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedVideoModalIds.forEach((id) => {
      const modal = videoModalStates.find((m) => m.id === id);
      if (!modal) return;
      components.push({
        type: 'videoModal',
        id,
        key: `videoModal-${id}`,
        width: modal.frameWidth || 600,
        height: modal.frameHeight || 400,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedMusicModalIds.forEach((id) => {
      const modal = musicModalStates.find((m) => m.id === id);
      if (!modal) return;
      components.push({
        type: 'musicModal',
        id,
        key: `musicModal-${id}`,
        width: modal.frameWidth || 600,
        height: modal.frameHeight || 300,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedUpscaleModalIds.forEach((id) => {
      const modal = upscaleModalStates.find((m) => m.id === id);
      if (!modal) return;
      components.push({
        type: 'upscaleModal',
        id,
        key: `upscaleModal-${id}`,
        width: modal.frameWidth || 600,
        height: modal.frameHeight || 400,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedRemoveBgModalIds.forEach((id) => {
      const modal = removeBgModalStates.find((m) => m.id === id);
      if (!modal) return;
      components.push({
        type: 'removeBgModal',
        id,
        key: `removeBgModal-${id}`,
        width: modal.frameWidth || 600,
        height: modal.frameHeight || 400,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedEraseModalIds.forEach((id) => {
      const modal = eraseModalStates.find((m) => m.id === id);
      if (!modal) return;
      components.push({
        type: 'eraseModal',
        id,
        key: `eraseModal-${id}`,
        width: modal.frameWidth || 600,
        height: modal.frameHeight || 400,
        x: modal.x || 0,
        y: modal.y || 0,
      });
    });

    selectedExpandModalIds.forEach((id) => {
      const modal = expandModalStates.find((m) => m.id === id);
      if (!modal) return;
      components.push({
        type: 'expandModal',
        id,
        key: `expandModal-${id}`,
        width: modal.frameWidth || 600,
        height: modal.frameHeight || 400,
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
        .filter((t) => t.type === 'text')
        .forEach((target) => {
          Promise.resolve(
            onPersistTextModalMove(target.id as string, { x: target.to.x, y: target.to.y })
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
      minX = Math.min(minX, target.to.x);
      minY = Math.min(minY, target.to.y);
      maxX = Math.max(maxX, target.to.x + target.width);
      maxY = Math.max(maxY, target.to.y + target.height);
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


  // Show SelectionBox if:
  // 1. There's a selection rect AND it's a drag selection with 2+ components, OR
  // 2. There's a selection rect AND a group is selected (for group dragging and ungroup button)
  if (selectionTightRect && isDragSelection && totalSelected >= 2) {
    // After selection completes, show tight rect with toolbar and allow dragging to move all
    return (
      <>
        {/* Keep the normal marquee visible with subtle styling to indicate parallel selection */}
        {selectionBox && (
          <Rect
            x={Math.min(selectionBox.startX, selectionBox.currentX)}
            y={Math.min(selectionBox.startY, selectionBox.currentY)}
            width={Math.max(1, Math.abs(selectionBox.currentX - selectionBox.startX))}
            height={Math.max(1, Math.abs(selectionBox.currentY - selectionBox.startY))}
            fill="rgba(147, 197, 253, 0.12)"
            stroke="#93C5FD"
            strokeWidth={3}
            dash={[8, 6]}
            listening={false}
            globalCompositeOperation="source-over"
            cornerRadius={0}
          />
        )}
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
              images: new Map<number, { x: number; y: number }>(),
              textInputs: new Map<string, { x: number; y: number }>(),
              imageModals: new Map<string, { x: number; y: number }>(),
              videoModals: new Map<string, { x: number; y: number }>(),
              musicModals: new Map<string, { x: number; y: number }>(),
              upscaleModals: new Map<string, { x: number; y: number }>(),
              removeBgModals: new Map<string, { x: number; y: number }>(),
              eraseModals: new Map<string, { x: number; y: number }>(),
              expandModals: new Map<string, { x: number; y: number }>(),
              vectorizeModals: new Map<string, { x: number; y: number }>(),
              storyboardModals: new Map<string, { x: number; y: number }>(),
              scriptFrameModals: new Map<string, { x: number; y: number }>(),
              sceneFrameModals: new Map<string, { x: number; y: number }>(),
            };

            // Store original image positions
            selectedImageIndices.forEach(idx => {
              const it = images[idx];
              if (it) {
                originalPositions.images.set(idx, { x: it.x || 0, y: it.y || 0 });
              }
            });

            // Store original text input positions
            selectedTextInputIds.forEach(textId => {
              const textState = textInputStates.find(t => t.id === textId);
              if (textState) {
                originalPositions.textInputs.set(textId, { x: textState.x, y: textState.y });
              }
            });

            // Store original image modal positions
            selectedImageModalIds.forEach(modalId => {
              const modalState = imageModalStates.find(m => m.id === modalId);
              if (modalState) {
                originalPositions.imageModals.set(modalId, { x: modalState.x, y: modalState.y });
              }
            });

            // Store original video modal positions
            selectedVideoModalIds.forEach(modalId => {
              const modalState = videoModalStates.find(m => m.id === modalId);
              if (modalState) {
                originalPositions.videoModals.set(modalId, { x: modalState.x, y: modalState.y });
              }
            });

            // Store original music modal positions
            selectedMusicModalIds.forEach(modalId => {
              const modalState = musicModalStates.find(m => m.id === modalId);
              if (modalState) {
                originalPositions.musicModals.set(modalId, { x: modalState.x, y: modalState.y });
              }
            });

            // Store original upscale modal positions
            selectedUpscaleModalIds.forEach(modalId => {
              const modalState = upscaleModalStates.find(m => m.id === modalId);
              if (modalState) {
                originalPositions.upscaleModals.set(modalId, { x: modalState.x, y: modalState.y });
              }
            });

            // Store original remove bg modal positions
            selectedRemoveBgModalIds.forEach(modalId => {
              const modalState = removeBgModalStates.find(m => m.id === modalId);
              if (modalState) {
                originalPositions.removeBgModals.set(modalId, { x: modalState.x, y: modalState.y });
              }
            });

            // Store original erase modal positions
            selectedEraseModalIds.forEach(modalId => {
              const modalState = eraseModalStates.find(m => m.id === modalId);
              if (modalState) {
                originalPositions.eraseModals.set(modalId, { x: modalState.x, y: modalState.y });
              }
            });

            // Store original expand modal positions
            selectedExpandModalIds.forEach(modalId => {
              const modalState = expandModalStates.find(m => m.id === modalId);
              if (modalState) {
                originalPositions.expandModals.set(modalId, { x: modalState.x, y: modalState.y });
              }
            });

            // Store original vectorize modal positions
            selectedVectorizeModalIds.forEach(modalId => {
              const modalState = vectorizeModalStates.find(m => m.id === modalId);
              if (modalState) {
                originalPositions.vectorizeModals.set(modalId, { x: modalState.x, y: modalState.y });
              }
            });

            // Store original storyboard modal positions
            selectedStoryboardModalIds.forEach(modalId => {
              const modalState = storyboardModalStates.find(m => m.id === modalId);
              if (modalState) {
                originalPositions.storyboardModals.set(modalId, { x: modalState.x, y: modalState.y });
              }
            });

            // Store original script frame modal positions
            selectedScriptFrameModalIds.forEach(modalId => {
              const modalState = scriptFrameModalStates.find(m => m.id === modalId);
              if (modalState) {
                originalPositions.scriptFrameModals.set(modalId, { x: modalState.x, y: modalState.y });
              }
            });

            // Store original scene frame modal positions
            selectedSceneFrameModalIds.forEach(modalId => {
              const modalState = sceneFrameModalStates.find(m => m.id === modalId);
              if (modalState) {
                originalPositions.sceneFrameModals.set(modalId, { x: modalState.x, y: modalState.y });
              }
            });

            originalPositionsRef.current = originalPositions;
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

            // Move all selected images by delta in real-time (from original positions)
            selectedImageIndices.forEach(idx => {
              const originalPos = originalPositions.images.get(idx);
              if (originalPos) {
                handleImageUpdateWithGroup(idx, { x: originalPos.x + deltaX, y: originalPos.y + deltaY });
              }
            });

            // Move all selected text inputs by delta in real-time (from original positions)
            selectedTextInputIds.forEach(textId => {
              const originalPos = originalPositions.textInputs.get(textId);
              if (originalPos) {
                setTextInputStates((prev) =>
                  prev.map((textState) =>
                    textState.id === textId
                      ? { ...textState, x: originalPos.x + deltaX, y: originalPos.y + deltaY }
                      : textState
                  )
                );
              }
            });

            // Move all selected image modals by delta in real-time (from original positions)
            selectedImageModalIds.forEach(modalId => {
              const originalPos = originalPositions.imageModals.get(modalId);
              if (originalPos) {
                setImageModalStates((prev) =>
                  prev.map((modalState) =>
                    modalState.id === modalId
                      ? { ...modalState, x: originalPos.x + deltaX, y: originalPos.y + deltaY }
                      : modalState
                  )
                );
              }
            });

            // Move all selected video modals by delta in real-time (from original positions)
            selectedVideoModalIds.forEach(modalId => {
              const originalPos = originalPositions.videoModals.get(modalId);
              if (originalPos) {
                setVideoModalStates((prev) =>
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

            // Clear original positions
            originalPositionsRef.current = null;
            originalTightRectRef.current = null;

            // Persist final positions for image generator modals once at drag end
            if (onPersistImageModalMove) {
              selectedImageModalIds.forEach((modalId) => {
                const modalState = imageModalStates.find(m => m.id === modalId);
                if (modalState) {
                  Promise.resolve(onPersistImageModalMove(modalId, { x: modalState.x, y: modalState.y })).catch(console.error);
                }
              });
            }

            // Persist final positions for video generator modals
            if (onPersistVideoModalMove) {
              selectedVideoModalIds.forEach((modalId) => {
                const modalState = videoModalStates.find(m => m.id === modalId);
                if (modalState) {
                  Promise.resolve(onPersistVideoModalMove(modalId, { x: modalState.x, y: modalState.y })).catch(console.error);
                }
              });
            }

            // Persist final positions for music generator modals
            if (onPersistMusicModalMove) {
              selectedMusicModalIds.forEach((modalId) => {
                const modalState = musicModalStates.find(m => m.id === modalId);
                if (modalState) {
                  Promise.resolve(onPersistMusicModalMove(modalId, { x: modalState.x, y: modalState.y })).catch(console.error);
                }
              });
            }
            // Persist final positions for upscale modals
            if (onPersistUpscaleModalMove) {
              selectedUpscaleModalIds.forEach((modalId) => {
                const modalState = upscaleModalStates.find(m => m.id === modalId);
                if (modalState) {
                  Promise.resolve(onPersistUpscaleModalMove(modalId, { x: modalState.x, y: modalState.y })).catch(console.error);
                }
              });
            }
            // Persist final positions for remove bg modals
            if (onPersistRemoveBgModalMove) {
              selectedRemoveBgModalIds.forEach((modalId) => {
                const modalState = removeBgModalStates.find(m => m.id === modalId);
                if (modalState) {
                  Promise.resolve(onPersistRemoveBgModalMove(modalId, { x: modalState.x, y: modalState.y })).catch(console.error);
                }
              });
            }
            // Persist final positions for erase modals
            if (onPersistEraseModalMove) {
              selectedEraseModalIds.forEach((modalId) => {
                const modalState = eraseModalStates.find(m => m.id === modalId);
                if (modalState) {
                  Promise.resolve(onPersistEraseModalMove(modalId, { x: modalState.x, y: modalState.y })).catch(console.error);
                }
              });
            }
            // Persist final positions for expand modals
            if (onPersistExpandModalMove) {
              selectedExpandModalIds.forEach((modalId) => {
                const modalState = expandModalStates.find(m => m.id === modalId);
                if (modalState) {
                  Promise.resolve(onPersistExpandModalMove(modalId, { x: modalState.x, y: modalState.y })).catch(console.error);
                }
              });
            }
            // Persist final positions for vectorize modals
            if (onPersistVectorizeModalMove) {
              selectedVectorizeModalIds.forEach((modalId) => {
                const modalState = vectorizeModalStates.find(m => m.id === modalId);
                if (modalState) {
                  Promise.resolve(onPersistVectorizeModalMove(modalId, { x: modalState.x, y: modalState.y })).catch(console.error);
                }
              });
            }
            // Persist final positions for storyboard modals
            if (onPersistStoryboardModalMove) {
              selectedStoryboardModalIds.forEach((modalId) => {
                const modalState = storyboardModalStates.find(m => m.id === modalId);
                if (modalState) {
                  Promise.resolve(onPersistStoryboardModalMove(modalId, { x: modalState.x, y: modalState.y })).catch(console.error);
                }
              });
            }
            // Persist final positions for script frame modals
            if (onPersistScriptFrameModalMove) {
              selectedScriptFrameModalIds.forEach((modalId) => {
                const modalState = scriptFrameModalStates.find(m => m.id === modalId);
                if (modalState) {
                  Promise.resolve(onPersistScriptFrameModalMove(modalId, { x: modalState.x, y: modalState.y })).catch(console.error);
                }
              });
            }
            // Persist final positions for scene frame modals
            if (onPersistSceneFrameModalMove) {
              selectedSceneFrameModalIds.forEach((modalId) => {
                const modalState = sceneFrameModalStates.find(m => m.id === modalId);
                if (modalState) {
                  Promise.resolve(onPersistSceneFrameModalMove(modalId, { x: modalState.x, y: modalState.y })).catch(console.error);
                }
              });
            }
            // Persist final positions for text inputs
            if (onPersistTextModalMove) {
              selectedTextInputIds.forEach((textId) => {
                const textState = textInputStates.find(t => t.id === textId);
                if (textState) {
                  Promise.resolve(onPersistTextModalMove(textId, { x: textState.x, y: textState.y })).catch(console.error);
                }
              });
            }
          }}
        >
          {/* Group name is rendered by GroupLabel component, not here */}
          <Rect
            x={0}
            y={0}
            width={selectionTightRect.width}
            height={selectionTightRect.height}
            fill="rgba(96, 165, 250, 0.22)"
            stroke="#2563EB"
            strokeWidth={4}
            dash={[6, 6]}
            listening={true}
            cornerRadius={0}
          />
          {/* Toolbar buttons at top center, outside selection area */}
          <Group
            x={selectionTightRect.width / 2 - 42} // Center the buttons (total width is 84px: 36 + 12 + 36)
            y={-40}
          >
            {/* Arrange button */}
            <Group
              x={48}
              onClick={(e) => {
                e.cancelBubble = true;
                if (selectionTightRect) {
                  triggerArrange(selectionTightRect);
                }
              }}
              onMouseEnter={(e) => {
                const stage = e.target.getStage();
                if (stage) {
                  stage.container().style.cursor = 'pointer';
                }
              }}
              onMouseLeave={(e) => {
                const stage = e.target.getStage();
                if (stage) {
                  stage.container().style.cursor = 'default';
                }
              }}
            >
              <Rect
                x={0}
                y={0}
                width={36}
                height={36}
                fill="#ffffff"
                stroke="rgba(15,23,42,0.12)"
                strokeWidth={1}
                cornerRadius={10}
                shadowColor="rgba(15,23,42,0.18)"
                shadowBlur={6}
                shadowOffset={{ x: 0, y: 3 }}
              />
              <Group x={9} y={9}>
                {[0, 1, 2].map((row) => (
                  [0, 1, 2].map((col) => (
                    <Rect
                      key={`tight-arrange-${row}-${col}`}
                      x={col * 8}
                      y={row * 8}
                      width={6}
                      height={6}
                      cornerRadius={2}
                      fill={row === col ? '#2563eb' : '#cbd5e5'}
                      opacity={row === col ? 0.95 : 1}
                    />
                  ))
                ))}
              </Group>
            </Group>
          </Group>
          {/* Transformer removed - using 4 corner dots for resize instead */}
        </Group>
      </>
    );
  }

  if (isSelecting && selectionBox) {
    // While dragging, show live marquee box
    return (
      <Rect
        x={Math.min(selectionBox.startX, selectionBox.currentX)}
        y={Math.min(selectionBox.startY, selectionBox.currentY)}
        width={Math.max(1, Math.abs(selectionBox.currentX - selectionBox.startX))}
        height={Math.max(1, Math.abs(selectionBox.currentY - selectionBox.startY))}
        fill="rgba(147, 197, 253, 0.3)"
        stroke="#60A5FA"
        strokeWidth={4}
        dash={[5, 5]}
        listening={false}
        globalCompositeOperation="source-over"
        cornerRadius={0}
      />
    );
  }

  if (selectionBox && !isSelecting) {
    // After drag completes but before tight rect is calculated, show the selection box with buttons
    return (
      <Group
        x={Math.min(selectionBox.startX, selectionBox.currentX)}
        y={Math.min(selectionBox.startY, selectionBox.currentY)}
      >
        <Rect
          x={0}
          y={0}
          width={Math.max(1, Math.abs(selectionBox.currentX - selectionBox.startX))}
          height={Math.max(1, Math.abs(selectionBox.currentY - selectionBox.startY))}
          fill="rgba(147, 197, 253, 0.3)"
          stroke="#60A5FA"
          strokeWidth={4}
          dash={[5, 5]}
          listening={false}
          globalCompositeOperation="source-over"
          cornerRadius={0}
        />
        {/* Toolbar buttons at top center, outside selection area - only show if 2+ items selected */}
        {totalSelected >= 2 && (
          <Group
            x={Math.max(1, Math.abs(selectionBox.currentX - selectionBox.startX)) / 2 - 18}
            y={-40}
          >
            {/* Arrange button */}
            <Group
              x={48}
              onClick={(e) => {
                e.cancelBubble = true;
                const boxWidth = Math.abs(selectionBox.currentX - selectionBox.startX);
                const boxHeight = Math.abs(selectionBox.currentY - selectionBox.startY);
                const boxX = Math.min(selectionBox.startX, selectionBox.currentX);
                const boxY = Math.min(selectionBox.startY, selectionBox.currentY);
                triggerArrange({ x: boxX, y: boxY, width: boxWidth, height: boxHeight });
              }}
              onMouseEnter={(e) => {
                const stage = e.target.getStage();
                if (stage) {
                  stage.container().style.cursor = 'pointer';
                }
              }}
              onMouseLeave={(e) => {
                const stage = e.target.getStage();
                if (stage) {
                  stage.container().style.cursor = 'default';
                }
              }}
            >
              <Rect
                x={0}
                y={0}
                width={36}
                height={36}
                fill="#ffffff"
                stroke="rgba(15,23,42,0.12)"
                strokeWidth={1}
                cornerRadius={10}
                shadowColor="rgba(15,23,42,0.18)"
                shadowBlur={6}
                shadowOffset={{ x: 0, y: 3 }}
              />
              <Group x={9} y={9}>
                {[0, 1, 2].map((row) => (
                  [0, 1, 2].map((col) => (
                    <Rect
                      key={`toolbar-arrange-${row}-${col}`}
                      x={col * 8}
                      y={row * 8}
                      width={6}
                      height={6}
                      cornerRadius={2}
                      fill={row === col ? '#2563eb' : '#cbd5f5'}
                      opacity={row === col ? 0.95 : 1}
                    />
                  ))
                ))}
              </Group>
            </Group>
          </Group>
        )}
      </Group>
    );
  }

  return null;
};

