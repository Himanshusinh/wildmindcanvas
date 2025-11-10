'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ImageUpload } from '@/types/canvas';

interface Model3DProps {
  modelData: ImageUpload;
  x: number;
  y: number;
  width: number;
  height: number;
  onUpdate?: (updates: Partial<ImageUpload>) => void;
}

export const Model3D: React.FC<Model3DProps> = ({ 
  modelData, 
  x, 
  y, 
  width, 
  height,
  onUpdate 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const rotationX = modelData.rotationX ?? 0;
  const rotationY = modelData.rotationY ?? 0;
  const zoom = modelData.zoom ?? 1;
  
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const currentRotationRef = useRef({ x: rotationX, y: rotationY });
  const currentZoomRef = useRef(zoom);
  const targetRef = useRef(new THREE.Vector3(0, 0, 0)); // Orbit target point
  const sphericalRef = useRef({ radius: 5, theta: 0, phi: Math.PI / 2 }); // Spherical coordinates for orbit
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const touchStartDistanceRef = useRef(0);
  const touchStartSphericalRef = useRef({ radius: 5, theta: 0, phi: Math.PI / 2 });

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-5, -5, -5);
    scene.add(directionalLight2);

    // Load 3D model
    const loadModel = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const fileExtension = modelData.file.name.toLowerCase().split('.').pop();
        let model: THREE.Group | null = null;

        if (fileExtension === 'obj') {
          // Load OBJ file
          const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader.js');
          const loader = new OBJLoader();
          
          const text = await fetch(modelData.url).then(res => res.text());
          model = loader.parse(text);
        } else if (fileExtension === 'fbx') {
          // Load FBX file
          const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
          const loader = new FBXLoader();
          
          const result = await loader.loadAsync(modelData.url);
          model = result;
        } else if (fileExtension === 'gltf' || fileExtension === 'glb') {
          // Load GLTF/GLB file
          const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
          const { LoadingManager } = await import('three');
          
          // Create a custom loading manager to handle blob URLs and dependencies
          const manager = new LoadingManager();
          
          // Get related files map if available
          const relatedFiles = modelData.relatedFiles || new Map();
          
          // Custom resolver for external resources
          manager.setURLModifier((url: string) => {
            // If it's already a blob URL or absolute URL, use it as-is
            if (url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
              return url;
            }
            
            // Extract filename from path (handle paths like "textures/image.png" or "scene.bin")
            const fileName = url.split('/').pop() || url;
            const normalizedUrl = url.replace(/\\/g, '/'); // Normalize path separators
            
            // Try to find the file in related files map
            // First try exact match with full path
            if (relatedFiles.has(normalizedUrl)) {
              return relatedFiles.get(normalizedUrl)!.url;
            }
            
            // Try exact filename match
            if (relatedFiles.has(fileName)) {
              return relatedFiles.get(fileName)!.url;
            }
            
            // Try to find by filename (case-insensitive, partial match)
            const lowerFileName = fileName.toLowerCase();
            for (const [key, value] of relatedFiles.entries()) {
              const lowerKey = key.toLowerCase();
              // Match if key ends with filename or contains it
              if (lowerKey === lowerFileName || 
                  lowerKey.endsWith('/' + lowerFileName) ||
                  lowerKey.endsWith('\\' + lowerFileName) ||
                  lowerKey.includes(lowerFileName)) {
                return value.url;
              }
            }
            
            // Try to match by filename without extension or with different case
            const fileNameWithoutExt = fileName.split('.').slice(0, -1).join('.');
            if (fileNameWithoutExt) {
              for (const [key, value] of relatedFiles.entries()) {
                const lowerKey = key.toLowerCase();
                if (lowerKey.includes(fileNameWithoutExt.toLowerCase())) {
                  return value.url;
                }
              }
            }
            
            // If not found in related files, return original URL
            // The loader will fail, but we'll catch it and show a helpful error
            console.warn('[GLTFLoader] Could not resolve dependency:', url, 'Available files:', Array.from(relatedFiles.keys()));
            return url;
          });
          
          const loader = new GLTFLoader(manager);
          
          // For GLB files (binary), they're self-contained and should work
          if (fileExtension === 'glb') {
            const result = await loader.loadAsync(modelData.url);
            model = result.scene;
          } else {
            // For GLTF files, try to load and handle missing dependencies gracefully
            try {
              const result = await loader.loadAsync(modelData.url);
              model = result.scene;
            } catch (gltfError: any) {
              // If it's a missing dependency error, provide helpful message
              if (gltfError.message?.includes('Failed to load') || 
                  gltfError.message?.includes('buffer') ||
                  gltfError.message?.includes('texture') ||
                  gltfError.message?.includes('ERR_FILE_NOT_FOUND')) {
                throw new Error(
                  'GLTF file requires external files (.bin, textures). ' +
                  'Please upload all related files together, or use a GLB file (self-contained). ' +
                  'Tip: Select multiple files (GLTF + .bin + textures) when uploading.'
                );
              }
              throw gltfError;
            }
          }
        } else if (fileExtension === 'mb' || fileExtension === 'ma') {
          // Maya files (MB/MA) are proprietary and not directly loadable in browser
          throw new Error(
            'Maya files (.mb/.ma) are not directly supported. ' +
            'Please export your model to a supported format: FBX, GLTF/GLB, or OBJ.'
          );
        } else {
          throw new Error(`Unsupported file format: ${fileExtension}. Supported formats: OBJ, FBX, GLTF, GLB`);
        }

        if (!model) {
          throw new Error('Failed to load model');
        }

        // Calculate bounding box to center and scale model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim; // Scale to fit in view

        model.scale.multiplyScalar(scale);
        model.position.sub(center.multiplyScalar(scale));

        // Add model to scene
        scene.add(model);
        modelRef.current = model;

        // Apply initial rotation and zoom using orbit controls
        if (model) {
          // Initialize spherical coordinates from rotation
          sphericalRef.current.theta = currentRotationRef.current.y;
          sphericalRef.current.phi = Math.PI / 2 + currentRotationRef.current.x;
          sphericalRef.current.radius = 5 / currentZoomRef.current;
          
          // Set camera position using spherical coordinates
          const x = targetRef.current.x + sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.cos(sphericalRef.current.theta);
          const y = targetRef.current.y + sphericalRef.current.radius * Math.cos(sphericalRef.current.phi);
          const z = targetRef.current.z + sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.sin(sphericalRef.current.theta);
          
          camera.position.set(x, y, z);
          camera.lookAt(targetRef.current);
        } else {
          camera.position.z = 5 / currentZoomRef.current;
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading 3D model:', err);
        setError(err instanceof Error ? err.message : 'Failed to load model');
        setIsLoading(false);
      }
    };

    loadModel();

    // Animation loop
    const animate = () => {
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (modelRef.current && sceneRef.current) {
        sceneRef.current.remove(modelRef.current);
        modelRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    };
  }, [modelData.file, modelData.url, width, height]);

  // Enhanced mouse controls for rotation and zoom (like Sketchfab)
  useEffect(() => {
    if (!containerRef.current || !cameraRef.current) return;

    const container = containerRef.current;
    const camera = cameraRef.current;

    const handleMouseDown = (e: MouseEvent) => {
      // Left click for rotation
      if (e.button === 0) {
        isDraggingRef.current = true;
        setIsDragging(true);
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
      }
      // Right click or middle mouse for panning
      else if (e.button === 2 || e.button === 1) {
        isPanningRef.current = true;
        panStartRef.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current && onUpdate) {
        // Rotation (orbit around model)
        const deltaX = e.clientX - lastMousePosRef.current.x;
        const deltaY = e.clientY - lastMousePosRef.current.y;

        // Update spherical coordinates
        sphericalRef.current.theta -= deltaX * 0.01;
        sphericalRef.current.phi += deltaY * 0.01;

        // Limit vertical rotation (phi) to prevent flipping
        sphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sphericalRef.current.phi));

        // Update camera position using spherical coordinates
        const x = targetRef.current.x + sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.cos(sphericalRef.current.theta);
        const y = targetRef.current.y + sphericalRef.current.radius * Math.cos(sphericalRef.current.phi);
        const z = targetRef.current.z + sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.sin(sphericalRef.current.theta);

        camera.position.set(x, y, z);
        camera.lookAt(targetRef.current);

        // Update rotation refs for state persistence
        currentRotationRef.current.y = sphericalRef.current.theta;
        currentRotationRef.current.x = sphericalRef.current.phi - Math.PI / 2;

        onUpdate({
          rotationX: currentRotationRef.current.x,
          rotationY: currentRotationRef.current.y,
        });

        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      } else if (isPanningRef.current) {
        // Panning (move target point)
        const deltaX = (e.clientX - panStartRef.current.x) * 0.01;
        const deltaY = (e.clientY - panStartRef.current.y) * 0.01;

        // Calculate pan direction in camera space
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        camera.getWorldDirection(new THREE.Vector3());
        right.setFromMatrixColumn(camera.matrixWorld, 0);
        up.setFromMatrixColumn(camera.matrixWorld, 1);

        targetRef.current.add(right.multiplyScalar(-deltaX));
        targetRef.current.add(up.multiplyScalar(deltaY));

        // Update camera to look at new target
        const x = targetRef.current.x + sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.cos(sphericalRef.current.theta);
        const y = targetRef.current.y + sphericalRef.current.radius * Math.cos(sphericalRef.current.phi);
        const z = targetRef.current.z + sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.sin(sphericalRef.current.theta);

        camera.position.set(x, y, z);
        camera.lookAt(targetRef.current);

        panStartRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isDraggingRef.current = false;
        setIsDragging(false);
      } else if (e.button === 2 || e.button === 1) {
        isPanningRef.current = false;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!camera || !onUpdate) return;

      // Smooth zoom with better control
      const zoomSpeed = 0.1;
      const zoomDelta = e.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
      
      // Update radius (distance from target)
      sphericalRef.current.radius *= zoomDelta;
      
      // Clamp zoom limits
      const minRadius = 1;
      const maxRadius = 20;
      sphericalRef.current.radius = Math.max(minRadius, Math.min(maxRadius, sphericalRef.current.radius));

      // Update camera position
      const x = targetRef.current.x + sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.cos(sphericalRef.current.theta);
      const y = targetRef.current.y + sphericalRef.current.radius * Math.cos(sphericalRef.current.phi);
      const z = targetRef.current.z + sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.sin(sphericalRef.current.theta);

      camera.position.set(x, y, z);
      camera.lookAt(targetRef.current);

      // Update zoom ref for state persistence
      currentZoomRef.current = 5 / sphericalRef.current.radius;

      onUpdate({
        zoom: currentZoomRef.current,
      });
    };

    // Touch support for mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch for rotation
        isDraggingRef.current = true;
        setIsDragging(true);
        lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        touchStartSphericalRef.current = { ...sphericalRef.current };
        isPanningRef.current = false; // Cancel panning if active
      } else if (e.touches.length === 2) {
        // Two touches for zoom
        isDraggingRef.current = false;
        setIsDragging(false);
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
        touchStartSphericalRef.current = { ...sphericalRef.current };
      }
      e.preventDefault();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDraggingRef.current) {
        // Rotation
        const deltaX = e.touches[0].clientX - lastMousePosRef.current.x;
        const deltaY = e.touches[0].clientY - lastMousePosRef.current.y;

        sphericalRef.current.theta = touchStartSphericalRef.current.theta - deltaX * 0.01;
        sphericalRef.current.phi = touchStartSphericalRef.current.phi + deltaY * 0.01;
        sphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sphericalRef.current.phi));

        const x = targetRef.current.x + sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.cos(sphericalRef.current.theta);
        const y = targetRef.current.y + sphericalRef.current.radius * Math.cos(sphericalRef.current.phi);
        const z = targetRef.current.z + sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.sin(sphericalRef.current.theta);

        camera.position.set(x, y, z);
        camera.lookAt(targetRef.current);

        currentRotationRef.current.y = sphericalRef.current.theta;
        currentRotationRef.current.x = sphericalRef.current.phi - Math.PI / 2;

        if (onUpdate) {
          onUpdate({
            rotationX: currentRotationRef.current.x,
            rotationY: currentRotationRef.current.y,
          });
        }

        lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        // Zoom (pinch)
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (touchStartDistanceRef.current > 0) {
          const scale = touchStartDistanceRef.current / distance;

          sphericalRef.current.radius = touchStartSphericalRef.current.radius * scale;
          sphericalRef.current.radius = Math.max(1, Math.min(20, sphericalRef.current.radius));

          const x = targetRef.current.x + sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.cos(sphericalRef.current.theta);
          const y = targetRef.current.y + sphericalRef.current.radius * Math.cos(sphericalRef.current.phi);
          const z = targetRef.current.z + sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.sin(sphericalRef.current.theta);

          camera.position.set(x, y, z);
          camera.lookAt(targetRef.current);

          currentZoomRef.current = 5 / sphericalRef.current.radius;

          if (onUpdate) {
            onUpdate({
              zoom: currentZoomRef.current,
            });
          }
        }
      }
      e.preventDefault();
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    // Prevent context menu on right click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('contextmenu', handleContextMenu);
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('contextmenu', handleContextMenu);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onUpdate]);

  // Update rotation and zoom when props change
  useEffect(() => {
    if (cameraRef.current) {
      // Update spherical coordinates from props
      sphericalRef.current.theta = rotationY;
      sphericalRef.current.phi = Math.PI / 2 + rotationX;
      sphericalRef.current.radius = 5 / zoom;
      
      // Update camera position
      const x = targetRef.current.x + sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.cos(sphericalRef.current.theta);
      const y = targetRef.current.y + sphericalRef.current.radius * Math.cos(sphericalRef.current.phi);
      const z = targetRef.current.z + sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.sin(sphericalRef.current.theta);
      
      cameraRef.current.position.set(x, y, z);
      cameraRef.current.lookAt(targetRef.current);
      
      // Update refs
      currentRotationRef.current.x = rotationX;
      currentRotationRef.current.y = rotationY;
      currentZoomRef.current = zoom;
    }
  }, [rotationX, rotationY, zoom]);

  // Update renderer size when dimensions change
  useEffect(() => {
    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [width, height]);

  // Zoom in/out functions
  const handleZoomIn = () => {
    if (!cameraRef.current || !onUpdate) return;
    
    const zoomSpeed = 0.2;
    sphericalRef.current.radius *= (1 - zoomSpeed);
    sphericalRef.current.radius = Math.max(1, Math.min(20, sphericalRef.current.radius));

    const x = targetRef.current.x + sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.cos(sphericalRef.current.theta);
    const y = targetRef.current.y + sphericalRef.current.radius * Math.cos(sphericalRef.current.phi);
    const z = targetRef.current.z + sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.sin(sphericalRef.current.theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(targetRef.current);

    currentZoomRef.current = 5 / sphericalRef.current.radius;

    onUpdate({
      zoom: currentZoomRef.current,
    });
  };

  const handleZoomOut = () => {
    if (!cameraRef.current || !onUpdate) return;
    
    const zoomSpeed = 0.2;
    sphericalRef.current.radius *= (1 + zoomSpeed);
    sphericalRef.current.radius = Math.max(1, Math.min(20, sphericalRef.current.radius));

    const x = targetRef.current.x + sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.cos(sphericalRef.current.theta);
    const y = targetRef.current.y + sphericalRef.current.radius * Math.cos(sphericalRef.current.phi);
    const z = targetRef.current.z + sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.sin(sphericalRef.current.theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(targetRef.current);

    currentZoomRef.current = 5 / sphericalRef.current.radius;

    onUpdate({
      zoom: currentZoomRef.current,
    });
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        border: '1px solid #ccc',
        borderRadius: '4px',
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#666',
            fontSize: '14px',
          }}
        >
          Loading 3D model...
        </div>
      )}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#f00',
            fontSize: '14px',
            textAlign: 'center',
            padding: '10px',
          }}
        >
          Error: {error}
        </div>
      )}
      
      {/* Zoom Controls */}
      {!isLoading && !error && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 10,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleZoomIn();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            aria-label="Zoom in"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleZoomOut();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            aria-label="Zoom out"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

