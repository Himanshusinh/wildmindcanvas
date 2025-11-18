import React, { useEffect, useRef } from 'react';
import { existsNearby, findBlankSpace, focusOnComponent } from '@/lib/canvasHelpers';
import { ImageUpload } from '@/types/canvas';

interface TextModalState {
  id: string;
  x: number;
  y: number;
  value?: string;
  autoFocusInput?: boolean;
}

interface ImageModalState {
  id: string;
  x: number;
  y: number;
  generatedImageUrl?: string | null;
  frameWidth?: number;
  frameHeight?: number;
  model?: string;
  frame?: string;
  aspectRatio?: string;
  prompt?: string;
}

interface VideoModalState {
  id: string;
  x: number;
  y: number;
  generatedVideoUrl?: string | null;
  frameWidth?: number;
  frameHeight?: number;
  model?: string;
  frame?: string;
  aspectRatio?: string;
  prompt?: string;
  duration?: number;
  resolution?: string;
  taskId?: string;
  generationId?: string;
  status?: string;
}

interface MusicModalState {
  id: string;
  x: number;
  y: number;
  generatedMusicUrl?: string | null;
  frameWidth?: number;
  frameHeight?: number;
  model?: string;
  frame?: string;
  aspectRatio?: string;
  prompt?: string;
}

interface UseCanvasModalsOptions {
  selectedTool?: 'cursor' | 'move' | 'text' | 'image' | 'video' | 'music';
  toolClickCounter?: number;
  isImageModalOpen?: boolean;
  isVideoModalOpen?: boolean;
  isMusicModalOpen?: boolean;
  generatedImageUrl?: string | null;
  generatedVideoUrl?: string | null;
  generatedMusicUrl?: string | null;
  projectId?: string | null;
  externalImageModals?: ImageModalState[];
  externalVideoModals?: VideoModalState[];
  externalMusicModals?: MusicModalState[];
  externalTextModals?: TextModalState[];
  images: ImageUpload[];
  viewportSize: { width: number; height: number };
  position: { x: number; y: number };
  scale: number;
  onPersistTextModalCreate?: (modal: TextModalState) => void | Promise<void>;
  onPersistImageModalCreate?: (modal: ImageModalState) => void | Promise<void>;
  onPersistImageModalMove?: (id: string, updates: Partial<ImageModalState>) => void | Promise<void>;
  onPersistVideoModalCreate?: (modal: VideoModalState) => void | Promise<void>;
  onPersistVideoModalMove?: (id: string, updates: Partial<VideoModalState>) => void | Promise<void>;
  onPersistMusicModalCreate?: (modal: MusicModalState) => void | Promise<void>;
  onPersistMusicModalMove?: (id: string, updates: Partial<MusicModalState>) => void | Promise<void>;
  setPosition: (pos: { x: number; y: number }) => void;
  updateViewportCenter: (pos: { x: number; y: number }, scale: number) => void;
}

interface UseCanvasModalsReturn {
  textInputStates: TextModalState[];
  imageModalStates: ImageModalState[];
  videoModalStates: VideoModalState[];
  musicModalStates: MusicModalState[];
  setTextInputStates: React.Dispatch<React.SetStateAction<TextModalState[]>>;
  setImageModalStates: React.Dispatch<React.SetStateAction<ImageModalState[]>>;
  setVideoModalStates: React.Dispatch<React.SetStateAction<VideoModalState[]>>;
  setMusicModalStates: React.Dispatch<React.SetStateAction<MusicModalState[]>>;
}

/**
 * Hook for managing modal states (text, image, video, music generators)
 * Handles auto-creation, persistence, and URL syncing
 */
export function useCanvasModals(options: UseCanvasModalsOptions): UseCanvasModalsReturn {
  const {
    selectedTool,
    toolClickCounter = 0,
    isImageModalOpen = false,
    isVideoModalOpen = false,
    isMusicModalOpen = false,
    generatedImageUrl,
    generatedVideoUrl,
    generatedMusicUrl,
    projectId,
    externalImageModals,
    externalVideoModals,
    externalMusicModals,
    externalTextModals,
    images,
    viewportSize,
    position,
    scale,
    onPersistTextModalCreate,
    onPersistImageModalCreate,
    onPersistImageModalMove,
    onPersistVideoModalCreate,
    onPersistVideoModalMove,
    onPersistMusicModalCreate,
    onPersistMusicModalMove,
    setPosition,
    updateViewportCenter,
  } = options;

  const [textInputStates, setTextInputStates] = React.useState<TextModalState[]>([]);
  const [imageModalStates, setImageModalStates] = React.useState<ImageModalState[]>([]);
  const [videoModalStates, setVideoModalStates] = React.useState<VideoModalState[]>([]);
  const [musicModalStates, setMusicModalStates] = React.useState<MusicModalState[]>([]);
  
  const prevSelectedToolRef = useRef<'cursor' | 'move' | 'text' | 'image' | 'video' | 'music' | undefined>(undefined);
  const lastCreateTimesRef = useRef<{ text?: number; image?: number; video?: number; music?: number }>({});

  // Helper to find blank space
  const findBlankSpaceWrapper = (componentWidth: number = 600, componentHeight: number = 400) => {
    return findBlankSpace(componentWidth, componentHeight, images, textInputStates, imageModalStates, videoModalStates, musicModalStates, viewportSize, position, scale);
  };

  // Helper to focus on component
  const focusOnComponentWrapper = (canvasX: number, canvasY: number, componentWidth: number = 600, componentHeight: number = 400) => {
    focusOnComponent(canvasX, canvasY, componentWidth, componentHeight, viewportSize, scale, setPosition, updateViewportCenter);
  };

  // Automatically create text input at center when text tool is selected
  useEffect(() => {
    if (selectedTool === 'text') {
      const now = Date.now();
      const last = lastCreateTimesRef.current.text || 0;
      if (now - last < 400) {
        prevSelectedToolRef.current = selectedTool;
        return;
      }
      lastCreateTimesRef.current.text = now;

      const blankPos = findBlankSpaceWrapper(300, 100);
      if (existsNearby(textInputStates, blankPos.x, blankPos.y)) {
        prevSelectedToolRef.current = selectedTool;
        return;
      }
      const newId = `text-${Date.now()}-${Math.random()}`;
      const modal: TextModalState = { id: newId, x: blankPos.x, y: blankPos.y, value: '', autoFocusInput: false };
      setTextInputStates(prev => [...prev, modal]);
      if (onPersistTextModalCreate) {
        Promise.resolve(onPersistTextModalCreate(modal)).catch(console.error);
      }
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
      if (existsNearby(imageModalStates, blankPos.x, blankPos.y)) return;
      const newId = `image-${Date.now()}-${Math.random()}`;
      const modal: ImageModalState = { id: newId, x: blankPos.x, y: blankPos.y, generatedImageUrl: null };
      setImageModalStates(prev => [...prev, modal]);
      if (onPersistImageModalCreate) {
        Promise.resolve(onPersistImageModalCreate(modal)).catch(console.error);
      }
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
      const modal: VideoModalState = { id: newId, x: blankPos.x, y: blankPos.y, generatedVideoUrl: null };
      setVideoModalStates(prev => [...prev, modal]);
      if (onPersistVideoModalCreate) {
        Promise.resolve(onPersistVideoModalCreate(modal)).catch(console.error);
      }
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
      const modal: MusicModalState = { id: newId, x: blankPos.x, y: blankPos.y, generatedMusicUrl: null };
      setMusicModalStates(prev => [...prev, modal]);
      if (onPersistMusicModalCreate) {
        Promise.resolve(onPersistMusicModalCreate(modal)).catch(console.error);
      }
      setTimeout(() => focusOnComponentWrapper(blankPos.x, blankPos.y, 600, 300), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTool, isMusicModalOpen, toolClickCounter]);

  // Sync generatedImageUrl prop to the most recently created image modal
  useEffect(() => {
    if (generatedImageUrl && imageModalStates.length > 0) {
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
  }, [generatedImageUrl, imageModalStates.length, onPersistImageModalMove]);

  // Sync generatedVideoUrl prop to the most recently created video modal
  useEffect(() => {
    if (generatedVideoUrl && videoModalStates.length > 0) {
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
  }, [generatedVideoUrl, videoModalStates.length, onPersistVideoModalMove]);

  // Sync generatedMusicUrl prop to the most recently created music modal
  useEffect(() => {
    if (generatedMusicUrl && musicModalStates.length > 0) {
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
  }, [generatedMusicUrl, musicModalStates.length, onPersistMusicModalMove]);

  // Load persisted image modals from localStorage on mount (scoped by projectId)
  useEffect(() => {
    if (externalImageModals && externalImageModals.length > 0) {
      setImageModalStates(externalImageModals);
      return;
    }
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:imageModals`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as ImageModalState[];
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
    if (externalVideoModals && externalVideoModals.length > 0) {
      setVideoModalStates(externalVideoModals);
      return;
    }
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:videoModals`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as VideoModalState[];
        if (Array.isArray(parsed)) {
          setVideoModalStates(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted video modals');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, JSON.stringify(externalVideoModals || [])]);

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
    if (externalMusicModals && externalMusicModals.length > 0) {
      setMusicModalStates(externalMusicModals);
      return;
    }
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:musicModals`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as MusicModalState[];
        if (Array.isArray(parsed)) {
          setMusicModalStates(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted music modals');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, JSON.stringify(externalMusicModals || [])]);

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

  // Sync external text modals from parent (for hydration/realtime)
  useEffect(() => {
    if (externalTextModals && externalTextModals.length > 0) {
      setTextInputStates(externalTextModals);
      return;
    }
    if (!projectId) return;
    try {
      const key = `canvas:${projectId}:textModals`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as TextModalState[];
        if (Array.isArray(parsed)) {
          setTextInputStates(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted text modals');
    }
  }, [projectId, JSON.stringify(externalTextModals || [])]);

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

  return {
    textInputStates,
    imageModalStates,
    videoModalStates,
    musicModalStates,
    setTextInputStates,
    setImageModalStates,
    setVideoModalStates,
    setMusicModalStates,
  };
}

