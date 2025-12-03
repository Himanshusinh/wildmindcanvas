import { useState } from 'react';
import { ImageUpload } from '@/types/canvas';
import { GenerationQueueItem } from '@/app/components/Canvas/GenerationQueue';
import { ImageGenerator, VideoGenerator, MusicGenerator, UpscaleGenerator, RemoveBgGenerator, EraseGenerator, ExpandGenerator, VectorizeGenerator, StoryboardGenerator, ScriptFrameGenerator, SceneFrameGenerator, TextGenerator, Connector, CanvasAppState, CanvasAppSetters } from '../types';

export function useCanvasState() {
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [imageGenerators, setImageGenerators] = useState<ImageGenerator[]>([]);
  const [videoGenerators, setVideoGenerators] = useState<VideoGenerator[]>([]);
  const [musicGenerators, setMusicGenerators] = useState<MusicGenerator[]>([]);
  const [upscaleGenerators, setUpscaleGenerators] = useState<UpscaleGenerator[]>([]);
  const [removeBgGenerators, setRemoveBgGenerators] = useState<RemoveBgGenerator[]>([]);
  const [eraseGenerators, setEraseGenerators] = useState<EraseGenerator[]>([]);
  const [expandGenerators, setExpandGenerators] = useState<ExpandGenerator[]>([]);
  const [vectorizeGenerators, setVectorizeGenerators] = useState<VectorizeGenerator[]>([]);
  const [storyboardGenerators, setStoryboardGenerators] = useState<StoryboardGenerator[]>([]);
  const [scriptFrameGenerators, setScriptFrameGenerators] = useState<ScriptFrameGenerator[]>([]);
  const [sceneFrameGenerators, setSceneFrameGenerators] = useState<SceneFrameGenerator[]>([]);
  const [textGenerators, setTextGenerators] = useState<TextGenerator[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [generationQueue, setGenerationQueue] = useState<GenerationQueueItem[]>([]);

  const state: CanvasAppState = {
    images,
    imageGenerators,
    videoGenerators,
    musicGenerators,
    upscaleGenerators,
    removeBgGenerators,
    eraseGenerators,
    expandGenerators,
    vectorizeGenerators,
    storyboardGenerators,
    scriptFrameGenerators,
    sceneFrameGenerators,
    textGenerators,
    connectors,
    generationQueue,
  };

  const setters: CanvasAppSetters = {
    setImages,
    setImageGenerators,
    setVideoGenerators,
    setMusicGenerators,
    setUpscaleGenerators,
    setRemoveBgGenerators,
    setEraseGenerators,
    setExpandGenerators,
    setVectorizeGenerators,
    setStoryboardGenerators,
    setScriptFrameGenerators,
    setSceneFrameGenerators,
    setTextGenerators,
    setConnectors,
    setGenerationQueue,
  };

  return { state, setters };
}

