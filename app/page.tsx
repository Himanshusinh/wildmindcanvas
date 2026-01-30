'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CompareGenerator } from '@/modules/canvas-app/types';
import { Canvas } from '@/modules/canvas';
import GenerationQueue, { GenerationQueueItem } from '@/modules/canvas/GenerationQueue';
import { ToolbarPanel } from '@/modules/ui-global/ToolbarPanel';
import { Header } from '@/modules/ui-global/Header';
import { AuthGuard } from '@/modules/ui-global/AuthGuard';
import { Profile } from '@/modules/ui-global/Profile/Profile';
import LibrarySidebar from '@/modules/canvas/LibrarySidebar';
import PluginSidebar from '@/modules/canvas/PluginSidebar';
import { ImageUpload } from '@/core/types/canvas';
import { generateImageForCanvas, generateVideoForCanvas, upscaleImageForCanvas, removeBgImageForCanvas, vectorizeImageForCanvas, multiangleImageForCanvas, getCurrentUser, MediaItem } from '@/core/api/api';
import { createProject, getProject, listProjects, getCurrentSnapshot as apiGetCurrentSnapshot, setCurrentSnapshot as apiSetCurrentSnapshot, updateProject } from '@/core/api/canvasApi';
import { ProjectSelector } from '@/modules/ui-global/ProjectSelector/ProjectSelector';
import { CanvasProject, CanvasOp } from '@/core/api/canvasApi';
import { useProject } from '@/core/hooks/useProject';
import { useUIVisibility } from '@/core/hooks/useUIVisibility';
import { useIsMobile } from '@/core/hooks/useIsMobile';
import { buildProxyDownloadUrl, buildProxyResourceUrl, buildProxyMediaUrl, buildProxyThumbnailUrl } from '@/core/api/proxyUtils';
import { RealtimeClient, GeneratorOverlay } from '@/core/api/realtime';
import { buildSnapshotElements } from '@/modules/utils/buildSnapshotElements';
import { createImageHandlers } from '@/modules/handlers/imageHandlers';
import { createPluginHandlers } from '@/modules/handlers/pluginHandlers';
import { CanvasAppState, CanvasAppSetters, ScriptFrameGenerator, SceneFrameGenerator, NextSceneGenerator } from '@/modules/canvas-app/types';
import { CanvasTextState, ImageModalState, VideoModalState, MusicModalState, TextModalState } from '@/modules/canvas-overlays/types';
import { MobileRestrictionScreen } from '@/modules/ui-global/MobileRestrictionScreen';
import { useCanvasStore } from '@/modules/canvas-core/useCanvasStore';
import { SetNodesCommand } from '@/modules/canvas-core/commands';
import { convertLegacySnapshot } from '@/modules/canvas-core/utils';

interface CanvasAppProps {
  user: { uid: string; username: string; email: string; credits?: number } | null;
}

export function CanvasApp({ user }: CanvasAppProps) {

  // --- Text & Selection States (Bridge for Canvas Component) ---
  const [selectedCanvasTextId, setSelectedCanvasTextId] = useState<string | null>(null);
  const [selectedRichTextId, setSelectedRichTextId] = useState<string | null>(null);
  const [selectedCanvasTextIds, setSelectedCanvasTextIds] = useState<string[]>([]);
  const [selectedRichTextIds, setSelectedRichTextIds] = useState<string[]>([]);

  // Legacy Refs (Removed or No-op)
  // const refImages = useRef<Record<string, any>>({}); // Removed
  // const elementsRef = useRef<Record<string, any>>({}); // Removed

  const moveDebounceTimersRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Helper to debounce movement persistence
  const debounceMove = useCallback((type: string, id: string, updates: any, originalHandler: (id: string, updates: any) => Promise<void>) => {
    const timerKey = `${type}-${id}`;
    if (moveDebounceTimersRef.current[timerKey]) {
      clearTimeout(moveDebounceTimersRef.current[timerKey]);
    }
    moveDebounceTimersRef.current[timerKey] = setTimeout(async () => {
      await originalHandler(id, updates);
      delete moveDebounceTimersRef.current[timerKey];
    }, 500);
  }, []);
  const persistTimerRef = useRef<number | null>(null);
  const currentUser = user;
  const viewportCenterRef = useRef<{ x: number; y: number; scale: number }>({
    x: 25000, // Center of 50,000 x 50,000 infinite canvas
    y: 25000,
    scale: 1,
  });

  // Use project management hook
  const {
    projectId,
    projectName,
    showProjectSelector,
    isInitializing,
    setProjectId,
    setProjectName,
    setShowProjectSelector,
    startWithCreate,
  } = useProject({ currentUser });

  // --- LOCAL STATE MANAGEMENT (User Request: Remove strict snapshot & undo/redo) ---
  // --- STORE INTEGRATION (Replaced Legacy State) ---
  const canvasStore = useCanvasStore(projectId);
  const {
    images, setImages,
    imageGenerators, setImageGenerators,
    videoGenerators, setVideoGenerators,
    videoEditorGenerators, setVideoEditorGenerators,
    imageEditorGenerators, setImageEditorGenerators,
    musicGenerators, setMusicGenerators,
    upscaleGenerators, setUpscaleGenerators,
    multiangleCameraGenerators, setMultiangleCameraGenerators,
    removeBgGenerators, setRemoveBgGenerators,
    eraseGenerators, setEraseGenerators,
    expandGenerators, setExpandGenerators,
    vectorizeGenerators, setVectorizeGenerators,
    nextSceneGenerators, setNextSceneGenerators,
    compareGenerators, setCompareGenerators,
    storyboardGenerators, setStoryboardGenerators,
    scriptFrameGenerators, setScriptFrameGenerators,
    sceneFrameGenerators, setSceneFrameGenerators,
    textGenerators, setTextGenerators,
    canvasTextStates, setCanvasTextStates,
    richTextStates, setRichTextStates,
    groupContainerStates, setGroupContainerStates,
    connectors, setConnectors,
    generationQueue, setGenerationQueue,
    execute, undo, redo, canUndo, canRedo,
    doc
  } = canvasStore;

  // Use UI visibility hook
  const { isUIHidden, setIsUIHidden } = useUIVisibility();

  // Allow full-screen plugin popups (like Multiangle) to hide global UI chrome
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { hidden?: boolean; source?: string } | undefined;
      if (!detail) return;
      if (typeof detail.hidden === 'boolean') {
        setIsUIHidden(detail.hidden);
      }
    };
    window.addEventListener('wildmind:ui-hidden', handler as EventListener);
    return () => window.removeEventListener('wildmind:ui-hidden', handler as EventListener);
  }, [setIsUIHidden]);
  const openExternalVideoEditor = useCallback(() => {
    try {
      const externalBase = process.env.NEXT_PUBLIC_EDITOR_VIDEO_URL || 'https://editor-video.wildmindai.com';
      const safeBaseUrl = externalBase.startsWith('http://') || externalBase.startsWith('https://')
        ? externalBase
        : `https://${externalBase}`;
      const url = new URL(safeBaseUrl);
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
    } catch {
      try {
        window.open('https://editor-video.wildmindai.com', '_blank', 'noopener,noreferrer');
      } catch { }
    }
  }, []);

  const openExternalImageEditor = useCallback(() => {
    try {
      const externalBase = process.env.NEXT_PUBLIC_EDITOR_IMAGE_URL || 'https://editor-image.wildmindai.com';
      const safeBaseUrl = externalBase.startsWith('http://') || externalBase.startsWith('https://')
        ? externalBase
        : `https://${externalBase}`;
      const url = new URL(safeBaseUrl);
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
    } catch {
      try {
        window.open('https://editor-image.wildmindai.com', '_blank', 'noopener,noreferrer');
      } catch { }
    }
  }, []);




  // Use the store itself as the setters object (it matches the interface)
  const canvasSetters = canvasStore as unknown as CanvasAppSetters;

  // Compatibility stubs
  const loadSnapshot = useCallback((data: { elements: Record<string, any>; metadata?: any }) => {
    // This is now handled by the store or SetNodesCommand
    console.log('Legacy loadSnapshot called - converting to Command');
    const nodes = convertLegacySnapshot(data.elements || {});
    execute(new SetNodesCommand(nodes));
  }, [execute]);

  // Construct State Object for Persistence (Legacy compatibility if needed)
  const canvasState: CanvasAppState = {
    images,
    imageGenerators,
    videoGenerators,
    videoEditorGenerators,
    imageEditorGenerators,
    musicGenerators,
    upscaleGenerators,
    multiangleCameraGenerators,
    removeBgGenerators,
    eraseGenerators,
    expandGenerators,
    vectorizeGenerators,
    compareGenerators,
    nextSceneGenerators,
    storyboardGenerators,
    scriptFrameGenerators,
    sceneFrameGenerators,
    textGenerators,
    canvasTextStates,
    richTextStates,
    groupContainerStates,
    connectors,
    generationQueue,
    showImageGenerationModal: false,
  };



  // Track previous projectId to detect changes
  const prevProjectIdRef = useRef<string | null>(null);

  // Clear all state when project changes (new project or switching projects)
  useEffect(() => {
    // Only clear if projectId actually changed (not on initial mount with same projectId)
    if (projectId && prevProjectIdRef.current !== projectId) {
      // Reset all state to empty when project changes
      console.log('[Project] Clearing state for project change:', {
        from: prevProjectIdRef.current,
        to: projectId,
      });
      
      // CRITICAL: Reset snapshot loaded flag so new project can load
      snapshotLoadedRef.current = false;
      
      // Reset viewport to center
      viewportCenterRef.current = {
        x: 25000,
        y: 25000,
        scale: 1,
      };

      // Update ref to track current projectId
      prevProjectIdRef.current = projectId;
    } else if (!projectId) {
      // If projectId is cleared, reset the ref and loaded flag
      prevProjectIdRef.current = null;
      snapshotLoadedRef.current = false;
    }
  }, [projectId]); // Only run when projectId changes



  const handleViewportChange = (center: { x: number; y: number }, scale: number) => {
    viewportCenterRef.current = { x: center.x, y: center.y, scale };
  };





  const handleBulkDelete = useCallback(async (elementIds: string[]) => {
    if (!elementIds || elementIds.length === 0) return;

    const ids = new Set(elementIds);
    console.log('[BulkDelete] processing deletion of:', elementIds);

    setImages(prev => prev.filter(e => !ids.has(e.elementId || '')));
    setImageGenerators(prev => prev.filter(e => !ids.has(e.id)));
    setVideoGenerators(prev => prev.filter(e => !ids.has(e.id)));
    setVideoEditorGenerators(prev => prev.filter(e => !ids.has(e.id)));
    setImageEditorGenerators(prev => prev.filter(e => !ids.has(e.id)));
    setMusicGenerators(prev => prev.filter(e => !ids.has(e.id)));
    setUpscaleGenerators(prev => prev.filter(e => !ids.has(e.id)));
    setMultiangleCameraGenerators(prev => prev.filter(e => !ids.has(e.id)));
    setRemoveBgGenerators(prev => prev.filter(e => !ids.has(e.id)));
    setEraseGenerators(prev => prev.filter(e => !ids.has(e.id)));
    setExpandGenerators(prev => prev.filter(e => !ids.has(e.id)));
    setVectorizeGenerators(prev => prev.filter(e => !ids.has(e.id)));
    setNextSceneGenerators(prev => prev.filter(e => !ids.has(e.id)));
    setStoryboardGenerators(prev => prev.filter(e => !ids.has(e.id)));
    setScriptFrameGenerators(prev => prev.filter(e => !ids.has(e.id)));
    setSceneFrameGenerators(prev => prev.filter(e => !ids.has(e.id)));
    setTextGenerators(prev => prev.filter(e => !ids.has(e.id)));
    setCanvasTextStates(prev => prev.filter(e => !ids.has(e.id)));
    setRichTextStates(prev => prev.filter(e => !ids.has(e.id)));
    setGroupContainerStates(prev => prev.filter(e => !ids.has(e.id)));
    setConnectors(prev => prev.filter(c => !ids.has(c.id) && !ids.has(c.from) && !ids.has(c.to)));
    setCompareGenerators(prev => prev.filter(e => !ids.has(e.id)));

  }, []);




  // Helper: build elements map snapshot from current state
  // buildSnapshotElements is now imported from utils

  // Persist full snapshot on every interaction (debounced)
  // Use longer debounce for canvasTextStates to prevent lag during typing

  // Hydrate from current snapshot on project load
  useEffect(() => {
    const hydrate = async () => {
      if (!projectId) {
        // If projectId is cleared, reset the loaded flag
        snapshotLoadedRef.current = false;
        return;
      }

      // Store the projectId at the start of this effect to prevent race conditions
      const currentProjectId = projectId;

      // Skip if we already loaded this project's snapshot
      if (snapshotLoadedRef.current) {
        console.log('[Project] Snapshot already loaded for project:', currentProjectId);
        return;
      }

      // Small delay to ensure state has been cleared first
      await new Promise(resolve => setTimeout(resolve, 150));

      // Double-check projectId hasn't changed during the delay
      if (currentProjectId !== projectId) {
        console.log('[Project] ProjectId changed during snapshot load, aborting:', {
          started: currentProjectId,
          current: projectId,
        });
        return;
      }

      try {
        console.log('[Project] Loading snapshot for project:', currentProjectId);
        const { snapshot } = await apiGetCurrentSnapshot(currentProjectId);

        // Triple-check projectId hasn't changed after async call
        if (currentProjectId !== projectId) {
          console.log('[Project] ProjectId changed after snapshot fetch, ignoring snapshot:', {
            fetched: currentProjectId,
            current: projectId,
          });
          return;
        }

        if (snapshot === null) {
          console.log('[Project] No snapshot data (new/empty project):', currentProjectId);
          snapshotLoadedRef.current = true;
          loadSnapshot({ elements: {}, metadata: { version: '1.1', updatedAt: Date.now() } });
          setIsHydrated(true);
          return;
        }

        const localDoc = docRef.current;
        const localUpdatedAt = localDoc.updatedAt || 0;
        const remoteUpdatedAt = snapshot.metadata?.updatedAt || 0;

        // If local doc matches current project and is newer than remote, prefer local
        // This prevents overwriting fresh local changes (saved to localStorage 50ms debounce)
        // with stale backend data (saved to backend 2000ms debounce)
        if (
          localDoc.id === currentProjectId &&
          localDoc.version > 0 &&
          localUpdatedAt > remoteUpdatedAt
        ) {
          console.log('[Project] Local snapshot is newer, skipping backend hydration', {
            local: new Date(localUpdatedAt).toISOString(),
            remote: new Date(remoteUpdatedAt).toISOString(),
            localVersion: localDoc.version,
            remoteVersion: snapshot.metadata?.version
          });
          snapshotLoadedRef.current = true;
          setIsHydrated(true);
          return;
        }

        console.log('[Project] Hydrating from snapshot:', {
          elementCount: Object.keys(snapshot.elements || {}).length,
          opIndex: snapshot.snapshotOpIndex,
          localUpdatedAt: new Date(localUpdatedAt).toISOString(),
          remoteUpdatedAt: new Date(remoteUpdatedAt).toISOString()
        });

        loadSnapshot({
          elements: snapshot.elements || {},
          metadata: snapshot.metadata || { version: '1.1', updatedAt: Date.now() }
        });

        snapshotLoadedRef.current = true;
        setIsHydrated(true);
      } catch (e) {
        console.warn('No current snapshot to hydrate or failed to fetch', e);
      }
    };
    hydrate();
  }, [projectId]);

  // --- Auto-Save to Backend ---
  const docRef = useRef(doc);
  useEffect(() => { docRef.current = doc; }, [doc]);

  useEffect(() => {
    if (!projectId || !snapshotLoadedRef.current) return;

    const timeout = setTimeout(async () => {
      // CRITICAL: Check if projectId changed during debounce
      if (projectId !== docRef.current.id) {
        console.log('[AutoSave] ProjectId changed during save, aborting:', {
          expected: projectId,
          docId: docRef.current.id
        });
        return;
      }
      
      if (docRef.current.version === 0) return;

      const nodeCount = Object.keys(docRef.current.nodes).length;
      console.log('[AutoSave] Saving snapshot...', {
        projectId,
        docId: docRef.current.id,
        version: docRef.current.version,
        nodeCount,
        nodesKeys: Object.keys(docRef.current.nodes),
        nodes: docRef.current.nodes
      });

      // CRITICAL: Double-check projectId matches before saving
      if (projectId !== docRef.current.id) {
        console.error('[AutoSave] ProjectId mismatch, aborting save:', {
          projectId,
          docId: docRef.current.id
        });
        return;
      }

      if (nodeCount === 0 && (imageGenerators.length > 0 || videoGenerators.length > 0)) {
        console.error('[AutoSave] 🚨 CRITICAL STATE MISMATCH: Doc nodes empty but generators exist in compatibility view!', {
          docNodes: docRef.current.nodes,
          imageGeneratorsLength: imageGenerators.length
        });
      }

      await apiSetCurrentSnapshot(projectId, {
        elements: docRef.current.nodes as any,
        metadata: {
          version: docRef.current.version.toString(),
          updatedAt: docRef.current.updatedAt
        }
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [doc, projectId]);

  // Undo/Redo keyboard shortcuts


  // State definitions moved up to be available for canvasSetters
  const [selectedTool, setSelectedTool] = useState<'cursor' | 'move' | 'text' | 'image' | 'video' | 'music' | 'library' | 'plugin' | 'canvas-text' | 'rich-text'>('cursor');
  const [toolClickCounter, setToolClickCounter] = useState(0);
  const previousToolRef = useRef<'cursor' | 'move' | 'text' | 'image' | 'video' | 'music' | 'library' | 'plugin' | 'canvas-text' | 'rich-text'>('cursor');
  const isSpacePressedRef = useRef(false);
  const selectedToolRef = useRef(selectedTool);

  // Keep ref in sync with state
  useEffect(() => {
    selectedToolRef.current = selectedTool;
  }, [selectedTool]);

  const richTextStatesRef = useRef(richTextStates);
  useEffect(() => {
    richTextStatesRef.current = richTextStates;
  }, [richTextStates]);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isPluginSidebarOpen, setIsPluginSidebarOpen] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null);

  // Create state and setters objects...

  // Create state and setters objects for handlers (after all dependencies are defined, including processMediaFile)
  // Note: handlers are created here but processMediaFile is defined later - we'll use a wrapper

  const snapshotLoadedRef = useRef(false);
  const [isHydrated, setIsHydrated] = useState(false);


  // Handlers will be created after processMediaFile is defined

  // Handler assignments will be done after handlers are created (after processMediaFile)

  const handleMultipleFilesUpload = (files: File[]) => {
    // Find the main GLTF file
    const gltfFile = files.find(f => f.name.toLowerCase().endsWith('.gltf'));
    if (!gltfFile) {
      // If no GLTF file, process files individually
      files.forEach((file, index) => {
        processMediaFile(file, images.length + index);
      });
      return;
    }

    // Create a map of related files (bin, textures, etc.)
    const relatedFiles = new Map<string, { file: File; url: string }>();
    files.forEach(file => {
      if (file !== gltfFile) {
        const fileName = file.name;
        const url = URL.createObjectURL(file);
        const fileInfo = { file, url };

        // Store with multiple keys for flexible lookup
        // 1. Full filename
        relatedFiles.set(fileName, fileInfo);

        // 2. Just the filename (without path)
        const pathParts = fileName.split(/[/\\]/);
        const justFileName = pathParts[pathParts.length - 1];
        if (justFileName !== fileName) {
          relatedFiles.set(justFileName, fileInfo);
        }

        // 3. Filename with common texture paths
        // GLTF files often reference textures like "textures/image.png"
        const normalizedPath = fileName.replace(/\\/g, '/');
        relatedFiles.set(normalizedPath, fileInfo);

        // 4. Just the base name (without extension) for partial matching
        const baseName = justFileName.split('.').slice(0, -1).join('.');
        if (baseName) {
          relatedFiles.set(baseName, fileInfo);
        }
      }
    });

    // Process the GLTF file with related files
    const url = URL.createObjectURL(gltfFile);
    const center = viewportCenterRef.current;
    const offsetX = (images.length % 3) * 50;
    const offsetY = Math.floor(images.length / 3) * 50;
    const modelX = center.x - 400 / 2 + offsetX;
    const modelY = center.y - 400 / 2 + offsetY;

    const elementId = `element - ${Date.now()} -${Math.random().toString(36).substr(2, 9)} `;
    const newImage: ImageUpload = {
      file: gltfFile,
      url,
      type: 'model3d',
      x: modelX,
      y: modelY,
      width: 400,
      height: 400,
      rotationX: 0,
      rotationY: 0,
      zoom: 1,
      elementId,
      relatedFiles,
    };

    // Create Element in local state (optimistic + save implicit via autosave)
    setImages(prev => [...prev, newImage]);
  };

  const processMediaFile = async (file: File, offsetIndex: number = 0) => {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    // 1. Generate deterministic IDs safely
    const baseId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const modalId = fileType.startsWith('video/') ? `video-${baseId}` : `image-${baseId}`;
    const elementId = `element-${baseId}`;

    // 2. Create local blob URL for immediate display
    const blobUrl = URL.createObjectURL(file);

    // 3. Define background upload logic
    const uploadInBackground = async () => {
      if (!projectId) return;

      try {
        const convertFileToDataUri = (file: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        };

        const isImage = fileType.startsWith('image/');
        const isVideoFile = fileType.startsWith('video/') ||
          ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.3gp']
            .some(ext => fileName.endsWith(ext));

        if (isImage || isVideoFile) {
          const dataUri = await convertFileToDataUri(file);
          const { saveUploadedMedia } = await import('@/core/api/api');
          const result = await saveUploadedMedia(dataUri, isImage ? 'image' : 'video', projectId);

          if (result.success && result.url) {
            // 4. On success, update the existing node with the real URL
            if (isImage) {
              setImageGenerators(prev => prev.map(g => g.id === modalId ? { ...g, generatedImageUrl: result.url } : g));
            } else {
              setVideoGenerators(prev => prev.map(g => g.id === modalId ? { ...g, generatedVideoUrl: result.url } : g));
            }

            // Trigger library refresh
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('library-refresh'));
            }, 1000);
          }
        }
      } catch (err) {
        console.warn('[processMediaFile] Background upload failed, keeping local blob:', err);
      }
    };

    // Trigger upload but don't await it
    uploadInBackground();

    // 4. Render UI immediately using blobUrl
    const isModel3D = ['.obj', '.gltf', '.glb', '.fbx', '.mb', '.ma'].some(ext => fileName.endsWith(ext));
    const isVideo = fileType.startsWith('video/') || ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.3gp'].some(ext => fileName.endsWith(ext));

    // Calculate position
    const center = viewportCenterRef.current;
    const offsetX = (offsetIndex % 3) * 50;
    const offsetY = Math.floor(offsetIndex / 3) * 50;

    if (isModel3D) {
      const modelX = center.x - 200 + offsetX;
      const modelY = center.y - 200 + offsetY;
      setImages(prev => [...prev, {
        type: 'model3d',
        url: blobUrl,
        x: modelX, y: modelY, width: 400, height: 400,
        zoom: 1, rotationX: 0, rotationY: 0,
        elementId
      }]);

    } else if (isVideo) {
      const video = document.createElement('video');
      video.src = blobUrl;
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const naturalWidth = video.videoWidth || 800;
        const naturalHeight = video.videoHeight || 600;
        const maxFrameWidth = 600;
        const aspectRatio = naturalWidth / naturalHeight;
        const frameWidth = maxFrameWidth;
        let frameHeight = Math.max(400, Math.round(maxFrameWidth / aspectRatio));
        if (naturalHeight > naturalWidth) {
          frameHeight = Math.max(400, Math.round(maxFrameWidth * aspectRatio));
        }

        const modalX = center.x - frameWidth / 2 + offsetX;
        const modalY = center.y - frameHeight / 2 + offsetY;

        setVideoGenerators(prev => [...prev, {
          id: modalId,
          x: modalX, y: modalY,
          frameWidth, frameHeight,
          model: 'Uploaded Video',
          frame: 'Frame',
          aspectRatio: `${Math.round(aspectRatio * 10) / 10}: 1`,
          prompt: '',
          duration: video.duration || 5,
          resolution: '720p',
          generatedVideoUrl: blobUrl
        }]);
      };
    } else {
      // Image logic
      const img = new Image();
      img.onload = () => {
        const naturalWidth = img.naturalWidth || 800;
        const naturalHeight = img.naturalHeight || 600;
        const maxFrameWidth = 600;
        const aspectRatio = naturalWidth / naturalHeight;
        const frameWidth = maxFrameWidth;
        let frameHeight = Math.max(400, Math.round(maxFrameWidth / aspectRatio));
        if (naturalHeight > naturalWidth) {
          frameHeight = Math.max(400, Math.round(maxFrameWidth * aspectRatio));
        }

        const modalX = center.x - frameWidth / 2 + offsetX;
        const modalY = center.y - frameHeight / 2 + offsetY;

        setImageGenerators(prev => [...prev, {
          id: modalId,
          x: modalX, y: modalY,
          frameWidth, frameHeight,
          model: 'Uploaded Image',
          frame: 'Frame',
          aspectRatio: `${Math.round(aspectRatio * 10) / 10}: 1`,
          prompt: '',
          generatedImageUrl: blobUrl
        }]);
      };
      img.src = blobUrl;
    }
  };

  // Wrap snapshot actions


  // Now that processMediaFile is defined, create the actual handlers
  const imageHandlers = createImageHandlers(
    canvasSetters as any,
    projectId
  );

  const pluginHandlers = createPluginHandlers(
    canvasSetters as any,
    projectId
  );

  // Pass setVideoEditorGenerators to canvasSetters (need to update canvasSetters object first)
  // But canvasSetters is created before this. We need to ensure it includes setVideoEditorGenerators.
  // Actually, canvasSetters is created in page.tsx but passed to createPluginHandlers.
  // I need to update where canvasSetters is defined.


  // Now assign all handler functions (after handlers are created)
  const handleImageUpdate = imageHandlers.handleImageUpdate;
  const handleImageDelete = imageHandlers.handleImageDelete;
  const handleImageDownload = imageHandlers.handleImageDownload;
  const handleImageDuplicate = imageHandlers.handleImageDuplicate;
  // Use local handlers that have access to processMediaFile
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMultipleFilesUpload(Array.from(e.target.files));
    }
  };
  const handleImagesDrop = handleMultipleFilesUpload;
  const handleImageSelect = (file: File) => processMediaFile(file);
  const handleImageGenerate = imageHandlers.handleImageGenerate;
  const handleTextCreate = imageHandlers.handleTextCreate;
  const handleAddImageToCanvas = imageHandlers.handleAddImageToCanvas;



  const handleToolSelect = async (tool: 'cursor' | 'move' | 'text' | 'image' | 'video' | 'music' | 'library' | 'plugin' | 'canvas-text' | 'rich-text') => {
    // Always update to trigger effect, even if tool is the same
    // Use counter to force re-render when clicking same tool again
    setToolClickCounter(prev => prev + 1);
    if (tool === selectedTool) {
      setToolClickCounter(prev => prev + 1);
    }

    // Update previousToolRef when user manually selects a tool (unless Space is currently pressed)
    // This ensures proper restoration when Space is released
    // Note: We update for all tools, so if user manually selects 'move', then presses Space,
    // when Space is released we restore to 'move' (the tool they manually selected)
    if (!isSpacePressedRef.current) {
      previousToolRef.current = tool;
    }

    setSelectedTool(tool);
    console.log('Selected tool:', tool);

    // Open image modal when image tool is selected
    if (tool === 'image') {
      setIsImageModalOpen(true);
    }

    // Open video modal when video tool is selected
    if (tool === 'video') {
      setIsVideoModalOpen(true);
    }

    // Open music modal when music tool is selected
    if (tool === 'music') {
      setIsMusicModalOpen(true);
    }

    // Open library sidebar when library tool is selected
    if (tool === 'library') {
      setIsLibraryOpen(true);
    }

    // Open plugin sidebar when plugin tool is selected
    if (tool === 'plugin') {
      setIsPluginSidebarOpen(true);
    }
    // Modals for tools
    if (tool === 'image') setIsImageModalOpen(true);
    if (tool === 'video') setIsVideoModalOpen(true);
    if (tool === 'music') setIsMusicModalOpen(true);
    if (tool === 'library') setIsLibraryOpen(true);
    if (tool === 'plugin') setIsPluginSidebarOpen(true);

    if (tool === 'plugin') setIsPluginSidebarOpen(true);

    // Rich Text creation is now handled in useCanvasEvents.ts to support smart positioning
    // if (tool === 'rich-text') { ... }
  };



  // Space key hold for temporary move mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Space key
      if (e.code !== 'Space' && e.key !== ' ') return;

      // Don't activate if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isInputElement = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
      const isContentEditable = target?.hasAttribute('contenteditable') || target?.getAttribute('contenteditable') === 'true';

      if (isInputElement || isContentEditable) {
        return; // Let Space work normally in inputs
      }

      // Prevent default browser behavior (scrolling)
      e.preventDefault();

      // If Space is already pressed, ignore
      if (isSpacePressedRef.current) return;

      isSpacePressedRef.current = true;

      // Save current tool (only if not already in move mode)
      // This ensures we restore to the correct tool when Space is released
      const currentTool = selectedToolRef.current;
      if (currentTool !== 'move') {
        previousToolRef.current = currentTool;
        setSelectedTool('move');
      }
      // If already in move mode, don't change anything (user might have manually selected move)
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Only handle Space key
      if (e.code !== 'Space' && e.key !== ' ') return;

      // Don't interfere if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isInputElement = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
      const isContentEditable = target?.hasAttribute('contenteditable') || target?.getAttribute('contenteditable') === 'true';

      if (isInputElement || isContentEditable) {
        return; // Let Space work normally in inputs
      }

      // Prevent default browser behavior
      e.preventDefault();

      // If Space was pressed, restore previous tool
      if (isSpacePressedRef.current) {
        isSpacePressedRef.current = false;
        // Only restore if we're currently in move mode (to avoid overriding manual tool selection)
        const currentTool = selectedToolRef.current;
        if (currentTool === 'move') {
          setSelectedTool(previousToolRef.current);
        }
      }
    };

    // Use capture phase to catch events early
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true } as any);
      window.removeEventListener('keyup', handleKeyUp, { capture: true } as any);

      // Cleanup: if Space was held when component unmounts, restore tool
      if (isSpacePressedRef.current && selectedToolRef.current === 'move') {
        setSelectedTool(previousToolRef.current);
      }
    };
  }, []); // Empty deps - we use refs to avoid stale closures


  const handleProjectSelect = (project: CanvasProject) => {
    // CRITICAL: Reset snapshot loaded flag when selecting a project
    snapshotLoadedRef.current = false;
    setProjectId(project?.id || null);
    setShowProjectSelector(false);
  };

  const handleToolbarUpload = (files: File[]) => {
    handleMultipleFilesUpload(files);
  };

  const handlePluginCreation = (pluginId: string, x?: number, y?: number) => {
    const center = viewportCenterRef.current;
    const finalX = x ?? center.x - 200;
    const finalY = y ?? center.y - 200;
    const id = `${pluginId}-${Date.now()}`;

    // Helper to add generator based on type
    const addGen = (setter: React.Dispatch<React.SetStateAction<any[]>>, type: string, extra: any = {}) => {
      setter(prev => [...prev, { id, x: finalX, y: finalY, type, ...extra }]);
    };

    switch (pluginId) {
      case 'image-editor':
        addGen(setImageEditorGenerators as any, 'image-editor-plugin');
        break;
      case 'video-editor':
        addGen(setVideoEditorGenerators as any, 'video-editor-plugin');
        break;
      case 'upscale':
        addGen(setUpscaleGenerators, 'upscale-plugin');
        break;
      case 'remove-bg':
      case 'removebg':
        addGen(setRemoveBgGenerators, 'removebg-plugin');
        break;
      case 'erase':
        addGen(setEraseGenerators, 'erase-plugin');
        break;
      case 'expand':
        addGen(setExpandGenerators, 'expand-plugin');
        break;
      case 'vectorize':
        addGen(setVectorizeGenerators, 'vectorize-plugin');
        break;
      case 'multiangle':
      case 'multiangle-camera':
        addGen(setMultiangleCameraGenerators, 'multiangle-camera-plugin');
        break;
      case 'compare':
        addGen(setCompareGenerators, 'compare-plugin', { width: 600, height: 400 });
        break;
      case 'next-scene':
        addGen(setNextSceneGenerators, 'next-scene-plugin');
        break;
      case 'storyboard':
        addGen(setStoryboardGenerators, 'storyboard-plugin');
        break;
      case 'script-frame':
        addGen(setScriptFrameGenerators, 'script-frame');
        break;
      case 'scene-frame':
        addGen(setSceneFrameGenerators, 'scene-frame');
        break;
    }
  };

  const addMediaToCanvas = (media: MediaItem, x?: number, y?: number) => {
    const mediaUrl = media.url || media.thumbnail || '';

    if (media.type === 'plugin' && media.plugin) {
      handlePluginCreation(media.plugin.id, x, y);
      return;
    }

    // Determine media type
    let mediaType: 'image' | 'video' | 'text' = 'image';
    if (media.type === 'video' || mediaUrl.match(/\.(mp4|webm|mov)$/i)) {
      mediaType = 'video';
    } else if (media.type === 'music' || mediaUrl.match(/\.(mp3|wav|ogg)$/i)) {
      mediaType = 'video'; // Treat music as video for canvas display
    }

    // For images, create an ImageUploadModal frame instead of directly adding to canvas
    if (mediaType === 'image') {
      const imageUrlForDimensions = (media as any).avifUrl ||
        ((mediaUrl.startsWith('http') && !mediaUrl.includes('/api/proxy/'))
          ? buildProxyThumbnailUrl(mediaUrl, 2048, 85, 'avif')
          : mediaUrl);

      const img = new Image();
      img.crossOrigin = 'anonymous';

      const createModal = (width: number = 600, height: number = 400, aspectRatio: string = '1:1') => {
        const viewportCenter = viewportCenterRef.current;
        const modalX = x !== undefined ? x - width / 2 : viewportCenter.x - width / 2;
        const modalY = y !== undefined ? y - height / 2 : viewportCenter.y - height / 2;

        const modalId = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const flattenedMeta = {
          generatedImageUrl: mediaUrl,
          sourceImageUrl: mediaUrl,
          frameWidth: width,
          frameHeight: height,
          model: 'Library Image',
          frame: 'Frame',
          aspectRatio,
          prompt: '',
        };

        setImageGenerators(prev => [...prev, {
          id: modalId,
          x: modalX, y: modalY,
          ...flattenedMeta
        }]);
        console.log('[Library] Created image modal:', modalId);
      };

      img.onload = () => {
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;
        const maxFrameWidth = 600;
        const aspectRatio = naturalWidth / naturalHeight;
        const frameWidth = maxFrameWidth;
        let frameHeight = Math.max(400, Math.round(maxFrameWidth / aspectRatio));

        if (naturalHeight > naturalWidth) {
          frameHeight = Math.max(400, Math.round(maxFrameWidth * aspectRatio));
        }

        createModal(frameWidth, frameHeight, `${Math.round(aspectRatio * 10) / 10}: 1`);
      };

      img.onerror = () => {
        console.warn('[Library] Failed to load image, using defaults:', mediaUrl);
        createModal(600, 400, '1:1');
      };

      img.src = imageUrlForDimensions;

    } else if (mediaType === 'video') {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        const viewportCenter = viewportCenterRef.current;
        const naturalWidth = video.videoWidth;
        const naturalHeight = video.videoHeight;
        const maxFrameWidth = 600;
        const aspectRatio = naturalWidth / naturalHeight;
        const frameWidth = maxFrameWidth;
        let frameHeight = Math.max(400, Math.round(maxFrameWidth / aspectRatio));

        if (naturalHeight > naturalWidth) {
          frameHeight = Math.max(400, Math.round(maxFrameWidth * aspectRatio));
        }

        const modalX = x !== undefined ? x - frameWidth / 2 : viewportCenter.x - frameWidth / 2;
        const modalY = y !== undefined ? y - frameHeight / 2 : viewportCenter.y - frameHeight / 2;
        const modalId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const flattenedMeta = {
          generatedVideoUrl: mediaUrl,
          frameWidth,
          frameHeight,
          model: 'Library Video',
          frame: 'Frame',
          aspectRatio: `${Math.round(aspectRatio * 10) / 10}: 1`,
          prompt: '',
          duration: 5,
          resolution: '720p',
        };

        setVideoGenerators(prev => [...prev, {
          id: modalId,
          x: modalX, y: modalY,
          frameWidth, frameHeight,
          model: 'Library Video',
          generatedVideoUrl: mediaUrl,
          aspectRatio: `${Math.round(aspectRatio * 10) / 10}: 1`,
          duration: 5,
          resolution: '720p',
          prompt: '',
          frame: 'Frame'
        }]);
      };

      video.onerror = () => {
        console.warn('[Library] Failed to load video, using defaults:', mediaUrl);
        const viewportCenter = viewportCenterRef.current;
        const modalX = x !== undefined ? x - 300 : viewportCenter.x - 300;
        const modalY = y !== undefined ? y - 200 : viewportCenter.y - 200;
        const modalId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const flattenedMeta = {
          generatedVideoUrl: mediaUrl,
          frameWidth: 600,
          frameHeight: 400,
          model: 'Library Video',
          frame: 'Frame',
          aspectRatio: '16:9',
          prompt: '',
          duration: 5,
          resolution: '720p',
        };

        setVideoGenerators(prev => [...prev, {
          id: modalId,
          x: modalX, y: modalY,
          frameWidth: 600, frameHeight: 400,
          model: 'Library Video',
          generatedVideoUrl: mediaUrl,
          aspectRatio: '16:9',
          duration: 5,
          resolution: '720p',
          prompt: '',
          frame: 'Frame'
        }]);
      };

      video.src = mediaUrl;
    } else {
      // Fallback for raw media types
      const elementId = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const viewportCenter = viewportCenterRef.current;
      const canvasX = x !== undefined ? x : viewportCenter.x - 200;
      const canvasY = y !== undefined ? y : viewportCenter.y - 200;

      const newMedia: any = {
        type: mediaType,
        url: mediaUrl,
        x: canvasX,
        y: canvasY,
        width: 400,
        height: 400,
        elementId,
        meta: {
          url: mediaUrl,
          mediaId: media.mediaId,
          storagePath: media.storagePath,
        }
      };

      setImages(prev => [...prev, {
        type: mediaType as any,
        url: mediaUrl,
        x: canvasX, y: canvasY, width: 400, height: 400,
        elementId,
        meta: newMedia.meta
      }]);
    }
  };

  const handleLibraryMediaSelect = (media: MediaItem) => {
    addMediaToCanvas(media);
    setIsLibraryOpen(false);
  };

  const handleLibraryMediaDrop = (media: MediaItem, x: number, y: number) => {
    addMediaToCanvas(media, x, y);
  };

  const handleProjectNameChange = async (name: string) => {
    setProjectName(name);
    localStorage.setItem('canvas-project-name', name);

    // Update project name in backend if we have a project ID
    if (projectId) {
      try {
        await updateProject(projectId, { name });
      } catch (error) {
        console.error('Failed to update project name:', error);
      }
    }
  };


  // handleImageSelect and handleImageGenerate are now assigned after handlers are created (above)

  const handleVideoSelect = (file: File) => {
    // Process the selected video file
    processMediaFile(file, images.length);
  };

  const handleVideoGenerate = async (prompt: string, model: string, frame: string, aspectRatio: string, duration: number, resolution?: string, modalId?: string, firstFrameUrl?: string, lastFrameUrl?: string): Promise<{ generationId?: string; taskId?: string; provider?: string } | null> => {
    if (!projectId || !prompt.trim()) {
      console.error('Missing projectId or prompt');
      return { generationId: undefined, taskId: undefined };
    }

    // Add to generation queue
    const queueId = `video - ${modalId || 'video'} -${Date.now()} -${Math.random().toString(36).slice(2)} `;
    const queueItem: GenerationQueueItem = {
      id: queueId,
      type: 'video',
      operationName: 'Generating Video',
      prompt: prompt.trim(),
      model,
      total: 1,
      index: 1,
      startedAt: Date.now(),
    };
    setGenerationQueue((prev) => [...prev, queueItem]);

    try {
      console.log('Generate video:', { prompt, model, frame, aspectRatio, duration, resolution, firstFrameUrl, lastFrameUrl });

      // Call video generation API
      const result = await generateVideoForCanvas(
        prompt,
        model,
        aspectRatio,
        projectId,
        duration,
        resolution || '1080p',
        firstFrameUrl,
        lastFrameUrl
      );

      console.log('Video generation started:', result);

      // Keep in queue - will be removed when video generation completes (handled by polling in VideoModalOverlays)
      // The queue item will remain visible until completion

      // Return provider info so frontend knows which service to poll
      return {
        generationId: result.generationId,
        taskId: result.taskId,
        provider: result.provider, // 'fal', 'replicate', 'minimax', or 'runway'
      };
    } catch (error: any) {
      console.error('Error generating video:', error);
      // Remove from queue on error
      setGenerationQueue((prev) => prev.filter((item) => item.id !== queueId));
      alert(error.message || 'Failed to generate video. Please try again.');
      return { generationId: undefined, taskId: undefined };
    }
  };

  const handleMusicSelect = (file: File) => {
    // Process the selected music file
    processMediaFile(file, images.length);
  };

  const handleMusicGenerate = async (prompt: string, model: string, frame: string, aspectRatio: string): Promise<string | null> => {
    console.log('Generate music:', { prompt, model, frame, aspectRatio });
    // TODO: Implement music generation API call here
    // For now, just close the modal
    // When music is generated, set the generatedMusicUrl
    // setGeneratedMusicUrl(generatedMusicUrl);
    return null;
  };

  const handleClearStudio = useCallback(() => {
    loadSnapshot({ elements: {}, metadata: { version: '1.1', viewport: viewportCenterRef.current } });
  }, []);

  if (isInitializing) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Canvas...</p>
        </div>
      </div>
    );
  }

  // --- Text & Selection States (Bridge for Canvas Component) ---
  // (State definitions moved to top of component)

  return (
    <main className="w-screen h-screen overflow-hidden bg-gray-100">
      {showProjectSelector && (
        <ProjectSelector
          onProjectSelect={handleProjectSelect}
          currentProjectId={projectId}
          startWithCreate={startWithCreate}
        />
      )}
      <div className="w-full h-full relative">
        {projectId && (
          <Header
            projectName={projectName}
            onProjectNameChange={handleProjectNameChange}
            onSwitchProject={() => setShowProjectSelector(true)}
            onUndo={canvasStore.undo}
            onRedo={canvasStore.redo}
            canUndo={canvasStore.canUndo}
            canRedo={canvasStore.canRedo}
            isHidden={isUIHidden}
          />
        )}
        {projectId ? (
          <>
            <Canvas
              key={projectId}
              isUIHidden={isUIHidden}
              initialGroupContainerStates={groupContainerStates}
              // Removed initialCenter/Scale (undefined/legacy - handled by snapshot viewport)
              images={images}
              // setImages removed
              onClearStudio={handleClearStudio}
              onViewportChange={handleViewportChange}
              onImageUpdate={handleImageUpdate}
              onImageDelete={handleImageDelete}
              onBulkDelete={handleBulkDelete}
              undo={canvasStore.undo}
              redo={canvasStore.redo}
              canUndo={canvasStore.canUndo}
              canRedo={canvasStore.canRedo}
              onImageDownload={handleImageDownload}
              onImageDuplicate={handleImageDuplicate}
              onImagesDrop={handleImagesDrop}
              onLibraryMediaDrop={handleLibraryMediaDrop}
              selectedTool={selectedTool}
              onTextCreate={handleTextCreate}
              toolClickCounter={toolClickCounter}
              isImageModalOpen={isImageModalOpen}
              onImageModalClose={() => setIsImageModalOpen(false)}
              onImageSelect={handleImageSelect}
              onImageGenerate={handleImageGenerate}
              onPersistImageModalCreate={async (modal) => {
                setImageGenerators(prev => [...prev, {
                  ...modal,
                  type: 'image-generator'
                } as any]);
              }}
              onPersistImageModalMove={async (id, updates) => {
                // Update generators (frames)
                setImageGenerators(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
                // Update images (media items) - keep this for uploaded images
                setImages(prev => prev.map(img => (img.elementId === id) ? { ...img, ...updates } : img));
              }}
              onPersistImageModalDelete={async (id) => {
                setImageGenerators(prev => prev.filter(m => m.id !== id));
              }}
              generatedImageUrl={generatedImageUrl}
              isVideoModalOpen={isVideoModalOpen}
              onVideoModalClose={() => setIsVideoModalOpen(false)}
              onVideoSelect={handleVideoSelect}
              onVideoGenerate={handleVideoGenerate}
              onPersistVideoModalCreate={async (modal) => {
                setVideoGenerators(prev => [...prev, {
                  ...modal,
                  type: 'video-generator' // Ensure type is set
                } as any]);
              }}
              onPersistVideoModalMove={async (id, updates) => {
                setVideoGenerators(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
              }}
              onPersistVideoModalDelete={async (id) => {
                setVideoGenerators(prev => prev.filter(m => m.id !== id));
              }}
              generatedVideoUrl={generatedVideoUrl}
              isMusicModalOpen={isMusicModalOpen}
              onMusicModalClose={() => setIsMusicModalOpen(false)}
              onMusicSelect={handleMusicSelect}
              onMusicGenerate={handleMusicGenerate}
              onPersistMusicModalCreate={async (modal) => {
                setMusicGenerators(prev => [...prev, {
                  ...modal,
                  type: 'music-generator'
                } as any]);
              }}
              onPersistMusicModalMove={async (id, updates) => {
                setMusicGenerators(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
              }}
              onPersistMusicModalDelete={async (id) => {
                setMusicGenerators(prev => prev.filter(m => m.id !== id));
              }}
              generatedMusicUrl={generatedMusicUrl}
              onAddImageToCanvas={imageHandlers.handleAddImageToCanvas}
              projectId={projectId}
              externalImageModals={imageGenerators}
              externalVideoModals={videoGenerators}
              externalVideoEditorModals={videoEditorGenerators}
              externalImageEditorModals={imageEditorGenerators}
              externalMusicModals={musicGenerators}
              externalUpscaleModals={upscaleGenerators}
              externalMultiangleCameraModals={multiangleCameraGenerators}
              externalCompareModals={compareGenerators}
              externalRemoveBgModals={removeBgGenerators}
              externalEraseModals={eraseGenerators}
              externalExpandModals={expandGenerators}
              externalVectorizeModals={vectorizeGenerators}
              externalNextSceneModals={nextSceneGenerators}
              externalStoryboardModals={storyboardGenerators}
              externalScriptFrameModals={scriptFrameGenerators}
              externalSceneFrameModals={sceneFrameGenerators}
              externalTextModals={textGenerators}
              canvasTextStates={canvasTextStates}
              setCanvasTextStates={setCanvasTextStates}

              selectedRichTextId={selectedRichTextId}
              setSelectedRichTextId={setSelectedRichTextId}
              // Stub plurals if needed by interface but not used in logic
              selectedCanvasTextId={selectedCanvasTextId}
              setSelectedCanvasTextId={setSelectedCanvasTextId}
              selectedCanvasTextIds={[]}
              setSelectedCanvasTextIds={setSelectedCanvasTextIds}
              selectedRichTextIds={[]}
              setSelectedRichTextIds={setSelectedRichTextIds}
              connections={connectors}
              onConnectionsChange={(conns: any[]) => {
                // Logic to sync connections? 
                // For now, if local drag, we assume react-flow handles temp state.
                // We only persist on create/delete.
              }}
              onPersistConnectorCreate={async (connector) => {
                // ✅ VALIDATION: Limit image-to-video connections to maximum 2
                const targetVideoId = connector.to;
                const sourceImageId = connector.from;
                
                // Helper function to check if a node ID is an image node
                const isImageNode = (nodeId: string): boolean => {
                  return imageGenerators.some(ig => ig.id === nodeId) ||
                         images.some(img => (img as any).elementId === nodeId || (img as any).id === nodeId);
                };
                
                // Helper function to check if a node ID is a video node
                const isVideoNode = (nodeId: string): boolean => {
                  return videoGenerators.some(vg => vg.id === nodeId);
                };
                
                // Check if this is an image-to-video connection
                const isTargetVideo = isVideoNode(targetVideoId);
                const isSourceImage = isImageNode(sourceImageId);
                
                if (isTargetVideo && isSourceImage) {
                  // Count existing connections from images to this video
                  const existingImageToVideoConnections = connectors.filter(c => 
                    c.to === targetVideoId && isImageNode(c.from)
                  );
                  
                  if (existingImageToVideoConnections.length >= 2) {
                    console.warn(`[Connection Validation] ❌ BLOCKED: Video ${targetVideoId} already has ${existingImageToVideoConnections.length} image connections (maximum 2 allowed)`);
                    console.warn(`[Connection Validation] Existing connections:`, existingImageToVideoConnections.map(c => c.from));
                    console.warn(`[Connection Validation] Attempted connection from: ${sourceImageId}`);
                    
                    // Show user-friendly error message
                    alert(`⚠️ Connection Limit Reached\n\nThis video generation frame already has 2 image connections (maximum allowed).\n\nPlease disconnect an existing image connection first if you want to connect a different image.`);
                    return; // Reject the connection
                  }
                  
                  console.log(`[Connection Validation] ✅ ALLOWED: Video ${targetVideoId} will have ${existingImageToVideoConnections.length + 1} image connection(s) (limit: 2)`);
                }
                
                // ✅ Connection is valid - proceed with creation
                const cid = connector.id || `connector-${Date.now()}`;
                setConnectors(prev => [...prev, {
                  id: cid,
                  type: 'connector',
                  from: connector.from,
                  to: connector.to,
                  color: connector.color || '#437eb5',
                  fromAnchor: connector.fromAnchor,
                  toAnchor: connector.toAnchor
                }]);
              }}
              onPersistConnectorDelete={async (connectorId) => {
                setConnectors(prev => prev.filter(c => c.id !== connectorId));
              }}
              onPersistGroupCreate={async (group) => {
                if (!group || !group.id) return;
                setGroupContainerStates(prev => [...prev, {
                  id: group.id,
                  type: 'group',
                  x: group.x,
                  y: group.y,
                  width: group.width,
                  height: group.height,
                  padding: group.padding || 20,
                  children: group.children || [],
                  meta: {
                    ...(group.meta || {}),
                    name: (group.meta?.name as string) || ('Group ' + (prev.length + 1))
                  }
                } as any]);
              }}
              onPersistGroupUpdate={async (id, updates) => {
                setGroupContainerStates(prev => prev.map(g => g.id === id ? { ...g, ...updates } as any : g));
              }}
              onPersistGroupDelete={async (groupId) => {
                setGroupContainerStates(prev => prev.filter(g => g.id !== groupId));
              }}

              onPersistUpscaleModalCreate={pluginHandlers.onPersistUpscaleModalCreate}
              onPersistUpscaleModalMove={pluginHandlers.onPersistUpscaleModalMove}
              onPersistUpscaleModalDelete={pluginHandlers.onPersistUpscaleModalDelete}
              onUpscale={pluginHandlers.onUpscale}

              onPersistMultiangleCameraModalCreate={pluginHandlers.onPersistMultiangleCameraModalCreate}
              onPersistMultiangleCameraModalMove={pluginHandlers.onPersistMultiangleCameraModalMove}
              onPersistMultiangleCameraModalDelete={pluginHandlers.onPersistMultiangleCameraModalDelete}
              onMultiangleCamera={pluginHandlers.onMultiangleCamera}
              onQwenMultipleAngles={pluginHandlers.onQwenMultipleAngles}

              onPersistCompareModalCreate={pluginHandlers.onPersistCompareModalCreate}
              onPersistCompareModalMove={pluginHandlers.onPersistCompareModalMove}
              onPersistCompareModalDelete={pluginHandlers.onPersistCompareModalDelete}

              onPersistRemoveBgModalCreate={pluginHandlers.onPersistRemoveBgModalCreate}
              onPersistRemoveBgModalMove={pluginHandlers.onPersistRemoveBgModalMove}
              onPersistRemoveBgModalDelete={pluginHandlers.onPersistRemoveBgModalDelete}
              onRemoveBg={pluginHandlers.onRemoveBg}

              onPersistEraseModalCreate={pluginHandlers.onPersistEraseModalCreate}
              onPersistEraseModalMove={pluginHandlers.onPersistEraseModalMove}
              onPersistEraseModalDelete={pluginHandlers.onPersistEraseModalDelete}
              onErase={pluginHandlers.onErase}

              onPersistExpandModalCreate={pluginHandlers.onPersistExpandModalCreate}
              onPersistExpandModalMove={pluginHandlers.onPersistExpandModalMove}
              onPersistExpandModalDelete={pluginHandlers.onPersistExpandModalDelete}
              onExpand={pluginHandlers.onExpand}

              onPersistVectorizeModalCreate={pluginHandlers.onPersistVectorizeModalCreate}
              onPersistVectorizeModalMove={pluginHandlers.onPersistVectorizeModalMove}
              onPersistVectorizeModalDelete={pluginHandlers.onPersistVectorizeModalDelete}
              onVectorize={pluginHandlers.onVectorize}

              onPersistNextSceneModalCreate={pluginHandlers.onPersistNextSceneModalCreate}
              onPersistNextSceneModalMove={pluginHandlers.onPersistNextSceneModalMove}
              onPersistNextSceneModalDelete={pluginHandlers.onPersistNextSceneModalDelete}

              onPersistStoryboardModalCreate={pluginHandlers.onPersistStoryboardModalCreate}
              onPersistStoryboardModalMove={pluginHandlers.onPersistStoryboardModalMove}
              onPersistStoryboardModalDelete={pluginHandlers.onPersistStoryboardModalDelete}

              onPersistScriptFrameModalCreate={pluginHandlers.onPersistScriptFrameModalCreate}
              onPersistScriptFrameModalMove={pluginHandlers.onPersistScriptFrameModalMove}
              onPersistScriptFrameModalDelete={pluginHandlers.onPersistScriptFrameModalDelete}

              onPersistSceneFrameModalCreate={pluginHandlers.onPersistSceneFrameModalCreate}
              onPersistSceneFrameModalMove={pluginHandlers.onPersistSceneFrameModalMove}
              onPersistSceneFrameModalDelete={pluginHandlers.onPersistSceneFrameModalDelete}

              onPersistVideoEditorModalCreate={pluginHandlers.onPersistVideoEditorModalCreate}
              onPersistVideoEditorModalMove={pluginHandlers.onPersistVideoEditorModalMove}
              onPersistVideoEditorModalDelete={pluginHandlers.onPersistVideoEditorModalDelete}
              onOpenVideoEditor={openExternalVideoEditor}

              onPersistImageEditorModalCreate={pluginHandlers.onPersistImageEditorModalCreate}
              onPersistImageEditorModalMove={pluginHandlers.onPersistImageEditorModalMove}
              onPersistImageEditorModalDelete={pluginHandlers.onPersistImageEditorModalDelete}
              onOpenImageEditor={openExternalImageEditor}

              onPersistTextModalCreate={async (modal) => {
                setTextGenerators(prev => [...prev, {
                  id: modal.id,
                  type: 'text-generator',
                  x: modal.x, y: modal.y,
                  value: modal.value
                }]);
              }}
              onPersistTextModalMove={async (id, updates) => {
                setTextGenerators(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
              }}
              onPersistTextModalDelete={async (id) => {
                setTextGenerators(prev => prev.filter(t => t.id !== id));
                setConnectors(prev => prev.filter(c => c.from !== id && c.to !== id));
              }}

              onPluginSidebarOpen={() => setIsPluginSidebarOpen(true)}
              setGenerationQueue={setGenerationQueue}

              onPersistCanvasTextCreate={(text) => {
                setCanvasTextStates(prev => [...prev, text]);
              }}
              onPersistCanvasTextMove={(id, updates) => {
                setCanvasTextStates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
              }}
              onPersistCanvasTextDelete={(id) => {
                setCanvasTextStates(prev => prev.filter(t => t.id !== id));
              }}
              onBackgroundClick={() => {
                setIsLibraryOpen(false);
                setIsPluginSidebarOpen(false);
              }}

              // Rich Text Props
              richTextStates={richTextStates}
              setRichTextStates={setRichTextStates}
              onPersistRichTextCreate={(state) => {
                setRichTextStates(prev => [...prev, state]);
              }}
              onPersistRichTextMove={(id, updates) => {
                setRichTextStates(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
              }}
              onPersistRichTextDelete={(id) => {
                setRichTextStates(prev => prev.filter(s => s.id !== id));
              }}
            />
            <ToolbarPanel onToolSelect={handleToolSelect} onUpload={handleToolbarUpload} isHidden={isUIHidden} />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-600">Please select or create a project to continue</p>
          </div>
        )}
      </div>
      <GenerationQueue items={generationQueue} />
      <LibrarySidebar
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectMedia={handleLibraryMediaSelect}
        scale={1}
      />
      <PluginSidebar
        isOpen={isPluginSidebarOpen}
        onClose={() => setIsPluginSidebarOpen(false)}
        onSelectPlugin={(plugin, x, y) => {
          handlePluginCreation(plugin.id, x, y);
          setIsPluginSidebarOpen(false);
        }}
        scale={1}
        viewportCenter={viewportCenterRef.current}
      />
    </main>
  );
}

export default function Home() {
  const [user, setUser] = useState<{ uid: string; username: string; email: string; credits?: number } | null>(null);
  const isMobile = useIsMobile();

  // Show mobile restriction screen for mobile devices
  if (isMobile) {
    return <MobileRestrictionScreen />;
  }

  return (
    <AuthGuard onUserLoaded={(loadedUser) => {
      setUser(loadedUser);
    }}>
      <CanvasApp user={user} />
    </AuthGuard>
  );
}
