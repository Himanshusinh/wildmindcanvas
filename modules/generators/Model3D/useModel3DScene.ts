import { useEffect, useRef } from 'react';
import { Scene, Color, PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight, Vector3, Mesh, Group } from 'three';
import { Model3DRefs, SphericalCoords } from './types';

interface UseModel3DSceneProps {
  refs: Model3DRefs;
  width: number;
  height: number;
  model: Group | null;
  rotationX: number;
  rotationY: number;
  zoom: number;
  sphericalRef: React.RefObject<SphericalCoords>;
  targetRef: React.RefObject<Vector3>;
  currentRotationRef: React.RefObject<{ x: number; y: number }>;
  currentZoomRef: React.RefObject<number>;
}

export function useModel3DScene({
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
}: UseModel3DSceneProps) {
  // Initialize Three.js scene
  useEffect(() => {
    if (!refs.containerRef.current || !refs.canvasRef.current) return;

    const container = refs.containerRef.current;
    const canvas = refs.canvasRef.current;

    // Scene setup
    // Scene setup
    const scene = new Scene();
    scene.background = new Color(0xf0f0f0);
    refs.sceneRef.current = scene;

    // Camera setup
    const camera = new PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    refs.cameraRef.current = camera;

    // Renderer setup
    const renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    refs.rendererRef.current = renderer;

    // Lighting
    const ambientLight = new AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-5, -5, -5);
    scene.add(directionalLight2);

    // Add model to scene if available
    if (model) {
      scene.add(model);
      refs.modelRef.current = model;

      // Apply initial rotation and zoom using orbit controls
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

    // Animation loop
    const animate = () => {
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
      if (refs.animationFrameRef.current !== null) {
        refs.animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    refs.animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (refs.animationFrameRef.current !== null) {
        cancelAnimationFrame(refs.animationFrameRef.current);
      }
      if (refs.rendererRef.current) {
        refs.rendererRef.current.dispose();
      }
      if (refs.modelRef.current && refs.sceneRef.current) {
        refs.sceneRef.current.remove(refs.modelRef.current);
        refs.modelRef.current.traverse((child) => {
          if (child instanceof Mesh) {
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
  }, [refs, width, height, model, sphericalRef, targetRef, currentRotationRef, currentZoomRef]);

  // Update rotation and zoom when props change
  useEffect(() => {
    if (refs.cameraRef.current) {
      // Update spherical coordinates from props
      sphericalRef.current.theta = rotationY;
      sphericalRef.current.phi = Math.PI / 2 + rotationX;
      sphericalRef.current.radius = 5 / zoom;

      // Update camera position
      const x = targetRef.current.x + sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.cos(sphericalRef.current.theta);
      const y = targetRef.current.y + sphericalRef.current.radius * Math.cos(sphericalRef.current.phi);
      const z = targetRef.current.z + sphericalRef.current.radius * Math.sin(sphericalRef.current.phi) * Math.sin(sphericalRef.current.theta);

      refs.cameraRef.current.position.set(x, y, z);
      refs.cameraRef.current.lookAt(targetRef.current);

      // Update refs
      currentRotationRef.current.x = rotationX;
      currentRotationRef.current.y = rotationY;
      currentZoomRef.current = zoom;
    }
  }, [refs, rotationX, rotationY, zoom, sphericalRef, targetRef, currentRotationRef, currentZoomRef]);

  // Update renderer size when dimensions change
  useEffect(() => {
    if (refs.rendererRef.current && refs.cameraRef.current) {
      refs.rendererRef.current.setSize(width, height);
      refs.cameraRef.current.aspect = width / height;
      refs.cameraRef.current.updateProjectionMatrix();
    }
  }, [refs, width, height]);
}

