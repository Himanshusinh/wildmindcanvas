'use client';

import React from 'react';
// import * as THREE from 'three'; // Unused
import { Model3DRefs } from './types';

interface Model3DZoomControlsProps {
  refs: Model3DRefs;
  onUpdate?: (updates: { zoom: number }) => void;
}

export const Model3DZoomControls: React.FC<Model3DZoomControlsProps> = ({ refs, onUpdate }) => {
  const handleZoomIn = () => {
    if (!refs.cameraRef.current || !onUpdate) return;

    const zoomSpeed = 0.2;
    refs.sphericalRef.current.radius *= (1 - zoomSpeed);
    refs.sphericalRef.current.radius = Math.max(1, Math.min(20, refs.sphericalRef.current.radius));

    const x = refs.targetRef.current.x + refs.sphericalRef.current.radius * Math.sin(refs.sphericalRef.current.phi) * Math.cos(refs.sphericalRef.current.theta);
    const y = refs.targetRef.current.y + refs.sphericalRef.current.radius * Math.cos(refs.sphericalRef.current.phi);
    const z = refs.targetRef.current.z + refs.sphericalRef.current.radius * Math.sin(refs.sphericalRef.current.phi) * Math.sin(refs.sphericalRef.current.theta);

    refs.cameraRef.current.position.set(x, y, z);
    refs.cameraRef.current.lookAt(refs.targetRef.current);

    refs.currentZoomRef.current = 5 / refs.sphericalRef.current.radius;

    onUpdate({
      zoom: refs.currentZoomRef.current,
    });
  };

  const handleZoomOut = () => {
    if (!refs.cameraRef.current || !onUpdate) return;

    const zoomSpeed = 0.2;
    refs.sphericalRef.current.radius *= (1 + zoomSpeed);
    refs.sphericalRef.current.radius = Math.max(1, Math.min(20, refs.sphericalRef.current.radius));

    const x = refs.targetRef.current.x + refs.sphericalRef.current.radius * Math.sin(refs.sphericalRef.current.phi) * Math.cos(refs.sphericalRef.current.theta);
    const y = refs.targetRef.current.y + refs.sphericalRef.current.radius * Math.cos(refs.sphericalRef.current.phi);
    const z = refs.targetRef.current.z + refs.sphericalRef.current.radius * Math.sin(refs.sphericalRef.current.phi) * Math.sin(refs.sphericalRef.current.theta);

    refs.cameraRef.current.position.set(x, y, z);
    refs.cameraRef.current.lookAt(refs.targetRef.current);

    refs.currentZoomRef.current = 5 / refs.sphericalRef.current.radius;

    onUpdate({
      zoom: refs.currentZoomRef.current,
    });
  };

  return (
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
  );
};

