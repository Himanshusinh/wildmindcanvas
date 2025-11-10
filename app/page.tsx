'use client';

import { useState, useRef } from 'react';
import { Canvas } from '@/components/Canvas';
import { ToolbarPanel } from '@/components/ToolbarPanel';
import { Header } from '@/components/Header';
import { ImageUpload } from '@/types/canvas';

export default function Home() {
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [projectName, setProjectName] = useState(() => {
    // Load from localStorage on initial render
    if (typeof window !== 'undefined') {
      return localStorage.getItem('canvas-project-name') || 'Untitled';
    }
    return 'Untitled';
  });
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

  const handleImageDelete = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      // Clean up blob URL if it exists
      const item = newImages[index];
      if (item?.url && item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
      // Remove the item
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleImageDownload = async (index: number) => {
    const imageData = images[index];
    if (!imageData?.url) return;

    try {
      let blob: Blob;
      let filename: string;

      if (imageData.url.startsWith('blob:')) {
        // For blob URLs, fetch and download
        const response = await fetch(imageData.url);
        blob = await response.blob();
        filename = imageData.file?.name || `image-${Date.now()}.${imageData.type === 'video' ? 'mp4' : 'png'}`;
      } else {
        // For regular URLs, fetch through proxy if needed
        const response = await fetch(imageData.url);
        blob = await response.blob();
        filename = imageData.file?.name || `image-${Date.now()}.${imageData.type === 'video' ? 'mp4' : 'png'}`;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download:', error);
      alert('Failed to download. Please try again.');
    }
  };

  const handleImageDuplicate = (index: number) => {
    const imageData = images[index];
    if (!imageData) return;

    // Create a duplicate with offset
    const duplicated: ImageUpload = {
      ...imageData,
      x: (imageData.x || 0) + 50,
      y: (imageData.y || 0) + 50,
    };

    // If it's a blob URL, we need to create a new blob URL
    if (imageData.url && imageData.url.startsWith('blob:') && imageData.file) {
      duplicated.url = URL.createObjectURL(imageData.file);
      duplicated.file = imageData.file;
    }

    setImages((prev) => [...prev, duplicated]);
  };

  const handleImageUpload = (file: File) => {
    processMediaFile(file, images.length);
  };

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
      relatedFiles,
    };

    setImages((prev) => [...prev, newImage]);
  };

  const processMediaFile = (file: File, offsetIndex: number = 0) => {
    const url = URL.createObjectURL(file);
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    // Check for 3D model files
    const isModel3D = ['.obj', '.gltf', '.glb', '.fbx', '.mb', '.ma']
      .some(ext => fileName.endsWith(ext));
    
    // Check for video files
    const isVideo = fileType.startsWith('video/') || 
                    ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.3gp']
                      .some(ext => fileName.endsWith(ext));
    
    if (isModel3D) {
      // Get current viewport center
      const center = viewportCenterRef.current;
      
      // Place 3D model at the center of current viewport with slight offset
      const offsetX = (offsetIndex % 3) * 50;
      const offsetY = Math.floor(offsetIndex / 3) * 50;
      const modelX = center.x - 400 / 2 + offsetX; // Default width 400
      const modelY = center.y - 400 / 2 + offsetY; // Default height 400

      const newImage: ImageUpload = {
        file,
        url,
        type: 'model3d',
        x: modelX,
        y: modelY,
        width: 400,
        height: 400,
        rotationX: 0,
        rotationY: 0,
        zoom: 1,
      };

      setImages((prev) => [...prev, newImage]);
    } else if (isVideo) {
      const video = document.createElement('video');
      video.src = url;
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        // Get current viewport center
        const center = viewportCenterRef.current;
        
        // Scale down video to reasonable size (max 600px for largest dimension)
        const maxDimension = 600;
        const originalWidth = video.videoWidth;
        const originalHeight = video.videoHeight;
        let displayWidth = originalWidth;
        let displayHeight = originalHeight;
        
        if (originalWidth > maxDimension || originalHeight > maxDimension) {
          const aspectRatio = originalWidth / originalHeight;
          if (originalWidth > originalHeight) {
            displayWidth = maxDimension;
            displayHeight = maxDimension / aspectRatio;
          } else {
            displayHeight = maxDimension;
            displayWidth = maxDimension * aspectRatio;
          }
        }
        
        // Place video at the center of current viewport with slight offset for multiple files
        const offsetX = (offsetIndex % 3) * 50; // Stagger horizontally
        const offsetY = Math.floor(offsetIndex / 3) * 50; // Stagger vertically
        const videoX = center.x - displayWidth / 2 + offsetX;
        const videoY = center.y - displayHeight / 2 + offsetY;

        const newImage: ImageUpload = {
          file,
          url,
          type: 'video',
          x: videoX,
          y: videoY,
          width: displayWidth,
          height: displayHeight,
          // Store original resolution for display in tooltip
          originalWidth: originalWidth,
          originalHeight: originalHeight,
        };

        setImages((prev) => [...prev, newImage]);
      };
    } else {
      const img = new Image();
      
      img.onload = () => {
        // Get current viewport center
        const center = viewportCenterRef.current;
        
        // Scale down image to reasonable size (max 600px for largest dimension)
        const maxDimension = 600;
        const originalWidth = img.width;
        const originalHeight = img.height;
        let displayWidth = originalWidth;
        let displayHeight = originalHeight;
        
        if (originalWidth > maxDimension || originalHeight > maxDimension) {
          const aspectRatio = originalWidth / originalHeight;
          if (originalWidth > originalHeight) {
            displayWidth = maxDimension;
            displayHeight = maxDimension / aspectRatio;
          } else {
            displayHeight = maxDimension;
            displayWidth = maxDimension * aspectRatio;
          }
        }
        
        // Place image at the center of current viewport with slight offset for multiple images
        const offsetX = (offsetIndex % 3) * 50; // Stagger horizontally
        const offsetY = Math.floor(offsetIndex / 3) * 50; // Stagger vertically
        const imageX = center.x - displayWidth / 2 + offsetX;
        const imageY = center.y - displayHeight / 2 + offsetY;

        const newImage: ImageUpload = {
          file,
          url,
          type: 'image',
          x: imageX,
          y: imageY,
          width: displayWidth,
          height: displayHeight,
          // Store original resolution for display in tooltip
          originalWidth: img.naturalWidth || originalWidth,
          originalHeight: img.naturalHeight || originalHeight,
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

  const [selectedTool, setSelectedTool] = useState<'cursor' | 'text' | 'image' | 'video' | 'music'>('cursor');
  const [toolClickCounter, setToolClickCounter] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null);

  const handleToolSelect = (tool: 'cursor' | 'text' | 'image' | 'video' | 'music') => {
    // Always update to trigger effect, even if tool is the same
    // Use counter to force re-render when clicking same tool again
    if (tool === selectedTool) {
      setToolClickCounter(prev => prev + 1);
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
  };

  const handleTextCreate = (text: string, x: number, y: number) => {
    const newText: ImageUpload = {
      type: 'text',
      text,
      x,
      y,
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#000000',
    };
    setImages((prev) => [...prev, newText]);
  };

  const handleToolbarUpload = (files: File[]) => {
    // Check if any file is a GLTF file (which might need dependencies)
    const hasGLTF = files.some(f => f.name.toLowerCase().endsWith('.gltf'));
    
    if (hasGLTF && files.length > 1) {
      // Use multiple files handler for GLTF with dependencies
      handleMultipleFilesUpload(files);
    } else {
      // Process files individually
      files.forEach((file, index) => {
        processMediaFile(file, images.length + index);
      });
    }
  };

  const handleProjectNameChange = (name: string) => {
    setProjectName(name);
    // You can save the project name to localStorage or backend here
    localStorage.setItem('canvas-project-name', name);
  };

  const handleImageSelect = (file: File) => {
    // Process the selected image file
    processMediaFile(file, images.length);
  };

  const handleImageGenerate = (prompt: string, model: string, frame: string, aspectRatio: string) => {
    console.log('Generate image:', { prompt, model, frame, aspectRatio });
    // TODO: Implement image generation API call here
    // For now, just close the modal
    setIsImageModalOpen(false);
  };

  const handleVideoSelect = (file: File) => {
    // Process the selected video file
    processMediaFile(file, images.length);
  };

  const handleVideoGenerate = (prompt: string, model: string, frame: string, aspectRatio: string) => {
    console.log('Generate video:', { prompt, model, frame, aspectRatio });
    // TODO: Implement video generation API call here
    // For now, just close the modal
    // When video is generated, set the generatedVideoUrl
    // setGeneratedVideoUrl(generatedVideoUrl);
    setIsVideoModalOpen(false);
  };

  const handleMusicSelect = (file: File) => {
    // Process the selected music file
    processMediaFile(file, images.length);
  };

  const handleMusicGenerate = (prompt: string, model: string, frame: string, aspectRatio: string) => {
    console.log('Generate music:', { prompt, model, frame, aspectRatio });
    // TODO: Implement music generation API call here
    // For now, just close the modal
    // When music is generated, set the generatedMusicUrl
    // setGeneratedMusicUrl(generatedMusicUrl);
    setIsMusicModalOpen(false);
  };

  return (
    <main className="w-screen h-screen overflow-hidden bg-gray-100">
      <div className="w-full h-full relative">
        <Header 
          projectName={projectName}
          onProjectNameChange={handleProjectNameChange}
        />
        <Canvas 
          images={images} 
          onViewportChange={handleViewportChange}
          onImageUpdate={handleImageUpdate}
          onImageDelete={handleImageDelete}
          onImageDownload={handleImageDownload}
          onImageDuplicate={handleImageDuplicate}
          onImagesDrop={handleImagesDrop}
          selectedTool={selectedTool}
          onTextCreate={handleTextCreate}
          toolClickCounter={toolClickCounter}
          isImageModalOpen={isImageModalOpen}
          onImageModalClose={() => setIsImageModalOpen(false)}
          onImageSelect={handleImageSelect}
          onImageGenerate={handleImageGenerate}
          generatedImageUrl={generatedImageUrl}
          isVideoModalOpen={isVideoModalOpen}
          onVideoModalClose={() => setIsVideoModalOpen(false)}
          onVideoSelect={handleVideoSelect}
          onVideoGenerate={handleVideoGenerate}
          generatedVideoUrl={generatedVideoUrl}
          isMusicModalOpen={isMusicModalOpen}
          onMusicModalClose={() => setIsMusicModalOpen(false)}
          onMusicSelect={handleMusicSelect}
          onMusicGenerate={handleMusicGenerate}
          generatedMusicUrl={generatedMusicUrl}
        />
        <ToolbarPanel onToolSelect={handleToolSelect} onUpload={handleToolbarUpload} />
      </div>
    </main>
  );
}
