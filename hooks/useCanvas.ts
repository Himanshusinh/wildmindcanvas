import { useRef, useEffect, useState } from 'react';
import Konva from 'konva';
import { Stage, Layer } from 'react-konva';
import { ImageUpload } from '@/types/canvas';

export const useCanvas = (width: number, height: number) => {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const [images, setImages] = useState<ImageUpload[]>([]);

  const addImage = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      const newImage: ImageUpload = {
        file,
        url,
        x: 50,
        y: 50,
        width: img.width,
        height: img.height,
      };
      setImages((prev) => [...prev, newImage]);
    };
    
    img.src = url;
  };

  useEffect(() => {
    // Enable WebGL for better performance
    if (stageRef.current) {
      Konva.pixelRatio = window.devicePixelRatio || 1;
    }
  }, []);

  return {
    stageRef,
    layerRef,
    images,
    addImage,
    setImages,
  };
};

