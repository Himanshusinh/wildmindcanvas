'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';
import { RotateCcw, Rocket } from 'lucide-react';

interface Camera3DControlProps {
  horizontalAngle: number; // 0 to 360 degrees (full rotation)
  verticalAngle: number; // -30 to +90 degrees (down/up)
  zoom: number; // 0 to 10 (zoom level)
  onHorizontalAngleChange: (angle: number) => void;
  onVerticalAngleChange: (angle: number) => void;
  onZoomChange: (zoom: number) => void;
  scale: number;
  sourceImageUrl?: string | null;
  onGenerate?: () => void;
  showButtons?: boolean; // Whether to show Reset/Generate buttons
}

export const Camera3DControl: React.FC<Camera3DControlProps> = ({
  horizontalAngle,
  verticalAngle,
  zoom,
  onHorizontalAngleChange,
  onVerticalAngleChange,
  onZoomChange,
  scale,
  sourceImageUrl,
  onGenerate,
  showButtons = true, // Default to showing buttons for backward compatibility
}) => {
  const isDark = useIsDarkTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'rotation' | 'vertical' | 'zoom' | null>(null);
  const [hoveredSphere, setHoveredSphere] = useState<'rotation' | 'vertical' | 'zoom' | null>(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const [statusMessage, setStatusMessage] = useState('');
  
  // Refs to store current values for animation loop
  const horizontalAngleRef = useRef(horizontalAngle);
  const verticalAngleRef = useRef(verticalAngle);
  const zoomRef = useRef(zoom);
  
  // Refs for 3D objects
  const rotationSphereRef = useRef<THREE.Mesh | null>(null);
  const verticalSphereRef = useRef<THREE.Mesh | null>(null);
  const zoomSphereRef = useRef<THREE.Mesh | null>(null);
  const cameraModelRef = useRef<THREE.Group | null>(null);
  const imagePlaneRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const mouseRef = useRef(new THREE.Vector2());
  
  // Update refs when props change
  useEffect(() => {
    horizontalAngleRef.current = horizontalAngle;
    verticalAngleRef.current = verticalAngle;
    zoomRef.current = zoom;
  }, [horizontalAngle, verticalAngle, zoom]);

  // Colors matching the reference image exactly
  const rotationColor = '#14b8a6'; // Teal-green (matches reference)
  const verticalColor = '#ec4899'; // Bright pink (matches reference)
  const zoomColor = '#fb923c'; // Orange (matches reference)
  const bgColor = isDark ? '#1a1a1a' : '#f3f4f6';
  const gridColor = isDark ? '#333333' : '#d1d5db';
  const textColor = isDark ? '#ffffff' : '#1a1a1a';
  const cameraColor = '#1e40af'; // Dark blue
  const lensColor = '#fbbf24'; // Yellow

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgColor);
    sceneRef.current = scene;

    // Camera (view camera, not the camera model)
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    // Raycaster for mouse interaction
    const raycaster = new THREE.Raycaster();
    raycasterRef.current = raycaster;

    // Grid floor for spatial reference
    const gridHelper = new THREE.GridHelper(10, 20, gridColor, gridColor);
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    gridHelper.rotation.x = Math.PI / 2; // Lay flat on the ground
    gridHelper.position.y = -1.5;
    scene.add(gridHelper);

    // Central image plane (the target being edited)
    const imagePlaneGeometry = new THREE.PlaneGeometry(3, 3); // Increased image size
    let imagePlaneMaterial: THREE.MeshBasicMaterial;
    
    if (sourceImageUrl) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        sourceImageUrl,
        (texture) => {
          // Keep the image upright (avoid vertical inversion)
          // Three.js TextureLoader defaults to flipY=true which matches PlaneGeometry UVs.
          texture.flipY = true;
          // Slightly improve clarity on angled planes
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.needsUpdate = true;
          if (imagePlaneRef.current) {
            (imagePlaneRef.current.material as THREE.MeshBasicMaterial).map = texture;
            (imagePlaneRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
          }
        },
        undefined,
        (error) => {
          console.error('[Camera3DControl] Failed to load image:', error);
        }
      );
      imagePlaneMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        side: THREE.DoubleSide,
      });
    } else {
      // Fallback: simple colored plane
      imagePlaneMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x2d2d2d,
        side: THREE.DoubleSide,
      });
    }
    
    const imagePlane = new THREE.Mesh(imagePlaneGeometry, imagePlaneMaterial);
    imagePlane.position.set(0, 0, 0);
    // Rotate horizontally about 24 degrees from RIGHT side (Y-axis rotation)
    // This matches the reference image where the plane is angled, not perfectly front-on
    // No X tilt - just horizontal rotation, image not inverted
    imagePlane.rotation.y = (-32 * Math.PI) / 180; // -24 degrees rotation (right side)
    scene.add(imagePlane);
    imagePlaneRef.current = imagePlane;

    // Camera model (orbiting camera)
    const cameraGroup = new THREE.Group();
    
    // Camera body (box)
    const cameraBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.3, 0.6),
      new THREE.MeshStandardMaterial({ color: cameraColor })
    );
    cameraBody.position.set(0, 0, 0);
    cameraGroup.add(cameraBody);

    // Camera lens (sphere)
    const lens = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 32, 32),
      new THREE.MeshStandardMaterial({ color: lensColor, emissive: lensColor, emissiveIntensity: 0.5 })
    );
    lens.position.set(0, 0, 0.35);
    cameraGroup.add(lens);

    scene.add(cameraGroup);
    cameraModelRef.current = cameraGroup;

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Get current values from refs
      const currentHorizontalAngle = horizontalAngleRef.current;
      const currentVerticalAngle = verticalAngleRef.current;
      const currentZoom = zoomRef.current;
      
      // Calculate camera position
      // Rotation: 0° to 360° (full circle around Y-axis)
      // Vertical: -30° to +90° (down to up around X-axis)
      // Zoom: 0 to 10 (distance multiplier, higher = closer)
      
      const hRad = (currentHorizontalAngle * Math.PI) / 180; // 0 to 2π
      const vRad = (currentVerticalAngle * Math.PI) / 180; // -30° to +90°
      
      // Base distance from center - increased for larger image view
      const baseDistance = 5.5;
      // Zoom: 0 = far, 10 = close. Map 0-10 to distance multiplier
      // When zoom = 0, use max distance (1.0). When zoom = 10, use min distance (0.1).
      // Higher zoom value = zoom in = closer = less distance
      // Lower zoom value = zoom out = farther = more distance
      const zoomMultiplier = 1.0 - (currentZoom / 10) * 0.9; // 1.0 (far at zoom 0) to 0.1 (close at zoom 10)
      const distance = baseDistance * zoomMultiplier;
      
      // Calculate position using spherical coordinates
      // Horizontal rotation around Y-axis (0° = front, 90° = right, 180° = back, 270° = left)
      // Keep camera orbit direction in sync with the green rotation control.
      const yawForOrbit = hRad; // Direct mapping: 0° = 0 rad, 360° = 2π rad
      const x = distance * Math.cos(yawForOrbit) * Math.cos(vRad);
      const y = distance * Math.sin(vRad);
      const z = distance * Math.sin(yawForOrbit) * Math.cos(vRad);
      
      // Update camera model position
      cameraGroup.position.set(x, y, z);
      
      // Make camera look at center (0, 0, 0)
      cameraGroup.lookAt(0, 0, 0);

      // Keep the image/card STATIC (user request).
      // Rotation should be represented by the camera orbit + the green rotation control,
      // not by rotating the image plane itself.
      
      // Update line of sight
      if ((scene as any).lineOfSight) {
        scene.remove((scene as any).lineOfSight);
      }
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, y, z),
        new THREE.Vector3(0, 0, 0),
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: zoomColor, 
        linewidth: 2, // Thin orange line to match reference
        opacity: 0.7,
        transparent: true,
      });
      const lineOfSight = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(lineOfSight);
      (scene as any).lineOfSight = lineOfSight;

      // (A) Rotation Control – Teal-green FULL 360° circle around camera (matches reference)
      // The green path forms a complete circle that wraps around the camera
      if ((scene as any).rotationArc) {
        scene.remove((scene as any).rotationArc);
      }
      const rotationArcPoints: THREE.Vector3[] = [];
      const rotationArcRadius = 2.5;
      // Create a full 360° circle in 3D space that wraps around the camera
      // Complete circle from 0° to 360°, positioned in front/around the camera
      for (let i = 0; i <= 256; i++) {
        const angle = (i / 256) * Math.PI * 2; // 0° to 360° (full circle)
        // Position arc in 3D space: curves around camera position
        // Maintains the same 3D angle and positioning as before
        const arcX = Math.cos(angle) * rotationArcRadius;
        const arcY = Math.sin(angle) * rotationArcRadius * 0.4; // Vertical curve
        // Depth variation should go BOTH front and back; using sin(angle * 0.5) kept it always in front
        // which made the knob appear opposite when the camera/light is behind the image.
        const arcZ = Math.sin(angle) * rotationArcRadius * 0.3;
        rotationArcPoints.push(new THREE.Vector3(arcX, arcY, arcZ));
      }
      const rotationArcGeometry = new THREE.BufferGeometry().setFromPoints(rotationArcPoints);
      const rotationArcMaterial = new THREE.LineBasicMaterial({ 
        color: rotationColor, 
        linewidth: 1, // Thin line
        opacity: 0.8,
        transparent: true,
      });
      const rotationArc = new THREE.Line(rotationArcGeometry, rotationArcMaterial);
      scene.add(rotationArc);
      (scene as any).rotationArc = rotationArc;

      // Rotation sphere indicator (draggable knob) - teal-green
      if (rotationSphereRef.current) {
        scene.remove(rotationSphereRef.current);
      }
      const rotationSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16), // Small circle
        new THREE.MeshStandardMaterial({ 
          color: rotationColor, 
          emissive: rotationColor, 
          emissiveIntensity: hoveredSphere === 'rotation' || (isDragging && dragType === 'rotation') ? 1.5 : 1.0 
        })
      );
      // Place the knob on the arc using the current horizontal rotation angle
      // Map horizontalAngle (0 to 360) to full circle (0 to 2π) for visual positioning
      // The sphere should follow the mouse position naturally
      const normalizedAngle = hRad; // Direct mapping: 0° = 0 rad, 360° = 2π rad
      const sphereX = Math.cos(normalizedAngle) * rotationArcRadius;
      const sphereY = Math.sin(normalizedAngle) * rotationArcRadius * 0.4;
      // Must match arcZ formula so the knob stays aligned with the camera/light direction
      const sphereZ = Math.sin(normalizedAngle) * rotationArcRadius * 0.3;
      rotationSphere.position.set(sphereX, sphereY, sphereZ);
      scene.add(rotationSphere);
      rotationSphereRef.current = rotationSphere;

      // (B) Vertical Tilt Control – Bright pink thick vertical arc hugging the camera (match screenshot)
      // The pink line should look like a tall, mostly-vertical arc right next to the camera.
      if ((scene as any).verticalArc) {
        scene.remove((scene as any).verticalArc);
      }
      const verticalArcPoints: THREE.Vector3[] = [];
      const verticalArcRadius = 2.8; // tall arc
      const verticalArcX = -1.25; // anchor near camera on the left
      const verticalArcZCenter = 0.15; // small forward offset so it's clearly visible
      // Make it a clear \"C\" curve like the reference by bowing the arc sideways (X)
      // and forward/back (Z) as it goes up/down.
      const verticalXBow = 0.55; // how much it curves sideways (bigger = more C-shape)
      const verticalZBow = 0.55; // how much it bulges in depth
      for (let i = 0; i <= 160; i++) {
        const angle = (-30 + (i / 160) * 120) * Math.PI / 180; // -30° to +90°
        const arcY = Math.sin(angle) * verticalArcRadius;
        // Stronger bow to make the curve visible (C-shape)
        // Flip the bow direction so the curve goes OUTSIDE (bulges outward) instead of inside.
        const arcX = verticalArcX - Math.cos(angle) * verticalXBow;
        const arcZ = verticalArcZCenter - Math.cos(angle) * verticalZBow;
        verticalArcPoints.push(new THREE.Vector3(arcX, arcY, arcZ));
      }
      const verticalArcGeometry = new THREE.BufferGeometry().setFromPoints(verticalArcPoints);
      const verticalArcMaterial = new THREE.LineBasicMaterial({ 
        color: verticalColor, 
        linewidth: 1.5, // Thin line
        opacity: 0.9,
        transparent: true,
      });
      const verticalArc = new THREE.Line(verticalArcGeometry, verticalArcMaterial);
      scene.add(verticalArc);
      (scene as any).verticalArc = verticalArc;

      // Vertical sphere indicator (draggable knob) - bright pink
      if (verticalSphereRef.current) {
        scene.remove(verticalSphereRef.current);
      }
      const verticalSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 16, 16), // Small circle
        new THREE.MeshStandardMaterial({ 
          color: verticalColor, 
          emissive: verticalColor, 
          emissiveIntensity: hoveredSphere === 'vertical' || (isDragging && dragType === 'vertical') ? 1.5 : 1.0 
        })
      );
      const verticalAngle = vRad;
      const vSphereX = verticalArcX - Math.cos(verticalAngle) * verticalXBow;
      const vSphereY = Math.sin(verticalAngle) * verticalArcRadius;
      const vSphereZ = verticalArcZCenter - Math.cos(verticalAngle) * verticalZBow;
      verticalSphere.position.set(vSphereX, vSphereY, vSphereZ);
      scene.add(verticalSphere);
      verticalSphereRef.current = verticalSphere;

      // (C) Zoom Control - Orange line + yellow/orange ball that slides toward the image when zooming in
      if ((scene as any).zoomLine) {
        scene.remove((scene as any).zoomLine);
      }
      // Draw the zoom line along the current camera -> image (origin) direction so it feels intuitive.
      const camPos = new THREE.Vector3(x, y, z);
      const zoomLinePoints = [
        new THREE.Vector3(0, 0, 0), // image center
        camPos.clone(), // camera position
      ];
      const zoomLineGeometry = new THREE.BufferGeometry().setFromPoints(zoomLinePoints);
      const zoomLineMaterial = new THREE.LineBasicMaterial({ 
        color: zoomColor, 
        linewidth: 1, // Thin line
        opacity: 0.7,
        transparent: true,
      });
      const zoomLine = new THREE.Line(zoomLineGeometry, zoomLineMaterial);
      scene.add(zoomLine);
      (scene as any).zoomLine = zoomLine;

      // Zoom sphere indicator (draggable knob)
      if (zoomSphereRef.current) {
        scene.remove(zoomSphereRef.current);
      }
      const zoomSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.10, 16, 16), // Small circle
        new THREE.MeshStandardMaterial({ 
          color: zoomColor, 
          emissive: zoomColor, 
          emissiveIntensity: hoveredSphere === 'zoom' || (isDragging && dragType === 'zoom') ? 1.2 : 0.8 
        })
      );
      // Move the yellow/orange ball toward the image when zooming in.
      // zoomT: 0 (zoom=0) -> ball near camera, 1 (zoom=10) -> ball near image.
      const zoomT = currentZoom / 10; // 0..1 (clamp to ensure it's in range)
      const clampedZoomT = Math.max(0, Math.min(1, zoomT));
      const alpha = 0.85 - (0.7 * clampedZoomT); // 0.85 (near camera) -> 0.15 (near image)
      zoomSphere.position.copy(camPos.clone().multiplyScalar(alpha));
      scene.add(zoomSphere);
      zoomSphereRef.current = zoomSphere;

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Clean up scene objects
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else {
            object.material.dispose();
          }
        } else if (object instanceof THREE.Line) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, [bgColor, gridColor, rotationColor, verticalColor, zoomColor, cameraColor, lensColor, sourceImageUrl, hoveredSphere, isDragging, dragType]);

  // Mouse interaction
  const getMousePosition = (e: React.MouseEvent): THREE.Vector2 => {
    if (!containerRef.current) return new THREE.Vector2();
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    return new THREE.Vector2(x, y);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current || !raycasterRef.current || !cameraRef.current || !sceneRef.current) return;
    
    // Always track mouse in LOCAL (container) coordinates so drag deltas are consistent.
    const rect = containerRef.current.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    const mouse = getMousePosition(e);
    mouseRef.current = mouse;
    raycasterRef.current.setFromCamera(mouse, cameraRef.current);
    
    // Increase threshold for easier clicking on spheres
    raycasterRef.current.params.Points = { threshold: 0.25 };
    
    const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);
    
    // Check for sphere intersections first (most specific)
    for (const intersect of intersects) {
      if (intersect.object === rotationSphereRef.current) {
        setIsDragging(true);
        setDragType('rotation');
        setStatusMessage(`Rotate ${horizontalAngle.toFixed(0)}°`);
        e.preventDefault();
        e.stopPropagation();
        lastMousePosRef.current = { x: localX, y: localY };
        return;
      } else if (intersect.object === verticalSphereRef.current) {
        setIsDragging(true);
        setDragType('vertical');
        const direction = verticalAngle >= 0 ? 'up' : 'down';
        setStatusMessage(`Tilt ${Math.abs(verticalAngle).toFixed(0)}° ${direction}`);
        e.preventDefault();
        e.stopPropagation();
        lastMousePosRef.current = { x: localX, y: localY };
        return;
      } else if (intersect.object === zoomSphereRef.current) {
        setIsDragging(true);
        setDragType('zoom');
        setStatusMessage(`Zoom: ${zoom.toFixed(1)}`);
        e.preventDefault();
        e.stopPropagation();
        lastMousePosRef.current = { x: localX, y: localY };
        return;
      }
    }
    
    lastMousePosRef.current = { x: localX, y: localY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - lastMousePosRef.current.x;
    const dy = y - lastMousePosRef.current.y;
    
    // Update last position for next frame
    lastMousePosRef.current = { x, y };
    
    if (dragType === 'rotation') {
      // Dragging left/right rotates camera around Y-axis
      // Smooth circular motion: calculate angle from center of viewport
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;
      
      // Calculate angle from center (atan2 gives -π to +π, 0° = right, 90° = down)
      // IMPORTANT: screen-space Y increases downward, which makes atan2 rotate clockwise.
      // Our 3D orbit + knob placement assume counter-clockwise angles, so flip Y here
      // to keep the knob + camera/light moving in the same direction as the drag.
      const angle = Math.atan2(-mouseY, mouseX);
      // Convert to degrees: -180° to +180°, then normalize to 0° to 360°
      let newAngle = (angle * 180) / Math.PI;
      if (newAngle < 0) newAngle += 360; // Convert -180° to +180° to 0° to 360°
      
      // Clamp to 0° to 360° range
      newAngle = Math.max(0, Math.min(360, newAngle));
      
      onHorizontalAngleChange(newAngle);
      setStatusMessage(`Rotate ${newAngle.toFixed(0)}°`);
    } else if (dragType === 'vertical') {
      // Dragging up/down tilts camera around X-axis
      // Smooth and responsive vertical tilt
      const sensitivity = 0.5;
      // UX: dragging UP should tilt UP (increase angle). In screen-space, UP => dy is negative.
      // So subtract dy to make UP increase the value.
      let newAngle = verticalAngle - dy * sensitivity;
      // Clamp to -30° to +90°
      if (newAngle < -30) newAngle = -30;
      if (newAngle > 90) newAngle = 90;
      onVerticalAngleChange(newAngle);
      const direction = newAngle >= 0 ? 'up' : 'down';
      setStatusMessage(`Tilt ${Math.abs(newAngle).toFixed(0)}° ${direction}`);
    } else if (dragType === 'zoom') {
      // Dragging zoom ball should move ALONG the orange zoom line (camera <-> image),
      // not just up/down. Project the camera->image direction into screen-space and
      // apply mouse delta along that axis so the ball + light/camera stay in sync.
      const cam = cameraRef.current;
      if (!cam) return;

      // Recompute the current orbit camera position from current values (same math as render loop)
      const hRad = (horizontalAngle * Math.PI) / 180;
      const vRad = (verticalAngle * Math.PI) / 180;
      const baseDistance = 5.5;
      const zoomMultiplier = 1.0 - (zoom / 10) * 0.9;
      const distance = baseDistance * zoomMultiplier;
      const camPos = new THREE.Vector3(
        distance * Math.cos(hRad) * Math.cos(vRad),
        distance * Math.sin(vRad),
        distance * Math.sin(hRad) * Math.cos(vRad)
      );

      // Project origin and camera position to screen pixels
      const originNdc = new THREE.Vector3(0, 0, 0).project(cam);
      const camNdc = camPos.clone().project(cam);
      const originPx = new THREE.Vector2(
        (originNdc.x * 0.5 + 0.5) * rect.width,
        (-originNdc.y * 0.5 + 0.5) * rect.height
      );
      const camPx = new THREE.Vector2(
        (camNdc.x * 0.5 + 0.5) * rect.width,
        (-camNdc.y * 0.5 + 0.5) * rect.height
      );

      // Screen direction from image(origin) -> camera
      const dir = camPx.clone().sub(originPx);
      const len = dir.length();
      if (len < 1e-3) return;
      dir.multiplyScalar(1 / len);

      // Mouse movement along the line. Dragging toward the image should zoom IN.
      const along = -(dx * dir.x + dy * dir.y);
      const sensitivity = 0.03; // pixels -> zoom units (tweak for usability)
      let newZoom = zoom + along * sensitivity;

      // Clamp to 0 to 10
      if (newZoom < 0) newZoom = 0;
      if (newZoom > 10) newZoom = 10;
      onZoomChange(newZoom);
      setStatusMessage(`Zoom: ${newZoom.toFixed(1)}`);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragType(null);
    setStatusMessage('');
  };

  // Hover detection
  useEffect(() => {
    if (!containerRef.current || !raycasterRef.current || !cameraRef.current || !sceneRef.current) return;
    
    const handleMouseMoveHover = (e: MouseEvent) => {
      if (isDragging) return;
      
      const rect = containerRef.current!.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current!.setFromCamera(new THREE.Vector2(x, y), cameraRef.current!);
      const intersects = raycasterRef.current!.intersectObjects(sceneRef.current!.children, true);
      
      let newHovered: 'rotation' | 'vertical' | 'zoom' | null = null;
      for (const intersect of intersects) {
        if (intersect.object === rotationSphereRef.current) {
          newHovered = 'rotation';
          break;
        } else if (intersect.object === verticalSphereRef.current) {
          newHovered = 'vertical';
          break;
        } else if (intersect.object === zoomSphereRef.current) {
          newHovered = 'zoom';
          break;
        }
      }
      
      if (newHovered !== hoveredSphere) {
        setHoveredSphere(newHovered);
      }
    };
    
    containerRef.current.addEventListener('mousemove', handleMouseMoveHover);
    return () => {
      containerRef.current?.removeEventListener('mousemove', handleMouseMoveHover);
    };
  }, [isDragging, hoveredSphere]);

  const handleReset = () => {
    onHorizontalAngleChange(0);
    onVerticalAngleChange(0);
    // zoom range is 0..10 in this control
    onZoomChange(0);
  };

  const handleGenerateClick = () => {
    if (onGenerate) {
      console.log('[Camera3DControl] Current camera values:', {
        rotation: horizontalAngle,
        tilt: verticalAngle,
        zoom: zoom,
      });
      onGenerate();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${8 * scale}px`, width: '100%', height: '100%' }}>
      {/* 3D Viewport - Maximized */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          width: '100%',
          flex: 1,
          minHeight: '400px',
          position: 'relative',
          backgroundColor: bgColor,
          borderRadius: `${8 * scale}px`,
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : (hoveredSphere ? 'pointer' : 'default'),
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        }}
      >
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
        
        {/* Legend - Positioned at top-left with values */}
        <div
          style={{
            position: 'absolute',
            top: `${12 * scale}px`,
            left: `${12 * scale}px`,
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
            borderRadius: `${6 * scale}px`,
            padding: `${8 * scale}px ${12 * scale}px`,
            fontSize: `${11 * scale}px`,
            color: textColor,
            display: 'flex',
            flexDirection: 'row',
            gap: `${16 * scale}px`,
            alignItems: 'center',
            backdropFilter: 'blur(10px)',
            boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: `${6 * scale}px` }}>
            <div
              style={{
                width: `${10 * scale}px`,
                height: `${10 * scale}px`,
                borderRadius: '50%',
                backgroundColor: rotationColor,
                flexShrink: 0,
              }}
            />
            <span style={{ whiteSpace: 'nowrap' }}>Rotation (↔):</span>
            <span style={{ fontWeight: 600, minWidth: `${45 * scale}px`, textAlign: 'right' }}>{horizontalAngle.toFixed(0)}°</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: `${6 * scale}px` }}>
            <div
              style={{
                width: `${10 * scale}px`,
                height: `${10 * scale}px`,
                borderRadius: '50%',
                backgroundColor: verticalColor,
                flexShrink: 0,
              }}
            />
            <span style={{ whiteSpace: 'nowrap' }}>Vertical Tilt (↕):</span>
            <span style={{ fontWeight: 600, minWidth: `${45 * scale}px`, textAlign: 'right' }}>
              {verticalAngle >= 0 ? '+' : ''}{verticalAngle.toFixed(0)}°
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: `${6 * scale}px` }}>
            <div
              style={{
                width: `${10 * scale}px`,
                height: `${10 * scale}px`,
                borderRadius: '50%',
                backgroundColor: zoomColor,
                flexShrink: 0,
              }}
            />
            <span style={{ whiteSpace: 'nowrap' }}>Distance/Zoom:</span>
            <span style={{ fontWeight: 600, minWidth: `${45 * scale}px`, textAlign: 'right' }}>{zoom.toFixed(1)}</span>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            style={{
              position: 'absolute',
              bottom: `${12 * scale}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)',
              color: '#22c55e',
              padding: `${6 * scale}px ${12 * scale}px`,
              borderRadius: `${6 * scale}px`,
              fontSize: `${11 * scale}px`,
              fontWeight: 500,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {statusMessage}
          </div>
        )}
      </div>

      {/* Buttons - Only show if showButtons prop is true */}
      {showButtons && (
        <div style={{ display: 'flex', gap: `${8 * scale}px` }}>
          {/* Reset Button */}
          <button
            onClick={handleReset}
            style={{
              flex: 1,
              padding: `${8 * scale}px ${12 * scale}px`,
              fontSize: `${12 * scale}px`,
              fontWeight: 500,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              color: textColor,
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              borderRadius: `${6 * scale}px`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: `${6 * scale}px`,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
            }}
          >
            <RotateCcw size={14 * scale} />
            <span>Reset</span>
          </button>

          {/* Generate Button */}
          {onGenerate && (
            <button
              onClick={handleGenerateClick}
              style={{
                flex: 1,
                padding: `${8 * scale}px ${12 * scale}px`,
                fontSize: `${12 * scale}px`,
                fontWeight: 500,
                backgroundColor: SELECTION_COLOR,
                color: '#ffffff',
                border: 'none',
                borderRadius: `${6 * scale}px`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: `${6 * scale}px`,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3d6edb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = SELECTION_COLOR;
              }}
            >
              <Rocket size={14 * scale} />
              <span>Generate</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
