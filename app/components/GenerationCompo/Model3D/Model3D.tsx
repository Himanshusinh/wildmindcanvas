'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Model3DProps, Model3DRefs, SphericalCoords } from './types';
import { useModel3DLoader } from './useModel3DLoader';
import { useModel3DScene } from './useModel3DScene';
import { useModel3DControls } from './useModel3DControls';
import { Model3DZoomControls } from './Model3DZoomControls';

export const Model3D: React.FC<Model3DProps> = ({ 
  modelData, 
  x, 
  y, 
  width, 
  height,
  onUpdate 
}) => {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const currentRotationRef = useRef({ x: modelData.rotationX ?? 0, y: modelData.rotationY ?? 0 });
  const currentZoomRef = useRef(modelData.zoom ?? 1);
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));
  const sphericalRef = useRef<SphericalCoords>({ radius: 5, theta: 0, phi: Math.PI / 2 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const touchStartDistanceRef = useRef(0);
  const touchStartSphericalRef = useRef<SphericalCoords>({ radius: 5, theta: 0, phi: Math.PI / 2 });

  const refs: Model3DRefs = {
    containerRef,
    canvasRef,
    sceneRef,
    cameraRef,
    rendererRef,
    modelRef,
    animationFrameRef,
    isDraggingRef,
    lastMousePosRef,
    currentRotationRef,
    currentZoomRef,
    targetRef,
    sphericalRef,
    isPanningRef,
    panStartRef,
    touchStartDistanceRef,
    touchStartSphericalRef,
  };

  const rotationX = modelData.rotationX ?? 0;
  const rotationY = modelData.rotationY ?? 0;
  const zoom = modelData.zoom ?? 1;
  
  const [isDragging, setIsDragging] = useState(false);
  const [model, setModel] = useState<THREE.Group | null>(null);
  
  const { loadModel, isLoading, error } = useModel3DLoader();

  // Load model
  useEffect(() => {
    const load = async () => {
      const loadedModel = await loadModel(modelData);
      if (loadedModel) {
        setModel(loadedModel);
      }
    };
    load();
  }, [modelData.file, modelData.url]);

  // Setup scene
  useModel3DScene({
    refs,
    width,
    height,
    model,
    rotationX,
    rotationY,
    zoom,
    sphericalRef,
    targetRef,
    currentRotationRef,
    currentZoomRef,
  });

  // Setup controls
  useModel3DControls({
    refs,
    onUpdate,
    setIsDragging,
  });

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
        <Model3DZoomControls refs={refs} onUpdate={onUpdate} />
      )}
    </div>
  );
};

