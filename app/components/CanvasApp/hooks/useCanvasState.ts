import { useState } from 'react';
import { ImageUpload } from '@/types/canvas';
import { GenerationQueueItem } from '@/app/components/Canvas/GenerationQueue';
import { ImageGenerator, VideoGenerator, MusicGenerator, UpscaleGenerator, TextGenerator, Connector, CanvasAppState, CanvasAppSetters } from '../types';

export function useCanvasState() {
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [imageGenerators, setImageGenerators] = useState<ImageGenerator[]>([]);
  const [videoGenerators, setVideoGenerators] = useState<VideoGenerator[]>([]);
  const [musicGenerators, setMusicGenerators] = useState<MusicGenerator[]>([]);
  const [upscaleGenerators, setUpscaleGenerators] = useState<UpscaleGenerator[]>([]);
  const [textGenerators, setTextGenerators] = useState<TextGenerator[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [generationQueue, setGenerationQueue] = useState<GenerationQueueItem[]>([]);

  const state: CanvasAppState = {
    images,
    imageGenerators,
    videoGenerators,
    musicGenerators,
    upscaleGenerators,
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
    setTextGenerators,
    setConnectors,
    setGenerationQueue,
  };

  return { state, setters };
}

