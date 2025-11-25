'use client';

import React from 'react';
import { StoryboardPluginModal } from '@/app/components/Plugins/StoryboardPluginModal/StoryboardPluginModal';
import Konva from 'konva';

interface StoryboardModalState {
  id: string;
  x: number;
  y: number;
  frameWidth?: number;
  frameHeight?: number;
  scriptText?: string | null;
}

interface StoryboardModalOverlaysProps {
  storyboardModalStates: StoryboardModalState[] | undefined;
  selectedStoryboardModalId: string | null | undefined;
  selectedStoryboardModalIds: string[] | undefined;
  clearAllSelections: () => void;
  setStoryboardModalStates: React.Dispatch<React.SetStateAction<StoryboardModalState[]>>;
  setSelectedStoryboardModalId: (id: string | null) => void;
  setSelectedStoryboardModalIds: (ids: string[]) => void;
  onPersistStoryboardModalCreate?: (modal: { id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }) => void | Promise<void>;
  onPersistStoryboardModalMove?: (id: string, updates: Partial<{ x: number; y: number; frameWidth?: number; frameHeight?: number }>) => void | Promise<void>;
  onPersistStoryboardModalDelete?: (id: string) => void | Promise<void>;
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }>;
  textInputStates?: Array<{ id: string; x: number; y: number; value?: string; autoFocusInput?: boolean }>;
}

export const StoryboardModalOverlays: React.FC<StoryboardModalOverlaysProps> = ({
  storyboardModalStates,
  selectedStoryboardModalId,
  selectedStoryboardModalIds,
  clearAllSelections,
  setStoryboardModalStates,
  setSelectedStoryboardModalId,
  setSelectedStoryboardModalIds,
  onPersistStoryboardModalCreate,
  onPersistStoryboardModalMove,
  onPersistStoryboardModalDelete,
  stageRef,
  scale,
  position,
  connections = [],
  textInputStates = [],
}) => {
  return (
    <>
      {(storyboardModalStates || []).map((modalState) => (
        <StoryboardPluginModal
          key={modalState.id}
          isOpen={true}
          id={modalState.id}
          onClose={() => {
            setStoryboardModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedStoryboardModalId(null);
            if (onPersistStoryboardModalDelete) {
              Promise.resolve(onPersistStoryboardModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onSelect={() => {
            clearAllSelections();
            setSelectedStoryboardModalId(modalState.id);
            setSelectedStoryboardModalIds([modalState.id]);
          }}
          onDelete={() => {
            setSelectedStoryboardModalId(null);
            if (onPersistStoryboardModalDelete) {
              const result = onPersistStoryboardModalDelete(modalState.id);
              if (result && typeof result.then === 'function') {
                Promise.resolve(result).catch(console.error);
              }
            }
          }}
          onDownload={() => {
            // Placeholder for download functionality
            console.log('[StoryboardModalOverlays] Download not implemented');
          }}
          onDuplicate={() => {
            // Placeholder for duplicate functionality
            console.log('[StoryboardModalOverlays] Duplicate not implemented');
          }}
          isSelected={selectedStoryboardModalId === modalState.id || (selectedStoryboardModalIds || []).includes(modalState.id)}
          frameWidth={modalState.frameWidth}
          frameHeight={modalState.frameHeight}
          scriptText={modalState.scriptText}
          onOptionsChange={(opts) => {
            if (onPersistStoryboardModalMove) {
              const result = onPersistStoryboardModalMove(modalState.id, opts);
              if (result && typeof result.then === 'function') {
                Promise.resolve(result).catch(console.error);
              }
            }
          }}
          onPositionChange={(newX, newY) => {
            // Update local state immediately for smooth dragging
            setStoryboardModalStates(prev =>
              prev.map(m =>
                m.id === modalState.id ? { ...m, x: newX, y: newY } : m
              )
            );
          }}
          onPositionCommit={(newX, newY) => {
            // Persist position change
            if (onPersistStoryboardModalMove) {
              const result = onPersistStoryboardModalMove(modalState.id, { x: newX, y: newY });
              if (result && typeof result.then === 'function') {
                Promise.resolve(result).catch(console.error);
              }
            }
          }}
          stageRef={stageRef}
          scale={scale}
          position={position}
          x={modalState.x}
          y={modalState.y}
          connections={connections}
          textInputStates={textInputStates}
        />
      ))}
    </>
  );
};

