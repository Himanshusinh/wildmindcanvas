'use client';

import { useState, useRef } from 'react';
import { Canvas } from '@/components/Canvas';
import { UploadButton } from '@/components/UploadButton';
import { ImageUpload } from '@/types/canvas';

export default function Home() {
  const [images, setImages] = useState<ImageUpload[]>([]);
  const viewportCenterRef = useRef<{ x: number; y: number; scale: number }>({
    x: 5000000, // Center of 1,000,000 x 1,000,000 infinite canvas
    y: 5000000,
    scale: 1,
  });

  const handleViewportChange = (center: { x: number; y: number }, scale: number) => {
    viewportCenterRef.current = { x: center.x, y: center.y, scale };
  };

  const handleImageUpdate = (index: number, updates: Partial<ImageUpload>) => {
    setImages((prev) => {
      const newImages = [...prev];
      newImages[index] = { ...newImages[index], ...updates };
      return newImages;
    });
  };

  const handleImageUpload = (file: File) => {
    processMediaFile(file, images.length);
  };

  const processMediaFile = (file: File, offsetIndex: number = 0) => {
    const url = URL.createObjectURL(file);
    const fileType = file.type.toLowerCase();
    const isVideo = fileType.startsWith('video/') || 
                    ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.3gp']
                      .some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (isVideo) {
      const video = document.createElement('video');
      video.src = url;
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        // Get current viewport center
        const center = viewportCenterRef.current;
        
        // Place video at the center of current viewport with slight offset for multiple files
        const offsetX = (offsetIndex % 3) * 50; // Stagger horizontally
        const offsetY = Math.floor(offsetIndex / 3) * 50; // Stagger vertically
        const videoX = center.x - video.videoWidth / 2 + offsetX;
        const videoY = center.y - video.videoHeight / 2 + offsetY;

        const newImage: ImageUpload = {
          file,
          url,
          type: 'video',
          x: videoX,
          y: videoY,
          width: video.videoWidth,
          height: video.videoHeight,
        };

        setImages((prev) => [...prev, newImage]);
      };
    } else {
      const img = new Image();
      
      img.onload = () => {
        // Get current viewport center
        const center = viewportCenterRef.current;
        
        // Place image at the center of current viewport with slight offset for multiple images
        const offsetX = (offsetIndex % 3) * 50; // Stagger horizontally
        const offsetY = Math.floor(offsetIndex / 3) * 50; // Stagger vertically
        const imageX = center.x - img.width / 2 + offsetX;
        const imageY = center.y - img.height / 2 + offsetY;

        const newImage: ImageUpload = {
          file,
          url,
          type: 'image',
          x: imageX,
          y: imageY,
          width: img.width,
          height: img.height,
        };

        setImages((prev) => [...prev, newImage]);
      };

      img.src = url;
    }
  };

  const handleImagesDrop = (files: File[]) => {
    // Process multiple files with slight offsets
    files.forEach((file, index) => {
      processMediaFile(file, images.length + index);
    });
  };

  return (
    <main className="w-screen h-screen overflow-hidden bg-gray-100">
      <div className="w-full h-full relative">
        <Canvas 
          images={images} 
          onViewportChange={handleViewportChange}
          onImageUpdate={handleImageUpdate}
          onImagesDrop={handleImagesDrop}
        />
        <UploadButton onImageUpload={handleImageUpload} />
      </div>
    </main>
  );
}
