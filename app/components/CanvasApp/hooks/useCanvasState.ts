import { useState } from 'react';
import { ImageUpload } from '@/types/canvas';
import { GenerationQueueItem } from '@/app/components/Canvas/GenerationQueue';
import { ImageGenerator, VideoGenerator, MusicGenerator, UpscaleGenerator, RemoveBgGenerator, EraseGenerator, ReplaceGenerator, ExpandGenerator, VectorizeGenerator, TextGenerator, Connector, CanvasAppState, CanvasAppSetters } from '../types';

export function useCanvasState() {
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [imageGenerators, setImageGenerators] = useState<ImageGenerator[]>([]);
  const [videoGenerators, setVideoGenerators] = useState<VideoGenerator[]>([]);
  const [musicGenerators, setMusicGenerators] = useState<MusicGenerator[]>([]);
  const [upscaleGenerators, setUpscaleGenerators] = useState<UpscaleGenerator[]>([]);
  const [removeBgGenerators, setRemoveBgGenerators] = useState<RemoveBgGenerator[]>([]);
  const [eraseGenerators, setEraseGenerators] = useState<EraseGenerator[]>([]);
  const [replaceGenerators, setReplaceGenerators] = useState<ReplaceGenerator[]>([]);
  const [expandGenerators, setExpandGenerators] = useState<ExpandGenerator[]>([]);
  const [vectorizeGenerators, setVectorizeGenerators] = useState<VectorizeGenerator[]>([]);
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
    replaceGenerators,
    expandGenerators,
    vectorizeGenerators,
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
    setReplaceGenerators,
    setExpandGenerators,
    setVectorizeGenerators,
    setTextGenerators,
    setConnectors,
    setGenerationQueue,
  };

  return { state, setters };
}

