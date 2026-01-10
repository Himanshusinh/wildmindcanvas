import { useState } from 'react';
import { ImageUpload } from '@/core/types/canvas';
import { GenerationQueueItem } from '@/modules/canvas/GenerationQueue';
import { ImageGenerator, VideoGenerator, MusicGenerator, UpscaleGenerator, RemoveBgGenerator, EraseGenerator, ExpandGenerator, VectorizeGenerator, StoryboardGenerator, ScriptFrameGenerator, SceneFrameGenerator, TextGenerator, VideoEditorGenerator, ImageEditorGenerator, NextSceneGenerator, CompareGenerator, MultiangleCameraGenerator, Connector, CanvasAppState, CanvasAppSetters } from '@/modules/canvas-app/types';

export function useCanvasState() {
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [imageGenerators, setImageGenerators] = useState<ImageGenerator[]>([]);
  const [videoGenerators, setVideoGenerators] = useState<VideoGenerator[]>([]);
  const [videoEditorGenerators, setVideoEditorGenerators] = useState<VideoEditorGenerator[]>([]);
  const [imageEditorGenerators, setImageEditorGenerators] = useState<ImageEditorGenerator[]>([]);
  const [musicGenerators, setMusicGenerators] = useState<MusicGenerator[]>([]);
  const [upscaleGenerators, setUpscaleGenerators] = useState<UpscaleGenerator[]>([]);
  const [multiangleCameraGenerators, setMultiangleCameraGenerators] = useState<MultiangleCameraGenerator[]>([]);
  const [removeBgGenerators, setRemoveBgGenerators] = useState<RemoveBgGenerator[]>([]);
  const [eraseGenerators, setEraseGenerators] = useState<EraseGenerator[]>([]);
  const [expandGenerators, setExpandGenerators] = useState<ExpandGenerator[]>([]);
  const [vectorizeGenerators, setVectorizeGenerators] = useState<VectorizeGenerator[]>([]);
  const [nextSceneGenerators, setNextSceneGenerators] = useState<NextSceneGenerator[]>([]);
  const [storyboardGenerators, setStoryboardGenerators] = useState<StoryboardGenerator[]>([]);
  const [scriptFrameGenerators, setScriptFrameGenerators] = useState<ScriptFrameGenerator[]>([]);
  const [sceneFrameGenerators, setSceneFrameGenerators] = useState<SceneFrameGenerator[]>([]);
  const [textGenerators, setTextGenerators] = useState<TextGenerator[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [generationQueue, setGenerationQueue] = useState<GenerationQueueItem[]>([]);
  const [compareGenerators, setCompareGenerators] = useState<CompareGenerator[]>([]);
  const [canvasTextStates, setCanvasTextStates] = useState<import('@/modules/canvas-overlays/types').CanvasTextState[]>([]);
  const [richTextStates, setRichTextStates] = useState<import('@/modules/canvas-overlays/types').CanvasTextState[]>([]);
  const [groupContainerStates, setGroupContainerStates] = useState<import('@/core/types/groupContainer').GroupContainerState[]>([]);
  const [showImageGenerationModal, setShowImageGenerationModal] = useState(false);

  const state: CanvasAppState = {
    images,
    imageGenerators,
    videoGenerators,
    videoEditorGenerators,
    imageEditorGenerators,
    musicGenerators,
    upscaleGenerators,
    multiangleCameraGenerators,
    compareGenerators,
    removeBgGenerators,
    eraseGenerators,
    expandGenerators,
    vectorizeGenerators,
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
    showImageGenerationModal,
  };

  const setters: CanvasAppSetters = {
    setImages,
    setImageGenerators,
    setVideoGenerators,
    setVideoEditorGenerators,
    setImageEditorGenerators,
    setMusicGenerators,
    setUpscaleGenerators,
    setMultiangleCameraGenerators,
    setCompareGenerators, // Added
    setRemoveBgGenerators,
    setEraseGenerators,
    setExpandGenerators,
    setVectorizeGenerators,
    setNextSceneGenerators,
    setStoryboardGenerators,
    setScriptFrameGenerators,
    setSceneFrameGenerators,
    setTextGenerators,
    setCanvasTextStates,
    setRichTextStates,
    setGroupContainerStates,
    setConnectors,
    setGenerationQueue,
    setShowImageGenerationModal,
  };

  return { state, setters };
}

