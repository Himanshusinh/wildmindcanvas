import { useEffect } from 'react';
import * as THREE from 'three';
import { Model3DRefs, SphericalCoords } from './types';

interface UseModel3DControlsProps {
  refs: Model3DRefs;
  onUpdate?: (updates: { rotationX?: number; rotationY?: number; zoom?: number }) => void;
  setIsDragging: (dragging: boolean) => void;
}

export function useModel3DControls({
  refs,
  onUpdate,
  setIsDragging,
}: UseModel3DControlsProps) {
  useEffect(() => {
    if (!refs.containerRef.current || !refs.cameraRef.current) return;

    const container = refs.containerRef.current;
    const camera = refs.cameraRef.current;

    const handleMouseDown = (e: MouseEvent) => {
      // Left click for rotation
      if (e.button === 0) {
        refs.isDraggingRef.current = true;
        setIsDragging(true);
        refs.lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
      }
      // Right click or middle mouse for panning
      else if (e.button === 2 || e.button === 1) {
        refs.isPanningRef.current = true;
        refs.panStartRef.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (refs.isDraggingRef.current && onUpdate) {
        // Rotation (orbit around model)
        const deltaX = e.clientX - refs.lastMousePosRef.current.x;
        const deltaY = e.clientY - refs.lastMousePosRef.current.y;

        // Update spherical coordinates
        refs.sphericalRef.current.theta -= deltaX * 0.01;
        refs.sphericalRef.current.phi += deltaY * 0.01;

        // Limit vertical rotation (phi) to prevent flipping
        refs.sphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, refs.sphericalRef.current.phi));

        // Update camera position using spherical coordinates
        const x = refs.targetRef.current.x + refs.sphericalRef.current.radius * Math.sin(refs.sphericalRef.current.phi) * Math.cos(refs.sphericalRef.current.theta);
        const y = refs.targetRef.current.y + refs.sphericalRef.current.radius * Math.cos(refs.sphericalRef.current.phi);
        const z = refs.targetRef.current.z + refs.sphericalRef.current.radius * Math.sin(refs.sphericalRef.current.phi) * Math.sin(refs.sphericalRef.current.theta);

        camera.position.set(x, y, z);
        camera.lookAt(refs.targetRef.current);

        // Update rotation refs for state persistence
        refs.currentRotationRef.current.y = refs.sphericalRef.current.theta;
        refs.currentRotationRef.current.x = refs.sphericalRef.current.phi - Math.PI / 2;

        onUpdate({
          rotationX: refs.currentRotationRef.current.x,
          rotationY: refs.currentRotationRef.current.y,
        });

        refs.lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      } else if (refs.isPanningRef.current) {
        // Panning (move target point)
        const deltaX = (e.clientX - refs.panStartRef.current.x) * 0.01;
        const deltaY = (e.clientY - refs.panStartRef.current.y) * 0.01;

        // Calculate pan direction in camera space
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        camera.getWorldDirection(new THREE.Vector3());
        right.setFromMatrixColumn(camera.matrixWorld, 0);
        up.setFromMatrixColumn(camera.matrixWorld, 1);

        refs.targetRef.current.add(right.multiplyScalar(-deltaX));
        refs.targetRef.current.add(up.multiplyScalar(deltaY));

        // Update camera to look at new target
        const x = refs.targetRef.current.x + refs.sphericalRef.current.radius * Math.sin(refs.sphericalRef.current.phi) * Math.cos(refs.sphericalRef.current.theta);
        const y = refs.targetRef.current.y + refs.sphericalRef.current.radius * Math.cos(refs.sphericalRef.current.phi);
        const z = refs.targetRef.current.z + refs.sphericalRef.current.radius * Math.sin(refs.sphericalRef.current.phi) * Math.sin(refs.sphericalRef.current.theta);

        camera.position.set(x, y, z);
        camera.lookAt(refs.targetRef.current);

        refs.panStartRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        refs.isDraggingRef.current = false;
        setIsDragging(false);
      } else if (e.button === 2 || e.button === 1) {
        refs.isPanningRef.current = false;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!camera || !onUpdate) return;

      // Smooth zoom with better control
      const zoomSpeed = 0.1;
      const zoomDelta = e.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
      
      // Update radius (distance from target)
      refs.sphericalRef.current.radius *= zoomDelta;
      
      // Clamp zoom limits
      const minRadius = 1;
      const maxRadius = 20;
      refs.sphericalRef.current.radius = Math.max(minRadius, Math.min(maxRadius, refs.sphericalRef.current.radius));

      // Update camera position
      const x = refs.targetRef.current.x + refs.sphericalRef.current.radius * Math.sin(refs.sphericalRef.current.phi) * Math.cos(refs.sphericalRef.current.theta);
      const y = refs.targetRef.current.y + refs.sphericalRef.current.radius * Math.cos(refs.sphericalRef.current.phi);
      const z = refs.targetRef.current.z + refs.sphericalRef.current.radius * Math.sin(refs.sphericalRef.current.phi) * Math.sin(refs.sphericalRef.current.theta);

      camera.position.set(x, y, z);
      camera.lookAt(refs.targetRef.current);

      // Update zoom ref for state persistence
      refs.currentZoomRef.current = 5 / refs.sphericalRef.current.radius;

      onUpdate({
        zoom: refs.currentZoomRef.current,
      });
    };

    // Touch support for mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch for rotation
        refs.isDraggingRef.current = true;
        setIsDragging(true);
        refs.lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        refs.touchStartSphericalRef.current = { ...refs.sphericalRef.current };
        refs.isPanningRef.current = false; // Cancel panning if active
      } else if (e.touches.length === 2) {
        // Two touches for zoom
        refs.isDraggingRef.current = false;
        setIsDragging(false);
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        refs.touchStartDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
        refs.touchStartSphericalRef.current = { ...refs.sphericalRef.current };
      }
      e.preventDefault();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && refs.isDraggingRef.current) {
        // Rotation
        const deltaX = e.touches[0].clientX - refs.lastMousePosRef.current.x;
        const deltaY = e.touches[0].clientY - refs.lastMousePosRef.current.y;

        refs.sphericalRef.current.theta = refs.touchStartSphericalRef.current.theta - deltaX * 0.01;
        refs.sphericalRef.current.phi = refs.touchStartSphericalRef.current.phi + deltaY * 0.01;
        refs.sphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, refs.sphericalRef.current.phi));

        const x = refs.targetRef.current.x + refs.sphericalRef.current.radius * Math.sin(refs.sphericalRef.current.phi) * Math.cos(refs.sphericalRef.current.theta);
        const y = refs.targetRef.current.y + refs.sphericalRef.current.radius * Math.cos(refs.sphericalRef.current.phi);
        const z = refs.targetRef.current.z + refs.sphericalRef.current.radius * Math.sin(refs.sphericalRef.current.phi) * Math.sin(refs.sphericalRef.current.theta);

        camera.position.set(x, y, z);
        camera.lookAt(refs.targetRef.current);

        refs.currentRotationRef.current.y = refs.sphericalRef.current.theta;
        refs.currentRotationRef.current.x = refs.sphericalRef.current.phi - Math.PI / 2;

        if (onUpdate) {
          onUpdate({
            rotationX: refs.currentRotationRef.current.x,
            rotationY: refs.currentRotationRef.current.y,
          });
        }

        refs.lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        // Zoom (pinch)
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (refs.touchStartDistanceRef.current > 0) {
          const scale = refs.touchStartDistanceRef.current / distance;

          refs.sphericalRef.current.radius = refs.touchStartSphericalRef.current.radius * scale;
          refs.sphericalRef.current.radius = Math.max(1, Math.min(20, refs.sphericalRef.current.radius));

          const x = refs.targetRef.current.x + refs.sphericalRef.current.radius * Math.sin(refs.sphericalRef.current.phi) * Math.cos(refs.sphericalRef.current.theta);
          const y = refs.targetRef.current.y + refs.sphericalRef.current.radius * Math.cos(refs.sphericalRef.current.phi);
          const z = refs.targetRef.current.z + refs.sphericalRef.current.radius * Math.sin(refs.sphericalRef.current.phi) * Math.sin(refs.sphericalRef.current.theta);

          camera.position.set(x, y, z);
          camera.lookAt(refs.targetRef.current);

          refs.currentZoomRef.current = 5 / refs.sphericalRef.current.radius;

          if (onUpdate) {
            onUpdate({
              zoom: refs.currentZoomRef.current,
            });
          }
        }
      }
      e.preventDefault();
    };

    const handleTouchEnd = () => {
      refs.isDraggingRef.current = false;
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
  }, [refs, onUpdate, setIsDragging]);
}

