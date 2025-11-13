'use client';

import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@/components/Canvas';
import { ToolbarPanel } from '@/components/ToolbarPanel';
import { Header } from '@/components/Header';
import { AuthGuard } from '@/components/AuthGuard';
import { Profile } from '@/components/Profile/Profile';
import { ImageUpload } from '@/types/canvas';
import { generateImageForCanvas, generateVideoForCanvas, getCurrentUser } from '@/lib/api';
import { createProject, getProject, listProjects } from '@/lib/canvasApi';
import { ProjectSelector } from '@/components/ProjectSelector/ProjectSelector';
import { CanvasProject, CanvasOp } from '@/lib/canvasApi';
import { useOpManager } from '@/hooks/useOpManager';
import { buildProxyDownloadUrl, buildProxyResourceUrl } from '@/lib/proxyUtils';

interface CanvasAppProps {
  user: { uid: string; username: string; email: string; credits?: number } | null;
}

function CanvasApp({ user }: CanvasAppProps) {
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [projectName, setProjectName] = useState(() => {
    // Load from localStorage on initial render
    if (typeof window !== 'undefined') {
      return localStorage.getItem('canvas-project-name') || 'Untitled';
    }
    return 'Untitled';
  });
  const [projectId, setProjectId] = useState<string | null>(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const initRef = useRef(false); // Prevent multiple initializations
  const currentUser = user;
  const viewportCenterRef = useRef<{ x: number; y: number; scale: number }>({
    x: 5000000, // Center of 1,000,000 x 1,000,000 infinite canvas
    y: 5000000,
    scale: 1,
  });

  // Initialize project when user is loaded
  useEffect(() => {
    const initProject = async () => {
      if (!currentUser) {
        setIsInitializing(false);
        return;
      }
      
      if (initRef.current) return; // Already initializing
      if (projectId) {
        setIsInitializing(false);
        return; // Already initialized
      }

      initRef.current = true;

      // Check if we have a project ID in localStorage
      const savedProjectId = localStorage.getItem('canvas-project-id');
      if (savedProjectId) {
        // Try to load existing project
        try {
          const project = await getProject(savedProjectId);
          if (project) {
            setProjectId(savedProjectId);
            setProjectName(project.name);
            setIsInitializing(false);
            initRef.current = false; // Reset for future use
            return;
          }
        } catch (error) {
          console.error('Failed to load project:', error);
          // Project doesn't exist, show project selector
        }
      }

      // Show project selector to let user choose or create
      setIsInitializing(false);
      setShowProjectSelector(true);
      initRef.current = false; // Reset after showing selector
    };

    initProject();
  }, [currentUser]); // Only depend on currentUser, not projectId

  const handleProjectSelect = (project: CanvasProject) => {
    setProjectId(project.id);
    setProjectName(project.name);
    setShowProjectSelector(false);
    localStorage.setItem('canvas-project-id', project.id);
    localStorage.setItem('canvas-project-name', project.name);
  };

  const handleViewportChange = (center: { x: number; y: number }, scale: number) => {
    viewportCenterRef.current = { x: center.x, y: center.y, scale };
  };

  // Initialize OpManager
  const { appendOp, undo, redo, canUndo, canRedo, isInitialized: opManagerInitialized } = useOpManager({
    projectId,
    enabled: !!projectId && !!currentUser,
    onOpApplied: (op, isOptimistic) => {
      // Handle snapshot application (snapshot contains map of elements)
      if (op.type === 'create' && op.data && typeof op.data === 'object' && !op.data.element && !op.data.delta && !op.data.updates) {
        // This is a snapshot - op.data is the elements map
        // Replace entire images array with snapshot (don't append, as snapshot is the source of truth)
        const elements = op.data as Record<string, any>;
        const newImages: ImageUpload[] = [];
        
        Object.values(elements).forEach((element: any) => {
          if (element && element.type) {
            // Use proxy URL for Zata URLs to avoid CORS
            let imageUrl = element.meta?.url || element.meta?.mediaId || '';
            if (imageUrl && (imageUrl.includes('zata.ai') || imageUrl.includes('zata'))) {
              imageUrl = buildProxyResourceUrl(imageUrl);
            }
            
            const newImage: ImageUpload = {
              type: element.type === 'image' ? 'image' : element.type === 'video' ? 'video' : element.type === 'text' ? 'text' : element.type === 'model3d' ? 'model3d' : 'image',
              url: imageUrl,
              x: element.x || 0,
              y: element.y || 0,
              width: element.width || 400,
              height: element.height || 400,
              groupId: element.meta?.groupId,
              // Store element ID for reference
              ...(element.id && { elementId: element.id }),
            };
            newImages.push(newImage);
          }
        });
        
        // Replace entire images array with snapshot (this ensures deleted elements don't reappear)
        setImages(newImages);
      } else if (op.type === 'create' && op.data.element) {
        // Add new element from create op
        const element = op.data.element as any;
        // Use proxy URL for Zata URLs to avoid CORS
        let imageUrl = element.meta?.url || element.meta?.mediaId || '';
        if (imageUrl && (imageUrl.includes('zata.ai') || imageUrl.includes('zata'))) {
          imageUrl = buildProxyResourceUrl(imageUrl);
        }
        
        const newImage: ImageUpload = {
          type: element.type === 'image' ? 'image' : element.type === 'video' ? 'video' : element.type === 'text' ? 'text' : element.type === 'model3d' ? 'model3d' : 'image',
          url: imageUrl,
          x: element.x || 0,
          y: element.y || 0,
          width: element.width || 400,
          height: element.height || 400,
          groupId: element.meta?.groupId,
          ...(element.id && { elementId: element.id }),
        };
        setImages((prev) => {
          // Check for duplicates
          if ((newImage as any).elementId) {
            const exists = prev.some(img => (img as any).elementId === (newImage as any).elementId);
            if (exists) return prev;
          }
          return [...prev, newImage];
        });
      } else if (op.type === 'update' && op.elementId) {
        // Update existing element
        setImages((prev) => {
          const index = prev.findIndex(img => (img as any).elementId === op.elementId);
          if (index >= 0 && op.data.updates) {
            const newImages = [...prev];
            newImages[index] = { ...newImages[index], ...op.data.updates };
            return newImages;
          }
          return prev;
        });
      } else if (op.type === 'delete' && op.elementId) {
        // Delete element - directly remove from state (don't call handleImageDelete to avoid sending another delete op)
        setImages((prev) => {
          const index = prev.findIndex(img => (img as any).elementId === op.elementId);
          if (index >= 0) {
            const newImages = [...prev];
            const item = newImages[index];
            // Clean up blob URL if it exists
            if (item?.url && item.url.startsWith('blob:')) {
              URL.revokeObjectURL(item.url);
            }
            newImages.splice(index, 1);
            return newImages;
          }
          return prev;
        });
      } else if (op.type === 'delete' && op.elementIds && op.elementIds.length > 0) {
        // Delete multiple elements
        setImages((prev) => {
          const elementIdsSet = new Set(op.elementIds);
          const newImages = prev.filter((img) => {
            const elementId = (img as any).elementId;
            if (elementId && elementIdsSet.has(elementId)) {
              // Clean up blob URL if it exists
              if (img?.url && img.url.startsWith('blob:')) {
                URL.revokeObjectURL(img.url);
              }
              return false; // Remove this element
            }
            return true; // Keep this element
          });
          return newImages;
        });
      } else if (op.type === 'move' && op.elementId && op.data.delta) {
        // Move element
        setImages((prev) => {
          const index = prev.findIndex(img => (img as any).elementId === op.elementId);
          if (index >= 0) {
            const newImages = [...prev];
            const current = newImages[index];
            newImages[index] = {
              ...current,
              x: (current.x || 0) + op.data.delta.x,
              y: (current.y || 0) + op.data.delta.y,
            };
            return newImages;
          }
          return prev;
        });
      }
    },
  });

  // Undo/Redo keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
      }
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || 
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  const handleImageUpdate = (index: number, updates: Partial<ImageUpload>) => {
    setImages((prev) => {
      const newImages = [...prev];
      newImages[index] = { ...newImages[index], ...updates };
      return newImages;
    });

    // Send move op to server if position changed
    if (projectId && opManagerInitialized && (updates.x !== undefined || updates.y !== undefined)) {
      const image = images[index];
      const deltaX = updates.x !== undefined ? updates.x - (image.x || 0) : 0;
      const deltaY = updates.y !== undefined ? updates.y - (image.y || 0) : 0;
      
      if (deltaX !== 0 || deltaY !== 0) {
        appendOp({
          type: 'move',
          elementId: (image as any).elementId || `img-${index}`,
          data: { delta: { x: deltaX, y: deltaY } },
        }).catch(console.error);
      }
    }
  };

  const handleImageDelete = (index: number) => {
    const image = images[index];
    
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

    // Send delete op to server
    if (projectId && opManagerInitialized) {
      appendOp({
        type: 'delete',
        elementId: (image as any).elementId || `img-${index}`,
        data: {},
      }).catch(console.error);
    }
  };

  const handleImageDownload = async (index: number) => {
    const imageData = images[index];
    if (!imageData?.url) return;

    try {
      let downloadUrl: string;
      let filename: string;

      if (imageData.url.startsWith('blob:')) {
        // For blob URLs, download directly (local files)
        const response = await fetch(imageData.url);
        const blob = await response.blob();
        filename = imageData.file?.name || `image-${Date.now()}.${imageData.type === 'video' ? 'mp4' : imageData.type === 'model3d' ? 'gltf' : 'png'}`;
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return;
      } else {
        // Use proxy download endpoint for Zata URLs and external URLs
        downloadUrl = buildProxyDownloadUrl(imageData.url);
        
        // Extract filename from URL or use default
        try {
          const urlObj = new URL(imageData.url);
          filename = urlObj.pathname.split('/').pop() || `image-${Date.now()}.${imageData.type === 'video' ? 'mp4' : 'png'}`;
        } catch {
          filename = imageData.file?.name || `image-${Date.now()}.${imageData.type === 'video' ? 'mp4' : 'png'}`;
        }
      }

      // Create download link using proxy
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      a.target = '_blank'; // Open in new tab as fallback
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download:', error);
      alert('Failed to download. Please try again.');
    }
  };

  const handleImageDuplicate = (index: number) => {
    const imageData = images[index];
    if (!imageData) return;

    // Create a duplicate to the right
    const imageWidth = imageData.width || 400;
    const duplicated: ImageUpload = {
      ...imageData,
      x: (imageData.x || 0) + imageWidth + 50, // Image width + 50px spacing
      y: imageData.y || 0, // Same Y position
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

    setImages((prev) => {
      const updated = [...prev, newImage];
      // Send create op to server
      if (projectId && opManagerInitialized) {
        appendOp({
          type: 'create',
          data: {
            element: {
              type: 'model3d',
              x: newImage.x,
              y: newImage.y,
              width: newImage.width,
              height: newImage.height,
              meta: {
                url: newImage.url,
              },
            },
          },
        }).catch(console.error);
      }
      return updated;
    });
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

      setImages((prev) => {
        const updated = [...prev, newImage];
        // Send create op to server
        if (projectId && opManagerInitialized) {
          appendOp({
            type: 'create',
            data: {
              element: {
                type: 'video',
                x: newImage.x,
                y: newImage.y,
                width: newImage.width,
                height: newImage.height,
                meta: {
                  url: newImage.url,
                },
              },
            },
          }).catch(console.error);
        }
        return updated;
      });
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

        setImages((prev) => {
          const updated = [...prev, newImage];
          // Send create op to server
          if (projectId && opManagerInitialized) {
            appendOp({
              type: 'create',
              data: {
                element: {
                  type: 'image',
                  x: newImage.x,
                  y: newImage.y,
                  width: newImage.width,
                  height: newImage.height,
                  meta: {
                    url: newImage.url,
                  },
                },
              },
            }).catch(console.error);
          }
          return updated;
        });
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

  const [selectedTool, setSelectedTool] = useState<'cursor' | 'move' | 'text' | 'image' | 'video' | 'music'>('cursor');
  const [toolClickCounter, setToolClickCounter] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null);

  const handleToolSelect = (tool: 'cursor' | 'move' | 'text' | 'image' | 'video' | 'music') => {
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

    // Send create op to server
    if (projectId && opManagerInitialized) {
      appendOp({
        type: 'create',
        data: {
          element: {
            type: 'text',
            x: newText.x,
            y: newText.y,
            width: newText.width,
            height: newText.height,
            meta: {
              text: text,
            },
          },
        },
      }).catch(console.error);
    }
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

  const handleProjectNameChange = async (name: string) => {
    setProjectName(name);
    localStorage.setItem('canvas-project-name', name);
    
    // Update project name in backend if we have a project ID
    if (projectId) {
      try {
        // TODO: Implement project update API call when available
        // await updateProject(projectId, { name });
      } catch (error) {
        console.error('Failed to update project name:', error);
      }
    }
  };


  const handleImageSelect = (file: File) => {
    // Process the selected image file
    processMediaFile(file, images.length);
  };

  const handleImageGenerate = async (
    prompt: string, 
    model: string, 
    frame: string, 
    aspectRatio: string,
    modalId?: string
  ): Promise<string | null> => {
    try {
      console.log('Generate image:', { prompt, model, frame, aspectRatio, modalId });
      
      // Ensure we have a project ID
      if (!projectId) {
        throw new Error('Project not initialized. Please refresh the page.');
      }

      // Parse aspect ratio to get width/height if needed
      const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
      const aspectRatioValue = widthRatio / heightRatio;
      const baseSize = 1024; // Base size for generation
      let genWidth: number;
      let genHeight: number;
      
      if (aspectRatioValue >= 1) {
        // Landscape or square
        genWidth = Math.round(baseSize * aspectRatioValue);
        genHeight = baseSize;
      } else {
        // Portrait
        genWidth = baseSize;
        genHeight = Math.round(baseSize / aspectRatioValue);
      }

      // Call the Canvas-specific generation API
      const result = await generateImageForCanvas(
        prompt,
        model,
        aspectRatio,
        projectId,
        genWidth,
        genHeight
      );
      
      console.log('Image generated successfully:', result);
      
      // Add the generated image to canvas
      const center = viewportCenterRef.current;
      const offsetX = (images.length % 3) * 50;
      const offsetY = Math.floor(images.length / 3) * 50;
      const imageX = center.x - (genWidth / 2) + offsetX;
      const imageY = center.y - (genHeight / 2) + offsetY;

      const elementId = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newImage: ImageUpload = {
        type: 'image',
        url: result.url,
        x: imageX,
        y: imageY,
        width: genWidth,
        height: genHeight,
        groupId: undefined, // Not grouped initially
        elementId, // Store element ID for op tracking
      };

      setImages((prev) => [...prev, newImage]);

      // Send create op to server with media reference
      if (projectId && opManagerInitialized) {
        appendOp({
          type: 'create',
          elementId: elementId, // Include elementId in op
          data: {
            element: {
              id: elementId,
              type: 'image',
              x: imageX,
              y: imageY,
              width: genWidth,
              height: genHeight,
              meta: {
                mediaId: result.mediaId,
                url: result.url,
                storagePath: result.storagePath,
              },
            },
          },
        }).catch(console.error);
      }
      
      return result.url;
    } catch (error: any) {
      console.error('Error generating image:', error);
      alert(error.message || 'Failed to generate image. Please try again.');
      throw error; // Re-throw to let the modal handle the error display
    }
  };

  const handleVideoSelect = (file: File) => {
    // Process the selected video file
    processMediaFile(file, images.length);
  };

  const handleVideoGenerate = async (prompt: string, model: string, frame: string, aspectRatio: string) => {
    if (!projectId || !prompt.trim()) {
      console.error('Missing projectId or prompt');
      return;
    }

    try {
      console.log('Generate video:', { prompt, model, frame, aspectRatio });
      
      // Call video generation API
      const result = await generateVideoForCanvas(
        prompt,
        model,
        aspectRatio,
        projectId,
        5, // Default 5 seconds duration
        '1080p' // Default 1080p resolution
      );

      console.log('Video generation started:', result);

      // For now, video generation is async and uses a queue system
      // The taskId is returned, and we need to poll for the result
      // TODO: Implement polling for video result
      // For now, show a message that generation has started
      alert('Video generation started! The video will appear when ready. (Polling not yet implemented)');
      
      // Close modal after generation starts
      setIsVideoModalOpen(false);
    } catch (error: any) {
      console.error('Error generating video:', error);
      alert(error.message || 'Failed to generate video. Please try again.');
    }
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

  return (
    <main className="w-screen h-screen overflow-hidden bg-gray-100">
      {showProjectSelector && (
        <ProjectSelector
          onProjectSelect={handleProjectSelect}
          currentProjectId={projectId}
        />
      )}
      <div className="w-full h-full relative">
        {projectId && (
          <Header 
            projectName={projectName}
            onProjectNameChange={handleProjectNameChange}
            onSwitchProject={() => setShowProjectSelector(true)}
          />
        )}
        {projectId ? (
          <>
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
            <Profile />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-600">Please select or create a project to continue</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function Home() {
  const [user, setUser] = useState<{ uid: string; username: string; email: string; credits?: number } | null>(null);

  return (
    <AuthGuard onUserLoaded={(loadedUser) => {
      setUser(loadedUser);
    }}>
      <CanvasApp user={user} />
    </AuthGuard>
  );
}
