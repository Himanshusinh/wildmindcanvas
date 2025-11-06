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
    processImageFile(file, images.length);
  };

  const processImageFile = (file: File, offsetIndex: number = 0) => {
    const url = URL.createObjectURL(file);
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
        x: imageX,
        y: imageY,
        width: img.width,
        height: img.height,
      };

      setImages((prev) => [...prev, newImage]);
    };

    img.src = url;
  };

  const handleImagesDrop = (files: File[]) => {
    // Process multiple files with slight offsets
    files.forEach((file, index) => {
      processImageFile(file, images.length + index);
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
