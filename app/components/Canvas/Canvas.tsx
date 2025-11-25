'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import { ImageUpload } from '@/types/canvas';
import { Model3DOverlay } from './Model3DOverlay';
import { ContextMenu } from '@/app/components/ContextMenu';
import { CanvasImage } from './CanvasImage';
import { TextElements } from './TextElements';
import { ModalOverlays } from '@/app/components/ModalOverlays';
import { SelectionBox } from './SelectionBox';
import { MediaActionIcons } from './MediaActionIcons';
import AvatarButton from './AvatarButton';
import { SettingsPopup } from '@/app/components/Settings';
import { CanvasImageConnectionNodes } from './CanvasImageConnectionNodes';
import { existsNearby, findAvailablePositionNear, applyStageCursor, checkOverlap, findBlankSpace, focusOnComponent, INFINITE_CANVAS_SIZE, DOT_SPACING, DOT_SIZE, DOT_OPACITY } from '@/lib/canvasHelpers';
import { generateScenesFromStory } from '@/lib/api';

interface CanvasProps {
  images?: ImageUpload[];
  onViewportChange?: (center: { x: number; y: number }, scale: number) => void;
  onImageUpdate?: (index: number, updates: Partial<ImageUpload>) => void;
  onImageDelete?: (index: number) => void;
  onImageDownload?: (index: number) => void;
  onImageDuplicate?: (index: number) => void;
  onImagesDrop?: (files: File[]) => void;
  onLibraryMediaDrop?: (media: { id: string; url: string; type: 'image' | 'video' | 'music' | 'uploaded'; thumbnail?: string; prompt?: string; model?: string; createdAt?: string; storagePath?: string; mediaId?: string }, x: number, y: number) => void;
  selectedTool?: 'cursor' | 'move' | 'text' | 'image' | 'video' | 'music' | 'library' | 'plugin';
  onTextCreate?: (text: string, x: number, y: number) => void;
  toolClickCounter?: number;
  isImageModalOpen?: boolean;
  onImageModalClose?: () => void;
  onImageSelect?: (file: File) => void;
  onImageGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string, modalId?: string, imageCount?: number) => Promise<{ url: string; images?: Array<{ url: string }> } | null>;
  generatedImageUrl?: string | null;
  isVideoModalOpen?: boolean;
  onVideoModalClose?: () => void;
  onVideoSelect?: (file: File) => void;
  onVideoGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string, duration: number, resolution?: string, modalId?: string, firstFrameUrl?: string, lastFrameUrl?: string) => Promise<{ generationId?: string; taskId?: string; provider?: string } | null>;
  generatedVideoUrl?: string | null;
  isMusicModalOpen?: boolean;
  onMusicModalClose?: () => void;
  onMusicSelect?: (file: File) => void;
  onMusicGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string) => Promise<string | null>;
  generatedMusicUrl?: string | null;
  onAddImageToCanvas?: (url: string) => void;
  projectId?: string | null;
  externalImageModals?: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>;
  externalVideoModals?: Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>;
  externalMusicModals?: Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>;
  externalUpscaleModals?: Array<{ id: string; x: number; y: number; upscaledImageUrl?: string | null; sourceImageUrl?: string | null; localUpscaledImageUrl?: string | null; model?: string; scale?: number; frameWidth?: number; frameHeight?: number; isUpscaling?: boolean }>;
  externalRemoveBgModals?: Array<{ id: string; x: number; y: number; removedBgImageUrl?: string | null; sourceImageUrl?: string | null; localRemovedBgImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isRemovingBg?: boolean }>;
  externalEraseModals?: Array<{ id: string; x: number; y: number; erasedImageUrl?: string | null; sourceImageUrl?: string | null; localErasedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isErasing?: boolean }>;
  externalReplaceModals?: Array<{ id: string; x: number; y: number; replacedImageUrl?: string | null; sourceImageUrl?: string | null; localReplacedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isReplacing?: boolean }>;
  externalExpandModals?: Array<{ id: string; x: number; y: number; expandedImageUrl?: string | null; sourceImageUrl?: string | null; localExpandedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isExpanding?: boolean }>;
  externalVectorizeModals?: Array<{ id: string; x: number; y: number; vectorizedImageUrl?: string | null; sourceImageUrl?: string | null; localVectorizedImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isVectorizing?: boolean }>;
  externalStoryboardModals?: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number; scriptText?: string | null }>;
  externalScriptFrameModals?: Array<{ id: string; pluginId: string; x: number; y: number; frameWidth: number; frameHeight: number; text: string }>;
  externalSceneFrameModals?: Array<{ id: string; scriptFrameId: string; sceneNumber: number; x: number; y: number; frameWidth: number; frameHeight: number; content: string }>;
  externalTextModals?: Array<{ id: string; x: number; y: number; value?: string; autoFocusInput?: boolean }>;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
  onPersistImageModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>) => void | Promise<void>;
  onPersistImageModalDelete?: (id: string) => void | Promise<void>;
  onPersistVideoModalCreate?: (modal: { id: string; x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
  onPersistVideoModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>) => void | Promise<void>;
  onPersistVideoModalDelete?: (id: string) => void | Promise<void>;
  onPersistMusicModalCreate?: (modal: { id: string; x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
  onPersistMusicModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>) => void | Promise<void>;
  onPersistMusicModalDelete?: (id: string) => void | Promise<void>;
  // Upscale plugin persistence callbacks
  onPersistUpscaleModalCreate?: (modal: { id: string; x: number; y: number; upscaledImageUrl?: string | null; sourceImageUrl?: string | null; localUpscaledImageUrl?: string | null; model?: string; scale?: number; frameWidth?: number; frameHeight?: number; isUpscaling?: boolean }) => void | Promise<void>;
  onPersistUpscaleModalMove?: (id: string, updates: Partial<{ x: number; y: number; upscaledImageUrl?: string | null; sourceImageUrl?: string | null; localUpscaledImageUrl?: string | null; model?: string; scale?: number; frameWidth?: number; frameHeight?: number; isUpscaling?: boolean }>) => void | Promise<void>;
  onPersistUpscaleModalDelete?: (id: string) => void | Promise<void>;
  onUpscale?: (model: string, scale: number, sourceImageUrl?: string) => Promise<string | null>;
  onPersistRemoveBgModalCreate?: (modal: { id: string; x: number; y: number; removedBgImageUrl?: string | null; sourceImageUrl?: string | null; localRemovedBgImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isRemovingBg?: boolean }) => void | Promise<void>;
  onPersistRemoveBgModalMove?: (id: string, updates: Partial<{ x: number; y: number; removedBgImageUrl?: string | null; sourceImageUrl?: string | null; localRemovedBgImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isRemovingBg?: boolean }>) => void | Promise<void>;
  onPersistRemoveBgModalDelete?: (id: string) => void | Promise<void>;
  onRemoveBg?: (model: string, backgroundType: string, scaleValue: number, sourceImageUrl?: string) => Promise<string | null>;
  // Erase plugin persistence callbacks
  onPersistEraseModalCreate?: (modal: { id: string; x: number; y: number; erasedImageUrl?: string | null; sourceImageUrl?: string | null; localErasedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isErasing?: boolean }) => void | Promise<void>;
  onPersistEraseModalMove?: (id: string, updates: Partial<{ x: number; y: number; erasedImageUrl?: string | null; sourceImageUrl?: string | null; localErasedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isErasing?: boolean }>) => void | Promise<void>;
  onPersistEraseModalDelete?: (id: string) => void | Promise<void>;
  onErase?: (model: string, sourceImageUrl?: string, mask?: string) => Promise<string | null>;
  // Replace plugin persistence callbacks
  onPersistReplaceModalCreate?: (modal: { id: string; x: number; y: number; replacedImageUrl?: string | null; sourceImageUrl?: string | null; localReplacedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isReplacing?: boolean }) => void | Promise<void>;
  onPersistReplaceModalMove?: (id: string, updates: Partial<{ x: number; y: number; replacedImageUrl?: string | null; sourceImageUrl?: string | null; localReplacedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isReplacing?: boolean }>) => void | Promise<void>;
  onPersistReplaceModalDelete?: (id: string) => void | Promise<void>;
  onReplace?: (model: string, sourceImageUrl?: string, mask?: string, prompt?: string) => Promise<string | null>;
  onPersistExpandModalCreate?: (modal: { id: string; x: number; y: number; expandedImageUrl?: string | null; sourceImageUrl?: string | null; localExpandedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isExpanding?: boolean }) => void | Promise<void>;
  onPersistExpandModalMove?: (id: string, updates: Partial<{ x: number; y: number; expandedImageUrl?: string | null; sourceImageUrl?: string | null; localExpandedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isExpanding?: boolean }>) => void | Promise<void>;
  onPersistExpandModalDelete?: (id: string) => void | Promise<void>;
  onExpand?: (model: string, sourceImageUrl?: string, prompt?: string, canvasSize?: [number, number], originalImageSize?: [number, number], originalImageLocation?: [number, number], aspectRatio?: string) => Promise<string | null>;
  // Vectorize plugin persistence callbacks
  onPersistVectorizeModalCreate?: (modal: { id: string; x: number; y: number; vectorizedImageUrl?: string | null; sourceImageUrl?: string | null; localVectorizedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isVectorizing?: boolean }) => void | Promise<void>;
  onPersistVectorizeModalMove?: (id: string, updates: Partial<{ x: number; y: number; vectorizedImageUrl?: string | null; sourceImageUrl?: string | null; localVectorizedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isVectorizing?: boolean }>) => void | Promise<void>;
  onPersistVectorizeModalDelete?: (id: string) => void | Promise<void>;
  onPersistStoryboardModalCreate?: (modal: { id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }) => void | Promise<void>;
  onPersistStoryboardModalMove?: (id: string, updates: Partial<{ x: number; y: number; frameWidth?: number; frameHeight?: number; scriptText?: string | null }>) => void | Promise<void>;
  onPersistStoryboardModalDelete?: (id: string) => void | Promise<void>;
  onPersistScriptFrameModalCreate?: (modal: { id: string; pluginId: string; x: number; y: number; frameWidth: number; frameHeight: number; text: string }) => void | Promise<void>;
  onPersistScriptFrameModalMove?: (id: string, updates: Partial<{ x: number; y: number; frameWidth: number; frameHeight: number; text: string }>) => void | Promise<void>;
  onPersistScriptFrameModalDelete?: (id: string) => void | Promise<void>;
  onPersistSceneFrameModalCreate?: (modal: { id: string; scriptFrameId: string; sceneNumber: number; x: number; y: number; frameWidth: number; frameHeight: number; content: string }) => void | Promise<void>;
  onPersistSceneFrameModalMove?: (id: string, updates: Partial<{ x: number; y: number; frameWidth: number; frameHeight: number; content: string }>) => void | Promise<void>;
  onPersistSceneFrameModalDelete?: (id: string) => void | Promise<void>;
  onVectorize?: (sourceImageUrl?: string, mode?: string) => Promise<string | null>;
  // Text generator (input overlay) persistence callbacks
  onPersistTextModalCreate?: (modal: { id: string; x: number; y: number; value?: string; autoFocusInput?: boolean }) => void | Promise<void>;
  onPersistTextModalMove?: (id: string, updates: Partial<{ x: number; y: number; value?: string }>) => void | Promise<void>;
  onPersistTextModalDelete?: (id: string) => void | Promise<void>;
  // Connector props
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }>;
  onConnectionsChange?: (connections: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }>) => void;
  onPersistConnectorCreate?: (connector: { id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }) => void | Promise<void>;
  onPersistConnectorDelete?: (connectorId: string) => void | Promise<void>;
  onPluginSidebarOpen?: () => void;
  isUIHidden?: boolean;
}



export const Canvas: React.FC<CanvasProps> = ({
  images = [],
  onViewportChange,
  onImageUpdate,
  onImageDelete,
  onImageDownload,
  onImageDuplicate,
  onImagesDrop,
  onLibraryMediaDrop,
  selectedTool,
  onTextCreate,
  toolClickCounter = 0,
  isImageModalOpen = false,
  onImageModalClose,
  onImageSelect,
  onImageGenerate,
  generatedImageUrl,
  isVideoModalOpen = false,
  onVideoModalClose,
  onVideoSelect,
  onVideoGenerate,
  generatedVideoUrl,
  isMusicModalOpen = false,
  onMusicModalClose,
  onMusicSelect,
  onMusicGenerate,
  generatedMusicUrl,
  onAddImageToCanvas,
  projectId,
  externalImageModals,
  externalVideoModals,
  externalMusicModals,
  externalUpscaleModals,
  externalRemoveBgModals,
  externalEraseModals,
  externalReplaceModals,
  externalExpandModals,
  externalVectorizeModals,
  externalStoryboardModals,
  externalScriptFrameModals,
  externalSceneFrameModals,
  externalTextModals,
  onPersistImageModalCreate,
  onPersistImageModalMove,
  onPersistImageModalDelete,
  onPersistVideoModalCreate,
  onPersistVideoModalMove,
  onPersistVideoModalDelete,
  onPersistMusicModalCreate,
  onPersistMusicModalMove,
  onPersistMusicModalDelete,
  onPersistUpscaleModalCreate,
  onPersistUpscaleModalMove,
  onPersistUpscaleModalDelete,
  onUpscale,
  onPersistRemoveBgModalCreate,
  onPersistRemoveBgModalMove,
  onPersistRemoveBgModalDelete,
  onRemoveBg,
  onPersistEraseModalCreate,
  onPersistEraseModalMove,
  onPersistEraseModalDelete,
  onErase,
  onPersistReplaceModalCreate,
  onPersistReplaceModalMove,
  onPersistReplaceModalDelete,
  onReplace,
  onPersistExpandModalCreate,
  onPersistExpandModalMove,
  onPersistExpandModalDelete,
  onExpand,
  onPersistVectorizeModalCreate,
  onPersistVectorizeModalMove,
  onPersistVectorizeModalDelete,
  onVectorize,
  onPersistStoryboardModalCreate,
  onPersistStoryboardModalMove,
  onPersistStoryboardModalDelete,
  onPersistScriptFrameModalCreate,
  onPersistScriptFrameModalMove,
  onPersistScriptFrameModalDelete,
  onPersistSceneFrameModalCreate,
  onPersistSceneFrameModalMove,
  onPersistSceneFrameModalDelete,
  onPersistTextModalCreate,
  onPersistTextModalMove,
  onPersistTextModalDelete,
  connections = [],
  onConnectionsChange,
  onPersistConnectorCreate,
  onPersistConnectorDelete,
  onPluginSidebarOpen,
  isUIHidden = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const initializedRef = useRef(false);
  const [patternImage, setPatternImage] = useState<HTMLImageElement | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 800 });
  const [scale, setScale] = useState(1);
  // Center the initial view on the canvas
  const [position, setPosition] = useState({
    x: 0,
    y: 0
  });
  const [textInputStates, setTextInputStates] = useState<Array<{ id: string; x: number; y: number; value?: string; autoFocusInput?: boolean }>>([]);
  const [imageModalStates, setImageModalStates] = useState<Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>>([]);
  const [videoModalStates, setVideoModalStates] = useState<Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null; duration?: number; resolution?: string; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>>([]);
  const [musicModalStates, setMusicModalStates] = useState<Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>>([]);
  const [upscaleModalStates, setUpscaleModalStates] = useState<Array<{ id: string; x: number; y: number; upscaledImageUrl?: string | null; sourceImageUrl?: string | null; localUpscaledImageUrl?: string | null; model?: string; scale?: number; frameWidth?: number; frameHeight?: number; isUpscaling?: boolean }>>([]);
  const [removeBgModalStates, setRemoveBgModalStates] = useState<Array<{ id: string; x: number; y: number; removedBgImageUrl?: string | null; sourceImageUrl?: string | null; localRemovedBgImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isRemovingBg?: boolean }>>([]);
  const [eraseModalStates, setEraseModalStates] = useState<Array<{ id: string; x: number; y: number; erasedImageUrl?: string | null; sourceImageUrl?: string | null; localErasedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isErasing?: boolean }>>([]);
  const [replaceModalStates, setReplaceModalStates] = useState<Array<{ id: string; x: number; y: number; replacedImageUrl?: string | null; sourceImageUrl?: string | null; localReplacedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isReplacing?: boolean }>>([]);
  const [expandModalStates, setExpandModalStates] = useState<Array<{ id: string; x: number; y: number; expandedImageUrl?: string | null; sourceImageUrl?: string | null; localExpandedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isExpanding?: boolean }>>([]);
  const [vectorizeModalStates, setVectorizeModalStates] = useState<Array<{ id: string; x: number; y: number; vectorizedImageUrl?: string | null; sourceImageUrl?: string | null; localVectorizedImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isVectorizing?: boolean }>>([]);
  const [storyboardModalStates, setStoryboardModalStates] = useState<Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number; scriptText?: string | null }>>([]);
  const [scriptFrameModalStates, setScriptFrameModalStates] = useState<Array<{ id: string; pluginId: string; x: number; y: number; frameWidth: number; frameHeight: number; text: string }>>([]);
  const [sceneFrameModalStates, setSceneFrameModalStates] = useState<Array<{ id: string; scriptFrameId: string; sceneNumber: number; x: number; y: number; frameWidth: number; frameHeight: number; content: string }>>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedImageIndices, setSelectedImageIndices] = useState<number[]>([]); // Multiple selection
  const [selectedTextInputId, setSelectedTextInputId] = useState<string | null>(null);
  const [selectedTextInputIds, setSelectedTextInputIds] = useState<string[]>([]); // Multiple text input selection
  const [selectedImageModalId, setSelectedImageModalId] = useState<string | null>(null);
  const [selectedUpscaleModalId, setSelectedUpscaleModalId] = useState<string | null>(null);
  const [selectedUpscaleModalIds, setSelectedUpscaleModalIds] = useState<string[]>([]);
  const [selectedRemoveBgModalId, setSelectedRemoveBgModalId] = useState<string | null>(null);
  const [selectedRemoveBgModalIds, setSelectedRemoveBgModalIds] = useState<string[]>([]);
  const [selectedEraseModalId, setSelectedEraseModalId] = useState<string | null>(null);
  const [selectedEraseModalIds, setSelectedEraseModalIds] = useState<string[]>([]);
  const [selectedReplaceModalId, setSelectedReplaceModalId] = useState<string | null>(null);
  const [selectedReplaceModalIds, setSelectedReplaceModalIds] = useState<string[]>([]);
  const [selectedExpandModalId, setSelectedExpandModalId] = useState<string | null>(null);
  const [selectedExpandModalIds, setSelectedExpandModalIds] = useState<string[]>([]);
  const [selectedVectorizeModalId, setSelectedVectorizeModalId] = useState<string | null>(null);
  const [selectedVectorizeModalIds, setSelectedVectorizeModalIds] = useState<string[]>([]);
  const [selectedStoryboardModalId, setSelectedStoryboardModalId] = useState<string | null>(null);
  const [selectedStoryboardModalIds, setSelectedStoryboardModalIds] = useState<string[]>([]);
  const [selectedImageModalIds, setSelectedImageModalIds] = useState<string[]>([]); // Multiple image modal selection
  const [selectedVideoModalId, setSelectedVideoModalId] = useState<string | null>(null);
  const [selectedVideoModalIds, setSelectedVideoModalIds] = useState<string[]>([]); // Multiple video modal selection
  const [selectedMusicModalId, setSelectedMusicModalId] = useState<string | null>(null);
  const [selectedMusicModalIds, setSelectedMusicModalIds] = useState<string[]>([]); // Multiple music modal selection
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuImageIndex, setContextMenuImageIndex] = useState<number | null>(null);
  const [contextMenuModalId, setContextMenuModalId] = useState<string | null>(null);
  const [contextMenuModalType, setContextMenuModalType] = useState<'image' | 'video' | 'music' | null>(null);
  // Tight selection rect calculated from selected items (canvas coords)
  const [selectionTightRect, setSelectionTightRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  // Track if selection came from drag (marquee selection) - only show icons for drag selections
  const [isDragSelection, setIsDragSelection] = useState(false);
  // Track last rect top-left for drag delta computation
  const selectionDragOriginRef = useRef<{ x: number; y: number } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const sanitizeScriptOutput = (value?: string | null) => {
    if (!value) return '';
    let cleaned = value;
    cleaned = cleaned.replace(/###\s*B[\s\S]*$/i, '').trim();
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
    cleaned = cleaned.replace(/\*\*/g, '');
    cleaned = cleaned.replace(/^#+\s*/gm, '');
    cleaned = cleaned.replace(/^\s*[-*]\s+/gm, '- ');
    cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, '');
    cleaned = cleaned.replace(/\{\s*|\s*\}/g, '');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    return cleaned.trim();
  };

  const ensureScriptFrameForPlugin = (pluginId: string, script: string) => {
    const plugin = storyboardModalStates.find(modal => modal.id === pluginId);
    if (!plugin) return;
    const offset = (plugin.frameWidth || 400) + 60;
    const frameWidth = plugin.frameWidth || 360;
    const frameHeight = 260;
    const frameId = `script-${pluginId}`;
    const frameX = (plugin.x ?? 0) + offset;
    const frameY = plugin.y ?? 0;

    setScriptFrameModalStates(prev => {
      const existing = prev.find(frame => frame.pluginId === pluginId);
      if (existing) {
        if (
          existing.text === script &&
          existing.x === frameX &&
          existing.y === frameY &&
          existing.frameWidth === frameWidth &&
          existing.frameHeight === frameHeight
        ) {
          return prev;
        }

        // Move persistence call outside of updater
        return prev.map(frame =>
          frame.pluginId === pluginId
            ? { ...frame, text: script, frameWidth, frameHeight }
            : frame
        );
      }

      const newFrame = {
        id: frameId,
        pluginId,
        x: frameX,
        y: frameY,
        frameWidth,
        frameHeight,
        text: script,
      };
      return [...prev, newFrame];
    });

    // Handle persistence outside of state updater
    const existingFrame = scriptFrameModalStates.find(frame => frame.pluginId === pluginId);
    if (existingFrame) {
      if (existingFrame.text !== script && onPersistScriptFrameModalMove) {
        Promise.resolve(onPersistScriptFrameModalMove(existingFrame.id, { text: script })).catch(console.error);
      }
    } else {
      const newFrame = {
        id: frameId,
        pluginId,
        x: frameX,
        y: frameY,
        frameWidth,
        frameHeight,
        text: script,
      };
      if (onPersistScriptFrameModalCreate) {
        Promise.resolve(onPersistScriptFrameModalCreate(newFrame)).catch(console.error);
      }
    }

    const existingConnector = (connections ?? []).some(
      connector => connector.from === pluginId && connector.to === frameId
    );
    if (!existingConnector && onPersistConnectorCreate) {
      Promise.resolve(
        onPersistConnectorCreate({
          from: pluginId,
          to: frameId,
          color: '#437eb5',
        })
      ).catch(console.error);
    }
    // Return the frame details so we can use it for chaining
    return {
      id: frameId,
      x: frameX,
      y: frameY,
      frameWidth,
      frameHeight,
      text: script
    };
  };

  const handleTextScriptGenerated = async (textModalId: string, script: string) => {
    if (!textModalId || !script || !script.trim()) return;
    const sanitizedScript = sanitizeScriptOutput(script);
    if (!sanitizedScript) return;
    const storyboardTargets = (connections ?? [])
      .filter(conn => conn.from === textModalId)
      .map(conn => conn.to)
      .filter(Boolean);
    if (!storyboardTargets.length) return;

    const storyboardIds = storyboardTargets.filter(targetId =>
      storyboardModalStates.some(modal => modal.id === targetId)
    );
    if (!storyboardIds.length) return;

    setStoryboardModalStates(prev => {
      let changed = false;
      const updated = prev.map(modal => {
        if (storyboardIds.includes(modal.id)) {
          if ((modal.scriptText || '') !== sanitizedScript) {
            changed = true;
            return { ...modal, scriptText: sanitizedScript };
          }
        }
        return modal;
      });
      return changed ? updated : prev;
    });

    for (const id of storyboardIds) {
      const scriptFrameDetails = ensureScriptFrameForPlugin(id, sanitizedScript);

      if (onPersistStoryboardModalMove) {
        Promise.resolve(onPersistStoryboardModalMove(id, { scriptText: sanitizedScript })).catch(console.error);
      }

      // Automatically generate scenes from the story
      if (scriptFrameDetails) {
        console.log('[Canvas] Automatically triggering scene generation for script frame:', scriptFrameDetails.id);
        // Pass details directly to avoid stale state issues
        handleGenerateScenes(scriptFrameDetails.id, scriptFrameDetails.text, scriptFrameDetails);
      }
    }
  };

  const handleDeleteScriptFrame = (frameId: string) => {
    setSceneFrameModalStates(prev => prev.filter(frame => frame.scriptFrameId !== frameId));
    // Note: onPersistSceneFrameModalDelete typically takes a scene frame ID, not script frame ID.
    // If we want to delete all scenes, we should iterate.
    // However, for now, let's just clear local state.
    // If backend persistence is needed for cascading delete, it should be handled there or by iterating here.
    // Let's iterate over known scene frames for this script frame to delete them properly.
    const relatedScenes = sceneFrameModalStates.filter(f => f.scriptFrameId === frameId);
    relatedScenes.forEach(scene => {
      if (onPersistSceneFrameModalDelete) {
        Promise.resolve(onPersistSceneFrameModalDelete(scene.id)).catch(console.error);
      }
    });

    setScriptFrameModalStates(prev => prev.filter(frame => frame.id !== frameId));
    if (onPersistScriptFrameModalDelete) {
      Promise.resolve(onPersistScriptFrameModalDelete(frameId)).catch(console.error);
    }
    const frame = scriptFrameModalStates.find(f => f.id === frameId);
    if (frame) {
      setStoryboardModalStates(prev =>
        prev.map(modal => (modal.id === frame.pluginId ? { ...modal, scriptText: null } : modal))
      );
      if (onPersistStoryboardModalMove) {
        Promise.resolve(onPersistStoryboardModalMove(frame.pluginId, { scriptText: null })).catch(console.error);
      }
      const relatedConnectors = (connections ?? []).filter(
        conn => conn.to === frameId || conn.from === frameId
      );
      relatedConnectors.forEach(conn => {
        if (onPersistConnectorDelete && conn.id) {
          Promise.resolve(onPersistConnectorDelete(conn.id)).catch(console.error);
        }
      });
    }
  };

  const handleScriptFramePositionChange = (frameId: string, x: number, y: number) => {
    setScriptFrameModalStates(prev =>
      prev.map(frame => (frame.id === frameId ? { ...frame, x, y } : frame))
    );
  };

  const handleScriptFramePositionCommit = (frameId: string, x: number, y: number) => {
    setScriptFrameModalStates(prev =>
      prev.map(frame => (frame.id === frameId ? { ...frame, x, y } : frame))
    );
    if (onPersistScriptFrameModalMove) {
      Promise.resolve(onPersistScriptFrameModalMove(frameId, { x, y })).catch(console.error);
    }
  };



  // Scene frame handlers
  const handleGenerateScenes = async (
    scriptFrameId: string,
    overrideText?: string,
    overrideFrame?: { x: number; y: number; frameWidth: number }
  ) => {
    const scriptFrame = scriptFrameModalStates.find(f => f.id === scriptFrameId);
    const textToUse = overrideText || scriptFrame?.text;
    const frameToUse = overrideFrame || scriptFrame;

    if (!frameToUse || !textToUse) {
      console.warn('[Canvas] No script frame or text found for', scriptFrameId);
      return;
    }

    try {
      // Generate scenes using AI
      const result = await generateScenesFromStory(textToUse);
      const scenes = result.scenes || [];

      if (scenes.length === 0) {
        console.warn('[Canvas] No scenes generated from story');
        return;
      }

      console.log(`[Canvas] Generated ${scenes.length} scenes`);

      // Import scene utilities dynamically for positioning
      const { calculateSceneFramePositions } = await import('@/app/components/Plugins/StoryboardPluginModal/sceneUtils');

      // Calculate positions for scene frames (grid layout to the right of script frame)
      const positions = calculateSceneFramePositions(
        frameToUse.x,
        frameToUse.y,
        frameToUse.frameWidth,
        scenes.length,
        350, // scene frame width
        300  // scene frame height
      );

      // Create scene frames
      const newSceneFrames = scenes.map((scene: any, index: number) => ({
        id: `scene-${scriptFrameId}-${scene.scene_number}-${Date.now()}`,
        scriptFrameId: scriptFrameId,
        sceneNumber: scene.scene_number,
        x: positions[index].x,
        y: positions[index].y,
        frameWidth: 350,
        frameHeight: 300,
        content: scene.content,
      }));

      // Optimistic update
      setSceneFrameModalStates(prev => {
        // Filter out any existing frames with same ID to avoid duplicates (though ID has timestamp)
        const others = prev.filter(p => !newSceneFrames.some(n => n.id === p.id));
        return [...others, ...newSceneFrames];
      });

      // Persist new scene frames
      newSceneFrames.forEach(frame => {
        if (onPersistSceneFrameModalCreate) {
          Promise.resolve(onPersistSceneFrameModalCreate(frame)).catch(console.error);
        }
      });

      // Create connections from script frame to scene frames
      const newConnections = newSceneFrames.map(sceneFrame => ({
        from: scriptFrameId,
        to: sceneFrame.id,
        color: '#437eb5', // Standard connection color
      }));

      // Update connections state and persist
      if (onPersistConnectorCreate) {
        newConnections.forEach(conn => {
          Promise.resolve(onPersistConnectorCreate(conn)).catch(console.error);
        });
      }

      // For each scene frame, also create an image modal and connect the scene -> image
      const newImageModals = newSceneFrames.map(sceneFrame => {
        const imgX = sceneFrame.x + (sceneFrame.frameWidth || 350) + 60;
        const imgY = sceneFrame.y;
        const newId = `image-${Date.now()}-${Math.random()}`;
        return {
          id: newId,
          x: imgX,
          y: imgY,
          generatedImageUrl: null,
          prompt: sceneFrame.content,
          frameWidth: 600,
          frameHeight: 400,
        };
      });

      // Optimistically add image modals to state
      if (newImageModals.length > 0) {
        setImageModalStates(prev => [...prev, ...newImageModals.map(m => ({ id: m.id, x: m.x, y: m.y, generatedImageUrl: m.generatedImageUrl, frameWidth: m.frameWidth, frameHeight: m.frameHeight, prompt: m.prompt }))]);
      }

      // Persist new image modals and create scene->image connectors
      newImageModals.forEach((imgModal, idx) => {
        if (onPersistImageModalCreate) {
          Promise.resolve(onPersistImageModalCreate({ id: imgModal.id, x: imgModal.x, y: imgModal.y, generatedImageUrl: imgModal.generatedImageUrl, frameWidth: imgModal.frameWidth, frameHeight: imgModal.frameHeight, prompt: imgModal.prompt })).catch(console.error);
        }

        const sceneFrame = newSceneFrames[idx];
        if (onPersistConnectorCreate && sceneFrame) {
          Promise.resolve(onPersistConnectorCreate({ from: sceneFrame.id, to: imgModal.id, color: '#43b56e' })).catch(console.error);
        }
      });

      console.log(`[Canvas] Created ${newSceneFrames.length} scene frames`);

    } catch (error) {
      console.error('[Canvas] Error generating scenes:', error);
      alert('Failed to generate scenes. Please try again.');
    }
  };

  const handleDeleteSceneFrame = (frameId: string) => {
    setSceneFrameModalStates(prev => prev.filter(frame => frame.id !== frameId));
    if (onPersistSceneFrameModalDelete) {
      Promise.resolve(onPersistSceneFrameModalDelete(frameId)).catch(console.error);
    }

    // Remove connectors related to this scene frame
    const relatedConnectors = (connections ?? []).filter(
      conn => conn.to === frameId || conn.from === frameId
    );
    relatedConnectors.forEach(conn => {
      if (onPersistConnectorDelete && conn.id) {
        Promise.resolve(onPersistConnectorDelete(conn.id)).catch(console.error);
      }
    });
  };

  const handleSceneFramePositionChange = (frameId: string, x: number, y: number) => {
    setSceneFrameModalStates(prev =>
      prev.map(frame => (frame.id === frameId ? { ...frame, x, y } : frame))
    );
  };

  const handleSceneFramePositionCommit = (frameId: string, x: number, y: number) => {
    setSceneFrameModalStates(prev =>
      prev.map(frame => (frame.id === frameId ? { ...frame, x, y } : frame))
    );
    if (onPersistSceneFrameModalMove) {
      Promise.resolve(onPersistSceneFrameModalMove(frameId, { x, y })).catch(console.error);
    }
  };

  const prevSelectedToolRef = useRef<'cursor' | 'move' | 'text' | 'image' | 'video' | 'music' | 'library' | 'plugin' | undefined>(undefined);
  // Guard against rapid duplicate creations (e.g., accidental double events)
  const lastCreateTimesRef = useRef<{ text?: number; image?: number; video?: number; music?: number }>({});

  // Wrapper for applyStageCursor to use stageRef
  const applyStageCursorWrapper = (style: string, force = false) => {
    applyStageCursor(stageRef.current, style, selectedTool, force);
  };


  // Helper function to clear all selections
  // clearSelectionBoxes: if true, also clears selection boxes (for empty canvas clicks)
  // if false, keeps selection boxes (for component switching)
  const clearAllSelections = (clearSelectionBoxes: boolean = false) => {
    setSelectedImageIndex(null);
    setSelectedImageIndices([]);
    setSelectedTextInputId(null);
    setSelectedTextInputIds([]);
    setSelectedImageModalId(null);
    setSelectedImageModalIds([]);
    setSelectedVideoModalId(null);
    setSelectedVideoModalIds([]);
    setSelectedMusicModalId(null);
    setSelectedMusicModalIds([]);
    setSelectedUpscaleModalId(null);
    setSelectedUpscaleModalIds([]);
    setSelectedRemoveBgModalId(null);
    setSelectedRemoveBgModalIds([]);
    setSelectedEraseModalId(null);
    setSelectedEraseModalIds([]);
    setSelectedReplaceModalId(null);
    setSelectedReplaceModalIds([]);
    setSelectedExpandModalId(null);
    setSelectedExpandModalIds([]);
    setSelectedVectorizeModalId(null);
    setSelectedVectorizeModalIds([]);
    setContextMenuOpen(false);
    setContextMenuImageIndex(null);
    setContextMenuModalId(null);
    setContextMenuModalType(null);
    if (clearSelectionBoxes) {
      setSelectionBox(null);
      setSelectionTightRect(null);
      setIsDragSelection(false);
    }
  };
  // Truly infinite canvas - fixed massive size
  const canvasSize = { width: INFINITE_CANVAS_SIZE, height: INFINITE_CANVAS_SIZE };

  // Wrapper functions for helpers that need component state
  const checkOverlapWrapper = (x: number, y: number, width: number = 600, height: number = 400, padding: number = 100): boolean => {
    return checkOverlap(x, y, width, height, images, textInputStates, imageModalStates, videoModalStates, musicModalStates, padding);
  };

  const findBlankSpaceWrapper = (componentWidth: number = 600, componentHeight: number = 400): { x: number; y: number } => {
    return findBlankSpace(componentWidth, componentHeight, images, textInputStates, imageModalStates, videoModalStates, musicModalStates, viewportSize, position, scale);
  };

  const focusOnComponentWrapper = (canvasX: number, canvasY: number, componentWidth: number = 600, componentHeight: number = 400) => {
    focusOnComponent(canvasX, canvasY, componentWidth, componentHeight, viewportSize, scale, setPosition, updateViewportCenter);
  };

  const findAvailablePositionNearWrapper = (cx: number, cy: number, threshold = 60, maxRadius = 600) => {
    const occupied: Array<{ x: number; y: number }> = [];
    textInputStates.forEach(t => occupied.push({ x: t.x, y: t.y }));
    imageModalStates.forEach(m => occupied.push({ x: m.x, y: m.y }));
    videoModalStates.forEach(m => occupied.push({ x: m.x, y: m.y }));
    musicModalStates.forEach(m => occupied.push({ x: m.x, y: m.y }));
    images.forEach(img => { if (img) occupied.push({ x: img.x || 0, y: img.y || 0 }); });
    return findAvailablePositionNear(cx, cy, occupied, threshold, maxRadius);
  };

  // Automatically create text input at center when text tool is selected
  useEffect(() => {
    if (selectedTool === 'text') {
      const now = Date.now();
      const last = lastCreateTimesRef.current.text || 0;
      // ignore if a text create occurred very recently
      if (now - last < 400) {
        prevSelectedToolRef.current = selectedTool;
        return;
      }
      lastCreateTimesRef.current.text = now;

      const blankPos = findBlankSpaceWrapper(300, 100);
      // If a text input already exists near this spot, skip creating another
      if (existsNearby(textInputStates, blankPos.x, blankPos.y)) {
        prevSelectedToolRef.current = selectedTool;
        return;
      }
      const newId = `text-${Date.now()}-${Math.random()}`;
      const modal = { id: newId, x: blankPos.x, y: blankPos.y, value: '' as string, autoFocusInput: false };
      setTextInputStates(prev => [...prev, modal]);
      if (onPersistTextModalCreate) {
        Promise.resolve(onPersistTextModalCreate(modal)).catch(console.error);
      }
      // Auto-focus on new component
      setTimeout(() => focusOnComponentWrapper(blankPos.x, blankPos.y, 300, 100), 100);
    }
    prevSelectedToolRef.current = selectedTool;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTool, toolClickCounter]);

  // Automatically create image modal at center when image tool is selected
  useEffect(() => {
    if (selectedTool === 'image' && isImageModalOpen) {
      const now = Date.now();
      const last = lastCreateTimesRef.current.image || 0;
      if (now - last < 400) return;
      lastCreateTimesRef.current.image = now;

      const blankPos = findBlankSpaceWrapper(600, 400);
      // If an image modal already exists near this spot, skip creating another
      if (existsNearby(imageModalStates, blankPos.x, blankPos.y)) return;
      const newId = `image-${Date.now()}-${Math.random()}`;
      const modal = { id: newId, x: blankPos.x, y: blankPos.y, generatedImageUrl: null as string | null };
      setImageModalStates(prev => [...prev, modal]);
      if (onPersistImageModalCreate) {
        Promise.resolve(onPersistImageModalCreate(modal)).catch(console.error);
      }
      // Auto-focus on new component
      setTimeout(() => focusOnComponentWrapper(blankPos.x, blankPos.y, 600, 400), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTool, isImageModalOpen, toolClickCounter]);

  // Automatically create video modal at center when video tool is selected
  useEffect(() => {
    if (selectedTool === 'video' && isVideoModalOpen) {
      const now = Date.now();
      const last = lastCreateTimesRef.current.video || 0;
      if (now - last < 400) return;
      lastCreateTimesRef.current.video = now;

      const blankPos = findBlankSpaceWrapper(600, 400);
      if (existsNearby(videoModalStates, blankPos.x, blankPos.y)) return;
      const newId = `video-${Date.now()}-${Math.random()}`;
      setVideoModalStates(prev => [...prev, { id: newId, x: blankPos.x, y: blankPos.y, generatedVideoUrl: null }]);
      if (onPersistVideoModalCreate) {
        Promise.resolve(onPersistVideoModalCreate({ id: newId, x: blankPos.x, y: blankPos.y, generatedVideoUrl: null })).catch(console.error);
      }
      // Auto-focus on new component
      setTimeout(() => focusOnComponentWrapper(blankPos.x, blankPos.y, 600, 400), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTool, isVideoModalOpen, toolClickCounter]);

  // Automatically create music modal at center when music tool is selected
  useEffect(() => {
    if (selectedTool === 'music' && isMusicModalOpen) {
      const now = Date.now();
      const last = lastCreateTimesRef.current.music || 0;
      if (now - last < 400) return;
      lastCreateTimesRef.current.music = now;

      const blankPos = findBlankSpaceWrapper(600, 300);
      if (existsNearby(musicModalStates, blankPos.x, blankPos.y)) return;
      const newId = `music-${Date.now()}-${Math.random()}`;
      setMusicModalStates(prev => [...prev, { id: newId, x: blankPos.x, y: blankPos.y, generatedMusicUrl: null }]);
      if (onPersistMusicModalCreate) {
        Promise.resolve(onPersistMusicModalCreate({ id: newId, x: blankPos.x, y: blankPos.y, generatedMusicUrl: null })).catch(console.error);
      }
      // Auto-focus on new component
      setTimeout(() => focusOnComponentWrapper(blankPos.x, blankPos.y, 600, 300), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTool, isMusicModalOpen, toolClickCounter]);

  // Sync generatedImageUrl prop to the most recently created image modal
  useEffect(() => {
    if (generatedImageUrl && imageModalStates.length > 0) {
      // Update the last image modal with the generated URL
      const lastIndex = imageModalStates.length - 1;
      const lastId = imageModalStates[lastIndex]?.id;
      setImageModalStates(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            generatedImageUrl,
          };
        }
        return updated;
      });
      if (lastId && onPersistImageModalMove) {
        Promise.resolve(onPersistImageModalMove(lastId, { generatedImageUrl })).catch(console.error);
      }
    }
  }, [generatedImageUrl, imageModalStates.length]);

  // Load persisted image modals from localStorage on mount (scoped by projectId)
  useEffect(() => {
    // If externalImageModals is provided (even if empty), sync to it immediately
    if (externalImageModals !== undefined) {
      console.log('[Canvas] Syncing imageModalStates with externalImageModals', externalImageModals.length);
      setImageModalStates(externalImageModals);
      return;
    }
    // Treat missing projectId as a new project: do not load global/local storage
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:imageModals`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null }>;
        if (Array.isArray(parsed)) {
          setImageModalStates(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted image modals');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, JSON.stringify(externalImageModals || [])]);

  // Persist image modals to localStorage whenever they change
  useEffect(() => {
    // Only persist when tied to a specific projectId
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:imageModals`;
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(imageModalStates));
      }
    } catch (e) {
      console.warn('Failed to persist image modals');
    }
  }, [imageModalStates, projectId]);

  // Hydrate video modals from external or localStorage
  useEffect(() => {
    // If externalVideoModals is provided (even if empty), sync to it immediately
    if (externalVideoModals !== undefined) {
      console.log('[Canvas] Syncing videoModalStates with externalVideoModals', externalVideoModals.length);
      setVideoModalStates(externalVideoModals);
      return;
    }
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:videoModals`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null }>;
        if (Array.isArray(parsed)) {
          setVideoModalStates(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted video modals');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, JSON.stringify(externalVideoModals || [])]);

  // Sync external text modals from parent (for hydration/realtime)
  useEffect(() => {
    // Always hydrate from external (backend) first, even if empty
    if (externalTextModals !== undefined) {
      setTextInputStates(externalTextModals as any);
      return;
    }
    // Treat missing projectId as a new project: do not load global/local storage
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:textModals`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ id: string; x: number; y: number; value?: string; autoFocusInput?: boolean }>;
        if (Array.isArray(parsed)) {
          setTextInputStates(parsed as any);
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted text modals');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, JSON.stringify(externalTextModals || [])]);

  // Persist video modals
  useEffect(() => {
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:videoModals`;
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(videoModalStates));
      }
    } catch (e) {
      console.warn('Failed to persist video modals');
    }
  }, [videoModalStates, projectId]);

  // Hydrate music modals from external or localStorage
  useEffect(() => {
    // If externalMusicModals is provided (even if empty), sync to it immediately
    if (externalMusicModals !== undefined) {
      console.log('[Canvas] Syncing musicModalStates with externalMusicModals', externalMusicModals.length);
      setMusicModalStates(externalMusicModals);
      return;
    }
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:musicModals`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null }>;
        if (Array.isArray(parsed)) {
          setMusicModalStates(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted music modals');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, JSON.stringify(externalMusicModals || [])]);

  // Hydrate upscale modals from external or localStorage
  useEffect(() => {
    // If externalUpscaleModals is provided (even if empty), sync to it immediately
    if (externalUpscaleModals !== undefined) {
      console.log('[Canvas] Syncing upscaleModalStates with externalUpscaleModals', externalUpscaleModals.length);
      setUpscaleModalStates(externalUpscaleModals);
      return;
    }
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:upscaleModals`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ id: string; x: number; y: number; upscaledImageUrl?: string | null; sourceImageUrl?: string | null; localUpscaledImageUrl?: string | null; model?: string; scale?: number }>;
        if (Array.isArray(parsed)) {
          setUpscaleModalStates(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted upscale modals');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, JSON.stringify(externalUpscaleModals || [])]);

  // Hydrate vectorize modals from external or localStorage
  useEffect(() => {
    // If externalVectorizeModals is provided (even if empty), sync to it immediately
    if (externalVectorizeModals !== undefined) {
      console.log('[Canvas] Syncing vectorizeModalStates with externalVectorizeModals', externalVectorizeModals.length);
      setVectorizeModalStates(externalVectorizeModals);
      return;
    }
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:vectorizeModals`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ id: string; x: number; y: number; vectorizedImageUrl?: string | null; sourceImageUrl?: string | null; localVectorizedImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isVectorizing?: boolean }>;
        if (Array.isArray(parsed)) {
          setVectorizeModalStates(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted vectorize modals');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, JSON.stringify(externalVectorizeModals || [])]);

  // Hydrate storyboard modals from external or localStorage
  useEffect(() => {
    // If externalStoryboardModals is provided (even if empty), sync to it immediately
    if (externalStoryboardModals !== undefined) {
      console.log('[Canvas] Syncing storyboardModalStates with externalStoryboardModals', externalStoryboardModals.length);
      setStoryboardModalStates(externalStoryboardModals);
      return;
    }
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:storyboardModals`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number; scriptText?: string | null }>;
        if (Array.isArray(parsed)) {
          setStoryboardModalStates(parsed);
        }
      }
    } catch (e) {
      console.warn('[Canvas] Failed to load storyboard modals from localStorage', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, JSON.stringify(externalStoryboardModals || [])]);

  // Also sync externalStoryboardModals changes to internal state (for real-time updates)
  useEffect(() => {
    // Handle empty array - clear state immediately
    if (externalStoryboardModals !== undefined && externalStoryboardModals.length === 0) {
      console.log('[Canvas] Clearing storyboardModalStates (external is empty)');
      setStoryboardModalStates([]);
      return;
    }
    if (externalStoryboardModals && externalStoryboardModals.length > 0) {
      setStoryboardModalStates(prev => {
        const externalIds = new Set(externalStoryboardModals.map(m => m.id));
        const prevIds = new Set(prev.map(m => m.id));
        const idsMatch = externalIds.size === prevIds.size && [...externalIds].every(id => prevIds.has(id));

        if (idsMatch) {
          const allMatch = externalStoryboardModals.every(external => {
            const prevItem = prev.find(p => p.id === external.id);
            if (!prevItem) return false;
            const coordsMatch = prevItem.x === external.x && prevItem.y === external.y;
            const sizeMatch = (prevItem.frameWidth || 400) === (external.frameWidth || 400) &&
              (prevItem.frameHeight || 500) === (external.frameHeight || 500);
            const scriptMatch = (prevItem.scriptText || '') === (external.scriptText || '');
            return coordsMatch && sizeMatch && scriptMatch;
          });
          if (allMatch) {
            return prev;
          }
        }

        return externalStoryboardModals;
      });
    }
  }, [JSON.stringify(externalStoryboardModals || [])]);

  // Hydrate script frame modals from external or localStorage
  useEffect(() => {
    if (externalScriptFrameModals !== undefined) {
      setScriptFrameModalStates(externalScriptFrameModals);
      return;
    }
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:scriptFrameModals`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ id: string; pluginId: string; x: number; y: number; frameWidth: number; frameHeight: number; text: string }>;
        if (Array.isArray(parsed)) {
          setScriptFrameModalStates(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted script frame modals');
    }
  }, [projectId, JSON.stringify(externalScriptFrameModals || [])]);

  // Hydrate scene frame modals from external or localStorage
  useEffect(() => {
    console.log('[Canvas] externalSceneFrameModals updated:', externalSceneFrameModals);
    if (externalSceneFrameModals !== undefined) {
      setSceneFrameModalStates(prev => {
        // Merge external with local, preferring local updates for existing frames
        const merged = externalSceneFrameModals.map(ext => {
          const local = prev.find(p => p.id === ext.id);
          return local ? { ...ext, ...local } : ext;
        });
        // Add any local-only frames (e.g., newly created but not yet persisted)
        const localOnly = prev.filter(p => !externalSceneFrameModals.some(e => e.id === p.id));
        return [...merged, ...localOnly];
      });
      return;
    }
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:sceneFrameModals`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ id: string; scriptFrameId: string; sceneNumber: number; x: number; y: number; frameWidth: number; frameHeight: number; content: string }>;
        if (Array.isArray(parsed)) {
          console.log('[Canvas] Hydrating scene frames from localStorage:', parsed);
          setSceneFrameModalStates(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted scene frame modals');
    }
  }, [projectId, JSON.stringify(externalSceneFrameModals || [])]);

  useEffect(() => {
    setScriptFrameModalStates(prev => {
      const mapped: Array<{ id: string; pluginId: string; x: number; y: number; frameWidth: number; frameHeight: number; text: string }> = [];
      storyboardModalStates.forEach(modal => {
        const script = sanitizeScriptOutput(modal.scriptText);
        if (!script) return;
        const frameId = `script-${modal.id}`;
        const baseX = (modal.x ?? 0) + (modal.frameWidth || 400) + 60;
        const baseY = modal.y ?? 0;
        const existing = prev.find(frame => frame.pluginId === modal.id);
        if (existing) {
          mapped.push({
            ...existing,
            text: script,
            // Keep existing position to allow dragging
            x: existing.x,
            y: existing.y,
            frameWidth: modal.frameWidth || existing.frameWidth,
            frameHeight: existing.frameHeight,
          });
        } else {
          // Only use base position for new frames
          mapped.push({
            id: frameId,
            pluginId: modal.id,
            x: baseX,
            y: baseY,
            frameWidth: modal.frameWidth || 360,
            frameHeight: 260,
            text: script,
          });
        }
      });
      // Also keep any script frames that might not be in the current storyboard list (though they should be deleted if storyboard is deleted)
      // Actually, if storyboard is deleted, we probably want to delete the script frame too.
      // The current logic only includes frames for existing storyboards.
      return mapped;
    });
  }, [storyboardModalStates]);

  useEffect(() => {
    if (!onPersistConnectorCreate) return;
    scriptFrameModalStates.forEach(frame => {
      const exists = (connections ?? []).some(conn => conn.from === frame.pluginId && conn.to === frame.id);
      if (!exists) {
        Promise.resolve(
          onPersistConnectorCreate({
            from: frame.pluginId,
            to: frame.id,
            color: '#437eb5',
          })
        ).catch(console.error);
      }
    });
  }, [scriptFrameModalStates, connections, onPersistConnectorCreate]);

  // Sync external remove bg modals from parent (for hydration/realtime)
  useEffect(() => {
    // Always hydrate from external (backend) first, even if empty
    if (externalRemoveBgModals !== undefined) {
      setRemoveBgModalStates(externalRemoveBgModals);
      return;
    }
    // Treat missing projectId as a new project: do not load global/local storage
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:removeBgModals`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ id: string; x: number; y: number; removedBgImageUrl?: string | null; sourceImageUrl?: string | null; localRemovedBgImageUrl?: string | null }>;
        if (Array.isArray(parsed)) {
          setRemoveBgModalStates(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted remove bg modals');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, JSON.stringify(externalRemoveBgModals || [])]);

  // Also sync externalRemoveBgModals changes to internal state (for real-time updates)
  // Only sync if externalRemoveBgModals is actually different to avoid overwriting local drag updates
  useEffect(() => {
    // Handle empty array - clear state immediately
    if (externalRemoveBgModals !== undefined && externalRemoveBgModals.length === 0) {
      console.log('[Canvas] Clearing removeBgModalStates (external is empty)');
      setRemoveBgModalStates([]);
      return;
    }
    if (externalRemoveBgModals && externalRemoveBgModals.length > 0) {
      setRemoveBgModalStates(prev => {
        // Only update if the external state is actually different
        const externalIds = new Set(externalRemoveBgModals.map(m => m.id));
        const prevIds = new Set(prev.map(m => m.id));
        const idsMatch = externalIds.size === prevIds.size && [...externalIds].every(id => prevIds.has(id));

        if (idsMatch) {
          // Merge: keep local position updates during drag, but update other properties from external
          const merged = prev.map(prevModal => {
            const externalModal = externalRemoveBgModals.find(m => m.id === prevModal.id);
            if (externalModal) {
              // During drag, keep local x, y if they're different (user is dragging)
              // Otherwise, use external x, y (position was committed)
              return {
                ...prevModal,
                ...externalModal,
                // Only update position if it's significantly different (more than 1px) to avoid overwriting during drag
                x: Math.abs(prevModal.x - externalModal.x) < 1 ? externalModal.x : prevModal.x,
                y: Math.abs(prevModal.y - externalModal.y) < 1 ? externalModal.y : prevModal.y,
              };
            }
            return prevModal;
          });
          return merged;
        } else {
          // IDs don't match, use external state
          return externalRemoveBgModals;
        }
      });
    }
  }, [JSON.stringify(externalRemoveBgModals || [])]);

  // Sync external erase modals from parent (for hydration/realtime)
  useEffect(() => {
    // Always hydrate from external (backend) first, even if empty
    if (externalEraseModals !== undefined) {
      setEraseModalStates(externalEraseModals);
      return;
    }
    // Treat missing projectId as a new project: do not load global/local storage
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:eraseModals`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ id: string; x: number; y: number; erasedImageUrl?: string | null; sourceImageUrl?: string | null; localErasedImageUrl?: string | null }>;
        if (Array.isArray(parsed)) {
          setEraseModalStates(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted erase modals');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, JSON.stringify(externalEraseModals || [])]);

  // Also sync externalEraseModals changes to internal state (for real-time updates)
  // Only sync if externalEraseModals is actually different to avoid overwriting local drag updates
  useEffect(() => {
    // Handle empty array - clear state immediately
    if (externalEraseModals !== undefined && externalEraseModals.length === 0) {
      console.log('[Canvas] Clearing eraseModalStates (external is empty)');
      setEraseModalStates([]);
      return;
    }
    if (externalEraseModals && externalEraseModals.length > 0) {
      setEraseModalStates(prev => {
        // Only update if the external state is actually different
        const externalIds = new Set(externalEraseModals.map(m => m.id));
        const prevIds = new Set(prev.map(m => m.id));
        const idsMatch = externalIds.size === prevIds.size && [...externalIds].every(id => prevIds.has(id));

        if (idsMatch) {
          // Merge: keep local position updates during drag, but update other properties from external
          const merged = prev.map(prevModal => {
            const externalModal = externalEraseModals.find(m => m.id === prevModal.id);
            if (externalModal) {
              // During drag, keep local x, y if they're different (user is dragging)
              // Otherwise, use external x, y (position was committed)
              return {
                ...prevModal,
                ...externalModal,
                // Only update position if it's significantly different (more than 1px) to avoid overwriting during drag
                x: Math.abs(prevModal.x - externalModal.x) < 1 ? externalModal.x : prevModal.x,
                y: Math.abs(prevModal.y - externalModal.y) < 1 ? externalModal.y : prevModal.y,
              };
            }
            return prevModal;
          });
          return merged;
        } else {
          // IDs don't match, use external state
          return externalEraseModals;
        }
      });
    }
  }, [JSON.stringify(externalEraseModals || [])]);

  // Sync external replace modals from parent (for hydration/realtime)
  useEffect(() => {
    // Always hydrate from external (backend) first, even if empty
    if (externalReplaceModals !== undefined) {
      setReplaceModalStates(externalReplaceModals);
      return;
    }
    // Treat missing projectId as a new project: do not load global/local storage
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:replaceModals`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ id: string; x: number; y: number; replacedImageUrl?: string | null; sourceImageUrl?: string | null; localReplacedImageUrl?: string | null }>;
        if (Array.isArray(parsed)) {
          setReplaceModalStates(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted replace modals');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, JSON.stringify(externalReplaceModals || [])]);

  // Also sync externalReplaceModals changes to internal state (for real-time updates)
  // Only sync if externalReplaceModals is actually different to avoid overwriting local drag updates
  useEffect(() => {
    // Handle empty array - clear state immediately
    if (externalReplaceModals !== undefined && externalReplaceModals.length === 0) {
      console.log('[Canvas] Clearing replaceModalStates (external is empty)');
      setReplaceModalStates([]);
      return;
    }
    if (externalReplaceModals && externalReplaceModals.length > 0) {
      setReplaceModalStates(prev => {
        // Only update if the external state is actually different
        const externalIds = new Set(externalReplaceModals.map(m => m.id));
        const prevIds = new Set(prev.map(m => m.id));
        const idsMatch = externalIds.size === prevIds.size && [...externalIds].every(id => prevIds.has(id));

        if (idsMatch) {
          // Merge: keep local position updates during drag, but update other properties from external
          const merged = prev.map(prevModal => {
            const externalModal = externalReplaceModals.find(m => m.id === prevModal.id);
            if (externalModal) {
              // During drag, keep local x, y if they're different (user is dragging)
              // Otherwise, use external x, y (position was committed)
              return {
                ...prevModal,
                ...externalModal,
                // Only update position if it's significantly different (more than 1px) to avoid overwriting during drag
                x: Math.abs(prevModal.x - externalModal.x) < 1 ? externalModal.x : prevModal.x,
                y: Math.abs(prevModal.y - externalModal.y) < 1 ? externalModal.y : prevModal.y,
              };
            }
            return prevModal;
          });
          return merged;
        } else {
          // IDs don't match, use external state
          return externalReplaceModals;
        }
      });
    }
  }, [JSON.stringify(externalReplaceModals || [])]);

  // Sync external expand modals from parent (for hydration/realtime)
  useEffect(() => {
    if (externalExpandModals !== undefined) {
      setExpandModalStates(externalExpandModals);
      return;
    }
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:expandModals`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ id: string; x: number; y: number; expandedImageUrl?: string | null; sourceImageUrl?: string | null; localExpandedImageUrl?: string | null }>;
        if (Array.isArray(parsed)) {
          setExpandModalStates(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted expand modals');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, JSON.stringify(externalExpandModals || [])]);

  useEffect(() => {
    if (externalExpandModals !== undefined && externalExpandModals.length === 0) {
      console.log('[Canvas] Clearing expandModalStates (external is empty)');
      setExpandModalStates([]);
      return;
    }
    if (externalExpandModals && externalExpandModals.length > 0) {
      setExpandModalStates(prev => {
        const externalIds = new Set(externalExpandModals.map(m => m.id));
        const prevIds = new Set(prev.map(m => m.id));
        const idsMatch = externalIds.size === prevIds.size && [...externalIds].every(id => prevIds.has(id));
        if (idsMatch) {
          return prev.map(prevModal => {
            const externalModal = externalExpandModals.find(m => m.id === prevModal.id);
            if (externalModal) {
              return {
                ...prevModal,
                ...externalModal,
                x: Math.abs(prevModal.x - externalModal.x) < 1 ? externalModal.x : prevModal.x,
                y: Math.abs(prevModal.y - externalModal.y) < 1 ? externalModal.y : prevModal.y,
              };
            }
            return prevModal;
          });
        }
        return externalExpandModals;
      });
    }
  }, [JSON.stringify(externalExpandModals || [])]);

  // Also sync externalUpscaleModals changes to internal state (for real-time updates)
  // Only sync if externalUpscaleModals is actually different to avoid overwriting local drag updates
  useEffect(() => {
    // Handle empty array - clear state immediately
    if (externalUpscaleModals !== undefined && externalUpscaleModals.length === 0) {
      console.log('[Canvas] Clearing upscaleModalStates (external is empty)');
      setUpscaleModalStates([]);
      return;
    }
    if (externalUpscaleModals && externalUpscaleModals.length > 0) {
      setUpscaleModalStates(prev => {
        // Only update if the external state is actually different
        const externalIds = new Set(externalUpscaleModals.map(m => m.id));
        const prevIds = new Set(prev.map(m => m.id));
        const idsMatch = externalIds.size === prevIds.size && [...externalIds].every(id => prevIds.has(id));

        if (idsMatch) {
          // Merge: keep local position updates during drag, but update other properties from external
          const merged = prev.map(prevModal => {
            const externalModal = externalUpscaleModals.find(m => m.id === prevModal.id);
            if (externalModal) {
              // During drag, keep local x, y if they're different (user is dragging)
              // Otherwise, use external x, y (position was committed)
              return {
                ...prevModal,
                ...externalModal,
                // Only update position if it's significantly different (more than 1px) to avoid overwriting during drag
                x: Math.abs(prevModal.x - externalModal.x) < 1 ? externalModal.x : prevModal.x,
                y: Math.abs(prevModal.y - externalModal.y) < 1 ? externalModal.y : prevModal.y,
              };
            }
            return prevModal;
          });
          return merged;
        } else {
          // IDs don't match, use external state
          return externalUpscaleModals;
        }
      });
    }
  }, [JSON.stringify(externalUpscaleModals || [])]);

  // Also sync externalVectorizeModals changes to internal state (for real-time updates)
  // Only sync if externalVectorizeModals is actually different to avoid overwriting local drag updates
  useEffect(() => {
    // Handle empty array - clear state immediately
    if (externalVectorizeModals !== undefined && externalVectorizeModals.length === 0) {
      console.log('[Canvas] Clearing vectorizeModalStates (external is empty)');
      setVectorizeModalStates([]);
      return;
    }
    if (externalVectorizeModals && externalVectorizeModals.length > 0) {
      setVectorizeModalStates(prev => {
        // Only update if the external state is actually different
        const externalIds = new Set(externalVectorizeModals.map(m => m.id));
        const prevIds = new Set(prev.map(m => m.id));
        const idsMatch = externalIds.size === prevIds.size && [...externalIds].every(id => prevIds.has(id));

        if (idsMatch) {
          // Merge: keep local position updates during drag, but update other properties from external
          const merged = prev.map(prevModal => {
            const externalModal = externalVectorizeModals.find(m => m.id === prevModal.id);
            if (externalModal) {
              // During drag, keep local x, y if they're different (user is dragging)
              // Otherwise, use external x, y (position was committed)
              return {
                ...prevModal,
                ...externalModal,
                // Only update position if it's significantly different (more than 1px) to avoid overwriting during drag
                x: Math.abs(prevModal.x - externalModal.x) < 1 ? externalModal.x : prevModal.x,
                y: Math.abs(prevModal.y - externalModal.y) < 1 ? externalModal.y : prevModal.y,
              };
            }
            return prevModal;
          });
          return merged;
        } else {
          // IDs don't match, use external state
          return externalVectorizeModals;
        }
      });
    }
  }, [JSON.stringify(externalVectorizeModals || [])]);

  // Persist upscale modals
  useEffect(() => {
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:upscaleModals`;
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(upscaleModalStates));
      }
    } catch (e) {
      console.warn('Failed to persist upscale modals');
    }
  }, [upscaleModalStates, projectId]);

  // Persist music modals
  useEffect(() => {
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:musicModals`;
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(musicModalStates));
      }
    } catch (e) {
      console.warn('Failed to persist music modals');
    }
  }, [musicModalStates, projectId]);

  // Persist remove bg modals
  useEffect(() => {
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:removeBgModals`;
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(removeBgModalStates));
      }
    } catch (e) {
      console.warn('Failed to persist remove bg modals');
    }
  }, [removeBgModalStates, projectId]);

  // Persist vectorize modals
  useEffect(() => {
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:vectorizeModals`;
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(vectorizeModalStates));
      }
    } catch (e) {
      console.warn('Failed to persist vectorize modals');
    }
  }, [vectorizeModalStates, projectId]);

  // Persist storyboard modals
  useEffect(() => {
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:storyboardModals`;
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(storyboardModalStates));
      }
    } catch (e) {
      console.warn('Failed to persist storyboard modals');
    }
  }, [storyboardModalStates, projectId]);

  // Persist text input modals to localStorage whenever they change
  useEffect(() => {
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:textModals`;
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(textInputStates));
      }
    } catch (e) {
      console.warn('Failed to persist text modals');
    }
  }, [textInputStates, projectId]);

  // Sync generatedVideoUrl prop to the most recently created video modal
  useEffect(() => {
    if (generatedVideoUrl && videoModalStates.length > 0) {
      // Update the last video modal with the generated URL
      const lastIndex = videoModalStates.length - 1;
      const lastId = videoModalStates[lastIndex]?.id;
      setVideoModalStates(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            generatedVideoUrl,
          };
        }
        return updated;
      });
      if (lastId && onPersistVideoModalMove) {
        Promise.resolve(onPersistVideoModalMove(lastId, { generatedVideoUrl })).catch(console.error);
      }
    }
  }, [generatedVideoUrl, videoModalStates.length]);

  // Sync generatedMusicUrl prop to the most recently created music modal
  useEffect(() => {
    if (generatedMusicUrl && musicModalStates.length > 0) {
      // Update the last music modal with the generated URL
      const lastIndex = musicModalStates.length - 1;
      const lastId = musicModalStates[lastIndex]?.id;
      setMusicModalStates(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            generatedMusicUrl,
          };
        }
        return updated;
      });
      if (lastId && onPersistMusicModalMove) {
        Promise.resolve(onPersistMusicModalMove(lastId, { generatedMusicUrl })).catch(console.error);
      }
    }
  }, [generatedMusicUrl, musicModalStates.length]);

  // Update viewport size on window resize and center initial view
  useEffect(() => {
    const updateViewport = () => {
      if (containerRef.current) {
        const newSize = {
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        };
        setViewportSize(newSize);

        // Center the view on the canvas initially (only once)
        if (!initializedRef.current) {
          initializedRef.current = true;
          const initialPos = {
            x: (newSize.width - canvasSize.width) / 2,
            y: (newSize.height - canvasSize.height) / 2,
          };
          setPosition(initialPos);
          // Update viewport center after initial positioning
          setTimeout(() => updateViewportCenter(initialPos, scale), 0);
        }
      }
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Create canvas pattern - updates based on theme
  useEffect(() => {
    const createPattern = () => {
      const isDark = document.documentElement.classList.contains('dark');
      const canvas = document.createElement('canvas');
      canvas.width = DOT_SPACING;
      canvas.height = DOT_SPACING;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        if (isDark) {
          // Dark theme: Black background with white dots
          ctx.fillStyle = '#121212';
          ctx.fillRect(0, 0, DOT_SPACING, DOT_SPACING);
          ctx.fillStyle = `rgba(255, 255, 255, ${DOT_OPACITY})`;
        } else {
          // Light theme: White background with black dots
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, DOT_SPACING, DOT_SPACING);
          ctx.fillStyle = `rgba(0, 0, 0, ${DOT_OPACITY})`;
        }

        ctx.beginPath();
        ctx.arc(DOT_SPACING / 2, DOT_SPACING / 2, DOT_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      const img = new Image();
      img.onload = () => {
        setPatternImage(img);
      };
      img.src = canvas.toDataURL();
    };

    createPattern();

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      createPattern();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Enable WebGL optimization
    try {
      Konva.pixelRatio = window.devicePixelRatio || 1;
    } catch (e) {
      console.warn('WebGL optimization not available');
    }

    return () => observer.disconnect();
  }, []);

  // Handle wheel zoom
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      // Detect macOS two-finger trackpad scroll for panning
      const isMac = typeof navigator !== 'undefined' && (/Mac|iPad|iPhone|Macintosh/.test(navigator.platform || '') || /Macintosh/.test(navigator.userAgent || ''));
      const isModifier = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey;
      const absDeltaX = Math.abs(e.deltaX || 0);
      const absDeltaY = Math.abs(e.deltaY || 0);

      // If on Mac, no modifier keys, and we have horizontal/vertical deltas from touchpad, treat as pan
      if (isMac && !isModifier && (absDeltaX > 0 || absDeltaY > 0) && Math.max(absDeltaX, absDeltaY) < 400) {
        // Adjust position by wheel deltas (invert sign if needed based on UX)
        setPosition(prev => {
          // Invert deltas so two-finger drag direction matches canvas movement
          // (drag up → canvas moves up, drag left → canvas moves left)
          const newPos = { x: prev.x - e.deltaX, y: prev.y - e.deltaY };
          setTimeout(() => updateViewportCenter(newPos, scale), 0);
          return newPos;
        });
        return;
      }

      // Otherwise, treat as zoom (mouse wheel)
      const oldScale = scale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - position.x) / oldScale,
        y: (pointer.y - position.y) / oldScale,
      };

      const direction = e.deltaY > 0 ? -1 : 1;
      const scaleBy = 1.1;
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      const clampedScale = Math.max(0.1, Math.min(5, newScale));

      setScale(clampedScale);

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };

      setPosition(newPos);
      // Update viewport center after zoom
      setTimeout(() => updateViewportCenter(newPos, clampedScale), 0);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [scale, position]);

  // Track if space key is pressed for panning
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingFromElement, setIsDraggingFromElement] = useState(false);
  // Selection box state (marquee)
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStartPoint, setSelectionStartPoint] = useState<{ x: number; y: number } | null>(null);
  // When user presses mouse we defer creating the visible selection box until
  // the pointer actually moves beyond a small threshold. This prevents a
  // single click from immediately creating a selection rectangle.
  const [pendingSelectionStartScreen, setPendingSelectionStartScreen] = useState<{ x: number; y: number } | null>(null);
  const [pendingSelectionStartCanvas, setPendingSelectionStartCanvas] = useState<{ x: number; y: number } | null>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const selectedNodesRef = useRef<Konva.Node[]>([]);
  const rafRef = useRef<number | null>(null);
  const [transformerUpdateKey, setTransformerUpdateKey] = useState(0);
  // Track real-time position of selected image during drag
  const [selectedImageRealTimePosition, setSelectedImageRealTimePosition] = useState<{ x: number; y: number } | null>(null);

  // Listen for space key for panning, Shift key for panning, and Delete/Backspace for deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
        applyStageCursorWrapper('grab', true);
      }

      if (e.shiftKey) {
        setIsShiftPressed(true);
        // Force crosshair while Shift is pressed
        applyStageCursorWrapper('crosshair', true);
      }

      // Quick-create shortcuts (keyboard): t = text, i = image, v = video, m = music
      // Only trigger when keyboard focus is not inside an input/textarea/select
      try {
        const target = e.target as Element | null;
        const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
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
        }
      } catch (err) {
        // ignore any errors from DOM target checks
      }

      // Handle Delete/Backspace key for deletion (works on both Windows and Mac)
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.repeat) {
        // Prevent default browser behavior (like going back in history)
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          // Don't delete if user is typing in an input field
          return;
        }

        // Prevent deletion if editing a group name
        if (document.querySelector('input[data-editing-group="true"]') !== null) {
          return;
        }

        e.preventDefault();

        // Check if there's a selected region (multiple components)
        const hasMultipleSelections = selectedImageIndices.length > 0 ||
          selectedTextInputIds.length > 0 ||
          selectedImageModalIds.length > 0 ||
          selectedVideoModalIds.length > 0 ||
          selectedMusicModalIds.length > 0 ||
          (selectedUpscaleModalIds?.length ?? 0) > 0 ||
          (selectedRemoveBgModalIds?.length ?? 0) > 0 ||
          (selectedEraseModalIds?.length ?? 0) > 0 ||
          (selectedReplaceModalIds?.length ?? 0) > 0 ||
          (selectedVectorizeModalIds?.length ?? 0) > 0 ||
          selectedExpandModalIds.length > 0;

        if (hasMultipleSelections) {
          // Delete all selected components in the region


          // Delete all selected images
          if (selectedImageIndices.length > 0 && onImageDelete) {
            // Delete in reverse order to maintain correct indices
            const sortedIndices = [...selectedImageIndices].sort((a, b) => b - a);
            sortedIndices.forEach(index => {
              onImageDelete(index);
            });
          }

          // Delete all selected text inputs
          if (selectedTextInputIds.length > 0) {
            // Call persist delete for each text modal and remove locally
            selectedTextInputIds.forEach(id => {
              if (onPersistTextModalDelete) {
                Promise.resolve(onPersistTextModalDelete(id)).catch(console.error);
              }
            });
            setTextInputStates(prev => prev.filter(t => !selectedTextInputIds.includes(t.id)));
          }

          // Delete all selected image modals
          if (selectedImageModalIds.length > 0) {
            selectedImageModalIds.forEach(id => {
              if (onPersistImageModalDelete) {
                Promise.resolve(onPersistImageModalDelete(id)).catch(console.error);
              }
            });
            setImageModalStates(prev => prev.filter(m => !selectedImageModalIds.includes(m.id)));
          }

          // Delete all selected video modals
          if (selectedVideoModalIds.length > 0) {
            selectedVideoModalIds.forEach(id => {
              if (onPersistVideoModalDelete) {
                Promise.resolve(onPersistVideoModalDelete(id)).catch(console.error);
              }
            });
            setVideoModalStates(prev => prev.filter(m => !selectedVideoModalIds.includes(m.id)));
          }

          // Delete all selected music modals
          if (selectedMusicModalIds.length > 0) {
            selectedMusicModalIds.forEach(id => {
              if (onPersistMusicModalDelete) {
                Promise.resolve(onPersistMusicModalDelete(id)).catch(console.error);
              }
            });
            setMusicModalStates(prev => prev.filter(m => !selectedMusicModalIds.includes(m.id)));
          }

          // Delete all selected erase modals
          if (selectedEraseModalIds.length > 0) {
            selectedEraseModalIds.forEach(id => {
              if (onPersistEraseModalDelete) {
                Promise.resolve(onPersistEraseModalDelete(id)).catch(console.error);
              }
            });
            setEraseModalStates(prev => prev.filter(m => !selectedEraseModalIds.includes(m.id)));
          }

          // Delete all selected replace modals
          if (selectedReplaceModalIds.length > 0) {
            selectedReplaceModalIds.forEach(id => {
              if (onPersistReplaceModalDelete) {
                Promise.resolve(onPersistReplaceModalDelete(id)).catch(console.error);
              }
            });
            setReplaceModalStates(prev => prev.filter(m => !selectedReplaceModalIds.includes(m.id)));
          }

          if (selectedExpandModalIds.length > 0) {
            selectedExpandModalIds.forEach(id => {
              if (onPersistExpandModalDelete) {
                Promise.resolve(onPersistExpandModalDelete(id)).catch(console.error);
              }
            });
            setExpandModalStates(prev => prev.filter(m => !selectedExpandModalIds.includes(m.id)));
          }

          // Clear all selections
          setSelectedImageIndices([]);
          setSelectedImageIndex(null);
          setSelectedTextInputIds([]);
          setSelectedTextInputId(null);
          setSelectedImageModalIds([]);
          setSelectedImageModalId(null);
          setSelectedVideoModalIds([]);
          setSelectedVideoModalId(null);
          setSelectedMusicModalIds([]);
          setSelectedMusicModalId(null);
          setSelectedEraseModalIds([]);
          setSelectedEraseModalId(null);
          setSelectedReplaceModalIds([]);
          setSelectedReplaceModalId(null);
          setSelectedExpandModalIds([]);
          setSelectedExpandModalId(null);
        } else {
          // Single selection deletion (backward compatibility)

          // Delete selected image/video/text element
          if (selectedImageIndex !== null && onImageDelete) {
            onImageDelete(selectedImageIndex);
            setSelectedImageIndex(null);
          }

          // Delete selected text input overlay
          if (selectedTextInputId !== null) {
            if (onPersistTextModalDelete) {
              Promise.resolve(onPersistTextModalDelete(selectedTextInputId)).catch(console.error);
            }
            setTextInputStates(prev => prev.filter(t => t.id !== selectedTextInputId));
            setSelectedTextInputId(null);
          }

          // Delete selected image modal
          if (selectedImageModalId !== null) {
            if (onPersistImageModalDelete) {
              Promise.resolve(onPersistImageModalDelete(selectedImageModalId)).catch(console.error);
            }
            setImageModalStates(prev => prev.filter(m => m.id !== selectedImageModalId));
            setSelectedImageModalId(null);
          }

          // Delete selected video modal
          if (selectedVideoModalId !== null) {
            if (onPersistVideoModalDelete) {
              Promise.resolve(onPersistVideoModalDelete(selectedVideoModalId)).catch(console.error);
            }
            setVideoModalStates(prev => prev.filter(m => m.id !== selectedVideoModalId));
            setSelectedVideoModalId(null);
          }

          // Delete selected music modal
          if (selectedMusicModalId !== null) {
            if (onPersistMusicModalDelete) {
              Promise.resolve(onPersistMusicModalDelete(selectedMusicModalId)).catch(console.error);
            }
            setMusicModalStates(prev => prev.filter(m => m.id !== selectedMusicModalId));
            setSelectedMusicModalId(null);
          }

          // Delete selected erase modal
          if (selectedEraseModalId !== null) {
            if (onPersistEraseModalDelete) {
              Promise.resolve(onPersistEraseModalDelete(selectedEraseModalId)).catch(console.error);
            }
            setEraseModalStates(prev => prev.filter(m => m.id !== selectedEraseModalId));
            setSelectedEraseModalId(null);
          }

          // Delete selected replace modal
          if (selectedReplaceModalId !== null) {
            if (onPersistReplaceModalDelete) {
              Promise.resolve(onPersistReplaceModalDelete(selectedReplaceModalId)).catch(console.error);
            }
            setReplaceModalStates(prev => prev.filter(m => m.id !== selectedReplaceModalId));
            setSelectedReplaceModalId(null);
          }

          if (selectedExpandModalId !== null) {
            if (onPersistExpandModalDelete) {
              Promise.resolve(onPersistExpandModalDelete(selectedExpandModalId)).catch(console.error);
            }
            setExpandModalStates(prev => prev.filter(m => m.id !== selectedExpandModalId));
            setSelectedExpandModalId(null);
          }
        }

        // Clear selection box and tight rect when Delete is pressed
        setSelectionBox(null);
        setSelectionTightRect(null);
        setIsDragSelection(false);
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
      if (e.key === 'z' && !e.repeat) {
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
    };

    const handleKeyUp = (e: KeyboardEvent) => {
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

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedTool, isPanning, selectedImageIndex, selectedImageIndices, selectedTextInputId, selectedImageModalId, selectedVideoModalId, selectedMusicModalId, onImageDelete, onImageUpdate]);

  // Handle clicks outside modal components to clear selections
  useEffect(() => {
    let mouseDownTarget: HTMLElement | null = null;
    let mouseDownTime = 0;
    let mouseDownPos: { x: number; y: number } | null = null;

    const handleMouseDown = (e: MouseEvent) => {
      mouseDownTarget = e.target as HTMLElement;
      mouseDownTime = Date.now();
      mouseDownPos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const timeDiff = Date.now() - mouseDownTime;
      const mouseUpPos = { x: e.clientX, y: e.clientY };

      // Calculate if it was a drag (moved more than 5 pixels)
      const wasDrag = mouseDownPos && (
        Math.abs(mouseUpPos.x - mouseDownPos.x) > 5 ||
        Math.abs(mouseUpPos.y - mouseDownPos.y) > 5
      );

      // Only clear if it was a click (not a drag) - check if target is same and time is short and no movement
      const wasClick = mouseDownTarget === target && timeDiff < 200 && !wasDrag;

      // Don't clear if we're in the middle of a selection drag or if it was a drag
      if (isSelecting || wasDrag) {
        mouseDownTarget = null;
        mouseDownPos = null;
        return;
      }

      // Check if click is inside any modal component
      const isInsideModal =
        target.closest('[data-modal-component]') !== null ||
        target.closest('.controls-overlay') !== null ||
        target.closest('.text-input-header') !== null ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'BUTTON' ||
        target.closest('button') !== null;

      // Check if click is on Konva canvas (canvas element) - let Konva handle it completely
      const isOnKonvaCanvas = target.tagName === 'CANVAS' || target.closest('canvas') !== null;

      // If click is outside all modals, clear selections
      // Note: Konva stage clicks are handled by handleStageMouseDown, but we also handle container background clicks here
      if (wasClick && !isInsideModal && containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const clickX = e.clientX;
        const clickY = e.clientY;

        // Check if click is inside the container (but not on canvas - canvas is handled by handleStageMouseDown)
        const isOnKonvaCanvas = target.tagName === 'CANVAS' || target.closest('canvas') !== null;
        if (!isOnKonvaCanvas) {
          if (
            clickX >= rect.left &&
            clickX <= rect.right &&
            clickY >= rect.top &&
            clickY <= rect.bottom
          ) {
            // Click is inside container but outside modals and not on canvas - clear selections including boxes
            clearAllSelections(true);
          }
        }
        // If click is on canvas, handleStageMouseDown will handle it
      }

      mouseDownTarget = null;
      mouseDownPos = null;
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isSelecting, clearAllSelections]);

  // Handle selection box mouse move
  useEffect(() => {
    if (!isSelecting || !selectionBox) return;

    // Use requestAnimationFrame to throttle updates for smooth performance
    let rafId: number | null = null;
    let pendingUpdate: { currentX: number; currentY: number } | null = null;
    // Use a ref to store the latest coordinates for immediate access on mouse up
    const latestCoordsRef = { currentX: selectionBox.currentX, currentY: selectionBox.currentY };

    const updateSelectionBox = () => {
      // Store pending update in a local variable to avoid race conditions
      const update = pendingUpdate;
      if (update) {
        latestCoordsRef.currentX = update.currentX;
        latestCoordsRef.currentY = update.currentY;
        setSelectionBox(prev => prev ? {
          ...prev,
          currentX: update.currentX,
          currentY: update.currentY,
        } : null);
        pendingUpdate = null;
      }
      rafId = null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const stage = stageRef.current;
      if (!stage) return;

      // Prevent text selection during drag
      e.preventDefault();

      // Ensure stage is not draggable during selection
      stage.draggable(false);

      const pointerPos = stage.getPointerPosition();
      if (pointerPos) {
        // Store selection box in canvas coordinates so it stays consistent across zoom/pan
        const canvasX = (pointerPos.x - position.x) / scale;
        const canvasY = (pointerPos.y - position.y) / scale;

        // Update ref immediately for mouse up handler
        latestCoordsRef.currentX = canvasX;
        latestCoordsRef.currentY = canvasY;

        // Store pending update
        pendingUpdate = { currentX: canvasX, currentY: canvasY };

        // Schedule update using requestAnimationFrame for smooth performance
        if (rafId === null) {
          rafId = requestAnimationFrame(updateSelectionBox);
        }
      }
    };

    const handleMouseUp = () => {
      const stage = stageRef.current;
      if (!stage) return;

      // Cancel any pending animation frame
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      // Apply final pending update if any (use latest from ref)
      if (pendingUpdate) {
        setSelectionBox(prev => prev ? {
          ...prev,
          currentX: latestCoordsRef.currentX,
          currentY: latestCoordsRef.currentY,
        } : null);
        pendingUpdate = null;
      }

      // Ensure stage is not draggable
      stage.draggable(false);

      // Reset cursor to default for cursor tool or after Shift selection
      if (selectedTool === 'cursor') {
        applyStageCursorWrapper('default');
      } else if (!isShiftPressed) {
        // Reset cursor when Shift is released
        if (selectedTool === 'move') {
          applyStageCursorWrapper('grab');
        } else if (selectedTool === 'text') {
          applyStageCursorWrapper('text');
        } else {
          applyStageCursorWrapper('pointer');
        }
      }

      // Use latest coordinates from ref for immediate processing
      const currentBox = selectionBox ? {
        ...selectionBox,
        currentX: latestCoordsRef.currentX,
        currentY: latestCoordsRef.currentY,
      } : null;

      if (currentBox) {
        // Selection box is already in canvas coordinates
        const marqueeRect = {
          x: Math.min(currentBox.startX, currentBox.currentX),
          y: Math.min(currentBox.startY, currentBox.currentY),
          width: Math.abs(currentBox.currentX - currentBox.startX),
          height: Math.abs(currentBox.currentY - currentBox.startY),
        };

        // Check if selection box was actually dragged (not just clicked)
        const boxWidth = marqueeRect.width;
        const boxHeight = marqueeRect.height;
        const wasDragged = boxWidth > 5 || boxHeight > 5;

        if (wasDragged) {
          // Find all items that intersect with the marquee using Konva's intersection utility
          const selectedIndices: number[] = [];
          const selectedImageModalIdsList: string[] = [];
          const selectedVideoModalIdsList: string[] = [];
          const selectedMusicModalIdsList: string[] = [];
          const selectedTextInputIdsList: string[] = [];

          // Check images and videos (skip 3D models)
          images.forEach((img, index) => {
            if (img.type === 'model3d') return;

            const imgX = img.x || 0;
            const imgY = img.y || 0;
            const imgWidth = img.width || 0;
            const imgHeight = img.height || 0;

            // For text, estimate dimensions
            let width = imgWidth;
            let height = imgHeight;
            if (img.type === 'text') {
              const fontSize = img.fontSize || 24;
              width = (img.text || '').length * fontSize * 0.6;
              height = fontSize * 1.2;
            }

            // Create bounding box for the item
            const itemRect = {
              x: imgX,
              y: imgY,
              width: width,
              height: height,
            };

            // Check if component overlaps with selection box (even partially)
            // Select if ANY part of the component is inside the selection box
            const componentRight = itemRect.x + itemRect.width;
            const componentBottom = itemRect.y + itemRect.height;
            const marqueeRight = marqueeRect.x + marqueeRect.width;
            const marqueeBottom = marqueeRect.y + marqueeRect.height;

            // Check if rectangles overlap (any intersection)
            const overlaps = !(
              componentRight < marqueeRect.x ||
              itemRect.x > marqueeRight ||
              componentBottom < marqueeRect.y ||
              itemRect.y > marqueeBottom
            );

            if (overlaps) {
              selectedIndices.push(index);
            }
          });

          // Check image modals (600px wide, aspect ratio height, typically 400px+ min height)
          imageModalStates.forEach((modal) => {
            const modalX = modal.x;
            const modalY = modal.y;
            const modalWidth = modal.frameWidth ?? 600;
            const modalHeight = modal.frameHeight ?? 400;
            const modalRect = {
              x: modalX,
              y: modalY,
              width: modalWidth,
              height: modalHeight,
            };
            // Check if modal overlaps with selection box (even partially)
            const modalRight = modalRect.x + modalRect.width;
            const modalBottom = modalRect.y + modalRect.height;
            const marqueeRight = marqueeRect.x + marqueeRect.width;
            const marqueeBottom = marqueeRect.y + marqueeRect.height;

            const overlaps = !(
              modalRight < marqueeRect.x ||
              modalRect.x > marqueeRight ||
              modalBottom < marqueeRect.y ||
              modalRect.y > marqueeBottom
            );

            if (overlaps) {
              selectedImageModalIdsList.push(modal.id);
            }
          });

          // Check video modals (600px wide, aspect ratio height, typically 400px+ min height)
          videoModalStates.forEach((modal) => {
            const modalX = modal.x;
            const modalY = modal.y;
            const modalWidth = modal.frameWidth ?? 600;
            const modalHeight = modal.frameHeight ?? 400;
            const modalRect = {
              x: modalX,
              y: modalY,
              width: modalWidth,
              height: modalHeight,
            };
            // Check if modal overlaps with selection box (even partially)
            const modalRight = modalRect.x + modalRect.width;
            const modalBottom = modalRect.y + modalRect.height;
            const marqueeRight = marqueeRect.x + marqueeRect.width;
            const marqueeBottom = marqueeRect.y + marqueeRect.height;

            const overlaps = !(
              modalRight < marqueeRect.x ||
              modalRect.x > marqueeRight ||
              modalBottom < marqueeRect.y ||
              modalRect.y > marqueeBottom
            );

            if (overlaps) {
              selectedVideoModalIdsList.push(modal.id);
            }
          });

          // Check music modals (600px wide, 300px high)
          musicModalStates.forEach((modal) => {
            const modalX = modal.x;
            const modalY = modal.y;
            const modalWidth = modal.frameWidth ?? 600;
            const modalHeight = modal.frameHeight ?? 300;
            const modalRect = {
              x: modalX,
              y: modalY,
              width: modalWidth,
              height: modalHeight,
            };
            // Check if modal overlaps with selection box (even partially)
            const modalRight = modalRect.x + modalRect.width;
            const modalBottom = modalRect.y + modalRect.height;
            const marqueeRight = marqueeRect.x + marqueeRect.width;
            const marqueeBottom = marqueeRect.y + marqueeRect.height;

            const overlaps = !(
              modalRight < marqueeRect.x ||
              modalRect.x > marqueeRight ||
              modalBottom < marqueeRect.y ||
              modalRect.y > marqueeBottom
            );

            if (overlaps) {
              selectedMusicModalIdsList.push(modal.id);
            }
          });

          // Check text input modals (400px+ wide, variable height, typically 200px+ with controls)
          textInputStates.forEach((textState) => {
            const textX = textState.x;
            const textY = textState.y;
            const textWidth = 400; // Minimum width
            const textHeight = 200; // Approximate height with controls
            const textRect = {
              x: textX,
              y: textY,
              width: textWidth,
              height: textHeight,
            };
            // Check if text input overlaps with selection box (even partially)
            const textRight = textRect.x + textRect.width;
            const textBottom = textRect.y + textRect.height;
            const marqueeRight = marqueeRect.x + marqueeRect.width;
            const marqueeBottom = marqueeRect.y + marqueeRect.height;

            const overlaps = !(
              textRight < marqueeRect.x ||
              textRect.x > marqueeRight ||
              textBottom < marqueeRect.y ||
              textRect.y > marqueeBottom
            );

            if (overlaps) {
              selectedTextInputIdsList.push(textState.id);
            }
          });

          // Handle selection with modifier keys (Shift/Ctrl/Cmd)
          const isModifierPressed = (window.event as MouseEvent)?.shiftKey ||
            (window.event as MouseEvent)?.ctrlKey ||
            (window.event as MouseEvent)?.metaKey;

          if (isModifierPressed) {
            // Union: add to existing selection
            setSelectedImageIndices(prev => {
              const combined = [...new Set([...prev, ...selectedIndices])];
              return combined;
            });
            setSelectedImageModalIds(prev => [...new Set([...prev, ...selectedImageModalIdsList])]);
            setSelectedVideoModalIds(prev => [...new Set([...prev, ...selectedVideoModalIdsList])]);
            setSelectedMusicModalIds(prev => [...new Set([...prev, ...selectedMusicModalIdsList])]);
            setSelectedTextInputIds(prev => [...new Set([...prev, ...selectedTextInputIdsList])]);
          } else {
            // Replace selection
            setSelectedImageIndices(selectedIndices);
            setSelectedImageModalIds(selectedImageModalIdsList);
            setSelectedVideoModalIds(selectedVideoModalIdsList);
            setSelectedMusicModalIds(selectedMusicModalIdsList);
            setSelectedTextInputIds(selectedTextInputIdsList);
            if (selectedIndices.length > 0) {
              setSelectedImageIndex(selectedIndices[0]);
            } else {
              setSelectedImageIndex(null);
            }
            // Set single selection IDs for backward compatibility
            if (selectedImageModalIdsList.length > 0) {
              setSelectedImageModalId(selectedImageModalIdsList[0]);
            } else {
              setSelectedImageModalId(null);
            }
            if (selectedVideoModalIdsList.length > 0) {
              setSelectedVideoModalId(selectedVideoModalIdsList[0]);
            } else {
              setSelectedVideoModalId(null);
            }
            if (selectedMusicModalIdsList.length > 0) {
              setSelectedMusicModalId(selectedMusicModalIdsList[0]);
            } else {
              setSelectedMusicModalId(null);
            }
            if (selectedTextInputIdsList.length > 0) {
              setSelectedTextInputId(selectedTextInputIdsList[0]);
            } else {
              setSelectedTextInputId(null);
            }
          }

          // Compute tight bounding rect around selected items (remove extra area)
          // Include both canvas images and modals
          const totalSelected = selectedIndices.length + selectedImageModalIdsList.length +
            selectedVideoModalIdsList.length + selectedMusicModalIdsList.length +
            selectedTextInputIdsList.length;

          if (totalSelected > 0) {
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            // Include canvas images
            selectedIndices.forEach((idx) => {
              const it = images[idx];
              if (!it) return;
              const ix = it.x || 0;
              const iy = it.y || 0;
              let iw = it.width || 0;
              let ih = it.height || 0;
              if (it.type === 'text') {
                const fontSize = it.fontSize || 24;
                iw = (it.text || '').length * fontSize * 0.6;
                ih = fontSize * 1.2;
              }
              minX = Math.min(minX, ix);
              minY = Math.min(minY, iy);
              maxX = Math.max(maxX, ix + iw);
              maxY = Math.max(maxY, iy + ih);
            });

            // Include image modals
            // Image modals: 600px wide, height = max(400px, 600px / aspectRatio)
            // The frame has minHeight: 400px, but actual height varies by aspect ratio
            // For tight bounding box, we need to use the actual visible frame height
            // Since we can't know the exact aspect ratio, use a conservative estimate
            // Most common: 1:1 = 600px, 16:9 = 400px (clamped), 9:16 = 1066px
            // To ensure tight fit and avoid extra space, use a value that works for common cases
            // Using 400px ensures we don't overestimate for 16:9, but may underestimate for 1:1
            selectedImageModalIdsList.forEach((id) => {
              const modal = imageModalStates.find(m => m.id === id);
              if (modal) {
                const modalWidth = 600; // Fixed width
                // Use minimum frame height to ensure tight bounding box
                // This matches the CSS minHeight and works for most aspect ratios
                // Use a slightly smaller estimate to ensure tight fit at bottom
                // The frame minHeight is 400px, but we use 380px to account for any padding/margins
                const modalHeight = 380; // Slightly less than minHeight to ensure tight fit
                minX = Math.min(minX, modal.x);
                minY = Math.min(minY, modal.y);
                maxX = Math.max(maxX, modal.x + modalWidth);
                // Calculate bottom edge: modal.y + modalHeight
                // This gives us the actual bottom border of this component
                maxY = Math.max(maxY, modal.y + modalHeight);
              }
            });

            // Include video modals
            // Video modals: 600px wide, height = max(400px, 600px / aspectRatio)
            // Default aspect ratio is 16:9, so height = max(400px, 600/(16/9)) = max(400px, 337.5px) = 400px
            // Use the minimum frame height to ensure tight bounding box
            selectedVideoModalIdsList.forEach((id) => {
              const modal = videoModalStates.find(m => m.id === id);
              if (modal) {
                const modalWidth = 600; // Fixed width
                // Use a slightly smaller estimate to ensure tight fit at bottom
                // The frame minHeight is 400px, but we use 380px to account for any padding/margins
                const modalHeight = 380; // Slightly less than minHeight to ensure tight fit
                minX = Math.min(minX, modal.x);
                minY = Math.min(minY, modal.y);
                maxX = Math.max(maxX, modal.x + modalWidth);
                // Calculate bottom edge: modal.y + modalHeight
                // This gives us the actual bottom border of this component
                maxY = Math.max(maxY, modal.y + modalHeight);
              }
            });

            // Include music modals
            // Music modals: 600px wide, 300px height (fixed) - this is the frame height
            selectedMusicModalIdsList.forEach((id) => {
              const modal = musicModalStates.find(m => m.id === id);
              if (modal) {
                const modalWidth = 600; // Fixed width
                const modalHeight = 300; // Fixed frame height
                minX = Math.min(minX, modal.x);
                minY = Math.min(minY, modal.y);
                maxX = Math.max(maxX, modal.x + modalWidth);
                maxY = Math.max(maxY, modal.y + modalHeight);
              }
            });

            // Include text input modals
            // Text inputs: min 400px width, height is variable based on content
            // Structure: drag handle (~4px) + padding top (~12px) + textarea (min 80px) + padding bottom (~12px) + buttons (~32px)
            // Total: ~140px minimum, but can grow with content
            // Use minimum height for tight bounding box
            selectedTextInputIdsList.forEach((id) => {
              const textState = textInputStates.find(t => t.id === id);
              if (textState) {
                const textWidth = 400; // Minimum width
                // Use minimum height: handle (4px) + top padding (12px) + textarea min (80px) + bottom padding (12px) + buttons (32px) = 140px
                // But to be more accurate, let's use a slightly smaller estimate to ensure tight fit
                // Use a tighter estimate to ensure no extra space at bottom
                // Actual height is ~140px minimum, but we use 110px to ensure tight fit
                const textHeight = 110; // Tighter estimate to remove extra bottom space
                minX = Math.min(minX, textState.x);
                minY = Math.min(minY, textState.y);
                maxX = Math.max(maxX, textState.x + textWidth);
                maxY = Math.max(maxY, textState.y + textHeight);
              }
            });

            if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
              // Calculate tight rect - ensure we're using the actual bounds
              // The calculation should already be tight
              const width = maxX - minX;
              const height = maxY - minY;

              setSelectionTightRect({
                x: minX,
                y: minY,
                width: Math.max(1, width),
                height: Math.max(1, height),
              });
              selectionDragOriginRef.current = { x: minX, y: minY };
              // Clear selectionBox once tight rect is calculated - this makes the selection shrink to fit
              setSelectionBox(null);
              // Mark this as a drag selection so icons will show
              setIsDragSelection(true);
            } else {
              setSelectionTightRect(null);
              selectionDragOriginRef.current = null;
              setIsDragSelection(false);
            }
          } else {
            setSelectionTightRect(null);
            selectionDragOriginRef.current = null;
            setIsDragSelection(false);
          }
        } else {
          // Just a click, clear selection if not clicking on an element and no modifier
          const isModifierPressed = (window.event as MouseEvent)?.shiftKey ||
            (window.event as MouseEvent)?.ctrlKey ||
            (window.event as MouseEvent)?.metaKey;
          if (!isModifierPressed) {
            setSelectedImageIndices([]);
            setSelectedImageIndex(null);
            setSelectedImageModalIds([]);
            setSelectedVideoModalIds([]);
            setSelectedMusicModalIds([]);
            setSelectedTextInputIds([]);
            setSelectionTightRect(null);
            selectionDragOriginRef.current = null;
            setIsDragSelection(false);
          }
        }
      }

      setIsSelecting(false);
      // Keep selection box visible after mouse up - it will be cleared when Delete is pressed or when starting a new selection
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      // Clean up any pending animation frame
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
  }, [isSelecting, selectionBox, position, scale, images, selectedTool, imageModalStates, videoModalStates, musicModalStates, textInputStates]);

  // Attach Transformer to selected nodes
  useEffect(() => {
    if (transformerRef.current && selectedImageIndices.length > 0) {
      const stage = stageRef.current;
      if (!stage) return;

      const layer = layerRef.current;
      if (!layer) return;

      // Find all selected nodes by matching image indices
      const nodes: Konva.Node[] = [];
      selectedImageIndices.forEach((index) => {
        const imageData = images[index];
        if (!imageData || imageData.type === 'model3d') return;

        // Skip uploaded images (blob URLs, Zata input URLs, or direct file uploads) - disable resize for them
        // Uploaded images should have static frame size like generation frames
        const isUploaded =
          imageData.file || // Direct file upload
          (imageData.url && (
            imageData.url.toLowerCase().startsWith('blob:') ||
            imageData.url.toLowerCase().includes('/input/') ||
            (imageData.url.toLowerCase().includes('upload-') && imageData.url.toLowerCase().includes('zata.ai'))
          ));
        if (isUploaded) {
          return; // Skip this image - don't attach Transformer (no resize handles)
        }

        // First try to find node by name (more reliable)
        const nodeByName = layer.findOne(`canvas-image-${index}`);
        if (nodeByName && nodeByName instanceof Konva.Group) {
          if (!nodes.includes(nodeByName)) {
            nodes.push(nodeByName);
          }
        } else {
          // Fallback: Find the node by looking for Groups that match the image position
          // Use a larger tolerance to account for position updates after drag
          const allNodes = layer.getChildren();
          allNodes.forEach((node: Konva.Node) => {
            if (node instanceof Konva.Group) {
              const nodeX = node.x();
              const nodeY = node.y();
              const imgX = imageData.x || 0;
              const imgY = imageData.y || 0;

              // Match by position (with larger tolerance to handle position updates)
              const tolerance = 10; // Increased from 1 to handle position updates
              if (Math.abs(nodeX - imgX) < tolerance && Math.abs(nodeY - imgY) < tolerance) {
                // Double-check: skip if it's marked as uploaded (has data-no-resize attribute)
                const isUploadedNode = (node as any).attrs?.['data-no-resize'] === 'true';
                if (isUploadedNode) {
                  return; // Skip this image - don't attach Transformer
                }
                if (!nodes.includes(node)) {
                  nodes.push(node);
                }
              }
            }
          });
        }
      });

      if (nodes.length > 0) {
        transformerRef.current.nodes(nodes);
        transformerRef.current.getLayer()?.batchDraw();
        selectedNodesRef.current = nodes;
      } else {
        // If no nodes found, clear transformer to prevent stale state
        transformerRef.current.nodes([]);
      }
    } else if (transformerRef.current && selectedImageIndices.length === 0) {
      transformerRef.current.nodes([]);
      selectedNodesRef.current = [];
    }
  }, [selectedImageIndices, images, position.x, position.y, scale, transformerUpdateKey]);

  // Handle drag to pan - enhanced for better navigation
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const target = e.target;
    const stage = target.getStage();
    // More comprehensive check for empty clicks - includes Stage, Layer, and background Rect
    const clickedOnEmpty = target === stage ||
      target.getClassName() === 'Stage' ||
      target.getClassName() === 'Layer' ||
      (target.getClassName() === 'Rect' && (target as Konva.Rect).width() > 100000);
    // Panning: only with move tool, or with middle mouse, Ctrl/Cmd, or Space key (NOT with cursor tool or Shift)
    const isMoveTool = selectedTool === 'move';
    const isCursorTool = selectedTool === 'cursor';
    // Cursor tool and Shift + Left Click should NEVER pan - only selection
    const isPanKey = isMoveTool || e.evt.button === 1 || e.evt.ctrlKey || e.evt.metaKey || isSpacePressed;
    // Shift + Left Click is for selection, not panning
    const isShiftSelection = e.evt.shiftKey && e.evt.button === 0;
    const clickedOnElement = !clickedOnEmpty;

    // Check if clicking on a resize handle - if so, don't clear selection
    // Resize handles have a name attribute "resize-handle"
    const isResizeHandle = target.name() === 'resize-handle';

    // Clear selections when clicking on empty space (but not on resize handles)
    // Don't clear if we're starting a selection box with cursor tool or Shift + Left Click
    // NOTE: Selection box is NOT cleared here - it only clears on Delete key or when starting a new selection
    const isStartingSelection = (isCursorTool || isShiftSelection) && !isPanKey && e.evt.button === 0;

    // Check if click is inside the selection area (selectionTightRect or selectionBox)
    let isInsideSelection = false;
    if (stage) {
      const pointerPos = stage.getPointerPosition();
      if (pointerPos) {
        // Convert screen coordinates to canvas coordinates
        const canvasPos = {
          x: (pointerPos.x - position.x) / scale,
          y: (pointerPos.y - position.y) / scale,
        };

        // Check if click is inside selectionTightRect
        if (selectionTightRect) {
          const rect = selectionTightRect;
          if (
            canvasPos.x >= rect.x &&
            canvasPos.x <= rect.x + rect.width &&
            canvasPos.y >= rect.y &&
            canvasPos.y <= rect.y + rect.height
          ) {
            isInsideSelection = true;
          }
        }

        // Check if click is inside selectionBox (if no tightRect yet)
        if (!isInsideSelection && selectionBox) {
          const boxX = Math.min(selectionBox.startX, selectionBox.currentX);
          const boxY = Math.min(selectionBox.startY, selectionBox.currentY);
          const boxWidth = Math.abs(selectionBox.currentX - selectionBox.startX);
          const boxHeight = Math.abs(selectionBox.currentY - selectionBox.startY);
          if (
            canvasPos.x >= boxX &&
            canvasPos.x <= boxX + boxWidth &&
            canvasPos.y >= boxY &&
            canvasPos.y <= boxY + boxHeight
          ) {
            isInsideSelection = true;
          }
        }
      }
    }

    // Check if we're editing a group name (input is focused)
    const isEditingGroup = document.querySelector('input[data-editing-group="true"]') !== null;

    // Clear selections when clicking on empty canvas space
    // Only skip clearing if:
    // 1. We're clicking on a resize handle
    // 2. We're starting a selection box (cursor tool drag)
    // 3. We're clicking inside an existing selection area
    // 4. Current selection is a group (groups persist their border)
    // 5. We're editing a group name (prevent deletion during editing)
    if (clickedOnEmpty && !isResizeHandle && !isStartingSelection && !isInsideSelection && !isEditingGroup) {
      // Click is on empty canvas - clear everything including selection boxes
      // But don't clear if it's a group - groups should persist
      clearAllSelections(true);
      // When user clicks plain canvas (not starting pan/selection), show pointer cursor
      try {
        applyStageCursorWrapper('pointer');
      } catch (err) {
        // ignore if helper not available
      }
    }
    // If click is inside selection area, do nothing - keep selections

    // Store mouse down position to detect drag vs click
    const pointerPos = e.target.getStage()?.getPointerPosition();
    if (pointerPos) {
      setMouseDownPos({ x: pointerPos.x, y: pointerPos.y });
    }

    // If text tool is selected and clicking on empty space, create text input
    if (selectedTool === 'text' && clickedOnEmpty && !isPanKey) {
      const stage = e.target.getStage();
      if (stage) {
        if (pointerPos) {
          // Debounce guard: avoid creating multiple quickly
          const now = Date.now();
          const last = lastCreateTimesRef.current.text || 0;
          if (now - last >= 400) {
            lastCreateTimesRef.current.text = now;
            // Convert screen coordinates to canvas coordinates
            const canvasX = (pointerPos.x - position.x) / scale;
            const canvasY = (pointerPos.y - position.y) / scale;
            const newId = `text-${Date.now()}-${Math.random()}`;
            const newModal = { id: newId, x: canvasX, y: canvasY, autoFocusInput: true };
            setTextInputStates(prev => [...prev, newModal]);
            if (onPersistTextModalCreate) {
              Promise.resolve(onPersistTextModalCreate(newModal)).catch(console.error);
            }
          }
        }
      }
      return;
    }

    // If Shift + Left Click, prepare marquee selection but defer creating the
    // visible selection box until the pointer actually moves a few pixels.
    if (isShiftSelection && clickedOnEmpty) {
      if (pointerPos) {
        // Store both screen and canvas start points so we can compute movement
        // threshold in screen pixels but render selection in canvas coords.
        setPendingSelectionStartScreen({ x: pointerPos.x, y: pointerPos.y });
        setPendingSelectionStartCanvas({ x: (pointerPos.x - position.x) / scale, y: (pointerPos.y - position.y) / scale });
        setSelectionStartPoint({ x: pointerPos.x, y: pointerPos.y });
        // Clear previous selection visuals (but keep group selections)
        setSelectionBox(null);
        {
          setSelectionTightRect(null);
          setIsDragSelection(false);
        }
      }
      return;
    }

    // If move tool is selected, always enable panning
    if (isMoveTool && clickedOnEmpty && e.evt.button === 0) {
      const stage = e.target.getStage();
      if (stage) {
        setIsPanning(true);
        stage.draggable(true);
        applyStageCursorWrapper('grabbing', true);
      }
      return;
    }

    // If cursor tool is selected, prepare marquee selection but defer creating
    // the visible selection box until the pointer moves beyond a small threshold.
    if (isCursorTool && e.evt.button === 0) {
      if (clickedOnEmpty) {
        if (pointerPos) {
          setPendingSelectionStartScreen({ x: pointerPos.x, y: pointerPos.y });
          setPendingSelectionStartCanvas({ x: (pointerPos.x - position.x) / scale, y: (pointerPos.y - position.y) / scale });
          setSelectionStartPoint({ x: pointerPos.x, y: pointerPos.y });
          setSelectionBox(null);
          // Don't clear selection box if it's a group - groups persist
          {
            setSelectionTightRect(null);
            setIsDragSelection(false);
          }
        }
        return;
      }
    }

    // Enable panning with move tool or pan keys (middle mouse, Ctrl/Cmd, Space key)
    // Shift should NEVER pan - only selection
    const shouldPan = isPanKey && !isShiftSelection;

    // Default behavior: only pan when Move tool is active or a pan key/middle mouse is used.
    // For other tools (image/video/music/text), left-drag should start selection, not panning.
    if (clickedOnEmpty && e.evt.button === 0 && !isShiftSelection && (isMoveTool || isPanKey)) {
      const stage = e.target.getStage();
      if (stage) {
        setIsPanning(true);
        stage.draggable(true);
        applyStageCursorWrapper('grabbing', true);
      }
      return;
    }

    if (shouldPan) {
      const stage = e.target.getStage();
      if (stage) {
        setIsPanning(true);
        stage.draggable(true);
        applyStageCursorWrapper('grabbing', true);
      }
    } else if (clickedOnElement && isMoveTool) {
      // If move tool is selected, allow panning even when clicking on elements
      const stage = e.target.getStage();
      if (stage) {
        setIsPanning(true);
        stage.draggable(true);
        applyStageCursorWrapper('grabbing', true);
      }
    } else if (clickedOnElement) {
      // For other tools, prepare for potential drag-to-pan
      setIsDraggingFromElement(true);
      const stage = e.target.getStage();
      if (stage) {
        stage.draggable(false);
      }
    }
  };

  // Track mouse movement to detect drag vs click on elements
  useEffect(() => {
    if (!isDraggingFromElement || !mouseDownPos || selectedTool === 'cursor' || selectedTool === 'move') return;

    const handleMouseMove = (e: MouseEvent) => {
      const moveThreshold = 5; // pixels
      const distance = Math.sqrt(
        Math.pow(e.clientX - mouseDownPos.x, 2) +
        Math.pow(e.clientY - mouseDownPos.y, 2)
      );

      // If mouse moved significantly, enable panning
      if (distance > moveThreshold) {
        const stage = stageRef.current;
        if (stage) {
          setIsPanning(true);
          stage.draggable(true);
          applyStageCursorWrapper('grabbing', true);
          // Disable element dragging when panning
          const allNodes = stage.find('Image');
          allNodes.forEach((node) => {
            node.draggable(false);
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingFromElement(false);
      setMouseDownPos(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingFromElement, mouseDownPos, selectedTool]);

  // If we have a pending selection (mouse down but we haven't moved enough),
  // watch pointer movement and only start the visible marquee once the mouse
  // moves beyond a small threshold. This prevents single clicks from creating
  // selection boxes.
  useEffect(() => {
    if (!pendingSelectionStartScreen || !pendingSelectionStartCanvas) return;

    const threshold = 6; // pixels

    const handleMove = (e: MouseEvent) => {
      const start = pendingSelectionStartScreen;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > threshold) {
        // Begin actual selection
        const stage = stageRef.current;
        if (stage) {
          stage.draggable(false);
          applyStageCursorWrapper('crosshair', true);
        }

        setSelectionBox({
          startX: pendingSelectionStartCanvas.x,
          startY: pendingSelectionStartCanvas.y,
          currentX: pendingSelectionStartCanvas.x,
          currentY: pendingSelectionStartCanvas.y,
        });
        setIsSelecting(true);

        // Clear pending markers
        setPendingSelectionStartScreen(null);
        setPendingSelectionStartCanvas(null);
      }
    };

    const handleUp = () => {
      // Mouse released before threshold — cancel pending selection (single click)
      setPendingSelectionStartScreen(null);
      setPendingSelectionStartCanvas(null);
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    window.addEventListener('mouseup', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove as any);
      window.removeEventListener('mouseup', handleUp as any);
    };
  }, [pendingSelectionStartScreen, pendingSelectionStartCanvas, position.x, position.y, scale]);

  const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const target = e.target;

    // Check if this was a click on empty canvas (not a drag)
    const clickedOnEmpty = target === stage ||
      target.getClassName() === 'Stage' ||
      target.getClassName() === 'Layer' ||
      (target.getClassName() === 'Rect' && (target as Konva.Rect).width() > 100000);

    // If it was a click (not a drag) on empty space and no selection box was created, clear selections
    // This handles the case where user clicks on empty canvas to deselect
    if (clickedOnEmpty && !isSelecting && !selectionBox) {
      // Only clear if we have selections and this was just a click (not part of a drag operation)
      const hasSelections = selectedImageIndex !== null ||
        selectedImageModalId !== null ||
        selectedVideoModalId !== null ||
        selectedMusicModalId !== null ||
        selectedTextInputId !== null ||
        selectedImageIndices.length > 0 ||
        selectedImageModalIds.length > 0 ||
        selectedVideoModalIds.length > 0 ||
        selectedMusicModalIds.length > 0 ||
        selectedTextInputIds.length > 0;

      if (hasSelections) {
        clearAllSelections(true);
      }
    }

    if (stage) {
      setIsPanning(false);
      setIsDraggingFromElement(false);
      setMouseDownPos(null);
      if (selectedTool === 'text') {
        applyStageCursorWrapper('text');
      } else if (selectedTool === 'move') {
        applyStageCursorWrapper('grab');
      } else if (selectedTool === 'cursor') {
        applyStageCursorWrapper('default'); // Cursor tool always shows default cursor
      } else {
        // Non-persistent single-click tools (image/video/music/etc.) should
        // not change the stage into a panning/grab cursor. Use pointer.
        applyStageCursorWrapper('pointer');
      }
    }
  };

  const handleStageDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target.getStage();
    if (stage) {
      setPosition({
        x: stage.x(),
        y: stage.y(),
      });
    }
  };

  const handleStageDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target.getStage();
    if (stage) {
      const newPos = {
        x: stage.x(),
        y: stage.y(),
      };
      setPosition(newPos);
      updateViewportCenter(newPos, scale);
    }
  };

  // Calculate and expose viewport center
  const updateViewportCenter = (pos: { x: number; y: number }, currentScale: number) => {
    if (onViewportChange && stageRef.current) {
      // Calculate the center of the viewport in canvas coordinates
      // Formula: canvasX = (screenX - stageX) / scale
      const centerX = (viewportSize.width / 2 - pos.x) / currentScale;
      const centerY = (viewportSize.height / 2 - pos.y) / currentScale;
      onViewportChange({ x: centerX, y: centerY }, currentScale);
    }
  };

  // Update viewport center when scale or position changes
  useEffect(() => {
    // Update if we have initialized and have a callback
    if (initializedRef.current && onViewportChange) {
      updateViewportCenter(position, scale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.x, position.y, scale, viewportSize.width, viewportSize.height, onViewportChange]);

  // Canvas is truly infinite - no need to expand, it's already massive
  // Fixed at 1,000,000 x 1,000,000 pixels - can handle 100+ 8K images easily

  // Wrapper for onImageUpdate
  const handleImageUpdateWithGroup = (index: number, updates: Partial<ImageUpload>) => {
    if (onImageUpdate) {
      onImageUpdate(index, updates);
    }
    // Update real-time position for action icons during drag
    if (updates.x !== undefined || updates.y !== undefined) {
      if (index === selectedImageIndex) {
        setSelectedImageRealTimePosition({
          x: updates.x !== undefined ? updates.x : (images[index]?.x || 0),
          y: updates.y !== undefined ? updates.y : (images[index]?.y || 0),
        });
      }
    }
    // Force Transformer re-attachment after position updates
    if (updates.x !== undefined || updates.y !== undefined) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        setTransformerUpdateKey(prev => prev + 1);
      }, 50);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (containerRef.current) {
      containerRef.current.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (containerRef.current) {
      containerRef.current.style.backgroundColor = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (containerRef.current) {
      containerRef.current.style.backgroundColor = '';
    }

    // Check if this is a library media drop or plugin drop (has JSON data)
    try {
      const mediaData = e.dataTransfer.getData('application/json');
      if (mediaData) {
        const data = JSON.parse(mediaData);

        // Check if it's a plugin drop
        if (data && data.type === 'plugin' && data.plugin) {
          // Calculate canvas coordinates from drop position
          if (stageRef.current && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // Get drop position relative to container
            const dropX = e.clientX - rect.left;
            const dropY = e.clientY - rect.top;

            // Convert screen coordinates to canvas coordinates
            // Account for stage position and scale
            const canvasX = (dropX - position.x) / scale;
            const canvasY = (dropY - position.y) / scale;

            // Create upscale modal at drop position
            if (data.plugin.id === 'upscale' && onPersistUpscaleModalCreate) {
              const modalId = `upscale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const newUpscale = {
                id: modalId,
                x: canvasX,
                y: canvasY,
                upscaledImageUrl: null,
                sourceImageUrl: null,
                localUpscaledImageUrl: null,
                model: 'Crystal Upscaler',
                scale: 2,
                frameWidth: 400,
                frameHeight: 500,
                isUpscaling: false,
              };
              setUpscaleModalStates(prev => [...prev, newUpscale]);
              Promise.resolve(onPersistUpscaleModalCreate(newUpscale)).catch(console.error);
            } else if (data.plugin.id === 'removebg' && onPersistRemoveBgModalCreate) {
              const modalId = `removebg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const newRemoveBg = {
                id: modalId,
                x: canvasX,
                y: canvasY,
                removedBgImageUrl: null,
                sourceImageUrl: null,
                localRemovedBgImageUrl: null,
                model: '851-labs/background-remover',
                backgroundType: 'rgba (transparent)',
                scaleValue: 0.5,
                frameWidth: 400,
                frameHeight: 500,
                isRemovingBg: false,
              };
              setRemoveBgModalStates(prev => [...prev, newRemoveBg]);
              Promise.resolve(onPersistRemoveBgModalCreate(newRemoveBg)).catch(console.error);
            } else if (data.plugin.id === 'erase' && onPersistEraseModalCreate) {
              const newErase = {
                id: `erase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                x: canvasX,
                y: canvasY,
                erasedImageUrl: null,
                sourceImageUrl: null,
                localErasedImageUrl: null,
                model: 'bria/eraser',
                frameWidth: 400,
                frameHeight: 500,
                isErasing: false,
              };
              setEraseModalStates(prev => [...prev, newErase]);
              Promise.resolve(onPersistEraseModalCreate(newErase)).catch(console.error);
            } else if (data.plugin.id === 'replace' && onPersistReplaceModalCreate) {
              const modalId = `replace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const newReplace = {
                id: modalId,
                x: canvasX,
                y: canvasY,
                replacedImageUrl: null,
                sourceImageUrl: null,
                localReplacedImageUrl: null,
                model: 'bria/eraser',
                frameWidth: 400,
                frameHeight: 500,
                isReplacing: false,
              };
              setReplaceModalStates(prev => [...prev, newReplace]);
              Promise.resolve(onPersistReplaceModalCreate(newReplace)).catch(console.error);
            } else if (data.plugin.id === 'expand' && onPersistExpandModalCreate) {
              const modalId = `expand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const newExpand = {
                id: modalId,
                x: canvasX,
                y: canvasY,
                expandedImageUrl: null,
                sourceImageUrl: null,
                localExpandedImageUrl: null,
                model: 'expand/base',
                frameWidth: 400,
                frameHeight: 500,
                isExpanding: false,
              };
              setExpandModalStates(prev => [...prev, newExpand]);
              Promise.resolve(onPersistExpandModalCreate(newExpand)).catch(console.error);
            } else if (data.plugin.id === 'vectorize' && onPersistVectorizeModalCreate) {
              const modalId = `vectorize-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const newVectorize = {
                id: modalId,
                x: canvasX,
                y: canvasY,
                vectorizedImageUrl: null,
                sourceImageUrl: null,
                localVectorizedImageUrl: null,
                mode: 'simple',
                frameWidth: 400,
                frameHeight: 500,
                isVectorizing: false,
              };
              setVectorizeModalStates(prev => [...prev, newVectorize]);
              Promise.resolve(onPersistVectorizeModalCreate(newVectorize)).catch(console.error);
            }
            return;
          }
        }

        // Check if it's a valid media item from library
        if (data && data.url && (data.type === 'image' || data.type === 'video' || data.type === 'music' || data.type === 'uploaded')) {
          // Calculate canvas coordinates from drop position
          if (stageRef.current && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // Get drop position relative to container
            const dropX = e.clientX - rect.left;
            const dropY = e.clientY - rect.top;

            // Convert screen coordinates to canvas coordinates
            // Account for stage position and scale
            const canvasX = (dropX - position.x) / scale;
            const canvasY = (dropY - position.y) / scale;

            if (onLibraryMediaDrop) {
              onLibraryMediaDrop(data, canvasX, canvasY);
            }
            return;
          }
        }
      }
    } catch (err) {
      // Not a library media drop, continue with file handling
    }

    const files = Array.from(e.dataTransfer.files).filter((file) => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();

      // Check by MIME type
      if (fileType.startsWith('image/') || fileType.startsWith('video/')) {
        return true;
      }

      // Check by file extension
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tif', '.tiff'];
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.3gp'];
      const modelExtensions = ['.obj', '.gltf', '.glb'];
      return imageExtensions.some(ext => fileName.endsWith(ext)) ||
        videoExtensions.some(ext => fileName.endsWith(ext)) ||
        modelExtensions.some(ext => fileName.endsWith(ext));
    });

    if (files.length > 0 && onImagesDrop) {
      onImagesDrop(files);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gray-100 overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Stage
        ref={stageRef}
        width={viewportSize.width}
        height={viewportSize.height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable={false}
        onMouseDown={handleStageMouseDown}
        onMouseUp={handleStageMouseUp}
        onDragMove={handleStageDragMove}
        onDragEnd={handleStageDragEnd}
        style={{
          cursor: selectedTool === 'text'
            ? 'text'
            : selectedTool === 'move'
              ? (isPanning ? 'grabbing' : 'grab')
              : selectedTool === 'cursor'
                ? (isSelecting ? 'crosshair' : 'crosshair')
                : 'grab'
        }}
      >
        <Layer ref={layerRef}>
          {/* Infinite canvas pattern background */}
          {patternImage && (
            <Rect
              x={0}
              y={0}
              width={canvasSize.width}
              height={canvasSize.height}
              fillPatternImage={patternImage}
              fillPatternRepeat="repeat"
            />
          )}
          {/* Images and Videos */}
          {images
            .filter((img) => img.type !== 'model3d' && img.type !== 'text')
            .map((imageData, index) => {
              const actualIndex = images.findIndex(img => img === imageData);
              return (
                <CanvasImage
                  key={`${imageData.url}-${index}`}
                  imageData={imageData}
                  index={actualIndex}
                  stageRef={stageRef}
                  position={position}
                  scale={scale}
                  onUpdate={(updates) => {
                    handleImageUpdateWithGroup(actualIndex, updates);
                    // Clear real-time position when drag ends (when position is not being updated)
                    if (updates.x === undefined && updates.y === undefined) {
                      // Delay clearing to ensure final position is set
                      setTimeout(() => {
                        setSelectedImageRealTimePosition(null);
                      }, 150);
                    }
                  }}
                  onSelect={(e?: { ctrlKey?: boolean; metaKey?: boolean }) => {

                    const isMultiSelect = e?.ctrlKey || e?.metaKey;
                    if (isMultiSelect) {
                      // Add to selection if not already selected, remove if selected
                      setSelectedImageIndices(prev => {
                        if (prev.includes(actualIndex)) {
                          const newIndices = prev.filter(i => i !== actualIndex);
                          setSelectedImageIndex(newIndices.length > 0 ? newIndices[0] : null);
                          return newIndices;
                        } else {
                          const newIndices = [...prev, actualIndex];
                          setSelectedImageIndex(actualIndex);
                          return newIndices;
                        }
                      });
                    } else {
                      // Single select - clear all other selections first
                      clearAllSelections();
                      // Then set this image as selected
                      setSelectedImageIndices([actualIndex]);
                      setSelectedImageIndex(actualIndex);
                    }
                  }}
                  isSelected={selectedImageIndices.includes(actualIndex)}
                  onDelete={() => {
                    if (onImageDelete) {
                      onImageDelete(actualIndex);
                    }
                    setSelectedImageIndex(null);
                    setSelectedImageIndices([]);
                  }}
                />
              );
            })}
          {/* Text Elements */}
          <TextElements
            images={images}
            selectedImageIndex={selectedImageIndex}
            clearAllSelections={clearAllSelections}
            setSelectedImageIndex={setSelectedImageIndex}
            setSelectedImageIndices={setSelectedImageIndices}
            setContextMenuImageIndex={setContextMenuImageIndex}
            setContextMenuOpen={setContextMenuOpen}
            handleImageUpdateWithGroup={handleImageUpdateWithGroup}
          />
          {/* Selection Rect & Toolbar */}
          <SelectionBox
            selectionBox={selectionBox}
            selectionTightRect={selectionTightRect}
            isSelecting={isSelecting}
            isDragSelection={isDragSelection}
            selectedImageIndices={selectedImageIndices}
            selectedImageModalIds={selectedImageModalIds}
            selectedVideoModalIds={selectedVideoModalIds}
            selectedMusicModalIds={selectedMusicModalIds}
            selectedTextInputIds={selectedTextInputIds}
            images={images}
            selectionDragOriginRef={selectionDragOriginRef}
            setSelectionTightRect={setSelectionTightRect}
            setIsDragSelection={setIsDragSelection}
            handleImageUpdateWithGroup={handleImageUpdateWithGroup}
            setTextInputStates={setTextInputStates}
            setImageModalStates={setImageModalStates}
            setVideoModalStates={setVideoModalStates}
            setMusicModalStates={setMusicModalStates}
            textInputStates={textInputStates}
            imageModalStates={imageModalStates}
            videoModalStates={videoModalStates}
            musicModalStates={musicModalStates}
            setSelectedImageIndices={setSelectedImageIndices}
            setSelectedTextInputIds={setSelectedTextInputIds}
            setSelectedImageModalIds={setSelectedImageModalIds}
            setSelectedVideoModalIds={setSelectedVideoModalIds}
            setSelectedMusicModalIds={setSelectedMusicModalIds}
            onPersistImageModalMove={onPersistImageModalMove}
            onPersistTextModalMove={onPersistTextModalMove}
            onImageUpdate={onImageUpdate}
          />
          {/* Transformer for selected nodes - only for non-uploaded images */}
          {selectedImageIndices.length > 0 && (() => {
            // Check if any selected image is NOT uploaded (has resize enabled)
            const hasResizableImage = selectedImageIndices.some(idx => {
              const img = images[idx];
              if (!img || img.type === 'model3d') return false;

              // Check if it's an uploaded image - if so, disable resize
              const isUploaded =
                img.file || // Direct file upload
                (img.url && (
                  img.url.toLowerCase().startsWith('blob:') ||
                  img.url.toLowerCase().includes('/input/') ||
                  (img.url.toLowerCase().includes('upload-') && img.url.toLowerCase().includes('zata.ai'))
                ));

              // Only allow resize for non-uploaded images
              return !isUploaded;
            });

            // Only show Transformer if there are resizable images selected
            return hasResizableImage ? (
              <Transformer
                ref={transformerRef}
                keepRatio={true}
                rotateEnabled={true}
                rotateAnchorOffset={30}
                anchorSize={12}
                rotationSnaps={isShiftPressed ? [0, 45, 90, 135, 180, 225, 270, 315] : undefined}
                boundBoxFunc={(oldBox, newBox) => {
                  // Limit resize to prevent negative dimensions
                  if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            ) : null;
          })()}
        </Layer>
      </Stage>
      {/* 3D Models - rendered outside Konva as overlay */}
      <Model3DOverlay
        images={images.filter((img) => img.type === 'model3d')}
        allImages={images}
        stageRef={stageRef}
        onImageUpdate={onImageUpdate}
      />
      {/* Connection Nodes for uploaded images - rendered outside Konva as overlay */}
      <CanvasImageConnectionNodes
        images={images}
        stageRef={stageRef}
        position={position}
        scale={scale}
        selectedImageIndices={selectedImageIndices}
      />
      {/* Modal Overlays */}
      <ModalOverlays
        textInputStates={textInputStates}
        imageModalStates={imageModalStates}
        videoModalStates={videoModalStates}
        musicModalStates={musicModalStates}
        upscaleModalStates={upscaleModalStates}
        removeBgModalStates={removeBgModalStates}
        eraseModalStates={eraseModalStates}
        replaceModalStates={replaceModalStates}
        expandModalStates={expandModalStates}
        vectorizeModalStates={vectorizeModalStates}
        storyboardModalStates={storyboardModalStates}
        scriptFrameModalStates={scriptFrameModalStates}
        sceneFrameModalStates={sceneFrameModalStates}
        selectedTextInputId={selectedTextInputId}
        selectedTextInputIds={selectedTextInputIds}
        selectedImageModalId={selectedImageModalId}
        selectedImageModalIds={selectedImageModalIds}
        selectedVideoModalId={selectedVideoModalId}
        selectedVideoModalIds={selectedVideoModalIds}
        selectedMusicModalId={selectedMusicModalId}
        selectedMusicModalIds={selectedMusicModalIds}
        selectedUpscaleModalId={selectedUpscaleModalId}
        selectedUpscaleModalIds={selectedUpscaleModalIds}
        selectedRemoveBgModalId={selectedRemoveBgModalId}
        selectedRemoveBgModalIds={selectedRemoveBgModalIds}
        selectedEraseModalId={selectedEraseModalId}
        selectedEraseModalIds={selectedEraseModalIds}
        selectedReplaceModalId={selectedReplaceModalId}
        selectedReplaceModalIds={selectedReplaceModalIds}
        selectedExpandModalId={selectedExpandModalId}
        selectedExpandModalIds={selectedExpandModalIds}
        selectedVectorizeModalId={selectedVectorizeModalId}
        selectedVectorizeModalIds={selectedVectorizeModalIds}
        selectedStoryboardModalId={selectedStoryboardModalId}
        selectedStoryboardModalIds={selectedStoryboardModalIds}
        clearAllSelections={clearAllSelections}
        setTextInputStates={setTextInputStates}
        setSelectedTextInputId={setSelectedTextInputId}
        setSelectedTextInputIds={setSelectedTextInputIds}
        setSelectedImageIndices={setSelectedImageIndices}
        setImageModalStates={setImageModalStates}
        setSelectedImageModalId={setSelectedImageModalId}
        setSelectedImageModalIds={setSelectedImageModalIds}
        setVideoModalStates={setVideoModalStates}
        setSelectedVideoModalId={setSelectedVideoModalId}
        setSelectedVideoModalIds={setSelectedVideoModalIds}
        setMusicModalStates={setMusicModalStates}
        setSelectedMusicModalId={setSelectedMusicModalId}
        setSelectedMusicModalIds={setSelectedMusicModalIds}
        setUpscaleModalStates={setUpscaleModalStates}
        setSelectedUpscaleModalId={setSelectedUpscaleModalId}
        setSelectedUpscaleModalIds={setSelectedUpscaleModalIds}
        setRemoveBgModalStates={setRemoveBgModalStates}
        setSelectedRemoveBgModalId={setSelectedRemoveBgModalId}
        setSelectedRemoveBgModalIds={setSelectedRemoveBgModalIds}
        setEraseModalStates={setEraseModalStates}
        setSelectedEraseModalId={setSelectedEraseModalId}
        setSelectedEraseModalIds={setSelectedEraseModalIds}
        setReplaceModalStates={setReplaceModalStates}
        setSelectedReplaceModalId={setSelectedReplaceModalId}
        setSelectedReplaceModalIds={setSelectedReplaceModalIds}
        setExpandModalStates={setExpandModalStates}
        setSelectedExpandModalId={setSelectedExpandModalId}
        setSelectedExpandModalIds={setSelectedExpandModalIds}
        setVectorizeModalStates={setVectorizeModalStates}
        setSelectedVectorizeModalId={setSelectedVectorizeModalId}
        setSelectedVectorizeModalIds={setSelectedVectorizeModalIds}
        setStoryboardModalStates={setStoryboardModalStates}
        setScriptFrameModalStates={setScriptFrameModalStates}
        onScriptFramePositionChange={handleScriptFramePositionChange}
        onScriptFramePositionCommit={handleScriptFramePositionCommit}
        setSelectedStoryboardModalId={setSelectedStoryboardModalId}
        setSelectedStoryboardModalIds={setSelectedStoryboardModalIds}
        images={images}
        onTextCreate={onTextCreate}
        onTextScriptGenerated={handleTextScriptGenerated}
        onImageSelect={onImageSelect}
        onImageGenerate={onImageGenerate}
        onVideoSelect={onVideoSelect}
        onVideoGenerate={onVideoGenerate}
        onMusicSelect={onMusicSelect}
        onMusicGenerate={onMusicGenerate}
        generatedVideoUrl={generatedVideoUrl}
        generatedMusicUrl={generatedMusicUrl}
        stageRef={stageRef}
        scale={scale}
        position={position}
        onAddImageToCanvas={onAddImageToCanvas}
        onPersistImageModalCreate={onPersistImageModalCreate}
        onPersistImageModalMove={onPersistImageModalMove}
        onPersistImageModalDelete={onPersistImageModalDelete}
        onPersistVideoModalCreate={onPersistVideoModalCreate}
        onPersistVideoModalMove={onPersistVideoModalMove}
        onPersistVideoModalDelete={onPersistVideoModalDelete}
        onPersistMusicModalCreate={onPersistMusicModalCreate}
        onPersistMusicModalMove={onPersistMusicModalMove}
        onPersistMusicModalDelete={onPersistMusicModalDelete}
        onPersistTextModalCreate={onPersistTextModalCreate}
        onPersistTextModalMove={onPersistTextModalMove}
        onPersistTextModalDelete={onPersistTextModalDelete}
        onPersistUpscaleModalCreate={onPersistUpscaleModalCreate}
        onPersistUpscaleModalMove={onPersistUpscaleModalMove}
        onPersistUpscaleModalDelete={onPersistUpscaleModalDelete}
        onUpscale={onUpscale}
        onPersistRemoveBgModalCreate={onPersistRemoveBgModalCreate}
        onPersistRemoveBgModalMove={onPersistRemoveBgModalMove}
        onPersistRemoveBgModalDelete={onPersistRemoveBgModalDelete}
        onRemoveBg={onRemoveBg}
        onPersistEraseModalCreate={onPersistEraseModalCreate}
        onPersistEraseModalMove={onPersistEraseModalMove}
        onPersistEraseModalDelete={onPersistEraseModalDelete}
        onErase={onErase}
        onPersistReplaceModalCreate={onPersistReplaceModalCreate}
        onPersistReplaceModalMove={onPersistReplaceModalMove}
        onPersistReplaceModalDelete={onPersistReplaceModalDelete}
        onReplace={onReplace}
        onPersistExpandModalCreate={onPersistExpandModalCreate}
        onPersistExpandModalMove={onPersistExpandModalMove}
        onPersistExpandModalDelete={onPersistExpandModalDelete}
        onExpand={onExpand}
        onPersistVectorizeModalCreate={onPersistVectorizeModalCreate}
        onPersistVectorizeModalMove={onPersistVectorizeModalMove}
        onPersistVectorizeModalDelete={onPersistVectorizeModalDelete}
        onVectorize={onVectorize}
        onPersistStoryboardModalCreate={onPersistStoryboardModalCreate}
        onPersistStoryboardModalMove={onPersistStoryboardModalMove}
        onPersistStoryboardModalDelete={onPersistStoryboardModalDelete}
        onDeleteScriptFrame={handleDeleteScriptFrame}
        connections={connections}
        onConnectionsChange={onConnectionsChange}
        onPersistConnectorCreate={onPersistConnectorCreate}
        onPersistConnectorDelete={onPersistConnectorDelete}
        onPluginSidebarOpen={onPluginSidebarOpen}
      />
      {/* Action Icons for Uploaded Media */}
      {selectedImageIndex !== null && images[selectedImageIndex] && (
        <MediaActionIcons
          selectedImage={{
            ...images[selectedImageIndex],
            // Use real-time position if available (during drag), otherwise use imageData position
            x: selectedImageRealTimePosition?.x ?? images[selectedImageIndex].x,
            y: selectedImageRealTimePosition?.y ?? images[selectedImageIndex].y,
          }}
          selectedImageIndex={selectedImageIndex}
          scale={scale}
          position={position}
          onImageDelete={onImageDelete}
          onImageDuplicate={onImageDuplicate}
          setSelectedImageIndex={setSelectedImageIndex}
          setSelectedImageIndices={setSelectedImageIndices}
        />
      )}
      {/* Context Menu - Only for text elements, not for uploaded images/videos */}
      <ContextMenu
        isOpen={contextMenuOpen && contextMenuImageIndex !== null && images[contextMenuImageIndex]?.type === 'text'}
        onClose={() => {
          setContextMenuOpen(false);
          setContextMenuImageIndex(null);
          setContextMenuModalId(null);
          setContextMenuModalType(null);
        }}
        onDelete={() => {
          // Handle deletion for images/videos
          if (contextMenuImageIndex !== null && onImageDelete) {
            onImageDelete(contextMenuImageIndex);
            setSelectedImageIndex(null);
            setContextMenuOpen(false);
            setContextMenuImageIndex(null);
          }
          // Handle deletion for modals
          else if (contextMenuModalId !== null && contextMenuModalType) {
            if (contextMenuModalType === 'image') {
              if (onPersistImageModalDelete) {
                Promise.resolve(onPersistImageModalDelete(contextMenuModalId)).catch(console.error);
              }
              setImageModalStates(prev => prev.filter(m => m.id !== contextMenuModalId));
              setSelectedImageModalId(null);
            } else if (contextMenuModalType === 'video') {
              if (onPersistVideoModalDelete) {
                Promise.resolve(onPersistVideoModalDelete(contextMenuModalId)).catch(console.error);
              }
              setVideoModalStates(prev => prev.filter(m => m.id !== contextMenuModalId));
              setSelectedVideoModalId(null);
            } else if (contextMenuModalType === 'music') {
              if (onPersistMusicModalDelete) {
                Promise.resolve(onPersistMusicModalDelete(contextMenuModalId)).catch(console.error);
              }
              setMusicModalStates(prev => prev.filter(m => m.id !== contextMenuModalId));
              setSelectedMusicModalId(null);
            }
            setContextMenuOpen(false);
            setContextMenuModalId(null);
            setContextMenuModalType(null);
          }
        }}
        onDownload={() => {
          // Handle download for actual images/videos
          if (contextMenuImageIndex !== null && onImageDownload) {
            onImageDownload(contextMenuImageIndex);
          }
          // Handle download for modals
          else if (contextMenuModalId !== null && contextMenuModalType) {
            let urlToDownload: string | null = null;
            if (contextMenuModalType === 'image') {
              const modal = imageModalStates.find(m => m.id === contextMenuModalId);
              urlToDownload = modal?.generatedImageUrl || null;
            } else if (contextMenuModalType === 'video') {
              const modal = videoModalStates.find(m => m.id === contextMenuModalId);
              urlToDownload = modal?.generatedVideoUrl || null;
            } else if (contextMenuModalType === 'music') {
              const modal = musicModalStates.find(m => m.id === contextMenuModalId);
              urlToDownload = modal?.generatedMusicUrl || null;
            }

            if (urlToDownload) {
              // Download the file
              const link = document.createElement('a');
              link.href = urlToDownload;
              link.download = contextMenuModalType === 'image'
                ? `image-${Date.now()}.png`
                : contextMenuModalType === 'video'
                  ? `video-${Date.now()}.mp4`
                  : `music-${Date.now()}.mp3`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }
        }}
        onDuplicate={() => {
          // Handle duplicate for actual images/videos
          if (contextMenuImageIndex !== null && onImageDuplicate) {
            onImageDuplicate(contextMenuImageIndex);
          }
          // Handle duplicate for modals
          else if (contextMenuModalId !== null && contextMenuModalType) {
            if (contextMenuModalType === 'image') {
              const modal = imageModalStates.find(m => m.id === contextMenuModalId);
              if (modal) {
                // Create a duplicate modal to the right
                const newId = `image-${Date.now()}-${Math.random()}`;
                setImageModalStates(prev => [...prev, {
                  id: newId,
                  x: modal.x + 600 + 50, // 600px width + 50px spacing
                  y: modal.y, // Same Y position
                  generatedImageUrl: modal.generatedImageUrl,
                }]);
              }
            } else if (contextMenuModalType === 'video') {
              const modal = videoModalStates.find(m => m.id === contextMenuModalId);
              if (modal) {
                // Create a duplicate modal to the right
                const newId = `video-${Date.now()}-${Math.random()}`;
                setVideoModalStates(prev => [...prev, {
                  id: newId,
                  x: modal.x + 600 + 50, // 600px width + 50px spacing
                  y: modal.y, // Same Y position
                  generatedVideoUrl: modal.generatedVideoUrl,
                }]);
              }
            } else if (contextMenuModalType === 'music') {
              const modal = musicModalStates.find(m => m.id === contextMenuModalId);
              if (modal) {
                // Create a duplicate modal to the right
                const newId = `music-${Date.now()}-${Math.random()}`;
                setMusicModalStates(prev => [...prev, {
                  id: newId,
                  x: modal.x + 600 + 50, // 600px width + 50px spacing
                  y: modal.y, // Same Y position
                  generatedMusicUrl: modal.generatedMusicUrl,
                }]);
              }
            }
          }
        }}
        showDownload={!!(contextMenuImageIndex !== null && images[contextMenuImageIndex]?.type !== 'text' && images[contextMenuImageIndex]?.url) || !!(contextMenuModalId !== null && (
          (contextMenuModalType === 'image' && imageModalStates.find(m => m.id === contextMenuModalId)?.generatedImageUrl) ||
          (contextMenuModalType === 'video' && videoModalStates.find(m => m.id === contextMenuModalId)?.generatedVideoUrl) ||
          (contextMenuModalType === 'music' && musicModalStates.find(m => m.id === contextMenuModalId)?.generatedMusicUrl)
        ))}
        showDuplicate={!!(contextMenuImageIndex !== null && images[contextMenuImageIndex]?.type !== 'text' && images[contextMenuImageIndex]?.url) || !!(contextMenuModalId !== null && (
          (contextMenuModalType === 'image' && imageModalStates.find(m => m.id === contextMenuModalId)?.generatedImageUrl) ||
          (contextMenuModalType === 'video' && videoModalStates.find(m => m.id === contextMenuModalId)?.generatedVideoUrl) ||
          (contextMenuModalType === 'music' && musicModalStates.find(m => m.id === contextMenuModalId)?.generatedMusicUrl)
        ))}
      />

      {/* Avatar button (opens profile popup) */}
      <AvatarButton
        scale={scale}
        onClick={() => {
          setIsProfileOpen(true);
        }}
        isHidden={isUIHidden}
      />
      <SettingsPopup
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        scale={scale}
      />

    </div>
  );
};
